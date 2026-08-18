/* Mobil "yakalama arkadaşı" — eşleşme, şifreli senkron zarfı ve telefon gelen kutusu.

   Güvenlik modeli (local-first vaadiyle uyumlu, veri buluta gitmez):
   - Eşleşme sırrı yalnızca masaüstünde üretilir ve telefona YALNIZCA QR kod ile geçer
     (ağdan asla gönderilmez). data/mobil-eslesme.json içinde saklanır.
   - Telefon ↔ masaüstü tüm senkron gövdeleri AES-256-CTR ile şifrelenir ve
     HMAC-SHA256 ile mühürlenir (encrypt-then-MAC). Wi-Fi'yi dinleyen biri
     içeriği okuyamaz ve değiştiremez.
   - Neden AES-GCM değil: telefonda sayfa http://<yerel-ip> üzerinden açıldığı için
     tarayıcı crypto.subtle vermez; saf JS (aes-js + js-sha256) ile CTR+HMAC
     kompozisyonu kullanılır. Node tarafı yerleşik crypto ile aynı zarfı üretir. */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PAIR_FILE = 'mobil-eslesme.json';
const INBOX_FILE = 'telefon-gelen.json';
const INBOX_ARCHIVE_FILE = 'telefon-gelen-arsiv.json';

/* ---------------- Eşleşme kaydı ---------------- */

function pairPath(dataDir) { return path.join(dataDir, PAIR_FILE); }

function loadPairing(dataDir) {
  const file = pairPath(dataDir);
  if (fs.existsSync(file)) {
    try {
      const p = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (p && p.secret) return p;
    } catch (e) {
      console.error('mobil-eslesme.json okunamadı, yenileniyor:', e.message);
    }
  }
  return regeneratePairing(dataDir);
}

// Yeni sır üret (eski telefonların bağlantısı kopar — yeniden QR okutmaları gerekir)
function regeneratePairing(dataDir) {
  const p = {
    secret: crypto.randomBytes(32).toString('base64url'),
    createdAt: new Date().toISOString(),
    devices: {}
  };
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(pairPath(dataDir), JSON.stringify(p, null, 2), 'utf8');
  return p;
}

function savePairing(dataDir, p) {
  fs.writeFileSync(pairPath(dataDir), JSON.stringify(p, null, 2), 'utf8');
}

/* ---------------- Şifreli zarf (telefon tarafındaki kripto.js ile birebir aynı) ---------------- */

function keysFrom(secretB64url) {
  const secret = Buffer.from(secretB64url, 'base64url');
  const enc = crypto.createHmac('sha256', secret).update('inkguide-enc').digest();
  const mac = crypto.createHmac('sha256', secret).update('inkguide-mac').digest();
  return { enc, mac };
}

function seal(pairing, obj) {
  const { enc, mac } = keysFrom(pairing.secret);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', enc, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = crypto.createHmac('sha256', mac).update(Buffer.concat([iv, ct])).digest();
  return { v: 1, iv: iv.toString('base64'), ct: ct.toString('base64'), mac: tag.toString('base64') };
}

// Doğrulanamayan/bozuk zarf → null (istek reddedilir)
function open(pairing, env) {
  try {
    if (!env || env.v !== 1) return null;
    const { enc, mac } = keysFrom(pairing.secret);
    const iv = Buffer.from(env.iv, 'base64');
    const ct = Buffer.from(env.ct, 'base64');
    const given = Buffer.from(env.mac, 'base64');
    const expect = crypto.createHmac('sha256', mac).update(Buffer.concat([iv, ct])).digest();
    if (given.length !== expect.length || !crypto.timingSafeEqual(given, expect)) return null;
    const decipher = crypto.createDecipheriv('aes-256-ctr', enc, iv);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    return JSON.parse(pt);
  } catch {
    return null;
  }
}

/* ---------------- Yerel ağ adresleri ---------------- */

