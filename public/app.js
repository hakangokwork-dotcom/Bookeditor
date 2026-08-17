/* Yol Arkadaşı — kitap yazma aracı */

let book = null;
let sel = { type: 'guide', id: null }; // chapter | front | sources | guide
let previewMode = false;
let saveTimer = null;
let tipIndex = new Date().getDate();

// Çoklu kitap: aktif kitap kimliği (localStorage'da saklanır; "default" = ilk kitap)
let bookId = localStorage.getItem('inkguide.bookId') || 'default';

const $ = (s) => document.querySelector(s);

// API adresine aktif kitap kimliğini ekler (?bookId=…) — sunucu verilmezse "default" varsayar
const apiUrl = (p) => p + (p.includes('?') ? '&' : '?') + 'bookId=' + encodeURIComponent(bookId);

/* ---------------- İkonlar (Lucide çizgi stili) ---------------- */

const ICONS = {
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  library: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  pen: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  notes: '<path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  sparkles: '<path d="M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8-5.8-1.9 5.8-1.9Z"/>',
  scribble: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  move: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  wand: '<path d="m3 21 9.6-9.6"/><path d="M15.5 3.5 16.5 6l2.5 1-2.5 1-1 2.5-1-2.5L12 7l2.5-1Z"/><path d="M20 12l.5 1.3L22 14l-1.5.7L20 16l-.5-1.3L18 14l1.5-.7Z"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  mic: '<path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4M8 22h8"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
};

