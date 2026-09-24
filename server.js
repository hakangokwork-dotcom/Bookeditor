const express = require('express');
const fs = require('fs');
const path = require('path');
const { exportBook, buildMarkdown, buildDocx, buildNotesAppendix } = require('./lib/export');
const mobil = require('./lib/mobil');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 4321;

/* Paketlenmiş (.exe) çalışmada __dirname salt-okunur sanal dosya sistemidir (pkg snapshot).
   Yazılabilir her şey (veri, export, versiyon, yedek) "veri evine" gider;
   statik varlıklar (public/, şablon, marked) snapshot'tan okunur. */
const IS_PKG = typeof process.pkg !== 'undefined';
const EXE_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;
const ASSET_DIR = __dirname;

/* ---------------- Veri evi ----------------
   Kitap exe'nin yanında DEĞİL, kalıcı bir klasörde durur: Belgeler/inkGuide.
   Sebep: exe çoğu kez İndirilenler'de kalır. Kullanıcı onu taşıdığında, yeni
   sürümü başka bir klasöre indirdiğinde ya da İndirilenler temizlendiğinde
   exe'nin yanındaki data/ ile birlikte kitap da "kaybolmuş" görünür.

   Üç istisna, üçü de geriye uyumluluk için:
   1) INKGUIDE_HOME ortam değişkeni verilmişse aynen o kullanılır.
   2) exe'nin yanında tasinabilir.txt varsa taşınabilir moddur (USB bellek) —
      veri exe'nin yanında kalır.
   3) exe'nin yanında zaten data/library.json duruyorsa eski kurulum orada
      çalışmaya devam eder. Arayüz taşımayı TEKLİF eder, kendiliğinden taşımaz:
      kullanıcının verisi haber verilmeden yer değiştirmez. */
const PORTABLE_MARKERS = ['tasinabilir.txt', 'portable.txt'];
const HOME_FOLDER_NAME = 'inkGuide';

// Belgeler klasörü OneDrive'a yönlendirilmiş olabilir; sırayla denenir.
// OneDrive en sona bırakılır: eşzamanlama, otomatik kayıt sırasında çakışma
// dosyası üretebilir — tercih her zaman yerel Belgeler'dir.
function documentsHome() {
  const home = require('os').homedir();
  const candidates = [
    path.join(home, 'Documents'),
    path.join(home, 'Belgeler'),
    path.join(home, 'OneDrive', 'Documents'),
    path.join(home, 'OneDrive', 'Belgeler')
  ];
  for (const dir of candidates) {
    try { if (fs.statSync(dir).isDirectory()) return path.join(dir, HOME_FOLDER_NAME); } catch { /* yoksa sıradaki */ }
  }
  return path.join(home, HOME_FOLDER_NAME);
}

function isPortableInstall() {
  return PORTABLE_MARKERS.some(name => fs.existsSync(path.join(EXE_DIR, name)));
}

function hasStore(dir) {
  return fs.existsSync(path.join(dir, 'data', 'library.json'));
}

/* Dönüş: { dir, mode }. mode arayüzde "verileriniz nerede" metnini seçer. */
function resolveHome() {
  const forced = (process.env.INKGUIDE_HOME || '').trim();
  if (forced) return { dir: path.resolve(forced), mode: 'ortam' };
  if (!IS_PKG) return { dir: __dirname, mode: 'gelistirme' };   // depo içinde çalışırken hiçbir şey değişmez
  if (isPortableInstall()) return { dir: EXE_DIR, mode: 'tasinabilir' };
  if (hasStore(EXE_DIR)) return { dir: EXE_DIR, mode: 'exe-yani' };
  return { dir: documentsHome(), mode: 'belgeler' };
}

/* Yollar taşıma sonrası yeniden hesaplanabilsin diye let; applyHome() tek
   noktadan günceller. Bu değişkenleri okuyan her yer güncel değeri görür. */
