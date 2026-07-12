// Reusable content components for the browser-native pipeline.
// The first is the ROADMAP A1 fix: label math with Hebrew WITHOUT putting Hebrew
// inside MathJax (which renders it reversed + letter-spaced — see PHASE0.md).
//
// Mechanism: MathJax draws \underbrace{expr} / \overbrace{expr} as a brace with
// NO TeX label; the Hebrew label is composed as HTML in a flex column centered
// under/over the SVG. The Hebrew therefore gets full HTML bidi and reads
// correctly. Requires the .mlab CSS in assets/css/base.css.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from './mathjax-render.mjs';

const M = (t) => tex2svg(t, { display: false });
// Language keyword sets and the box registry are DATA.
const _here = path.dirname(fileURLToPath(import.meta.url));
const _cfg = (f) => JSON.parse(fs.readFileSync(path.join(_here, '../config', f), 'utf8'));
const LANGUAGES = _cfg('languages.json');
const BOXES = _cfg('boxes.json');

// mathUnderLabel('mc^2', 'אנרגיית מנוחה')
//   -> braced math with the Hebrew label centered beneath it.
// The label is plain HTML (may itself contain .en/.code islands).
export function mathUnderLabel(mathTex, labelHtml) {
  return `<span class="mlab"><span class="mlab-m">${M('\\underbrace{' + mathTex + '}')}</span>` +
         `<span class="mlab-u">${labelHtml}</span></span>`;
}

// mathOverLabel('p_1+p_2', 'תנע כולל')
export function mathOverLabel(mathTex, labelHtml) {
  return `<span class="mlab"><span class="mlab-o">${labelHtml}</span>` +
         `<span class="mlab-m">${M('\\overbrace{' + mathTex + '}')}</span></span>`;
}

// The semantic boxes (mdframed equivalents). Two axes, chosen independently:
//   ROLE   — what the content IS: result, key, def, thm, warn, note, ex.
//   WEIGHT — how much salience it earns (set per-role in config/boxes.json),
//            tracking how the reader USES it. The ladder (W1 loudest → W5
//            quietest):
//     W1 result — the ONE central formula/law of a section. Filled, strongest.
//     W2 key    — the takeaway / procedure / summary to carry away. Filled,
//                 near-twin of W1, a hair softer. The everyday "important box".
//     W3 def/thm — a formal object you flip BACK to. Bar + title, no fill.
//     W4 warn   — a caution/distinction in the running argument. Warm bar.
//     W5 note/ex — convention, remark, worked example. Neutral gray, subdued.
// BOXES ARE SCARCE: prose is the default; ~1 box/chapter; box share < 10%.
// Only W1+W2 are filled — that scarcity is what makes a fill read as "this is
// the thing". Reach for W1 at most once per section, for its single anchor.
// opts.nobreak keeps a short reference box from splitting across a page.
const BOX_ROLES = new Set(Object.keys(BOXES).filter((k) => k !== '_comment'));
export function box(role, title, bodyHtml, { nobreak = false } = {}) {
  if (!BOX_ROLES.has(role)) throw new Error(`unknown box role: ${role}`);
  const weight = BOXES[role].weight || 3;
  const cls = `box box-${role} box-w${weight}${nobreak ? ' box-nobreak' : ''}`;
  return `<div class="${cls}"><div class="box-title">${title}</div>` +
         `<div class="box-body">${bodyHtml}</div></div>`;
}

// A per-line step list for inside a box (one item per line, mirrors the old
// skill's \\-separated step pattern).
export function steps(items) {
  return `<div class="step-list">${items.map((s) => `<div>${s}</div>`).join('')}</div>`;
}

// Hebrew list. opts.hebrew (default true for ordered) uses native CSS Hebrew
// numerals (א,ב,ג…); opts.ordered=false emits a bulleted <ul>. Each item is HTML
// (may hold .en/.code islands, math, gershayim).
export function hebrewList(items, { ordered = true, hebrew = true } = {}) {
  const tag = ordered ? 'ol' : 'ul';
  const cls = ordered && hebrew ? ' class="heb"' : '';
  return `<${tag}${cls}>${items.map((s) => `<li>${s}</li>`).join('')}</${tag}>`;
}