function ic(name) {
  return `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;
}

/* ---------------- İpuçları ----------------
   Yazma ipuçları tr + en olarak tutulur; diğer arayüz dillerinde İngilizce gösterilir
   (kapsam dışı karar: uzun içerikler yalnızca tr/en). */

const TIPS_I18N = {};

TIPS_I18N.tr = [
  'İlk taslak mükemmel olmak zorunda değil. Hemingway: "Bütün ilk taslaklar kötüdür." Önce yaz, sonra düzelt.',
  'Her gün küçük bir hedef koyun: 300 kelime bile yılda bir kitap eder. Süreklilik, ilhamdan güçlüdür.',
  'Bölümü bitiremeden bırakmayın — cümlenin ortasında bırakın. Yarın nereden başlayacağınızı bilmek, boş sayfa korkusunu yener.',
  'Alıntı yaparken kaynağı ANINDA kaydedin. "Sonra bulurum" dediğiniz kaynak asla bulunamaz.',
  'Yazarken düzeltmeyin. Yazma ve düzeltme farklı zihinsel modlardır; ikisini aynı anda yapmak ikisini de yavaşlatır.',
  '"de/da" bağlacı ayrı yazılır: "ben de geldim". Bulunma eki "-de/-da" bitişik: "evde kaldım". Emin değilseniz: cümleden çıkarınca anlam bozuluyorsa bitişiktir.',
  '"ki" bağlacı ayrı yazılır: "öyle ki", "diyorlar ki". Aitlik eki "-ki" bitişiktir: "benimki", "sabahki".',
  'Uzun cümleleri bölün. Bir cümle bir fikir taşısın. Okuyucu nefes alsın.',
  'Her bölümün sinopsisini önce yazın — bölümün "vaadi" netleşir, yazarken pusulanız olur.',
  'Pasif cümlelerden kaçının. "Problem tanımlandı" yerine "Ekip problemi tanımladı" daha canlıdır.',
  'Okuyucunuza bir kişi gibi yazın: tek bir hayali okuyucu seçin ve ona anlatın.',
  'Bölüm biterken bir sonraki bölüme köprü kurun — okuyucunun "bir bölüm daha" demesini sağlayan budur.',
  'Sayılar: metin içinde küçük sayılar yazıyla ("beş yöntem"), istatistikler rakamla ("%69") yazılır.',
  'İlk kitapta kapsamı daraltın: her şeyi anlatan kitap, hiçbir şeyi anlatamaz. Tezinize hizmet etmeyen bölümü çıkarın.',
  'Sesli okuyun. Kulağınıza takılan cümle, okuyucuya da takılır.',
  'Yabancı terimleri ilk geçtiği yerde Türkçesiyle birlikte verin: "kuluçka etkisi (incubation)".',
  'Araştırma tuzağına dikkat: araştırmak yazmak gibi hissettirir ama değildir. Zamanınızın çoğu yazmaya gitsin.',
  'Bir paragraf = bir fikir. Paragraf uzadıysa muhtemelen iki fikir anlatıyorsunuz.',
  'Kitabın sesi sizsiniz: MBB deneyiminizden gerçek sahneler anlatın. Okuyucu yöntemi unutur, hikâyeyi hatırlar.',
  'Noktalama: "vb." ve "vs." kısaltmalarından sonra nokta gelir; cümle sonundaysa ikinci nokta konmaz.',
  'Bitti demeden önce dinlendirin: taslağı en az bir hafta bekletip yabancı gözüyle okuyun.',
  'Geri bildirim alın ama herkesin her dediğini yapmayın. Sorun teşhisi doğru, önerilen çözüm çoğu zaman yanlıştır.'
];

TIPS_I18N.en = [
  'Your first draft does not have to be perfect. Hemingway: "The first draft of anything is bad." Write first, polish later.',
  'Set a small daily goal: even 300 words a day makes a book in a year. Consistency beats inspiration.',
  'Do not stop at the end of a chapter — stop mid-sentence. Knowing where to pick up tomorrow defeats the blank page.',
  'Record the source the MOMENT you quote it. The source you plan to "find later" is never found.',
  'Do not edit while writing. Writing and editing are different mental modes; doing both at once slows both down.',
  'Watch its/it\'s: "its" is possessive, "it\'s" means "it is". If you can say "it is", use the apostrophe.',
  'Watch affect/effect: "affect" is usually the verb, "effect" the noun ("the change affected us", "it had an effect").',
  'Break up long sentences. One sentence should carry one idea. Let the reader breathe.',
  'Write each chapter\'s synopsis first — the chapter\'s "promise" becomes clear and guides you while writing.',
  'Avoid passive voice. "The problem was defined" is weaker than "The team defined the problem."',
  'Write to one person: pick a single imaginary reader and tell them the story.',
  'End each chapter with a bridge to the next — that is what makes readers say "one more chapter".',
  'Numbers: spell out small numbers in prose ("five methods"), use digits for statistics ("69%").',
  'Narrow the scope of your first book: a book that explains everything explains nothing. Cut chapters that do not serve your thesis.',
  'Read your text aloud. A sentence that trips your tongue will trip your reader too.',
  'Introduce foreign or technical terms with a plain-language explanation the first time they appear.',
  'Beware the research trap: researching feels like writing, but it is not. Spend most of your time writing.',
  'One paragraph = one idea. If a paragraph runs long, it probably carries two ideas.',
  'The voice of the book is you: tell real scenes from your own experience. Readers forget methods, they remember stories.',
  'Punctuation: an ellipsis has three dots, not five…',
  'Before calling it done, let it rest: put the draft away for at least a week and reread it with fresh eyes.',
  'Ask for feedback but do not obey every note. The diagnosis is usually right; the proposed fix is usually wrong.'
];

const TIPS = TIPS_I18N[I18N_LANG === 'tr' ? 'tr' : 'en'];

/* ---------------- Rehber içeriği ----------------
   Rehber tr + en olarak tutulur; diğer arayüz dillerinde İngilizce gösterilir. */

const GUIDE_HTML_TR = `
<div class="editor-inner guide">
  <div class="guide-kicker">İlk kitabını yazanlar için</div>
  <h1>Rehber</h1>
  <p class="guide-lead">Bu araç, notlarınızı bölümlere dönüştürüp kitabınıza doğru yürümeniz için tasarlandı. Soldan bir bölüm seçin, notlarınızı (NotebookLM çıktıları, sentezler, alıntılar) o bölüme ekleyin; hazır olduğunuzda taslağı yazın.</p>

  <h2>Önerilen çalışma akışı</h2>
  <div class="guide-steps">
    <div class="guide-step"><div class="guide-num">1</div><p><b>Topla.</b> NotebookLM'den ve okumalarınızdan çıkan her şeyi ilgili bölüme <i>not</i> olarak ekleyin. Düşünmeyin, biriktirin.</p></div>
    <div class="guide-step"><div class="guide-num">2</div><p><b>Sentezle.</b> Notlar birikince "bu bölümün ana fikri ne?" sorusuna cevap veren <i>sentez</i> notları yazın. Şema, diyagram ve illüstrasyon fikirlerinizi <i>görsel</i> notu olarak kaydedin — kitap tasarımı aşamasında hazır bir görsel listeniz olur.</p></div>
    <div class="guide-step"><div class="guide-num">3</div><p><b>Yaz.</b> Sentezlere bakarak taslağı yazın. Notlar sağ elinizin altında, taslak önünüzde. Dışarıdan metin getirirken <b>Yapıştır</b> satır kırıklarını ve kalıntıları temizler; <b>Düzelt</b> aynı temizliği seçili metne uygular. <b>B / I / H / Liste / ❝</b> düğmeleri seçili metni biçimlendirir.</p></div>
    <div class="guide-step"><div class="guide-num">4</div><p><b>Dinlendir ve düzelt.</b> Bölümü "bitti" işaretlemeden önce en az bir hafta bekletin, sonra yabancı gözüyle okuyun.</p></div>
  </div>
  <div class="guide-tipbox"><b>Kararsız mısınız?</b> Nereye ait olduğunu bilmediğiniz her şeyi <b>Karalama Defteri</b>'ne atın; hazır olunca notu "bölüme taşı" ile yerine gönderin.</div>
  <div class="guide-tipbox"><b>🎤 Sesli not:</b> Not alanlarının ve taslak araç çubuğunun yanındaki mikrofon düğmesine tıklayıp konuşun — söyledikleriniz yazıya dökülür; tekrar tıklayınca durur. <i>(Konuşma tanıma tarayıcının servisiyle çalışır; Chrome/Edge gerekir ve ilk kullanımda mikrofon izni ister.)</i></div>

  <h2>Sık karışan yazım kuralları (TDK)</h2>
  <div class="kural"><b>de / da:</b> Bağlaç ise ayrı ("ben de geldim"), bulunma eki ise bitişik ("evde"). Test: çıkarınca cümle bozuluyorsa bitişiktir.</div>
  <div class="kural"><b>ki:</b> Bağlaç ise ayrı ("öyle ki"), aitlik eki ise bitişik ("seninki", "akşamki"). İstisna kalıplar: "sanki, oysaki, çünkü, hâlbuki, mademki, meğerki, belki".</div>
  <div class="kural"><b>Soru eki mı/mi:</b> Her zaman ayrı yazılır: "geldi mi?", "problem mi?"</div>
  <div class="kural"><b>Birleşik fiiller:</b> "hissetmek, kaybetmek, reddetmek" bitişik; "fark etmek, terk etmek, söz etmek" ayrı.</div>
  <div class="kural"><b>Sayılar:</b> Metinde küçük sayılar yazıyla ("üç yöntem"), ölçüm ve istatistikler rakamla ("%69", "55 dakika").</div>
  <div class="kural"><b>Noktalama:</b> Virgülle bağlanan uzun cümleler yerine kısa cümleler kurun. Üç nokta üçtür, beş değil…</div>

  <h2>Alıntı ve kaynak etiği</h2>
  <ul>
    <li>Birebir alıntı → tırnak içinde + kaynak + sayfa numarası. Kitapta 40 kelimeyi geçen alıntılar blok alıntı olur.</li>
    <li>Fikir aktarımı (kendi cümlelerinizle) da kaynak ister — intihalin en yaygın türü "parafraz edip kaynak vermemektir".</li>
    <li>Taslak içinde <code>[[kaynak:kahneman2011]]</code> yazın; kitaba dönüştürünce otomatik olarak <b>(Kahneman, 2011)</b> olur ve Kaynakça'ya girer.</li>
    <li>İkincil alıntıdan kaçının: "Kahneman'ın aktardığına göre Simon..." yerine mümkünse asıl kaynağa gidin.</li>
    <li>Söylenmiş sözleri doğrulayın: Einstein'a atfedilen sözlerin çoğu Einstein'a ait değildir. (Kitabınız için harika bir yan hikâye!)</li>
  </ul>

  <h2>Kitabın yapısı</h2>
  <div class="guide-cards">
    <div class="guide-card"><div class="t">Önsöz</div><div class="d">Kitabın hikâyesi: neden ve kime yazdınız. Genelde en son yazılır.</div></div>
    <div class="guide-card"><div class="t">Giriş</div><div class="d">Vaat ve okuma haritası. Okuyucu iki sayfada "bu kitap bana ne verecek?" cevabını almalı.</div></div>
    <div class="guide-card"><div class="t">Bölümler</div><div class="d">Her bölüm tek bir soruya cevap versin; o soruyu sinopsis alanına yazın.</div></div>
    <div class="guide-card"><div class="t">Kaynakça</div><div class="d">Otomatik oluşur; siz kaynakları girip atıf işaretçilerini kullanın.</div></div>
  </div>

  <h2>Kitaba dönüştürünce ne olur?</h2>
  <p>Sol alttaki <b>"Kitaba Dönüştür"</b> düğmesi kitabınızı üç formatta üretir: <b>Markdown</b> (ham metin), <b>HTML</b> (okumalık/baskı önizleme) ve <b>Word (.docx)</b> — kapak, içindekiler, önsöz, giriş, bölümler ve APA formatında kaynakça ile. Word dosyasını açınca içindekileri güncellemeyi onaylayın (alanlar otomatik dolar). Dosya adları tarih + saat damgalıdır; her dönüştürme ayrı bir çıktı versiyonudur.</p>

  <h2>Versiyonlama ve güvenlik yedeği</h2>
  <p><b>"Versiyon"</b> düğmesi kitabın o anki halinin anlık görüntüsünü <code>versions/</code> klasörüne kaydeder. Büyük bir değişiklikten (bölüm silme, yeniden yapılandırma) önce bir versiyon alın; listeden tek tıkla <b>geri yükleyebilirsiniz</b> — geri yükleme öncesi mevcut hal de otomatik versiyonlanır, hiçbir şey kaybolmaz.</p>
  <p><b>Emekler asla boşa gitmez:</b> her kayıtta kitabınızın son hali <code>yedek/kitap-son-hali.md</code> ve <code>yedek/kitap-son-hali.docx</code> dosyalarına da yazılır — notlarınız ve karalama defteriniz dahil. Bu uygulama bir gün hiç açılmasa bile, o Word dosyasını açıp kaldığınız yerden devam edebilirsiniz.</p>

  <div class="guide-cta">
    <button class="cta-primary" id="guideWrite">Yazmaya dön</button>
    <button class="cta-secondary" id="guideSources">Kaynakları düzenle</button>
  </div>
</div>`;

const GUIDE_HTML_EN = `
<div class="editor-inner guide">
  <div class="guide-kicker">For first-time book writers</div>
  <h1>Guide</h1>
  <p class="guide-lead">This tool is designed to turn your notes into chapters and walk you toward your book. Pick a chapter on the left, add your notes (NotebookLM outputs, syntheses, quotes) to it; when you are ready, write the draft.</p>

  <h2>Suggested workflow</h2>
  <div class="guide-steps">
    <div class="guide-step"><div class="guide-num">1</div><p><b>Collect.</b> Add everything that comes out of NotebookLM and your readings to the relevant chapter as a <i>note</i>. Don't think, accumulate.</p></div>
    <div class="guide-step"><div class="guide-num">2</div><p><b>Synthesize.</b> Once notes pile up, write <i>synthesis</i> notes answering "what is the main idea of this chapter?". Save diagram and illustration ideas as <i>visual</i> notes — you will have a ready visual list at book-design time.</p></div>
    <div class="guide-step"><div class="guide-num">3</div><p><b>Write.</b> Write the draft with your syntheses in view. When bringing text from outside, the <b>Paste</b> button cleans line breaks and residue; <b>Clean up</b> applies the same cleanup to the selection. The <b>B / I / H / List / ❝</b> toolbar buttons format the selected text.</p></div>
    <div class="guide-step"><div class="guide-num">4</div><p><b>Rest and revise.</b> Let a chapter rest for at least a week before marking it "done", then reread it with fresh eyes.</p></div>
  </div>
  <div class="guide-tipbox"><b>Undecided?</b> Throw anything that has no home yet into the <b>Scratchpad</b>; when it is ready, send it home with "move to chapter".</div>
  <div class="guide-tipbox"><b>🎤 Voice notes:</b> Click the microphone button next to note fields and the draft toolbar and speak — your words become text; click again to stop. <i>(Speech recognition uses the browser's service; Chrome/Edge required, microphone permission asked on first use.)</i></div>

  <h2>Common style pitfalls</h2>
  <div class="kural"><b>its / it's:</b> "its" is possessive ("the book lost its cover"); "it's" is short for "it is". Test: if "it is" fits, use the apostrophe.</div>
  <div class="kural"><b>affect / effect:</b> "affect" is usually a verb ("it affected sales"), "effect" a noun ("a side effect").</div>
  <div class="kural"><b>Question sentences:</b> keep one question per sentence; long chained questions exhaust the reader.</div>
  <div class="kural"><b>Compound verbs & phrasal verbs:</b> keep them consistent; do not mix "set up / setup" as verb and noun.</div>
  <div class="kural"><b>Numbers:</b> spell out small numbers in prose ("three methods"), use digits for measurements and statistics ("69%", "55 minutes").</div>
  <div class="kural"><b>Punctuation:</b> prefer short sentences over long comma-chained ones. An ellipsis has three dots, not five…</div>

  <h2>Quoting & source ethics</h2>
  <ul>
    <li>Verbatim quote → in quotation marks + source + page number. Quotes longer than 40 words become block quotes in the book.</li>
    <li>Paraphrasing (in your own words) also needs a source — the most common form of plagiarism is "paraphrasing without citing".</li>
    <li>Write <code>[[kaynak:kahneman2011]]</code> in the draft; when the book is built it automatically becomes <b>(Kahneman, 2011)</b> and enters the Bibliography.</li>
    <li>Avoid secondary quoting: instead of "According to Kahneman, Simon said…", go to the original source when possible.</li>
    <li>Verify famous sayings: most quotes attributed to Einstein are not Einstein's. (A great side story for your book!)</li>
  </ul>

  <h2>The structure of the book</h2>
  <div class="guide-cards">
    <div class="guide-card"><div class="t">Preface</div><div class="d">The story of the book: why and for whom you wrote it. Usually written last.</div></div>
    <div class="guide-card"><div class="t">Introduction</div><div class="d">The promise and a reading map. Within two pages the reader should know "what will this book give me?".</div></div>
    <div class="guide-card"><div class="t">Chapters</div><div class="d">Each chapter should answer a single question; write that question in the synopsis field.</div></div>
    <div class="guide-card"><div class="t">Bibliography</div><div class="d">Generated automatically — you just enter sources and use citation markers.</div></div>
  </div>

  <h2>What happens when you build the book?</h2>
  <p>The <b>"Build the Book"</b> button at the bottom left produces your book in three formats: <b>Markdown</b> (raw text), <b>HTML</b> (reading/print preview) and <b>Word (.docx)</b> — with cover, table of contents, preface, introduction, chapters and an APA bibliography. When you open the Word file, confirm updating the table of contents (fields fill automatically). File names carry a date + time stamp; every build is a separate output version.</p>

  <h2>Snapshots & safety backup</h2>
  <p>The <b>"Snapshot"</b> button saves the current state of the book into the <code>versions/</code> folder. Take a snapshot before any big change (deleting a chapter, restructuring); you can <b>restore</b> from the list with one click — the current state is also snapshotted automatically before restoring, nothing is ever lost.</p>
  <p><b>Your work is never wasted:</b> on every save the latest state of your book is also written to <code>yedek/kitap-son-hali.md</code> and <code>yedek/kitap-son-hali.docx</code> — including your notes and scratchpad. Even if this app never opens again one day, you can open that Word file and continue where you left off.</p>

  <div class="guide-cta">
    <button class="cta-primary" id="guideWrite">Back to writing</button>
    <button class="cta-secondary" id="guideSources">Manage sources</button>
  </div>
</div>`;

const GUIDE_HTML = I18N_LANG === 'tr' ? GUIDE_HTML_TR : GUIDE_HTML_EN;

/* ---------------- Yardımcılar ---------------- */

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function totalWords() {
  let n = 0;
  for (const p of book.parts) for (const c of p.chapters) n += wordCount(c.draft);
  for (const k of ['onsoz', 'tesekkur', 'giris']) n += wordCount(book.frontmatter[k]);
  return n;
}

function findChapter(id) {
  for (const p of book.parts) {
    const c = p.chapters.find(c => c.id === id);
    if (c) return { part: p, chapter: c };
  }
  return null;
}

function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveCitationsClient(text) {
  return text.replace(/\[\[kaynak:([^\]]+)\]\]/g, (m, id) => {
    const src = book.sources.find(s => s.id === id.trim());
    if (!src) return `(kaynak?: ${id})`;
    const names = src.author.split('&').map(x => x.trim().split(',')[0]).join(' & ');
    return `(${names}, ${src.year})`;
  });
}

/* ---------------- Sesli not (Türkçe dikte) ---------------- */

let activeRecog = null;
let activeMicBtn = null;

// En çok kullanılan 10 dil — dikte bu dillerde çalışır
const DICTE_LANGS = [
  ['tr-TR', 'Türkçe'],
  ['en-US', 'English'],
  ['es-ES', 'Español'],
  ['zh-CN', '中文'],
  ['ar-SA', 'العربية'],
  ['hi-IN', 'हिन्दी'],
  ['pt-BR', 'Português'],
  ['fr-FR', 'Français'],
  ['ru-RU', 'Русский'],
  ['de-DE', 'Deutsch']
];
let dicteLang = localStorage.getItem('dicteLang') || 'tr-TR';

/* Arayüz dili — çeviriler i18n.js'te (I18N/t); buradaki liste yalnızca seçicileri doldurur */
const UI_LANGS = [
  ['tr', 'Türkçe'],
  ['en', 'English'],
  ['es', 'Español'],
  ['zh', '中文'],
  ['ar', 'العربية'],
  ['hi', 'हिन्दी'],
  ['pt', 'Português'],
  ['fr', 'Français'],
  ['ru', 'Русский'],
  ['de', 'Deutsch']
];
let uiLang = localStorage.getItem('uiLang') || 'tr';

// Uygulama sürümü (package.json ile eşleşir)
const APP_VERSION = '1.0.0';

function toggleDictation(btn, insertFn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert(t('alert.noSpeech'));
    return;
  }
  if (activeRecog) {
    const sameBtn = activeMicBtn === btn;
    try { activeRecog.stop(); } catch { /* zaten durmuş */ }
    if (sameBtn) return; // aynı düğme: sadece durdur
  }
  const r = new SR();
  r.lang = dicteLang;
  r.continuous = true;
  r.interimResults = false;
  r.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const t = e.results[i][0].transcript.trim();
        if (t) insertFn(t + ' ');
      }
    }
  };
  r.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      alert(t('alert.micDenied'));
    }
  };
  r.onend = () => {
    btn.classList.remove('recording');
    if (activeRecog === r) { activeRecog = null; activeMicBtn = null; }
  };
  activeRecog = r;
  activeMicBtn = btn;
  btn.classList.add('recording');
  try { r.start(); } catch { /* üst üste start */ }
}

// Bir input alanına dikte metni ekleyen yardımcı
function micAppender(inputEl) {
  return (t) => {
    inputEl.value = (inputEl.value ? inputEl.value.replace(/\s+$/, '') + ' ' : '') + t;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  };
}

/* ---------------- Metin araçları ---------------- */

let draftBinding = null; // aktif taslak alanının { set(v) } bağlantısı

function cleanText(t) {
  let s = t.replace(/\r\n?/g, '\n');
  s = s.replace(/ /g, ' ');                 // kırılmaz boşluk
  s = s.replace(/[ \t]+\n/g, '\n');              // satır sonu boşlukları
  s = s.replace(/^[ \t]*[•▪◦●○]\s*/gm, '- ');    // madde işaretleri → markdown
  s = s.replace(/\[\d{1,3}\]/g, '');             // [12] dipnot/atıf kalıntıları
  s = s.replace(/\n{3,}/g, '\n\n');              // aşırı boş satırlar
  // Paragraf içi tek satır kırıklarını birleştir (markdown satırları hariç)
  const isMdLine = (l) => /^\s*(#{1,6} |[-*] |> |\d+[.)] )/.test(l);
  const out = [];
  for (const line of s.split('\n')) {
    const prev = out.length ? out[out.length - 1] : null;
    if (prev !== null && prev.trim() && line.trim() && !isMdLine(line) && !isMdLine(prev)) {
      out[out.length - 1] = prev.replace(/\s+$/, '') + ' ' + line.trim();
    } else {
      out.push(line);
    }
  }
  s = out.join('\n');
  s = s.replace(/ {2,}/g, ' ');
  return s.trim();
}

function applyDraftEdit(newValue, selStart, selEnd) {
  const ta = $('#draftText');
  if (!ta || !draftBinding) return;
  ta.value = newValue;
  draftBinding.set(newValue);
  scheduleSave();
  ta.focus();
  ta.setSelectionRange(selStart, selEnd);
  const badge = $('.word-badge');
  if (badge) badge.textContent = t('words', { n: wordCount(newValue).toLocaleString(I18N_LOCALE) });
}

function wrapSelection(pre, suf, placeholder) {
  const ta = $('#draftText');
  if (!ta) return;
  const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
  const selected = v.slice(a, b) || placeholder;
  const nv = v.slice(0, a) + pre + selected + suf + v.slice(b);
  applyDraftEdit(nv, a + pre.length, a + pre.length + selected.length);
}

function prefixLines(prefix) {
  const ta = $('#draftText');
  if (!ta) return;
  const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
  const ls = v.lastIndexOf('\n', a - 1) + 1;
  let le = v.indexOf('\n', b);
  if (le === -1) le = v.length;
  const block = v.slice(ls, le).split('\n')
    .map(l => l.trim() ? prefix + l.replace(/^(#{1,4} |> |- )/, '') : l)
    .join('\n');
  const nv = v.slice(0, ls) + block + v.slice(le);
  applyDraftEdit(nv, ls, ls + block.length);
}

function insertAtCursor(text) {
  const ta = $('#draftText');
  if (!ta) return;
  const a = ta.selectionStart;
  const nv = ta.value.slice(0, a) + text + ta.value.slice(ta.selectionEnd);
  applyDraftEdit(nv, a + text.length, a + text.length);
}

async function pasteClean() {
  try {
    const txt = await navigator.clipboard.readText();
    if (!txt) throw new Error('pano boş');
    insertAtCursor(cleanText(txt) + '\n\n');
  } catch {
    alert(t('alert.paste'));
  }
}

function fixDraftText() {
  const ta = $('#draftText');
  if (!ta) return;
  const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
  if (b > a) {
    const cleaned = cleanText(v.slice(a, b));
    applyDraftEdit(v.slice(0, a) + cleaned + v.slice(b), a, a + cleaned.length);
  } else {
    applyDraftEdit(cleanText(v), 0, 0);
  }
}

/* Editör düzeltmesi: metni profesyonel editör gibi yapılandırır.
   1) PDF/kopyala kaynaklı satır kırıklarını paragrafa birleştirir
   2) Yalnız duran kısa satırları ara başlığa (###) çevirir
   3) Ardışık kısa cümle-satırlarını madde listesine çevirir
   4) Fazla boşluk, • işaretleri ve [12] kalıntılarını temizler */
let editorUndoText = null;

function editorPass(text) {
  let s = text.replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/^[ \t]*[•▪◦●○]\s*/gm, '- ')
    .replace(/\[\d{1,3}\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ');

  const isMd = (l) => /^\s*(#{1,6} |[-*] |> |\d+[.)] )/.test(l);
  const endsClosed = (l) => /[.!?…:;"”'»)]$/.test(l.trim());

  // 1) paragraf içi kırıkları birleştir (önceki satır cümle ortasında bitiyorsa)
  const lines = [];
  for (const line of s.split('\n')) {
    const prev = lines.length ? lines[lines.length - 1] : null;
    if (prev !== null && prev.trim() && line.trim() && !isMd(line) && !isMd(prev) && !endsClosed(prev)) {
      lines[lines.length - 1] = prev.replace(/\s+$/, '') + ' ' + line.trim();
    } else {
      lines.push(line);
    }
  }

  // 2) başlık + madde tespiti
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t && !isMd(t)) {
      const prevBlank = out.length === 0 || !out[out.length - 1].trim();
      const nextBlank = i === lines.length - 1 || !lines[i + 1].trim();
      const words = t.split(/\s+/).length;
      // yalnız duran, kısa, cümle gibi bitmeyen satır → ara başlık
      if (prevBlank && nextBlank && words <= 8 && t.length <= 64 && !/[.,;:!…]$/.test(t) && !/^[“"'«]/.test(t)) {
        out.push('### ' + t);
        i++;
        continue;
      }
      // ardışık 2+ kısa cümle-satırı → madde listesi
      let j = i;
      while (j < lines.length) {
        const lj = lines[j].trim();
        if (!lj || isMd(lj) || lj.split(/\s+/).length > 15 || !/[.!?…]$/.test(lj)) break;
        j++;
      }
      if (j - i >= 2) {
        if (!prevBlank) out.push('');
        for (let k = i; k < j; k++) out.push('- ' + lines[k].trim());
        i = j;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }

  // 3) tipografi: … — “akıllı tırnak”
  let result = out.join('\n').trim();
  result = result.replace(/\.\.\./g, '…');
  result = result.replace(/ -- /g, ' — ');
  result = result.replace(/"([^"\n]{2,300})"/g, '“$1”');

  // 4) yalnız duran alıntı paragrafı → blok alıntı
  const rls = result.split('\n');
  result = rls.map((l, idx) => {
    const t = l.trim();
    const prevBlank = idx === 0 || !rls[idx - 1].trim();
    const nextBlank = idx === rls.length - 1 || !rls[idx + 1].trim();
    if (prevBlank && nextBlank && /^[“"].+[”"]$/.test(t) && t.split(/\s+/).length >= 4) {
      return '> ' + t;
    }
    return l;
  }).join('\n');

  // 5) vurgu: tanım maddelerinde terimi kalınlaştır ("- Algı — açıklama" → "- **Algı** — açıklama")
  result = result.replace(/^(- )([^*\n—]{2,40}?)( — )/gm, (m, a, term, dash) =>
    term.trim().split(/\s+/).length <= 4 ? a + '**' + term.trim() + '**' + dash : m);

  return result;
}

function runEditorPass(getText, setText) {
  const current = getText();
  if (!current.trim()) return;
  editorUndoText = current;
  setText(editorPass(current));
}

function draftToolsHtml() {
  return `
    <button class="fmt" data-fmt="bold" title="${esc(t('fmt.boldTip'))}"><b>B</b></button>
    <button class="fmt" data-fmt="italic" title="${esc(t('fmt.italicTip'))}"><i>I</i></button>
    <button class="fmt" data-fmt="h" title="${esc(t('fmt.hTip'))}">H</button>
    <button class="fmt" data-fmt="list" title="${esc(t('fmt.listTip'))}">•&nbsp;${esc(t('fmt.list'))}</button>
    <button class="fmt" data-fmt="quote" title="${esc(t('fmt.quoteTip'))}">❝</button>
    <span class="tool-sep"></span>
    <button id="pasteCleanBtn" title="${esc(t('tool.pasteTip'))}">${ic('clipboard')} ${esc(t('tool.paste'))}</button>
    <button id="fixBtn" title="${esc(t('tool.fixTip'))}">${ic('sparkles')} ${esc(t('tool.fix'))}</button>
    <button id="editorPassBtn" class="editor-btn" title="${esc(t('tool.editorTip'))}">${ic('wand')} ${esc(t('tool.editor'))}</button>
    <button id="editorUndoBtn" title="${esc(t('tool.undoTip'))}">${ic('undo')} ${esc(t('tool.undo'))}</button>
    <button id="draftMic" class="mic" title="${esc(t('tool.micTip'))}">${ic('mic')}</button>`;
}

function bindDraftTools() {
  document.querySelectorAll('.fmt').forEach(btn => {
    btn.onclick = () => {
      const f = btn.dataset.fmt;
      if (f === 'bold') wrapSelection('**', '**', t('fmt.boldPh'));
      else if (f === 'italic') wrapSelection('*', '*', t('fmt.italicPh'));
      else if (f === 'h') prefixLines('### ');
      else if (f === 'list') prefixLines('- ');
      else if (f === 'quote') prefixLines('> ');
    };
  });
  const p = $('#pasteCleanBtn');
  if (p) p.onclick = pasteClean;
  const fx = $('#fixBtn');
  if (fx) fx.onclick = fixDraftText;
  const ep = $('#editorPassBtn');
  if (ep) ep.onclick = () => {
    const ta = $('#draftText');
    if (!ta || !ta.value.trim()) return;
    editorUndoText = ta.value;
    applyDraftEdit(editorPass(ta.value), 0, 0);
    const eu2 = $('#editorUndoBtn');
    if (eu2) eu2.style.display = '';
  };
  const eu = $('#editorUndoBtn');
  if (eu) {
    eu.style.display = editorUndoText === null ? 'none' : '';
    eu.onclick = () => {
      if (editorUndoText === null) return;
      applyDraftEdit(editorUndoText, 0, 0);
      editorUndoText = null;
      eu.style.display = 'none';
    };
  }
  const dm = $('#draftMic');
  if (dm) dm.onclick = () => toggleDictation(dm, (t) => insertAtCursor(t));
}

/* ---------------- Kaydetme ---------------- */

let saveDimTimer = null;

/* Kayıt göstergesi: nokta + metin (tasarım: kaydederken nabız gibi atan yeşil nokta) */
function setSaveIndicator(text, saving) {
  const si = $('#saveIndicator');
  if (!si) return;
  si.classList.toggle('saving', !!saving);
  si.innerHTML = `<span class="save-dot"></span><span>${esc(text)}</span>`;
}

function scheduleSave() {
  const si = $('#saveIndicator');
  si.classList.remove('dim');
  setSaveIndicator(t('save.saving'), true);
  clearTimeout(saveTimer);
  clearTimeout(saveDimTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch(apiUrl('/api/book'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });
      setSaveIndicator(t('save.saved', { time: new Date().toLocaleTimeString(I18N_LOCALE) }), false);
      saveDimTimer = setTimeout(() => si.classList.add('dim'), 4000);
    } catch {
      setSaveIndicator(t('save.error'), false);
    }
    renderSidebar();
    renderStats();
  }, 600);
}

/* Bekleyen kaydı hemen gönderir (dil değişip sayfa yenilenmeden önce veri kaybını önler) */
async function flushSaveNow() {
  clearTimeout(saveTimer);
  if (!book) return;
  try {
    await fetch(apiUrl('/api/book'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    });
  } catch { /* sunucu yoksa sessiz geç */ }
}

/* ---------------- Sol panel ---------------- */

function renderSidebar() {
  $('#bookTitle').textContent = book.meta.title;
  $('#bookSubtitle').textContent = book.meta.subtitle || '';

  const tw = totalWords();
  const target = book.meta.targetWords || 60000;
  const pct = Math.min(100, Math.round((tw / target) * 100));
  $('#progressFill').style.width = pct + '%';
  // Tasarım: sol "x / y kelime", sağ "%z" (iki uçta hizalı)
  $('#progressText').innerHTML =
    `<span>${esc(t('words', { n: tw.toLocaleString(I18N_LOCALE) + ' / ' + target.toLocaleString(I18N_LOCALE) }))}</span>` +
    `<span>${esc(t('progressPct', { pct }))}</span>`;

  const tree = $('#tree');
  tree.innerHTML = '';

  const mkItem = (cls, html, onclick) => {
    const el = document.createElement('div');
    el.className = 'tree-item ' + cls;
    el.innerHTML = html;
    el.onclick = onclick;
    return el;
  };

  tree.appendChild(mkItem('special' + (sel.type === 'guide' ? ' selected' : ''), ic('compass') + ' ' + esc(t('tree.guide')), () => select('guide')));
  tree.appendChild(mkItem('special' + (sel.type === 'front' ? ' selected' : ''), ic('file') + ' ' + esc(t('tree.front')), () => select('front')));
  tree.appendChild(mkItem('special' + (sel.type === 'sources' ? ' selected' : ''), ic('library') + ` ${esc(t('tree.sources'))} (${book.sources.length})`, () => select('sources')));
  const scratchCount = (book.scratch.notes.length || 0) + ((book.scratch.pads || []).length);
  tree.appendChild(mkItem('special' + (sel.type === 'scratch' ? ' selected' : ''), ic('scribble') + ` ${esc(t('tree.scratch'))}${scratchCount ? ` (${scratchCount})` : ''}`, () => select('scratch')));
  tree.appendChild(mkItem('special' + (sel.type === 'settings' ? ' selected' : ''), ic('gear') + ' ' + esc(t('tree.settings')), () => select('settings')));

  const sep = document.createElement('div');
  sep.className = 'tree-sep';
  tree.appendChild(sep);

  for (const part of book.parts) {
    tree.appendChild(mkItem('part-title',
      `<span class="caret">${ic('down')}</span> <span class="chapter-label">${esc(part.title)}</span>
       <span class="row-arrows">
         <button data-pmv="${part.id}|-1" title="${esc(t('tree.partUp'))}">${ic('up')}</button>
         <button data-pmv="${part.id}|1" title="${esc(t('tree.partDown'))}">${ic('down')}</button>
       </span>`,
      () => {}));
    for (const ch of part.chapters) {
      const wc = wordCount(ch.draft);
      const item = mkItem(
        'chapter' + (sel.type === 'chapter' && sel.id === ch.id ? ' selected' : ''),
        `<span class="status-dot status-${ch.status}"></span>
         <span class="chapter-label">${esc(ch.title)}</span>
         ${wc ? `<span class="chapter-words">${wc.toLocaleString(I18N_LOCALE)}</span>` : ''}
         <span class="row-arrows">
           <button data-cmv="${ch.id}|-1" title="${esc(t('tree.chUp'))}">${ic('up')}</button>
           <button data-cmv="${ch.id}|1" title="${esc(t('tree.chDown'))}">${ic('down')}</button>
         </span>`,
        () => select('chapter', ch.id)
      );
      tree.appendChild(item);
    }
  }

  tree.querySelectorAll('[data-cmv]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const [id, dir] = btn.dataset.cmv.split('|');
      const found = findChapter(id);
      if (found) moveChapter(found.part, found.chapter, parseInt(dir, 10));
    };
  });

  tree.querySelectorAll('[data-pmv]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const [id, dir] = btn.dataset.pmv.split('|');
      const i = book.parts.findIndex(p => p.id === id);
      const j = i + parseInt(dir, 10);
      if (i < 0 || j < 0 || j >= book.parts.length) return;
      [book.parts[i], book.parts[j]] = [book.parts[j], book.parts[i]];
      scheduleSave();
      renderSidebar();
    };
  });
}

function select(type, id = null) {
  sel = { type, id };
  previewMode = false;
  if (type === 'scratch') scratchPadId = null;
  renderSidebar();
  renderEditor();
}

/* ---------------- Orta panel ---------------- */

function renderEditor() {
  const ed = $('#editor');
  if (sel.type === 'guide') {
    ed.innerHTML = GUIDE_HTML;
    // Rehber sonu eylem düğmeleri (tasarım: "Yazmaya dön" + "Kaynakları düzenle")
    const gw = $('#guideWrite');
    if (gw) gw.onclick = () => {
      const first = book.parts.flatMap(p => p.chapters)[0];
      if (first) select('chapter', first.id); else select('front');
    };
    const gs = $('#guideSources');
    if (gs) gs.onclick = () => select('sources');
    return;
  }
  if (sel.type === 'front') { renderFront(ed); return; }
  if (sel.type === 'sources') { renderSources(ed); return; }
  if (sel.type === 'scratch') { renderScratch(ed); return; }
  if (sel.type === 'settings') { renderSettings(ed); return; }
  renderChapter(ed);
}

function renderFront(ed) {
  const f = book.frontmatter;
  ed.innerHTML = `
  <div class="editor-inner">
    <h1 class="page-title">${ic('file')} ${esc(t('front.h'))}</h1>
    <div class="field-label">${esc(t('front.onsoz'))} <span style="text-transform:none;font-weight:400">${esc(t('front.onsozHint'))}</span></div>
    <textarea class="draft" id="fmOnsoz" style="min-height:160px" placeholder="${esc(t('front.onsozPh'))}">${esc(f.onsoz)}</textarea>
    <div class="field-label">${esc(t('front.giris'))} <span style="text-transform:none;font-weight:400">${esc(t('front.girisHint'))}</span></div>
    <textarea class="draft" id="fmGiris" style="min-height:160px" placeholder="${esc(t('front.girisPh'))}">${esc(f.giris)}</textarea>
    <div class="field-label">${esc(t('front.tesekkur'))}</div>
    <textarea class="draft" id="fmTesekkur" style="min-height:100px">${esc(f.tesekkur)}</textarea>
  </div>`;
  $('#fmOnsoz').oninput = e => { f.onsoz = e.target.value; scheduleSave(); };
  $('#fmGiris').oninput = e => { f.giris = e.target.value; scheduleSave(); };
  $('#fmTesekkur').oninput = e => { f.tesekkur = e.target.value; scheduleSave(); };
}

/* Kaynağın kaç bölümde kullanıldığını sayar ([[kaynak:id]] işaretçileri) */
function sourceUsage(id) {
  const marker = '[[kaynak:' + id + ']]';
  let n = 0;
  for (const p of book.parts) for (const c of p.chapters) {
    if ((c.draft || '').includes(marker)) n++;
  }
  return n;
}

let srcSelId = null; // atıf önizlemesi için seçili kaynak

function renderSources(ed) {
  const selSrc = book.sources.find(s => s.id === srcSelId) || book.sources[0] || null;

  const rows = book.sources.map(s => {
    const use = sourceUsage(s.id);
    return `
    <tr data-src="${esc(s.id)}" data-search="${esc((s.id + ' ' + s.author + ' ' + s.title).toLowerCase())}" class="${selSrc && selSrc.id === s.id ? 'sel' : ''}">
      <td><code>${esc(s.id)}</code></td>
      <td>${esc(s.author)}</td>
      <td>${esc(s.year)}</td>
      <td><i>${esc(s.title)}</i></td>
      <td class="src-usage">${use ? esc(t('src.usedIn', { n: use })) : esc(t('src.unused'))}</td>
      <td><span class="del-link" data-del="${esc(s.id)}" title="${esc(t('src.del'))}">✕</span></td>
    </tr>`;
  }).join('');

  const usedCount = book.sources.filter(s => sourceUsage(s.id) > 0).length;

  // Atıf önizlemesi (tasarım: metin içi + APA satırı)
  const inTextOf = (s) => s.author.split('&').map(x => x.trim().split(',')[0]).join(' & ') + ', ' + s.year;
  const apaOf = (s) => `${s.author} (${s.year}). ${s.title}.${s.publisher ? ' ' + s.publisher + '.' : ''}`;
  const previewCard = selSrc ? `
        <div class="src-card">
          <div class="src-card-title">${esc(t('src.previewTitle'))}</div>
          <div class="src-mini-label">${esc(t('src.inTextLabel'))}</div>
          <div class="src-sample">${esc(t('src.inTextSample'))} <b>(${esc(inTextOf(selSrc))})</b>.</div>
          <div class="src-mini-label" style="margin-top:16px">${esc(t('src.apaLabel'))}</div>
          <div class="src-apa">${esc(apaOf(selSrc))}</div>
        </div>` : '';

  ed.innerHTML = `
  <div class="editor-inner" style="max-width:940px">
    <h1 class="page-title">${ic('library')} ${esc(t('src.h'))}</h1>
    <p class="page-intro">
      ${t('src.intro')}
    </p>
    <div class="src-toolbar">
      <input id="srcSearch" placeholder="${esc(t('src.searchPh'))}" autocomplete="off">
      <span class="src-count">${esc(t('src.countLine', { n: book.sources.length, used: usedCount }))}</span>
    </div>
    <table class="src-table">
      <thead><tr><th>ID</th><th>${esc(t('src.author'))}</th><th>${esc(t('src.year'))}</th><th>${esc(t('src.title'))}</th><th>${esc(t('src.usage'))}</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" style="color:var(--muted)">${esc(t('src.empty'))}</td></tr>`}</tbody>
    </table>

    <div class="src-layout">
      <div class="src-card">
        <div class="src-card-title">${esc(t('src.formTitle'))}</div>
        <form class="src-form" id="srcForm">
          <div><label>${esc(t('src.author'))}</label><input required name="author" placeholder="${esc(t('src.authorPh'))}"></div>
          <div><label>${esc(t('src.year'))}</label><input required name="year" placeholder="${esc(t('src.yearPh'))}"></div>
          <div class="f-full"><label>${esc(t('src.title'))}</label><input required name="title" placeholder="${esc(t('src.titlePh'))}"></div>
          <div><label>${esc(t('src.pub'))}</label><input name="publisher" placeholder="${esc(t('src.pubPh'))}"></div>
          <div><label>${esc(t('src.type'))}</label><select name="type"><option value="kitap">${esc(t('src.typeBook'))}</option><option value="makale">${esc(t('src.typeArticle'))}</option><option value="web">${esc(t('src.typeWeb'))}</option></select></div>
          <div><label>${esc(t('src.url'))}</label><input name="url" placeholder="${esc(t('src.urlPh'))}"></div>
          <div><label>ID</label><input name="id" placeholder="${esc(t('src.idPh'))}"></div>
          <div class="src-id-hint">${t('src.idHint')}</div>
          <button type="submit">${esc(t('src.add'))}</button>
        </form>
      </div>
      <div class="src-side">
        ${previewCard}
        <div class="src-ethics">
          <div class="t">${esc(t('src.ethicsTitle'))}</div>
          <div class="b">${esc(t('src.ethicsText'))}</div>
        </div>
      </div>
    </div>
  </div>`;

  // Arama: satırları yeniden çizmeden süz (odak kaybolmaz)
  $('#srcSearch').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    ed.querySelectorAll('tbody tr[data-src]').forEach(tr => {
      tr.style.display = !q || tr.dataset.search.includes(q) ? '' : 'none';
    });
  };

  // Satıra tıklayınca atıf önizlemesi o kaynağı gösterir
  ed.querySelectorAll('tbody tr[data-src]').forEach(tr => {
    tr.style.cursor = 'pointer';
    tr.onclick = (e) => {
      if (e.target.closest('[data-del]')) return;
      srcSelId = tr.dataset.src;
      renderSources(ed);
    };
  });

  ed.querySelectorAll('[data-del]').forEach(el => {
    el.onclick = () => {
      if (!confirm(t('src.delConfirm', { id: el.dataset.del }))) return;
      book.sources = book.sources.filter(s => s.id !== el.dataset.del);
      if (srcSelId === el.dataset.del) srcSelId = null;
      scheduleSave();
      renderSources(ed);
    };
  });

  $('#srcForm').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let id = (fd.get('id') || '').trim();
    if (!id) {
      const surname = fd.get('author').split(',')[0].toLowerCase().replace(/[^a-zçğıöşü0-9]/g, '');
      id = surname + fd.get('year').trim();
    }
    if (book.sources.some(s => s.id === id)) { alert(t('src.dupId', { id })); return; }
    book.sources.push({
      id,
      author: fd.get('author').trim(),
      year: fd.get('year').trim(),
      title: fd.get('title').trim(),
      publisher: (fd.get('publisher') || '').trim(),
      url: (fd.get('url') || '').trim(),
      type: fd.get('type')
    });
    srcSelId = id;
    scheduleSave();
    renderSources(ed);
  };
}

const NOTE_TYPES = {
  not: t('note.not'),
  sentez: t('note.sentez'),
  alinti: t('note.alinti'),
  fikir: t('note.fikir'),
  gorsel: t('note.gorsel')
};

/* Not kartına tıklayınca yerinde düzenleme (Ctrl+Enter veya dışarı tıklayınca kaydeder, Esc iptal) */
function makeNoteEditable(el, note, rerender) {
  el.classList.add('editable');
  el.title = t('note.editTip');
  el.onclick = () => {
    const ta = document.createElement('textarea');
    ta.className = 'note-edit';
    ta.value = note.text;
    el.replaceWith(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    ta.style.height = Math.max(70, ta.scrollHeight) + 'px';
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.max(70, ta.scrollHeight) + 'px'; };
    let cancelled = false;
    const done = () => {
      if (!cancelled) {
        const v = ta.value.trim();
        if (v && v !== note.text) { note.text = v; scheduleSave(); }
      }
      rerender();
    };
    ta.onblur = done;
    ta.onkeydown = e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ta.blur();
      if (e.key === 'Escape') { cancelled = true; ta.blur(); }
    };
  };
}

/* ---------------- Karalama Defteri ---------------- */

function chapterOptionsHtml() {
  return book.parts.map(p =>
    `<optgroup label="${esc(p.title)}">` +
    p.chapters.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('') +
    '</optgroup>'
  ).join('');
}

/* Sağ panel tepsisi: kararsız notlar her sayfadan görünür ve taşınır */
function renderScratchTray() {
  const tray = $('#scratchTray');
  if (!tray) return;
  const notes = book.scratch.notes;

  tray.innerHTML = `
    <div class="tray-head">${ic('scribble')} ${esc(t('tray.title'))} <span class="tray-count">${notes.length}</span></div>
    <div class="tray-add">
      <select id="trayType" title="${esc(t('tray.typeTip'))}">
        <option value="not">${esc(t('note.not'))}</option>
        <option value="sentez">${esc(t('note.sentez'))}</option>
        <option value="alinti">${esc(t('note.alinti'))}</option>
        <option value="fikir">${esc(t('note.fikir'))}</option>
        <option value="gorsel">${esc(t('note.gorselShort'))}</option>
      </select>
      <input id="trayText" placeholder="${esc(t('tray.ph'))}">
      <button id="trayMic" class="mic" title="${esc(t('mic.noteTip'))}">${ic('mic')}</button>
    </div>
    <div class="tray-list">
      ${notes.map(n => `
        <div class="tray-card ${n.type}">
          <button class="note-del" data-tray-del="${n.id}" title="${esc(t('del'))}">✕</button>
          <div class="tray-card-text" data-tray-edit="${n.id}">${esc(n.text)}</div>
          <select class="tray-move" data-tray-move="${n.id}" title="${esc(t('tray.moveTip'))}">
            <option value="">${esc(t('tray.moveTo'))}</option>
            ${chapterOptionsHtml()}
          </select>
        </div>`).join('') || `<div class="tray-empty">${esc(t('tray.empty'))}</div>`}
    </div>`;

  const input = $('#trayText');
  input.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text) return;
    book.scratch.notes.unshift({ id: uid('n'), type: $('#trayType').value, text, sourceId: null, page: '' });
    scheduleSave();
    renderScratchTray();
    if (sel.type === 'scratch') renderEditor();
    $('#trayText').focus();
  };

  const trayMic = $('#trayMic');
  if (trayMic) trayMic.onclick = () => toggleDictation(trayMic, micAppender($('#trayText')));

  tray.querySelectorAll('[data-tray-edit]').forEach(el => {
    const note = book.scratch.notes.find(n => n.id === el.dataset.trayEdit);
    if (note) makeNoteEditable(el, note, () => {
      renderScratchTray();
      if (sel.type === 'scratch') renderEditor();
    });
  });

  tray.querySelectorAll('[data-tray-del]').forEach(btn => {
    btn.onclick = () => {
      book.scratch.notes = book.scratch.notes.filter(n => n.id !== btn.dataset.trayDel);
      scheduleSave();
      renderScratchTray();
      if (sel.type === 'scratch') renderEditor();
    };
  });

  tray.querySelectorAll('[data-tray-move]').forEach(selEl => {
    selEl.onchange = () => {
      if (!selEl.value) return;
      const note = book.scratch.notes.find(n => n.id === selEl.dataset.trayMove);
      const target = findChapter(selEl.value);
      if (!note || !target) return;
      book.scratch.notes = book.scratch.notes.filter(n => n.id !== note.id);
      target.chapter.notes.unshift(note);
      scheduleSave();
      renderScratchTray();
      renderSidebar();
      if (sel.type === 'scratch' || (sel.type === 'chapter' && sel.id === target.chapter.id)) renderEditor();
    };
  });
}

let scratchPadId = null;

/* Tek bir karalamanın (pad) editörü */
function renderScratchPad(ed, pad) {
  const sc = book.scratch;
  ed.innerHTML = `
  <div class="editor-inner">
    <button class="back-link" id="padBack">${esc(t('scratch.back'))}</button>
    <div class="chapter-header">
      <input class="chapter-title-input" id="padTitle" value="${esc(pad.title)}" placeholder="${esc(t('scratch.titlePh'))}">
    </div>
    <div class="draft-toolbar">
      ${draftToolsHtml()}
      <span class="word-badge">${esc(t('words', { n: wordCount(pad.text).toLocaleString(I18N_LOCALE) }))}</span>
    </div>
    <textarea class="draft" id="draftText" style="min-height:420px"
      placeholder="${esc(t('scratch.draftPh'))}">${esc(pad.text)}</textarea>
    <div class="small-actions">
      <button id="padDelete" class="danger">${ic('trash')} ${esc(t('scratch.delete'))}</button>
    </div>
  </div>`;

  $('#padBack').onclick = () => { scratchPadId = null; renderEditor(); };
  $('#padTitle').oninput = e => { pad.title = e.target.value; pad.updated = Date.now(); scheduleSave(); };
  const dt = $('#draftText');
  dt.oninput = e => { pad.text = e.target.value; pad.updated = Date.now(); scheduleSave(); };
  draftBinding = { set: v => { pad.text = v; pad.updated = Date.now(); } };
  bindDraftTools();
  $('#padDelete').onclick = () => {
    if (!confirm(t('scratch.delConfirm', { title: pad.title || t('scratch.untitled') }))) return;
    sc.pads = sc.pads.filter(p => p.id !== pad.id);
    scratchPadId = null;
    scheduleSave();
    renderEditor();
    renderSidebar();
  };
}

function renderScratch(ed) {
  const sc = book.scratch;
  const openPad = sc.pads.find(p => p.id === scratchPadId);
  if (openPad) { renderScratchPad(ed, openPad); return; }

  const noteCards = sc.notes.map(n => `
    <div class="note-card ${n.type}">
      <button class="note-del" data-note="${n.id}" title="${esc(t('note.delTip'))}">✕</button>
      <div class="note-type">${n.type === 'gorsel' ? ic('image') : ''}${NOTE_TYPES[n.type] || n.type}</div>
      <div class="note-body" data-editnote="${n.id}">${esc(n.text)}</div>
      <div class="note-move">
        ${ic('move')}
        <select data-move="${n.id}" title="${esc(t('note.moveTip'))}">
          <option value="">${esc(t('scratch.moveTo'))}</option>
          ${chapterOptionsHtml()}
        </select>
      </div>
    </div>`).join('');

  const padCards = sc.pads.map(p => `
    <div class="pad-card" data-pad="${p.id}">
      <button class="note-del" data-pad-del="${p.id}" title="${esc(t('scratch.padDelTip'))}">✕</button>
      <div class="pad-title">${esc(p.title) || esc(t('scratch.untitled'))}</div>
      <div class="pad-preview">${esc((p.text || '').slice(0, 180)) || esc(t('scratch.emptyPad'))}</div>
      <div class="pad-meta">${esc(t('words', { n: wordCount(p.text) }))}${p.updated ? ' · ' + new Date(p.updated).toLocaleDateString(I18N_LOCALE) : ''}</div>
    </div>`).join('');

  ed.innerHTML = `
  <div class="editor-inner">
    <h1 class="page-title">${ic('scribble')} ${esc(t('scratch.h'))}</h1>
    <p class="page-intro">
      ${t('scratch.intro')}
    </p>

    <div class="field-label">${ic('pen')} ${esc(t('scratch.pads'))} (${sc.pads.length})</div>
    <div class="pad-grid">
      <div class="pad-card pad-new" id="padNew">${ic('plus')}<span>${esc(t('scratch.new'))}</span></div>
      ${padCards}
    </div>

    <div class="notes-section">
      <div class="field-label">${ic('notes')} ${esc(t('scratch.notesLabel'))} (${sc.notes.length}) <span class="hint">${esc(t('scratch.notesHint'))}</span></div>
      <div class="note-add">
        <select id="noteType">
          <option value="not">${esc(t('note.not'))}</option>
          <option value="sentez">${esc(t('note.sentez'))}</option>
          <option value="alinti">${esc(t('note.alinti'))}</option>
          <option value="fikir">${esc(t('note.fikir'))}</option>
          <option value="gorsel">${esc(t('note.gorselShort'))}</option>
        </select>
        <input class="note-text" id="noteText" placeholder="${esc(t('scratch.notePh'))}">
        <button id="noteMic" class="mic" title="${esc(t('mic.noteTip'))}">${ic('mic')}</button>
        <button id="noteAddBtn">${esc(t('add'))}</button>
      </div>
      ${noteCards ? `<div class="note-cards">${noteCards}</div>` : `<div class="notes-empty">${esc(t('scratch.notesEmpty'))}</div>`}
    </div>
  </div>`;

  $('#padNew').onclick = () => {
    const pad = { id: uid('k'), title: '', text: '', updated: Date.now() };
    sc.pads.unshift(pad);
    scratchPadId = pad.id;
    scheduleSave();
    renderEditor();
    renderSidebar();
    const t = $('#padTitle');
    if (t) t.focus();
  };

  ed.querySelectorAll('[data-pad]').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('[data-pad-del]')) return;
      scratchPadId = card.dataset.pad;
      renderEditor();
    };
  });

  ed.querySelectorAll('[data-pad-del]').forEach(btn => {
    btn.onclick = () => {
      const pad = sc.pads.find(p => p.id === btn.dataset.padDel);
      if (!confirm(t('scratch.delConfirm', { title: (pad && pad.title) || t('scratch.untitled') }))) return;
      sc.pads = sc.pads.filter(p => p.id !== btn.dataset.padDel);
      scheduleSave();
      renderScratch(ed);
      renderSidebar();
    };
  });

  const addNote = () => {
    const text = $('#noteText').value.trim();
    if (!text) return;
    sc.notes.unshift({ id: uid('n'), type: $('#noteType').value, text, sourceId: null, page: '' });
    scheduleSave();
    renderScratch(ed);
    renderScratchTray();
    $('#noteText').focus();
  };
  $('#noteAddBtn').onclick = addNote;
  $('#noteText').onkeydown = e => { if (e.key === 'Enter') addNote(); };
  const noteMic = $('#noteMic');
  if (noteMic) noteMic.onclick = () => toggleDictation(noteMic, micAppender($('#noteText')));

  ed.querySelectorAll('[data-editnote]').forEach(el => {
    const note = sc.notes.find(n => n.id === el.dataset.editnote);
    if (note) makeNoteEditable(el, note, () => { renderScratch(ed); renderScratchTray(); });
  });

  ed.querySelectorAll('[data-note]').forEach(btn => {
    btn.onclick = () => {
      sc.notes = sc.notes.filter(n => n.id !== btn.dataset.note);
      scheduleSave();
      renderScratch(ed);
      renderScratchTray();
    };
  });

  ed.querySelectorAll('[data-move]').forEach(selEl => {
    selEl.onchange = () => {
      if (!selEl.value) return;
      const note = sc.notes.find(n => n.id === selEl.dataset.move);
      const target = findChapter(selEl.value);
      if (!note || !target) return;
      sc.notes = sc.notes.filter(n => n.id !== note.id);
      target.chapter.notes.unshift(note);
      scheduleSave();
      renderScratch(ed);
      renderScratchTray();
      renderSidebar();
    };
  });
}

function renderChapter(ed) {
  const found = findChapter(sel.id);
  if (!found) { select('guide'); return; }
  const { part, chapter: ch } = found;

  const srcOptions = book.sources.map(s => `<option value="${esc(s.id)}">${esc(s.id)}</option>`).join('');

  const noteCards = ch.notes.map(n => {
    const src = n.sourceId ? book.sources.find(s => s.id === n.sourceId) : null;
    return `
    <div class="note-card ${n.type}">
      <button class="note-del" data-note="${n.id}" title="${esc(t('note.delTip'))}">✕</button>
      <div class="note-type">${n.type === 'gorsel' ? ic('image') : ''}${NOTE_TYPES[n.type] || n.type}</div>
      <div class="note-body" data-editnote="${n.id}">${esc(n.text)}</div>
      ${src ? `<div class="note-src">— ${esc(src.author)} (${esc(src.year)})${n.page ? ', ' + esc(t('note.pageAbbr')) + ' ' + esc(n.page) : ''}</div>` : ''}
    </div>`;
  }).join('');

  const draftArea = previewMode
    ? `<div class="draft-preview">${marked.parse(resolveCitationsClient(ch.draft || t('ch.noDraft')))}</div>`
    : `<textarea class="draft" id="draftText" placeholder="${esc(t('ch.draftPh'))}">${esc(ch.draft)}</textarea>`;

  ed.innerHTML = `
  <div class="editor-inner">
    <div style="font-size:12px;color:var(--muted);letter-spacing:.02em;margin-bottom:6px">${esc(part.title)}</div>
    <div class="chapter-header">
      <input class="chapter-title-input" id="chTitle" value="${esc(ch.title)}">
      <select class="status-select" id="chStatus">
        <option value="taslak" ${ch.status === 'taslak' ? 'selected' : ''}>${esc(t('status.taslak'))}</option>
        <option value="yazılıyor" ${ch.status === 'yazılıyor' ? 'selected' : ''}>${esc(t('status.yaziliyor'))}</option>
        <option value="bitti" ${ch.status === 'bitti' ? 'selected' : ''}>${esc(t('status.bitti'))}</option>
      </select>
    </div>

    <div class="field-label">${ic('file')} ${esc(t('ch.synopsis'))}</div>
    <textarea class="synopsis" id="chSynopsis">${esc(ch.synopsis)}</textarea>

    <div class="field-label">${ic('pen')} ${esc(t('ch.draft'))}</div>
    <div class="draft-toolbar">
      <button id="editBtn" class="${previewMode ? '' : 'active'}">${ic('pen')} ${esc(t('ch.write'))}</button>
      <button id="previewBtn" class="${previewMode ? 'active' : ''}">${ic('eye')} ${esc(t('ch.preview'))}</button>
      ${previewMode
        ? `<span class="tool-sep"></span>
           <button id="editorPassPrev" class="editor-btn" title="${esc(t('ch.editorPrevTip'))}">${ic('wand')} ${esc(t('tool.editor'))}</button>
           <button id="editorUndoPrev" style="${editorUndoText === null ? 'display:none' : ''}" title="${esc(t('tool.undoTip'))}">${ic('undo')} ${esc(t('tool.undo'))}</button>`
        : `<span class="tool-sep"></span>${draftToolsHtml()}`}
      <span class="word-badge">${esc(t('words', { n: wordCount(ch.draft).toLocaleString(I18N_LOCALE) }))}</span>
    </div>
    ${!previewMode && book.sources.length ? `
    <div class="cite-row">
      <select id="citeSelect"><option value="">${esc(t('ch.cite'))}</option>${srcOptions}</select>
      <span class="cite-hint">${esc(t('ch.citeHint'))}</span>
    </div>` : ''}
    ${draftArea}

    <div class="notes-section">
      <div class="field-label">${ic('notes')} ${esc(t('ch.notes'))} (${ch.notes.length}) <span class="hint">${esc(t('ch.notesHint'))}</span></div>
      <div class="note-add">
        <select id="noteType">
          <option value="not">${esc(t('note.not'))}</option>
          <option value="sentez">${esc(t('note.sentez'))}</option>
          <option value="alinti">${esc(t('note.alinti'))}</option>
          <option value="fikir">${esc(t('note.fikir'))}</option>
          <option value="gorsel">${esc(t('note.gorselShort'))}</option>
        </select>
        <input class="note-text" id="noteText" placeholder="${esc(t('ch.notePh'))}">
        <select id="noteSrc" title="${esc(t('ch.srcTip'))}"><option value="">${esc(t('ch.noSource'))}</option>${srcOptions}</select>
        <input id="notePage" placeholder="${esc(t('ch.pagePh'))}" style="width:64px">
        <button id="noteMic" class="mic" title="${esc(t('mic.noteTip'))}">${ic('mic')}</button>
        <button id="noteAddBtn">${esc(t('add'))}</button>
      </div>
      ${noteCards ? `<div class="note-cards">${noteCards}</div>` : `<div class="notes-empty">${esc(t('ch.notesEmpty'))}</div>`}
    </div>

    <div class="small-actions">
      <button id="chUp">${ic('up')} ${esc(t('ch.up'))}</button>
      <button id="chDown">${ic('down')} ${esc(t('ch.down'))}</button>
      <button id="chAdd">${ic('plus')} ${esc(t('ch.add'))}</button>
      <button id="chDel" class="danger">${ic('trash')} ${esc(t('ch.del'))}</button>
    </div>
  </div>`;

  $('#chTitle').oninput = e => { ch.title = e.target.value; scheduleSave(); };
  $('#chStatus').onchange = e => { ch.status = e.target.value; scheduleSave(); };
  $('#chSynopsis').oninput = e => { ch.synopsis = e.target.value; scheduleSave(); };

  const dt = $('#draftText');
  if (dt) dt.oninput = e => { ch.draft = e.target.value; scheduleSave(); };
  draftBinding = { set: v => { ch.draft = v; } };
  bindDraftTools();

  $('#editBtn').onclick = () => { previewMode = false; renderEditor(); };
  $('#previewBtn').onclick = () => { previewMode = true; renderEditor(); };

  const epp = $('#editorPassPrev');
  if (epp) epp.onclick = () => {
    if (!ch.draft.trim()) return;
    editorUndoText = ch.draft;
    ch.draft = editorPass(ch.draft);
    scheduleSave();
    renderEditor();
  };
  const eup = $('#editorUndoPrev');
  if (eup) eup.onclick = () => {
    if (editorUndoText === null) return;
    ch.draft = editorUndoText;
    editorUndoText = null;
    scheduleSave();
    renderEditor();
  };

  const citeSel = $('#citeSelect');
  if (citeSel) citeSel.onchange = () => {
    if (!citeSel.value || previewMode) { citeSel.value = ''; return; }
    const marker = `[[kaynak:${citeSel.value}]]`;
    const ta = $('#draftText');
    const pos = ta.selectionStart;
    ch.draft = ta.value.slice(0, pos) + marker + ta.value.slice(ta.selectionEnd);
    scheduleSave();
    renderEditor();
    const nta = $('#draftText');
    nta.focus();
    nta.setSelectionRange(pos + marker.length, pos + marker.length);
  };

  const addNote = () => {
    const text = $('#noteText').value.trim();
    if (!text) return;
    ch.notes.unshift({
      id: uid('n'),
      type: $('#noteType').value,
      text,
      sourceId: $('#noteSrc').value || null,
      page: $('#notePage').value.trim()
    });
    scheduleSave();
    renderEditor();
    $('#noteText').focus();
  };
  $('#noteAddBtn').onclick = addNote;
  $('#noteText').onkeydown = e => { if (e.key === 'Enter') addNote(); };
  const noteMic = $('#noteMic');
  if (noteMic) noteMic.onclick = () => toggleDictation(noteMic, micAppender($('#noteText')));

  ed.querySelectorAll('[data-editnote]').forEach(el => {
    const note = ch.notes.find(n => n.id === el.dataset.editnote);
    if (note) makeNoteEditable(el, note, () => renderEditor());
  });

  ed.querySelectorAll('[data-note]').forEach(btn => {
    btn.onclick = () => {
      ch.notes = ch.notes.filter(n => n.id !== btn.dataset.note);
      scheduleSave();
      renderEditor();
    };
  });

  $('#chUp').onclick = () => moveChapter(part, ch, -1);
  $('#chDown').onclick = () => moveChapter(part, ch, 1);
  $('#chAdd').onclick = () => {
    const title = prompt(t('ch.newPrompt'));
    if (!title) return;
    const nc = { id: uid('c'), title, status: 'taslak', synopsis: '', draft: '', notes: [] };
    part.chapters.splice(part.chapters.indexOf(ch) + 1, 0, nc);
    scheduleSave();
    select('chapter', nc.id);
  };
  $('#chDel').onclick = () => {
    if (!confirm(t('ch.delConfirm', { title: ch.title }))) return;
    part.chapters = part.chapters.filter(c => c.id !== ch.id);
    scheduleSave();
    select('guide');
  };
}

function moveChapter(part, ch, dir) {
  const i = part.chapters.indexOf(ch);
  const j = i + dir;
  const pi = book.parts.indexOf(part);
  if (j < 0) {
    // kısmın başından yukarı → önceki kısmın sonuna
    if (pi === 0) return;
    part.chapters.splice(i, 1);
    book.parts[pi - 1].chapters.push(ch);
  } else if (j >= part.chapters.length) {
    // kısmın sonundan aşağı → sonraki kısmın başına
    if (pi === book.parts.length - 1) return;
    part.chapters.splice(i, 1);
    book.parts[pi + 1].chapters.unshift(ch);
  } else {
    [part.chapters[i], part.chapters[j]] = [part.chapters[j], part.chapters[i]];
  }
  scheduleSave();
  renderSidebar();
}

/* ---------------- Sağ panel ---------------- */

function renderTip() {
  $('#tipText').textContent = TIPS[tipIndex % TIPS.length];
}

function renderStats() {
  const chapters = book.parts.flatMap(p => p.chapters);
  const done = chapters.filter(c => c.status === 'bitti').length;
  const writing = chapters.filter(c => c.status === 'yazılıyor').length;
  const notes = chapters.reduce((a, c) => a + c.notes.length, 0) + book.scratch.notes.length;
  $('#stats').innerHTML = `
    <div class="stat-row"><span>${esc(t('stats.words'))}</span><b>${totalWords().toLocaleString(I18N_LOCALE)}</b></div>
    <div class="stat-row"><span>${esc(t('stats.chapters'))}</span><b>${chapters.length}</b></div>
    <div class="stat-row"><span>${esc(t('stats.done'))}</span><b>${done}</b></div>
    <div class="stat-row"><span>${esc(t('stats.writing'))}</span><b>${writing}</b></div>
    <div class="stat-row"><span>${esc(t('stats.notes'))}</span><b>${notes}</b></div>
    <div class="stat-row"><span>${esc(t('stats.sources'))}</span><b>${book.sources.length}</b></div>`;
}

/* ---------------- Export ---------------- */

async function doExport() {
  const btn = $('#exportBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = t('export.working');
  try {
    const res = await fetch(apiUrl('/api/export'), { method: 'POST' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    $('#exportResult').innerHTML =
      `<b>${esc(t('export.ready'))}</b>` +
      data.files.map(f => `<a href="/exports/${f}" target="_blank" download>${f.split('/').pop()}</a>`).join('');
  } catch (e) {
    $('#exportResult').innerHTML = '<span style="color:#c0392b">' + esc(t('export.error')) + esc(e.message) + '</span>';
  }
  btn.disabled = false;
  btn.innerHTML = original;
}

/* ---------------- Versiyonlar ---------------- */

function versionLabel(f) {
  // kitap-v2026-08-14-15-30.json -> 14.08.2026 15:30
  const m = f.match(/^kitap-v(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})(-oncesi)?\.json$/);
  if (!m) return f;
  return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}${m[6] ? t('ver.pre') : ''}`;
}

function renderVersions(versions) {
  const box = $('#versionsBox');
  if (!versions.length) { box.innerHTML = ''; return; }
  box.innerHTML =
    `<div class="v-title">${esc(t('ver.title'))}</div>` +
    versions.slice(0, 8).map(f => `
      <div class="v-row">
        <span>${versionLabel(f)}</span>
        <span class="v-restore" data-vfile="${esc(f)}">${esc(t('ver.restore'))}</span>
      </div>`).join('');
  box.querySelectorAll('[data-vfile]').forEach(el => {
    el.onclick = async () => {
      if (!confirm(t('ver.confirm', { label: versionLabel(el.dataset.vfile) }))) return;
      const res = await fetch(apiUrl('/api/version/restore'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: el.dataset.vfile })
      });
      const data = await res.json();
      if (data.ok) {
        book = data.book;
        sel = { type: 'guide', id: null };
        renderSidebar(); renderEditor(); renderStats();
        loadVersions();
      } else {
        alert(t('ver.restoreError') + data.error);
      }
    };
  });
}

