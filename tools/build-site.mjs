#!/usr/bin/env node
/**
 * inkGuide site üretici — node tools/build-site.mjs
 *
 * site-src/ (şablonlar + partial'lar + translations/<dil>.json) kaynağından
 * public/site/ klasörünü TAMAMEN üretir:
 *   - Kök (/)      = İngilizce 4 sayfa (index, privacy, support, download)
 *   - /<dil>/      = diğer diller, aynı 4 dosya adı
 *   - Eski URL stub'ları (gizlilik.html, destek.html, indir.html, en/index.html)
 *   - site.css kopyası
 * translations/ içinde json'u olmayan diller sessizce atlanır.
 * Sonda basit yerel link kontrolü yapar; kırık link varsa exit 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'site-src');
const OUT = path.join(ROOT, 'public', 'site');
const SITE = 'https://inkguide.uk';

// ---- Ölçüm ayarları ----
// GoatCounter kodu. https://www.goatcounter.com/signup ile <kod>.goatcounter.com
// hesabını açtıktan sonra buraya yaz. BOŞ BIRAKILIRSA siteye hiçbir script eklenmez.
// Çerez kullanmaz, kişisel veri saklamaz — gizlilik sayfasındaki söz bozulmaz.
const GOATCOUNTER = 'inkguide';

// Arama motoru doğrulaması.
// TERCİH EDİLEN YÖNTEM DNS TXT KAYDIDIR (bkz. docs/olcum-kurulumu.md):
// bu script her çalıştığında public/site/ tamamen silinir, oraya bırakılan
// google1234.html doğrulama dosyası ilk build'de yok olur ve doğrulama düşer.
// Aşağısı yalnızca DNS'e erişilemeyen durumlar için kaçış kapısıdır.
const SEARCH_VERIFY = { google: '', bing: '' };

// GoatCounter script etiketi (kod boşsa hiç üretilmez)
const ANALYTICS = GOATCOUNTER
  ? `\n<script data-goatcounter="https://${GOATCOUNTER}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
  : '';

const VERIFY_META = [
  SEARCH_VERIFY.google ? `<meta name="google-site-verification" content="${SEARCH_VERIFY.google}">` : '',
  SEARCH_VERIFY.bing ? `<meta name="msvalidate.01" content="${SEARCH_VERIFY.bing}">` : '',
].filter(Boolean).join('\n');

// ---- Dil listesi (sıra = dil seçicideki sıra) ----
const LANGS = [
  { code: 'en', name: 'English',  locale: 'en_US', rtl: false, root: true },
  { code: 'tr', name: 'Türkçe',   locale: 'tr_TR', rtl: false },
  { code: 'es', name: 'Español',  locale: 'es_ES', rtl: false },
  { code: 'zh', name: '中文',      locale: 'zh_CN', rtl: false },
  { code: 'ar', name: 'العربية',  locale: 'ar_SA', rtl: true },
  { code: 'hi', name: 'हिन्दी',    locale: 'hi_IN', rtl: false },
  { code: 'pt', name: 'Português', locale: 'pt_BR', rtl: false },
  { code: 'fr', name: 'Français', locale: 'fr_FR', rtl: false },
  { code: 'ru', name: 'Русский',  locale: 'ru_RU', rtl: false },
  { code: 'de', name: 'Deutsch',  locale: 'de_DE', rtl: false },
];

const PAGES = [
  { slug: 'index',    file: 'index.html',    prefix: 'home' },
  { slug: 'privacy',  file: 'privacy.html',  prefix: 'privacy' },
  { slug: 'support',  file: 'support.html',  prefix: 'support' },
  { slug: 'download', file: 'download.html', prefix: 'dl' },
];

// Eski URL'ler → yeni konumları (hedef dili üretilmişse stub yazılır)
const STUBS = [
  { file: 'gizlilik.html', target: '/tr/privacy.html',  lang: 'tr', title: 'Gizlilik — inkGuide' },
  { file: 'destek.html',   target: '/tr/support.html',  lang: 'tr', title: 'Destek — inkGuide' },
  { file: 'indir.html',    target: '/tr/download.html', lang: 'tr', title: 'İndir — inkGuide' },
  { file: 'en/index.html', target: '/',                 lang: 'en', title: 'inkGuide' },
];

// ---- Yardımcılar ----
const read = (p) => fs.readFileSync(p, 'utf8');
const PARTIALS = {
  head:   read(path.join(SRC, 'partials', 'head.html')),
  meta:   read(path.join(SRC, 'partials', 'meta.html')),
  header: read(path.join(SRC, 'partials', 'header.html')),
  footer: read(path.join(SRC, 'partials', 'footer.html')),
};
const TEMPLATES = Object.fromEntries(
  PAGES.map((p) => [p.slug, read(path.join(SRC, 'templates', p.file))])
);

/** Sayfanın site-kökünden yolu: '/', '/privacy.html', '/tr/', '/tr/download.html' */
function pagePath(lang, page) {
  const dir = lang.root ? '/' : `/${lang.code}/`;
  return page.slug === 'index' ? dir : dir + page.file;
}

