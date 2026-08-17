/* Yol Arkadaşı — kitap yazma aracı */

let book = null;
let sel = { type: 'guide', id: null }; // chapter | front | sources | guide
let previewMode = false;
let saveTimer = null;
let tipIndex = new Date().getDate();

const $ = (s) => document.querySelector(s);

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
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'
};

function ic(name) {
  return `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;
}

/* ---------------- İpuçları ---------------- */

const TIPS = [
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

/* ---------------- Rehber içeriği ---------------- */

const GUIDE_HTML = `
<div class="editor-inner guide">
  <h2>🧭 İlk Kitabını Yazanlar İçin Rehber</h2>
  <p>Bu araç, notlarınızı bölümlere dönüştürüp kitabınıza doğru yürümeniz için tasarlandı. Soldan bir bölüm seçin, notlarınızı (NotebookLM çıktıları, sentezler, alıntılar) o bölüme ekleyin; hazır olduğunuzda taslağı yazın.</p>

  <h2>📋 Önerilen Çalışma Akışı</h2>
  <ul>
    <li><b>1. Topla:</b> NotebookLM'den ve okumalarınızdan çıkan her şeyi ilgili bölüme <i>not</i> olarak ekleyin. Düşünmeyin, biriktirin.</li>
    <li><b>2. Sentezle:</b> Notlar birikince "bu bölümün ana fikri ne?" sorusuna cevap veren <i>sentez</i> notları yazın. Aklınıza gelen şema, diyagram ve illüstrasyon fikirlerini 🎨 <i>görsel</i> notu olarak kaydedin — kitap tasarımı aşamasında hazır bir görsel listeniz olur.</li>
    <li><b>3. Yaz:</b> Sentezlere bakarak taslağı yazın. Notlar sağ elinizin altında, taslak önünüzde. Dışarıdan metin getirirken <b>Yapıştır</b> düğmesi satır kırıklarını ve kalıntıları temizler; <b>Düzelt</b> aynı temizliği seçili metne uygular. Araç çubuğundaki <b>B / I / H / Liste / ❝</b> düğmeleri seçili metni biçimlendirir.</li>
    <li><b>Kararsız mısınız?</b> Nereye ait olduğunu bilmediğiniz her şeyi <b>Karalama Defteri</b>'ne atın; hazır olunca notu "bölüme taşı" ile yerine gönderin.</li>
    <li><b>4. Dinlendir & düzelt:</b> Bölümü "bitti" işaretlemeden önce en az bir hafta bekletin.</li>
  </ul>

  <h2>✍️ Sık Karışan Yazım Kuralları (TDK)</h2>
  <div class="kural"><b>de / da:</b> Bağlaç ise ayrı ("ben de geldim"), bulunma eki ise bitişik ("evde"). Test: çıkarınca cümle bozuluyorsa bitişiktir.</div>
  <div class="kural"><b>ki:</b> Bağlaç ise ayrı ("öyle ki"), aitlik eki ise bitişik ("seninki", "akşamki"). İstisna kalıplar: "sanki, oysaki, çünkü, hâlbuki, mademki, meğerki, belki".</div>
  <div class="kural"><b>Soru eki mı/mi:</b> Her zaman ayrı yazılır: "geldi mi?", "problem mi?"</div>
  <div class="kural"><b>Birleşik fiiller:</b> "hissetmek, kaybetmek, reddetmek" bitişik; "fark etmek, terk etmek, söz etmek" ayrı.</div>
  <div class="kural"><b>Sayılar:</b> Metinde küçük sayılar yazıyla ("üç yöntem"), ölçüm ve istatistikler rakamla ("%69", "55 dakika").</div>
  <div class="kural"><b>Noktalama:</b> Virgülle bağlanan uzun cümleler yerine kısa cümleler kurun. Üç nokta üçtür, beş değil…</div>

  <h2>📚 Alıntı ve Kaynak Etiği</h2>
  <ul>
    <li>Birebir alıntı → tırnak içinde + kaynak + sayfa numarası. Kitapta 40 kelimeyi geçen alıntılar blok alıntı olur.</li>
    <li>Fikir aktarımı (kendi cümlelerinizle) da kaynak ister — intihalin en yaygın türü "parafraz edip kaynak vermemektir".</li>
    <li>Taslak içinde <code>[[kaynak:kahneman2011]]</code> yazın; kitaba dönüştürünce otomatik olarak <b>(Kahneman, 2011)</b> olur ve Kaynakça'ya girer.</li>
    <li>İkincil alıntıdan kaçının: "Kahneman'ın aktardığına göre Simon..." yerine mümkünse asıl kaynağa gidin.</li>
    <li>Söylenmiş sözleri doğrulayın: Einstein'a atfedilen sözlerin çoğu Einstein'a ait değildir. (Kitabınız için harika bir yan hikâye!)</li>
  </ul>

  <h2>🏗️ Kitabın Yapısı</h2>
  <ul>
    <li><b>Önsöz:</b> Kitabın hikâyesi — neden yazdınız, kime yazdınız. (Genelde en son yazılır.)</li>
    <li><b>Giriş:</b> Kitabın vaadi ve okuma haritası. Okuyucu 2 sayfada "bu kitap bana ne verecek?" sorusunun cevabını almalı.</li>
    <li><b>Bölümler:</b> Her bölüm tek bir soruya cevap versin. Sinopsis alanına o soruyu yazın.</li>
    <li><b>Kaynakça:</b> Otomatik oluşur — siz sadece kaynakları girin ve atıf işaretçilerini kullanın.</li>
  </ul>

  <h2>🚀 Kitaba Dönüştürünce Ne Olur?</h2>
  <p>Sol alttaki <b>"Kitaba Dönüştür"</b> düğmesi kitabınızı üç formatta üretir: <b>Markdown</b> (ham metin), <b>HTML</b> (okumalık/baskı önizleme) ve <b>Word (.docx)</b> — kapak, içindekiler, önsöz, giriş, bölümler ve APA formatında kaynakça ile. Word dosyasını açınca içindekileri güncellemeyi onaylayın (alanlar otomatik dolar). Dosya adları tarih + saat damgalıdır; her dönüştürme ayrı bir çıktı versiyonudur.</p>

  <h2>🕐 Versiyonlama & Güvenlik Yedeği</h2>
  <p><b>"Versiyon"</b> düğmesi kitabın o anki halinin anlık görüntüsünü <code>versions/</code> klasörüne kaydeder. Büyük bir değişiklikten (bölüm silme, yeniden yapılandırma) önce bir versiyon alın; listeden tek tıkla <b>geri yükleyebilirsiniz</b> — geri yükleme öncesi mevcut hal de otomatik versiyonlanır, hiçbir şey kaybolmaz.</p>
  <p><b>Emekler asla boşa gitmez:</b> her kayıtta kitabınızın son hali <code>yedek/kitap-son-hali.md</code> ve <code>yedek/kitap-son-hali.docx</code> dosyalarına da yazılır — notlarınız ve karalama defteriniz dahil. Bu uygulama bir gün hiç açılmasa bile, o Word dosyasını açıp kaldığınız yerden devam edebilirsiniz.</p>
</div>`;

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
  if (badge) badge.textContent = wordCount(newValue) + ' kelime';
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
    alert('Pano okunamadı (tarayıcı izin istemiş olabilir).\nMetni Ctrl+V ile normal yapıştırıp ✨ Düzelt düğmesini kullanın — aynı temizliği yapar.');
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
    <button class="fmt" data-fmt="bold" title="Kalın (seçili metni **kalın** yapar)"><b>B</b></button>
    <button class="fmt" data-fmt="italic" title="İtalik"><i>I</i></button>
    <button class="fmt" data-fmt="h" title="Ara başlık (satırı ### başlık yapar)">H</button>
    <button class="fmt" data-fmt="list" title="Madde listesi">•&nbsp;Liste</button>
    <button class="fmt" data-fmt="quote" title="Alıntı bloğu">❝</button>
    <span class="tool-sep"></span>
    <button id="pasteCleanBtn" title="Panodaki metni temizleyerek yapıştır: satır kırıkları birleşir, fazla boşluklar ve [1] kalıntıları silinir">${ic('clipboard')} Yapıştır</button>
    <button id="fixBtn" title="Seçili metni (seçim yoksa tümünü) temizler ve okunur hale getirir">${ic('sparkles')} Düzelt</button>
    <button id="editorPassBtn" class="editor-btn" title="Editör düzeltmesi: ara başlıklar, madde listeleri, blok alıntılar, tanım vurguları (kalın terim), akıllı tırnaklar (“ ”), üç nokta (…) ve paragraf onarımı. Geri Al ile geri dönebilirsiniz.">${ic('wand')} Editör</button>
    <button id="editorUndoBtn" title="Son editör düzeltmesini geri al">${ic('undo')} Geri Al</button>`;
}