async function loadVersions() {
  try {
    const res = await fetch(apiUrl('/api/versions'));
    const data = await res.json();
    renderVersions(data.versions || []);
  } catch { /* sunucu yoksa sessiz geç */ }
}

async function saveVersion() {
  const btn = $('#versionBtn');
  btn.disabled = true;
  try {
    const res = await fetch(apiUrl('/api/version'), { method: 'POST' });
    const data = await res.json();
    if (data.ok) renderVersions(data.versions);
  } catch (e) {
    alert(t('ver.saveError') + e.message);
  }
  btn.disabled = false;
}

/* ---------------- Kitaplığım (çoklu kitap) ---------------- */

const COVER_COLORS = ['#55663F', '#8C5A3C', '#3C5A6B', '#6E4B6B', '#26251F'];

async function fetchLibrary() {
  const res = await fetch('/api/library');
  if (!res.ok) throw new Error('kitaplık okunamadı');
  return (await res.json()).books || [];
}

// "2 saat önce" tarzı yaklaşık son düzenleme etiketi
function relTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('time.now');
  if (m < 60) return t('time.min', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hour', { n: h });
  const g = Math.floor(h / 24);
  if (g < 7) return t('time.day', { n: g });
  const w = Math.floor(g / 7);
  if (w < 5) return t('time.week', { n: w });
  return new Date(ts).toLocaleDateString(I18N_LOCALE);
}

