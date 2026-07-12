// Example: Hebrew-labelled math via src/components.mjs (ROADMAP A1).
// Demonstrates the supported way to put Hebrew on math without MathJax \text.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';
import { mathUnderLabel, mathOverLabel, symbolSubLabel, mathRow } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });
const D = (t) => tex2svg(t, { display: true });

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style>
  @page { size: A4; margin: 18mm; }
  h1 { font-size: 17pt; } h2 { font-size: 13pt; margin: 16px 0 6px; }
  .row { margin: 10px 0; }
  .note { color:#555; font-size: 0.85em; }
</style></head><body>
<h1>תוויות עברית על מתמטיקה</h1>
<p class="note">עברית לעולם לא נכנסת ל־<span class="code">\\text</span> של MathJax (יוצא הפוך).
במקום זה התווית היא HTML מתחת/מעל סוגר ריק — ראה <span class="code">src/components.mjs</span>.</p>

<h2>תווית מתחת (under-label)</h2>
<div class="row">נוסחת איינשטיין: ${mathUnderLabel('mc^2', 'אנרגיית מנוחה')} היא רכיב האנרגיה במנוחה.</div>
<div class="row">בתוך משוואה: ${mathRow(M('E = '), mathUnderLabel('mc^2', 'אנרגיית מנוחה'), M('+ K'))} — האנרגיה הכוללת.</div>
<div class="row">עם אי (LTR) בתווית: ${mathUnderLabel('a^\\dagger a', 'אופרטור המספר <span class="en">(number)</span>')}.</div>

<h2>תווית מעל (over-label)</h2>
<div class="row">${mathRow(mathOverLabel('p_1 + p_2', 'תנע כולל'), M('= P'))}</div>

<h2>תת־סקריפט עברי על סמל</h2>
<div class="row">זמן הגישה ${symbolSubLabel('T', 'חיפוש')} ועוד ${symbolSubLabel('T', 'סיבוב')} נותנים את ההשהיה.</div>

<h2>מה שנשאר במתמטיקה טהורה (בלי עברית) — עובד רגיל</h2>
${D('\\ket{\\psi} = \\alpha\\ket{0} + \\beta\\ket{1}, \\qquad |\\alpha|^2 + |\\beta|^2 = 1')}
</body></html>`;

fs.writeFileSync(path.join(here, 'math_labels.html'), html);
console.log('wrote math_labels.html');
