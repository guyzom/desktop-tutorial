// Regression fixtures for scripts/check_bidi.mjs.
// A check without a test that proves it fires is an assertion, not a check:
// every rule must trip on its positive fixtures and stay silent on negatives.
// Run: node tests/check_bidi.test.mjs
import { lint } from '../scripts/check_bidi.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); } };

// --- hebrew-in-math-text ---
// Positives: must be flagged.
const positives = [
  ['\\underbrace{mc^2}_{\\text{אנרגיית מנוחה}}', 'hebrew label in \\text'],
  ['X \\sim \\text{נורמלי}(\\mu,\\sigma)', 'hebrew word in \\text'],
  ['\\mathrm{מהירות}', 'hebrew in \\mathrm'],
  ['\\mbox{קבוצה}', 'hebrew in \\mbox'],
  ['E=\\text{ENERGY }+\\text{ אנרגיה}', 'second \\text is hebrew'],
];
for (const [src, label] of positives) {
  ok(`positive: ${label}`, lint(src).some((f) => f.rule === 'hebrew-in-math-text'));
}

// Negatives: must stay silent.
const negatives = [
  ['\\text{Normal}(\\mu,\\sigma^2)', 'latin in \\text is fine'],
  ['\\text{Specificity (TNR)}', 'latin+parens in \\text is fine (spike 1)'],
  ['\\underbrace{mc^2}', 'bare underbrace, hebrew label is HTML not \\text'],
  ['E = mc^2 + K', 'pure math'],
  ['\\mathbf{v} \\cdot \\mathbf{u}', 'latin \\mathbf'],
];
for (const [src, label] of negatives) {
  ok(`negative: ${label}`, lint(src).length === 0);
}

// --- hebrew-ascii-quote ---
// Positives: an ASCII quote between two Hebrew letters must be flagged.
const quotePositives = [
  ['ע"י', 'ascii gershayim in ע"י'],
  ['סה"כ', 'ascii gershayim in סה"כ'],
  ["ג'ורג", 'ascii geresh in ג\'ורג'],
];
for (const [src, label] of quotePositives) {
  ok(`positive: ${label}`, lint(src).some((f) => f.rule === 'hebrew-ascii-quote'));
}
// Negatives: correct Hebrew punctuation, and ASCII quotes NOT between Hebrew.
const quoteNegatives = [
  ['ע״י', 'correct gershayim ״ (U+05F4)'],
  ['סה״כ', 'correct gershayim'],
  ['ג׳ורג', 'correct geresh ׳ (U+05F3)'],
  ['"עברית"', 'ascii quote as a delimiter around Hebrew, not between letters'],
  ["const items = ['ראשון', 'שני']", 'js single-quoted Hebrew strings'],
  ['He said "hello" to her', 'latin quotes'],
];
for (const [src, label] of quoteNegatives) {
  ok(`negative: ${label}`, !lint(src).some((f) => f.rule === 'hebrew-ascii-quote'));
}

// --- hebrew-quoted-word (prefix+quote: real quotation, NOT an abbreviation) ---
// Positive: found empirically — כ"סיבוב"/ה"מתכון" were misclassified as
// gershayim-abbreviation candidates by the original single rule, which would
// have "corrected" them into wrong Hebrew (כ״סיבוב, ה״מתכון).
const quotedWordPositives = [
  ['כ"סיבוב"', 'ke- prefix + quoted word'],
  ['ה"מתכון"', 'ha- prefix + quoted word'],
  ['ב"מעטפת"', 'be- prefix + quoted word'],
];
for (const [src, label] of quotedWordPositives) {
  const f = lint(src);
  ok(`quoted-word positive: ${label}`, f.some((x) => x.rule === 'hebrew-quoted-word'));
  ok(`quoted-word positive not double-flagged: ${label}`, !f.some((x) => x.rule === 'hebrew-ascii-quote'));
}
// Negative: true abbreviations must NOT be reclassified as quoted-word — the
// letter before the quote is not a standalone one-letter word there.
const quotedWordNegatives = [
  ['ע"י', 'true abbreviation ע"י stays hebrew-ascii-quote'],
  ['סה"כ', 'true abbreviation סה"כ stays hebrew-ascii-quote'],
];
for (const [src, label] of quotedWordNegatives) {
  ok(`quoted-word negative: ${label}`, !lint(src).some((f) => f.rule === 'hebrew-quoted-word'));
}


