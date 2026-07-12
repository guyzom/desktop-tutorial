// Server-side TeX -> SVG conversion using MathJax 3 (SVG output).
// Pre-rendering server-side (rather than running MathJax in the page) gives:
//   - deterministic output (no in-page async timing / font-metric races)
//   - fully self-contained HTML (inline <svg>, no runtime JS, no web fonts for math)
//   - genuine vector paths at any print resolution
// fontCache:'local' inlines each expression's glyph <path>s into its own <svg>,
// so every expression is standalone and byte-stable.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

// Custom macros are DATA (config/mathjax-macros.json), not code — this engine
// just loads and registers whatever the config declares.
const here = path.dirname(fileURLToPath(import.meta.url));
const macros = JSON.parse(fs.readFileSync(path.join(here, '../config/mathjax-macros.json'), 'utf8'));
delete macros._comment;

// FAIL-LOUD math. AllPackages bundles `noerrors` + `noundefined`, which SWALLOW
// TeX errors: an undefined macro (a typo like \fracc) renders as silent red text
// and a genuine parse error renders as an <merror> box — the compiled PDF then
// ships a wrong equation with no signal. For an academic document a wrong formula
// is worse than a bidi bug, so we (a) drop those two packages and (b) install a
// formatError that THROWS. Every bad expression now dies at generation time with
// the offending TeX in the message — caught by the harness (T3 generate step) and
// proven by tests/mathjax_render.test.mjs. Valid math is byte-identical to before
// (the dropped packages only affect the error path). This mirrors the engine's
// existing fail-loud stance (components.box throws on an unknown role).
const packages = AllPackages.filter((p) => p !== 'noerrors' && p !== 'noundefined');
const tex = new TeX({
  packages,
  macros,
  formatError: (_jax, err) => { throw err; },
});
const svgOut = new SVG({ fontCache: 'local' });
const doc = mathjax.document('', { InputJax: tex, OutputJax: svgOut });

// Convert one TeX string to a standalone SVG string.
// opts.display => display (block) vs inline.
// Throws (with the source TeX) on any undefined macro or parse error.
export function tex2svg(texString, { display = false } = {}) {
  let node;
  try {
    node = doc.convert(texString, { display });
  } catch (err) {
    throw new Error(`MathJax error in ${JSON.stringify(texString)}: ${err.message}`);
  }
  return adaptor.outerHTML(node); // <mjx-container ...><svg>...</svg></mjx-container>
}
