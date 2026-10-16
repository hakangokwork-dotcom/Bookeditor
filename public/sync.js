/* inkGuide — isteğe bağlı hesap + uçtan uca şifreli eşitleme (web ve masaüstü)
   Kitap bu cihazda, şifreden türetilen anahtarla şifrelenir; sync.inkguide.uk
   yalnızca okunamayan veri görür. Hesap açılmazsa bu dosya hiçbir şey yapmaz.

   Anahtarlar:
   - K: rastgele kitap anahtarı (AES-GCM). Hiçbir zaman açık halde sunucuya gitmez.
   - Şifre → PBKDF2 → (sarmalama anahtarı, authKey). K sarmalanıp saklanır; authKey
     giriş için gönderilir, sunucu yalnız özetini tutar.
   - Kurtarma anahtarı → aynı yolla ikinci bir sarmalama; şifre unutulursa K buradan açılır.

   Eşitleme durumu kitabın içinde durur: book.cloud = { id, rev, dirty }.
   Çakışmada hiçbir şey kaybolmaz: diğer cihazdaki hal ayrı bir kitap olarak eklenir.
   app.js'ten ÖNCE yüklenir; app.js fonksiyonlarını yalnızca çağrı anında kullanır. */

const SYNC_API = (() => { try { return localStorage.getItem('inkSyncApi'); } catch { return null; } })()
  || 'https://sync.inkguide.uk/v1';
const SYNC_STORE = 'inkSync';
let syncSession = null;   // { username, token, key }  (key: K, base64)
let syncBusy = false, syncLast = null, syncErr = null, syncSoonTimer = null;
let editSeq = 0;          // her düzenlemede artar; itme sırasında yazılan değişiklik "kirli" kalır
try { syncSession = JSON.parse(localStorage.getItem(SYNC_STORE)); } catch { syncSession = null; }

/* ---------------- Kripto ---------------- */

const syncEnc = new TextEncoder(), syncDec = new TextDecoder();
function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function deriveKeys(secret, saltPrefix, username, iterations) {
  const base = await crypto.subtle.importKey('raw', syncEnc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: syncEnc.encode(saltPrefix + username), iterations }, base, 512));
  return {
    wrapKey: await crypto.subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']),
    auth: toB64(bits.slice(32))
  };
}
const passwordKeys = (u, p) => deriveKeys(p, 'inkguide-v1:', u, 600000);
// Kurtarma anahtarı zaten 160 bit rastgele; yavaş türetmeye gerek yok
const recoveryKeys = (u, r) => deriveKeys(normRecovery(r), 'inkguide-rec-v1:', u, 1000);

async function seal(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv); out.set(ct, 12);
  return toB64(out);
}
async function unseal(key, b64) {
  const all = fromB64(b64);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, key, all.slice(12)));
}
const bookKey = () => crypto.subtle.importKey('raw', fromB64(syncSession.key), 'AES-GCM', false, ['encrypt', 'decrypt']);

