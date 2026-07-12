// Showcase document — dense Hebrew academic PDF exercising the full
// hebrew-browser-pdf pipeline: math, boxes, tables, listings, diagrams,
// quantum circuits, charts, footnotes, cross-refs, Hebrew typography.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';
import { Doc } from '../src/document.mjs';
import {
  box, steps, tableBox, hebrewList, codeBlock,
  mathUnderLabel, mathOverLabel, mathRow, symbolSubLabel,
} from '../src/components.mjs';
import { blockDiagram, circuit, lineChart } from '../src/diagram.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });
const en = (s) => `<span class="en">${s}</span>`;
const code = (s) => `<code>${s}</code>`;

const d = new Doc({
  title: 'מבנה המחשב הקוונטי',
  subtitle: 'לקט צפוף — ארכיטקטורה קלאסית, מעגלים קוונטיים, והחיבור ביניהם · ראווה ל־hebrew-browser-pdf',
});
d.topicRail(['צנרת', 'זיכרון', 'קוונטי', 'חיבור', 'תרגילים']);

// ═══════════════════════════════════════════════════════════════
d.part('חלק א — צנרת ומסופים');
// ═══════════════════════════════════════════════════════════════

d.chapter('חמשת שלבי הצנרת', 'pipeline');
d.p(`מעבד מודרני מפרק הוראה לחמישה שלבים עוקבים. כל מחזור שעון מקדם הוראה אחת לכל שלב, כך שבמצב יציב יוצאת הוראה מושלמת בכל מחזור${d.footnote('זהו ה־throughput; ה־latency של הוראה בודדת נשאר חמישה מחזורים.')}.`);

d.html(box('def', 'הגדרה — צנרת מודולרית',
  `צנרת ${en('pipeline')} היא פיצול ביצוע הוראה לרצף שלבים חופפים בזמן. חמשת השלבים הקלאסיים: ${en('IF, ID, EX, MEM, WB')}.`));

d.eq('\\mathrm{CPI}_{\\mathrm{ideal}} = 1', 'cpi-ideal');
d.p(`משוואה ${d.ref('cpi-ideal')} היא האידיאל. בפועל, סכסוכים מעלים את ${en('CPI')} מעל אחד.`);

d.html(`<div class="fig">${blockDiagram({
  width: 560, height: 150,
  nodes: [
    { id: 'if',  x: 20,  y: 50, w: 88, h: 48, label: `<bdi dir="ltr">IF</bdi><br/>שליפה` },
    { id: 'id',  x: 128, y: 50, w: 88, h: 48, label: `<bdi dir="ltr">ID</bdi><br/>פענוח` },
    { id: 'ex',  x: 236, y: 50, w: 88, h: 48, label: `<bdi dir="ltr">EX</bdi><br/>ביצוע` },
    { id: 'mem', x: 344, y: 50, w: 88, h: 48, label: `<bdi dir="ltr">MEM</bdi><br/>זיכרון` },
    { id: 'wb',  x: 452, y: 50, w: 88, h: 48, label: `<bdi dir="ltr">WB</bdi><br/>כתיבה`, fill: '#eafaef', stroke: '#4a9d63' },
  ],
  edges: [
    { from: 'if', to: 'id' }, { from: 'id', to: 'ex' },
    { from: 'ex', to: 'mem' }, { from: 'mem', to: 'wb' },
  ],
})}</div>
<div class="cap">איור — חמשת שלבי הצנרת הקלאסית</div>`);

d.html(tableBox('חמשת השלבים ותפקידם', `
<table><thead><tr><th>שלב</th><th>שם</th><th>פעולה מרכזית</th></tr></thead><tbody>
  <tr><td>${en('IF')}</td><td>שליפת הוראה</td><td>קריאה מ־${en('IMEM')} לפי ${en('PC')}</td></tr>
  <tr><td>${en('ID')}</td><td>פענוח</td><td>קריאת אוגרים, הרחבת מיידי</td></tr>
  <tr><td>${en('EX')}</td><td>ביצוע</td><td>חישוב ב־${en('ALU')} / חישוב כתובת</td></tr>
  <tr><td>${en('MEM')}</td><td>גישה לזיכרון</td><td>${code('lw')}/${code('sw')} ל־${en('DMEM')}</td></tr>
  <tr><td>${en('WB')}</td><td>כתיבה לאחור</td><td>עדכון קובץ האוגרים</td></tr>
</tbody></table>`));