let WRITE_DIR, HOME_MODE, DATA_DIR, DATA_FILE, LIBRARY_FILE, BOOKS_DIR, ARCHIVE_DIR, EXPORT_DIR, VERSIONS_DIR, YEDEK_DIR;
const SAMPLE_FILE = path.join(ASSET_DIR, 'data', 'book.sample.json');

function applyHome(dir, mode) {
  WRITE_DIR = dir;
  HOME_MODE = mode;
  DATA_DIR = path.join(WRITE_DIR, 'data');
  DATA_FILE = path.join(DATA_DIR, 'book.json');        // varsayılan (ilk) kitap — YERİNDEN OYNATILMAZ
  LIBRARY_FILE = path.join(DATA_DIR, 'library.json');  // kitaplık kaydı
  BOOKS_DIR = path.join(DATA_DIR, 'books');            // yeni kitaplar buraya
  ARCHIVE_DIR = path.join(BOOKS_DIR, '_arsiv');        // "silinen" kitaplar asla silinmez, buraya taşınır
  EXPORT_DIR = path.join(WRITE_DIR, 'exports');
  VERSIONS_DIR = path.join(WRITE_DIR, 'versions');
  YEDEK_DIR = path.join(WRITE_DIR, 'yedek');
}

{
  const h = resolveHome();
  applyHome(h.dir, h.mode);
}

/* Bu açılışta depo sıfırdan mı oluşturuldu? Arayüz tanıtımı buna bakar:
   localStorage exe'ye değil localhost adresine bağlıdır, yani yeniden indiren
   kullanıcıda "kurulumu gördü" işareti kalır ve tanıtım bir daha açılmazdı. */
const FRESH_STORE = !hasStore(WRITE_DIR);

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
// EXPORT_DIR taşıma sonrası değişebildiği için her istekte güncel değer okunur
app.use('/exports', (req, res, next) => express.static(EXPORT_DIR)(req, res, next));

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

/* ---- Veri evi: yer bilgisi, klasörü açma, taşıma, kayıp kitap kurtarma ----
   Buradaki uçların tek amacı "kitabım nerede?" sorusunu kullanıcı sormadan
   cevaplamak. Hiçbiri veri silmez: taşıma kopyalar, kurtarma içe aktarır. */

// Arayüzün açabileceği klasörler — istemci rastgele yol gönderemesin diye beyaz liste
function knownDirs() {
  return { home: WRITE_DIR, data: DATA_DIR, exports: EXPORT_DIR, versions: VERSIONS_DIR, yedek: YEDEK_DIR };
}

app.get('/api/konum', (req, res) => {
  try {
    res.json({
      home: WRITE_DIR,
      mode: HOME_MODE,
      exeDir: EXE_DIR,
      paketli: IS_PKG,
      // Depo bu açılışta sıfırdan kurulduysa arayüz tanıtımı zorla gösterir
      yeniKurulum: FRESH_STORE,
      klasorler: knownDirs(),
      // Veri exe'nin yanındaysa Belgeler'e taşıma teklif edilir
      onerilenEv: HOME_MODE === 'exe-yani' ? documentsHome() : null
    });
  } catch (e) {
    sendErr(res, e);
  }
});

app.post('/api/konum/ac', (req, res) => {
  try {
    const dir = knownDirs()[String((req.body || {}).hangi || 'home')];
    if (!dir) throw new Error('Bilinmeyen klasör');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const cmd = process.platform === 'darwin' ? ['open', [dir]]
      : process.platform === 'win32' ? ['explorer', [dir]]
        : ['xdg-open', [dir]];
    // execFile: yol kabuk yorumundan geçmez, boşluklu klasör adları güvenlidir
    require('child_process').execFile(cmd[0], cmd[1], () => { /* explorer 1 döndürebilir, sorun değil */ });
    res.json({ ok: true, dir });
  } catch (e) {
    sendErr(res, e);
  }
});

/* Taşıma: exe'nin yanındaki depo Belgeler/inkGuide'a KOPYALANIR; kopya bittikten
   sonra kaynak data/ klasörü "data-tasindi-<zaman>" adına çevrilir. Hiçbir dosya
   silinmez — kopya yarıda kalırsa ad değişmez ve eski kurulum çalışmaya devam eder. */
