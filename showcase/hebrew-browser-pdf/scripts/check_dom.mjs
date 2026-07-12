// DOM-query structural bidi checker (ROADMAP B2) — the architectural win over
// the LaTeX pipeline's regex scanning (brief §3.1). Loads the RENDERED page in
// the pinned browser and runs real DOM queries against computed styles, so it
// sees direction/isolation as the engine actually resolved them — independent of
// how the HTML was generated.
//
// Rule (see the empirical note below):
//   flow-arrow-rtl  a RIGHTWARD directional arrow (→ ⇒ ↦ …) in RTL Hebrew text
//                   that is not inside an all-LTR isolate -> the arrow points
//                   against the reading direction (UBA never mirrors arrow
//                   glyphs). Use ← / ⇐ in Hebrew flow, or a colon/connective.
//
// EMPIRICAL FINDING (verified by rendering + viewing, this session): the
// requirements-extraction predicted `adjacent-ltr-islands` and
// `latin-before-paren-mirror` would TRANSFER to the browser. They do NOT. In
// Chromium, comma/slash-separated `.en`/`<bdi>` islands render in correct
// reading order, and a Latin token before a paren does NOT mirror the paren —
// CSS unicode-bidi isolation structurally eliminates both classes. Those rules
// were therefore REMOVED (they only produced false positives on correct
// content); tests/fixtures/dom_ok.html locks in that the checker stays silent
// on them. Only the arrow class genuinely transfers.
//
// Usage: node scripts/check_dom.mjs <file.html ...>
import { chromium } from 'playwright';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Rule params are DATA (config/bidi-rules.json); passed into the in-page scan.
const _here = path.dirname(fileURLToPath(import.meta.url));
const BIDI_RULES = JSON.parse(fs.readFileSync(path.join(_here, '../config/bidi-rules.json'), 'utf8'));

function serve(root) {
  return new Promise((res) => {
    const s = http.createServer((req, r) => {
      const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(root)) { r.writeHead(403); r.end(); return; }
      fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.end(d); } });
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}
function findRoot(f) {
  let d = path.dirname(path.resolve(f));
  for (;;) { if (fs.existsSync(path.join(d, 'package.json'))) return d; const p = path.dirname(d); if (p === d) return path.dirname(path.resolve(f)); d = p; }
}

// Runs in the page. Returns [{rule, text}]. `rightwardArrows` is passed in from
// config so the glyph set lives in data, not code.
function domScan(rightwardArrows) {
  const HEB = /[֐-׿]/;
  // Only RIGHTWARD arrows are wrong in RTL flow; ←/⇐ point in the reading
  // direction and are correct.
  const ARROW_RIGHT = new RegExp('[' + rightwardArrows + ']');
  const out = [];
  // Whether the text's INLINE context is isolated. Note: the HTML UA stylesheet
  // makes every block element (p, div) unicode-bidi:isolate, which isolates the
  // block from its siblings but does NOT protect an inline run within it from
  // mirroring/reordering against the block's own RTL base. So we walk up only
  // through inline ancestors and stop at the first block.
  const isolated = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (!cs.display.startsWith('inline')) return false; // hit a block boundary
      if (n.tagName === 'BDI' || cs.unicodeBidi.includes('isolate') || cs.unicodeBidi.includes('plaintext')) return true;
    }
    return false;
  };
  // text-node rules
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const el = t.parentElement; if (!el) continue;
    const dir = getComputedStyle(el).direction;
    if (dir !== 'rtl') continue;
    const s = t.data;
    if (!isolated(el) && ARROW_RIGHT.test(s) && HEB.test(el.textContent)) {
      out.push({ rule: 'flow-arrow-rtl', text: s.trim().slice(0, 50) });
    }
  }
  return out;
}

async function checkFile(file, browser) {
  const root = findRoot(file);
  const rel = '/' + path.relative(root, path.resolve(file)).split(path.sep).join('/');
  const server = await serve(root);
  const port = server.address().port;
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}${rel}`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const findings = await page.evaluate(domScan, BIDI_RULES.rightwardArrows);
  await page.close();
  server.close();
  return findings;
}

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: check_dom.mjs <file.html ...>'); process.exit(2); }
const browser = await chromium.launch({ executablePath: fs.existsSync(CHROMIUM) ? CHROMIUM : undefined });
let total = 0;
for (const f of files) {
  const findings = await checkFile(f, browser);
  for (const x of findings) { total++; console.log(`${f}: [${x.rule}] ${x.text}`); }
}
await browser.close();
console.log(total ? `\n${total} finding(s).` : 'dom-check clean.');
process.exit(total ? 1 : 0);
