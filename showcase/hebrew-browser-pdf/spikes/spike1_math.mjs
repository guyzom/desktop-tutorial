// Phase 0 — Spike 1: MathJax SVG quality at print resolution.
// Reproduces the content edges of the old skill's example_math.tex in HTML:
// named operators, Latin-in-math, braket macros, text-in-math with parentheses
// (must NOT mirror), Hebrew labels inside math, display + inline math in RTL prose.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from '../src/mathjax-render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const M = (t) => tex2svg(t, { display: false });
const D = (t) => tex2svg(t, { display: true });

const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style>
  @page { size: A4; margin: 18mm 16mm 20mm 16mm; }
  .title { text-align:center; font-size:20pt; font-weight:700; margin:0 0 4pt; }
  .cite  { text-align:center; margin-bottom:14pt; }
  .defbox { border:1px solid #9db8d6; background:#eef4fb; border-radius:6px;
            padding:8px 12px; margin:10px 0; }
  .defbox .t { font-weight:700; margin-bottom:4px; }
  h2 { font-size:14pt; margin:16px 0 8px; }
</style>
</head>
<body>
  <div class="title">מסמך לדוגמה — עברית עם מתמטיקה</div>
  <div class="cite"><span class="en">N. D. Mermin, “Quantum Computer Science” (2007)</span></div>

  <h2>אומדן פאזה ל־${M('n')} סיביות ושער ${M('c^n\\text{-}Z')}</h2>

  <p>נתון אוסצילטור עם ${M('H_0 = \\hbar\\omega(a^\\dagger a + \\tfrac12)')}, ומצב
  <span class="en">qubit</span> כללי. אופרטורים: ${M('\\sin\\theta')}, ${M('\\cos\\theta')},
  ${M('\\operatorname{Tr}(\\dyad{\\psi})=1')} — צריכים להיראות זקופים ותקינים.</p>

  ${D('i\\hbar\\frac{\\partial}{\\partial t}\\ket{\\psi} = H\\ket{\\psi},\\qquad \\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}.')}

  <div class="defbox">
    <div class="t">הגדרה — שער הדמרד</div>
    ${M('H=\\tfrac1{\\sqrt2}(X+Z)')}, ומקיים ${M('HXH=Z')}. לטינית במתמטיקה: ${M('\\det(H)=-1')}.
  </div>

  <p>אופרטור הזהות נכתב ${M('\\id')}, ומצב מעורב כללי הוא
  ${M('\\rho=\\tfrac12(\\id+\\vec a\\cdot\\vec\\sigma)')} — צריך להופיע ${M('\\id')} ולא turnstile.</p>

  <ul>
    <li>סעיף ראשון, עם ${M('\\langle x\\rangle=0')}.</li>
    <li>סעיף שני: <span class="en">the energy is</span> ${M('E_n=\\hbar\\omega(n+\\tfrac12)')}.</li>
  </ul>

  <p><strong>טקסט בתוך מתמטיקה — הפרנתזות אסור להן להתהפך:</strong></p>
  ${D('X \\sim \\text{Normal}(\\mu,\\sigma^2), \\qquad \\underbrace{mc^2}_{\\text{אנרגיית מנוחה}}')}
  ${D('\\text{Specificity (TNR)} = \\frac{\\text{TN}}{\\text{TN}+\\text{FP}}, \\qquad \\text{Entropy}(\\text{קבוצה})')}

  <p>שורת אינטואיציה: כל הביטויים לעיל אמורים להיות וקטוריים (paths), לא רסטר, וברזולוציית הדפסה חדים.</p>
</body>
</html>`;

fs.writeFileSync(path.join(here, 'spike1_math.html'), html);
console.log('wrote spike1_math.html');
