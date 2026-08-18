# inkGuide site kaynağı

`public/site/` ELLE DÜZENLENMEZ — tamamı bu klasörden üretilir.

1. Metin değişikliği: `translations/<dil>.json` içindeki değeri düzenle (anahtarlar İngilizce, düz yapı; `en.json` referanstır).
2. Yeni dil: `translations/<kod>.json` oluştur (en.json'u kopyalayıp çevir); dil `tools/build-site.mjs` içindeki `LANGS` listesinde zaten tanımlı. Json'u olmayan diller atlanır.
3. Yapı/tasarım değişikliği: `templates/*.html` (sayfa iskeletleri, `{{anahtar}}` yer tutucularıyla), `partials/` (ortak header/footer/head/meta), `site.css`.
4. Üret: `node tools/build-site.mjs` → public/site'ı siler, yeniden yazar (stub yönlendirmeler + site.css dahil) ve yerel linkleri kontrol eder.
5. Üretilen dosyaları commit'le (GitHub Pages public/site'ı statik kopyalar).
