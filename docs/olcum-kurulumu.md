# Ölçüm kurulumu — inkGuide

Bu belge tek bir soruyu cevaplanabilir kılar: **inkguide.uk aramalarda çıkıyor mu, tıklanıyor mu, indiriliyor mu?**

Üç ayrı kaynak var, üçü ayrı soruya bakar:

| Kaynak | Cevapladığı soru | Maliyet |
|---|---|---|
| Google Search Console | Hangi aramada kaç kez göründüm, kaç tıklama aldım, kaçıncı sıradayım | Ücretsiz |
| Bing Webmaster Tools | Aynısı, Bing/Copilot tarafı | Ücretsiz |
| GoatCounter | Siteye gelen kaç kişi hangi sayfayı açtı, indirme düğmesine bastı mı | Ücretsiz (açık kaynak) |
| `npm run stats` | Dosya gerçekten kaç kez indirildi (GitHub Releases) | Ücretsiz, kurulum yok |

Kodla ilgili kısım bitti; aşağısı bir kez yapılacak elle işler.

---

## 1. GoatCounter hesabı (5 dakika)

Site kodu **`inkguide`** olarak ayarlandı — [tools/build-site.mjs](../tools/build-site.mjs) içindeki `GOATCOUNTER` sabiti. Yani sayfalar `https://inkguide.goatcounter.com/count` adresine sayaç gönderiyor. Bu adresin çalışması için hesabın açılması gerekiyor:

1. <https://www.goatcounter.com/signup> adresine git.
2. **Code** alanına tam olarak `inkguide` yaz (panelin adresi buradan doğar).
3. E-posta + parola ver, kaydol.
4. Panel: <https://inkguide.goatcounter.com>

Farklı bir kod almak zorunda kalırsan (isim doluysa) `GOATCOUNTER` sabitini o kodla güncelle ve `npm run build:site` çalıştır.

**Sayacı tamamen kapatmak** istersen: `const GOATCOUNTER = '';` → yeniden üret. O zaman sayfalara hiçbir script girmez.

### Ne ölçülüyor

- Sayfa görüntülemeleri, ülke, yönlendiren site (referrer), tarayıcı/ekran boyutu.
- **İndirme tıklamaları**, ayrı olay olarak: `indir-windows-kart`, `indir-macos-arm64`, `indir-macos-intel`, `indir-windows-alt`, `indir-tum-surumler`. Panelde bu adlarla görünürler.
- Çerez yok, IP saklanmıyor, kişi bazlı takip yok. Gizlilik sayfasına 10 dilde dürüst bir açıklama eklendi ("Site istatistik topluyor mu?").

---

## 2. Google Search Console (10 dakika + DNS yayılma süresi)

> ⚠️ **Doğrulamayı HTML dosyasıyla yapma.** `tools/build-site.mjs` her çalıştığında `public/site/` klasörünü tamamen siler ve yeniden yazar. Oraya bırakılan `google1234abcd.html` doğrulama dosyası ilk yeniden üretimde yok olur, doğrulama düşer, veri akışı kesilir. **DNS TXT kaydı** bu tuzağa düşmez ve bütün alt alan adlarını birden kapsar.

1. <https://search.google.com/search-console> → **Mülk ekle** → soldaki **Alan adı (Domain)** kutusunu seç (URL öneki değil).
2. `inkguide.uk` yaz.
3. Google bir TXT kaydı verir: `google-site-verification=xxxxxxxx`.
4. Alan adını aldığın firmanın DNS panelinde yeni kayıt:
   - Tür: `TXT`
   - Ad / Host: `@` (yani inkguide.uk'nin kendisi)
   - Değer: Google'ın verdiği satırın tamamı
5. Kaydet, Search Console'da **Doğrula**'ya bas. Yayılma birkaç dakika ile birkaç saat sürebilir; hemen olmazsa ertesi gün tekrar dene.
6. Doğrulandıktan sonra **Sitemaps** bölümüne git ve `sitemap.xml` gir → Gönder.

DNS'e erişemediğin bir durum olursa kaçış kapısı var: [tools/build-site.mjs](../tools/build-site.mjs) içindeki `SEARCH_VERIFY.google` alanına doğrulama kodunu yaz, yeniden üret — meta etiketi 40 sayfaya birden girer ve build'lerden etkilenmez.

### Veriyi nasıl okuyacaksın

Panelde **Performans** sekmesi: *Gösterim* (arama sonucunda kaç kez göründün), *Tıklama*, *TO (CTR)*, *Ortalama konum*. Sorgu / Sayfa / Ülke sekmeleriyle kırılım alınır.

İlk 2–4 hafta boş görünebilir — yeni bir alan adının indekslenmesi zaman alır. Panik yok; **Sayfalar → İndeksleme** ekranında "İndekslenmedi" sebeplerine bak, gerçek sorun oradan çıkar.

---

## 3. Bing Webmaster Tools (5 dakika)

ChatGPT ve Copilot aramaları Bing indeksini kullanıyor; ayrı kurulmaya değer.

1. <https://www.bing.com/webmasters> → giriş yap.
2. **Google Search Console'dan içe aktar** seçeneğini kullan — mülk, doğrulama ve site haritası tek tıkla gelir. (GSC'yi önce kurmanın ikinci sebebi bu.)
3. İçe aktarma çalışmazsa: `inkguide.uk` ekle → doğrulama için ya DNS TXT ya da `SEARCH_VERIFY.bing` sabiti.

---

## 4. İndirme sayıları

```bash
npm run stats          # tablo
npm run stats -- --json  # ham JSON
```

GitHub Releases API'sinden her dosyanın gerçek indirme sayısını çeker. Kimliksiz istek saatte 60 ile sınırlı; sık çalıştıracaksan `GITHUB_TOKEN=... npm run stats`.

**Bu sayı ile GoatCounter'daki tıklama sayısı arasındaki fark anlamlıdır:** tıklama çok, indirme az ise indirme ya yarıda kalıyor ya da SmartScreen uyarısında vazgeçiliyor.

---

## 5. Ne zaman neye bakılır

| Sıklık | Bakılacak | Aranan şey |
|---|---|---|
| Kurulumdan 1 hafta sonra | GSC → Sayfalar | 40 sayfanın kaçı indekslendi |
| Haftalık | GoatCounter | Ziyaretçi var mı, nereden geliyor (referrer) |
| Haftalık | `npm run stats` | İndirme eğrisi |
| Aylık | GSC → Performans → Sorgular | Hangi kelimelerde çıkıyoruz; beklenmedik bir sorgu var mı |
| Aylık | GSC → Ortalama konum | 10–20 aralığındaki sorgular: az emekle ilk sayfaya taşınabilecek olanlar bunlar |

**Ölçüm başlar başlamaz bir taban çizgisi not et.** 20.08.2026 itibarıyla toplam indirme: **3** (v1.0.0). Karşılaştırma yapabilmek için başlangıç noktası lazım.