d.chapter('סכסוכי נתונים וקידום', 'hazards');
d.p(`סכסוך נתונים נוצר כשהוראה זקוקה לתוצאה של קודמתה שעדיין לא הגיעה ל־${en('WB')}. הפתרון הנפוץ: ${en('forwarding')} ממעקפי ${en('EX/MEM')} ו־${en('MEM/WB')}.`);

d.html(box('key', 'רעיון מפתח — קידום',
  `במקום להמתין ל־${en('WB')}, מעבירים את התוצאה ישירות מיציאת ה־${en('ALU')} (או מ־${en('MEM')}) לקלט של ההוראה התלויה.`));

d.html(box('warn', 'מלכודת — load-use',
  `גם עם קידום מלא, ${code('lw')} ואחריו שימוש מיידי דורשים ${en('stall')} של מחזור אחד — הנתונים מגיעים רק בסוף ${en('MEM')}.`));

d.html(`<div class="fig">${blockDiagram({
  width: 520, height: 210,
  nodes: [
    { id: 'q', x: 180, y: 10, w: 160, h: 44, label: 'תלות בנתונים?' },
    { id: 'fwd', x: 40, y: 140, w: 150, h: 44, label: 'קידום מספיק', fill: '#eafaef', stroke: '#4a9d63' },
    { id: 'stall', x: 330, y: 140, w: 160, h: 44, label: `${en('load-use stall')}`, fill: '#fdeeec', stroke: '#c0392b' },
  ],
  edges: [
    { from: 'q', to: 'fwd', label: 'לא־טעינה' },
    { from: 'q', to: 'stall', label: `${en('lw')}→שימוש` },
  ],
})}</div>
<div class="cap">איור — עץ החלטה לטיפול בתלות</div>`);

