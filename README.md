# 🧭 Yol Arkadaşı — Kitap Yazma Aracı

Scrivener'dan ilham alan, **tamamen yerel çalışan** yazma/not/sentez aracı. Kitabınız bilgisayarınızdan çıkmaz: veriler diskinizde, açık formatta (JSON + Markdown + Word yedeği) durur; internet ve üyelik gerektirmez.

**Model:** Uygulama ücretsizdir. İşinize yaradıysa gönlünüzden ne koparsa — bir kahve ısmarlayabilirsiniz. ☕

## Başlatma

**En kolayı:** [inkguide.uk](https://inkguide.uk)'dan tek dosya `inkGuide.exe`'yi indirin — kurulumsuz, çift tıklayın yeter. Kaynak koddan çalıştırmak için `inkGuide.bat` dosyasına çift tıklayın — sunucu başlar ve tarayıcı otomatik açılır. Pencereyi kapatınca uygulama durur (yazdıklarınız zaten anlık kaydedilir).

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

## Verileriniz nerede durur?

Yazdıklarınız yalnızca sizin bilgisayarınızda — hiçbir yere gönderilmez. Kitap `data/book.json` dosyasında tutulur (her kayıtta `.bak` yedeği alınır); yedeklemek için veri klasörünü kopyalamanız yeterli.

**Veri evi**, uygulamanın nasıl çalıştırıldığına göre seçilir:

| Durum | Verilerin yeri |
|---|---|
| İndirilen `inkGuide.exe` | `Belgeler/inkGuide/` — exe'nin yanı **değil** |
| Exe'nin yanında eski bir `data/library.json` varsa | olduğu yerde kalır; uygulama Belgeler'e taşımayı teklif eder, kendiliğinden taşımaz |
| Exe'nin yanında `tasinabilir.txt` varsa | exe'nin yanı (USB bellek için taşınabilir mod) |
| `INKGUIDE_HOME` ortam değişkeni | aynen o klasör |
| Depodan `npm start` | depo klasörü (geliştirme; hiçbir şey değişmez) |

Veri neden exe'nin yanında değil: exe çoğu kez İndirilenler'de kalır. Kullanıcı onu taşıdığında, yeni sürümü başka bir klasöre indirdiğinde ya da İndirilenler temizlendiğinde yanındaki `data/` ile birlikte kitap da "kaybolmuş" görünüyordu.

**Kayıp kitap kurtarma:** depo sıfırdan kurulduysa uygulama açılışta bilgisayarda başka bir inkGuide kitaplığı arar (İndirilenler, Masaüstü, Belgeler, OneDrive ve exe klasörü; iki alt klasör derinliğine kadar) ve bulursa aktarmayı teklif eder. Aynı taramayı istediğiniz zaman **Ayarlar → Başka klasördeki kitabı bul** ile çalıştırabilirsiniz. Aktarma kopyalar; kaynak klasördeki dosyalara dokunulmaz.

Tam yolları uygulama içinde **Ayarlar → Verilerim nerede?** bölümünde görür, klasörleri oradan tek tıkla açarsınız.
