// Flagship multi-page document (ROADMAP C4): assembles title page, TOC, parts,
// chapters, numbered equations + cross-refs, footnotes, and reuses the box /
// table / math-label components. This is the "produce a rendered multi-page
// document that hits every capability" target from the brief.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';
import { Doc } from '../src/document.mjs';
import { box, steps, tableBox, mathUnderLabel } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });

const d = new Doc({ title: 'יסודות החישוב הקוונטי', subtitle: 'לקט — גרסת ניסוי לצינור הדפדפן' });
d.topicRail(['יסודות', 'שזירה']);   // opt-in "you are here" progress rail

d.part('חלק א — היסודות');

d.chapter('הקיוביט ומרחב המצבים', 'qubit');
d.p(`קיוביט הוא וקטור יחידה במרחב הילברט דו־ממדי. מצב כללי נכתב כסופרפוזיציה של בסיס החישוב, כאשר המקדמים הם משרעות הסתברות מרוכבות${d.footnote('משרעת, לא הסתברות — ההסתברות היא ריבוע הערך המוחלט.')}.`);
d.eq('\\ket\\psi = \\alpha\\ket0 + \\beta\\ket1, \\qquad \\alpha,\\beta\\in\\mathbb{C}', 'state');
d.p(`תנאי הנרמול דורש שסכום ההסתברויות יהיה אחד:`);
d.eq('|\\alpha|^2 + |\\beta|^2 = 1', 'norm');
d.p(`משוואה ${d.ref('norm')} היא תנאי הנרמול; היא נובעת ישירות מהדרישה ש־${d.ref('state')} יהיה וקטור יחידה.`);
d.html(box('def', 'הגדרה — כדור בלוך',
  `כל מצב קיוביט טהור מתאים לנקודה על ספירת היחידה: ${M('\\ket\\psi = \\cos\\tfrac\\theta2\\ket0 + e^{i\\varphi}\\sin\\tfrac\\theta2\\ket1')}.`));

d.chapter('שערים קוונטיים', 'gates');
d.p(`שער קוונטי הוא טרנספורמציה אוניטרית. שער הדמרד יוצר סופרפוזיציה שווה:`);
d.eq('H\\ket0 = \\tfrac1{\\sqrt2}(\\ket0+\\ket1) = \\ket{+}', 'hgate');
d.html(tableBox('שערים בסיסיים של קיוביט בודד', `
<table><thead><tr><th>שער</th><th>מטריצה</th><th>פעולה</th></tr></thead><tbody>
  <tr><td>${M('X')}</td><td>${M('\\begin{psmallmatrix}0&1\\\\1&0\\end{psmallmatrix}')}</td><td>היפוך סיבית</td></tr>
  <tr><td>${M('Z')}</td><td>${M('\\begin{psmallmatrix}1&0\\\\0&-1\\end{psmallmatrix}')}</td><td>היפוך פאזה</td></tr>
  <tr><td>${M('H')}</td><td>${M('\\tfrac1{\\sqrt2}\\begin{psmallmatrix}1&1\\\\1&-1\\end{psmallmatrix}')}</td><td>סופרפוזיציה</td></tr>
</tbody></table>`));
d.p(`בפרק ${d.chapRef('qubit')} ראינו את מרחב המצבים; כאן אנו פועלים עליו. שים לב לתווית: ${mathUnderLabel('H\\ket0', 'סופרפוזיציה שווה')} הוא מצב הבסיס ${M('\\ket{+}')}.`);

d.part('חלק ב — שזירה');

d.chapter('מצבי בל ושזירה', 'bell');
d.p(`מצב בל הוא המצב השזור המקסימלי הפשוט ביותר:`);
d.eq('\\ket{\\Phi^+} = \\tfrac1{\\sqrt2}(\\ket{00}+\\ket{11})', 'bell');
d.html(box('thm', 'משפט — אי־שכפול',
  `לא קיים ${M('U')} אוניטרי המעתיק מצב שרירותי: ${M('U(\\ket\\psi\\otimes\\ket0)=\\ket\\psi\\otimes\\ket\\psi')} לא ייתכן לכל ${M('\\ket\\psi')}.`));
d.html(box('steps', 'פרוטוקול הטלפורטציה',
  steps([
    `<strong>(1)</strong> אליס ובוב חולקים ${M('\\ket{\\Phi^+}')} ממשוואה ${d.ref('bell')}.`,
    `<strong>(2)</strong> אליס מודדת בבסיס בל ושולחת ${M('2')} סיביות.`,
    `<strong>(3)</strong> בוב מפעיל ${M('X,Z')} לפי התוצאה ומשחזר את ${M('\\ket\\psi')}.`,
  ]), { nobreak: true }));

fs.writeFileSync(path.join(here, 'flagship.html'), d.render());
console.log('wrote flagship.html');