d.html(box('ex', 'דוגמה — רצף עם תלות',
  `<div>הרצף הבא יוצר תלות ${en('RAW')} על ${code('\\$t0')}:</div>
   ${codeBlock(`add  $t0, $s0, $s1    # t0 = s0 + s1
sub  $t2, $t0, $s2    # needs t0 — forward from EX/MEM
lw   $t3, 0($t0)      # address from t0 — also forward
addi $t4, $t3, 4      # load-use: stall required`, { numbered: true, lang: 'asm' })}`));

d.eq('T = \\mathrm{IC}\\times\\mathrm{CPI}\\times T_{\\mathrm{clk}}', 'cpu-time');
d.p(`זמן הריצה ${d.ref('cpu-time')} הוא המכפלה הקלאסית. שיפור צנרת מקטין בעיקר את ${en('CPI')} ואת ${symbolSubLabel('T', 'clk')}.`);

// ═══════════════════════════════════════════════════════════════
d.part('חלק ב — היררכיית זיכרון');
// ═══════════════════════════════════════════════════════════════

d.chapter('מטמון וממוצע גישה', 'cache');
d.p(`היררכיית הזיכרון מנצלת מקומיות. זמן הגישה האפקטיבי למערכת עם מטמון ברמה אחת:`);

d.eq('T_{\\mathrm{avg}} = T_{\\mathrm{hit}} + r_{\\mathrm{miss}}\\cdot T_{\\mathrm{miss}}', 'tavg');
d.p(`במשוואה ${d.ref('tavg')}: ${mathRow(en('Hit rate'), M('=1-r_{\\mathrm{miss}}'))}. המשמעות: גם ${en('miss rate')} קטן מכביד אם ${mathUnderLabel('T_{\\mathrm{miss}}', 'זמן החמצה')} גדול.`);

d.html(box('result', 'נוסחת העוגן — AMAT',
  `זמן הגישה הממוצע ${mathOverLabel('T_{\\mathrm{avg}}', 'AMAT')} הוא המדד המרכזי לתכנון מטמון. כל שיפור ב־${en('hit time')} או ב־${en('miss rate')} נמדד בו.`));

d.html(tableBox('דוגמאות מספריות ל־AMAT', `
<table><thead><tr><th>${en('Hit')}</th><th>${en('Miss rate')}</th><th>${en('Miss penalty')}</th><th>${en('AMAT')}</th></tr></thead><tbody>
  <tr><td>${M('1')} מחזור</td><td>${M('5\\%')}</td><td>${M('100')}</td><td>${M('6.0')}</td></tr>
  <tr><td>${M('1')} מחזור</td><td>${M('2\\%')}</td><td>${M('100')}</td><td>${M('3.0')}</td></tr>
  <tr><td>${M('2')} מחזורים</td><td>${M('1\\%')}</td><td>${M('100')}</td><td>${M('3.0')}</td></tr>
</tbody></table>`));

d.html(`<div class="fig">${lineChart({
  width: 480, height: 260,
  xLabel: 'גודל מטמון (KB)',
  yLabel: 'שיעור החמצה (%)',
  series: [
    { name: 'ישיר', points: [[1, 18], [2, 14], [4, 10], [8, 7], [16, 5], [32, 4]] },
    { name: 'סט־4', points: [[1, 14], [2, 10], [4, 7], [8, 4.5], [16, 3], [32, 2.2]], dashed: true },
  ],
})}</div>
<div class="cap">איור — שיעור החמצה כפונקציה של גודל ואסוציאטיביות</div>`);

d.html(box('note', 'הערה — שלוש ה־C',
  `מסווגים החמצות ל־${en('Compulsory')}, ${en('Capacity')}, ${en('Conflict')}. הגדלת בלוק מקטינה compulsory; הגדלת מטמון מקטינה capacity; אסוציאטיביות מקטינה conflict.`));

d.chapter('טבלת סמלים לזיכרון', 'cache-glossary');
d.html(tableBox('מילון סמלים — מטמון', `
<table><thead><tr><th>סמל</th><th>משמעות</th></tr></thead><tbody>
  <tr><td>${M('T_{\\mathrm{hit}}')}</td><td>זמן גישה בפגיעה</td></tr>
  <tr><td>${M('r_{\\mathrm{miss}}')}</td><td>שיעור החמצות</td></tr>
  <tr><td>${M('T_{\\mathrm{miss}}')}</td><td>עונש החמצה (מחזורים)</td></tr>
  <tr><td>${en('AMAT')}</td><td>זמן גישה ממוצע</td></tr>
  <tr><td>${en('LRU')}</td><td>מדיניות החלפה: הכי פחות בשימוש לאחרונה</td></tr>
</tbody></table>`));

// ═══════════════════════════════════════════════════════════════
d.part('חלק ג — חישוב קוונטי');
// ═══════════════════════════════════════════════════════════════

d.chapter('הקיוביט ומרחב המצבים', 'qubit');
d.p(`קיוביט הוא וקטור יחידה במרחב הילברט דו־ממדי. מצב כללי הוא סופרפוזיציה של בסיס החישוב, עם משרעות מרוכבות${d.footnote('ההסתברות היא ריבוע הערך המוחלט של המשרעת — לא המשרעת עצמה.')}.`);

d.eq('\\ket\\psi = \\alpha\\ket0 + \\beta\\ket1,\\qquad |\\alpha|^2+|\\beta|^2=1', 'state');
d.p(`משוואה ${d.ref('state')} מגדירה מצב טהור. על כדור בלוך:`);

d.display('\\ket\\psi = \\cos\\tfrac\\theta2\\ket0 + e^{i\\varphi}\\sin\\tfrac\\theta2\\ket1');

d.html(box('def', 'הגדרה — כדור בלוך',
  `כל מצב קיוביט טהור מתאים לנקודה על ספירת היחידה. הקוטב הצפוני הוא ${M('\\ket0')}, הדרומי ${M('\\ket1')}.`));

d.html(tableBox('שערים בסיסיים של קיוביט בודד', `
<table><thead><tr><th>שער</th><th>מטריצה</th><th>פעולה</th></tr></thead><tbody>
  <tr><td>${M('X')}</td><td>${M('\\begin{psmallmatrix}0&1\\\\1&0\\end{psmallmatrix}')}</td><td>היפוך סיבית</td></tr>
  <tr><td>${M('Z')}</td><td>${M('\\begin{psmallmatrix}1&0\\\\0&-1\\end{psmallmatrix}')}</td><td>היפוך פאזה</td></tr>
  <tr><td>${M('H')}</td><td>${M('\\tfrac1{\\sqrt2}\\begin{psmallmatrix}1&1\\\\1&-1\\end{psmallmatrix}')}</td><td>סופרפוזיציה</td></tr>
  <tr><td>${M('S')}</td><td>${M('\\begin{psmallmatrix}1&0\\\\0&i\\end{psmallmatrix}')}</td><td>פאזה ${M('\\pi/2')}</td></tr>
</tbody></table>`));

d.eq('H\\ket0 = \\tfrac1{\\sqrt2}(\\ket0+\\ket1) = \\ket{+}', 'hgate');
d.p(`שער הדמרד ${d.ref('hgate')} יוצר סופרפוזיציה שווה: ${mathUnderLabel('H\\ket0', 'סופרפוזיציה שווה')}.`);

d.chapter('שזירה ומצבי בל', 'bell');
d.p(`מצב בל הוא המצב השזור המקסימלי הפשוט ביותר לשני קיוביטים:`);
d.eq('\\ket{\\Phi^+} = \\tfrac1{\\sqrt2}(\\ket{00}+\\ket{11})', 'bell');

d.html(`<div class="fig">${circuit({
  wires: 2, wireLabels: ['|0⟩', '|0⟩'],
  columns: [
    [{ g: 'H', wire: 0 }],
    [{ ctrl: 0, target: 1 }],
    [{ meter: 0 }, { meter: 1 }],
  ],
})}</div>
<div class="cap">איור — הכנת מצב בל ומדידה</div>`);

d.html(box('thm', 'משפט — אי־שכפול',
  `לא קיים אופרטור אוניטרי ${M('U')} המעתיק מצב שרירותי: ${M('U(\\ket\\psi\\otimes\\ket0)=\\ket\\psi\\otimes\\ket\\psi')} לא ייתכן לכל ${M('\\ket\\psi')}.`));

d.p(`הוכחה בקצרה: נניח שקיים ${M('U')} כזה לשני מצבים. אז ${M('\\braket{\\psi}{\\phi}=\\braket{\\psi}{\\phi}^2')}, ולכן ${M('\\braket{\\psi}{\\phi}\\in\\{0,1\\}')} — סתירה לליניאריות על מצב שרירותי.`);

d.chapter('טלפורטציה קוונטית', 'teleport');
d.p(`טלפורטציה מעבירה מצב לא ידוע באמצעות שזירה משותפת ושתי סיביות קלאסיות — בלי לשלוח את הקיוביט עצמו.`);

d.html(box('steps', 'פרוטוקול הטלפורטציה',
  steps([
    `<strong>(1)</strong> אליס ובוב חולקים ${M('\\ket{\\Phi^+}')} ממשוואה ${d.ref('bell')}.`,
    `<strong>(2)</strong> אליס מודדת בבסיס בל את הקיוביט שלה ואת ${M('\\ket\\psi')}, ושולחת ${M('2')} סיביות.`,
    `<strong>(3)</strong> בוב מפעיל ${M('X')} ו/או ${M('Z')} לפי התוצאה ומשחזר את ${M('\\ket\\psi')}.`,
  ]), { nobreak: true }));

d.html(`<div class="fig">${circuit({
  wires: 3, wireLabels: ['|ψ⟩', '|0⟩', '|0⟩'],
  columns: [
    [{ g: 'H', wire: 1 }],
    [{ ctrl: 1, target: 2 }],
    [{ ctrl: 0, target: 1 }],
    [{ g: 'H', wire: 0 }],
    [{ meter: 0 }, { meter: 1 }],
    [{ g: 'X', wire: 2 }],
    [{ g: 'Z', wire: 2 }],
  ],
})}</div>
<div class="cap">איור — מעגל טלפורטציה (פישוט סכמטי)</div>`);

d.html(box('key', 'לקח',
  `שזירה + ערוץ קלאסי = העברת מצב קוונטי. אי־שכפול מבטיח שאי אפשר להעתיק בלי להרוס את המקור.`));

// ═══════════════════════════════════════════════════════════════
d.part('חלק ד — החיבור: בקרה קלאסית על מעגל קוונטי');
// ═══════════════════════════════════════════════════════════════

d.chapter('בקרת משוב היברידית', 'hybrid');
d.p(`מערכת קוונטית מעשית נשלטת ע״י מחשב קלאסי: תזמון פולסים, קריאת מדידות, ועדכון פרמטרים באלגוריתמים וריאציוניים (${en('VQE')}, ${en('QAOA')}).`);

d.html(`<div class="fig">${blockDiagram({
  width: 540, height: 180,
  nodes: [
    { id: 'cpu', x: 30,  y: 60, w: 130, h: 52, label: `מעבד <bdi dir="ltr">(CPU)</bdi>` },
    { id: 'ctrl',x: 200, y: 60, w: 140, h: 52, label: `בקר <bdi dir="ltr">AWG</bdi>` },
    { id: 'qpu', x: 380, y: 60, w: 130, h: 52, label: `שבב <bdi dir="ltr">(QPU)</bdi>`, fill: '#e7eef5', stroke: '#2c4763' },
  ],
  edges: [
    { from: 'cpu', to: 'ctrl', label: 'פרמטרים' },
    { from: 'ctrl', to: 'qpu', label: 'פולסים' },
    { from: 'qpu', to: 'cpu', label: 'מדידות', dashed: true },
  ],
})}</div>
<div class="cap">איור — לולאת בקרה היברידית</div>`);

d.html(box('note', 'מוסכמה',
  `בקוד הבקרה משתמשים בהערות באנגלית בלבד. עברית בפרוזה; מזהים טכניים ב־${code('code')}.`));

d.html(box('ex', 'דוגמה — שליפת תוצאת מדידה',
  `${codeBlock(`# Classical side: collect bitstrings from QPU shots
counts = backend.run(circuit, shots=1024).result().get_counts()
p00 = counts.get("00", 0) / 1024
# Estimate <Z⊗Z> from parity of bitstrings
expval = sum(((-1)**bin(int(b,2)).count("1")) * c
             for b, c in counts.items()) / 1024`, { numbered: true, lang: 'c' })}`));

d.html(tableBox('טבלת אמת — פריטי מדידה בשני קיוביטים', `
<table><thead><tr><th>${en('bitstring')}</th><th>${M('Z\\otimes Z')}</th><th>תרומה ל־${M('\\langle Z\\otimes Z\\rangle')}</th></tr></thead><tbody>
  <tr><td>${code('00')}</td><td>${M('(+1)')}</td><td>חיובית</td></tr>
  <tr><td>${code('01')}</td><td>${M('(-1)')}</td><td>שלילית</td></tr>
  <tr><td>${code('10')}</td><td>${M('(-1)')}</td><td>שלילית</td></tr>
  <tr><td>${code('11')}</td><td>${M('(+1)')}</td><td>חיובית</td></tr>
</tbody></table>`, { ltr: true }));

d.chapter('התמונה הגדולה', 'bigpic');
d.p(`שלושה עקרונות מקשרים את החלקים:`);
d.html(hebrewList([
  `צנרת קלאסית ממקסמת ${en('throughput')} תחת תלויות — קידום ו־${en('stall')} הם מחיר התלויות.`,
  `מטמון ממיר מקומיות ל־${en('AMAT')} נמוך — הנוסחה ${d.ref('tavg')} היא מצפן התכנון.`,
  `מעגל קוונטי ממיר שזירה ליכולת שלא קיימת קלאסית — טלפורטציה ואי־שכפול הם הגבולות.`,
]));

d.html(box('result', 'סיכום — נוסחת הזמן הקלאסית עדיין שולטת בבקרה',
  `גם במערכת היברידית, זמן הריצה של לולאת הבקרה נמדד ב־${d.ref('cpu-time')}. ה־${en('QPU')} הוא מאיץ; הצוואר הוא לעתים קרובות ה־${en('CPU')} והערוץ.`));

// ═══════════════════════════════════════════════════════════════
d.part('חלק ה — תרגילים פתורים');
// ═══════════════════════════════════════════════════════════════

d.chapter('תרגילים', 'exercises');

d.html(box('ex', 'תרגיל 1 — חישוב AMAT',
  `<div><strong>(א)</strong> מטמון עם ${mathRow(en('hit time'), M('=1'))}, ${mathRow(en('miss rate'), M('=0.04'))}, ${mathRow(en('miss penalty'), M('=80'))}. חשב ${en('AMAT')}.</div>
   <div><strong>(ב)</strong> אם מגדילים את המטמון ו־${en('miss rate')} יורד ל־${M('0.02')} אבל ${en('hit time')} עולה ל־${M('2')}, האם כדאי?</div>`));

d.html(box('key', 'פתרון 1',
  steps([
    `<strong>פתרון (א).</strong>`,
    `לפי ${d.ref('tavg')}:`,
  ])));
d.display('T_{\\mathrm{avg}}=1+0.04\\cdot 80=4.2');
d.p(`מחזורים. <strong>פתרון (ב).</strong>`);
d.display('T_{\\mathrm{avg}}=2+0.02\\cdot 80=3.6');
d.p(`כן, כדאי: ירידה מ־${M('4.2')} ל־${M('3.6')}.`);
d.p(`<strong>לקח.</strong> הקטנת ${en('miss rate')} יכולה לפצות על עלייה ב־${en('hit time')} — בודקים תמיד ב־${en('AMAT')}.`);

d.html(box('ex', 'תרגיל 2 — הסתברות במצב בל',
  `<div>נתון ${M('\\ket{\\Phi^+}')} ממשוואה ${d.ref('bell')}. מהי ${M('P(00)')}? מהי ${M('P(01)')}?</div>`));

d.html(box('key', 'פתרון 2',
  steps([
    `<strong>פתרון.</strong>`,
  ])));
d.display('P(00)=\\bigl|\\braket{00}{\\Phi^+}\\bigr|^2=\\tfrac12');
d.p(`${M('P(01)=0')} — אין רכיב ${M('\\ket{01}')} במצב.`);
d.p(`<strong>לקח.</strong> במצב בל אידיאלי המדידות מתואמות לחלוטין; תוצאות מנוגדות מתאפסות.`);

d.html(box('ex', 'תרגיל 3 — סכסוך load-use',
  `<div>עבור הרצף:</div>
   ${codeBlock(`lw   $t0, 0($s0)
add  $t1, $t0, $s1`, { lang: 'asm' })}
   <div>כמה מחזורי ${en('stall')} נדרשים עם קידום מלא? בלי קידום?</div>`));

d.html(box('key', 'פתרון 3',
  steps([
    `<strong>פתרון.</strong>`,
    `עם קידום מלא: מחזור ${en('stall')} אחד (load-use).`,
    `בלי קידום: שני מחזורים (המתנה עד אחרי ${en('WB')}).`,
    `<strong>לקח.</strong> קידום לא מבטל את כל העצירות — רק את רובן.`,
  ])));

d.chapter('נספח — זהויות שימושיות', 'appendix');
d.p(`זהויות בסיסיות לשימוש חוזר:`);
d.display('HXH = Z,\\qquad HZH = X,\\qquad H^2 = I');
d.display('\\ket{\\Phi^\\pm}=\\tfrac1{\\sqrt2}(\\ket{00}\\pm\\ket{11}),\\qquad \\ket{\\Psi^\\pm}=\\tfrac1{\\sqrt2}(\\ket{01}\\pm\\ket{10})');
d.p(`ציטוט סיום: המסמך הזה הוא ״מבחן קצה״ לצינור — מתמטיקה וקטורית, דיאגרמות עם לטינית מעורבת, מעגלים, גרפים, קופסאות, טבלאות וקוד — בלי tofu ובלי היפוכי כיוון.`);

const outHtml = path.join(here, 'insanity.html');
let html = d.render();
if (!html.includes('.fig{')) {
  html = html.replace(
    '</head>',
    `<style>.fig{margin:10px 0 4px}.fig svg{display:block;margin:0 auto;max-width:100%}.cap{text-align:center;font-size:10pt;color:#444;margin:0 0 14px}</style></head>`,
  );
}
fs.writeFileSync(outHtml, html);
console.log('wrote', outHtml);
