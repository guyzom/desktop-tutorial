// Source bidi linter (start of ROADMAP B2). Catches the *transferring* bug
// classes that are correct Unicode behavior and therefore the render engine
// will NOT save the author from — plus the new pipeline-specific class found in
// Phase 0. Each rule has positive+negative fixtures in tests/check_bidi.test.mjs.
//
// Implemented so far:
//   hebrew-in-math-text  (ROADMAP A2) — Hebrew codepoints inside a MathJax
//     \text{}/\mathrm{}/\textrm{}/\mbox{} argument. MathJax renders these
//     reversed + letter-spaced (PHASE0.md spike 1); Hebrew math labels must be
//     composed as HTML (src/components.mjs), never inside MathJax.
//   hebrew-ascii-quote / hebrew-quoted-word — ASCII "/' between Hebrew letters
//     (use gershayim/geresh; a prefixed quoted word gets curly quotes).
//   raw-html-in-island (v0.9.4) — raw < > & inside a code()/en() island
//     argument. The island emits raw HTML, so '<'+letter opens a tag and
//     swallows the run, gluing prose to code (found in a real build).
//   inline-math-chain (v0.9.5) — a derivation chain (2+ '=') inside INLINE
//     math M('…'). Inline is for atoms; a chain zigzags the RTL reading
//     order and wraps badly — it earns its own display line.
//   run-on-structure (v0.9.8, strict v0.9.9) — a bold sub-part marker
//     ((א)/(ב)/(1)…) or lead-in (פתרון/לקח/דוגמה/מסקנה) that does not OPEN
//     its line/paragraph.
//   island-fragment (v0.9.9) — an island argument that starts/ends with a
//     binding operator (= : ; + →): a relation split across islands
//     reorders under RTL; a relation is ONE island.
//   hebrew-in-codeblock (v0.9.9) — Hebrew inside a codeBlock listing
//     (comments must be English; Hebrew reorders against the LTR run).
//
// Usage: node scripts/check_bidi.mjs <file...>   (scans .html/.mjs/.tex text)
//        import { lint } from './check_bidi.mjs'  (returns findings[])

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HEBREW = /[֐-׿יִ-ﭏ]/;
// The text-macro list and Hebrew punctuation marks are DATA (config/bidi-rules.json).
const _here = path.dirname(fileURLToPath(import.meta.url));
const _bidiCfg = JSON.parse(fs.readFileSync(path.join(_here, '../config/bidi-rules.json'), 'utf8'));
const TEXT_MACROS = _bidiCfg.textMacros;
const GERSHAYIM = _bidiCfg.gershayim; // ״ U+05F4
const GERESH = _bidiCfg.geresh;       // ׳ U+05F3

// Extract the brace-balanced argument starting at `open` (index of '{').
function braceArg(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth === 0) return { arg: s.slice(open + 1, i), end: i }; }
  }
  return null;
}

// Rule: hebrew-in-math-text
export function hebrewInMathText(src) {
  const findings = [];
  const macroRe = new RegExp('\\\\(' + TEXT_MACROS.join('|') + ')\\s*\\{', 'g');
  let m;
  while ((m = macroRe.exec(src))) {
    const openBrace = m.index + m[0].length - 1;
    const parsed = braceArg(src, openBrace);
    if (!parsed) continue;
    if (HEBREW.test(parsed.arg)) {
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        rule: 'hebrew-in-math-text',
        line,
        macro: `\\${m[1]}`,
        excerpt: `\\${m[1]}{${parsed.arg.slice(0, 30)}${parsed.arg.length > 30 ? '…' : ''}}`,
        message: `Hebrew inside \\${m[1]}{} — MathJax renders it reversed. Use src/components.mjs (mathUnderLabel/mathOverLabel) or an HTML label, not \\${m[1]}.`,
      });
    }
    macroRe.lastIndex = parsed.end; // skip past this argument
  }
  return findings;
}

