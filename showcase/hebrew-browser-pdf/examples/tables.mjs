// Example gallery: the five table patterns (ROADMAP C2).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';
import { tableBox } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });

// 1. Basic data table — Hebrew-primary (columns lay out RTL), short math islands.
const t1 = tableBox('סיבוכיות זמן של פעולות', `
<table><thead><tr><th>מבנה נתונים</th><th>חיפוש</th><th>הכנסה</th></tr></thead>
<tbody>
  <tr><td>מערך ממוין</td><td>${M('O(\\log n)')}</td><td>${M('O(n)')}</td></tr>
  <tr><td>טבלת גיבוב</td><td>${M('O(1)')}</td><td>${M('O(1)')}</td></tr>
  <tr><td>עץ אדום־שחור</td><td>${M('O(\\log n)')}</td><td>${M('O(\\log n)')}</td></tr>
</tbody></table>`);

// 2. Glossary symbol -> meaning (symbols right-aligned math islands, meaning wraps).
const t2 = tableBox('מקרא סימונים', `
<table><tbody>
  <tr><td style="width:22%">${M('\\ket\\psi')}</td><td>מצב קוונטי טהור במרחב הילברט.</td></tr>
  <tr><td>${M('\\rho')}</td><td>מטריצת צפיפות — מצב מעורב, ${M('\\operatorname{Tr}\\rho=1')}.</td></tr>
  <tr><td>${M('H')}</td><td>שער הדמרד, יוצר סופרפוזיציה מבסיס החישוב.</td></tr>
</tbody></table>`);

// 3. LTR / code column (forced LTR, monospace, multi-line code cell).
const t3 = tableBox('פקודות <span class="en">MIPS</span> נפוצות', `
<table><thead><tr><th class="mono">instr</th><th class="mono">effect</th><th>הסבר</th></tr></thead>
<tbody>
  <tr><td class="mono">lw $t0,0($s0)</td><td class="mono">$t0 = M[$s0]</td><td dir="rtl">טעינת מילה מהזיכרון</td></tr>
  <tr><td class="mono">add $t0,$t1,$t2</td><td class="mono">$t0 = $t1+$t2</td><td dir="rtl">חיבור רגיסטרים</td></tr>
  <tr><td class="mono">beq $t0,$t1,L</td><td class="mono">if == goto L</td><td dir="rtl">הסתעפות מותנית</td></tr>
</tbody></table>`, { ltr: true });

// 4. Two prose columns (term -> explanation, both wrap).
const t4 = tableBox('יתרון מול חיסרון — זיכרון מטמון', `
<table><thead><tr><th style="width:50%">יתרון</th><th>חיסרון</th></tr></thead>
<tbody>
  <tr><td>גישה מהירה לנתונים חמים בזכות מקומיות זמנית ומרחבית.</td>
      <td>עלות חומרה גבוהה ומורכבות קוהרנטיות בין ליבות.</td></tr>
</tbody></table>`);

// 5. Wide truth table — forced LTR so column ORDER reads L->R (does not reverse).
const t5 = tableBox('טבלת אמת — <span class="en">XOR</span> ו־<span class="en">AND</span>', `
<table><thead><tr><th class="c">A</th><th class="c">B</th><th class="c">A⊕B</th><th class="c">A∧B</th></tr></thead>
<tbody>
  <tr><td class="c">0</td><td class="c">0</td><td class="c">0</td><td class="c">0</td></tr>
  <tr><td class="c">0</td><td class="c">1</td><td class="c">1</td><td class="c">0</td></tr>
  <tr><td class="c">1</td><td class="c">0</td><td class="c">1</td><td class="c">0</td></tr>
  <tr><td class="c">1</td><td class="c">1</td><td class="c">0</td><td class="c">1</td></tr>
</tbody></table>`, { ltr: true });

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style> @page { size: A4; margin: 18mm; } h1{font-size:17pt} h2{font-size:12pt;margin:14px 0 4px;color:#555} </style></head>
<body><h1>גלריית הטבלאות — חמש תבניות</h1>
<p>כל טבלה במסגרת אחידה עם כותרת ממוספרת. עברית ← עמודות מימין־לשמאל; קוד/אמת ← <span class="en">LTR</span> כפוי כדי שסדר העמודות לא יתהפך.</p>
<h2>1 · נתונים בסיסי (עברי, <span class="en">RTL</span>)</h2>${t1}
<h2>2 · מקרא סמלים ומשמעותם</h2>${t2}
<h2>3 · עמודת קוד (<span class="en">LTR</span> כפוי)</h2>${t3}
<h2>4 · שני טורי פרוזה</h2>${t4}
<h2>5 · טבלת אמת רחבה (<span class="en">LTR</span> כפוי)</h2>${t5}
</body></html>`;

fs.writeFileSync(path.join(here, 'tables.html'), html);
console.log('wrote tables.html');
