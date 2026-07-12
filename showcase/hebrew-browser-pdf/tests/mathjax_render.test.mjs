// Regression fixtures for src/mathjax-render.mjs's fail-loud contract.
// A silent-error engine is exactly the failure mode this gate exists to prevent:
// every malformed expression must THROW (so the harness/generator dies), and
// every valid expression — including the pipeline's custom macros — must render.
// Run: node tests/mathjax_render.test.mjs
import { tex2svg } from '../src/mathjax-render.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); } };

const throws = (tex) => {
  try { tex2svg(tex); return false; } catch { return true; }
};

// Positives: malformed TeX MUST throw (undefined macro, parse error) rather than
// silently emit red text / an <merror> box into the PDF.
const bad = [
  ['\\fracc{1}{2}', 'undefined macro (typo)'],
  ['\\undefinedmacro x', 'undefined control sequence'],
  ['\\frac{1}{', 'missing close brace'],
  ['\\begin{pmatrix}1&2', 'unclosed environment'],
  ['x_', 'dangling subscript'],
];
for (const [tex, label] of bad) ok(`throws: ${label}`, throws(tex));

// The thrown error must carry the offending TeX, not just a generic message.
try { tex2svg('\\fracc{1}{2}'); ok('error carries source tex', false); }
catch (e) { ok('error carries source tex', e.message.includes('\\fracc')); }

// Negatives: valid math — including the config's custom macros (\ket, \tfrac,
// pmatrix, \id) — MUST render (return an <mjx-container> SVG), never throw.
const good = [
  ['\\frac12', 'plain fraction'],
  ['H=\\tfrac1{\\sqrt2}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}', 'matrix + tfrac'],
  ['\\ket\\psi=\\alpha\\ket0+\\beta\\ket1', 'custom braket macros'],
  ['H^2=\\id', 'custom \\id macro'],
  ['\\text{Normal}(\\mu,\\sigma^2)', 'latin in \\text is valid'],
];
for (const [tex, label] of good) {
  ok(`renders: ${label}`, !throws(tex) && tex2svg(tex).includes('<mjx-container'));
}

console.log(`\nmathjax_render: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
