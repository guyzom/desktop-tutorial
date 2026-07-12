// Regression fixtures for assets/topicrail.js — the "you are here" progress
// rail. This file is loaded as a plain (non-module) <script> in the browser,
// so it can't export renderRail() for import; instead we extract the real
// function source out of the file and execute it, so the test exercises the
// actual shipped logic rather than a hand-written stand-in that could drift.
// Run: node tests/topicrail.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(here, '../assets/topicrail.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); } };

// Extract `function renderRail(labels, current) { ... }` by brace-balance
// scanning, and turn it into a callable — this runs the SHIPPED source.
function extractRenderRail(src) {
  const startMarker = 'function renderRail(labels, current) {';
  const start = src.indexOf(startMarker);
  if (start < 0) throw new Error('renderRail() not found in topicrail.js — did it get renamed/refactored?');
  let depth = 0, i = start;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const body = src.slice(start, i);
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\nreturn renderRail;`)();
}
const renderRail = extractRenderRail(SRC);
const renderRailBody = SRC.slice(SRC.indexOf('function renderRail(labels, current) {'));

// --- Regression guard: the label must be in normal flow, not position:absolute ---
// (Bug 1: an absolutely-positioned label injected AFTER paged.js's layout pass,
// inside a box paged.js itself sets `align-items:center` on, does not
// contribute to the box's auto-height and rendered inconsistently across pages
// — visible on some, silently missing on others, depending on the sibling
// top-right running-header box's content on that particular page.)
ok('label is not position:absolute (regression guard for bug 1)', !renderRailBody.includes('position:absolute'));
ok('renderRail source still stacks dots-then-label in normal flow', /flex-direction:column/.test(SRC));

const labels = ['יסודות', 'שערים', 'שזירה'];

// The current dot renders enlarged + colored, and the label text appears
// exactly once, for every valid in-range index.
for (let cur = 0; cur < labels.length; cur++) {
  const html = renderRail(labels, cur);
  ok(`current=${cur}: label "${labels[cur]}" appears`, html.includes(labels[cur]));
  ok(`current=${cur}: exactly one enlarged (11px) dot`, (html.match(/width:11px/g) || []).length === 1);
  ok(`current=${cur}: no absolute positioning leaks into markup`, !html.includes('position:absolute'));
}

// --- Regression guard: out-of-range current must not throw / must not wrongly
// enlarge a dot or leak a stray label. (Bug 2's actual fix lives in the
// afterRendered() loop — `if (current >= labels.length) continue;` — which
// skips calling renderRail() at all for back-matter parts. This guards the
// renderRail() half: even if called out-of-range, it must degrade cleanly.)
{
  const html = renderRail(labels, 9); // e.g. an untracked back-matter part
  ok('out-of-range current: no dot enlarged', !html.includes('width:11px'));
  ok('out-of-range current: renders no stray label text', !labels.some((l) => html.includes(l)));
}

// --- Regression guard: the afterRendered() handler actually skips back-matter
// parts beyond the tracked topic list (source-level guard, since the handler
// itself needs a live paged.js Handler context to execute).
ok('afterRendered() skips current >= labels.length (bug 2 fix present)',
  /current\s*>=\s*labels\.length/.test(SRC));
ok('afterRendered() still skips current < 0 (existing front-matter behavior kept)',
  /current\s*<\s*0/.test(SRC));

console.log(`\ntopicrail: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
