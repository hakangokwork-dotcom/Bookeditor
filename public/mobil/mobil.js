/* inkGuide Mobil — yakalama arkadaşı.
   Tam editör DEĞİLDİR: not + sesli not + karalama yakalar, aynı Wi-Fi'deki
   masaüstü inkGuide'a şifreli gönderir. Gönderilemeyenler telefonda (localStorage)
   bekler; bağlantı gelince kendiliğinden eşitlenir. */

const $ = (s) => document.querySelector(s);

/* ---------------- Kalıcı durum ---------------- */

const store = {
  get(k, fallback) {
    try {
      const v = localStorage.getItem('inkguide.mobil.' + k);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(k, v) { localStorage.setItem('inkguide.mobil.' + k, JSON.stringify(v)); }
};

function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

// QR'dan gelen eşleşme sırrı: #e=<sır> — adres çubuğunda kalmasın diye hemen temizlenir
(() => {
  const m = location.hash.match(/[#&]e=([A-Za-z0-9_-]{20,})/);
  if (m) {
    store.set('secret', m[1]);
    history.replaceState(null, '', location.pathname);
  }
})();

let secret = store.get('secret', null);
let deviceId = store.get('deviceId', null);
if (!deviceId) { deviceId = uid(); store.set('deviceId', deviceId); }
let deviceName = store.get('deviceName', null) || (/iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : 'Telefon');
let bookId = store.get('bookId', 'default');
let outbox = store.get('outbox', []);       // gönderilmeyi bekleyen yakalamalar
let sentLog = store.get('sent', []);        // son gönderilenler (görünüm için)
let kitap = store.get('kitap', null);       // masaüstünden gelen salt-okunur özet
let lastSync = store.get('lastSync', null);
let syncState = 'offline';                  // ok | pending | offline | unpaired

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Günün ipucu (kısa yerel liste; uzun içerik masaüstünde) ---------------- */

const MOBIL_TIPS = {
  tr: [
    'Bir paragraf = bir fikir. Paragraf uzadıysa muhtemelen iki fikir anlatıyorsunuz.',
    'Aklınıza gelen cümleyi olduğu gibi yakalayın — cilalamayı masaüstüne bırakın.',
    'Alıntıyı duyduğunuz anda kaydedin; "sonra bulurum" dediğiniz kaynak bulunmaz.',
    'Yürürken gelen fikir en taze halidir. Düzeltmeyin, söyleyin.',
    'Kısa not, uzun hafızadan iyidir.'
  ],
  en: [
    'One paragraph = one idea. If it runs long, it probably carries two.',
    'Capture the sentence as it comes — polish it later at your desk.',
    'Record a quote the moment you hear it; the source you will "find later" is never found.',
    'An idea caught while walking is at its freshest. Don\'t edit it, say it.',
    'A short note beats a long memory.'
  ]
};

/* ---------------- Sekmeler ---------------- */

let activeTab = 'notes';

function showTab(tab) {
  activeTab = tab;
  const paired = !!secret;
  $('#viewPair').hidden = paired;
  $('#viewNotes').hidden = !paired || tab !== 'notes';
  $('#viewScratch').hidden = !paired || tab !== 'scratch';
  $('#viewSettings').hidden = !paired || tab !== 'settings';
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#tabbar').hidden = !paired;
}

document.querySelectorAll('.tab').forEach(b => {
  b.onclick = () => { showTab(b.dataset.tab); if (b.dataset.tab === 'settings') renderSettings(); };
});

/* ---------------- Senkron durumu çipi ---------------- */

function fmtTime(iso) {
  try { return new Date(iso).toLocaleTimeString(I18N_LOCALE, { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function renderChip() {
  const chip = $('#syncChip');
  const n = outbox.length;
  chip.className = 'sync-chip';
  if (!secret) { chip.classList.add('offline'); chip.textContent = t('mobil.notPaired'); }
  else if (n > 0) { chip.classList.add('pending'); chip.innerHTML = `<span class="dot"></span>${esc(t('mobil.waiting', { n }))}`; }
  else if (syncState === 'ok' && lastSync) { chip.classList.add('ok'); chip.textContent = '✓ ' + t('mobil.synced', { time: fmtTime(lastSync) }); }
  else { chip.classList.add('offline'); chip.textContent = t('mobil.offlineShort'); }
  const badge = $('#tabBadge');
  badge.hidden = n === 0;
  badge.textContent = n;
  $('#statPending').textContent = n;
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ---------------- Yakalama ---------------- */

function capture(kind, type, title, text) {
  const tx = String(text || '').trim();
  if (!tx) return false;
  outbox.push({
    id: uid(), kind, type, title: String(title || '').trim(),
    text: tx, createdAt: new Date().toISOString()
  });
  store.set('outbox', outbox);
  renderChip();
  renderNotes();
  renderRecent();
  sync();
  return true;
}

$('#quickAdd').onclick = () => {
  if (capture('not', 'not', '', $('#quickNote').value)) $('#quickNote').value = '';
};
$('#quickNote').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('#quickAdd').onclick(); }
});

$('#toNoteBtn').onclick = () => {
  if (capture('not', $('#noteType').value, '', $('#scratchText').value)) {
    $('#scratchText').value = ''; $('#padTitle').value = '';
    toast(t('mobil.captured'));
  }
};
$('#toPadBtn').onclick = () => {
  if (capture('karalama', 'not', $('#padTitle').value, $('#scratchText').value)) {
    $('#scratchText').value = ''; $('#padTitle').value = '';
    toast(t('mobil.captured'));
  }
};

/* ---------------- Not listesi (bekleyenler + masaüstündeki kararsız notlar) ---------------- */

function renderNotes() {
  const list = $('#noteList');
  const pending = outbox.filter(o => o.kind === 'not');
  const deskNotes = (kitap && kitap.scratchNotes) || [];
  $('#noteCount').textContent = pending.length + deskNotes.length;

  let html = pending.map(o => `
    <div class="note-card t-${esc(o.type)}">
      <div class="txt">${esc(o.text)}</div>
      <div class="note-meta">
        <span class="note-badge pending">${esc(t('mobil.pendingBadge'))}</span>
        <span class="spacer"></span>
        <button class="note-del" data-del="${o.id}" aria-label="${esc(t('del'))}">✕</button>
      </div>
    </div>`).join('');

  if (deskNotes.length) {
    html += `<div class="section-head" style="margin-top:22px"><span>${esc(t('mobil.onDesktop'))}</span></div>`;
    html += deskNotes.map(n => `
      <div class="note-card t-${esc(n.type)}">
        <div class="txt">${esc(n.text)}</div>
        <div class="note-meta"><span class="note-badge sent">✓ inkGuide</span></div>
      </div>`).join('');
  }

  list.innerHTML = html || `<div class="empty-note">${esc(t('mobil.notesEmpty'))}</div>`;

  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => {
      outbox = outbox.filter(o => o.id !== btn.dataset.del);
      store.set('outbox', outbox);
      renderChip(); renderNotes(); renderRecent();
    };
  });
}

/* ---------------- Son yakalamalar ---------------- */

function renderRecent() {
  const rows = [
    ...outbox.slice().reverse().map(o => ({ ...o, state: 'pending' })),
    ...sentLog.slice().reverse().map(o => ({ ...o, state: 'sent' }))
  ].slice(0, 10);
  $('#recentList').innerHTML = rows.length ? rows.map(o => `
    <div class="recent-row">
      <svg viewBox="0 0 24 24"><path d="M5 8v8M9 5v14M13 9v6M17 7v10M21 11v2"/></svg>
      <div class="mid">
        <div class="t1">${esc(o.title || o.text.slice(0, 60))}</div>
        <div class="t2">${fmtTime(o.createdAt)} · ${o.kind === 'karalama' ? esc(t('mobil.kindPad')) : esc(t('mobil.kindNote'))} · ${o.state === 'sent' ? '✓ ' + esc(t('mobil.sentBadge')) : esc(t('mobil.pendingBadge'))}</div>
      </div>
    </div>`).join('') : `<div class="empty-note">${esc(t('mobil.recentEmpty'))}</div>`;
}

/* ---------------- Sesli karalama ----------------
   Tarayıcı SpeechRecognition verirse (https/localhost) canlı dikte;
   vermezse (yerel ağ http) klavyenin 🎤 tuşuna yönlendirilir — aynı işi görür. */

let recog = null;
let recTimer = null;
let recStart = 0;
let dicteLang = localStorage.getItem('dicteLang') || 'tr-TR';

const DICTE_LANGS = [
  ['tr-TR', 'Türkçe'], ['en-US', 'English'], ['es-ES', 'Español'], ['zh-CN', '中文'],
  ['ar-SA', 'العربية'], ['hi-IN', 'हिन्दी'], ['pt-BR', 'Português'], ['fr-FR', 'Français'],
  ['ru-RU', 'Русский'], ['de-DE', 'Deutsch']
];
const UI_LANGS = [
  ['tr', 'Türkçe'], ['en', 'English'], ['es', 'Español'], ['zh', '中文'],
  ['ar', 'العربية'], ['hi', 'हिन्दी'], ['pt', 'Português'], ['fr', 'Français'],
  ['ru', 'Русский'], ['de', 'Deutsch']
];

function langName(code) { const f = DICTE_LANGS.find(l => l[0] === code); return f ? f[1] : code; }

function buildWave() {
  const w = $('#recWave');
  if (w.children.length) return;
  for (let i = 0; i < 15; i++) {
    const bar = document.createElement('i');
    bar.style.height = (25 + Math.round(Math.abs(Math.sin(i * 2.7)) * 70)) + '%';
    bar.style.animationDelay = (i * 73 % 400) + 'ms';
    w.appendChild(bar);
  }
}

function setRecUI(on) {
  $('#recCard').classList.toggle('recording', on);
  $('#recWave').hidden = !on;
  $('#recTitle').textContent = on ? t('mobil.recording') : t('mobil.record');
  $('#recSub').textContent = on ? langName(dicteLang) + ' · ' + t('mobil.liveTranscribe') : t('mobil.recordSub');
  if (!on) { $('#recTime').textContent = ''; clearInterval(recTimer); }
}

$('#recBtn').onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const secure = window.isSecureContext;
  if (!SR || !secure) {
    // Yerel ağ http: tarayıcı mikrofonu vermez — klavye diktesi öner ve alana odaklan
    $('#recHint').hidden = false;
    $('#recHint').textContent = t('mobil.keyboardMicHint');
    $('#scratchText').focus();
    return;
  }
  if (recog) { try { recog.stop(); } catch { /* zaten durdu */ } return; }
  const r = new SR();
  r.lang = dicteLang;
  r.continuous = true;
  r.interimResults = false;
  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const tx = e.results[i][0].transcript.trim();
        if (tx) {
          const el = $('#scratchText');
          el.value = (el.value ? el.value.replace(/\s+$/, '') + ' ' : '') + tx;
        }
      }
    }
  };
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast(t('alert.micDenied'));
  };
  r.onend = () => { recog = null; setRecUI(false); };
  recog = r;
  buildWave();
  setRecUI(true);
  recStart = Date.now();
  recTimer = setInterval(() => {
    const s = Math.floor((Date.now() - recStart) / 1000);
    $('#recTime').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }, 500);
  try { r.start(); } catch { /* üst üste start */ }
};