// Uniform framed + auto-numbered ("טבלה N.") table wrapper. Every table goes
// through this. opts.ltr forces LTR column order for code / truth / matrix
// tables (Hebrew-primary tables omit it and lay out RTL). opts.wide adds a
// horizontal scroll container so a very wide table never overflows the page.
// opts.tall (rows-per-chunk number, or true for the default 18): splits a LONG
// table into consecutive chunks, each its own framed block with the header row
// repeated and a "(המשך)" caption. REQUIRED for any table that may exceed one
// page: an unbreakable block taller than a page is silently DROPPED by the
// paged.js pipeline, and letting paged.js fragment the table instead loses the
// rows past the first page (both verified empirically on a 60-row table:
// avoid -> 0/60 rows survive, auto -> 26/60). Chunking keeps every block
// smaller than a page so the failure mode cannot occur.
const TALL_DEFAULT_ROWS = 18;
export function tableBox(captionHtml, tableHtml, { ltr = false, wide = false, tall = false } = {}) {
  const cls = `tablebox${ltr ? ' tablebox-ltr' : ''}${wide ? ' tablebox-wide' : ''}`;
  if (!tall) {
    return `<div class="${cls}"><div class="tabcap">${captionHtml}</div>${tableHtml}</div>`;
  }
  const per = tall === true ? TALL_DEFAULT_ROWS : Math.max(2, tall | 0);
  const theadM = tableHtml.match(/<thead\b[\s\S]*?<\/thead>/i);
  const thead = theadM ? theadM[0] : '';
  const bodyM = tableHtml.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
  const bodyInner = bodyM ? bodyM[1] : tableHtml.replace(/<\/?table[^>]*>/gi, '').replace(thead, '');
  const rows = bodyInner.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  if (rows.length <= per) {
    return `<div class="${cls}"><div class="tabcap">${captionHtml}</div>${tableHtml}</div>`;
  }
  const chunks = [];
  for (let i = 0; i < rows.length; i += per) chunks.push(rows.slice(i, i + per));
  return chunks.map((chunk, ci) => {
    const cont = ci > 0;
    const c = `${cls}${cont ? ' tablebox-cont' : ''}`;
    const cap = cont ? captionHtml : captionHtml;
    return `<div class="${c}"><div class="tabcap">${cap}</div>` +
           `<table>${thead}<tbody>${chunk.join('')}</tbody></table></div>`;
  }).join('');
}

// Code listing — LTR-isolated so punctuation never reorders. opts.numbered adds
// line numbers; opts.keywords is a list of tokens to tint. Comments (# or //)
// and "double-quoted" strings are tinted automatically. Contained by its parent
// box via the CSS box model (no page-relative overflow).
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function codeBlock(code, { numbered = false, keywords = [], lang = null } = {}) {
  if (lang && !keywords.length) keywords = LANGUAGES[lang] || [];   // lang -> keywords from data
  const kwRe = keywords.length ? new RegExp('\\b(' + keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g') : null;
  // Split off the trailing comment first so keyword/string tinting never runs
  // over comment text, then tint the code part. Inserted spans use SINGLE-quoted
  // attributes so the double-quote string regex can't match our own markup.
  const hi = (line) => {
    const m = line.match(/(#.*|\/\/.*)$/);
    const comment = m ? m[0] : '';
    let code = comment ? line.slice(0, line.length - comment.length) : line;
    let s = escapeHtml(code);
    s = s.replace(/("[^"]*")/g, "<span class='st'>$1</span>");
    if (kwRe) s = s.replace(kwRe, "<span class='kw'>$1</span>");
    return s + (comment ? `<span class='cm'>${escapeHtml(comment)}</span>` : '');
  };
  const lines = code.replace(/\n$/, '').split('\n');
  const inner = numbered
    ? lines.map((l) => `<span class="ln">${hi(l)}</span>`).join('\n')
    : lines.map(hi).join('\n');
  return `<div class="listing${numbered ? ' numbered' : ''}"><pre>${inner}</pre></div>`;
}

// mathRow(...parts) — an LTR isolate that composes a SINGLE math expression
// from several pieces (math islands, labeled terms). This is the ONLY correct
// way to build 'E = <labeled mc^2> + K': as bare siblings in RTL prose the
// isolates reorder visually; inside the row they are pinned left-to-right.
// The island-fragment linter permits operator-edged fragments only inside a
// mathRow(...) call.
export function mathRow(...parts) {
  return `<span class="mrow">${parts.join('')}</span>`;
}

// A Hebrew subscript/superscript label on a symbol, again via HTML not \text:
//   symbolSubLabel('T', 'זמן חיפוש')  ->  T with a small Hebrew subscript.
export function symbolSubLabel(symbolTex, labelHtml, { sup = false } = {}) {
  const cls = sup ? 'mlab-sup' : 'mlab-sub';
  return `<span class="mlab-s"><span class="mlab-m">${M(symbolTex)}</span>` +
         `<span class="${cls}">${labelHtml}</span></span>`;
}
