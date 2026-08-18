const express = require('express');
const fs = require('fs');
const path = require('path');
const { exportBook, buildMarkdown, buildDocx, buildNotesAppendix } = require('./lib/export');
const mobil = require('./lib/mobil');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 4321;

/* Paketlenmiş (.exe) çalışmada __dirname salt-okunur sanal dosya sistemidir (pkg snapshot).
   Yazılabilir her şey (veri, export, versiyon, yedek) exe'nin YANINDAKİ klasöre gider;
   statik varlıklar (public/, şablon, marked) snapshot'tan okunur. */
const IS_PKG = typeof process.pkg !== 'undefined';
const WRITE_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;
const ASSET_DIR = __dirname;

const DATA_DIR = path.join(WRITE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'book.json');          // varsayılan (ilk) kitap — YERİNDEN OYNATILMAZ
const SAMPLE_FILE = path.join(ASSET_DIR, 'data', 'book.sample.json');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');    // kitaplık kaydı
const BOOKS_DIR = path.join(DATA_DIR, 'books');              // yeni kitaplar buraya
const ARCHIVE_DIR = path.join(BOOKS_DIR, '_arsiv');          // "silinen" kitaplar asla silinmez, buraya taşınır
const EXPORT_DIR = path.join(WRITE_DIR, 'exports');
const VERSIONS_DIR = path.join(WRITE_DIR, 'versions');
const YEDEK_DIR = path.join(WRITE_DIR, 'yedek');

/* ---------------- Kitaplık (çoklu kitap) ----------------
   Migrasyon güvenliği: mevcut data/book.json olduğu yerde kalır,
   library.json içinde "default" kimliğiyle kayıt edilir. */

function readLibrary() {
  let lib = null;
  if (fs.existsSync(LIBRARY_FILE)) {
    try {
      lib = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
    } catch (e) {
      console.error('library.json okunamadı, yeniden oluşturuluyor:', e.message);
    }
  }
  if (!lib || !Array.isArray(lib.books)) {
    lib = { books: [{ id: 'default', file: 'book.json', createdAt: new Date().toISOString() }] };
    writeLibrary(lib);
  }
  // Güvenlik ağı: default kaydı bir şekilde kaybolmuşsa ve book.json diskte duruyorsa geri ekle
  if (!lib.books.some(b => b.id === 'default') && fs.existsSync(DATA_FILE)) {
    lib.books.unshift({ id: 'default', file: 'book.json', createdAt: new Date().toISOString() });
    writeLibrary(lib);
  }
  return lib;
}

function writeLibrary(lib) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(lib, null, 2), 'utf8');
}

function dataFileFor(entry) {
  return path.join(DATA_DIR, entry.file);
}

// bookId query parametresini kitaplık kaydına çözer; verilmezse "default" (geriye uyumlu)
function resolveEntry(req) {
  const id = String(req.query.bookId || 'default');
  const lib = readLibrary();
  const entry = lib.books.find(b => b.id === id);
  if (!entry) {
    const err = new Error('Kitap bulunamadı: ' + id);
    err.status = 404;
    throw err;
  }
  return entry;
}

// Varsayılan kitap için mevcut klasörler aynen; diğer kitaplar için alt klasör
function subdirFor(base, bookId) {
  return bookId === 'default' ? base : path.join(base, bookId);
}

// Kitap id'si: başlıktan güvenli slug (dosya adı olarak da kullanılır)
function slugify(title) {
  const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  let s = String(title || '').toLowerCase().replace(/[çğıöşüâîû]/g, ch => map[ch] || ch);
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '');
  return s || 'kitap';
}

function wcText(t) {
  return t ? String(t).trim().split(/\s+/).filter(Boolean).length : 0;
}

function countBookWords(book) {
  let n = 0;
  for (const p of book.parts || []) for (const c of p.chapters || []) n += wcText(c.draft);
  const f = book.frontmatter || {};
  for (const k of ['onsoz', 'tesekkur', 'giris']) n += wcText(f[k]);
  return n;
}

/* Her kayıtta insan-okunur güvenlik yedeği: uygulama bozulsa bile
   yedek/kitap-son-hali.md ve .docx Word'de açılıp devam edilebilir. */
const lastDocxBackup = {}; // kitap başına docx yedek zamanı

