const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableOfContents, PageBreak
} = require('docx');

/* ---------- Atıf çözümleme ---------- */

function surnames(authorField) {
  // "Kahneman, D. & Klein, G." -> "Kahneman & Klein"
  return authorField
    .split('&')
    .map(part => part.trim().split(',')[0].trim())
    .join(' & ');
}

function resolveCitations(text, sources, usedIds) {
  if (!text) return '';
  // [[source:id]] evrensel işaretçi; [[kaynak:id]] Türkçe eşanlamlısı (geriye uyumlu)
  return text.replace(/\[\[(?:kaynak|source):([^\]]+)\]\]/g, (m, id) => {
    const src = sources.find(s => s.id === id.trim());
    if (!src) return `(kaynak bulunamadı: ${id})`;
    usedIds.add(src.id);
    return `(${surnames(src.author)}, ${src.year})`;
  });
}

function apaEntry(src) {
  let s = `${src.author} (${src.year}). *${src.title}*.`;
  if (src.publisher) s += ` ${src.publisher}.`;
  if (src.url) s += ` ${src.url}`;
  return s;
}

/* ---------- Markdown çıktı ---------- */

function buildMarkdown(book) {
  const usedIds = new Set();
  const lines = [];
  const m = book.meta;

  lines.push(`# ${m.title}`);
  if (m.subtitle) lines.push(`## ${m.subtitle}`);
  lines.push(`\n**${m.author}**\n`);
  lines.push('\\newpage\n');

  // İçindekiler
  lines.push('## İçindekiler\n');
  if (book.frontmatter.onsoz) lines.push('- Önsöz');
  lines.push('- Giriş');
  for (const part of book.parts) {
    lines.push(`- **${part.title}**`);
    for (const ch of part.chapters) lines.push(`  - ${ch.title}`);
  }
  lines.push('- Kaynakça\n');

  if (book.frontmatter.onsoz) {
    lines.push('## Önsöz\n');
    lines.push(resolveCitations(book.frontmatter.onsoz, book.sources, usedIds) + '\n');
  }
  if (book.frontmatter.tesekkur) {
    lines.push('## Teşekkür\n');
    lines.push(resolveCitations(book.frontmatter.tesekkur, book.sources, usedIds) + '\n');
  }
  if (book.frontmatter.giris) {
    lines.push('## Giriş\n');
    lines.push(resolveCitations(book.frontmatter.giris, book.sources, usedIds) + '\n');
  }

  for (const part of book.parts) {
    lines.push(`# ${part.title}\n`);
    for (const ch of part.chapters) {
      lines.push(`## ${ch.title}\n`);
      const draft = resolveCitations(ch.draft, book.sources, usedIds);
      lines.push(draft ? draft + '\n' : '*[Bu bölüm henüz yazılmadı.]*\n');
    }
  }

  // Kaynakça: kullanılanlar + kullanılmayan tüm kaynaklar
  lines.push('# Kaynakça\n');
  const sorted = [...book.sources].sort((a, b) => a.author.localeCompare(b.author, 'tr'));
  for (const src of sorted) lines.push(`- ${apaEntry(src)}`);

  return lines.join('\n');
}

/* ---------- HTML çıktı ---------- */

function buildHtml(book) {
  const md = buildMarkdown(book);
  const body = marked.parse(md);
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${book.meta.title} — ${book.meta.author}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 44em; margin: 3em auto; padding: 0 1.5em; line-height: 1.7; color: #222; }
  p, li { text-align: justify; hyphens: auto; -webkit-hyphens: auto; }
  h1, h2, h3, h4 { text-align: left; }
  h1 { page-break-before: always; margin-top: 2em; }
  h1:first-of-type { page-break-before: avoid; text-align: center; font-size: 2.6em; margin-top: 2em; }
  h2 { margin-top: 1.8em; }
  blockquote { border-left: 3px solid #999; margin-left: 0; padding-left: 1em; color: #555; font-style: italic; }
  @media print { body { max-width: none; } }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

/* ---------- DOCX çıktı ---------- */

function inlineRuns(text, baseOpts = {}) {
  // **kalın** ve *italik* için basit ayrıştırma
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith('**') && p.endsWith('**')) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, ...baseOpts }));
    } else if (p.startsWith('*') && p.endsWith('*')) {
      runs.push(new TextRun({ text: p.slice(1, -1), italics: true, ...baseOpts }));
    } else {
      runs.push(new TextRun({ text: p, ...baseOpts }));
    }
  }
  return runs.length ? runs : [new TextRun({ text, ...baseOpts })];
}

function mdToDocxParagraphs(text) {
  const paras = [];
  if (!text) return paras;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith('### ')) {
      paras.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('## ')) {
      paras.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('# ')) {
      paras.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith('> ')) {
      paras.push(new Paragraph({
        children: inlineRuns(line.slice(2), { italics: true }),
        indent: { left: 720 },
        spacing: { after: 160 }
      }));
    } else if (/^[-*] /.test(line)) {
      paras.push(new Paragraph({
        children: inlineRuns(line.slice(2)),
        bullet: { level: 0 },
        alignment: AlignmentType.JUSTIFIED
      }));
    } else {
      paras.push(new Paragraph({
        children: inlineRuns(line),
        spacing: { after: 160 },
        alignment: AlignmentType.JUSTIFIED
      }));
    }
  }
  return paras;
}