function libStatus(b) {
  const target = b.targetWords || 60000;
  const pct = Math.min(100, Math.round(((b.totalWords || 0) / target) * 100));
  if ((b.chapters > 0 && b.done === b.chapters) || pct >= 100) return { pct, label: t('status.bitti'), cls: 'bitti' };
  if (b.totalWords > 0) return { pct, label: t('status.yaziliyor'), cls: 'yaziliyor' };
  return { pct, label: t('status.taslak'), cls: 'taslak' };
}

function libCardHtml(b, i) {
  const st = libStatus(b);
  const color = b.color || COVER_COLORS[i % COVER_COLORS.length];
  const initial = (b.title || '?').trim().charAt(0).toLocaleUpperCase(I18N_LOCALE);
  return `
  <div class="lib-card" data-open="${esc(b.id)}" title="${esc(t('lib.openTip', { title: b.title }))}">
    ${b.id !== 'default' ? `<button class="lib-archive" data-archive="${esc(b.id)}" data-title="${esc(b.title)}" title="${esc(t('lib.archiveTip'))}"><svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4"/></svg></button>` : ''}
    <div class="lib-cover" style="background:${esc(color)}">
      <span class="lib-cover-initial">${esc(initial)}</span>
      <div class="lib-cover-title">${esc(b.title)}</div>
      <div class="lib-cover-sub">${esc(b.subtitle || '')}</div>
    </div>
    <div class="lib-card-body">
      <div class="lib-bar"><div style="width:${st.pct}%${st.pct >= 96 ? ';background:#7FB069' : ''}"></div></div>
      <div class="lib-nums"><span>${(b.totalWords || 0).toLocaleString(I18N_LOCALE)} / ${(b.targetWords || 60000).toLocaleString(I18N_LOCALE)}</span><span>%${st.pct}</span></div>
      <div class="lib-meta">
        <span class="lib-pill ${st.cls}"><span class="dot"></span> ${st.label}</span>
        <span class="lib-time">${relTime(b.updatedAt)}</span>
      </div>
    </div>
  </div>`;
}

function renderLibrary(books) {
  const view = $('#libraryView');
  const totalWordsAll = books.reduce((a, b) => a + (b.totalWords || 0), 0);
  view.innerHTML = `
  <header class="lib-header">
    <div class="lib-header-inner">
      <span class="lib-brand">
        <svg viewBox="0 0 24 24"><path d="M12 3.2c3.6 4.1 5.6 6.8 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-2.6 2-5.3 5.6-9.4Z"/><path d="M14.2 10.6 12.7 14.2 9.1 15.7l1.5-3.6Z"/></svg>
        <span><span style="font-weight:400">ink</span><span style="font-weight:700">Guide</span></span>
      </span>
      <span class="lib-nav-active">${esc(t('lib.title'))}</span>
      ${book ? `<button class="lib-back" id="libBackBtn">${esc(t('lib.back'))}</button>` : ''}
      <button class="lib-new-btn" id="libNewBtn">${ic('plus')} ${esc(t('lib.new'))}</button>
    </div>
  </header>
  <main class="lib-main">
    <h1>${esc(t('lib.title'))}</h1>
    <p class="lib-sub">${esc(t('lib.sub', { n: books.length, w: totalWordsAll.toLocaleString(I18N_LOCALE) }))}</p>
    <div class="lib-grid">
      ${books.map((b, i) => libCardHtml(b, i)).join('')}
      <div class="lib-card lib-new" id="libNewCard">
        ${ic('plus')}
        <div class="lib-new-title">${esc(t('lib.new'))}</div>
        <div class="lib-new-hint">${esc(t('lib.newHint'))}</div>
      </div>
    </div>
  </main>
  <div id="libModalHost"></div>`;

  view.querySelectorAll('[data-open]').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('[data-archive]')) return;
      openBook(card.dataset.open);
    };
  });

  view.querySelectorAll('[data-archive]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.archive;
      if (!confirm(t('lib.archiveConfirm', { title: btn.dataset.title }))) return;
      try {
        const res = await fetch('/api/library/' + encodeURIComponent(id), { method: 'DELETE' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        if (bookId === id) { bookId = 'default'; localStorage.setItem('inkguide.bookId', bookId); }
        showLibrary();
      } catch (err) {
        alert(t('lib.archiveError') + err.message);
      }
    };
  });

  const openForm = () => openNewBookForm();
  $('#libNewBtn').onclick = openForm;
  $('#libNewCard').onclick = openForm;
  const back = $('#libBackBtn');
  if (back) back.onclick = () => { $('#libraryView').hidden = true; };
}

function openNewBookForm() {
  const host = $('#libModalHost');
  let color = COVER_COLORS[0];
  let target = 60000;
  host.innerHTML = `
  <div class="lib-modal-backdrop" id="libModalBack">
    <div class="lib-modal">
      <div class="lib-modal-head"><span class="t">${esc(t('lib.new'))}</span><button class="lib-modal-close" id="libModalClose" title="${esc(t('close'))}">✕</button></div>
      <form class="lib-modal-body" id="libNewForm">
        <div>
          <label for="nbTitle">${esc(t('lib.bookName'))}</label>
          <input type="text" id="nbTitle" placeholder="${esc(t('lib.bookNamePh'))}" required autocomplete="off">
        </div>
        <div>
          <label for="nbSubtitle">${esc(t('lib.subtitle'))} <span class="opt">${esc(t('lib.opt'))}</span></label>
          <input type="text" id="nbSubtitle" placeholder="${esc(t('lib.subtitlePh'))}" autocomplete="off">
        </div>
        <div>
          <label>${esc(t('lib.color'))}</label>
          <div class="lib-colors">
            ${COVER_COLORS.map((c, i) => `<button type="button" class="lib-color${i === 0 ? ' sel' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}
          </div>
        </div>
        <div>
          <label>${esc(t('lib.target'))}</label>
          <div class="lib-targets">
            <button type="button" class="lib-target-chip" data-target="30000">${(30000).toLocaleString(I18N_LOCALE)}</button>
            <button type="button" class="lib-target-chip sel" data-target="60000">${(60000).toLocaleString(I18N_LOCALE)}</button>
            <button type="button" class="lib-target-chip" data-target="90000">${(90000).toLocaleString(I18N_LOCALE)}</button>
            <input type="number" id="nbCustomTarget" placeholder="${esc(t('lib.custom'))}" min="1000" step="1000">
          </div>
        </div>
      </form>
      <div class="lib-modal-foot">
        <button type="button" class="cancel" id="libFormCancel">${esc(t('lib.cancel'))}</button>
        <button type="submit" class="create" form="libNewForm">${esc(t('lib.create'))}</button>
      </div>
    </div>
  </div>`;

  const close = () => { host.innerHTML = ''; };
  $('#libModalClose').onclick = close;
  $('#libFormCancel').onclick = close;
  $('#libModalBack').onclick = (e) => { if (e.target.id === 'libModalBack') close(); };

  host.querySelectorAll('.lib-color').forEach(btn => {
    btn.onclick = () => {
      host.querySelectorAll('.lib-color').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      color = btn.dataset.color;
    };
  });
  host.querySelectorAll('.lib-target-chip').forEach(btn => {
    btn.onclick = () => {
      host.querySelectorAll('.lib-target-chip').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      target = parseInt(btn.dataset.target, 10);
      $('#nbCustomTarget').value = '';
    };
  });
  $('#nbCustomTarget').oninput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (v > 0) {
      target = v;
      host.querySelectorAll('.lib-target-chip').forEach(b => b.classList.remove('sel'));
    }
  };

  $('#libNewForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = $('#nbTitle').value.trim();
    if (!title) return;
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, subtitle: $('#nbSubtitle').value.trim(), targetWords: target, color })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      close();
      openBook(data.id);
    } catch (err) {
      alert(t('lib.createError') + err.message);
    }
  };
  $('#nbTitle').focus();
}

