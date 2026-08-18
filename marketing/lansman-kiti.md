# inkGuide — Lansman Kiti

> Bu dosya kopyala-yapıştır hazır lansman malzemesi içerir: Product Hunt, Show HN ve GitHub README vitrini.
> Her parçanın başında nereye/nasıl gönderileceği yazar. Marka sesi: sakin, dürüst, abartısız.
> Ana vaat: "Your book never leaves your computer." — Ücretsiz, hesap yok, üç panelli sakin yazı masası.

---

## 1. PRODUCT HUNT

### 1.1 İsim satırı
> **Nereye:** producthunt.com/posts/new → "Name of the product" alanı.

```
inkGuide
```

### 1.2 Tagline (58 karakter — sınır 60)
> **Nereye:** Aynı formda "Tagline" alanı. İngilizce, 60 karakter altı.

```
A calm, local-first book-writing studio. Free, no account.
```

Yedek seçenekler (hepsi 60 karakter altı):
- `Your book never leaves your computer` (36)
- `Write your book on a desk that lives on your own disk` (53)

### 1.3 Açıklama (260 karakter)
> **Nereye:** "Description" alanı. Tam 260 karakter; PH sınırı 260.

```
A free book-writing studio that runs entirely on your computer. A calm three-pane desk turns notes into chapters; citations and bibliography build themselves; one click exports Word with cover and TOC. No account, no cloud, 10 languages. Your book stays yours.
```

### 1.4 İlk yorum (maker comment)
> **Nereye:** Ürün yayına girdiği an, ilk yorum olarak gönderilir. Ürün-sesli yazıldı; kurucu adı geçmez.
> **Nasıl:** Yayın gününün ilk saatinde gönderin; gün boyunca gelen her soruya aynı sakin tonda cevap verin.

```
Hi Product Hunt 👋

inkGuide was born out of a book, not a business plan. Its developer was trying to write a book — about the concept of "problem", of all things — and kept bouncing between note apps, word processors and folders of quotes. What was missing wasn't features; it was a calm desk where notes, sources and chapters could live side by side, and where the draft was never held hostage by an account or a cloud.

So inkGuide became that desk:

• Three panes: outline on the left, your text in the middle, notes and tips at your side.
• Notes don't go into the book — they work for it. Quotes, ideas and syntheses gather under each chapter until you're ready to write.
• Type a short source marker in your draft and the export shows (Author, Year) with an APA bibliography built for you.
• One click produces a Word file with cover, table of contents and bibliography. Markdown and HTML too.
• Everything is plain files on your own disk — JSON, Markdown, Word. Delete the app tomorrow and your book stays readable.

Two honest notes, because honesty is the whole point:
1. Voice capture uses the browser's speech recognition, so audio goes to the browser vendor's server while dictating. It's the single exception to the local-first promise, it's optional, and it's documented on the privacy page.
2. The Windows exe is currently unsigned, so SmartScreen may warn you on first launch. The code is open on GitHub and you can run it from source if you prefer.

inkGuide is free — every feature, no trial, no locked buttons. If it earns its keep, you can buy the project a coffee; that switches nothing on or off. The developer is writing their own book in it every day, so the roadmap is simply "whatever a writer actually needs next."

Questions and hard critiques are very welcome — they shape the tool more than praise does.
```

### 1.5 Galeri: 6 ekran görüntüsü önerisi
> **Nereye:** PH galerisi. İlk görsel kapak işlevi görür; 1270×760 veya benzeri yatay oran önerilir.
> Başlıklar görselin üstüne bindirilecek kısa İngilizce metinlerdir.

