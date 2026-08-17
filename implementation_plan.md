# Implementation Plan — "Yol Arkadaşı" Kitap Yazma Aracı

Amaç: Problem kitabı için Scrivener'dan ilham alan, yerel çalışan, basit bir yazma/not/sentez aracı.

## Dosyalar

- `[NEW] package.json` — express, marked, docx bağımlılıkları
- `[NEW] server.js` — Express sunucu: statik dosyalar + JSON API + export uçları
- `[NEW] lib/export.js` — Kitaba dönüştürme: Markdown, HTML, DOCX (içindekiler, önsöz, kaynakça, atıflar)
- `[NEW] data/book.json` — Veri modeli (kitap üstverisi, kısımlar → bölümler → taslak + notlar, kaynaklar). Önceki sohbette önerilen kitap outline'ı ile önceden doldurulmuş.
- `[NEW] public/index.html` — Üç panelli arayüz (sol: bölüm ağacı, orta: editör + notlar, sağ: sinopsis/kaynaklar/ipuçları)
- `[NEW] public/app.js` — Arayüz mantığı
- `[NEW] public/style.css` — Scrivener benzeri sade görünüm

## Özellikler

1. Kısım/bölüm ağacı: ekle, yeniden adlandır, sil, yukarı/aşağı taşı, durum (taslak/yazılıyor/bitti)
2. Bölüm başına: sinopsis, Markdown taslak metni (önizleme), notlar (not / sentez / alıntı / fikir; alıntılar kaynağa bağlanır)
3. Kaynak yöneticisi: APA benzeri künye; taslak içinde `[[kaynak:id]]` işaretçisi export'ta `(Yazar, Yıl)` atfına dönüşür, kaynakça otomatik oluşur
4. "Kitaba Dönüştür": kapak + içindekiler + önsöz + giriş + kısımlar/bölümler + kaynakça → `exports/` altında .md, .html, .docx
5. Yol arkadaşı paneli: ilk kitabını yazanlar için ipuçları, TDK yazım kuralları hatırlatmaları, kelime sayacı ve ilerleme

## Doğrulama

- Sunucuyu başlat, tarayıcıda arayüzü test et (ekleme/düzenleme/kaydetme)
- Export uç noktasını çağır, üç çıktının da oluştuğunu doğrula
