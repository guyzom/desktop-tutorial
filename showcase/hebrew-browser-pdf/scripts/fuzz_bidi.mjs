// Combinatorial bidi fuzz corpus (ROADMAP B5) — the "the catalogue is a floor,
// not a ceiling" mechanism. The six hand-authored example galleries exercise a
// handful of mixed-direction constructs; this enumerates the CROSS PRODUCT of
//   island-type-pair × neutral-separator × structural-context
// so a latent reorder/reversal in, say, "a code token after a colon inside a
// table cell" cannot hide between the examples.
//
// The corpus is DETERMINISTIC (pure enumeration, no randomness) so it doubles as
// a Chromium canary: every case is validated clean on the pinned build, and a
// future browser whose bidi resolution drifts turns the harness red.
//
// Ground truth is applied by the existing proven gates plus a reading-order
// oracle (scripts/check_fuzz.py):
//   - render-gate (check_render.py)  — no Latin run renders letter-reversed
//   - dom-check   (check_dom.mjs)    — no isolation/arrow violation
//   - check_fuzz  (this corpus)      — for each case the two islands appear in
//     correct RTL reading order: island A (first logical) is LEFT of island B.
//     Why LEFT and not right: a neutral separator (comma/space/slash/…) between
//     two LTR islands resolves to L under UAX#9, so "A, B" coalesces into one
//     left-to-right group — empirically confirmed across the whole matrix before
//     this oracle was trusted. (A strong-RTL separator would flip that; the
//     corpus deliberately uses only neutral separators so the invariant is
//     uniform and checkable.)
//
// Each case carries its ground truth in data-* attributes; check_fuzz.py reads
// them, so generator and verifier never drift.
//
// Usage: node scripts/fuzz_bidi.mjs [out.html]   (default: spikes/fuzz_bidi.html)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] || path.join(here, '../spikes/fuzz_bidi.html');

// Neutral separators only — each resolves to L between two L islands, so the
// expected visual order is uniform (island A left of island B). Validated across
// all contexts before this list was trusted.
const SEPARATORS = [
  ['comma', ', '],
  ['space', ' '],
  ['slash', ' / '],
  ['colon', ': '],
  ['dash', ' – '],   // en-dash
  ['semi', '; '],
  ['pipe', ' | '],
];

// Island renderers + the exact token each renders. The token is a unique
// [A-Za-z0-9] string per case so the verifier can locate each island
// unambiguously in the PDF glyph stream, and its letter-only reverse is never
// another token (render-gate safe). TOKEN[type] MUST return exactly what ends up
// in the PDF, because the same value is written to data-a/data-b — generator and
// verifier must never disagree on the literal glyphs.
const ISLAND = {
  en: (tok) => `<span class="en">${tok}</span>`,
  code: (tok) => `<span class="code">${tok}</span>`,
  acr: (tok) => `<span class="en">${tok}</span>`,
};
const TOKEN = {
  en: (base) => base,
  code: (base) => base,
  acr: (base) => base.toUpperCase(), // acronym island renders all-caps
};
const ISLAND_PAIRS = [
  ['en', 'en'],
  ['en', 'code'],
  ['code', 'code'],
  ['acr', 'en'],
];

// Structural contexts the island pair is embedded in — each an RTL block that
// should isolate its Latin islands the same way.
const CONTEXTS = {
  p: (inner, attrs) => `<p class="fz" ${attrs}>${inner}</p>`,
  box: (inner, attrs) => `<div class="box box-note fz" ${attrs}><div class="box-body">${inner}</div></div>`,
  cell: (inner, attrs) => `<table class="fz" ${attrs}><tbody><tr><td>${inner}</td></tr></tbody></table>`,
  li: (inner, attrs) => `<ul class="fz" ${attrs}><li>${inner}</li></ul>`,
  h2: (inner, attrs) => `<h2 class="fz" ${attrs}>${inner}</h2>`,
};

const cases = [];
let i = 0;
for (const ctx of Object.keys(CONTEXTS)) {
  for (const [aType, bType] of ISLAND_PAIRS) {
    for (const [sepName, sep] of SEPARATORS) {
      // Unique tokens: 'Fz' + slot + zero-padded index, then the per-type
      // transform (e.g. acr upper-cases). Distinct, letter+digit, reverse-not-a-
      // token. The transformed value is what the verifier looks for.
      const a = TOKEN[aType](`Fza${String(i).padStart(3, '0')}`);
      const b = TOKEN[bType](`Fzb${String(i).padStart(3, '0')}`);
      const islandA = ISLAND[aType](a);
      const islandB = ISLAND[bType](b);
      const inner = `קדם ${islandA}${sep}${islandB} בתר`; // "קדם … בתר"
      const attrs = `data-a="${a}" data-b="${b}" data-atype="${aType}" data-btype="${bType}" data-sep="${sepName}" data-ctx="${ctx}"`;
      cases.push(CONTEXTS[ctx](inner, attrs));
      i++;
    }
  }
}

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style>
  @page { size: A4; margin: 14mm; }
  body { font-size: 11pt; }
  h2.fz { font-size: 12pt; margin: 2mm 0; }
  table.fz { margin: 1mm 0; }
  td { border: 1px solid #ccc; padding: 3px 6px; }
  .fz { margin: 1mm 0; }
</style></head>
<body>
<h1>Bidi fuzz corpus — island × separator × context</h1>
<p>${cases.length} מקרים. כל מקרה: שני איי LTR בזרימת RTL.</p>
${cases.join('\n')}
</body></html>`;

fs.writeFileSync(outPath, html);
console.log(`wrote ${path.relative(process.cwd(), outPath)} (${cases.length} cases)`);
