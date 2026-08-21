# inkGuide site kaynağı

`public/site/` ELLE DÜZENLENMEZ — tamamı bu klasörden üretilir.

1. Metin değişikliği: `translations/<dil>.json` içindeki değeri düzenle (anahtarlar İngilizce, düz yapı; `en.json` referanstır).
2. Yeni dil: `translations/<kod>.json` oluştur (en.json'u kopyalayıp çevir); dil `tools/build-site.mjs` içindeki `LANGS` listesinde zaten tanımlı. Json'u olmayan diller atlanır.
3. Yapı/tasarım değişikliği: `templates/*.html` (sayfa iskeletleri, `{{anahtar}}` yer tutucularıyla), `partials/` (ortak header/footer/head/meta), `site.css`.
4. Üret: `npm run build:site` (= `node tools/build-site.mjs`) → public/site'ı siler, yeniden yazar (stub yönlendirmeler + site.css dahil) ve yerel linkleri kontrol eder.
5. Üretilen dosyaları commit'le (GitHub Pages public/site'ı statik kopyalar).

## Ölçüm

- Ziyaret sayacı `tools/build-site.mjs` içindeki `GOATCOUNTER` sabitiyle açılıp kapanır; boş bırakılırsa sayfalara hiçbir script girmez. Sayaç açıkken gizlilik sayfasındaki 4. soru (`privacy_qa4_*`) bunu 10 dilde açıklar — **sayacı değiştirirsen o metni de güncelle.**
- İndirme düğmelerindeki `data-goatcounter-click` nitelikleri tıklama olaylarını adlandırır.
- ⚠️ Arama motoru doğrulamasını **DNS TXT** ile yap: bu script `public/site/` klasörünü tamamen sildiği için oraya konan `google*.html` doğrulama dosyası ilk üretimde kaybolur. Zorunlu kalırsan `SEARCH_VERIFY` sabitini kullan.
- Kurulum adımlarının tamamı: [docs/olcum-kurulumu.md](../docs/olcum-kurulumu.md).

## Yapısal veri ve paylaşım görseli

- Her sayfaya JSON-LD gömülür (`jsonLdFor()`): ana sayfa + indirme → `SoftwareApplication`, gizlilik → `FAQPage` (dört soru). Sürüm numarası `package.json`'dan okunur, elle güncellenmez. **Uydurma puan/yorum (`aggregateRating`, `review`) eklenmez** — gerçek değerlendirme olmadan bunlar yanıltıcıdır ve yaptırım sebebidir.
- `og.png` (1200×630) `site-src/og.png` dosyasından kopyalanır. Kaynağı [og-image.html](og-image.html); yeniden üretme yönergesi o dosyanın başındadır. Görsel **dile bağlı cümle taşımaz**, çünkü 10 dilde birden kullanılır — değiştirirsen bu kuralı koru.
- Sosyal ağlar `og:image`'ı agresif önbelleğe alır. Görseli değiştirdiğinde dosya adını da değiştirmen (ör. `og-2.png`) gerekebilir.

## Rehber sayfası (`guide.html`)

Bu sayfanın **gövdesi `site-src/` içinde değildir** — `public/guide/<dil>.json` → `guideHtml` alanından gelir; yani uygulamanın rehberiyle tek kaynaktan beslenir. Rehberi güncellediğinde `npm run build:site` çalıştırman yeterli, site kendiliğinden güncellenir.

`guideBody()` web sürümü için üç şey yapar:

1. Uygulama içi düğmeleri ("Yazmaya dön", "Kaynakları yönet") ve dış sarmalayıcıyı atar.
2. Üst etiketi (`.guide-kicker`) kaldırır ve `<h1>Rehber</h1>` yerine `guide_og_title`'ı koyar — arama sonucunda "Rehber" tek başına hiçbir şey anlatmaz.
3. Kalıntı kontrolü yapar: temizlenmemiş `<button>` veya `editor-inner` kalırsa build hata verip durur.

Bir dilin `public/guide/<dil>.json` dosyası yoksa build **durur**. Bu kasıtlıdır: o dilin sayfası İngilizce içerikle yayımlanırsa `hreflang` yanlış beyan olur. Ya rehberi çevir ya da dili `LANGS`'ten çıkar.