async function writeBackups(book, bookId, forceDocx = false) {
  try {
    const dir = subdirFor(YEDEK_DIR, bookId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const md = buildMarkdown(book) + buildNotesAppendix(book);
    fs.writeFileSync(path.join(dir, 'kitap-son-hali.md'), md, 'utf8');
    const now = Date.now();
    if (forceDocx || now - (lastDocxBackup[bookId] || 0) > 2 * 60 * 1000) {
      lastDocxBackup[bookId] = now;
      const buf = await buildDocx(book);
      fs.writeFileSync(path.join(dir, 'kitap-son-hali.docx'), buf);
    }
  } catch (e) {
    console.error('Yedek yazılamadı:', e.message);
  }
}

app.use(express.json({ limit: '20mb' }));

/* Ağ güvenliği: kitap verisine dokunan tüm API'ler YALNIZCA bu bilgisayardan
   (localhost) erişilebilir. Yerel ağdaki telefon yalnızca /mobil sayfasını ve
   şifreli /api/mobile/sync ucunu görür — Wi-Fi'deki başka bir cihaz kitabı okuyamaz.
   Kural sonradan eklenecek /api uçlarını da otomatik kapsar (/api/exports, /api/library…). */
function isLocalReq(req) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
app.use('/api', (req, res, next) => {
  if (req.path === '/mobile/sync' || isLocalReq(req)) return next();
  res.status(403).json({ error: 'Bu uç yalnızca inkGuide çalıştıran bilgisayardan erişilebilir' });
});
// Dışa aktarılan kitap dosyaları da kitap verisidir — yalnızca localhost indirir
app.use('/exports', (req, res, next) => {
  if (isLocalReq(req)) return next();
  res.status(403).json({ error: 'Bu uç yalnızca inkGuide çalıştıran bilgisayardan erişilebilir' });
});

app.use(express.static(path.join(ASSET_DIR, 'public')));
app.use('/vendor/marked.min.js', (req, res) =>
  res.sendFile(path.join(ASSET_DIR, 'node_modules', 'marked', 'marked.min.js'))
);
// Telefon tarafı şifreleme: LAN http sayfalarında crypto.subtle olmadığı için saf JS
app.use('/vendor/aes.js', (req, res) =>
  res.sendFile(path.join(ASSET_DIR, 'node_modules', 'aes-js', 'index.js'))
);
app.use('/vendor/sha256.min.js', (req, res) =>
  res.sendFile(path.join(ASSET_DIR, 'node_modules', 'js-sha256', 'build', 'sha256.min.js'))
);
app.use('/exports', express.static(EXPORT_DIR));

// İlk kurulumda kişisel veri dosyası yoksa şablondan oluştur
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(SAMPLE_FILE, DATA_FILE);
}
// Kitaplık kaydını açılışta hazırla (yoksa book.json "default" olarak kaydedilir)
readLibrary();

function readBook(entry) {
  return JSON.parse(fs.readFileSync(dataFileFor(entry), 'utf8'));
}

function localStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`;
}

function sendErr(res, e) {
  res.status(e.status || 500).json({ error: e.message });
}

/* ---- Kitaplık API ---- */

// Kitap listesi + her kitabın meta/istatistik özeti
app.get('/api/library', (req, res) => {
  try {
    const lib = readLibrary();
    const books = lib.books.map(entry => {
      let meta = {}, totalWords = 0, chapters = 0, done = 0, updatedAt = entry.createdAt || null;
      try {
        const file = dataFileFor(entry);
        const book = JSON.parse(fs.readFileSync(file, 'utf8'));
        meta = book.meta || {};
        totalWords = countBookWords(book);
        for (const p of book.parts || []) {
          chapters += (p.chapters || []).length;
          done += (p.chapters || []).filter(c => c.status === 'bitti').length;
        }
        updatedAt = fs.statSync(file).mtime.toISOString();
      } catch (e) {
        meta = { title: entry.id + ' (okunamadı)' };
      }
      return {
        id: entry.id,
        color: entry.color || null,
        createdAt: entry.createdAt || null,
        title: meta.title || 'Adsız kitap',
        subtitle: meta.subtitle || '',
        targetWords: meta.targetWords || 60000,
        totalWords, chapters, done, updatedAt
      };
    });
    res.json({ books });
  } catch (e) {
    sendErr(res, e);
  }
});

// Yeni kitap: şablondan oluşturulur, data/books/<id>.json'a yazılır
app.post('/api/library', (req, res) => {
  try {
    // partTitle / chapterTitle isteğe bağlı: yeni kitabın iskeleti arayüz dilinde
    // açılsın diye istemci gönderir; gönderilmezse şablondaki adlar aynen kalır.
    const { title, subtitle, targetWords, color, partTitle, chapterTitle } = req.body || {};
    if (!title || !String(title).trim()) throw new Error('Kitap adı gerekli');
    const lib = readLibrary();
    const base = slugify(title);
    let id = base, i = 2;
    while (id === 'default' || lib.books.some(b => b.id === id)) id = `${base}-${i++}`;
    if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });
    const book = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8'));
    book.meta.title = String(title).trim();
    book.meta.subtitle = String(subtitle || '').trim();
    const tw = parseInt(targetWords, 10);
    if (tw > 0) book.meta.targetWords = tw;
    if (partTitle && String(partTitle).trim() && book.parts && book.parts[0]) {
      book.parts[0].title = String(partTitle).trim();
    }
    if (chapterTitle && String(chapterTitle).trim() && book.parts && book.parts[0] && book.parts[0].chapters && book.parts[0].chapters[0]) {
      book.parts[0].chapters[0].title = String(chapterTitle).trim();
    }
    const file = 'books/' + id + '.json';
    const abs = path.join(DATA_DIR, file);
    if (fs.existsSync(abs)) throw new Error('Bu isimde bir kitap dosyası zaten var');
    fs.writeFileSync(abs, JSON.stringify(book, null, 2), 'utf8');
    lib.books.push({ id, file, color: color || null, createdAt: new Date().toISOString() });
    writeLibrary(lib);
    res.json({ ok: true, id });
  } catch (e) {
    sendErr(res, e);
  }
});

// Kitabı arşivle: kaydı listeden çıkar, dosyayı data/books/_arsiv/ altına taşı (asla gerçekten silme)
app.delete('/api/library/:id', (req, res) => {
  try {
    const id = req.params.id;
    const lib = readLibrary();
    const entry = lib.books.find(b => b.id === id);
    if (!entry) { const err = new Error('Kitap bulunamadı'); err.status = 404; throw err; }
    if (id === 'default') throw new Error('Ana kitap (ilk kitabınız) güvenlik nedeniyle arşivlenemez');
    if (lib.books.length <= 1) throw new Error('Kitaplıktaki son kitap arşivlenemez');
    if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    const src = dataFileFor(entry);
    if (fs.existsSync(src)) {
      fs.renameSync(src, path.join(ARCHIVE_DIR, `${id}-${localStamp()}.json`));
    }
    lib.books = lib.books.filter(b => b.id !== id);
    writeLibrary(lib);
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, e);
  }
});

/* ---- Kitap API (?bookId= verilmezse "default" — geriye uyumlu) ---- */

app.get('/api/book', (req, res) => {
  try {
    res.json(readBook(resolveEntry(req)));
  } catch (e) {
    sendErr(res, e);
  }
});

app.put('/api/book', (req, res) => {
  try {
    const entry = resolveEntry(req);
    // Veri güvenliği: kitap gibi görünmeyen gövdeyle dosyanın üzerine yazılmasın
    const b = req.body;
    if (!b || typeof b !== 'object' || !b.meta || !Array.isArray(b.parts)) {
      throw new Error('Geçersiz kitap verisi — kayıt reddedildi');
    }
    const file = dataFileFor(entry);
    // Yedek: her kayıtta son halin bir kopyasını tut
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, file + '.bak');
    }
    fs.writeFileSync(file, JSON.stringify(req.body, null, 2), 'utf8');
    writeBackups(req.body, entry.id); // arka planda; kaydı bekletmez
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    sendErr(res, e);
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const entry = resolveEntry(req);
    const dir = subdirFor(EXPORT_DIR, entry.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const book = readBook(entry);
    const files = await exportBook(book, dir);
    // Diğer kitapların çıktıları exports/<bookId>/ altında sunulur
    const rel = entry.id === 'default' ? files : files.map(f => entry.id + '/' + f);
    res.json({ ok: true, files: rel });
  } catch (e) {
    console.error(e);
    sendErr(res, e);
  }
});

/* Dışa aktarma geçmişi: kitabın exports klasöründeki dosyaları listeler (salt-okur).
   Her dosya: ad, boyut, tarih ve /exports altındaki indirme yolu. */
app.get('/api/exports', (req, res) => {
  try {
    const entry = resolveEntry(req);
    const dir = subdirFor(EXPORT_DIR, entry.id);
    let files = [];
    if (fs.existsSync(dir)) {
      files = fs.readdirSync(dir)
        .filter(f => /\.(md|html|docx)$/i.test(f))
        .map(f => {
          const st = fs.statSync(path.join(dir, f));
          if (!st.isFile()) return null;
          return {
            name: f,
            size: st.size,
            mtime: st.mtime.toISOString(),
            path: (entry.id === 'default' ? '' : entry.id + '/') + f
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.mtime.localeCompare(a.mtime));
    }
    res.json({ files });
  } catch (e) {
    sendErr(res, e);
  }
});

/* ---- Versiyonlama: kitabın anlık görüntüleri ---- */

function listVersions(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /^kitap-v[\d-]+(-oncesi)?\.json$/.test(f))
    .sort()
    .reverse();
}

app.get('/api/versions', (req, res) => {
  try {
    const entry = resolveEntry(req);
    res.json({ versions: listVersions(subdirFor(VERSIONS_DIR, entry.id)) });
  } catch (e) {
    sendErr(res, e);
  }
});

app.post('/api/version', (req, res) => {
  try {
    const entry = resolveEntry(req);
    const dir = subdirFor(VERSIONS_DIR, entry.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const stamp = localStamp();
    const file = `kitap-v${stamp}.json`;
    fs.copyFileSync(dataFileFor(entry), path.join(dir, file));
    writeBackups(readBook(entry), entry.id, true); // versiyon alırken docx yedeğini de tazele
    res.json({ ok: true, file, versions: listVersions(dir) });
  } catch (e) {
    sendErr(res, e);
  }
});

app.post('/api/version/restore', (req, res) => {
  try {
    const entry = resolveEntry(req);
    const dir = subdirFor(VERSIONS_DIR, entry.id);
    const file = req.body.file || '';
    if (!/^kitap-v[\d-]+(-oncesi)?\.json$/.test(file)) throw new Error('Geçersiz versiyon adı');
    const src = path.join(dir, file);
    if (!fs.existsSync(src)) throw new Error('Versiyon bulunamadı');
    // Geri yüklemeden önce mevcut hali de otomatik versiyonla
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const stamp = localStamp();
    const dataFile = dataFileFor(entry);
    fs.copyFileSync(dataFile, path.join(dir, `kitap-v${stamp}-oncesi.json`));
    fs.copyFileSync(src, dataFile);
    res.json({ ok: true, book: readBook(entry) });
  } catch (e) {
    sendErr(res, e);
  }
});

/* ---- Mobil "yakalama arkadaşı": eşleşme + şifreli senkron + gelen kutusu ---- */

let activePort = Number(PORT); // startServer gerçekte bağlanınca günceller

// Eşleşme bilgisi + QR (yalnızca localhost — sır QR içinde, ağdan asla verilmez)
app.get('/api/mobile/pair-info', async (req, res) => {
  try {
    const pairing = mobil.loadPairing(DATA_DIR);
    const ips = mobil.lanAddresses();
    const ip = ips.includes(req.query.ip) ? req.query.ip : ips[0] || null;
    if (!ip) return res.json({ ips: [], url: null, qrSvg: null, devices: [] });
    const url = `http://${ip}:${activePort}/mobil/#e=${pairing.secret}`;
    const qrSvg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 220, color: { dark: '#26251F', light: '#FFFFFF' } });
    const devices = Object.entries(pairing.devices || {}).map(([id, d]) => ({ id, name: d.name, lastSync: d.lastSync }));
    res.json({ ips, ip, port: activePort, url, qrSvg, devices, createdAt: pairing.createdAt });
  } catch (e) {
    sendErr(res, e);
  }
});