// Rule: hebrew-ascii-quote (+ hebrew-quoted-word sub-case)
// Hebrew abbreviations/acronyms take gershayim ״ (U+05F4) before the last letter
// (ע״י, סה״כ, תנ״ך) and single words a geresh ׳ (U+05F3) (ג׳ורג׳); an ASCII " or '
// is a straight typewriter quote, not the correct Hebrew punctuation mark, and
// renders visibly wrong. We flag ONLY the unambiguous case — an ASCII quote
// sitting BETWEEN two Hebrew letters — so a straight quote used as a real quote
// delimiter (or a JS string quote in an authored .mjs) never false-positives.
//
// BUT: letter-quote-letter is also exactly what a genuine quoted WORD looks like
// when it carries one of Hebrew's seven one-letter prefixes (ו/ה/ב/ל/כ/מ/ש —
// "and/the/in/to/as/from/that"), since those prefixes always attach with no
// space: כ"סיבוב" ("as 'rotation'"), ה"מתכון" ("the 'recipe'"). That is NOT an
// abbreviation — gershayim there would be linguistically wrong — it is a quoted
// word that should get proper curly quotes “…” instead. Found empirically: both
// instances of this in a downstream project's content were flagged by the
// original single rule and would have been "fixed" into incorrect Hebrew.
// Distinguishing signal: in a true abbreviation (סה"כ, ע"י) the letter(s) before
// the quote are NOT a standalone one-letter word — they're stuck to a longer
// abbreviation with no preceding word boundary. In the prefix+quote case, the
// single letter IS its own word (preceded by start-of-string/space/punctuation).
const HEB = '\\u0590-\\u05FF\\uFB1D-\\uFB4F';
const GERSHAYIM_RE = new RegExp('([' + HEB + '])"([' + HEB + '])');
const GERESH_RE = new RegExp("([" + HEB + "])'([" + HEB + "])");
const PREFIX_LETTERS = 'ובלכמשה';
const QUOTED_WORD_RE = new RegExp('(?:^|[^' + HEB + '])([' + PREFIX_LETTERS + '])"([' + HEB + ']+)"');
export function hebrewAsciiQuote(src) {
  const findings = [];
  const lines = src.split('\n');
  lines.forEach((text, i) => {
    // Check the more specific "quoted word with attached prefix" case FIRST,
    // and skip the generic gershayim rule for any quote it already accounts for.
    const claimed = new Set();
    let qm;
    const qre = new RegExp(QUOTED_WORD_RE.source, 'g');
    while ((qm = qre.exec(text))) {
      const letterIdx = qm.index + qm[0].indexOf(qm[1]);
      claimed.add(letterIdx);
      findings.push({
        rule: 'hebrew-quoted-word',
        line: i + 1,
        excerpt: `${qm[1]}"${qm[2]}"`,
        message: `ASCII quotes around a word with an attached one-letter prefix (${qm[1]}) — this reads as a genuine quotation, not an abbreviation, so gershayim ״ would be wrong here. Use curly quotes “…” instead.`,
      });
    }
    const scan = (re, mark, name, ascii) => {
      const r = new RegExp(re.source, 'g');
      let m;
      while ((m = r.exec(text))) {
        if (claimed.has(m.index)) continue; // already classified as a quoted word above
        findings.push({
          rule: 'hebrew-ascii-quote',
          line: i + 1,
          excerpt: `${m[1]}${ascii}${m[2]}`,
          message: `ASCII ${ascii === '"' ? 'double-quote' : 'apostrophe'} between Hebrew letters — use ${name} ${mark} (${ascii === '"' ? 'gershayim' : 'geresh'}), not ${ascii === '"' ? '"' : "'"}.`,
        });
      }
    };
    scan(GERSHAYIM_RE, GERSHAYIM, 'gershayim', '"');
    scan(GERESH_RE, GERESH, 'geresh', "'");
  });
  return findings;
}

