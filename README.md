# 🧭 Yol Arkadaşı — Kitap Yazma Aracı

Scrivener'dan ilham alan, **tamamen yerel çalışan** yazma/not/sentez aracı. Kitabınız bilgisayarınızdan çıkmaz: veriler diskinizde, açık formatta (JSON + Markdown + Word yedeği) durur; internet ve üyelik gerektirmez.

**Model:** Uygulama ücretsizdir. İşinize yaradıysa gönlünüzden ne koparsa — bir kahve ısmarlayabilirsiniz. ☕

## Başlatma

**En kolayı:** `YolArkadasi.bat` dosyasına çift tıklayın — sunucu başlar ve tarayıcı otomatik açılır. Pencereyi kapatınca uygulama durur (yazdıklarınız zaten anlık kaydedilir).

Alternatif olarak terminalden:

```bash
npm start
```

Ardından tarayıcıda **http://localhost:4321** adresini açın.

## Ne Yapar?

| Panel | İşlev |
|---|---|
| **Sol** | Kitap iskeleti: kısımlar → bölümler, durum rozetleri (taslak/yazılıyor/bitti), kelime sayıları, ilerleme çubuğu |
| **Orta** | Seçili bölümün sinopsisi, Markdown taslağı (önizleme ile) ve not kartları (📌 not · 🔗 sentez · ❝ alıntı · 💡 fikir · 🎨 görsel) |
| **Sağ** | Yol arkadaşı: günün yazma ipucu, istatistikler, otomatik kayıt göstergesi |

- **Notlar kitaba girmez** — size çalışır. NotebookLM çıktılarınızı, okuma notlarınızı, sentezlerinizi bölüm bölüm biriktirin; taslağı bunlara bakarak yazın.
- **Atıf sistemi:** Kaynaklar sayfasından kaynak ekleyin, taslak içinde `[[kaynak:kahneman2011]]` yazın (veya araç çubuğundaki "atıf ekle" menüsünü kullanın). Kitaba dönüştürünce otomatik olarak **(Kahneman, 2011)** olur ve APA formatında **Kaynakça** oluşur.
- **🎤 Sesli not:** Mikrofon düğmesiyle Türkçe konuşun, söyledikleriniz nota veya taslağa yazıya dökülsün (Chrome/Edge; tarayıcının konuşma tanıma servisini kullanır).
- **🧹 Temiz yapıştırma & metin araçları:** Taslak araç çubuğunda **B / I / H / Liste / ❝** biçimlendirme düğmeleri; **Yapıştır** panodaki metni temizleyerek ekler (satır kırıklarını birleştirir, fazla boşlukları ve `[1]` kalıntılarını siler), **Düzelt** aynı temizliği seçili metne veya tümüne uygular.
- **🗒 Karalama Defteri:** Nereye ait olduğuna karar veremediğiniz her şey için serbest alan + kararsız notlar. Hazır olunca notu "bölüme taşı" ile yerine gönderirsiniz.
- **🛟 Güvenlik yedeği:** Her kayıtta kitabın son hali `yedek/kitap-son-hali.md` ve `yedek/kitap-son-hali.docx` olarak da yazılır (notlar ve karalama dahil). Uygulama bir gün hiç açılmasa bile Word dosyasını açıp devam edebilirsiniz.
- **🎨 Görsel fikirler:** Şema, diyagram, illüstrasyon fikirlerinizi "görsel" notu olarak bölüm bölüm biriktirin — kitap tasarımı aşamasında hazır listeniz olur.
- **💾 Versiyonlama:** "Versiyon" düğmesi kitabın anlık görüntüsünü `versions/` klasörüne kaydeder; listeden tek tıkla geri yüklersiniz (geri yükleme öncesi mevcut hal de otomatik saklanır). Export dosyaları da tarih+saat damgalıdır — her çıktı ayrı bir versiyondur.
- **📖 Kitaba Dönüştür:** kapak + içindekiler + önsöz + giriş + bölümler + kaynakça ile üç format üretir: `.md`, `.html` (baskı önizleme) ve `.docx` (Word — açınca "alanları güncelle" onayı verin, içindekiler dolar). Çıktılar `exports/` klasörüne yazılır.
- **🧭 İlk Kitap Rehberi** (sol menünün en üstünde): ilk kitabını yazanlar için süreç önerileri, TDK yazım kuralları, alıntı etiği.

## Verileriniz

Her şey `data/book.json` dosyasında durur (her kayıtta `.bak` yedeği alınır). Yazdıklarınız yalnızca sizin bilgisayarınızda — hiçbir yere gönderilmez. Yedeklemek için bu klasörü kopyalamanız yeterli.