// Bağlantıyı yenile: yeni sır üret (tüm telefonların yeniden QR okutması gerekir)
app.post('/api/mobile/repair', (req, res) => {
  try {
    mobil.regeneratePairing(DATA_DIR);
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, e);
  }
});

/* Telefondan şifreli senkron. Gövde: {v,iv,ct,mac} zarfı.
   İçerik: {deviceId, deviceName, bookId, ops:[{id,kind,type,title,text,createdAt}]}
   Yakalamalar gelen kutusuna eklenir (kitaba DEĞİL — masaüstü birleştirir),
   cevapta bölüm listesi + kararsız notların özeti döner ki telefon kitabı görebilsin. */
app.post('/api/mobile/sync', (req, res) => {
  try {
    const pairing = mobil.loadPairing(DATA_DIR);
    const msg = mobil.open(pairing, req.body);
    if (!msg || !msg.deviceId) {
      return res.status(401).json({ error: 'Eşleşme doğrulanamadı — telefonda QR kodu yeniden okutun' });
    }
    const lib = readLibrary();
    const entry = lib.books.find(b => b.id === String(msg.bookId || 'default')) || lib.books.find(b => b.id === 'default') || lib.books[0];
    const ack = mobil.inboxAdd(DATA_DIR, entry.id, Array.isArray(msg.ops) ? msg.ops : [], msg.deviceName);

    // Cihaz kaydı (masaüstünde "eşleşmiş telefonlar" listesi için)
    pairing.devices = pairing.devices || {};
    pairing.devices[String(msg.deviceId).slice(0, 40)] = {
      name: String(msg.deviceName || 'Telefon').slice(0, 60),
      lastSync: new Date().toISOString()
    };
    mobil.savePairing(DATA_DIR, pairing);

    // Telefonun göreceği kitap özeti (salt-okunur görünüm)
    let kitap = null;
    try {
      const book = readBook(entry);
      kitap = {
        id: entry.id,
        title: (book.meta && book.meta.title) || 'Kitap',
        books: lib.books.map(b => {
          try { return { id: b.id, title: JSON.parse(fs.readFileSync(dataFileFor(b), 'utf8')).meta.title || b.id }; }
          catch { return { id: b.id, title: b.id }; }
        }),
        chapters: (book.parts || []).flatMap(p => (p.chapters || []).map(c => ({ id: c.id, title: c.title, part: p.title }))),
        scratchNotes: ((book.scratch && book.scratch.notes) || []).slice(0, 30).map(n => ({ id: n.id, type: n.type, text: String(n.text || '').slice(0, 500) })),
        totalWords: countBookWords(book)
      };
    } catch { /* kitap okunamasa da yakalama kaybolmaz */ }

    res.json(mobil.seal(pairing, {
      ok: true,
      ack,
      bekleyen: mobil.inboxList(DATA_DIR, entry.id).length,
      kitap,
      serverTime: new Date().toISOString()
    }));
  } catch (e) {
    sendErr(res, e);
  }
});