async function showLibrary() {
  const view = $('#libraryView');
  view.hidden = false;
  view.innerHTML = `<div class="lib-loading">${esc(t('lib.loading'))}</div>`;
  try {
    renderLibrary(await fetchLibrary());
  } catch {
    // Sunucu kitaplık ucunu tanımıyorsa (eski sürüm) görünümü kapat
    view.hidden = true;
  }
}

/* ---------------- Ayarlar ---------------- */

function uiLangOptionsHtml(selected) {
  return UI_LANGS.map(([code, name]) =>
    `<option value="${code}" ${code === selected ? 'selected' : ''}>${name}</option>`).join('');
}

function dicteLangOptionsHtml(selected) {
  return DICTE_LANGS.map(([code, name]) =>
    `<option value="${code}" ${code === selected ? 'selected' : ''}>${name}</option>`).join('');
}

function renderSettings(ed) {
  const m = book.meta;
  ed.innerHTML = `
  <div class="editor-inner">
    <h1 class="set-h1">${esc(t('set.h1'))}</h1>
    <p class="set-intro">${esc(t('set.intro'))}</p>

    <div class="set-grid">
      <div class="set-card">
        <div class="set-title">${esc(t('set.book'))}</div>
        <p class="set-desc">${esc(t('set.bookDesc'))}</p>
        <div class="set-field"><label for="setTitle">${esc(t('set.title'))}</label><input id="setTitle" type="text" value="${esc(m.title)}" placeholder="${esc(t('set.titlePh'))}"></div>
        <div class="set-field"><label for="setSubtitle">${esc(t('set.subtitle'))} <span class="opt">${esc(t('lib.opt'))}</span></label><input id="setSubtitle" type="text" value="${esc(m.subtitle || '')}" placeholder="${esc(t('set.subtitlePh'))}"></div>
        <div class="set-field"><label for="setAuthor">${esc(t('set.author'))}</label><input id="setAuthor" type="text" value="${esc(m.author || '')}" placeholder="${esc(t('set.authorPh'))}"></div>
        <div class="set-field"><label for="setTarget">${esc(t('set.target'))}</label><input id="setTarget" type="number" min="1000" step="1000" value="${m.targetWords || 60000}"></div>
      </div>

      <div class="set-card">
        <div class="set-title">${esc(t('set.langCard'))}</div>
        <p class="set-desc">${esc(t('set.langDesc'))}</p>
        <div class="set-field">
          <label for="setUiLang">${esc(t('set.uiLang'))}</label>
          <select id="setUiLang">${uiLangOptionsHtml(uiLang)}</select>
          <div class="set-hint">${esc(t('set.uiLangHint'))}</div>
        </div>
        <div class="set-field">
          <label for="setDicte">${esc(t('set.dicte'))}</label>
          <select id="setDicte">${dicteLangOptionsHtml(dicteLang)}</select>
          <div class="set-hint">${esc(t('set.dicteHint'))}</div>
        </div>
      </div>

      <div class="set-card">
        <div class="set-title">${esc(t('set.data'))}</div>
        <p class="set-desc">${esc(t('set.dataDesc'))}</p>
        <div class="set-path">${ic('folder')}<span class="p">data/</span><span class="h">${esc(t('set.dataBooks'))}</span></div>
        <div class="set-path">${ic('folder')}<span class="p">yedek/</span><span class="h">${esc(t('set.dataBackup'))}</span></div>
        <div class="set-path">${ic('folder')}<span class="p">versions/</span><span class="h">${esc(t('set.dataVersions'))}</span></div>
      </div>

      <div class="set-card">
        <div class="set-title">${esc(t('set.app'))}</div>
        <p class="set-desc">${esc(t('set.appDesc'))}</p>
        <button id="setRerunOnb" class="set-btn">${esc(t('set.rerunOnb'))}</button>
        <div class="set-version">${esc(t('set.version', { v: APP_VERSION }))}</div>
      </div>
    </div>
  </div>`;

  // Kitap meta — otomatik kayıt
  $('#setTitle').oninput = e => {
    m.title = e.target.value;
    $('#bookTitle').textContent = m.title;
    scheduleSave();
  };
  $('#setSubtitle').oninput = e => {
    m.subtitle = e.target.value;
    $('#bookSubtitle').textContent = m.subtitle;
    scheduleSave();
  };
  $('#setAuthor').oninput = e => { m.author = e.target.value; scheduleSave(); };
  $('#setTarget').oninput = e => {
    const v = parseInt(e.target.value, 10);
    if (v > 0) { m.targetWords = v; scheduleSave(); }
  };

  // Dil tercihleri — arayüz dili değişince bekleyen kayıt gönderilir ve sayfa yenilenir
  $('#setUiLang').onchange = e => {
    uiLang = e.target.value;
    localStorage.setItem('uiLang', uiLang);
    flushSaveNow().then(() => location.reload());
  };
  $('#setDicte').onchange = e => {
    dicteLang = e.target.value;
    localStorage.setItem('dicteLang', dicteLang);
    const side = $('#dicteLangSel');
    if (side) side.value = dicteLang; // sağ paneldeki seçiciyle senkron
  };

  // Kurulumu yeniden göster
  $('#setRerunOnb').onclick = () => {
    localStorage.removeItem('onboarded');
    showOnboarding();
  };
}