| # | Ekran | Başlık önerisi |
|---|---|---|
| 1 | Çalışma Alanı (üç panel, bir bölüm açık, sağda not tepsisi) | "Outline left, draft middle, companion at your side" |
| 2 | Kitaba Dönüştür ekranı + üretilen Word çıktısı (kapak/İçindekiler görünür) | "One click: Word with cover, TOC and bibliography" |
| 3 | Kaynaklar sayfası + taslak içinde atıf işaretinin (Author, Year)'a dönüşmüş hali | "Citations that build themselves — APA included" |
| 4 | Karalama Defteri (kart galerisi + kararsız notlar) | "A scratchpad for everything that doesn't have a home yet" |
| 5 | data/ klasörünün dosya gezgininde görünümü (book.json, .docx yedek, versions/) | "Your book is plain files on your own disk" |
| 6 | Karanlık mod veya sade (zen) tam ekran yazma görünümü | "Set to calm — just you and your text" |

Not: Ekran görüntülerinde örnek kitap olarak sitedeki "Slow Cities — Walking Distance" içeriği kullanılabilir (site-src/translations/en.json'daki örnek metinlerle tutarlı olur). Gerçek kişisel kitap verisi asla görünmemeli.

---

## 2. SHOW HN

### 2.1 Başlık
> **Nereye:** news.ycombinator.com/submit → "title" alanı, "url" alanına https://inkguide.uk
> HN kuralı: başlıkta pazarlama sıfatı olmaz, "Show HN:" öneki zorunlu.

```
Show HN: inkGuide – a free, local-first book-writing app in a single exe
```

### 2.2 Gönderi metni
> **Nereye:** Submit formunda "text" alanı (URL ile birlikte metin de eklenebilir; eklenemezse yayından hemen sonra ilk yorum olarak gönderin).

```
inkGuide is a book-writing studio that runs entirely on the user's machine. It grew out of its developer's own book project: the tools that existed were either cloud services that hold your draft, or heavyweight suites. This is an attempt at the smallest honest thing in between.

Technical shape, since that's what matters here:

- Node/Express server + vanilla JS front end (~no framework, no build step). The app is a localhost server; the UI runs in your existing browser.
- Packaged with @yao-pkg/pkg (node22) into one portable exe (~64 MB, no installer). macOS builds (arm64 + intel) come out of GitHub Actions as tar.gz, ad-hoc signed.
- Data model: one JSON file next to the executable. Every save also writes a .bak, plus a mirrored Markdown and Word copy of the whole book, so the draft survives even if the app never opens again. Optional snapshots go to a versions/ folder.
- Citations: type [[kaynak:id]] in the draft; export resolves it to (Author, Year) and generates an APA bibliography. (Yes, the marker keyword is Turkish — the app's first language. It works the same in all 10 UI languages.)
- Export: Word (cover + TOC + bibliography), HTML, Markdown.
- UI and writing guide in 10 languages, including RTL for Arabic.

Why no cloud: the target user is someone writing their first book who is (reasonably) afraid of their draft living on someone else's server. So there is no account, no telemetry, no server-side anything — the website is static pages. If you want cloud backup, the data folder is plain files; drop it in Dropbox/Drive and you're done.

Known honest limitations: the Windows exe is unsigned (SmartScreen warns on first run; you can run from source instead), and the optional voice-dictation feature uses the browser's speech API, which does send audio to the browser vendor — that's documented on the privacy page as the single exception to the local-first promise.

Free, no locked features; there's an optional "buy us a coffee" link. Code: https://github.com/hakangokwork-dotcom/Bookeditor — feedback on the architecture is as welcome as feedback on the product.
```

### 2.3 Muhtemel 5 sert HN sorusu ve hazır cevaplar
> **Nasıl:** Bu cevaplar yorum olarak kopyala-yapıştır edilebilir; soru birebir gelmese de en yakın varyanta uyarlanır. Ton: savunmacı değil, teknik ve dürüst.

**S1. "Why not Electron (or Tauri)? Shipping a Node server that opens a browser tab is weird."**

```
Fair question — it is unusual. The reasoning: Electron would mean bundling Chromium on top of the app for a UI the user's own browser already renders fine; Tauri would mean a Rust toolchain for what is currently a very small JS codebase. The localhost-server approach keeps one codebase for "run from source" and "run the exe", and keeps the whole thing inspectable — you can literally read the server it runs. The tradeoffs are real: it needs a browser installed, and the exe is ~64 MB because it embeds the Node runtime. If the project outgrows this shape, Tauri is the most likely next step.
```

**S2. "No sync? In 2026? So I can't write on two machines?"**

```
Deliberately, for now. Sync is where local-first promises usually go to die, so v1 keeps it simple: the data folder is plain files (JSON + Markdown + Word), so any file-sync tool the user already trusts — Dropbox, Drive, Syncthing — works today. On the roadmap there's an optional end-to-end-encrypted sync, and a mobile capture companion that syncs over the local network via QR — but both as opt-in extras. The core promise ("your book never leaves your computer") stays the default.
```

**S3. "Unsigned exe + 'just click Run anyway' is exactly what malware says. Why should anyone trust this?"**

```
You're right that the pattern is indistinguishable from the bad version of it, and the download page says so in plain words rather than hiding it. What can be offered today: the code is public and small enough to actually read, the exe is built from that repo, and anyone uncomfortable can skip the binary entirely and run from source (npm start). A code-signing certificate is a real cost against a free app's zero revenue; if the project earns enough coffee money, signing is high on the list. On macOS the builds are at least ad-hoc signed. Not a perfect answer — an honest one.
```

**S4. "'Local-first' but dictation sends my voice to Google? That's a contradiction."**

```
It's the one exception, and the privacy page calls it out in its own section rather than burying it. Dictation uses the browser's Web Speech API, so audio goes to the browser vendor's servers while it runs — inkGuide never sees or stores the audio, but that doesn't change where it goes. It's fully optional: never touch the microphone and nothing leaves the machine. The longer-term plan is an on-device model (Whisper-class) so dictation can match the rest of the architecture.
```

**S5. "One JSON file for a whole book? That's a corruption story waiting to happen."**

```
It's a real risk, and the mitigation is layered rather than clever: every save writes a .bak next to the main file, every save also regenerates a full Markdown and Word copy of the book (so the worst case is losing one save, not the manuscript), and there are optional timestamped snapshots in versions/. Exports are timestamped too. The deliberate bet is that a first-time book author is better served by files they can see and copy than by a database they can't open. So far the developer's own book — written daily in the tool — has survived it.
```

---

## 3. GITHUB README VİTRİNİ (taslak — README'yi bu kitten elle güncelleyin)

> **Nereye:** github.com/hakangokwork-dotcom/Bookeditor → README.md.
> **Nasıl:** Mevcut README Türkçe iç-doküman gibidir; aşağıdaki taslak uluslararası vitrindir (EN ana + TR bölüm). Bu kit README'yi DEĞİŞTİRMEZ; içerik hazır olduğunda elle taşınır. `<screenshot>` yerlerine gerçek görseller (docs/ veya .github/ altına konulacak png'ler) eklenmelidir.