app.post('/api/konum/tasi', (req, res) => {
  try {
    if (HOME_MODE !== 'exe-yani') throw new Error('Taşınacak bir şey yok: veriler zaten kalıcı bir klasörde');
    const hedef = documentsHome();
    if (hasStore(hedef)) throw new Error('Hedefte zaten bir kitaplık var: ' + hedef + ' — taşıma yerine kitap kurtarmayı kullanın');
    const kaynak = WRITE_DIR;
    fs.mkdirSync(hedef, { recursive: true });
    for (const ad of ['data', 'exports', 'versions', 'yedek']) {
      const src = path.join(kaynak, ad);
      if (fs.existsSync(src)) fs.cpSync(src, path.join(hedef, ad), { recursive: true });
    }
    if (!hasStore(hedef)) throw new Error('Kopya doğrulanamadı, taşıma geri alındı');
    fs.renameSync(path.join(kaynak, 'data'), path.join(kaynak, `data-tasindi-${localStamp()}`));
    applyHome(hedef, 'belgeler');
    console.log(`Veriler taşındı: ${kaynak} -> ${hedef}`);
    res.json({ ok: true, home: WRITE_DIR, eski: kaynak });
  } catch (e) {
    sendErr(res, e);
  }
});

/* ---- Kayıp kitap kurtarma ----
   Eski sürümlerde veri exe'nin yanına yazılıyordu. Kullanıcı yeni sürümü başka
   bir klasöre indirdiğinde uygulama boş açılır ve kitap "kaybolmuş" görünür.
   Tarama, bilgisayardaki diğer inkGuide depolarını bulup içe aktarmayı teklif eder. */

const TARAMA_ATLA = new Set(['node_modules', '.git', 'AppData', 'Windows', 'Program Files', 'Program Files (x86)', '$Recycle.Bin', 'System Volume Information']);
const TARAMA_DERINLIK = 2;      // <kök>/data, <kök>/*/data, <kök>/*/*/data
const TARAMA_KLASOR_LIMIT = 4000; // devasa ağaçlarda açılışı kilitlememek için

function taramaKokleri() {
  const home = require('os').homedir();
  const adlar = ['Downloads', 'İndirilenler', 'Indirilenler', 'Desktop', 'Masaüstü', 'Masaustu', 'Documents', 'Belgeler', 'OneDrive'];
  const list = [EXE_DIR, documentsHome(), ...adlar.map(a => path.join(home, a))];
  const gorulen = new Set();
  return list.filter(d => {
    const k = path.resolve(d).toLowerCase();
    if (gorulen.has(k) || !fs.existsSync(d)) return false;
    gorulen.add(k);
    return true;
  });
}

// Bir depodaki kitapları özetler (başlık + kelime + son değişiklik)
function depoOzeti(dataDir) {
  const libFile = path.join(dataDir, 'library.json');
  let lib;
  try { lib = JSON.parse(fs.readFileSync(libFile, 'utf8')); } catch { return null; }
  if (!lib || !Array.isArray(lib.books)) return null;
  const books = [];
  for (const entry of lib.books) {
    const file = path.join(dataDir, entry.file || '');
    try {
      const book = JSON.parse(fs.readFileSync(file, 'utf8'));
      books.push({
        id: entry.id,
        title: (book.meta && book.meta.title) || entry.id,
        words: countBookWords(book),
        updatedAt: fs.statSync(file).mtime.toISOString()
      });
    } catch { /* okunamayan kayıt atlanır, tarama durmaz */ }
  }
  if (!books.length) return null;
  return { klasor: dataDir, books, toplamKelime: books.reduce((n, b) => n + b.words, 0) };
}

