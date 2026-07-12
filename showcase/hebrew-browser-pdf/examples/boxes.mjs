// Example gallery: the six semantic boxes (ROADMAP C1). Pick by role, not colour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';
import { box, steps, mathUnderLabel } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });
const D = (t) => tex2svg(t, { display: true });

const body = [
  box('def', 'הגדרה — שער הדמרד',
    `שער הדמרד מוגדר ${M('H=\\tfrac1{\\sqrt2}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}')}, ומקיים ${M('H^2=\\id')}.`),

  box('thm', 'משפט — אי־שכפול',
    `לא קיים אופרטור אוניטרי ${M('U')} המעתיק מצב קוונטי <em>שרירותי</em>, כלומר ${M('U(\\ket\\psi\\otimes\\ket0)=\\ket\\psi\\otimes\\ket\\psi')} לכל ${M('\\ket\\psi')}.`),

  box('note', 'הערה — מוסכמת סימון',
    `לאורך הפרק ${M('\\ket0,\\ket1')} הם בסיס החישוב, ו־${M('\\ket{\\pm}=\\tfrac1{\\sqrt2}(\\ket0\\pm\\ket1)')} בסיס הדמרד.`),

  box('ex', 'תרגיל 3 — מדידה בבסיס בל',
    `<div>נתון המצב ${M('\\ket{\\Phi^+}=\\tfrac1{\\sqrt2}(\\ket{00}+\\ket{11})')}. מה ההסתברות לתוצאה ${M('00')}?</div>
     <div><strong>פתרון.</strong> ${M('P(00)=|\\braket{00}{\\Phi^+}|^2')}, כלומר ${M('\\tfrac12')} — וסימטרית ל־${M('11')}.</div>`),

  box('warn', 'טעות נפוצה',
    `אין להכניס עברית לתוך <span class="code">\\text</span> של <span class="en">MathJax</span> — היא יוצאת הפוכה.
     השתמשו בתווית <span class="en">HTML</span>: ${mathUnderLabel('mc^2', 'אנרגיית מנוחה')}.`),

  box('steps', 'פרוטוקול הטלפורטציה',
    steps([
      `<strong>(1)</strong> אליס ובוב חולקים ${M('\\ket{\\Phi^+}')}.`,
      `<strong>(2)</strong> אליס מודדת בבסיס בל את הקיוביט שלה ואת ${M('\\ket\\psi')}.`,
      `<strong>(3)</strong> אליס שולחת ${M('2')} סיביות; בוב מפעיל ${M('X,Z')} לפי התוצאה.`,
    ]), { nobreak: true }),
].join('\n');

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style> @page { size: A4; margin: 18mm; } h1 { font-size: 17pt; } </style></head>
<body><h1>גלריית הקופסאות — שישה תפקידים</h1>
<p>בחר לפי <em>תפקיד סמנטי</em>, לא לפי צבע. במסמך מאוזן הקופסאות הצבעוניות הן מיעוט (~⅓).</p>
${body}
</body></html>`;

fs.writeFileSync(path.join(here, 'boxes.html'), html);
console.log('wrote boxes.html');