### 3.1 Rozet önerileri
> Shields.io ile; hepsi gerçek veriden beslenir, uydurma rakam yok.

```markdown
![Latest release](https://img.shields.io/github/v/release/hakangokwork-dotcom/Bookeditor)
![Downloads](https://img.shields.io/github/downloads/hakangokwork-dotcom/Bookeditor/total)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-555)
![Languages](https://img.shields.io/badge/UI-10%20languages-55663F)
![Local first](https://img.shields.io/badge/data-stays%20on%20your%20disk-55663F)
```

Not: Lisans rozeti eklemeden önce repoda bir LICENSE dosyası olduğundan emin olun (yoksa önce lisans seçilmeli — site "open source" dediği için bu önemli).

### 3.2 README taslağı (tam metin)

````markdown
<p align="center">
  <!-- <img src="docs/logo.png" width="96" alt="inkGuide logo — ink drop with a compass needle"> -->
  <h1 align="center">inkGuide</h1>
  <p align="center"><strong>Your book's companion.</strong><br>
  A calm, local-first book-writing studio. Free, no account — your book never leaves your computer.</p>
</p>

<p align="center">
  <a href="https://inkguide.uk">Website</a> ·
  <a href="https://github.com/hakangokwork-dotcom/Bookeditor/releases/latest/download/inkGuide.exe">Download for Windows</a> ·
  <a href="https://inkguide.uk/download.html">macOS builds</a> ·
  <a href="https://github.com/hakangokwork-dotcom/Bookeditor/discussions">Discussions</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/hakangokwork-dotcom/Bookeditor" alt="Latest release">
  <img src="https://img.shields.io/github/downloads/hakangokwork-dotcom/Bookeditor/total" alt="Downloads">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-555" alt="Platform">
  <img src="https://img.shields.io/badge/UI-10%20languages-55663F" alt="10 languages">