function bindDraftTools() {
  document.querySelectorAll('.fmt').forEach(btn => {
    btn.onclick = () => {
      const f = btn.dataset.fmt;
      if (f === 'bold') wrapSelection('**', '**', 'kalın metin');
      else if (f === 'italic') wrapSelection('*', '*', 'italik metin');
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
}

/* ---------------- Kaydetme ---------------- */

function scheduleSave() {
  $('#saveIndicator').textContent = 'Kaydediliyor…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch('/api/book', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });
      $('#saveIndicator').textContent = '✓ Kaydedildi ' + new Date().toLocaleTimeString('tr-TR');
    } catch {
      $('#saveIndicator').textContent = '⚠ Kaydedilemedi — sunucu çalışıyor mu?';
    }
    renderSidebar();
    renderStats();
  }, 600);
}

/* ---------------- Sol panel ---------------- */

function renderSidebar() {
  $('#bookTitle').textContent = book.meta.title;
  $('#bookSubtitle').textContent = book.meta.subtitle || '';

  const tw = totalWords();
  const target = book.meta.targetWords || 60000;
  const pct = Math.min(100, Math.round((tw / target) * 100));
  $('#progressFill').style.width = pct + '%';
  $('#progressText').textContent = `${tw.toLocaleString('tr-TR')} / ${target.toLocaleString('tr-TR')} kelime (%${pct})`;

  const tree = $('#tree');
  tree.innerHTML = '';

  const mkItem = (cls, html, onclick) => {
    const el = document.createElement('div');
    el.className = 'tree-item ' + cls;
    el.innerHTML = html;
    el.onclick = onclick;
    return el;
  };

  tree.appendChild(mkItem('special' + (sel.type === 'guide' ? ' selected' : ''), ic('compass') + ' İlk Kitap Rehberi', () => select('guide')));
  tree.appendChild(mkItem('special' + (sel.type === 'front' ? ' selected' : ''), ic('file') + ' Ön Sayfalar (Önsöz · Giriş)', () => select('front')));
  tree.appendChild(mkItem('special' + (sel.type === 'sources' ? ' selected' : ''), ic('library') + ` Kaynaklar (${book.sources.length})`, () => select('sources')));
  const scratchCount = (book.scratch.notes.length || 0) + ((book.scratch.pads || []).length);
  tree.appendChild(mkItem('special' + (sel.type === 'scratch' ? ' selected' : ''), ic('scribble') + ` Karalama Defteri${scratchCount ? ` (${scratchCount})` : ''}`, () => select('scratch')));

  const sep = document.createElement('div');
  sep.className = 'tree-sep';
  tree.appendChild(sep);

  for (const part of book.parts) {
    tree.appendChild(mkItem('part-title',
      `<span class="caret">▾</span> <span class="chapter-label">${esc(part.title)}</span>
       <span class="row-arrows">
         <button data-pmv="${part.id}|-1" title="Kısmı yukarı taşı">${ic('up')}</button>
         <button data-pmv="${part.id}|1" title="Kısmı aşağı taşı">${ic('down')}</button>
       </span>`,
      () => {}));
    for (const ch of part.chapters) {
      const wc = wordCount(ch.draft);
      const item = mkItem(
        'chapter' + (sel.type === 'chapter' && sel.id === ch.id ? ' selected' : ''),
        `<span class="status-dot status-${ch.status}"></span>
         <span class="chapter-label">${esc(ch.title)}</span>
         ${wc ? `<span class="chapter-words">${wc}</span>` : ''}
         <span class="row-arrows">
           <button data-cmv="${ch.id}|-1" title="Yukarı taşı">${ic('up')}</button>
           <button data-cmv="${ch.id}|1" title="Aşağı taşı">${ic('down')}</button>
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
  if (sel.type === 'guide') { ed.innerHTML = GUIDE_HTML; return; }
  if (sel.type === 'front') { renderFront(ed); return; }
  if (sel.type === 'sources') { renderSources(ed); return; }
  if (sel.type === 'scratch') { renderScratch(ed); return; }
  renderChapter(ed);
}

function renderFront(ed) {
  const f = book.frontmatter;
  ed.innerHTML = `
  <div class="editor-inner">
    <h2 style="font-family:Georgia,serif">📄 Ön Sayfalar</h2>
    <div class="field-label">Önsöz <span style="text-transform:none;font-weight:400">(kitabın hikâyesi — genelde en son yazılır)</span></div>
    <textarea class="draft" id="fmOnsoz" style="min-height:160px" placeholder="Bu kitabı neden yazdınız? Kime yazdınız?">${esc(f.onsoz)}</textarea>
    <div class="field-label">Giriş <span style="text-transform:none;font-weight:400">(kitabın vaadi ve okuma haritası)</span></div>
    <textarea class="draft" id="fmGiris" style="min-height:160px" placeholder="Okuyucu 2 sayfada 'bu kitap bana ne verecek?' cevabını almalı.">${esc(f.giris)}</textarea>
    <div class="field-label">Teşekkür</div>
    <textarea class="draft" id="fmTesekkur" style="min-height:100px">${esc(f.tesekkur)}</textarea>
  </div>`;
  $('#fmOnsoz').oninput = e => { f.onsoz = e.target.value; scheduleSave(); };
  $('#fmGiris').oninput = e => { f.giris = e.target.value; scheduleSave(); };
  $('#fmTesekkur').oninput = e => { f.tesekkur = e.target.value; scheduleSave(); };
}

function renderSources(ed) {
  const rows = book.sources.map(s => `
    <tr>
      <td><code>${esc(s.id)}</code></td>
      <td>${esc(s.author)}</td>
      <td>${esc(s.year)}</td>
      <td><i>${esc(s.title)}</i></td>
      <td>${esc(s.publisher || '')}</td>
      <td><span class="del-link" data-del="${esc(s.id)}">sil</span></td>
    </tr>`).join('');

  ed.innerHTML = `
  <div class="editor-inner">
    <h2 style="font-family:Georgia,serif">📚 Kaynaklar</h2>
    <p style="font-size:13px;color:var(--muted);margin:6px 0 14px">
      Taslak içinde <code>[[kaynak:id]]</code> yazın → kitapta <b>(Yazar, Yıl)</b> atfına dönüşür ve Kaynakça otomatik oluşur.
    </p>
    <table class="src-table">
      <thead><tr><th>ID</th><th>Yazar</th><th>Yıl</th><th>Başlık</th><th>Yayıncı/Dergi</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="color:var(--muted)">Henüz kaynak yok.</td></tr>'}</tbody>
    </table>
    <form class="src-form" id="srcForm">
      <input required name="author" placeholder="Yazar — örn: Kahneman, D.">
      <input required name="year" placeholder="Yıl — örn: 2011">
      <input required name="title" placeholder="Başlık" style="grid-column:span 2">
      <input name="publisher" placeholder="Yayıncı / Dergi">
      <input name="url" placeholder="URL (varsa)">
      <input name="id" placeholder="ID (boş bırakılırsa otomatik: yazarYıl)">
      <select name="type"><option value="kitap">Kitap</option><option value="makale">Makale</option><option value="web">Web</option></select>
      <div class="src-id-hint">ID atıf işaretçisinde kullanılır: <code>[[kaynak:kahneman2011]]</code></div>
      <button type="submit">+ Kaynak Ekle</button>
    </form>
  </div>`;

  ed.querySelectorAll('[data-del]').forEach(el => {
    el.onclick = () => {
      if (!confirm(`"${el.dataset.del}" kaynağını silmek istediğinize emin misiniz?`)) return;
      book.sources = book.sources.filter(s => s.id !== el.dataset.del);
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
    if (book.sources.some(s => s.id === id)) { alert('Bu ID zaten var: ' + id); return; }
    book.sources.push({
      id,
      author: fd.get('author').trim(),
      year: fd.get('year').trim(),
      title: fd.get('title').trim(),
      publisher: (fd.get('publisher') || '').trim(),
      url: (fd.get('url') || '').trim(),
      type: fd.get('type')
    });
    scheduleSave();
    renderSources(ed);
  };
}

const NOTE_TYPES = { not: 'Not', sentez: 'Sentez', alinti: 'Alıntı', fikir: 'Fikir', gorsel: 'Görsel fikir' };

/* Not kartına tıklayınca yerinde düzenleme (Ctrl+Enter veya dışarı tıklayınca kaydeder, Esc iptal) */
function makeNoteEditable(el, note, rerender) {
  el.classList.add('editable');
  el.title = 'Düzenlemek için tıklayın';
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
    <div class="tray-head">${ic('scribble')} Kararsız Notlar <span class="tray-count">${notes.length}</span></div>
    <div class="tray-add">
      <select id="trayType" title="Not türü">
        <option value="not">📌</option>
        <option value="sentez">🔗</option>
        <option value="alinti">❝</option>
        <option value="fikir">💡</option>
        <option value="gorsel">🎨</option>
      </select>
      <input id="trayText" placeholder="Hızlı not… (Enter)">
    </div>
    <div class="tray-list">
      ${notes.map(n => `
        <div class="tray-card ${n.type}">
          <button class="note-del" data-tray-del="${n.id}" title="Sil">✕</button>
          <div class="tray-card-text" data-tray-edit="${n.id}">${esc(n.text)}</div>
          <select class="tray-move" data-tray-move="${n.id}" title="Bölüme taşı">
            <option value="">→ bölüme taşı…</option>
            ${chapterOptionsHtml()}
          </select>
        </div>`).join('') || '<div class="tray-empty">Aklınıza düşeni buraya bırakın; yerini sonra bulur.</div>'}
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
    <button class="back-link" id="padBack">← Karalama Defteri'ne dön</button>
    <div class="chapter-header">
      <input class="chapter-title-input" id="padTitle" value="${esc(pad.title)}" placeholder="Karalamaya bir başlık verin…">
    </div>
    <div class="draft-toolbar">
      ${draftToolsHtml()}
      <span class="word-badge">${wordCount(pad.text)} kelime</span>
    </div>
    <textarea class="draft" id="draftText" style="min-height:420px"
      placeholder="Aklınıza gelen her şey: cümle denemeleri, sorular, yapı fikirleri, bağlantılar… Otomatik kaydedilir.">${esc(pad.text)}</textarea>
    <div class="small-actions">
      <button id="padDelete" class="danger">${ic('trash')} bu karalamayı sil</button>
    </div>
  </div>`;

  $('#padBack').onclick = () => { scratchPadId = null; renderEditor(); };
  $('#padTitle').oninput = e => { pad.title = e.target.value; pad.updated = Date.now(); scheduleSave(); };
  const dt = $('#draftText');
  dt.oninput = e => { pad.text = e.target.value; pad.updated = Date.now(); scheduleSave(); };
  draftBinding = { set: v => { pad.text = v; pad.updated = Date.now(); } };
  bindDraftTools();
  $('#padDelete').onclick = () => {
    if (!confirm(`"${pad.title || 'Adsız karalama'}" silinecek. Emin misiniz?`)) return;
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
      <button class="note-del" data-note="${n.id}" title="Notu sil">✕</button>
      <div class="note-type">${n.type === 'gorsel' ? ic('image') : ''}${NOTE_TYPES[n.type] || n.type}</div>
      <div class="note-body" data-editnote="${n.id}">${esc(n.text)}</div>
      <div class="note-move">
        ${ic('move')}
        <select data-move="${n.id}" title="Bu notu bir bölüme taşı">
          <option value="">bölüme taşı…</option>
          ${chapterOptionsHtml()}
        </select>
      </div>
    </div>`).join('');

  const padCards = sc.pads.map(p => `
    <div class="pad-card" data-pad="${p.id}">
      <button class="note-del" data-pad-del="${p.id}" title="Karalamayı sil">✕</button>
      <div class="pad-title">${esc(p.title) || 'Adsız karalama'}</div>
      <div class="pad-preview">${esc((p.text || '').slice(0, 180)) || 'boş'}</div>
      <div class="pad-meta">${wordCount(p.text)} kelime${p.updated ? ' · ' + new Date(p.updated).toLocaleDateString('tr-TR') : ''}</div>
    </div>`).join('');

  ed.innerHTML = `
  <div class="editor-inner">
    <h2 style="font-family:Georgia,serif;display:flex;align-items:center;gap:10px">${ic('scribble')} Karalama Defteri</h2>
    <p style="font-size:13px;color:var(--muted);margin:8px 0 4px">
      Zihninizi boşaltın: karalamalarınıza başlık verin, kaydedin, dilediğinizde açıp devam edin.
      Nereye ait olduğunu bilmediğiniz notları da hazır olduğunuzda <b>"bölüme taşı"</b> ile yerine gönderirsiniz.
      Bu sayfa kitaba girmez ama yedeklere dahildir.
    </p>

    <div class="field-label">${ic('pen')} Karalamalarım (${sc.pads.length})</div>
    <div class="pad-grid">
      <div class="pad-card pad-new" id="padNew">${ic('plus')}<span>Yeni Karalama</span></div>
      ${padCards}
    </div>

    <div class="notes-section">
      <div class="field-label">${ic('notes')} Kararsız notlar (${sc.notes.length}) <span class="hint">— yerini sonra bulacaklar</span></div>
      <div class="note-add">
        <select id="noteType">
          <option value="not">📌 Not</option>
          <option value="sentez">🔗 Sentez</option>
          <option value="alinti">❝ Alıntı</option>
          <option value="fikir">💡 Fikir</option>
          <option value="gorsel">🎨 Görsel</option>
        </select>
        <input class="note-text" id="noteText" placeholder="Nereye koyacağınızı bilmediğiniz not… (Enter ile ekle)">
        <button id="noteAddBtn">Ekle</button>
      </div>
      <div class="note-cards">${noteCards || '<div style="color:var(--muted);font-size:13px">Henüz kararsız not yok.</div>'}</div>
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
      if (!confirm(`"${(pad && pad.title) || 'Adsız karalama'}" silinecek. Emin misiniz?`)) return;
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
      <button class="note-del" data-note="${n.id}" title="Notu sil">✕</button>
      <div class="note-type">${n.type === 'gorsel' ? ic('image') : ''}${NOTE_TYPES[n.type] || n.type}</div>
      <div class="note-body" data-editnote="${n.id}">${esc(n.text)}</div>
      ${src ? `<div class="note-src">— ${esc(src.author)} (${esc(src.year)})${n.page ? ', s. ' + esc(n.page) : ''}</div>` : ''}
    </div>`;
  }).join('');

  const draftArea = previewMode
    ? `<div class="draft-preview">${marked.parse(resolveCitationsClient(ch.draft || '*Henüz taslak yok.*'))}</div>`
    : `<textarea class="draft" id="draftText" placeholder="Taslağınızı buraya yazın. Markdown kullanabilirsiniz: **kalın**, *italik*, > alıntı bloğu. Atıf için: [[kaynak:id]]">${esc(ch.draft)}</textarea>`;

  ed.innerHTML = `
  <div class="editor-inner">
    <div style="font-size:11px;color:var(--muted);margin-bottom:2px">${esc(part.title)}</div>
    <div class="chapter-header">
      <input class="chapter-title-input" id="chTitle" value="${esc(ch.title)}">
      <select class="status-select" id="chStatus">
        <option value="taslak" ${ch.status === 'taslak' ? 'selected' : ''}>○ Taslak</option>
        <option value="yazılıyor" ${ch.status === 'yazılıyor' ? 'selected' : ''}>◐ Yazılıyor</option>
        <option value="bitti" ${ch.status === 'bitti' ? 'selected' : ''}>● Bitti</option>
      </select>
    </div>

    <div class="field-label">Sinopsis — bu bölüm hangi soruya cevap veriyor?</div>
    <textarea class="synopsis" id="chSynopsis">${esc(ch.synopsis)}</textarea>

    <div class="field-label">${ic('pen')} Taslak</div>
    <div class="draft-toolbar">
      <button id="editBtn" class="${previewMode ? '' : 'active'}">${ic('pen')} Yaz</button>
      <button id="previewBtn" class="${previewMode ? 'active' : ''}">${ic('eye')} Önizle</button>
      ${previewMode
        ? `<span class="tool-sep"></span>
           <button id="editorPassPrev" class="editor-btn" title="Editör düzeltmesi: ara başlıklar, maddeler, paragraf düzeni">${ic('wand')} Editör</button>
           <button id="editorUndoPrev" style="${editorUndoText === null ? 'display:none' : ''}" title="Son editör düzeltmesini geri al">${ic('undo')} Geri Al</button>`
        : `<span class="tool-sep"></span>${draftToolsHtml()}`}
      ${!previewMode && book.sources.length ? `<select id="citeSelect"><option value="">— atıf —</option>${srcOptions}</select>` : ''}
      <span class="word-badge">${wordCount(ch.draft)} kelime</span>
    </div>
    ${draftArea}

    <div class="notes-section">
      <div class="field-label">${ic('notes')} Notlar & Sentezler (${ch.notes.length}) <span class="hint">— kitaba girmez, size çalışır</span></div>
      <div class="note-add">
        <select id="noteType">
          <option value="not">📌 Not</option>
          <option value="sentez">🔗 Sentez</option>
          <option value="alinti">❝ Alıntı</option>
          <option value="fikir">💡 Fikir</option>
          <option value="gorsel">🎨 Görsel</option>
        </select>
        <input class="note-text" id="noteText" placeholder="NotebookLM çıktısı, okuma notu, sentez, görsel fikri… (Enter ile ekle)">
        <select id="noteSrc" title="Kaynak (alıntı için)"><option value="">kaynak yok</option>${srcOptions}</select>
        <input id="notePage" placeholder="sayfa" style="width:64px">
        <button id="noteAddBtn">Ekle</button>
      </div>
      <div class="note-cards">${noteCards || '<div style="color:var(--muted);font-size:13px">Henüz not yok. Okuduklarınızı, NotebookLM sentezlerinizi buraya biriktirin.</div>'}</div>
    </div>

    <div class="small-actions">
      <button id="chUp">${ic('up')} yukarı taşı</button>
      <button id="chDown">${ic('down')} aşağı taşı</button>
      <button id="chAdd">${ic('plus')} bu kısma bölüm ekle</button>
      <button id="chDel" class="danger">${ic('trash')} bölümü sil</button>
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
    const title = prompt('Yeni bölüm başlığı:');
    if (!title) return;
    const nc = { id: uid('c'), title, status: 'taslak', synopsis: '', draft: '', notes: [] };
    part.chapters.splice(part.chapters.indexOf(ch) + 1, 0, nc);
    scheduleSave();
    select('chapter', nc.id);
  };
  $('#chDel').onclick = () => {
    if (!confirm(`"${ch.title}" bölümünü ve notlarını silmek istediğinize emin misiniz?`)) return;
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
    <div class="stat-row"><span>Toplam kelime</span><b>${totalWords().toLocaleString('tr-TR')}</b></div>
    <div class="stat-row"><span>Bölümler</span><b>${chapters.length}</b></div>
    <div class="stat-row"><span>● Bitti</span><b>${done}</b></div>
    <div class="stat-row"><span>◐ Yazılıyor</span><b>${writing}</b></div>
    <div class="stat-row"><span>Not & sentez</span><b>${notes}</b></div>
    <div class="stat-row"><span>Kaynak</span><b>${book.sources.length}</b></div>`;
}

/* ---------------- Export ---------------- */

async function doExport() {
  const btn = $('#exportBtn');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Dönüştürülüyor…';
  try {
    const res = await fetch('/api/export', { method: 'POST' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    $('#exportResult').innerHTML =
      '<b>✓ Kitap hazır:</b>' +
      data.files.map(f => `<a href="/exports/${f}" target="_blank" download>${f}</a>`).join('');
  } catch (e) {
    $('#exportResult').innerHTML = '<span style="color:#c0392b">Hata: ' + esc(e.message) + '</span>';
  }
  btn.disabled = false;
  btn.innerHTML = original;
}

/* ---------------- Versiyonlar ---------------- */

function versionLabel(f) {
  // kitap-v2026-08-14-15-30.json -> 14.08.2026 15:30
  const m = f.match(/^kitap-v(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})(-oncesi)?\.json$/);
  if (!m) return f;
  return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}${m[6] ? ' (geri alma öncesi)' : ''}`;
}

function renderVersions(versions) {
  const box = $('#versionsBox');
  if (!versions.length) { box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="v-title">Versiyonlar</div>' +
    versions.slice(0, 8).map(f => `
      <div class="v-row">
        <span>${versionLabel(f)}</span>
        <span class="v-restore" data-vfile="${esc(f)}">geri yükle</span>
      </div>`).join('');
  box.querySelectorAll('[data-vfile]').forEach(el => {
    el.onclick = async () => {
      if (!confirm(`Kitap ${versionLabel(el.dataset.vfile)} haline geri yüklenecek. Şu anki hal de otomatik versiyonlanır. Devam?`)) return;
      const res = await fetch('/api/version/restore', {
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
        alert('Geri yükleme hatası: ' + data.error);
      }
    };
  });
}

async function loadVersions() {
  try {
    const res = await fetch('/api/versions');
    const data = await res.json();
    renderVersions(data.versions || []);
  } catch { /* sunucu yoksa sessiz geç */ }
}

async function saveVersion() {
  const btn = $('#versionBtn');
  btn.disabled = true;
  try {
    const res = await fetch('/api/version', { method: 'POST' });
    const data = await res.json();
    if (data.ok) renderVersions(data.versions);
  } catch (e) {
    alert('Versiyon kaydedilemedi: ' + e.message);
  }
  btn.disabled = false;
}

/* ---------------- Başlat ---------------- */

async function init() {
  const res = await fetch('/api/book');
  book = await res.json();
  if (!book.scratch) book.scratch = { text: '', notes: [] };
  if (!book.scratch.pads) book.scratch.pads = [];
  // Eski tek serbest alandan çoklu karalamaya geçiş
  if (book.scratch.text && book.scratch.text.trim()) {
    book.scratch.pads.unshift({ id: uid('k'), title: 'İlk karalamalarım', text: book.scratch.text, updated: Date.now() });
    book.scratch.text = '';
    scheduleSave();
  }

  $('#tipNext').onclick = () => { tipIndex++; renderTip(); };
  $('#exportBtn').onclick = doExport;
  $('#versionBtn').onclick = saveVersion;
  $('#addPartBtn').onclick = () => {
    const title = prompt('Yeni kısım başlığı (örn: BÖLÜM VI — …):');
    if (!title) return;
    book.parts.push({ id: uid('p'), title, chapters: [] });
    scheduleSave();
    renderSidebar();
  };

  renderSidebar();
  renderEditor();
  renderTip();
  renderStats();
  renderScratchTray();
  loadVersions();
}

init();