// --- raw-html-in-island ---
// Positive: found empirically — code('i<len') in a real build: '<l' opened an
// HTML tag, swallowed the run, and glued the surrounding Hebrew to the next
// island. The reader could no longer tell code from prose.
const islandPositives = [
  ["תנאי הלולאה ${code('i<len')} ממומש", 'raw < in code()'],
  ["הזזה ${code('<<2')} כופלת", 'raw << in code()'],
  ["${code('x >= y')}", 'raw > in code()'],
  ["${en('a&b')}", 'raw & in en()'],
];
for (const [src, label] of islandPositives) {
  ok(`island positive: ${label}`, lint(src).some((f) => f.rule === 'raw-html-in-island'));
}
// Negatives: entities are the correct form; codeBlock() escapes for itself;
// plain island args stay silent.
const islandNegatives = [
  ["תנאי הלולאה ${code('i &lt; len')} ממומש", 'entity &lt; in code() is fine'],
  ["${code('&lt;&lt;2')}", 'entity shift in code()'],
  ["${code('add $t0, $t1, $t2')}", 'plain MIPS in code()'],
  ["${en('R-type')}", 'plain latin in en()'],
  ["codeBlock(`if (a < b) return a & b;`)", 'codeBlock escapes its own content'],
  ["${code('M[$s0] &amp; 0xFF')}", 'entity &amp; in code()'],
];
for (const [src, label] of islandNegatives) {
  ok(`island negative: ${label}`, !lint(src).some((f) => f.rule === 'raw-html-in-island'));
}

// --- inline-math-chain ---
// Positive: found empirically — T = 3·IC/3·10⁹ = 10⁻⁹·IC woven inline into an
// RTL prose paragraph zigzags the reading order and wraps mid-derivation.
const chainPositives = [
  ["מריץ ${M('T=3\\\\,IC/3{\\\\cdot}10^9 = 10^{-9}\\\\,IC')}", 'two-step chain inline'],
  ["${M('f = 0.225/1.125 = 0.2')}", 'numeric chain inline'],
  ["${M('a=b=c')}", 'even a short chain is a chain'],
];
for (const [src, label] of chainPositives) {
  ok(`chain positive: ${label}`, lint(src).some((f) => f.rule === 'inline-math-chain'));
}
// Negatives: atoms — a symbol, a value, one relation — are what inline is FOR;
// display math (d.eq/d.display/D) may chain freely.
const chainNegatives = [
  ["${M('\\\\text{CPI}=3')}", 'single relation is an atom'],
  ["${M('2^{10}')}", 'plain value'],
  ["${M('\\\\pm\\\\infty')}", 'plain symbol'],
  ["d.eq('T = IC \\\\times CPI = IC/f', 'perf')", 'chains are fine in display eq()'],
  ["d.display('E = 130 = 0x82')", 'chains are fine in display()'],
];
for (const [src, label] of chainNegatives) {
  ok(`chain negative: ${label}`, !lint(src).some((f) => f.rule === 'inline-math-chain'));
}