</p>

<!-- SCREENSHOT: three-pane workspace, full width -->
<!-- <img src="docs/screenshot-workspace.png" alt="inkGuide workspace: outline left, draft middle, notes right"> -->

## What is inkGuide?

inkGuide is a writing desk for people working on a book. Outline on the left, your text in the middle, notes and tips at your side. Notes don't go into the book — they work for it: quotes, ideas and syntheses gather under each chapter until you're ready to write.

It is **local-first by design**: no account, no cloud, no telemetry. Your book lives in plain files (JSON, Markdown, Word) on your own disk. Delete the app tomorrow and your manuscript stays readable.

It is **free**: every feature, for everyone — no trial, no locked buttons. If it earns its keep, you can [buy the project a coffee](https://inkguide.uk/support.html); that switches nothing on or off.

## Features

| | Feature | What it does |
|---|---|---|
| 🗂 | **Three-pane studio** | Parts and chapters with status badges and word-count progress; draft with Markdown preview; note cards (note / synthesis / quote / idea / visual) per chapter |
| ✨ | **Editor's pass** | One click turns bare text into subheadings, lists, block quotes and smart quotation marks; clean paste; always undoable |
| 📚 | **Sources & citations** | Type `[[kaynak:id]]` in the draft → export shows *(Author, Year)* and builds an APA bibliography |
| 🎤 | **Voice capture** | Dictate notes and scribbles in 10 languages (browser speech API — see the honest note below) |
| 🗒 | **Scratchpad** | Titled scribble pads + a tray of undecided notes; one move files them into a chapter |
| 📖 | **Book export** | Word (cover + table of contents + bibliography), HTML and Markdown — justified, hyphenated, book-standard pages |
| 🛟 | **Layered backups** | `.bak` on every save + a mirrored `.md`/`.docx` safety copy of the whole book + optional snapshots in `versions/` |
| 🌍 | **10 languages** | UI, writing guide and dictation: EN, TR, ES, ZH, AR (RTL), HI, PT, FR, RU, DE |
| 🌙 | **Set to calm** | Paper-warm theme, dark mode, focus mode and a plain full-screen zen mode |

<!-- SCREENSHOT ROW: export screen · sources page · scratchpad -->

## Download

- **Windows** — [inkGuide.exe](https://github.com/hakangokwork-dotcom/Bookeditor/releases/latest/download/inkGuide.exe) · single portable file, no installer · Windows 10+
- **macOS** — [Apple Silicon](https://github.com/hakangokwork-dotcom/Bookeditor/releases/latest/download/inkGuide-macos-arm64.tar.gz) · [Intel](https://github.com/hakangokwork-dotcom/Bookeditor/releases/latest/download/inkGuide-macos-intel.tar.gz) · macOS 12+
- All versions: [Releases](https://github.com/hakangokwork-dotcom/Bookeditor/releases)

> **First launch:** the Windows exe is currently unsigned, so SmartScreen may warn you — choose "More info → Run anyway". On macOS, right-click → Open. Prefer not to run a binary? Run from source below; it's the same code.

## Run from source

```bash
git clone https://github.com/hakangokwork-dotcom/Bookeditor.git
cd Bookeditor
npm install
npm start        # then open http://localhost:4321
```

On Windows you can also double-click `inkGuide.bat`.

## Where your data lives

Everything sits next to the app in a `data/` folder: one readable `book.json`, a `.bak` on every save, a Word/Markdown safety copy of the whole book, and optional snapshots in `versions/`. Nothing is sent anywhere — the app is a localhost server reachable only from your machine. Details: [Where does your data live?](https://inkguide.uk/privacy.html)

**One honest exception:** optional voice dictation uses the browser's speech recognition, so audio goes to the browser vendor's server while dictating. Never touch the microphone and nothing leaves your computer.

## Tech, briefly

Node/Express + vanilla JS (no framework, no build step). The desktop build packages the server with [@yao-pkg/pkg](https://github.com/yao-pkg/pkg) into a single executable; the UI runs in your default browser. Word export via the `docx` library.

## Feedback

Every feature so far was born from a writer's need — the next one can be yours: [Discussions](https://github.com/hakangokwork-dotcom/Bookeditor/discussions).

---

## Türkçe

**inkGuide**, kitabınız için sakin bir yazı masasıdır: solda iskelet, ortada metniniz, yanınızda notlar. Yerel-öncelikli çalışır — hesap yok, bulut yok; kitabınız bilgisayarınızdan çıkmaz ve açık formatta (JSON + Markdown + Word) diskinizde durur.

Uygulama ücretsizdir; kilitli özellik veya deneme süresi yoktur. İşinize yaradıysa [bir kahve ısmarlayabilirsiniz](https://inkguide.uk/tr/support.html) — hiçbir şeyi açıp kapatmaz.

- **İndir (Windows):** [inkGuide.exe](https://github.com/hakangokwork-dotcom/Bookeditor/releases/latest/download/inkGuide.exe) — kurulumsuz tek dosya
- **Site (Türkçe):** [inkguide.uk/tr](https://inkguide.uk/tr/)
- **Kaynak koddan:** `inkGuide.bat`'a çift tıklayın veya `npm start`
- **Verileriniz:** exe'nin yanındaki `data/` klasöründe; her kayıtta `.bak` + Word güvenlik yedeği. Ayrıntı: [Verileriniz nerede yaşar?](https://inkguide.uk/tr/privacy.html)
- Tek dürüst istisna: sesli not, tarayıcının konuşma tanıma servisini kullanır (ses tarayıcı üreticisinin sunucusuna gider); tamamen isteğe bağlıdır.

Görüş ve önerileriniz için: [Discussions](https://github.com/hakangokwork-dotcom/Bookeditor/discussions)
````

### 3.3 Vitrine geçiş için yapılacaklar listesi
> README taslağı yayına alınmadan önce:

1. `docs/` (veya `.github/assets/`) altına ekran görüntüleri: workspace, export, sources, scratchpad (PH galerisiyle aynı görseller kullanılabilir; kişisel kitap verisi görünmesin).
2. Logo png'sini repoya ekleyip yorum satırındaki `<img>`'i açın.
3. LICENSE dosyası yoksa lisans seçip ekleyin; sonra lisans rozeti eklenebilir.
4. macOS sürümlerinin Releases'ta gerçekten `inkGuide-macos-arm64.tar.gz` / `inkGuide-macos-intel.tar.gz` adlarıyla yayında olduğunu doğrulayın (bağlantılar site-src/templates/download.html ile birebir aynı).
5. Repo "About" alanına: `Free, local-first book-writing studio — your book never leaves your computer` + website `https://inkguide.uk` + topics: `writing`, `local-first`, `book`, `nodejs`, `markdown`, `docx`.