/* ---------------- Şifreli senkron ---------------- */

let syncing = false;
let syncQueued = false; // senkron sürerken yeni yakalama gelirse biter bitmez tekrar dene

async function sync(showResult) {
  if (!secret) { renderChip(); return; }
  if (syncing) { syncQueued = true; return; }
  syncing = true;
  try {
    const ops = outbox.slice(0, 50);
    const env = MobilKripto.seal(secret, {
      deviceId, deviceName, bookId, ops,
      ts: new Date().toISOString()
    });
    const res = await fetch('/api/mobile/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(env)
    });
    if (res.status === 401) {
      syncState = 'offline';
      toast(t('mobil.rePairNeeded'));
      return;
    }
    if (!res.ok) throw new Error('http ' + res.status);
    const msg = MobilKripto.open(secret, await res.json());
    if (!msg || !msg.ok) throw new Error('zarf açılamadı');

    // Onaylananlar bekleme listesinden çıkar, "gönderildi" günlüğüne geçer
    if (Array.isArray(msg.ack) && msg.ack.length) {
      const ackSet = new Set(msg.ack);
      const sentNow = outbox.filter(o => ackSet.has(o.id));
      outbox = outbox.filter(o => !ackSet.has(o.id));
      sentLog = sentLog.concat(sentNow).slice(-20);
      store.set('outbox', outbox);
      store.set('sent', sentLog);
    }
    if (msg.kitap) { kitap = msg.kitap; store.set('kitap', kitap); }
    lastSync = new Date().toISOString();
    store.set('lastSync', lastSync);
    syncState = 'ok';
    if (showResult) toast('✓ ' + t('mobil.synced', { time: fmtTime(lastSync) }));
    renderNotes(); renderRecent();
    if (activeTab === 'settings') renderSettings();
  } catch {
    syncState = 'offline';
    if (showResult) toast(t('mobil.offlineToast'));
  } finally {
    syncing = false;
    renderChip();
    if (syncQueued) { syncQueued = false; if (outbox.length) setTimeout(() => sync(), 400); }
  }
}