/** {{anahtar}} yer tutucularını çöz; partial'ların getirdiği anahtarlar için çok geçişli. */
function render(template, map, ctxLabel, missing) {
  let out = template;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(/\{\{([a-z0-9_]+)\}\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(map, key) ? map[key] : m
    );
    if (next === out) break;
    out = next;
  }
  for (const m of out.matchAll(/\{\{([a-z0-9_]+)\}\}/g)) {
    missing.add(`${ctxLabel}: {{${m[1]}}}`);
  }
  return out;
}

// ---- Çevirileri yükle (json'u olmayan dil atlanır) ----
const built = [];
for (const lang of LANGS) {
  const p = path.join(SRC, 'translations', `${lang.code}.json`);
  if (!fs.existsSync(p)) continue;
  try {
    lang.dict = JSON.parse(read(p));
    built.push(lang);
  } catch (e) {
    console.error(`HATA: ${lang.code}.json okunamadı: ${e.message}`);
    process.exit(1);
  }
}
if (!built.length) {
  console.error('HATA: site-src/translations/ altında hiçbir dil bulunamadı.');
  process.exit(1);
}
console.log(`Diller: ${built.map((l) => l.code).join(', ')} (atlanan: ${LANGS.filter((l) => !built.includes(l)).map((l) => l.code).join(', ') || 'yok'})`);

// ---- public/site'ı sıfırdan üret ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync(path.join(SRC, 'site.css'), path.join(OUT, 'site.css'));

const missing = new Set();
let written = 0;

for (const lang of built) {
  const outDir = lang.root ? OUT : path.join(OUT, lang.code);
  fs.mkdirSync(outDir, { recursive: true });

  for (const page of PAGES) {
    const d = lang.dict;

    // hreflang seti: üretilmiş tüm diller + x-default (İngilizce kök)
    const hreflangs = built
      .map((l) => `<link rel="alternate" hreflang="${l.code}" href="${SITE}${pagePath(l, page)}">`)
      .concat(`<link rel="alternate" hreflang="x-default" href="${SITE}${pagePath(built.find((l) => l.root) || built[0], page)}">`)
      .join('\n');

    // Dil seçici (JS'siz ziyaretçi için altbilgide düz linkler de var)
    const selector =
      `<select class="lang-select" aria-label="${d.lang_select_aria || 'Language'}" onchange="if(this.value)location.href=this.value">\n` +
      built
        .map((l) => `        <option value="${pagePath(l, page)}"${l === lang ? ' selected' : ''}>${l.name}</option>`)
        .join('\n') +
      '\n      </select>';

    const footerLangs = built
      .map((l) =>
        l === lang
          ? `<span class="cur" lang="${l.code}">${l.name}</span>`
          : `<a href="${pagePath(l, page)}" lang="${l.code}" hreflang="${l.code}">${l.name}</a>`
      )
      .join('\n    ');

    const computed = {
      lang: lang.code,
      dir_attr: lang.rtl ? ' dir="rtl"' : '',
      css_href: lang.root ? 'site.css' : '../site.css',
      canonical: SITE + pagePath(lang, page),
      og_locale: lang.locale,
      hreflang_links: hreflangs,
      lang_selector: selector,
      footer_lang_links: footerLangs,
      page_title: d[`${page.prefix}_title`],
      page_desc: d[`${page.prefix}_meta_desc`],
      page_og_title: d[`${page.prefix}_og_title`],
      cur_privacy: page.slug === 'privacy' ? ' aria-current="page"' : '',
      cur_support: page.slug === 'support' ? ' aria-current="page"' : '',
      cur_download: page.slug === 'download' ? ' aria-current="page"' : '',
      header_cta_href: page.slug === 'download' ? '#downloads' : 'download.html',
      header_cta_label: page.slug === 'download' ? d.header_cta_download : d.header_cta,
      analytics: ANALYTICS,
      verify_meta: VERIFY_META,
      head: PARTIALS.head,
      meta: PARTIALS.meta,
      header: PARTIALS.header,
      footer: PARTIALS.footer,
    };

    const html = render(TEMPLATES[page.slug], { ...d, ...computed }, `${lang.code}/${page.file}`, missing);
    fs.writeFileSync(path.join(outDir, page.file), html);
    written++;
  }
}