// --- run-on-structure ---
// Positives: found empirically — multi-part questions crammed into one line,
// and a bold takeaway lead-in glued to the tail of a result sentence.
const runonPositives = [
  ["חשב: <strong>(א)</strong> את המכפלה. <strong>(ב)</strong> עקוב אחר האלגוריתם.", 'two sub-part markers on one line'],
  ["<strong>(1)</strong> ראשון <strong>(2)</strong> שני <strong>(3)</strong> שלישי", 'digit markers run together'],
  ["  d.p(`התוצאה: X. <strong>לקח.</strong> חיבור מיישר מעריכים.`);", 'takeaway glued mid-paragraph'],
  ["  d.p(`הערך הוא 5. <strong>פתרון.</strong> נציב.`);", 'solution lead-in mid-paragraph'],
  ["  d.p(`<strong>פתרון.</strong> <strong>(א)</strong> נחשב.`);", 'marker after a lead-in is still mid-line (strict v0.9.9)'],
  ["  d.p(`ומכאן Hit rate. <strong>(ב)</strong> נעבור למיפוי הבא.`);", 'single marker after previous conclusion'],
];
for (const [src, label] of runonPositives) {
  ok(`runon positive: ${label}`, lint(src).some((f) => f.rule === 'run-on-structure'));
}
// Negatives: one marker per line, a lead-in that OPENS its paragraph, and a
// step-list where each item is its own source line.
const runonNegatives = [
  ["  d.p(`<strong>לקח.</strong> חיבור מיישר מעריכים.`);", 'lead-in opens the paragraph'],
  ["  d.p(`<strong>(א)</strong> נחשב את המכפלה.`);", 'marker opening its own paragraph'],
  ["  d.p(`<strong>פתרון (א).</strong> נחשב את המכפלה.`);", 'lead-in MERGED with the first marker as one opener'],
  ["<div><strong>(ב)</strong> עקוב אחר האלגוריתם.</div>", 'single marker on its own line'],
  ["<strong>חשוב:</strong> ערך מוחלט אינו נורמה.", 'bold emphasis word is not a lead-in'],
  ["    <div><strong>פתרון.</strong> ${M('P(00)')} — וסימטרית.</div>", 'lead-in opening its own div block'],
];
for (const [src, label] of runonNegatives) {
  ok(`runon negative: ${label}`, !lint(src).some((f) => f.rule === 'run-on-structure'));
}

// --- island-fragment ---
// Positive: found empirically — en('Hit rate') followed by M('=1/8') rendered
// as "=1/8 Hit rate": a relation split across islands reorders under RTL.
const fragPositives = [
  ["${en('Hit rate')} ${M('=1/8')}", 'operator-leading math fragment'],
  ["${M('= 2/8')}.", 'leading = with space'],
  ["${en('2-way:')}", 'trailing colon binds to the next island'],
  ["${code('+4')} לבסיס", 'leading + fragment'],
];
for (const [src, label] of fragPositives) {
  ok(`frag positive: ${label}`, lint(src).some((f) => f.rule === 'island-fragment'));
}
// Negatives: whole relations and plain atoms.
const fragNegatives = [
  ["${M('\\text{Hit rate}=1/8')}", 'whole relation in one island'],
  ["${M('a=b')}", 'operator mid-expression'],
  ["${en('2-way')}", 'plain term'],
  ["${code('addi $sp, $sp, -4n')}", 'negative operand inside code'],
  ["${M('\\Rightarrow')}", 'arrow macro, not an edge operator'],
  ["${mathRow(M('E = '), mathUnderLabel('mc^2', 'תווית'), M('+ K'))}", 'fragments inside mathRow are the intended composition'],
];
for (const [src, label] of fragNegatives) {
  ok(`frag negative: ${label}`, !lint(src).some((f) => f.rule === 'island-fragment'));
}

// --- hebrew-in-codeblock ---
const cbPositives = [
  ["codeBlock(`lw $t1, 0($s0)  # הוקדם`)", 'hebrew comment in a listing'],
];
for (const [src, label] of cbPositives) {
  ok(`codeblock positive: ${label}`, lint(src).some((f) => f.rule === 'hebrew-in-codeblock'));
}
const cbNegatives = [
  ["codeBlock(`lw $t1, 0($s0)  # hoisted earlier`)", 'english comment'],
  ["d.p(`הסבר בעברית על ${code('lw')}`)", 'hebrew prose outside codeBlock'],
];
for (const [src, label] of cbNegatives) {
  ok(`codeblock negative: ${label}`, !lint(src).some((f) => f.rule === 'hebrew-in-codeblock'));
}

console.log(`\ncheck_bidi: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