async function streamBytes(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
async function encryptPayload(obj) {
  return seal(await bookKey(), await streamBytes(syncEnc.encode(JSON.stringify(obj)), new CompressionStream('gzip')));
}
async function decryptPayload(b64) {
  return JSON.parse(syncDec.decode(await streamBytes(await unseal(await bookKey(), b64), new DecompressionStream('gzip'))));
}

// 32 karakter (~158 bit), karışmayan alfabe (0/O, 1/I/L yok), 4'lü gruplar
const REC_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRecovery() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  const chars = [...b].map(x => REC_ALPHA[x % REC_ALPHA.length]).join('');
  return chars.match(/.{4}/g).join('-');
}
function normRecovery(r) {
  return String(r || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* ---------------- Sunucu ---------------- */

async function syncApi(method, path, body, token) {
  const res = await fetch(SYNC_API + path, {
    method,
    headers: Object.assign({ 'Content-Type': 'application/json' },
      (token || syncSession) ? { Authorization: 'Bearer ' + (token || syncSession.token) } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409 && data.conflict) return data;
  if (!res.ok) {
    if (res.status === 401 && syncSession && !token && path.startsWith('/books')) syncSignedOut();
    throw Object.assign(new Error(data.error || 'network'), { code: data.error || 'network', status: res.status });
  }
  return data;
}

function syncSave(sess) {
  syncSession = sess;
  try { sess ? localStorage.setItem(SYNC_STORE, JSON.stringify(sess)) : localStorage.removeItem(SYNC_STORE); } catch { /* özel pencere */ }
}

// Oturum başka cihazda şifre değişince düşer: yerel kitaplar yerinde kalır, yalnız eşitleme durur
function syncSignedOut() {
  syncSave(null);
  syncErr = 'auth';
  syncUi();
}

async function syncSignup(username, password) {
  username = username.trim().toLowerCase();
  const K = crypto.getRandomValues(new Uint8Array(32));
  const recovery = newRecovery();
  const p = await passwordKeys(username, password);
  const r = await recoveryKeys(username, recovery);
  const { token } = await syncApi('POST', '/signup', {
    username, authKey: p.auth, recAuth: r.auth,
    wrappedP: await seal(p.wrapKey, K), wrappedR: await seal(r.wrapKey, K)
  }, 'none');
  syncSave({ username, token, key: toB64(K) });
  return recovery;
}

async function syncLogin(username, password) {
  username = username.trim().toLowerCase();
  const p = await passwordKeys(username, password);
  const { token, wrappedP } = await syncApi('POST', '/login', { username, authKey: p.auth }, 'none');
  syncSave({ username, token, key: toB64(await unseal(p.wrapKey, wrappedP)) });
}

async function syncRecover(username, recovery, newPassword) {
  username = username.trim().toLowerCase();
  const r = await recoveryKeys(username, recovery);
  const { token, wrappedR } = await syncApi('POST', '/recover', { username, recAuth: r.auth }, 'none');
  const K = await unseal(r.wrapKey, wrappedR);
  const p = await passwordKeys(username, newPassword);
  await syncApi('POST', '/password', { authKey: p.auth, wrappedP: await seal(p.wrapKey, K) }, token);
  syncSave({ username, token, key: toB64(K) });
}

async function syncLogout() {
  try { await syncApi('POST', '/logout'); } catch { /* çevrimdışı: yerelde yine çıkılır */ }
  syncSave(null);
  syncErr = null;
  syncUi();
}

/* ---------------- Eşitleme motoru ----------------
   Yerel depo olarak app'in /api uçları kullanılır (masaüstünde sunucu, web'de web.js). */

const localJson = async (url, opts) => {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'local');
  return data;
};
const putLocal = (id, b) => localJson('/api/book?bookId=' + encodeURIComponent(id), {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b)
});
const getLocal = (id) => localJson('/api/book?bookId=' + encodeURIComponent(id));

function payloadOf(b, color) {
  const copy = Object.assign({}, b);
  delete copy.cloud;
  return { book: copy, color: color || null };
}

async function createLocal(p, cloud, titleSuffix) {
  const b = p.book;
  const title = ((b.meta && b.meta.title) || 'inkGuide').trim() + (titleSuffix || '');
  const made = await localJson('/api/library', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, color: p.color })
  });
  if (titleSuffix) b.meta = Object.assign({}, b.meta, { title });
  await putLocal(made.id, Object.assign({}, b, { cloud }));
  return made.id;
}

// Açık kitabın eşitleme durumunu, kullanıcının o arada yazdıklarını ezmeden günceller
async function setCloud(localId, b, cloud, seqAtStart) {
  if (book && localId === bookId) {
    book.cloud = Object.assign({}, cloud, { dirty: cloud.dirty || editSeq !== seqAtStart });
    await flushSaveNow();
  } else {
    await putLocal(localId, Object.assign({}, b, { cloud }));
  }
}

async function pushBook(entry, seqAtStart) {
  const b = (book && entry.id === bookId) ? JSON.parse(JSON.stringify(book)) : await getLocal(entry.id);
  const id = (b.cloud && b.cloud.id) || crypto.randomUUID();
  const data = await encryptPayload(payloadOf(b, entry.color));
  let res = await syncApi('PUT', '/books/' + id, { baseRev: (b.cloud && b.cloud.rev) || 0, data });
  if (res.conflict) {
    // Araya başka cihaz yazmış: onun hali ayrı kitap olarak saklanır, sonra bu cihazınki yazılır
    if (!res.deleted && res.data) {
      const stamp = new Date().toLocaleString(I18N_LOCALE, { dateStyle: 'short', timeStyle: 'short' });
      await createLocal(await decryptPayload(res.data), null, ` (${t('sync.conflictCopy')} ${stamp})`);
    }
    res = await syncApi('PUT', '/books/' + id, { baseRev: res.rev, data });
    if (res.conflict) throw new Error('conflict');
  }
  await setCloud(entry.id, b, { id, rev: res.rev, dirty: false }, seqAtStart);
}

