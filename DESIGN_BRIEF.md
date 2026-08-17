# Tasarım Brief'i — "Yol Arkadaşı" Kitap Yazma Uygulaması

> Bu dosya ClaudeDesign'a (veya herhangi bir tasarım aracına/tasarımcıya) verilecek iş tanımıdır. Aşağıdaki metni doğrudan prompt olarak kullanın.

---

## Prompt

Sen kıdemli bir ürün tasarımcısısın. **"Yol Arkadaşı"** adında, yazarların kitaplarını planladığı, yazdığı ve yayına hazırladığı **local-first bir masaüstü uygulaması** ve onun web sitesi için eksiksiz bir görsel tasarım sistemi ve yüksek çözünürlüklü ekran tasarımları üreteceksin.

### Ürün felsefesi (tasarımın her kararına sinmeli)

Yazarlar taslaklarının çalınmasından, okunmasından, buluta rehin kalmasından korkar. Bu ürün o korkunun panzehiridir:

- **Local-first:** Kitap kullanıcının bilgisayarında, açık dosya formatında (JSON + Markdown + Word yedeği) durur. Üyelik yok, zorunlu internet yok, sunucuya giden veri yok. Ana vaat: **"Kitabınız bilgisayarınızdan çıkmaz."** İkincil vaat: "Yarın biz olmasak bile kitabınız sizde."
- **Ücretsiz + gönüllü destek:** Uygulama tamamen ücretsizdir. Kilitli özellik, deneme süresi, zorunlu rakam YOK. İsteyen "bir kahve ısmarlar" (pay-what-you-want). Ton daima davetkâr ve teşekkür odaklı; asla suçluluk hissi veren karanlık desen (dark pattern) kullanma.
- **His:** Scrivener'ın yapısal gücü + iA Writer'ın sakin yazma deneyimi + Notion'un modern arayüz dili. "Dijital yazı masası."

### Ürün nedir?

Yazı odaklı bir "kitap stüdyosu". Üç panelli çalışma alanı:

- **Sol panel:** kitap iskeleti (kısımlar → bölümler), durum rozetleri (taslak/yazılıyor/bitti), kelime sayıları, hedefe ilerleme çubuğu, hover'da bölüm taşıma okları, sürüm geçmişi ve "Kitaba Dönüştür" düğmesi
- **Orta panel:** bölüm editörü — sinopsis, iki yana yaslı kitap önizlemesi, Markdown taslak, biçim araç çubuğu (kalın/italik/başlık/liste/alıntı), tek tıkla "Editör düzeltmesi" (otomatik ara başlık, madde, blok alıntı, akıllı tırnak) + Geri Al, temiz yapıştırma, atıf ekleme
- **Sağ panel:** "yol arkadaşı" — günün yazma ipucu, kararsız notlar tepsisi (bölüme taşınabilir), istatistikler, otomatik kayıt göstergesi
- **Diğer görünümler:** Karalama Defteri (başlıklı çoklu karalama kartları + karalama editörü), kaynak yöneticisi (APA atıf sistemi), İlk Kitap Rehberi, kitaba dönüştürme (Word/HTML/Markdown; kapak + içindekiler + kaynakça)

### Tasarlanacak ekranlar

**Web sitesi (görevi: güven vermek ve indirtmek):**
1. **Ana sayfa** — hero: "Kitabınızın yol arkadaşı. Kitabınız bilgisayarınızdan çıkmaz." Özellik bölümleri; **"Gönül Rahatlığı"** bölümü: uygulama ücretsizdir, isteyen kahve ısmarlar (☕ bir kahve · ☕☕☕ bir kitap · 💛 destekçi ol — serbest tutar); sosyal kanıt; CTA: **"İndir — ücretsiz"**
2. **Gizlilik Mimarisi sayfası** — "Verileriniz nerede durur?" sorusunun sade, dürüst, yarı-teknik anlatımı; dosya formatı şeması (senin diskin → JSON/MD/Word); "veri rehin tutulmaz" ilkesi
3. **Destek sayfası** — "bir kahve ısmarla" akışı: sıcak, teşekkür tonunda; çapa tutarlar + serbest tutar; destekçilere küçük jest (💛 destekçi rozeti)
4. **İndirme sayfası** — Windows/macOS, sürüm notları, sistem gereksinimleri; kurulum sonrası "ilk 3 adım" önizlemesi