// Masaüstü: telefon gelen kutusunu oku / işlenenleri onayla (yalnızca localhost)
app.get('/api/mobile/inbox', (req, res) => {
  try {
    const entry = resolveEntry(req);
    res.json({ items: mobil.inboxList(DATA_DIR, entry.id) });
  } catch (e) {
    sendErr(res, e);
  }
});

app.post('/api/mobile/inbox/ack', (req, res) => {
  try {
    const entry = resolveEntry(req);
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    res.json({ ok: true, removed: mobil.inboxAck(DATA_DIR, entry.id, ids) });
  } catch (e) {
    sendErr(res, e);
  }
});

/* Başlatma: port doluysa sıradaki portları dene (paketli sürümde ikinci kopya
   açılırsa çakışmasın); paketli sürümde tarayıcıyı otomatik aç. */
function openBrowser(url) {
  try {
    const cmd = process.platform === 'darwin' ? `open "${url}"`
      : process.platform === 'win32' ? `start "" "${url}"`
      : `xdg-open "${url}"`;
    require('child_process').exec(cmd);
  } catch { /* tarayıcı açılamazsa kullanıcı adresi elle girer */ }
}

function startServer(port, attemptsLeft) {
  const server = app.listen(port, () => {
    activePort = port;
    const url = `http://localhost:${port}`;
    console.log(`inkGuide çalışıyor: ${url}`);
    console.log(`Verileriniz: ${DATA_DIR}`);
    if (IS_PKG && !process.env.NO_BROWSER) openBrowser(url);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`Port ${port} dolu, ${port + 1} deneniyor…`);
      startServer(port + 1, attemptsLeft - 1);
    } else {
      console.error('Sunucu başlatılamadı:', err.message);
      process.exit(1);
    }
  });
}

startServer(Number(PORT), 20);