app.get('/api/kurtarma/tara', (req, res) => {
  try {
    const bulunan = [];
    const gorulenDepo = new Set([path.resolve(DATA_DIR).toLowerCase()]);
    let sayac = 0;

    const bak = (dir, derinlik) => {
      if (sayac++ > TARAMA_KLASOR_LIMIT) return;
      const aday = path.join(dir, 'data');
      const anahtar = path.resolve(aday).toLowerCase();
      if (!gorulenDepo.has(anahtar) && fs.existsSync(path.join(aday, 'library.json'))) {
        gorulenDepo.add(anahtar);
        const ozet = depoOzeti(aday);
        if (ozet && ozet.toplamKelime > 0) bulunan.push(ozet);
      }
      if (derinlik >= TARAMA_DERINLIK) return;
      let girisler = [];
      try { girisler = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const g of girisler) {
        if (!g.isDirectory() || g.name.startsWith('.') || TARAMA_ATLA.has(g.name)) continue;
        bak(path.join(dir, g.name), derinlik + 1);
      }
    };

    for (const kok of taramaKokleri()) bak(kok, 0);
    // En dolu kitaplık en üstte
    bulunan.sort((a, b) => b.toplamKelime - a.toplamKelime);
    res.json({ depolar: bulunan });
  } catch (e) {
    sendErr(res, e);
  }
});

/* İçe aktarma: seçilen kitaplar mevcut kitaplığa KOPYALANIR. Kaynak klasöre
   dokunulmaz; var olan bir kitabın üzerine yazılmaz. Tek istisna, hiç
   yazılmamış (0 kelime) varsayılan kitaptır — o boş iskeletin üstüne yazılır. */
app.post('/api/kurtarma/aktar', (req, res) => {
  try {
    const { klasor, idler } = req.body || {};
    if (!klasor || !fs.existsSync(path.join(String(klasor), 'library.json'))) {
      throw new Error('Geçerli bir inkGuide veri klasörü değil');
    }
    if (path.resolve(String(klasor)).toLowerCase() === path.resolve(DATA_DIR).toLowerCase()) {
      throw new Error('Kaynak ve hedef aynı klasör');
    }
    const kaynakDepo = depoOzeti(String(klasor));
    if (!kaynakDepo) throw new Error('Kaynak kitaplık okunamadı');
    const secili = Array.isArray(idler) && idler.length
      ? kaynakDepo.books.filter(b => idler.includes(b.id))
      : kaynakDepo.books;
    if (!secili.length) throw new Error('Aktarılacak kitap seçilmedi');

    const kaynakLib = JSON.parse(fs.readFileSync(path.join(String(klasor), 'library.json'), 'utf8'));
    const lib = readLibrary();
    if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });

    // Varsayılan kitap hiç yazılmamışsa ilk aktarılan kitap onun yerine geçer
    let bosVarsayilan = false;
    try { bosVarsayilan = countBookWords(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))) === 0; } catch { /* okunamıyorsa dokunma */ }

    const aktarilan = [];
    for (const b of secili) {
      const kayit = kaynakLib.books.find(x => x.id === b.id);
      if (!kayit) continue;
      const src = path.join(String(klasor), kayit.file);
      if (!fs.existsSync(src)) continue;

      if (bosVarsayilan) {
        fs.copyFileSync(src, DATA_FILE);
        bosVarsayilan = false;
        aktarilan.push({ id: 'default', title: b.title });
        continue;
      }
      const taban = slugify(b.title);
      let id = taban, i = 2;
      while (id === 'default' || lib.books.some(x => x.id === id)) id = `${taban}-${i++}`;
      const file = 'books/' + id + '.json';
      fs.copyFileSync(src, path.join(DATA_DIR, file));
      lib.books.push({ id, file, color: kayit.color || null, createdAt: new Date().toISOString() });
      aktarilan.push({ id, title: b.title });
    }
    writeLibrary(lib);
    res.json({ ok: true, aktarilan });
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
    console.log(`Kitaplarınız: ${DATA_DIR}`);
    if (HOME_MODE === 'exe-yani') {
      console.log('Not: veriler uygulamanın yanında duruyor. Uygulamayı taşırsanız');
      console.log(`kitaplar geride kalır. Ayarlar > Verilerim nerede ekranından ${documentsHome()} klasörüne taşıyabilirsiniz.`);
    }
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