async function pullInto(entry, cloudId) {
  const r = await syncApi('GET', '/books/' + cloudId);
  if (r.deleted || !r.data) return;
  const p = await decryptPayload(r.data);
  const isOpen = book && entry.id === bookId;
  if (isOpen && book.cloud && book.cloud.dirty) return; // o arada yazılmış: bir sonraki turda itilir
  // Üzerine yazmadan önce yerel halin anlık görüntüsü
  try { await fetch('/api/version?bookId=' + encodeURIComponent(entry.id), { method: 'POST' }); } catch { /* yoksa da devam */ }
  const next = Object.assign({}, p.book, { cloud: { id: cloudId, rev: r.rev, dirty: false } });
  await putLocal(entry.id, next);
  if (isOpen && !(book.cloud && book.cloud.dirty)) {
    book = next;
    migrateBook();
    if (sel.type === 'chapter' && !findChapter(sel.id)) sel = { type: 'guide', id: null };
    renderSidebar(); renderEditor(); renderStats();
  }
}

/* Tek tur: yereldeki kirli/yeni kitaplar itilir, buluttaki yeni sürümler çekilir,
   başka cihazda açılmış kitaplar bu cihaza eklenir. Dönüş: en son güncellenen bulut kitabının yerel kimliği. */
async function syncAll() {
  if (!syncSession || syncBusy) return null;
  syncBusy = true;
  syncUi();
  let newest = null;
  try {
    await flushSaveNow();
    const seqAtStart = editSeq;
    const local = (await localJson('/api/library')).books;
    const remote = new Map((await syncApi('GET', '/books')).books.map(r => [r.id, r]));
    const seen = new Map();
    for (const e of local) {
      const c = (book && e.id === bookId) ? book.cloud : e.cloud;
      if (!c || !c.id) {
        if (e.totalWords) await pushBook(e, seqAtStart); // boş şablon kitap buluta taşınmaz
        continue;
      }
      seen.set(c.id, e.id);
      const r = remote.get(c.id);
      if (r && r.deleted) continue;
      if (c.dirty || !r) await pushBook(e, seqAtStart);
      else if (r.rev > (c.rev || 0)) await pullInto(e, c.id);
    }
    for (const r of remote.values()) {
      if (r.deleted) continue;
      if (!seen.has(r.id)) {
        const g = await syncApi('GET', '/books/' + r.id);
        if (g.data) seen.set(r.id, await createLocal(await decryptPayload(g.data), { id: r.id, rev: g.rev, dirty: false }));
      }
      if (!newest || r.updatedAt > newest.updatedAt) newest = { updatedAt: r.updatedAt, localId: seen.get(r.id) };
    }
    syncLast = new Date();
    syncErr = null;
  } catch (e) {
    syncErr = e.code || e.message;
  } finally {
    syncBusy = false;
    syncUi();
  }
  return newest && newest.localId;
}

// Düzenleme sonrası (app.js scheduleSave çağırır): kısa bekleme, tek tur
function syncTouched() {
  editSeq++;
  if (book && book.cloud && book.cloud.id) book.cloud.dirty = true;
}
function syncSoon() {
  if (!syncSession) return;
  clearTimeout(syncSoonTimer);
  syncSoonTimer = setTimeout(syncAll, 4000);
}

/* Açılışta: çevrimdışıysak beklemeden yerelle devam (en çok 6 sn) */
async function syncAtStart() {
  if (!syncSession) return null;
  const r = await Promise.race([syncAll(), new Promise(ok => setTimeout(() => ok(null), 6000))]);
  syncAtStartTimers();
  return r;
}

/* ---------------- Arayüz ---------------- */

function syncStatusText() {
  if (syncBusy) return t('sync.busy');
  if (syncErr === 'auth') return t('sync.errAuth');
  if (syncErr) return t('sync.errNet');
  if (syncLast) return t('sync.last', { time: syncLast.toLocaleTimeString(I18N_LOCALE, { hour: '2-digit', minute: '2-digit' }) });
  return '';
}