/* ---------------- Ayarlar ---------------- */

function renderSettings() {
  const books = (kitap && kitap.books) || [{ id: bookId, title: bookId }];
  $('#bookSel').innerHTML = books.map(b =>
    `<option value="${esc(b.id)}"${b.id === bookId ? ' selected' : ''}>${esc(b.title)}</option>`).join('');
  $('#deviceName').value = deviceName;
  $('#langSel').innerHTML = UI_LANGS.map(([c, n]) =>
    `<option value="${c}"${c === I18N_LANG ? ' selected' : ''}>${n}</option>`).join('');
  $('#dicteSel').innerHTML = DICTE_LANGS.map(([c, n]) =>
    `<option value="${c}"${c === dicteLang ? ' selected' : ''}>${n}</option>`).join('');
  $('#statWords').textContent = kitap ? Number(kitap.totalWords || 0).toLocaleString(I18N_LOCALE) : '—';

  const st = $('#pairStatus');
  if (secret) {
    st.innerHTML =
      `<span class="ok">✓ ${esc(t('mobil.paired'))}</span> — ${esc(location.host)}<br>` +
      `${esc(t('mobil.lastSync'))}: <b>${lastSync ? esc(fmtTime(lastSync)) + ' · ' + esc(new Date(lastSync).toLocaleDateString(I18N_LOCALE)) : '—'}</b><br>` +
      `<span style="color:var(--muted)">${esc(t('mobil.rePairHint'))}</span>`;
  } else {
    st.innerHTML = `<span class="off">${esc(t('mobil.notPaired'))}</span>`;
  }
}

