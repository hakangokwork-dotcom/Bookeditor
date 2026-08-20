#!/usr/bin/env node
/**
 * inkGuide indirme istatistikleri — node tools/download-stats.mjs
 *
 * GitHub Releases API'sinden her sürümün her dosyası için indirme sayısını çeker.
 * Site analitiği "kaç kişi indirme düğmesine bastı"yı sayar; burası "kaç dosya
 * gerçekten indirildi"yi söyler. İkisi arasındaki fark = yarıda kalan indirmeler.
 *
 * Kullanım:
 *   node tools/download-stats.mjs           # tablo
 *   node tools/download-stats.mjs --json    # ham JSON (bir yere kaydetmek için)
 *
 * Not: Kimliksiz istek saatte 60 ile sınırlı. Sık çalıştıracaksan bir kişisel
 * erişim jetonu ver:  GITHUB_TOKEN=ghp_xxx node tools/download-stats.mjs
 */

const REPO = 'hakangokwork-dotcom/Bookeditor';
const asJson = process.argv.includes('--json');

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'inkguide-download-stats',
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, { headers });

if (!res.ok) {
  const hint =
    res.status === 403
      ? ' (saatlik istek sınırı dolmuş olabilir — GITHUB_TOKEN ile deneyin)'
      : res.status === 404
        ? ' (depo adı değiştiyse bu dosyadaki REPO sabitini güncelleyin)'
        : '';
  console.error(`HATA: GitHub API ${res.status} ${res.statusText}${hint}`);
  process.exit(1);
}

const releases = await res.json();

if (!releases.length) {
  console.log('Henüz yayımlanmış bir sürüm yok.');
  process.exit(0);
}

// Dosya adı bazında toplam (sürümler arası) + sürüm bazında döküm
const perAsset = new Map();
const report = releases.map((r) => {
  const assets = (r.assets || []).map((a) => {
    perAsset.set(a.name, (perAsset.get(a.name) || 0) + a.download_count);
    return { name: a.name, downloads: a.download_count, size_mb: +(a.size / 1048576).toFixed(1) };
  });
  return {
    tag: r.tag_name,
    published: r.published_at ? r.published_at.slice(0, 10) : '—',
    prerelease: r.prerelease,
    total: assets.reduce((n, a) => n + a.downloads, 0),
    assets,
  };
});

const grandTotal = report.reduce((n, r) => n + r.total, 0);

if (asJson) {
  console.log(JSON.stringify({ repo: REPO, grandTotal, perAsset: Object.fromEntries(perAsset), releases: report }, null, 2));
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(`\ninkGuide indirmeleri — ${REPO}\n`);

for (const r of report) {
  const flag = r.prerelease ? ' (ön sürüm)' : '';
  console.log(`${r.tag}${flag} · ${r.published} · toplam ${r.total}`);
  if (!r.assets.length) console.log('   (dosya yok)');
  for (const a of r.assets) {
    console.log(`   ${pad(a.name, 34)} ${padL(a.downloads, 7)}  ${padL(a.size_mb + ' MB', 9)}`);
  }
  console.log('');
}

console.log('Dosya bazında toplam (tüm sürümler):');
for (const [name, n] of [...perAsset].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${pad(name, 34)} ${padL(n, 7)}`);
}
console.log(`\nGENEL TOPLAM: ${grandTotal} indirme\n`);
