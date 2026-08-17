# Tasarım Brief'i — "Yol Arkadaşı" Kitap Yazma Platformu

> Bu dosya ClaudeDesign'a (veya herhangi bir tasarım aracına/tasarımcıya) verilecek iş tanımıdır.

---

## Prompt

Sen kıdemli bir ürün tasarımcısısın. **"Yol Arkadaşı"** adında, yazarların kitaplarını planladığı, yazdığı ve yayına hazırladığı bir web uygulaması (SaaS) tasarlayacaksın. Mevcut çalışan bir MVP var; senden **eksiksiz bir görsel tasarım sistemi ve yüksek çözünürlüklü ekran tasarımları** bekliyorum.

### Ürün nedir?

Yazı odaklı bir "kitap stüdyosu": Scrivener'ın yapısal gücü + iA Writer'ın sakin yazma deneyimi + Notion'un modern arayüz dili. Kullanıcılar üyelik açar, birden fazla kitap projesi oluşturur, her kitapta:

- **Sol panel:** kitap iskeleti (kısımlar → bölümler), durum rozetleri (taslak/yazılıyor/bitti), kelime sayıları, hedefe ilerleme çubuğu, sürüm geçmişi
- **Orta panel:** bölüm editörü — sinopsis, iki yana yaslı kitap önizlemesi, Markdown taslak, biçimlendirme araç çubuğu (kalın/italik/başlık/liste/alıntı), tek tıkla "Editör düzeltmesi" (otomatik ara başlık, madde, blok alıntı, akıllı tırnak), temiz yapıştırma, atıf ekleme
- **Sağ panel:** "yol arkadaşı" — günün yazma ipucu, kararsız notlar tepsisi (bölüme sürükle/taşı), istatistikler, otomatik kayıt göstergesi
- **Diğer sayfalar:** Karalama Defteri (başlıklı çoklu karalamalar, kart görünümü), Kaynak yöneticisi (APA), İlk Kitap Rehberi, kitaba dönüştürme (Word/HTML/Markdown çıktı)

### Tasarlanacak ekranlar

1. **Pazarlama ana sayfası** — ana vaat: "Kitabınızın yol arkadaşı. Kitabınız bilgisayarınızdan çıkmaz." (local-first konumlandırma: veriler kullanıcının diskinde, internet gerekmez, açık dosya formatı — yarın biz olmasak bile kitabınız sizde). Hero, özellik bölümleri, **fiyatlandırma yerine "Gönül Rahatlığı" bölümü**: uygulama ücretsizdir, isteyen "bir kahve ısmarlar" (gönlünden ne koparsa / pay-what-you-want). Zorunlu rakam, kilitli özellik, deneme süresi YOK. Önerilen nazik seçenekler: ☕ bir kahve · ☕☕☕ bir kitap · 💛 destekçi ol (serbest tutar). İsteğe bağlı gelecek hizmet olarak uçtan uca şifreli senkron aboneliği ayrı ve küçük gösterilebilir. Sosyal kanıt, CTA: "İndir — ücretsiz"
2. **Kayıt / Giriş** — e-posta + Google ile; sade, tek kolon
3. **Kitaplığım (dashboard)** — kitap kartları (kapak rengi/harfi, ilerleme, son düzenleme), yeni kitap oluşturma sihirbazı (tür seçimi, hedef kelime)
4. **Kitap çalışma alanı** — yukarıdaki üç panelli düzen; odak modu (paneller gizlenir, sadece metin); karanlık mod
5. **Karalama Defteri** — kart galerisi + karalama editörü
6. **Kaynaklar** — tablo + ekleme formu + atıf önizlemesi
7. **Kitaba Dönüştür** — çıktı formatı seçimi, kapak önizlemesi, dışa aktarma geçmişi (sürümler)
8. **Destek sayfası** — "bir kahve ısmarla" akışı: sıcak, teşekkür tonunda; tutar seçenekleri + serbest tutar; destekçilere küçük bir jest (uygulama içi 💛 destekçi rozeti). Asla suçluluk hissi veren karanlık desen (dark pattern) kullanma

### Tasarım dili

- **His:** edebi ama modern; "dijital yazı masası". Kağıt sıcaklığı (krem/kum tonları) + tek güçlü vurgu rengi. Asla soğuk kurumsal SaaS mavisi klişesi olmasın.
- **Tipografi:** Okuma/önizleme alanlarında serif (Source Serif 4 / Literata benzeri), arayüzde humanist sans (Inter/Söhne benzeri). Türkçe karakter desteği şart. Kitap önizlemesi iki yana yaslı, otomatik hecelemeli.
- **Boşluk:** cömert. Yazma alanı sahnenin yıldızı; krom (araç çubukları, paneller) geri planda.
- **Bileşen kütüphanesi:** düğmeler (3 varyant), girişler, seçiciler, not kartları (5 tür: not/sentez/alıntı/fikir/görsel — renk kodlu), rozetler, ilerleme çubuğu, boş durumlar, yükleme durumları, onay diyalogları, toast bildirimleri
- **İkonografi:** ince çizgili (Lucide ailesi), 1.5–2px stroke
- **Karanlık mod:** tam destek; kağıt hissini koruyan sıcak koyu tonlar (saf siyah değil)
- **Erişilebilirlik:** WCAG AA kontrast, klavye navigasyonu, odak halkaları
- **Responsive:** masaüstü öncelikli; tablet'te iki panel, mobilde tek panel + alt sekme çubuğu
- **Dil:** Türkçe öncelikli, i18n'e hazır (metinler uzayabilir)

### Teslimat

1. Tasarım token'ları (renk, tipografi ölçeği, boşluk, radius, gölge)
2. Bileşen kütüphanesi (tüm durumlarıyla)
3. 8 ekranın yüksek çözünürlüklü tasarımı (masaüstü + 4 ve 8 numaralı ekranların mobil hali)
4. Odak modu ve karanlık mod varyantları (ekran 4 için)
5. Mikro-etkileşim notları (otomatik kayıt, not taşıma, editör geçişi animasyonları)

### Başarı ölçütü

Bir yazar ekranı gördüğünde "burada kitabımı yazmak isterim" demeli. İlham: iA Writer'ın sükûneti, Linear'ın işçilik kalitesi, Readwise Reader'ın okuma tipografisi.