function syncCardHtml() {
  const body = syncSession ? `
      <div class="sync-who">${ic('check')} <span>${t('sync.signedIn', { user: '<b>' + esc(syncSession.username) + '</b>' })}</span></div>
      <div class="set-hint" id="syncStatus">${esc(syncStatusText())}</div>
      <div class="set-field sync-actions">
        <button class="set-btn primary" id="syncNow">${esc(t('sync.now'))}</button>
        <button class="set-btn" id="syncOut">${esc(t('sync.logout'))}</button>
      </div>` : `
      ${syncErr === 'auth' ? `<div class="set-hint sync-warn">${esc(t('sync.errAuth'))}</div>` : ''}
      <div class="set-field sync-actions">
        <button class="set-btn primary" data-sync="signup">${esc(t('sync.signup'))}</button>
        <button class="set-btn" data-sync="login">${esc(t('sync.login'))}</button>
      </div>`;
  return `
    <div class="set-card set-card-wide" id="syncCard">
      <div class="set-title">${esc(t('sync.card'))}</div>
      <p class="set-desc">${esc(t('sync.cardDesc'))}</p>
      ${body}
    </div>`;
}

function bindSyncCard() {
  const now = $('#syncNow');
  if (now) now.onclick = () => syncAll();
  const out = $('#syncOut');
  if (out) out.onclick = async () => {
    if (!confirm(t('sync.logoutConfirm'))) return;
    await syncLogout();
  };
}

// Ayarlar açıksa kartı, her durumda kitaplık düğmesini tazeler
function syncUi() {
  const st = $('#syncStatus');
  if (st) st.textContent = syncStatusText();
  const card = $('#syncCard');
  if (card && !!syncSession !== !!card.querySelector('#syncOut')) {
    card.outerHTML = syncCardHtml();
    bindSyncCard();
  }
}

function syncHeaderBtnHtml() {
  return syncSession
    ? `<span class="sync-chip" title="${esc(t('sync.card'))}">${ic('check')} ${esc(syncSession.username)}</span>`
    : `<button class="lib-back" data-sync="login">${esc(t('sync.login'))}</button>`;
}

const syncErrText = (e) => t({
  taken: 'sync.errTaken', bad_login: 'sync.errLogin', locked: 'sync.errLocked',
  bad_username: 'sync.errUser', network: 'sync.errNet'
}[e.code] || 'sync.errNet');

function openSyncModal(mode) {
  if (typeof closeOnboarding === 'function' && $('#onboardHost') && $('#onboardHost').innerHTML) closeOnboarding();
  let host = $('#syncModalHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'syncModalHost';
    document.body.appendChild(host);
  }
  const close = () => { host.innerHTML = ''; };
  const field = (id, label, type, extra = '') => `
        <div>
          <label for="${id}">${esc(t(label))}</label>
          <input type="${type}" id="${id}" ${extra} required>
        </div>`;
  const forms = {
    signup: field('syU', 'sync.username', 'text', 'autocomplete="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_.\\-]{3,32}"')
      + field('syP', 'sync.password', 'password', 'autocomplete="new-password" minlength="8"')
      + field('syP2', 'sync.password2', 'password', 'autocomplete="new-password" minlength="8"')
      + `<div class="set-hint">${esc(t('sync.signupHint'))}</div>`,
    login: field('syU', 'sync.username', 'text', 'autocomplete="username"')
      + field('syP', 'sync.password', 'password', 'autocomplete="current-password"')
      + `<button type="button" class="sync-link" data-sync="recover">${esc(t('sync.forgot'))}</button>`,
    recover: field('syU', 'sync.username', 'text', 'autocomplete="username"')
      + field('syR', 'sync.recoveryKey', 'text', 'autocomplete="off" spellcheck="false"')
      + field('syP', 'sync.newPassword', 'password', 'autocomplete="new-password" minlength="8"')
      + field('syP2', 'sync.password2', 'password', 'autocomplete="new-password" minlength="8"')
  };
  const titles = { signup: 'sync.signup', login: 'sync.login', recover: 'sync.recoverTitle' };
  host.innerHTML = `
  <div class="lib-modal-backdrop" id="syncBack">
    <div class="lib-modal">
      <div class="lib-modal-head"><span class="t">${esc(t(titles[mode]))}</span><button class="lib-modal-close" id="syncClose" title="${esc(t('close'))}">✕</button></div>
      <form class="lib-modal-body" id="syncForm">
        <p class="set-desc">${esc(t('sync.' + mode + 'Desc'))}</p>
        ${forms[mode]}
        <div class="sync-err" id="syncErr" role="alert"></div>
      </form>
      <div class="lib-modal-foot">
        ${mode === 'login' ? `<button type="button" class="cancel" data-sync="signup">${esc(t('sync.signup'))}</button>` : `<button type="button" class="cancel" id="syncCancel">${esc(t('lib.cancel'))}</button>`}
        <button type="submit" class="create" form="syncForm" id="syncGo">${esc(t(titles[mode]))}</button>
      </div>
    </div>
  </div>`;
  $('#syncClose').onclick = close;
  const cancel = $('#syncCancel');
  if (cancel) cancel.onclick = close;
  $('#syncBack').onclick = (e) => { if (e.target.id === 'syncBack') close(); };
  $('#syU').focus();

  $('#syncForm').onsubmit = async (e) => {
    e.preventDefault();
    const err = $('#syncErr'), go = $('#syncGo');
    const u = $('#syU').value, p = $('#syP').value, p2 = $('#syP2') && $('#syP2').value;
    if (p2 !== undefined && p2 !== null && p !== p2) { err.textContent = t('sync.errMatch'); return; }
    err.textContent = '';
    go.disabled = true;
    go.textContent = t('sync.working');
    try {
      if (mode === 'signup') {
        const recovery = await syncSignup(u, p);
        showRecovery(host, recovery);
        syncAll();
        return;
      }
      if (mode === 'login') await syncLogin(u, p);
      else await syncRecover(u, $('#syR').value, p);
      close();
      await afterSignIn();
    } catch (ex) {
      err.textContent = syncErrText(ex);
      go.disabled = false;
      go.textContent = t(titles[mode]);
    }
  };
}

