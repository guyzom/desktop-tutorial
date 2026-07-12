// Spike for ROADMAP C8 (topic rail): can a paged.js Handler inject a per-page
// progress rail (one dot per part, current enlarged+labelled) into each page's
// top-center margin box, knowing the current part per page?
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));

const labels = ['יסודות', 'נתונים', 'הסקה', 'מידול', 'רשתות', 'הכללה'];
const parts = labels.map((l, i) => `
  <section class="part-divider" data-part="${i}"><h1>חלק ${i + 1} — ${l}</h1></section>
  <h2 class="chapter">${l}: פרק ראשון</h2>
  <p>${'תוכן צפוף וממשי לכל פרק, כדי שהעמודים יתמלאו ונראה את הרייל חוזר על עצמו. '.repeat(20)}</p>`).join('\n');

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style>
  @page { size: A4; margin: 24mm 18mm 20mm;
    @bottom-center { content: counter(page); font-family:'Frank Ruhl Libre'; font-size:10pt; direction:ltr; }
    @top-center { content: ''; }  /* make paged.js create the box; JS fills it */
  }
  @page :first { @bottom-center { content: none; } }
  .titlepage { break-after: page; text-align:center; padding-top:60mm; }
  .titlepage .t { font-size:26pt; font-weight:700; }
  .part-divider { break-before: page; break-after: page; text-align:center; padding-top:80mm; }
  .part-divider h1 { font-size:22pt; color:#2f6fb0; }
  h2.chapter { break-before: page; font-size:17pt; border-bottom:2px solid #5b7fb0; }
  p { text-align: justify; }
  /* rail */
  .strail { display:flex; direction:rtl; gap:9px; align-items:flex-start; justify-content:center; padding-top:2px; }
  .strail-dot { width:7px; height:7px; border-radius:50%; background:#c3c8d0; margin-top:2px; position:relative; }
  .strail-dot.cur { width:11px; height:11px; margin-top:0; background:#2f6fb0; }
  .strail-lbl { position:absolute; top:13px; left:50%; transform:translateX(-50%); font:8px 'Frank Ruhl Libre'; color:#2f6fb0; white-space:nowrap; }
</style></head>
<body>
<div class="titlepage"><div class="t">הדגמת <span class="en">topic rail</span></div></div>
${parts}
<script>
  window.__railLabels = ${JSON.stringify(labels)};
  window.PagedConfig = { auto: true, after: () => { window.__pagedRendered = true; } };
</script>
<script src="../assets/vendor/paged.polyfill.js"></script>
<script src="../assets/topicrail.js"></script>
</body></html>`;

fs.writeFileSync(path.join(here, 'spike_topicrail.html'), html);
console.log('wrote spike_topicrail.html');