/* ---------------- Kurulum (ilk açılış sihirbazı) ---------------- */

let onb = null; // { step, values: { title, author, target, dicte, uiLang } }

function showOnboarding() {
  const m = (book && book.meta) || {};
  onb = {
    step: 0,
    values: {
      title: m.title || '',
      author: m.author || '',
      target: m.targetWords || 60000,
      dicte: dicteLang,
      uiLang: uiLang
    }
  };
  renderOnboarding();
}

function closeOnboarding() {
  localStorage.setItem('onboarded', '1');
  onb = null;
  $('#onboardHost').innerHTML = '';
}

function finishOnboarding() {
  const v = onb.values;
  // Dil tercihleri
  dicteLang = v.dicte;
  localStorage.setItem('dicteLang', dicteLang);
  const side = $('#dicteLangSel');
  if (side) side.value = dicteLang;
  const langChanged = uiLang !== v.uiLang;
  uiLang = v.uiLang;
  localStorage.setItem('uiLang', uiLang);
  // Kitap meta (kitap açıksa) — yalnızca dolu değerler yazılır
  if (book) {
    if (v.title.trim()) book.meta.title = v.title.trim();
    if (v.author.trim()) book.meta.author = v.author.trim();
    if (v.target > 0) book.meta.targetWords = v.target;
    scheduleSave();
    renderSidebar();
  }
  closeOnboarding();
  // Arayüz dili değiştiyse: bekleyen kayıt hemen gönderilir, sayfa yeni dille yenilenir
  if (langChanged) {
    flushSaveNow().then(() => location.reload());
    return;
  }
  // Ayarlar sayfası açıksa güncel değerlerle tazele
  if (book && sel.type === 'settings') renderEditor();
}