// Ev ağlarında en olası adres önce gelsin diye 192.168.* > 10.* > 172.* sıralanır
function lanAddresses() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const a of ifs[name] || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  const rank = (ip) => ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2;
  return out.sort((a, b) => rank(a) - rank(b));
}

/* ---------------- Telefon gelen kutusu ----------------
   Telefondan gelen yakalamalar DOĞRUDAN kitaba yazılmaz: önce buraya düşer,
   masaüstü arayüzü kitabın güncel haliyle birleştirip kaydettikten sonra onaylar (ack).
   Böylece masaüstünün "tüm kitabı kaydet" modeli telefon notlarını asla ezemez. */

function inboxPath(dataDir) { return path.join(dataDir, INBOX_FILE); }

function readInbox(dataDir) {
  try {
    const j = JSON.parse(fs.readFileSync(inboxPath(dataDir), 'utf8'));
    if (j && typeof j.books === 'object') return j;
  } catch { /* yoksa/bozuksa boş başla */ }
  return { books: {} };
}

function writeInbox(dataDir, inbox) {
  fs.writeFileSync(inboxPath(dataDir), JSON.stringify(inbox, null, 2), 'utf8');
}

// Yakalamaları gelen kutusuna ekle; aynı id ikinci kez gelirse yok say (telefon
// cevabı alamayıp yeniden gönderebilir — tekrar güvenlidir). Eklenen+zaten olan id'ler döner.
function inboxAdd(dataDir, bookId, items, deviceName) {
  const inbox = readInbox(dataDir);
  if (!inbox.books[bookId]) inbox.books[bookId] = { items: [] };
  const list = inbox.books[bookId].items;
  const known = new Set(list.map(i => i.id));
  const acked = [];
  for (const it of items) {
    if (!it || !it.id || typeof it.text !== 'string' || !it.text.trim()) continue;
    acked.push(it.id);
    if (known.has(it.id)) continue;
    list.push({
      id: String(it.id),
      kind: it.kind === 'karalama' ? 'karalama' : 'not',
      type: ['not', 'sentez', 'alinti', 'fikir', 'gorsel'].includes(it.type) ? it.type : 'not',
      title: String(it.title || '').slice(0, 200),
      text: String(it.text).slice(0, 100000),
      createdAt: it.createdAt || new Date().toISOString(),
      deviceName: String(deviceName || 'Telefon').slice(0, 60),
      receivedAt: new Date().toISOString()
    });
  }
  writeInbox(dataDir, inbox);
  return acked;
}

function inboxList(dataDir, bookId) {
  const inbox = readInbox(dataDir);
  return (inbox.books[bookId] && inbox.books[bookId].items) || [];
}

// Masaüstü kitaba işledikten sonra çağırır; ek güvenlik ağı olarak silinenler arşive eklenir
function inboxAck(dataDir, bookId, ids) {
  const inbox = readInbox(dataDir);
  const entry = inbox.books[bookId];
  if (!entry) return 0;
  const idSet = new Set(ids);
  const acked = entry.items.filter(i => idSet.has(i.id));
  entry.items = entry.items.filter(i => !idSet.has(i.id));
  writeInbox(dataDir, inbox);
  if (acked.length) {
    try {
      const aFile = path.join(dataDir, INBOX_ARCHIVE_FILE);
      let arc = [];
      try { arc = JSON.parse(fs.readFileSync(aFile, 'utf8')); } catch { /* ilk kayıt */ }
      arc = arc.concat(acked.map(i => ({ ...i, bookId, ackedAt: new Date().toISOString() }))).slice(-500);
      fs.writeFileSync(aFile, JSON.stringify(arc, null, 2), 'utf8');
    } catch (e) {
      console.error('Gelen kutusu arşivi yazılamadı:', e.message);
    }
  }
  return acked.length;
}

module.exports = {
  loadPairing, regeneratePairing, savePairing,
  seal, open, lanAddresses,
  inboxAdd, inboxList, inboxAck, readInbox
};
