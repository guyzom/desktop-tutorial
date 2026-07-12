// Phase 0 — Spike 2: paged.js TOC with correct + stable page numbers.
// Self-contained: emits spike2_paged.html with enough dense Hebrew filler that
// chapters span pages, a title page, a TOC using CSS target-counter, a running
// header (string-set), and an auto page-number footer. No randomness.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const sent = 'ביצועי מעבד נמדדים במכפלת שלושת הגורמים: מספר הפקודות, מחזורים לפקודה, וזמן המחזור. שיפור באחד הגורמים אינו מבטיח שיפור כולל, שכן הגורמים תלויים זה בזה. חוק אמדל קובע שהאצה כוללת חסומה על ידי החלק שאינו מואץ. ';
const para = (n) => Array.from({ length: n }, () => sent).join('');
const chapters = [
  ['ch1', 'פרק א — ביצועים ומדדים', 'ביצועים', 9],
  ['ch2', 'פרק ב — מערכת הפקודות MIPS', 'הפקודות', 11],
  ['ch3', 'פרק ג — אריתמטיקה למחשב', 'אריתמטיקה', 8],
  ['ch4', 'פרק ד — המעבד והצנרת', 'הצנרת', 12],
  ['ch5', 'פרק ה — היררכיית הזיכרון', 'הזיכרון', 7],
];

const tocRows = chapters.map(([id, title]) =>
  `    <li><span class="name"><a href="#${id}">${title}</a></span>` +
  `<span class="lead"></span><span class="pgcell"><a href="#${id}"></a></span></li>`
).join('\n');
const body = chapters.map(([id, title, , n]) =>
  `<h1 id="${id}">${title}</h1>\n<p>${para(n)}</p>`
).join('\n\n');

const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style>
  @page {
    size: A4; margin: 20mm 18mm;
    @bottom-center { content: counter(page); font-family:'Frank Ruhl Libre',serif; font-size:10pt; direction:ltr; }
    @top-right { content: string(chaptitle); font-family:'Frank Ruhl Libre',serif; font-size:9pt; color:#555; }
  }
  @page :first { @top-right { content:none; } @bottom-center { content:none; } }
  h1 { string-set: chaptitle content(text); font-size:18pt; break-before:page; margin:0 0 12px;
       border-bottom:2px solid #5b7fb0; padding-bottom:4px; }
  .titlepage { text-align:center; break-after:page; padding-top:40mm; }
  .titlepage .t { font-size:26pt; font-weight:700; }
  .titlepage .s { font-size:14pt; color:#444; margin-top:8px; }
  .toc { break-after:page; }
  .toc h2 { font-size:16pt; border-bottom:1px solid #999; }
  .toc ul { list-style:none; padding:0; }
  .toc li { margin:6px 0; display:flex; align-items:baseline; }
  .toc .name a { text-decoration:none; color:#111; }
  .toc .lead { flex:1 1 auto; border-bottom:1px dotted #bbb; margin:0 8px; transform:translateY(-3px); }
  .toc .pgcell { direction:ltr; unicode-bidi:isolate; flex:0 0 auto; }
  .toc .pgcell a { text-decoration:none; color:#111; }
  .toc .pgcell a::after { content: target-counter(attr(href), page); }  /* only the pgcell gets the number */
  p { text-align:justify; }
</style>
</head>
<body>
<div class="titlepage">
  <div class="t">מבנה המחשב — לקט</div>
  <div class="s">גרסת ניסוי לצינור דפדפן (paged.js) — בדיקת מספרי עמודים ב־TOC</div>
</div>
<nav class="toc">
  <h2>תוכן העניינים</h2>
  <ul>
${tocRows}
  </ul>
</nav>
${body}
<script>
  // Must be defined BEFORE the polyfill loads.
  window.PagedConfig = { auto: true, after: () => { window.__pagedRendered = true; } };
</script>
<script src="../assets/vendor/paged.polyfill.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(here, 'spike2_paged.html'), html);
console.log('wrote spike2_paged.html');