function onbStep0Html() {
  return `
    <h1 class="onb-h1">${esc(t('onb.s0h1'))}</h1>
    <p class="onb-p">${esc(t('onb.s0p'))}</p>
    <div class="onb-path">${ic('folder')}<span class="p">data/</span><span class="h">${esc(t('onb.s0path'))}</span></div>
    <ul class="onb-list">
      <li>${ic('check')}<span>${t('onb.s0li1')}</span></li>
      <li>${ic('check')}<span>${t('onb.s0li2')}</span></li>
      <li>${ic('check')}<span>${t('onb.s0li3')}</span></li>
    </ul>`;
}

function onbStep1Html() {
  const v = onb.values;
  const hasBook = !!(book && book.meta && (book.meta.title || '').trim());
  const note = hasBook ? t('onb.s1noteHas') : t('onb.s1noteNew');
  const preset = [30000, 60000, 90000];
  const isPreset = preset.includes(v.target);
  return `
    <h1 class="onb-h1">${esc(t('onb.s1h1'))}</h1>
    <p class="onb-p">${esc(note)}</p>
    <div class="onb-field"><label for="onbTitle">${esc(t('onb.bookTitle'))}</label><input id="onbTitle" type="text" value="${esc(v.title)}" placeholder="${esc(t('onb.bookTitlePh'))}" autocomplete="off"></div>
    <div class="onb-field"><label for="onbAuthor">${esc(t('onb.author'))}</label><input id="onbAuthor" type="text" value="${esc(v.author)}" placeholder="${esc(t('onb.authorPh'))}" autocomplete="off"></div>
    <div class="onb-field"><label>${esc(t('lib.target'))}</label>
      <div class="lib-targets">
        ${preset.map(p => `<button type="button" class="lib-target-chip${v.target === p ? ' sel' : ''}" data-onb-target="${p}">${p.toLocaleString(I18N_LOCALE)}</button>`).join('')}
        <input type="number" id="onbCustomTarget" placeholder="${esc(t('lib.custom'))}" min="1000" step="1000" value="${isPreset ? '' : v.target}">
      </div>
    </div>`;
}