// Rule: raw-html-in-island
// The inline island helpers — code('…') / en('…') — emit their argument as RAW
// HTML. A bare `<` followed by a letter therefore OPENS A TAG and swallows the
// rest of the run: code('i<len') rendered as a bare "i" with broken span
// nesting that visually glued the surrounding Hebrew prose to the next code
// island (observed in a real 81-page build — the reader could no longer tell
// code from prose). A bare `&` risks entity misparse. Require entities
// (&lt; &gt; &amp;) inside island arguments. Scoped to code()/en() call
// arguments only, so codeBlock() — which escapes for you — and legitimate HTML
// in template prose never false-positive.
const ISLAND_CALL_RE = /\b(code|en)\(\s*(['"`])((?:\\.|(?!\2).)*)\2\s*\)/;
const RAW_HTML_CHAR_RE = /<|>|&(?!(?:lt|gt|amp|quot|#\d+|#x[0-9a-fA-F]+);)/;
export function rawHtmlInIsland(src) {
  const findings = [];
  const re = new RegExp(ISLAND_CALL_RE.source, 'g');
  let m;
  while ((m = re.exec(src))) {
    const arg = m[3];
    if (RAW_HTML_CHAR_RE.test(arg)) {
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        rule: 'raw-html-in-island',
        line,
        excerpt: `${m[1]}('${arg.slice(0, 34)}${arg.length > 34 ? '…' : ''}')`,
        message: `raw <, > or & inside ${m[1]}() — the island emits raw HTML, so '<'+letter opens a tag and swallows the run, gluing the surrounding prose. Write &lt; &gt; &amp; instead.`,
      });
    }
  }
  return findings;
}

// Rule: inline-math-chain
// Inline math — M('…') by the documented helper convention — is for ATOMS: a
// symbol, a value, or one short relation (a single '='). A derivation CHAIN
// (two or more '=') woven into RTL prose makes the line's reading order
// zigzag: the reader tracks Hebrew right-to-left, hits a long LTR run,
// jumps to its left end, and the line-wrap can chop the chain mid-derivation
// (observed in a real build: T = 3·IC/3·10⁹ = 10⁻⁹·IC inline in a prose
// paragraph). A chain is a formula and earns its own display line —
// d.display()/d.eq() — with the prose around it staying prose.
const INLINE_MATH_RE = /\bM\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*\)/;
export function inlineMathChain(src) {
  const findings = [];
  const re = new RegExp(INLINE_MATH_RE.source, 'g');
  let m;
  while ((m = re.exec(src))) {
    const arg = m[2];
    if ((arg.match(/=/g) || []).length >= 2) {
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        rule: 'inline-math-chain',
        line,
        excerpt: `M('${arg.slice(0, 40)}${arg.length > 40 ? '…' : ''}')`,
        message: `derivation chain (2+ '=') in INLINE math — inline is for atoms (symbol / value / one relation). Give the chain its own display line (d.display()/d.eq()); it reads as a formula, not as prose.`,
      });
    }
  }
  return findings;
}

// Rule: run-on-structure
// Two forms of the same friction, found in a real build: STRUCTURAL units
// crammed into one running line. (a) Multi-part enumeration — two or more
// bold sub-part markers like <strong>(א)</strong> … <strong>(ב)</strong> on
// one line: separate sub-questions/sub-answers are separate units and each
// gets its own line (a step-list div or its own paragraph). This is NOT the
// content-density principle — density is information per sentence, not
// separate items glued together. (b) A bold structural lead-in — פתרון. /
// לקח. / דוגמה. / מסקנה. — appearing mid-paragraph after other content:
// a lead-in by definition OPENS a paragraph.
const ENUM_MARK_RE = /<strong>\(([א-ת0-9])\)<\/strong>/g;
const LEAD_IN_RE = /<strong>(לקח|פתרון|דוגמה|מסקנה)[.:]?<\/strong>/g;
const CONTENT_CHAR_RE = /[א-ת0-9A-Za-z]/;
export function runOnStructure(src) {
  const findings = [];
  src.split('\n').forEach((line, i) => {
    // A bold sub-part marker must OPEN its line: strip tags, and anything
    // before it that isn't whitespace — including a lead-in like "פתרון." or
    // the previous part's conclusion — means the marker started mid-line.
    let em;
    const enums = new RegExp(ENUM_MARK_RE.source, 'g');
    while ((em = enums.exec(line))) {
      const before = line.slice(0, em.index);
      const tick = before.lastIndexOf('`');
      let seg = (tick >= 0 ? before.slice(tick + 1) : before).replace(/<[^>]*>/g, '');
      // The one allowed prefix: a lead-in word MERGED with the marker as a
      // single opener — "פתרון (א)." — where the marker still opens the line.
      // A period between them ("פתרון. (א)") means two separate units glued.
      seg = seg.replace(/^\s*(?:פתרון|לקח|דוגמה|מסקנה)\s*$/, '');
      if (CONTENT_CHAR_RE.test(seg)) {
        findings.push({
          rule: 'run-on-structure',
          line: i + 1,
          excerpt: `…${seg.slice(-20)}(${em[1]})`,
          message: `sub-part marker (${em[1]}) mid-line — every marker OPENS its own line/paragraph (step-list div / own d.p), even right after a lead-in or the previous part's conclusion.`,
        });
      }
    }
    let m;
    const lead = new RegExp(LEAD_IN_RE.source, 'g');
    while ((m = lead.exec(line))) {
      const before = line.slice(0, m.index);
      const tick = before.lastIndexOf('`');
      // Strip HTML tags: a lead-in that OPENS its own block (<div><strong>פתרון…)
      // is correct — tag-name letters are not content.
      const seg = (tick >= 0 ? before.slice(tick + 1) : before).replace(/<[^>]*>/g, '');
      if (CONTENT_CHAR_RE.test(seg)) {
        findings.push({
          rule: 'run-on-structure',
          line: i + 1,
          excerpt: `…${seg.slice(-24)}<strong>${m[1]}…`,
          message: `bold lead-in "${m[1]}." mid-paragraph — a structural lead-in opens its own paragraph; split the d.p before it.`,
        });
      }
    }
  });
  return findings;
}