$('#syncNowBtn').onclick = () => sync(true);
$('#bookSel').onchange = (e) => { bookId = e.target.value; store.set('bookId', bookId); kitap = null; sync(true); };
$('#deviceName').onchange = (e) => { deviceName = e.target.value.trim() || 'Telefon'; store.set('deviceName', deviceName); };
$('#langSel').onchange = (e) => { localStorage.setItem('uiLang', e.target.value); location.reload(); };
$('#dicteSel').onchange = (e) => { dicteLang = e.target.value; localStorage.setItem('dicteLang', dicteLang); };

/* ---------------- Başlangıç ---------------- */

(function init() {
  // Günün ipucu
  const tips = MOBIL_TIPS[I18N_LANG === 'tr' ? 'tr' : 'en'];
  $('#tipText').textContent = tips[new Date().getDate() % tips.length];
  $('#recSub').textContent = t('mobil.recordSub');

  showTab(secret ? 'notes' : 'notes');
  renderChip(); renderNotes(); renderRecent(); renderSettings();
  sync();

  // Görünür olunca ve ağ gelince eşitle; açıkken 20 sn'de bir dene
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('online', () => sync());
  setInterval(() => { if (!document.hidden && outbox.length) sync(); }, 20000);

  // PWA: service worker yalnızca güvenli bağlamda kaydolur (https/localhost)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* http LAN'da beklenen durum */ });
  }
})();