function onbStep2Html() {
  const v = onb.values;
  return `
    <h1 class="onb-h1">${esc(t('onb.s2h1'))}</h1>
    <p class="onb-p">${esc(t('onb.s2p'))}</p>
    <div class="onb-field">
      <label for="onbDicte">${esc(t('set.dicte'))}</label>
      <select id="onbDicte">${dicteLangOptionsHtml(v.dicte)}</select>
    </div>
    <div class="onb-field">
      <label for="onbUiLang">${esc(t('set.uiLang'))}</label>
      <select id="onbUiLang">${uiLangOptionsHtml(v.uiLang)}</select>
      <div class="onb-hint">${esc(t('set.uiLangHint'))}</div>
    </div>`;
}

function renderOnboarding() {
  const host = $('#onboardHost');
  if (!onb) { host.innerHTML = ''; return; }
  const labels = [t('onb.step0'), t('onb.step1'), t('onb.step2')];
  const stepsHtml = labels.map((label, i) => `
    <div class="onb-step${i === onb.step ? ' now' : ''}${i < onb.step ? ' done' : ''}">
      <span class="onb-step-dot"></span><span>${esc(label)}</span>
    </div>`).join('');
  const content = onb.step === 0 ? onbStep0Html() : onb.step === 1 ? onbStep1Html() : onbStep2Html();

  host.innerHTML = `
  <div class="onb-backdrop">
    <div class="onb-window">
      <div class="onb-titlebar">
        <span class="onb-tb-dot"></span><span class="onb-tb-dot"></span><span class="onb-tb-dot"></span>
        <span class="onb-tb-label">${esc(t('onb.title'))}</span>
      </div>
      <div class="onb-body">
        <aside class="onb-side">
          <div class="onb-logo">
            <div class="onb-logo-badge"><svg viewBox="0 0 24 24"><path d="M12 3.2c3.6 4.1 5.6 6.8 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-2.6 2-5.3 5.6-9.4Z"/><path d="M14.2 10.6 12.7 14.2 9.1 15.7l1.5-3.6Z"/></svg></div>
            <span class="onb-wordmark"><span>ink</span><b>Guide</b></span>
          </div>
          <div class="onb-steps">${stepsHtml}</div>
          <div class="onb-side-note">${esc(t('onb.sideNote'))}</div>
        </aside>
        <section class="onb-content">
          <div class="onb-content-main">${content}</div>
          <div class="onb-foot">
            <button id="onbBack" class="onb-back" ${onb.step === 0 ? 'disabled' : ''}>${esc(t('onb.back'))}</button>
            <button id="onbSkip" class="onb-skip">${esc(t('onb.skip'))}</button>
            <button id="onbNext" class="onb-next">${onb.step === 2 ? esc(t('onb.start')) : esc(t('onb.next'))}</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;

  // Gezinme
  $('#onbBack').onclick = () => { if (onb.step > 0) { onb.step--; renderOnboarding(); } };
  $('#onbSkip').onclick = () => closeOnboarding();
  $('#onbNext').onclick = () => {
    if (onb.step < 2) { onb.step++; renderOnboarding(); }
    else finishOnboarding();
  };

  // Adım alanları
  if (onb.step === 1) {
    $('#onbTitle').oninput = e => { onb.values.title = e.target.value; };
    $('#onbAuthor').oninput = e => { onb.values.author = e.target.value; };
    host.querySelectorAll('[data-onb-target]').forEach(btn => {
      btn.onclick = () => {
        onb.values.target = parseInt(btn.dataset.onbTarget, 10);
        host.querySelectorAll('[data-onb-target]').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        $('#onbCustomTarget').value = '';
      };
    });
    $('#onbCustomTarget').oninput = e => {
      const v = parseInt(e.target.value, 10);
      if (v > 0) {
        onb.values.target = v;
        host.querySelectorAll('[data-onb-target]').forEach(b => b.classList.remove('sel'));
      }
    };
  } else if (onb.step === 2) {
    $('#onbDicte').onchange = e => { onb.values.dicte = e.target.value; };
    $('#onbUiLang').onchange = e => { onb.values.uiLang = e.target.value; };
  }
}

/* ---------------- Başlat ---------------- */

// Eski veri yapılarından güvenli (ekleyici) geçişler
function migrateBook() {
  if (!book.scratch) book.scratch = { text: '', notes: [] };
  if (!book.scratch.notes) book.scratch.notes = [];
  if (!book.scratch.pads) book.scratch.pads = [];
  // Eski tek serbest alandan çoklu karalamaya geçiş
  if (book.scratch.text && book.scratch.text.trim()) {
    book.scratch.pads.unshift({ id: uid('k'), title: 'İlk karalamalarım', text: book.scratch.text, updated: Date.now() });
    book.scratch.text = '';
    scheduleSave();
  }
}

async function openBook(id) {
  try {
    const res = await fetch('/api/book?bookId=' + encodeURIComponent(id));
    if (!res.ok) throw new Error('kitap okunamadı');
    book = await res.json();
  } catch {
    alert(t('lib.openError') + id);
    if (id !== 'default') showLibrary();
    return;
  }
  bookId = id;
  localStorage.setItem('inkguide.bookId', id);
  // Kitap değişince arayüz durumunu sıfırla
  sel = { type: 'guide', id: null };
  previewMode = false;
  scratchPadId = null;
  editorUndoText = null;
  clearTimeout(saveTimer);
  migrateBook();
  $('#libraryView').hidden = true;
  $('#exportResult').innerHTML = '';
  renderSidebar();
  renderEditor();
  renderTip();
  renderStats();
  renderScratchTray();
  loadVersions();
}

async function init() {
  // Statik düğmeler (bir kez bağlanır)
  $('#tipNext').onclick = () => { tipIndex++; renderTip(); };
  $('#exportBtn').onclick = doExport;
  $('#versionBtn').onclick = saveVersion;
  $('#libraryLink').onclick = (e) => { e.preventDefault(); showLibrary(); };

  const langSel = $('#dicteLangSel');
  langSel.innerHTML = DICTE_LANGS.map(([code, name]) =>
    `<option value="${code}" ${code === dicteLang ? 'selected' : ''}>${name}</option>`).join('');
  langSel.onchange = () => {
    dicteLang = langSel.value;
    localStorage.setItem('dicteLang', dicteLang);
  };
  $('#addPartBtn').onclick = () => {
    const title = prompt(t('part.newPrompt'));
    if (!title) return;
    book.parts.push({ id: uid('p'), title, chapters: [] });
    scheduleSave();
    renderSidebar();
  };

  // Kitaplığı oku: birden fazla kitap varsa Kitaplığım ekranı, tek kitap varsa doğrudan o kitap
  let books = null;
  try {
    books = await fetchLibrary();
  } catch { /* eski sunucu: kitaplık ucu yok */ }

  if (books && books.length > 1) {
    await showLibrary();
  } else if (books && books.length === 1) {
    await openBook(books[0].id);
  } else {
    await openBook('default');
  }

  // İlk açılış: kurulum sihirbazı (bir kez gösterilir, Ayarlar'dan yeniden açılabilir)
  if (!localStorage.getItem('onboarded')) showOnboarding();
}

init();