// Kurtarma anahtarı yalnız bir kez gösterilir; kaydettiğini onaylamadan pencere kapanmaz
function showRecovery(host, recovery) {
  host.innerHTML = `
  <div class="lib-modal-backdrop">
    <div class="lib-modal">
      <div class="lib-modal-head"><span class="t">${esc(t('sync.recTitle'))}</span></div>
      <div class="lib-modal-body">
        <p class="set-desc">${esc(t('sync.recDesc'))}</p>
        <code class="sync-rec" id="syncRec">${esc(recovery)}</code>
        <div class="sync-actions">
          <button type="button" class="set-btn" id="syncCopy">${esc(t('sync.copy'))}</button>
          <button type="button" class="set-btn" id="syncDl">${esc(t('sync.download'))}</button>
        </div>
        <label class="sync-ok"><input type="checkbox" id="syncSaved"> ${esc(t('sync.recSaved'))}</label>
      </div>
      <div class="lib-modal-foot">
        <button type="button" class="create" id="syncDone" disabled>${esc(t('sync.done'))}</button>
      </div>
    </div>
  </div>`;
  $('#syncCopy').onclick = () => navigator.clipboard && navigator.clipboard.writeText(recovery);
  $('#syncDl').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`inkGuide\n${t('sync.username')}: ${syncSession.username}\n${t('sync.recoveryKey')}: ${recovery}\n`], { type: 'text/plain' }));
    a.download = 'inkguide-kurtarma-anahtari.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  };
  $('#syncSaved').onchange = (e) => { $('#syncDone').disabled = !e.target.checked; };
  $('#syncDone').onclick = () => { host.innerHTML = ''; syncUi(); };
}

/* Girişten sonra: bulut kitapları gelir, en son çalışılan kitap kaldığı yerden açılır */
async function afterSignIn() {
  syncUi();
  const newest = await syncAll();
  if (newest) await openBook(newest);
  else if (!$('#libraryView').hidden) await showLibrary();
  syncAtStartTimers();
}
let syncTimersOn = false;
function syncAtStartTimers() {
  if (syncTimersOn) return;
  syncTimersOn = true;
  setInterval(() => { if (!document.hidden) syncAll(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncAll(); });
}

document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-sync]');
  if (!b) return;
  e.preventDefault();
  openSyncModal(b.dataset.sync);
});

// Kitaplıktan arşivlenen kitap bulutta da silindi işaretlenir (diğer cihazlara yeniden inmesin)
function syncForget(entry) {
  if (syncSession && entry && entry.cloud && entry.cloud.id) {
    syncApi('DELETE', '/books/' + entry.cloud.id).catch(() => { /* çevrimdışı: bulut kopyası kalır, veri kaybı yok */ });
  }
}
