// Tarayıcı sürümünü (inkguide.uk/app) üretir: masaüstü arayüzü + public/web.js.
// Kullanım: node tools/build-webapp.mjs <hedef-klasör>   (CI: _site/app)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) { console.error('Kullanım: node tools/build-webapp.mjs <hedef-klasör>'); process.exit(1); }

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(out, to)), { recursive: true });
  fs.cpSync(path.join(ROOT, from), path.join(out, to), { recursive: true });
};

copy('public/app.js', 'app.js');
copy('public/i18n.js', 'i18n.js');
copy('public/style.css', 'style.css');
copy('public/web.js', 'web.js');
copy('public/guide', 'guide');
copy('lib/export.js', 'export.js');
copy('data/book.sample.json', 'book.sample.json');
copy('node_modules/marked/marked.min.js', 'vendor/marked.min.js');
copy('node_modules/docx/build/index.iife.js', 'vendor/docx.js');

// /app/ altında çalışsın diye kök-mutlak vendor yolu göreli olur; web.js app.js'ten önce yüklenir
let html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const before = html;
html = html
  .replace('src="/vendor/marked.min.js"', 'src="vendor/marked.min.js"')
  .replace('<script src="i18n.js"></script>', '<script src="web.js"></script>\n  <script src="i18n.js"></script>');
if (html === before || !html.includes('src="web.js"') || html.includes('"/vendor/')) {
  console.error('index.html beklenen biçimde değil — web.js eklenemedi');
  process.exit(1);
}
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('Web sürümü hazır:', out);
