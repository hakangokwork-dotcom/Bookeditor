const express = require('express');
const fs = require('fs');
const path = require('path');
const { exportBook, buildMarkdown, buildDocx, buildNotesAppendix } = require('./lib/export');

const app = express();
const PORT = process.env.PORT || 4321;
const DATA_FILE = path.join(__dirname, 'data', 'book.json');
const EXPORT_DIR = path.join(__dirname, 'exports');
const VERSIONS_DIR = path.join(__dirname, 'versions');
const YEDEK_DIR = path.join(__dirname, 'yedek');

/* Her kayıtta insan-okunur güvenlik yedeği: uygulama bozulsa bile
   yedek/kitap-son-hali.md ve .docx Word'de açılıp devam edilebilir. */
let lastDocxBackup = 0;

async function writeBackups(book, forceDocx = false) {
  try {
    if (!fs.existsSync(YEDEK_DIR)) fs.mkdirSync(YEDEK_DIR, { recursive: true });
    const md = buildMarkdown(book) + buildNotesAppendix(book);
    fs.writeFileSync(path.join(YEDEK_DIR, 'kitap-son-hali.md'), md, 'utf8');
    const now = Date.now();
    if (forceDocx || now - lastDocxBackup > 2 * 60 * 1000) {
      lastDocxBackup = now;
      const buf = await buildDocx(book);
      fs.writeFileSync(path.join(YEDEK_DIR, 'kitap-son-hali.docx'), buf);
    }
  } catch (e) {
    console.error('Yedek yazılamadı:', e.message);
  }
}

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/marked.min.js', (req, res) =>
  res.sendFile(path.join(__dirname, 'node_modules', 'marked', 'marked.min.js'))
);
app.use('/exports', express.static(EXPORT_DIR));

// İlk kurulumda kişisel veri dosyası yoksa şablondan oluştur
if (!fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(path.join(__dirname, 'data', 'book.sample.json'), DATA_FILE);
}

function readBook() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function localStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`;
}

app.get('/api/book', (req, res) => {
  try {
    res.json(readBook());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/book', (req, res) => {
  try {
    // Yedek: her kayıtta son halin bir kopyasını tut
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, DATA_FILE + '.bak');
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    writeBackups(req.body); // arka planda; kaydı bekletmez
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
    const book = readBook();
    const files = await exportBook(book, EXPORT_DIR);
    res.json({ ok: true, files });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ---- Versiyonlama: kitabın anlık görüntüleri ---- */

function listVersions() {
  if (!fs.existsSync(VERSIONS_DIR)) return [];
  return fs.readdirSync(VERSIONS_DIR)
    .filter(f => /^kitap-v[\d-]+(-oncesi)?\.json$/.test(f))
    .sort()
    .reverse();
}

app.get('/api/versions', (req, res) => {
  res.json({ versions: listVersions() });
});

app.post('/api/version', (req, res) => {
  try {
    if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    const stamp = localStamp();
    const file = `kitap-v${stamp}.json`;
    fs.copyFileSync(DATA_FILE, path.join(VERSIONS_DIR, file));
    writeBackups(readBook(), true); // versiyon alırken docx yedeğini de tazele
    res.json({ ok: true, file, versions: listVersions() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/version/restore', (req, res) => {
  try {
    const file = req.body.file || '';
    if (!/^kitap-v[\d-]+(-oncesi)?\.json$/.test(file)) throw new Error('Geçersiz versiyon adı');
    const src = path.join(VERSIONS_DIR, file);
    if (!fs.existsSync(src)) throw new Error('Versiyon bulunamadı');
    // Geri yüklemeden önce mevcut hali de otomatik versiyonla
    if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    const stamp = localStamp();
    fs.copyFileSync(DATA_FILE, path.join(VERSIONS_DIR, `kitap-v${stamp}-oncesi.json`));
    fs.copyFileSync(src, DATA_FILE);
    res.json({ ok: true, book: readBook() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Yol Arkadaşı çalışıyor: http://localhost:${PORT}`);
});
