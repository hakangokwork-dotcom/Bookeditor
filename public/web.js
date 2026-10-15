/* inkGuide — tarayıcı sürümü (inkguide.uk/app)
   Yalnızca web derlemesine eklenir (tools/build-webapp.mjs); masaüstü sürümü bu
   dosyayı hiç yüklemez. server.js'teki /api uçlarının aynısını tarayıcıda
   IndexedDB üzerinde karşılar: app.js hiçbir şey fark etmeden fetch() eder.
   Kitap bu tarayıcıdan çıkmaz — hiçbir istek sunucuya gitmez. */
(() => {
  window.INKGUIDE_WEB = true;

  // Tarayıcı, yer darlığında "kalıcı" işaretli depoyu kendiliğinden silmez
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* desteklenmiyor */ }

  /* ---- Anahtar-değer deposu: library | book:<id> | ver:<id>:<dosya> | exp:<yol> | arsiv:<id>-<damga> ---- */
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((ok, no) => {
    const r = indexedDB.open('inkguide', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  }));
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((ok, no) => {
      const t = d.transaction('kv', mode);
      const req = fn(t.objectStore('kv'));
      t.oncomplete = () => ok(req && req.result);
      t.onerror = () => no(t.error);
    });
  };
  const get = (k) => tx('readonly', s => s.get(k));
  const put = (k, v) => tx('readwrite', s => { s.put(v, k); });
  const del = (k) => tx('readwrite', s => { s.delete(k); });
  const keys = (prefix) => tx('readonly', s => s.getAllKeys(IDBKeyRange.bound(prefix, prefix + '￿')));

  /* ---- server.js'ten aynen taşınan yardımcılar ---- */
  const sample = async () => (await realFetch('book.sample.json')).json();

  function slugify(title) {
    const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
    let s = String(title || '').toLowerCase().replace(/[çğıöşüâîû]/g, ch => map[ch] || ch);
    s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '');
    return s || 'kitap';
  }
  const wcText = (t) => t ? String(t).trim().split(/\s+/).filter(Boolean).length : 0;
  function countBookWords(book) {
    let n = 0;
    for (const p of book.parts || []) for (const c of p.chapters || []) n += wcText(c.draft);
    const f = book.frontmatter || {};
    for (const k of ['onsoz', 'tesekkur', 'giris']) n += wcText(f[k]);
    return n;
  }
  function localStamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`;
  }
  const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });

  // İlk açılış: masaüstündeki gibi şablondan "default" kitap
  async function readLibrary() {
    let lib = await get('library');
    if (!lib || !Array.isArray(lib.books)) {
      const now = new Date().toISOString();
      if (!(await get('book:default'))) await put('book:default', await sample());
      lib = { books: [{ id: 'default', createdAt: now, updatedAt: now }] };
      await put('library', lib);
    }
    return lib;
  }
  async function resolveEntry(q) {
    const id = q.get('bookId') || 'default';
    const entry = (await readLibrary()).books.find(b => b.id === id);
    if (!entry) throw fail('Kitap bulunamadı: ' + id, 404);
    return entry;
  }
  const readBook = async (entry) => {
    const b = await get('book:' + entry.id);
    if (!b) throw fail('Kitap bulunamadı: ' + entry.id, 404);
    return b;
  };
  const prefixFor = (id) => id === 'default' ? '' : id + '/';

  /* ---- Dışa aktarma: lib/export.js tarayıcıda, docx tarayıcı paketiyle ---- */
  let exporter = null;
  async function loadExporter() {
    if (exporter) return exporter;
    await new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'vendor/docx.js';
      s.onload = ok; s.onerror = () => no(new Error('docx yüklenemedi'));
      document.head.appendChild(s);
    });
    const src = await (await realFetch('export.js')).text();
    const module = { exports: {} };
    const mods = {
      fs: {}, path: {},
      marked: { marked: window.marked },
      // Node'daki toBuffer tarayıcıda yok; aynı belgeyi Blob olarak üret
      docx: Object.assign({}, window.docx, { Packer: { toBuffer: d => window.docx.Packer.toBlob(d) } })
    };
    new Function('module', 'exports', 'require', src)(module, module.exports, n => mods[n]);
    return (exporter = module.exports);
  }

  const routes = {
    'GET /api/library': async () => {
      const lib = await readLibrary();
      const books = [];
      for (const entry of lib.books) {
        const book = (await get('book:' + entry.id)) || { meta: { title: entry.id + ' (okunamadı)' } };
        const meta = book.meta || {};
        let chapters = 0, done = 0;
        for (const p of book.parts || []) {
          chapters += (p.chapters || []).length;
          done += (p.chapters || []).filter(c => c.status === 'bitti').length;
        }
        books.push({
          id: entry.id, color: entry.color || null, createdAt: entry.createdAt || null,
          title: meta.title || 'Adsız kitap', subtitle: meta.subtitle || '',
          targetWords: meta.targetWords || 60000, totalWords: countBookWords(book),
          chapters, done, updatedAt: entry.updatedAt || entry.createdAt || null
        });
      }
      return { books };
    },

    'POST /api/library': async (q, body) => {
      const { title, subtitle, targetWords, color, partTitle, chapterTitle } = body || {};
      if (!title || !String(title).trim()) throw fail('Kitap adı gerekli');
      const lib = await readLibrary();
      const base = slugify(title);
      let id = base, i = 2;
      while (id === 'default' || lib.books.some(b => b.id === id)) id = `${base}-${i++}`;
      const book = await sample();
      book.meta.title = String(title).trim();
      book.meta.subtitle = String(subtitle || '').trim();
      const tw = parseInt(targetWords, 10);
      if (tw > 0) book.meta.targetWords = tw;
      if (partTitle && String(partTitle).trim() && book.parts && book.parts[0]) book.parts[0].title = String(partTitle).trim();
      if (chapterTitle && String(chapterTitle).trim() && book.parts?.[0]?.chapters?.[0]) book.parts[0].chapters[0].title = String(chapterTitle).trim();
      await put('book:' + id, book);
      const now = new Date().toISOString();
      lib.books.push({ id, color: color || null, createdAt: now, updatedAt: now });
      await put('library', lib);
      return { ok: true, id };
    },

    // Arşivle: asla gerçekten silme (masaüstündeki _arsiv/ klasörünün karşılığı)
    'DELETE /api/library/:id': async (q, body, id) => {
      const lib = await readLibrary();
      if (!lib.books.some(b => b.id === id)) throw fail('Kitap bulunamadı', 404);
      if (id === 'default') throw fail('Ana kitap (ilk kitabınız) güvenlik nedeniyle arşivlenemez');
      if (lib.books.length <= 1) throw fail('Kitaplıktaki son kitap arşivlenemez');
      const book = await get('book:' + id);
      if (book) await put(`arsiv:${id}-${localStamp()}`, book);
      await del('book:' + id);
      lib.books = lib.books.filter(b => b.id !== id);
      await put('library', lib);
      return { ok: true };
    },

    'GET /api/book': async (q) => readBook(await resolveEntry(q)),

    'PUT /api/book': async (q, b) => {
      const entry = await resolveEntry(q);
      if (!b || typeof b !== 'object' || !b.meta || !Array.isArray(b.parts)) {
        throw fail('Geçersiz kitap verisi — kayıt reddedildi');
      }
      await put('book:' + entry.id, b);
      const lib = await readLibrary();
      const e = lib.books.find(x => x.id === entry.id);
      const savedAt = new Date().toISOString();
      if (e) { e.updatedAt = savedAt; await put('library', lib); }
      return { ok: true, savedAt };
    },

    'POST /api/export': async (q) => {
      const entry = await resolveEntry(q);
      const book = await readBook(entry);
      const x = await loadExporter();
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const base = `kitap-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
      const out = [
        [base + '.md', new Blob([x.buildMarkdown(book)], { type: 'text/markdown' })],
        [base + '.html', new Blob([x.buildHtml(book)], { type: 'text/html' })],
        [base + '.docx', await x.buildDocx(book)]
      ];
      const files = [];
      for (const [name, blob] of out) {
        const path = prefixFor(entry.id) + name;
        await put('exp:' + path, { blob, mtime: d.toISOString() });
        files.push(path);
      }
      return { ok: true, files };
    },

    'GET /api/exports': async (q) => {
      const entry = await resolveEntry(q);
      const pre = 'exp:' + prefixFor(entry.id);
      const files = [];
      for (const k of await keys(pre)) {
        const name = k.slice(pre.length);
        if (name.includes('/')) continue; // default kitapta başka kitapların alt yolları
        const v = await get(k);
        files.push({ name, size: v.blob.size, mtime: v.mtime, path: k.slice(4) });
      }
      files.sort((a, b) => b.mtime.localeCompare(a.mtime));
      return { files };
    },

    'GET /api/versions': async (q) => {
      const entry = await resolveEntry(q);
      return { versions: await listVersions(entry.id) };
    },

    'POST /api/version': async (q) => {
      const entry = await resolveEntry(q);
      const file = `kitap-v${localStamp()}.json`;
      await put(`ver:${entry.id}:${file}`, await readBook(entry));
      return { ok: true, file, versions: await listVersions(entry.id) };
    },

    'POST /api/version/restore': async (q, body) => {
      const entry = await resolveEntry(q);
      const file = (body && body.file) || '';
      if (!/^kitap-v[\d-]+(-oncesi)?\.json$/.test(file)) throw fail('Geçersiz versiyon adı');
      const v = await get(`ver:${entry.id}:${file}`);
      if (!v) throw fail('Versiyon bulunamadı');
      // Geri yüklemeden önce mevcut hali de otomatik versiyonla
      await put(`ver:${entry.id}:kitap-v${localStamp()}-oncesi.json`, await readBook(entry));
      await put('book:' + entry.id, v);
      return { ok: true, book: v };
    }
  };

  async function listVersions(id) {
    const pre = `ver:${id}:`;
    return (await keys(pre)).map(k => k.slice(pre.length)).sort().reverse();
  }

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return realFetch(input, init);
    const method = (init.method || 'GET').toUpperCase();
    let key = method + ' ' + url.pathname, param;
    const m = url.pathname.match(/^\/api\/library\/(.+)$/);
    if (m) { key = method + ' /api/library/:id'; param = decodeURIComponent(m[1]); }
    // Masaüstüne özgü uçlar (veri evi, kurtarma, telefon) web'de yok: arayüz "eski sunucu" yoluna düşer
    if (!routes[key]) return json({ error: 'Web sürümünde yok' }, 404);
    try {
      const body = init.body ? JSON.parse(init.body) : null;
      return json(await routes[key](url.searchParams, body, param));
    } catch (e) {
      return json({ error: e.message }, e.status || 500);
    }
  };

  // Dışa aktarılan dosya bağlantıları (/exports/…) IndexedDB'deki Blob'u indirir
  document.addEventListener('click', async (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/exports/"]');
    if (!a) return;
    e.preventDefault();
    const path = decodeURIComponent(a.getAttribute('href').slice('/exports/'.length));
    const v = await get('exp:' + path);
    if (!v) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(v.blob);
    link.download = path.split('/').pop();
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  }, true);
})();