async function buildDocx(book) {
  const usedIds = new Set();
  const m = book.meta;
  const children = [];

  // Kapak
  children.push(
    new Paragraph({ text: '', spacing: { before: 3000 } }),
    new Paragraph({
      children: [new TextRun({ text: m.title, bold: true, size: 72 })],
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({
      children: [new TextRun({ text: m.subtitle || '', italics: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    }),
    new Paragraph({
      children: [new TextRun({ text: m.author, size: 30 })],
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // İçindekiler (Word'de alanları güncelleyince dolar)
  children.push(
    new Paragraph({ text: 'İçindekiler', heading: HeadingLevel.HEADING_1 }),
    new TableOfContents('İçindekiler', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({ children: [new PageBreak()] })
  );

  const frontSections = [
    ['Önsöz', book.frontmatter.onsoz],
    ['Teşekkür', book.frontmatter.tesekkur],
    ['Giriş', book.frontmatter.giris]
  ];
  for (const [title, text] of frontSections) {
    if (!text) continue;
    children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
    children.push(...mdToDocxParagraphs(resolveCitations(text, book.sources, usedIds)));
  }

  for (const part of book.parts) {
    children.push(new Paragraph({ text: part.title, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
    for (const ch of part.chapters) {
      children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
      const draft = resolveCitations(ch.draft, book.sources, usedIds);
      if (draft) {
        children.push(...mdToDocxParagraphs(draft));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: '[Bu bölüm henüz yazılmadı.]', italics: true, color: '888888' })]
        }));
      }
    }
  }

  // Kaynakça
  children.push(new Paragraph({ text: 'Kaynakça', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
  const sorted = [...book.sources].sort((a, b) => a.author.localeCompare(b.author, 'tr'));
  for (const src of sorted) {
    children.push(new Paragraph({
      children: inlineRuns(apaEntry(src)),
      spacing: { after: 160 },
      indent: { left: 720, hanging: 720 }
    }));
  }

  const doc = new Document({
    creator: m.author,
    title: m.title,
    features: { updateFields: true },
    styles: {
      default: {
        document: { run: { font: 'Georgia', size: 24 } }
      }
    },
    sections: [{ children }]
  });

  return Packer.toBuffer(doc);
}

/* ---------- Ana export ---------- */

async function exportBook(book, exportDir) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  const base = `kitap-${stamp}`;
  const files = [];

  const md = buildMarkdown(book);
  const mdFile = path.join(exportDir, `${base}.md`);
  fs.writeFileSync(mdFile, md, 'utf8');
  files.push(path.basename(mdFile));

  const html = buildHtml(book);
  const htmlFile = path.join(exportDir, `${base}.html`);
  fs.writeFileSync(htmlFile, html, 'utf8');
  files.push(path.basename(htmlFile));

  const docxBuf = await buildDocx(book);
  const docxFile = path.join(exportDir, `${base}.docx`);
  fs.writeFileSync(docxFile, docxBuf);
  files.push(path.basename(docxFile));

  return files;
}

/* ---------- Çalışma notları eki (yalnızca yedek dosyası için) ---------- */

const NOTE_LABELS = { not: 'Not', sentez: 'Sentez', alinti: 'Alıntı', fikir: 'Fikir', gorsel: 'Görsel fikir' };

function buildNotesAppendix(book) {
  const lines = ['\n\n---\n\n# ÇALIŞMA NOTLARI (kitaba girmez — güvenlik yedeği)\n'];
  const sc = book.scratch || {};
  if (sc.text || (sc.notes || []).length || (sc.pads || []).length) {
    lines.push('## Karalama Defteri\n');
    for (const pad of sc.pads || []) {
      lines.push(`### ${pad.title || 'Adsız karalama'}\n`);
      if (pad.text) lines.push(pad.text + '\n');
    }
    if (sc.text) lines.push(sc.text + '\n');
    for (const n of sc.notes || []) {
      lines.push(`- **[${NOTE_LABELS[n.type] || n.type}]** ${n.text}`);
    }
    lines.push('');
  }
  for (const part of book.parts) {
    for (const ch of part.chapters) {
      if (!ch.notes.length) continue;
      lines.push(`## Notlar: ${ch.title}\n`);
      for (const n of ch.notes) {
        const src = n.sourceId ? book.sources.find(s => s.id === n.sourceId) : null;
        lines.push(`- **[${NOTE_LABELS[n.type] || n.type}]** ${n.text}${src ? ` _(${src.author}, ${src.year}${n.page ? ', s. ' + n.page : ''})_` : ''}`);
      }
      lines.push('');
    }
  }
  return lines.length > 1 ? lines.join('\n') : '';
}

module.exports = { exportBook, buildMarkdown, buildDocx, buildNotesAppendix };