// ---- Eski URL stub'ları ----
for (const stub of STUBS) {
  if (!built.some((l) => l.code === stub.lang)) continue;
  const dest = path.join(OUT, ...stub.file.split('/'));
  // Yeni bir sayfanın üzerine stub yazma (güvenlik kemeri)
  if (fs.existsSync(dest)) {
    console.error(`HATA: stub '${stub.file}' mevcut bir sayfayla çakışıyor.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(
    dest,
    `<!DOCTYPE html>
<html lang="${stub.lang}">
<head>
<meta charset="utf-8">
<title>${stub.title}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${SITE}${stub.target}">
<meta http-equiv="refresh" content="0; url=${stub.target}">
<script>location.replace("${stub.target}")</script>
</head>
<body><p><a href="${stub.target}">${stub.title}</a></p></body>
</html>
`
  );
  written++;
}

// ---- Eksik anahtar raporu ----
if (missing.size) {
  console.warn(`UYARI: ${missing.size} çözülmemiş yer tutucu:`);
  for (const m of [...missing].sort()) console.warn('  ' + m);
}

// ---- Basit yerel link kontrolü ----
function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}
const broken = [];
for (const file of htmlFiles(OUT)) {
  const html = read(file);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let url = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(url)) continue;
    url = url.split('#')[0].split('?')[0];
    if (!url) continue; // yalnız fragment
    let target = url.startsWith('/')
      ? path.join(OUT, ...url.split('/').filter(Boolean))
      : path.resolve(path.dirname(file), url);
    if (url.endsWith('/') || url === '/' ) target = path.join(target, 'index.html');
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) broken.push(`${path.relative(OUT, file)} → ${m[1]}`);
  }
}
if (broken.length) {
  console.error(`HATA: ${broken.length} kırık yerel link:`);
  for (const b of broken) console.error('  ' + b);
  process.exit(1);
}

// ---- sitemap.xml + robots.txt ----
// lastmod = sayfayı üreten kaynakların en yeni değişiklik tarihi — build tarihi DEĞİL.
// (Her build'de değişen bir lastmod arama motorunda güven kaybettirir: tarama sıklığı düşer.)
const mtimeOf = (f) => fs.statSync(f).mtime.getTime();
const SHARED_MTIME = Math.max(
  ...['head', 'meta', 'header', 'footer'].map((n) => mtimeOf(path.join(SRC, 'partials', `${n}.html`))),
  mtimeOf(path.join(SRC, 'site.css'))
);
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

const urls = [];
for (const lang of built) {
  const base = lang.root ? `${SITE}/` : `${SITE}/${lang.code}/`;
  const langMtime = mtimeOf(path.join(SRC, 'translations', `${lang.code}.json`));
  for (const pg of PAGES) {
    urls.push({
      loc: pg.slug === 'index' ? base : `${base}${pg.file}`,
      lastmod: isoDay(Math.max(SHARED_MTIME, langMtime, mtimeOf(path.join(SRC, 'templates', pg.file)))),
    });
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`, 'utf8');

console.log(`Tamam: ${written} dosya + site.css + sitemap.xml + robots.txt → ${path.relative(ROOT, OUT)}`);
