# Proje Günlüğü — "Yol Arkadaşı" (Bookeditor)

> Bu dosya, projenin doğuşundan bugüne tüm konuşmaların ve kararların özetidir.
> **Üretim aşamasına geçecek ajan için devir dokümanıdır** — tüm bağlam buradadır.
> Repo: https://github.com/hakangokwork-dotcom/Bookeditor

---

## 1. Projenin Doğuşu

Proje sahibi (Hakan Gök, Lean Six Sigma MBB) **"Problem" kavramı üzerine bir kitap** yazmak istedi:
"Problem" kelimesinin etrafındaki kavram uzayını — etimoloji, Wittgenstein, Kahneman (Sistem 1/2),
yanlılıklar, PDCA/DMAIC/A3, TRIZ, gündelik ve ilişkisel problemler — gezen kavramsal bir yolculuk kitabı.
5 kısım + 19 bölümlük bir outline üretildi (kitap verisinde hazır yüklü).

Kitabı yazarken kullanmak için **Scrivener'dan ilham alan yerel bir yazma aracı** istendi.
Araç geliştikçe fikir büyüdü: bu araç bir ürüne, sonra bir platforma dönüşecek.

## 2. Karar Günlüğü (kronolojik)

| # | İstek | Yapılan |
|---|---|---|
| 1 | Kitap outline'ı öner | 5 kısım / 19 bölüm "Problem" kitabı iskeleti (kitap verisine gömüldü) |
| 2 | Yazma aracı geliştir (notlar, sentez, kaynaklar, kitaba dönüştürme, ilk yazar ipuçları) | MVP: Node/Express + vanilla JS, 3 panelli arayüz, not türleri, APA atıf sistemi, md/html/docx export, TDK ipuçları rehberi |
| 3 | Görsel fikir alanı + modern ikonlar + ferahlık + bat ile açılış + çıktı versiyonlama | 🎨 görsel not türü; Lucide SVG ikon seti; YolArkadasi.bat; versions/ anlık görüntü + geri yükleme; saat damgalı exportlar |
| 4 | Temiz yapıştırma + biçim araçları + karalama alanı + her kayıtta kalıcı yedek | Yapıştır/Düzelt temizleyicileri; B-I-H-Liste-❝ araç çubuğu; Karalama Defteri; yedek/kitap-son-hali.md + .docx (Word'de açılabilir güvenlik yedeği, notlar dahil) |
| 5 | Kararsız notlar sağ panelde de dursun | Sağ panel "Kararsız Notlar" tepsisi — her sayfadan hızlı not + bölüme taşıma |
| 6 | Notlara tıklayınca düzenlenebilsin | Yerinde düzenleme (tıkla → düzenle, Ctrl+Enter/blur kaydet, Esc iptal) — 3 yerde de |
| 7 | Karalama defteri: başlıklı, kaydedilip açılabilir karalamalar | Çoklu "pad" yapısı: kart galerisi + karalama editörü; eski metin otomatik taşındı |
| 8 | Editör düzeltmesi düğmesi (alt başlık, madde, alıntı — pro editör) | ✨ Editör: otomatik ara başlık, madde listesi, blok alıntı, tanım vurgusu (**terim** —), akıllı tırnak “ ”, …, paragraf onarımı; Geri Al; idempotent |
| 9 | Kitap standardı hizalama | İki yana yaslı (justified) + otomatik heceleme: önizleme + HTML + docx |
| 10 | Bölümler taşınabilsin | Sidebar hover ↑↓ okları; kısım sınırını aşan taşıma; kısımların kendisi de taşınır |
| 11 | GitHub'a push + web sitesi vizyonu + tasarım brief'i | Repo pushlandı (kişisel kitap verisi ve telifli Resources/ hariç tutuldu); DESIGN_BRIEF.md yazıldı |
| 12 | İş modeli: taslak çalınma korkusuna çözüm | **Karar: local-first masaüstü uygulama** (Obsidian/Scrivener modeli) — "Kitabınız bilgisayarınızdan çıkmaz" |
| 13 | Fiyat: ücretsiz + gönlünden ne koparsa | **Karar: pay-what-you-want ("bir kahve ısmarla")** — zorunlu rakam/kilit/deneme yok; karanlık desen yasak |
| 14 | Brief'i bu modele göre güncelle | DESIGN_BRIEF.md baştan yazıldı: SaaS/üyelik çıktı; güven odaklı site (gizlilik mimarisi, destek, indirme) + masaüstü ekranları |
| 15 | Sesli not + 10 dil | 🎤 Web Speech API dikte (3 noktada mikrofon); dikte dili seçici (10 dil); brief'e 10 dilli arayüz + RTL gereksinimi |
| 16 | Tasarım geldi (Claude Design), uygulamaya geçildi | **Marka: inkGuide** (mürekkep damlası + pusula ibresi logosu). Tasarım sistemi çalışma alanına giydirildi: kağıt/mürekkep/zeytin paleti (paper #FAF8F3, accent #55663F), Source Serif 4 + Source Sans 3, yeni gölge/radius token'ları, odak halkaları, otomatik kayıt soluklaşması. Tasarım kaynağı: claude.ai/design projesi 49d77b91… (11 ekran: Pazarlama, Kitaplığım, Kurulum, Çalışma Alanı, Karalama, Kaynaklar, Kitaba Dönüştür, Rehber, Ayarlar, Mobil, Tasarım Sistemi) |

**Alan adı kararı:** Resmi web adresi **https://inkguide.uk** (17.08.2026). Site, indirme bağlantıları ve iletişim bu alan adı üzerinden sunulacak.

## 3. Mevcut Mimari (MVP)

```
server.js          Express: statik + JSON API + export/versiyon/yedek uçları
lib/export.js      Kitaba dönüştürme: Markdown, HTML, DOCX (docx lib); atıf çözümleme; notlar eki
public/index.html  3 panelli tek sayfa arayüz
public/app.js      Tüm arayüz mantığı (~1200 satır, framework yok)
public/style.css   Tasarım (krem/kum palet, Lucide ikonlar, kart dili)
data/book.json     TEK veri dosyası (gitignore'da; sample'dan bootstrap edilir)
data/book.sample.json  Yeni kullanıcı şablonu
YolArkadasi.bat    Çift tıkla başlatma (Node kontrolü + npm install + tarayıcı)
```

**Veri modeli (book.json):** `meta` (başlık/yazar/hedef kelime) · `frontmatter` (önsöz/giriş/teşekkür)
· `parts[] → chapters[]` (id, title, status: taslak|yazılıyor|bitti, synopsis, draft, notes[])
· `notes[]` (type: not|sentez|alinti|fikir|gorsel, text, sourceId, page)
· `sources[]` (APA künye; taslakta `[[kaynak:id]]` → export'ta "(Yazar, Yıl)" + otomatik Kaynakça)
· `scratch` (pads[]: başlıklı karalamalar; notes[]: kararsız notlar)

**API:** GET/PUT `/api/book` · POST `/api/export` · GET `/api/versions` · POST `/api/version` · POST `/api/version/restore`

**Veri güvenliği katmanları:** her kayıtta book.json.bak · versions/ anlık görüntüleri ·
yedek/kitap-son-hali.md+.docx (her kayıtta, Word'de açılabilir, notlar+karalamalar dahil) · saat damgalı exportlar

## 4. Ürün Kararları (değiştirilemez çekirdek)

1. **Local-first:** Veri kullanıcının diskinde, açık formatta (JSON+MD+Word). Üyelik yok, zorunlu internet yok. Ana vaat: **"Kitabınız bilgisayarınızdan çıkmaz."**
2. **Ücretsiz + gönüllü destek:** Kilitli özellik/deneme süresi yok; "bir kahve ısmarla" (PWYW). Uygulama içinde kahve kartı yalnızca rehber sonu + kitap bitişinde, asla pop-up.
3. **10 dil:** Türkçe, English, Español, 中文, العربية, हिन्दी, Português, Français, Русский, Deutsch. Dikte de aynı dillerde. Arapça için RTL.
4. **Gelecek gelir kapıları (isteğe bağlı):** uçtan uca şifreli senkron aboneliği; yayına hazırlama hizmetleri. Asla zorunlu değil.

## 5. Şu Anki Durum ve Süreç

- ✅ MVP çalışıyor (proje sahibi aktif olarak kitabını bu araçla yazıyor — gerçek dogfooding)
- ✅ Repo GitHub'da, kişisel içerik ve telifli materyal dışarıda
- ✅ Tasarım Claude Design'da tamamlandı (marka: **inkGuide**); tasarım sistemi çalışma alanı arayüzüne uygulandı
- ✅ **Çok ajanlı üretim turu tamamlandı (17.08.2026):** pazarlama sitesi (public/site/: ana sayfa + gizlilik + destek + indir; inkguide.uk canonical/OG etiketleriyle) · çoklu kitap "Kitaplığım" (data/library.json, güvenli migrasyon, arşivleme) · Kurulum sihirbazı + Ayarlar · 10 dilli i18n (public/i18n.js, 231+ anahtar × 10 dil, Arapça RTL) · tasarım sadakat turu (Çalışma Alanı/Karalama/Kaynaklar/Rehber tasarıma çekildi)
- ✅ **FAZ 1 TAMAM: indirilebilir program** — `npm run build:exe` → `dist/inkGuide.exe` (64 MB, kurulumsuz tek dosya; @yao-pkg/pkg, node22-win-x64). Paketli modda veri exe'nin YANINDA `data/` klasörüne yazılır; port doluysa sıradakini dener; açılışta tarayıcıyı kendisi açar
- ✅ **inkGuide.exe v1.0.0 GitHub Releases'ta** (odak modu + karanlık mod + Kitaba Dönüştür tam ekranı dahil son sürüm)
- ✅ **Site yayında:** GitHub Pages Actions ile otomatik dağıtım (push'ta), özel alan adı inkguide.uk tanımlı — kullanıcının alan adı kayıt firmasında DNS A kayıtlarını (185.199.108/109/110/111.153) + www CNAME (hakangokwork-dotcom.github.io) girmesi bekleniyor
- ✅ **Global ürün turu (18.08.2026):** Site 10 dilde ve varsayılan İngilizce yayında (site-src/ şablon + tools/build-site.mjs üretici; kök=EN, /tr…/de klasörleri, dil seçici, hreflang, sitemap/robots, eski URL stub'ları). Uygulama varsayılan dili İngilizce; inkGuide.bat (İng.); evrensel yazarlık rehberi + 24 günün ipucu **10 dilde** (public/guide/<dil>.json, en fallback; TDK bölümü yalnız TR rehberde); yeni kitap iskeleti aktif dilde ("PART I / First Chapter" vb.); indirme sayfası doğrudan exe indiriyor (releases/latest/download). Release exe güncel.
- 🔄 **SONRAKİ İŞ: mobil** (ayrı oturumda v1 hazırlandı — birleştirme + saha testi bekliyor) · Shopier destek linki bekleniyor

## 6. Üretim Aşaması Yol Haritası (güncel öncelik sırası — 17.08.2026)

1. ✅ Tasarımı giydirme (tasarım sistemi çalışma alanına uygulandı)
2. 🔄 Ajan hattında: pazarlama sitesi (public/site/), çoklu kitap (Kitaplığım), Kurulum + Ayarlar, 10 dilli i18n + RTL
3. **FAZ 1 — İNDİRİLEBİLİR PROGRAM (öncelik):** kurulumsuz tek .exe (@yao-pkg/pkg ile Node paketleme; veri klasörü exe'nin yanında yazılabilir konuma alınacak) → GitHub Releases → inkguide.uk/indir bağlantısı. Bu faz bitmeden mobile geçilmeyecek.
4. **SONRAKİ İŞ — MOBİL (unutulmayacak):** PWA "yakalama arkadaşı" (not + sesli not + karalama) → yerel ağ QR senkron (ücretsiz, sunucusuz) → ileride isteğe bağlı E2E şifreli bulut senkron (Pro). Detaylı yaklaşım karar günlüğünde ve tasarım projesindeki Mobil.dc.html'de.
5. Sonrası: inkguide.uk yayına alma (Cloudflare Pages/Vercel), destek bağlantıları (kahve), E2E senkron

## 7. Bilinen Sınırlar / Teknik Notlar

- Dikte, tarayıcının konuşma tanıma servisini kullanır (Chrome/Edge; ses buluta gider) — local-first vaadiyle gerilimi var; sitede dürüstçe açıklanmalı, uzun vadede yerel model (Whisper) değerlendirilebilir
- Tek kullanıcı / tek kitap varsayımı (çoklu kitap üretim aşamasında)
- Word'de içindekiler alanı ilk açılışta "alanları güncelle" onayı ister (docx TableOfContents doğası)
- `Resources/` klasörü (telifli PDF/EPUB kütüphanesi) ve `data/book.json` gitignore'da — ASLA repoya girmemeli
- Sunucu değişiklikleri bat'ın yeniden başlatılmasını gerektirir; arayüz değişiklikleri sadece sayfa yenileme