// Rule: island-fragment
// An island whose argument STARTS or ENDS with a binding operator (= : ; + →)
// is a FRAGMENT of a relation split across islands — en('Hit rate') next to
// M('=1/8') displays as "=1/8 Hit rate" under RTL (observed in a real build:
// the line was unreadable). A relation/phrase is ONE island:
// M('\\text{Hit rate}=1/8'), never a bare-operator fragment glued to a
// neighbor.
const ISLAND_ANY_RE = /\b(M|en|code)\(\s*(['"`])((?:\\.|(?!\2).)*)\2\s*\)/;
const FRAG_EDGE_RE = /^\s*[=:;+\u2192]|[=:;+\u2192]\s*$/;
export function islandFragment(src) {
  const findings = [];
  const re = new RegExp(ISLAND_ANY_RE.source, 'g');
  let m;
  while ((m = re.exec(src))) {
    // Fragments are LEGAL as arguments to mathRow(...) — the LTR composition
    // container that pins the pieces left-to-right (components.mjs).
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', m.index) === -1 ? src.length : src.indexOf('\n', m.index));
    if (lineText.includes('mathRow(')) continue;
    if (FRAG_EDGE_RE.test(m[3])) {
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        rule: 'island-fragment',
        line,
        excerpt: `${m[1]}('${m[3].slice(0, 30)}${m[3].length > 30 ? '…' : ''}')`,
        message: `island argument starts/ends with a binding operator — it is a fragment of a relation split across islands, which reorders under RTL. Make the whole relation ONE island (e.g. M('\\text{Hit rate}=1/8')).`,
      });
    }
  }
  return findings;
}

// Rule: hebrew-in-codeblock
// A code listing is an LTR run; a Hebrew word inside it (usually a comment —
// "# הוקדם") reorders against the code and breaks the listing's monolingual
// discipline (content-style: comments in code are English, never Hebrew).
export function hebrewInCodeblock(src) {
  const findings = [];
  const re = /codeBlock\(`/g;
  let m;
  while ((m = re.exec(src))) {
    const end = src.indexOf('`', m.index + m[0].length);
    if (end < 0) continue;
    const seg = src.slice(m.index + m[0].length, end);
    const heb = seg.match(/[֐-׿]+/);
    if (heb) {
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        rule: 'hebrew-in-codeblock',
        line,
        excerpt: `codeBlock(…${heb[0]}…)`,
        message: `Hebrew inside a codeBlock — a listing is an LTR run and Hebrew reorders against it. Code comments are English, never Hebrew.`,
      });
    }
  }
  return findings;
}

const RULES = [hebrewInMathText, hebrewAsciiQuote, rawHtmlInIsland, inlineMathChain, runOnStructure, islandFragment, hebrewInCodeblock];

export function lint(src) {
  return RULES.flatMap((r) => r(src));
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: check_bidi.mjs <file...>'); process.exit(2); }
  let total = 0;
  for (const f of files) {
    const findings = lint(fs.readFileSync(f, 'utf8'));
    for (const x of findings) {
      total++;
      console.log(`${f}:${x.line}: [${x.rule}] ${x.excerpt}\n    ${x.message}`);
    }
  }
  console.log(total ? `\n${total} finding(s).` : 'clean.');
  process.exit(total ? 1 : 0);
}