**Masaüstü uygulaması:**
5. **İlk açılış (onboarding)** — 3 adımlık karşılama; en önemli ekran: "Kitabınız bu bilgisayarda saklanır" mesajı + veri klasörü gösterimi; kitap adı/hedef kelime kurulumu
6. **Kitaplığım** — yerel kitap projeleri kartları (kapak rengi/harfi, ilerleme, son düzenleme), yeni kitap oluşturma
7. **Kitap çalışma alanı** — üç panelli ana düzen; **odak modu** (paneller gizlenir, yalnız metin) ve **karanlık mod** varyantlarıyla
8. **Karalama Defteri** — kart galerisi + karalama editörü
9. **Kaynaklar + Kitaba Dönüştür** — kaynak tablosu ve ekleme formu; dönüştürme akışı: format seçimi, kapak önizlemesi, sürüm geçmişi
10. **Uygulama içi destek dokunuşu** — rehber sayfasının sonunda ve "kitap tamamlandı" anında beliren zarif, reddedilmesi kolay "bir kahve ısmarla" kartı (asla pop-up, asla tekrarlayan)

### Tasarım dili

- **His:** edebi ama modern. Kağıt sıcaklığı (krem/kum tonları) + tek güçlü vurgu rengi. Kurumsal SaaS mavisi klişesi yasak.
- **Tipografi:** okuma/önizleme alanlarında serif (Literata / Source Serif 4 benzeri), arayüzde humanist sans (Inter benzeri). Türkçe karakter desteği şart. Kitap önizlemesi iki yana yaslı, otomatik hecelemeli.
- **Boşluk:** cömert. Yazma alanı sahnenin yıldızı; araç çubukları ve paneller geri planda.
- **Bileşen kütüphanesi:** düğmeler (3 varyant), girişler, seçiciler, renk kodlu 5 not türü kartı (not/sentez/alıntı/fikir/görsel), rozetler, ilerleme çubuğu, boş durumlar, yükleme durumları, onay diyalogları, toast bildirimleri, destek/kahve kartı
- **İkonografi:** ince çizgili (Lucide ailesi), 1.5–2px stroke
- **Karanlık mod:** tam destek; kağıt hissini koruyan sıcak koyu tonlar (saf siyah değil)
- **Erişilebilirlik:** WCAG AA kontrast, klavye navigasyonu, odak halkaları
- **Responsive:** uygulama masaüstü öncelikli; web sitesi tam responsive (mobilde de kusursuz)
- **Dil:** Türkçe öncelikli, i18n'e hazır (metinler uzayabilir)

### Teslimat

1. Tasarım token'ları (renk, tipografi ölçeği, boşluk, radius, gölge)
2. Bileşen kütüphanesi (tüm durumlarıyla)
3. 10 ekranın yüksek çözünürlüklü tasarımı (web ekranları mobil varyantlarıyla)
4. Ekran 7'nin odak modu + karanlık mod varyantları
5. Mikro-etkileşim notları (otomatik kayıt, not taşıma, editör geçişi, kahve kartının beliriş anı)

### Başarı ölçütü

Bir yazar ana sayfayı gördüğünde iki şeye aynı anda inanmalı: **"Burada kitabımı yazmak isterim"** ve **"Buraya kitabımı emanet edebilirim."** İlham: iA Writer'ın sükûneti, Linear'ın işçilik kalitesi, Readwise Reader'ın okuma tipografisi, Obsidian'ın güven duruşu.
