# hebrew-browser-pdf — changelog

Keep-a-Changelog format. Semver. The empirical narrative (why each decision was
made, what a spike actually showed) lives in `HISTORY.md`; this file stays
scannable.

## [0.9.9] — 2026-07-11 — strict markers; island fragments linted; mathRow

Same real build, two escapes the 0.9.8 rules missed (user screenshot):
a sub-part marker after the previous part's conclusion ("…Hit rate = 1/8.
(ב) …") slipped past the 2-markers-per-line check, and a line composed of
operator-edged island fragments (en('Hit rate') + M('=1/8') + island soup)
rendered unreadably scrambled.

1. **run-on-structure is now strict**: ANY bold sub-part marker that does
   not open its line is flagged — including right after a lead-in. The one
   allowed prefix is the MERGED opener `פתרון (א).` (a period between them
   means two glued units and fails).
2. **New rule `island-fragment`**: an island argument that starts or ends
   with a binding operator (= : ; + →) is a fragment of a relation split
   across islands — it reorders under RTL. A relation is ONE island
   (M('\text{Hit rate}=1/8')).
3. **New component `mathRow(...parts)`** (+ `.mrow` CSS): the LTR isolate
   that composes one expression from several pieces (a labeled term inside
   an equation). Fragments are exempt inside mathRow; the example gallery
   now uses it.
4. Downstream document: 12 mid-line markers normalized (merged openers /
   own paragraphs), the scrambled cache-exercise paragraphs rewritten
   Hebrew-dominant with whole-relation islands, and 6 fragments merged.

Corpus 67/67; harness green; document re-rendered and the reported page
re-audited visually.

## [0.9.8] — 2026-07-11 — rule: structural units get their own line

User report from the real build, two forms of one friction: (a) multi-part
questions crammed into one running line ("(א) חשב… (ב) עקוב… (ג) עקוב…"),
(b) the bold takeaway lead-in (לקח.) glued to the tail of the result
sentence. Content density is information per sentence — separate units glued
onto one line are load, not density.

1. **New content rule** (content-style §6.0): every sub-part marker gets its
   own line (step-list inside the question box); a structural lead-in
   (פתרון/לקח/דוגמה/מסקנה) OPENS its paragraph.
2. **New `check_bidi` rule `run-on-structure`** enforces both forms
   (2+ bold enumeration markers on a line; bold lead-in mid-paragraph after
   real content — HTML tags stripped so a lead-in opening its own block
   never false-positives). 4 positive + 5 negative fixtures (54/54).
3. Downstream document: 11 run-on question/solution lines split into
   per-part lines and 7 glued takeaways given their own paragraphs.

## [0.9.7] — 2026-07-11 — bar-less design: slate listings, filled box cards

User request with rendered variant sheets approved before applying (L1 + B1
of the options shown):

1. **Listings** — the purple side bar removed and the palette calmed to a
   slate family: background `#f5f7fa`, keywords `#33608d`, comments
   `#74808c`, strings `#96632e`. Tints are now theme tokens
   (`listing-kw/cm/st`); `listing-accent` deleted with the bar.
2. **Boxes** — the inline-start bar removed on all roles; the box is now a
   filled card whose FULL-CARD FILL carries the weight ladder (one ink-blue
   family, strongest at W1 → near-neutral at W5; `warn` keeps the one warm
   fill; title colors unchanged as the role label). boxes.json drops the
   `border` field; gen-css emits background+title only; per-weight bar
   widths removed from base.css (radius/title-size ladder kept).

Verified: harness 46/46 (gen-css idempotent under the new emitter), variant
sheet + full document re-rendered and audited visually.

## [0.9.6] — 2026-07-11 — monochrome reading theme: ink-only accents

User request from the real build: colored accents pull the eye while
studying — tables, cross-references, heading rules, part titles, and the
code chips should all read in the ordinary text ink.

Data-driven where possible (theme.json tokens):
- `frame` / `rule` → ink: the tablebox outline, its top/bottom rules, and
  the "טבלה N." caption now match body text.
- `chip-bg` → transparent, `chip-border` → ink: the inline-code chip is a
  thin ink outline with no fill — still a clear code/prose delimiter,
  without color salience.
CSS consumers normalized to var(--ink): part-divider titles, eq/chapter
cross-references (.xref), footnote marks, the chapter-heading underline,
the TOC heading rule, and equation numbers. The `accent` token remains
defined but body-text consumers no longer use it. Box roles (result/key/
def/…) and listing syntax tinting are intentionally unchanged — they are
block-level landmarks, not in-line distractions; re-theme via boxes.json
if desired.

Verified: harness 46/46; full document re-rendered and audited page-by-page
for leftover accent color in running text.

## [0.9.5] — 2026-07-11 — rule: inline math is an atom; derivation chains go display

User report from the same real build: multi-step computations woven inline
into RTL prose lines (T = 3·IC/3·10⁹ = 10⁻⁹·IC …) — the reading order
zigzags (Hebrew right-to-left, a long LTR run mid-line) and line-wrap chops
the chain mid-derivation.

1. **New content rule** (content-style §5): inline math holds an ATOM — a
   symbol, a value, or ONE relation. Two or more `=` is a derivation chain:
   it is a formula, not prose, and gets its own display line (prose before
   ends with a colon; a short conclusion follows; two related computations
   may share a display line with \qquad).
2. **New `check_bidi` rule `inline-math-chain`** enforces it at the source
   layer (M('…') with 2+ '='), with 3 positive + 5 negative fixtures
   (45/45). Display helpers (d.eq/d.display/D) are exempt by construction.
3. Dogfooded: the one chain in the skill's own examples (boxes.mjs) split
   into atoms; the downstream 81-page document had 31 chains across 6 parts
   — all lifted to display lines and re-audited visually.

## [0.9.4] — 2026-07-11 — inline-code chips; lint raw HTML inside island args

User report from the same real build: a paragraph rendered with code glued to
prose ("ממומשsll $t0,$s0,2") and a stray dangling token — the reader could not
tell where code ended and Hebrew began.

1. **Root cause found and now LINTED.** The source read `code('i<len')`. The
   island helpers emit their argument as raw HTML, so `<` followed by a letter
   OPENED A TAG and swallowed the run, breaking span nesting for the rest of
   the paragraph. New `check_bidi` rule **raw-html-in-island**: a raw `<`, `>`
   or `&` inside a `code('…')`/`en('…')` argument is an error — write
   `&lt; &gt; &amp;`. Scoped to island call arguments only (`codeBlock`
   escapes for itself and never false-positives). Corpus: 4 positive +
   6 negative fixtures (37/37).
2. **Inline-code CHIP.** Like display math, an inline code expression is now a
   visually delimited unit: `.code`/`code` render as a soft tinted capsule
   (new `chip-bg`/`chip-border` theme tokens, same lavender family as
   listings, 0.85em) so the code/prose boundary is visible at a glance.
   `.mono` (table cells, folios) and `.en` (prose English) stay plain — a
   table of capsules would be noise. No chip-in-chip inside listings/mono
   cells.

Verified empirically: bidi corpus 37/37, full harness green, and the 81-page
document re-rendered — the broken paragraph reads correctly, chips audited on
content/table/exercise pages, page-wide overflow scan clean.

## [0.9.3] — 2026-07-11 — fix: listings anchor left; code islands are atomic

User report from a real 81-page build (מבנה המחשב), two typography bugs:

1. **Code listings right-aligned.** `body { text-align: right }` (the RTL
   document base) is INHERITED by `.listing pre` — `direction: ltr` fixes the
   character order but not the line anchor, so every code line hugged the
   right edge and the left-edge indentation structure of labels/loops/nesting
   was destroyed. `.listing` now sets `text-align: left` explicitly. Code is
   LTR content; it must anchor left regardless of the document side.
2. **Inline code islands wrapped mid-token.** `.code/code/.mono` had no
   `white-space` rule, so a narrow table cell broke `$v0–$v1` across lines
   ("$v0-" / "$v1") — unreadable. A code island is an ATOMIC unit, exactly
   like a formula: `white-space: nowrap` added to the trio. Consequence for
   authors (now in the box-discipline rules): keep inline code SHORT; a long
   code phrase goes in `codeBlock`, and a table cell holds ONE code unit per
   row — never two units glued with a separator.

Verified empirically: harness green (T0 gen-css idempotent — the edits live
outside the generated blocks; checker corpora unchanged); listings gallery and
the full 81-page document re-rendered and visually audited — code left-anchored
with indentation intact, no island wraps, and a page-wide overflow scan
(PyMuPDF span bboxes vs. text area) found no new overflow from `nowrap`.

## [0.9.2] — 2026-07-10 — fix: TOC links actually navigate (explicit GOTO + clickable page numbers)

User report: clicking a TOC entry doesn't jump to the chapter. Two real product
gaps found at the PDF-object level:

1. Chromium emits internal links as NAMED destinations resolved via a legacy
   PDF-1.1 `/Dests` dictionary — structurally valid (annotation → name →
   explicit [page /XYZ …] array; this is why the earlier link audit, which
   used PyMuPDF's lenient resolver, saw "0 broken"), but embedded/mobile
   viewers are flaky about the name lookup, so clicks did nothing there.
   `stamp_chrome.py` now rewrites EVERY named link in the document as an
   explicit GOTO to the resolved page — the most compatible form.
2. The stamped TOC page numbers had no link annotation at all — Chromium's
   anchor covers only the title span (physical right in RTL), so tapping the
   number did nothing anywhere. Each number now carries its own GOTO rect.

Verified: 0 named links remain in either document (QE 10 GOTO, QC 149 GOTO
incl. 44 number links); all targets resolve to the correct pages; harness
46/46; byte-determinism intact.

## [0.9.1] — 2026-07-10 — audit round: box-split default fixed; five audits all green

Systematic audit pass over the 0.9.0 output ("check, refine, re-check"):

- **Audit 1 — TOC number accuracy.** Every TOC row's stamped number verified
  against the destination page's actual text. 4 initial suspects were all
  word-matching artifacts (hyphen/maqaf/colon splitting); core-word check
  confirms 44/44 correct.
- **Audit 2 — internal links.** 105 links, 0 broken after normalize.
- **Audit 3 — orphaned headings.** No heading in any page's bottom 15%.
- **Audit 4 — boxes split across page boundaries.** Found ONE: the warn box
  "אבחנה — פריק מול שזור" split title-orphan style (title at page-12 bottom,
  body on 13) — it was authored without nobreak. FIX at the design level:
  `break-inside: avoid` is now the DEFAULT on `.box` (+ `break-after: avoid`
  on `.box-title`), since a split short box is always worse than moving it
  whole, and plain Chromium degrades gracefully when a box genuinely exceeds
  a page (verified earlier on the 60-row table — it breaks, never drops).
  `nobreak` stays as a source-compatible no-op. Re-audit: zero split boxes
  across all 74 pages, page count unchanged, completeness intact.
- **Audit 5 — full-pilot determinism.** The complete 74-page pipeline
  (render → stamp_chrome → normalize) run twice: byte-identical. (T5 covers
  only the small flagship; this was the first whole-document check.)

Harness 46/46; node tests 5/5.

## [0.9.0] — 2026-07-10 — feat: full page-chrome restoration post-render (TOC numbers, running header, topic rail) — quarantine cost eliminated

Continuation of the 0.8.x audit ("keep checking, refining, re-checking").
First finding: the plain pipeline had silently lost the TOC PAGE NUMBERS
(paged.js used to fill them via target-counter) — the TOC rendered with no
numbers at all. Rather than partial fixes, one deterministic post-render pass
now restores everything the polyfill provided, new `scripts/stamp_chrome.py`
(render -> stamp_chrome -> normalize):

1. **TOC page numbers + dotted leaders.** Chromium preserves each TOC row's
   <a href="#id"> as a PDF link WITH its destination page, so numbers are
   recovered from the compiled PDF itself — no re-measuring pass, no drift.
   44/44 rows verified.
2. **Running chapter header** (top, physical right). Chapter start pages come
   from the same link destinations; part-divider pages (detected by their
   text) are skipped, as before. Long titles are ellipsized word-by-word to
   the actual free width left of the rail dots.
3. **Topic rail** (dots + current-part label, top center). Part labels are
   read from the part-divider titles, with the 'חלק <N> —' prefix stripped —
   the dots already encode position; the label is the topic.

Hebrew stamping: PyMuPDF does no bidi and Hebrew needs no shaping, so a
run-level reversal suffices (split Hebrew/non-Hebrew runs, reverse run order,
reverse chars inside Hebrew runs). Glyphs come from vendored
`assets/fonts/FrankRuhlLibre-Hebrew.ttf` (+Bold), converted once from the
fontsource woff2 (fontTools+brotli, dev-time only); the hebrew subset has no
Latin/digits, so those runs use built-in Helvetica, with em-dash normalized
to a middot by design (WinAnsi has none).

Bugs found & fixed during this pass, each with the trigger recorded:
- `re.split()` on a pattern WITHOUT a capturing group DISCARDS the matches —
  every Hebrew run was silently dropped from the stamped text (headers came
  out as their Latin fragments only). Capturing group added.
- The folio-monotonicity gate misread stamped TOC numbers near a full TOC
  page's bottom as folios ("folio 3 after 44"): real folios are CENTERED, so
  the check now also requires |x_mid − W/2| < 60pt.
- Initial header/rail collision analysis mis-attributed the overlap to the
  label (which sits in a lower band); only the DOTS share the header's band,
  so the header's width budget keys off the dots row alone.

Verified programmatically (view-tool previews were unreliable this session):
44/44 TOC numbers; headers present on content pages, correctly absent on
part-divider pages; zero header spans intersecting the dots zone across all
74 pages; rail dots (ink + idle pixel clusters) and short labels present;
single centered folio per page; completeness 100%; harness 46/46 twice
(T5 determinism now includes stamp_chrome); node tests 5/5.

## [0.8.1] — 2026-07-10 — fix: duplicated folio (stamping removed — Chromium renders counter(page) margin boxes natively)

User spotted "14" printed twice on page 14. Diagnosis by span inspection: one
folio in FrankRuhlLibre at y≈807 (the document's own `@bottom-center
{ counter(page) }`) and one in Helvetica at y≈797 (the 0.8.0 stamping step).
The 0.8.0 quarantine assumed plain Chromium renders no @page margin boxes —
outdated: current Chromium renders margin boxes with counter(page) NATIVELY.
(Verified in the same pass that `string()`/string-set does NOT render, so the
running chapter header and topic rail remain the real quarantine cost.)

Fix: `scripts/stamp_folios.py` deleted and removed from the pipeline and from
T5; the native folio is the single source. The both-halves /ID zeroing in
`normalize_pdf.py` is kept — determinism should never depend on what an
upstream tool minted. Pilot re-rendered: exactly one folio per page, 74 pages,
completeness 100%, harness 46/46, node tests 5/5, byte-deterministic.

## [0.8.0] — 2026-07-10 — CRITICAL: content-completeness gate; paged.js quarantined after proven systemic content loss; tall tables; determinism fix

Started as a tables question ("anything missing?"), ended in the most important
finding of the project so far. Chronologically:

**1. Tall-table stress test.** A 60-row `tableBox` (taller than one page) was
rendered through the paged.js pipeline: with `break-inside: avoid` the ENTIRE
table plus everything after it silently vanished (0/60 rows); with
`break-inside: auto` it truncated at the first page boundary (26/60). Plain
Chromium rendered the same fixture perfectly (4 pages, 60/60, trailing
paragraph intact).

**2. Content-completeness gate** (`check_render.py`): every visible word of the
source HTML (Hebrew ≥2 letters + Latin runs; comments/style/script/svg
stripped, so vector math doesn't count) must appear in the compiled PDF's text;
coverage below 98% is a finding. Layout-independent, so RTL extraction
reordering can't false-positive it. Validated both ways on the tall-table
renders (fires: 13.3%, 88.9%) — and then pointed at the shipped pilot.

**3. The gate exposed systemic loss in every previously delivered pilot.** 94%
coverage; 177 missing words clustering into 52 dropped source regions. Ground
truth checks: the warn box "אבחנה — פריק מול שזור" absent (title AND body — 0
warn-bar pixels on its pages; only 3 of 5 warn boxes render anywhere);
'הלקח' 8→1, 'פתרון' 18→7 — the solved-exercises chapter was gutted. Even
pre-chunked tables lost rows (18/60): the quarantined polyfill drops content at
NATURAL page overflow, not merely on >1-page blocks. Plain Chromium render of
the identical HTML: 74 pages, 100.0% coverage, 8/8, 18/18, 69/69.

**4. Quarantine + replacement pipeline.** `Doc.render()` gains `paged` (default
FALSE): no polyfill, no margin boxes. Folios are stamped post-render by new
`scripts/stamp_folios.py` (PyMuPDF, ASCII digits, bottom-center, skips title
page), before `normalize_pdf.py`. Cost until paged.js is fixed or replaced:
no running chapter headers and no topic rail. That trade — losing chrome vs.
silently losing ~6% of the words a student would study from — is not close.
`paged:true` remains for isolated experiments only.

**5. `tableBox({tall})`** — splits a long table into per-page-safe chunks with
the header row repeated and a "(המשך)" caption (counter not re-incremented).
Still the right authoring tool: under the plain pipeline Chromium fragments
tables natively, but chunking keeps headers repeating and blocks small.

**6. Determinism fix.** T5 flaked 50% after stamping entered the pipeline:
pikepdf's `static_id` fixes only the SECOND trailer /ID element, preserving the
first from the input — which PyMuPDF's save mints randomly. `normalize_pdf.py`
now zeroes both halves with a length-preserving raw substitution. 8/8 identical
across repeated runs. T5 itself also had a silent-pass bug (comparing two
sha256s of MISSING files when the render step failed) — now fails loudly.

Harness: 44 → 46 checks (tall-table completeness regression; flagship armed
completeness), all green twice consecutively; node tests 5/5; examples
regenerated polyfill-free. The pilot PDF delivered with this version is the
first COMPLETE one: 74 pages, 100% coverage, stamped folios, deterministic.

Known open items: running headers + topic rail need a post-render stamping
design (Hebrew shaping in PyMuPDF or a headless re-measure pass); root-cause of
the polyfill's overflow drop still unknown (vendored build suspect).

## [0.7.0] — 2026-07-07 — feat: split overloaded `key` into `key` + new `steps` role

Self-critique of 6.1 surfaced that `key` was doing two jobs: a conceptual
takeaway ("רעיון מרכזי — ...") AND a procedure/algorithm ("אלגוריתם שור —
צעדים"). In the pilot, 20 `key` boxes = 9 genuine takeaways + 6 procedures + 5
other — the same role/weight conflation the weight ladder was meant to remove,
hiding one level down. A step-by-step procedure and a one-line takeaway are
different reading objects: you *carry away* a takeaway, but you *follow and
return to* a procedure.

New `steps` role (role="procedure"). Weight W3, not W2 — following/returning is
reference behaviour, not carry-away, so it's unfilled and sits in the ink-blue
reference band with def/thm (same color by the weight-first rule). But it's
structurally a LIST-CARD, not a prose-card: the `steps()` list gets a 0.5px
per-row top rule so it reads as an ordered walk. This is the honest fix — `key`
now means exactly "conceptual takeaway" (W2, filled prose-card), `steps` means
"procedure you execute" (W3, unfilled list-card).

Naming collision resolved: the inner `steps()` helper's wrapper class was
`.box-steps`, which now clashes with the generated `.box-steps` role rule —
renamed the inner helper to `.step-list` (`src/components.mjs` + `base.css` +
the two `examples/*.html` fixtures). Pilot: 5 `key`-wrapping-`steps()` boxes →
`steps` (key 20→15). Examples' teleportation procedure box likewise moved
key→steps. Verified by pixel-sampling a steps page: no fill block, hairline row
rules present (#e3e7ec). gen-css idempotent; harness 44/44; node tests 5/5.

## [0.6.1] — 2026-07-07 — fix: color coherence — hue encodes weight, not role (green removed)

User spotted a green box and asked whether it was a mistake. It was `thm`
(green) vs `def` (blue) — not a bug per se, but a real inconsistency the
v0.6.0 redesign should have caught. The system had two color logics fighting
over one channel: v0.6.0 made WEIGHT the visual variable (salience = how the
reader uses the box), but the inherited per-role HUES (blue def, green thm,
red-brown warn) still encoded ROLE through color at the same time. A reader
couldn't tell whether green-vs-blue meant "different importance" or "different
kind." The tell: `def` and `thm` are BOTH weight W3, yet had different colors —
directly contradicting weight-first.

Fix — hue now carries exactly one meaning, reinforcing the weight ladder:
a single ink-blue family spans W1→W3, bar luminance strictly increasing
(0.48 → 0.58 → 0.71) so lighter = less salient; `warn` (W4) is the ONE warm
accent, because a warning's job is to interrupt reading; W5 is neutral gray.
Same-weight roles now share a hue by construction — `def` and `thm` are
byte-identical (title text "הגדרה —"/"משפט —" still distinguishes them
semantically; keeping them as separate roles leaves room to reintroduce a
distinction without a data migration). Every title still clears WCAG AA on its
background (all ≥6.1, verified). Green is gone from the box system entirely.

Second half of the same fix — hand-authored inline SVGs (Bloch spheres, the
Grover rotation diagram in the pilot) still used three arbitrary saturated hues
(`#1F4E79` blue, `#2E6B4F` green, `#8E2B2B` dark red) with no relationship to
the box palette — the actual source of the green the user saw on the Grover
page. Introduced a sanctioned `ink` sub-palette in `config/palette.json`
(primary `#2c4763`, secondary `#7e97ae`, annotate `#86513f` — drawn straight
from the box system's result-title / key-bar / warn-title) and remapped every
diagram color onto it. Also aligned the stale `chartSeries` and block-node
colors in that config, which still held the pre-v0.4.6 saturated palette.
Verified by scanning every rendered page for greenish pixels: 0 remaining
(was flagging the Grover vector before). Harness 44/44; node tests 5/5;
determinism intact.

## [0.6.0] — 2026-07-07 — redesign: box weight ladder (role ⊥ weight), new `result` anchor tier

Rethink of the v0.5.0 three-tier system rather than an extension of it. The
tiers conflated two things that are actually independent: a box's SEMANTIC ROLE
(what the content is) and its VISUAL WEIGHT (how much salience it earns). Once
separated, weight has a clean generating principle — it should track HOW THE
READER USES the box — and the levels fall out naturally:

  W1 result — the ONE central formula/law of a section (read once, anchor).
  W2 key    — the takeaway/procedure to carry away (the everyday emphasis box).
  W3 def/thm — a formal object you flip BACK to when scanning.
  W4 warn   — a caution/distinction in the running argument.
  W5 note/ex — convention, remark, worked example (near-invisible).

Seven roles now map onto five weights (`config/boxes.json` gains a `weight`
field per role; `box()` emits `.box-w{N}`; `base.css` styles structure per
weight; `gen-css` unchanged — it only ever emitted per-role colors). The new
role is `result` (W1) — the user explicitly asked for another tier "almost like
the current top." It's the near-twin of `key`: both are the only two filled
boxes, same ink-blue family, `result` a hair deeper (fill #eef3f8 vs #f6f8fa,
bar #5f7e9c vs #7e97ae) so they read as siblings with a clear order. Keeping
fills to exactly two weights is deliberate — the scarcity is what makes a
filled box mean "this is the thing"; five filled tiers would flatten that back
out. W3/W4 are bar-only (def/thm cool, warn warm); W5 is neutral gray.

Verified by rendering a 7-role demo page and pixel-sampling: both twin fills
present and distinct (#edf2f7 result vs #f5f7fa key in the rasterized PDF),
weight ladder legible top to bottom. Authoring guidance rewritten in
`references/content-style.md` and in `box()`'s doc-comment: role is semantic,
weight is how the reader uses it, W1 at most once per part. Applied to the
pilot: promoted the two genuine anchor laws (Lindblad master equation; charge-
qubit Hamiltonian) from `def` to `result` — one per relevant part, not
scattered. Harness 44/44; node tests 5/5.

## [0.5.0] — 2026-07-07 — redesign: box tier system + box budget (prose-first discipline)

User feedback on a real 57-page document: too much content in boxes, too many
prose→box transitions — "feels like a presentation converted to a document";
the eye jumps to boxed text and the running argument loses primacy. Measured:
15.1% of visible text mass inside boxes, 65 boxes / 44 chapters (≈1.15 per
page counting only boxes), on top of 118 display equations — a flow break
every few sentences. The old authoring guidance (`references/content-style.md`,
ported from the formula-sheet-oriented LaTeX skill) explicitly permitted "up to
⅓ of content in boxes", which is the right budget for a lookup document and
the wrong one for linear reading.

Three changes, all data-driven from `config/boxes.json`:

1. **Tier system.** Each role now carries a `tier`; `box()` emits
   `.box-tier{n}` and `base.css` styles structure per tier. Tier 1 = `key`,
   the single DEFAULT box (the chapter's one takeaway): the only box with any
   background fill, in one precise ink-blue (bar `#7e97ae`, fill `#f6f8fa`,
   title `#34506b`) — chosen as the lowest-arousal chromatic accent that keeps
   full title legibility on paper. Tier 2 = `def`/`thm`/`warn` (formal
   statements): 3px accent bar + colored bold title, NO fill. Tier 3 =
   `note`/`ex` (rare asides): 2px neutral-gray bar, smallest title, no fill.
   Removing the fill from five of six roles is the big salience cut — fills
   are what make a page read as slides.
2. **Budget rewritten.** `content-style.md` (the "read before writing content"
   doc) now says: prose is the default; ~1 box per chapter; box share of body
   text < 10%; the ⅓ rule is explicitly retired with its provenance noted.
   Same guidance embedded in `box()`'s doc-comment where the author actually
   is.
3. **gen-css** emits background only when `body` is non-empty; T0 idempotence
   preserved.

Applied to the downstream pilot as validation: 65 → 58 boxes (removed four
mid-argument `note`s to prose, one standalone `ex` to prose, merged a
back-to-back def+thm pair, and deleted a `key` box that literally duplicated
the display equation two lines below it — a real content bug the pass
surfaced). Remaining note/ex are structural reference anchors (intro
conventions, appendix formula sheets, solved-exercise statements). Verified by
pixel sampling on rendered pages: tier-2 pages show bar colors only with no
fill region; the key fill is the sole tinted area. Harness 44/44; node tests
5/5 files green.

## [0.4.9] — 2026-07-07 — fix: render-gate false positive (𝟙 misread as a folio digit) + SCOPE note corrected

Found by finally running the FULL documented pipeline (`check_dom.mjs` +
`check_render.py`) against a real 57-page downstream document — the checkers
had only ever been exercised against the harness's own examples/fixtures.
`check_render.py` reported `page 10: folio 1 not increasing after 9 (possible
digit reversal)` on a page whose footer was a perfectly correct "10".

Root cause, two layers deep:

1. **The SCOPE note's premise is not universal.** The gate's docstring claimed
   MathJax math is invisible to `get_text()` because it renders as vector
   paths. True for ordinary symbols — but MathJax's SVG output falls back to a
   live `<text data-variant="double-struck">` element for `\mathbb{}`
   (verified: 73 such elements in the downstream document, from the `\id` /
   `\R` / `\C` / `\Z` macros). Those glyphs ARE extractable.
2. **Python's `str.isdigit()` is Unicode-wide.** The double-struck "1"
   (𝟙, U+1D7D9) is category Nd — `.isdigit()` and `.isdecimal()` both return
   True. When an `\id` in the last equation of a page landed in the bottom-10%
   folio-detection zone, the gate read it as that page's folio, saw "1" after
   the real folio "9", and reported a reversal that never happened.

Fix: the folio check now requires ASCII `^[0-9]+$` explicitly. This loses
nothing — real footers come from CSS `counter(page)` and are always ASCII —
and the reversed-Latin check was never exposed (its `[A-Za-z]` class already
excludes non-ASCII). The SCOPE note is rewritten to document the `<text>`
fallback as a first-class fact instead of asserting blanket blindness.

Regression fixture `tests/fixtures/render_ok_mathbb_footer.html`: real MathJax
`\id` output + real `counter(page)` footers + filler tuned so the 𝟙 lands at
y-ratio ≈0.91 on page 2 (validated both ways: the OLD `isdigit()` logic
reproduces the exact false finding on it; the fixed gate is silent). Wired
into `test_all.sh` T3b — harness 43/43 → 44/44. Sizing note recorded in the
fixture itself: one more filler line trips the separate, pre-existing paged.js
overflow content-loss bug (silently drops the trailing paragraph), which is
why the fixture's filler amount must not be casually changed. Incidental:
docstring made a raw string (backslash SyntaxWarning) and the source-tokens
file read wrapped in a context manager (ResourceWarning), both surfaced by
running with `-W error`.

## [0.4.8] — 2026-07-07 — fix: topic rail — two bugs, caught from a real rendered page

A user spotted the "you are here" topic rail's current-part label was missing
on some content pages while present on others (a part-divider page showed
"יסודות" under the enlarged dot; the very next content page in the same part
showed no label at all). Two independent bugs, both only visible with real,
varied content — the existing `spikes/spike_topicrail.mjs` and
`examples/flagship.mjs` happened not to trigger either one:

**Bug 1 — label used `position:absolute`.** `assets/topicrail.js`'s
`renderRail()` positioned the current label absolutely under its dot. This
content is injected via `afterRendered()` — i.e. *after* paged.js has already
finished its own layout pass — into a `top-center` margin box that paged.js's
own CSS sets `align-items:center` on. An absolutely-positioned descendant
doesn't contribute to that box's auto-height, so whether the label ended up
inside the visible box bounds depended on incidental per-page sizing (in
practice: how tall the sibling `top-right` running-chapter-title box was on
that specific page) rather than being guaranteed. Fixed by switching to a
normal in-flow stacked layout (flex-column: dot row, then label row) — the
label now always contributes to the rail's own height, so it can't be clipped
regardless of what else is in that page's margin row. The file's own top-of-
file comment had already flagged this general class of risk ("injected
margin-box content doesn't reliably pick up the document stylesheet") without
this specific instance having been caught yet.

**Bug 2 — `data-part` index outran `topicRail(labels)`.** `Doc.part()`
increments a single counter on *every* call, but a document can reasonably add
`\part()`s after the curated topic list was passed to `topicRail()` — e.g. an
exercises or appendix part with no corresponding topic dot. `current` then
exceeded `labels.length`, and since `renderRail()` only ever iterates
`labels`, no dot matched — the rail went fully blank (no enlarged dot, no
label) for the rest of the document, not just missing a label. Fixed with an
explicit `current >= labels.length` guard in `afterRendered()` that skips
rendering entirely for such back-matter parts, mirroring the existing
`current < 0` (front-matter) behavior instead of degrading into an unmatched
state.

New `tests/document.test.mjs`-style regression file `tests/topicrail.test.mjs`
extracts and executes the real shipped `renderRail()` (not a hand-written
stand-in) to guard both: no `position:absolute` in the function body, in-range
indices render the dot + label correctly, and out-of-range indices degrade
cleanly (no stray dot, no stray label). Harness 58/58 → 73/73.

## [0.4.7] — 2026-07-07 — fix: hebrew-ascii-quote false positive on a real quotation

Caught downstream, in review: `scripts/check_bidi.mjs`'s `hebrew-ascii-quote`
rule flags any ASCII `"` sitting between two Hebrew letters and always suggests
gershayim ״. That's right for true abbreviations (`ע"י`, `סה"כ`) but wrong for
a genuine quoted word carrying one of Hebrew's seven one-letter prefixes
(ו/ה/ב/ל/כ/מ/ש — "and/the/in/to/as/from/that"), which always attach with no
space: `כ"סיבוב"` ("as 'rotation'"), `ה"מתכון"` ("the 'recipe'"). Letter-quote-
letter looks identical to the regex either way, but "fixing" the second case
into gershayim (כ״סיבוב) produces linguistically wrong Hebrew — gershayim marks
an abbreviation's last letter, not a quotation boundary.

Split the rule: a new `hebrew-quoted-word` finding fires when the letter before
the quote is a *standalone* one-letter word (word-boundary before it) drawn
from that prefix set, and suggests curly quotes “…” instead; `hebrew-ascii-
quote` (gershayim) now only fires on the remaining cases. Both were true
findings in `qc-lakat` (a downstream document) — `כ"סיבוב"`/`ה"מתכון"` were
telling the author to produce wrong Hebrew. Positive+negative fixtures for the
split added to `tests/check_bidi.test.mjs` (prefix+quote → `hebrew-quoted-
word` only; true abbreviations stay `hebrew-ascii-quote` only). Harness
27/27 → 30/30 in that file; 51/51 → 58/58 overall.

Also fixed, in the same review pass, three real `hebrew-in-math-text` findings
in `qc-lakat` that the existing (correct, unchanged) rule already covers but
that content had violated: a Hebrew connective word inside `\text{}` mixed
with LTR math and `\qquad` spacing, which is exactly the reversed-rendering bug
this rule exists to catch (this is what the user originally spotted — a
scrambled "ואילו"/"Tsirelson" line in a rendered page). Fixed by moving the
connective into surrounding prose (outside the math) in all three cases, per
the rule's own guidance; no skill code changes were needed for those three,
since the checker already flagged them correctly — they simply hadn't been run
against this content before shipping. That gap (verify with the project's own
gates before delivering, not just by re-rendering and eyeballing) is the
process lesson, not a skill bug.

## [0.4.6] — 2026-07-07 — redesign: calm box palette (this is a reading document, not a UI)

The six semantic boxes (`config/boxes.json`) used a solid saturated title bar
with white text, sitting on top of a pale tinted body — an alert/notification-
banner pattern, not appropriate for a document meant to be read start-to-finish
for deep and sustained understanding. Worse, saturation and lightness varied a
lot between roles (`box-warn` alarm-red `#c0392b`, `box-ex` vivid violet
`#7c3aed`), so some boxes visually shouted over others with no semantic reason
to.

Redesigned all six to a quiet, uniform-register palette: a thin
`border-inline-start` accent bar (4px — RTL-correct, sits on the right in this
document) replaces the full outline and the solid title bar; one continuous
pale tint (~96–97% lightness across all six, confirmed by pixel sampling —
each role covers a near-identical pixel count on a mixed test page, so none
reads as heavier) sits behind title *and* body together; the title itself is
bold text in a muted, moderate-contrast shade of the role's hue — never white-
on-solid. `config/boxes.json` is still the single source of truth; only the
*meaning* of its three fields changed (`border` → accent-bar color, `title` →
title *text* color, `body` → shared card tint) — `scripts/gen-css.mjs`'s
`genBoxes()` updated to match, `assets/css/base.css`'s hand-written `.box`/
`.box-title`/`.box-body` rules updated alongside. No structural HTML change in
`components.mjs`'s `box()` — same markup, new CSS only. Harness 43/43 still
green (color is not part of any bidi/charset/render gate); spot-verified with
a throwaway multi-box test page rasterized and pixel-sampled directly (not by
eye), confirming the six new tints render as intended and none dominates.

## [0.4.5] — 2026-07-04 — feat: unnumbered display equations (`Doc.display()`)

`Doc.eq()` was the only display-math primitive, and it numbers unconditionally
— every call increments `eqCount`, whether or not a `key` is given. Ported
straight from LaTeX documents that default to `\begin{equation}` everywhere,
this produces pages where most numbers are never cited (`ref()`/`chapRef()`)
and the few that matter don't stand out. Added `Doc.display(tex)`: same
centered block and spacing as `eq()`, no number, not referenceable, and it
does not touch `eqCount` or `refs` (verified in `tests/document.test.mjs`,
including that interleaved `display()` calls don't shift `eq()`'s numbering).
Guidance is in the method's own doc-comment: reach for `eq()` only when the
equation will actually be cited later via `ref()`, or is the single landmark
result of a definition/theorem box; `display()` is the default for one-off
math. CSS needed no changes — `.eq-plain` reuses `.eq .eqbody` centering and
simply omits the `.eqno` child. Harness 43/43 → still 43/43 (new document
tests are a separate file, not part of the T-numbered gates). No visual
change to any existing example (none used unreferenced numbered equations
this heavily; `qc-lakat` in a downstream project was the case that surfaced
the gap).

## [0.4.4] — 2026-07-04 — fix: RTL list marker jammed on the box border

The v0.4.3 list rule set `padding-inline-start: 0` with the indent on
`padding-inline-end`. In RTL the marker lives on the inline-START (right) side, so
zeroing it pushed the א/ב/ג numeral (and bullets) out of the content box, onto —
and partly clipped by — the box border. Moved the indent to `padding-inline-start`
(1.7em) so the marker sits inside the box body with a comfortable margin.
Re-rendered and visually audited both the ordered and bulleted list boxes.
CSS-only; harness stays 43/43. (Caught in review, not by a gate — this layout
class is exactly the "visual audit every session" item in REQUIREMENTS §B8.)

## [0.4.3] — 2026-07-04 — Hebrew typography parity (gershayim, geresh, א,ב,ג lists)

Closes two `REQUIREMENTS.md §B1` parity items — the Hebrew-specific typography a
Hebrew pipeline must not miss. Harness 39/39 → **43/43**.

### Gershayim ״ / geresh ׳ — supported and guarded
Correct Hebrew punctuation (gershayim ״ U+05F4 before the last letter of an
abbreviation: ע״י, סה״כ, תנ״ך; geresh ׳ U+05F3: ג׳ורג׳, עמ׳) is authored directly
and already allowed by the charset gate. New `check_bidi` rule `hebrew-ascii-quote`
FIRES on the wrong ASCII forms — a straight `"` or `'` sitting *between two Hebrew
letters* — and stays silent on the correct marks, on quote delimiters, and on JS
string quotes in authored `.mjs`. Positive + negative fixtures in
`tests/check_bidi.test.mjs`. Marks are DATA (`config/bidi-rules.json`).

### Hebrew ordered lists (א,ב,ג)
`ol.heb` uses native CSS `list-style-type: hebrew`; `src/components.mjs`
`hebrewList(items, {ordered, hebrew})` emits ordered (א,ב,ג) or bulleted RTL lists.
Added to hand-written base.css (outside the gen-css blocks, so T0 stays green).

### Example + harness
`examples/typography.mjs` demonstrates all of it, visually audited, and is wired
into the render + render-gate stages (T3/T3b) alongside the source gates it must
pass (T2). No output change to any pre-existing example.

## [0.4.2] — 2026-07-04 — verification-floor hardening (fail-loud math, fatal page errors, bidi fuzz)

Three robustness mechanisms and a coherence pass. Harness 31/31 → **39/39**; no
output change (every committed example still renders byte-for-byte as before).

### Fail-loud MathJax (no more silent wrong equations)
`AllPackages` bundles `noerrors` + `noundefined`, which SWALLOW TeX errors: a typo
like `\fracc` shipped as silent red text and a real parse error shipped as an
`<merror>` box — a wrong formula in the PDF with no signal, worse than any bidi
bug. `src/mathjax-render.mjs` now drops those two packages and installs a
`formatError` that THROWS, and `tex2svg` rethrows with the offending TeX. Every
bad expression dies at generation time. Valid math is byte-identical (the dropped
packages only touch the error path). Proven by `tests/mathjax_render.test.mjs`
(bad TeX throws, valid + custom-macro math renders) — harness T1.

### Fatal page errors
`src/render.mjs` collected page errors (uncaught JS, console errors, non-2xx
assets) but still exited 0, so only this harness's stderr grep caught them.
It now exits nonzero, so any caller does. Proven by `tests/fixtures/page_error.html`
(fires) vs a clean page (silent) — harness T2b.

### Bidi fuzz corpus (ROADMAP B5) — "the catalogue is a floor, not a ceiling"
`scripts/fuzz_bidi.mjs` deterministically enumerates 140 cases across
island-type-pair × neutral-separator × structural-context (p / box / table-cell /
list / heading), each with two unique Latin islands. The matrix is driven through
three oracles (harness T6): the render-gate (no letter-reversal), the DOM checker
(no isolation/arrow violation), and a new reading-order oracle
`scripts/check_fuzz.py` — for `.en`-isolated islands the first-logical island must
be RIGHTMOST (correct RTL reading), validated to fire on a reversed known-bad
(`tests/fixtures/fuzz_bad.html`) and stay silent across the whole corpus. Being
deterministic, the corpus doubles as a Chromium canary. (The empirical care behind
the oracle's invariant is recorded in HISTORY.md.)

### Coherence
`package.json` version 0.1.0 → 0.4.2 (had never tracked the changelog);
`REQUIREMENTS.md §B8` verification-pyramid items checked off against shipped
mechanisms; `SKILL.md` STATUS rewritten from "parity under construction" to the
actual state (verification floor complete, core capabilities demonstrated, named
gaps listed).

## [0.4.1] — 2026-07-04 — two findings closed (render-gate math scope, Heebo)

### Render-gate math scope, made explicit and guarded
The render-gate (`check_render.py`) is text-layer based; MathJax renders math as
SVG vector paths with no text layer, so the gate is structurally BLIND to glyph
order inside equations (verified: a 19-equation page yields zero extractable
math tokens). This is now documented as an explicit SCOPE in the gate, and the
one real math-order risk — Hebrew inside `\text{}` — is proven to be caught
upstream at the source layer. Harness additions (now 31/31):
- `check_bidi.mjs` must FIRE on `tests/fixtures/math_hebrew_in_text.tex`
  (Hebrew-in-`\text` in real equations) — the source guard for math order.
- the render-gate must stay SILENT on the math-heavy `spike1_math` page — proof
  it does not false-positive on vector math.

### Removed — Heebo (pinned + shipped but never wired)
Heebo appeared only in a (misleading) base.css comment; it had no `@font-face`
or `font-family` reference, yet was pinned in `versions.json`, checksummed, and
two woff2 files were committed. Removed the font files, the `@fontsource/heebo`
dependency (package.json + lock), and the versions.json entries; corrected the
comment. Frank Ruhl Libre already covers the Hebrew + Latin body; any uncovered
Hebrew codepoint is flagged loudly by the charset gate rather than silently
substituted (a speculative sans-under-serif fallback is the wrong default).
Proven: zero `heebo` matches across css/src/config/versions/package(-lock), and
every example still pixel-identical to baseline with the harness green.

## [0.4.0] — 2026-07-04 — data/system separation (config extraction)

Refactor toward "what changes a lot is data, what's stable is a generic engine."
**No output change**: every example is pixel-identical to the pre-refactor
baseline and the harness stays green (now 29/29 — adds a T0 that proves the
committed CSS matches the config). Documents remain `.mjs` (agreed config-only
scope); the engine code (render/document/components/diagram/checkers) keeps its
logic and now loads config instead of embedding it.

### Added (config/ — the new source of truth)
- `mathjax-macros.json` — MathJax macro set (was inline in `mathjax-render.mjs`).
- `charset-rules.json` — charset-gate codepoint ranges + reasons (was `classify()`).
- `bidi-rules.json` — `textMacros` (check_bidi) + rightward-arrow set (check_dom,
  passed into the in-page scan).
- `palette.json` — diagram/chart colors. `languages.json` — asm/python keyword
  sets (`codeBlock` gains a `lang` lookup).
- `labels.json` — UI strings (TOC heading, table-caption prefix).
- `boxes.json` — the six-box registry (role → colors); `components.mjs` validates
  roles against it.
- `theme.json` — design tokens (fonts, sizes, brand colors).
- `scripts/gen-css.mjs` — generates the data-driven parts of `base.css` (`:root`
  tokens, the `.box-<role>` colour rules, the caption prefix) into marked blocks
  from `boxes.json`/`theme.json`/`labels.json`. `base.css`/`document.css` consume
  the tokens via `var()`. Harness T0 enforces committed CSS == config.

## [0.3.0] — 2026-07-03 — content capabilities + green regression harness

Started building content-capability parity on top of the Phase 0 scaffold.
Every capability below is demonstrated by a rendered, visually-audited example
under `examples/` and passes the bidi checker.

### Added
- **ROADMAP A1 — Hebrew-in-math overlay** (`src/components.mjs`:
  `mathUnderLabel`/`mathOverLabel`/`symbolSubLabel`). Composes Hebrew math
  labels as HTML under/over a bare `\underbrace`/`\overbrace`, so Hebrew never
  enters MathJax `\text` (which reverses it). Verified: reads RTL correctly
  standalone, inside an equation, and with an LTR island in the label.
- **ROADMAP A2 — bidi linter** (`scripts/check_bidi.mjs`) with the
  `hebrew-in-math-text` rule (brace-balanced `\text`/`\mathrm`/`\mbox` scan) +
  CLI. `tests/check_bidi.test.mjs` locks it 10/10 (fires on positives, silent
  on negatives).
- **ROADMAP C1 — six semantic boxes** (`box()`/`steps()` + `.box-*` styles):
  def/thm/note/ex/warn/key, colored RTL title bar + tinted body, `nobreak`
  variant, per-line step list. `examples/boxes.mjs`.
- **ROADMAP C2 — five table patterns** (`tableBox()` + `.tablebox` styles):
  data / glossary / LTR-code-column / two-prose-column / wide-truth-table;
  neutral framed + auto-numbered "טבלה N." caption; the governing bidi rule
  (Hebrew-primary RTL columns vs. forced-LTR for code/truth tables so column
  order doesn't reverse). `examples/tables.mjs` — MIPS `$`/`()`/`[]` and a
  4-row truth table both correct.

- **ROADMAP C3 — code listings** (`codeBlock()` + `.listing` styles):
  LTR-isolated code (punctuation never reorders), optional line numbers with a
  colored side-bar, minimal keyword/comment/string tinting, contained inside
  boxes (no page-relative overflow). `examples/listings.mjs` — MIPS + Python.
- **ROADMAP C4 — document structure** (`src/document.mjs` `Doc` +
  `assets/css/document.css`): title page, paged.js TOC, part dividers,
  chapters (running header via string-set), auto-numbered display equations
  with build-time-resolved cross-references, and page-bottom footnotes.
  `examples/flagship.mjs` — a 7-page quantum-computing document combining
  parts, chapters, numbered eqs + refs, footnotes, and the box/table/math-label
  components; TOC page numbers verified correct, footnote floats to page bottom.

- **ROADMAP C5/C6 — diagram + quantum-circuit generators** (`src/diagram.mjs`):
  `blockDiagram({nodes, edges})` auto-routes arrows between rectangle borders
  and renders labels as `<foreignObject>` HTML (full bidi — the A1/spike-3 win;
  also serves decision trees with colored leaves + edge labels).
  `circuit({wires, columns, wireLabels})` renders wires, box gates, control→
  target (CNOT), bare targets, measurement, and SWAP from a compact spec.
  `examples/diagrams.mjs`: a mixed-label datapath, a decision tree, a bell-pair
  circuit, and a full teleportation circuit — all vector (0 raster images),
  Latin labels forward, parens un-mirrored.
- **ROADMAP C7 — line charts** (`lineChart()` in `src/diagram.mjs`): pgfplots
  equivalent — axes, gridlines, ticks, multiple series (solid/dashed) with data
  points, legend, and Hebrew axis labels via `<foreignObject>`. Demonstrated
  with an Amdahl's-law speedup chart in `examples/diagrams.mjs`; vector.
- **ROADMAP C8 — topic rail** (`assets/topicrail.js` + `Doc.topicRail()`): opt-in
  "you are here" progress header — one dot per `\part`, the current one enlarged
  and labelled. A paged.js `Handler` injects a self-styled rail into each page's
  top-center margin box, tracking the current part as pages lay out. Integrated
  into the flagship (2 parts), coexists with the chapter running-header, and the
  rail-enabled flagship still passes the determinism gate.

- **ROADMAP B2 — DOM-query structural checker** (`scripts/check_dom.mjs`): loads
  the RENDERED page in the pinned browser and queries computed styles (the
  architectural win over regex scanning, brief §3.1). **Empirical finding that
  reshaped the rule set:** by rendering and viewing each predicted-transferring
  class, `adjacent-ltr-islands` and `latin-before-paren-mirror` were **DISPROVEN**
  — comma-separated `.en` islands render in correct order and `CPI (Cycles…)`
  parens don't mirror in Chromium (CSS `unicode-bidi:isolate` handles both). The
  only class that genuinely transfers is the arrow flip, so the checker ships a
  single verified rule, `flow-arrow-rtl` (a rightward `→` in RTL Hebrew). Fixtures
  `dom_bad.html` (fires) and `dom_ok.html` (silent on the CSS-handled cases) lock
  it. REQUIREMENTS.md §A verdicts corrected accordingly.
- **ROADMAP B1 — charset gate** (`scripts/check_charset.mjs`): flags codepoints
  that silently tofu or confuse — Arabic/Cyrillic look-alikes of Hebrew/Latin,
  Hebrew cantillation marks (valid Hebrew-block codepoints Frank Ruhl has no
  glyph for), and stray bidi/zero-width controls. Allow-list is font-reality-
  based (° ₪ nikud maqaf gershayim pass). `tests/check_charset.test.mjs` locks
  it 11/11.
- **ROADMAP B3 — render-gate on the compiled PDF** (`scripts/check_render.py`):
  the only check that inspects the printed PDF, not the source. Detects
  visually-reversed Latin runs by comparing each PDF Latin run against the
  source token set (a run whose reverse — not itself — is a source token
  rendered reversed), plus folio-monotonicity. Empirically grounded: PyMuPDF
  returns glyphs in visual order, so a reversed word stores as its reversed
  spelling. Validated against a known-bad fixture (`tests/fixtures/render_bad.html`,
  a `bidi-override` Latin run) — fires on both reversed runs, silent on every
  good render.
- **ROADMAP D1 — regression harness** (`scripts/test_all.sh`): runs the checker
  corpus, source lint on every example, every example render (fails on page
  errors), the render-gate (positive + negative), the multi-page flagship, and a
  determinism check (render twice → normalize → byte-compare). **19/19 green.**
  `FAST=1` skips the heavy stages.

### Fixed
- **Determinism regression from footnotes.** paged.js mints a random UUID per
  footnote named-destination; `normalize_pdf.py` now canonicalizes UUIDs
  (length-preserving, by first-occurrence order) so renders are byte-identical
  again. `render.mjs` serves `/favicon.ico` (204) and no longer treats benign
  resource 404s / sourcemaps as page errors.

### Status
All content capabilities (C1–C8) and the full verification floor (B1 charset,
B2 DOM checker, B3 render-gate, D1 harness — 28/28 green) are implemented and
visually audited. Per-rule selftest (D2) is covered distributively by the
checker corpora (`tests/check_bidi.test.mjs` 10/10, `tests/check_charset.test.mjs`
11/11) plus the render-gate and DOM fixtures in the harness. Deeper hardening
that remains: a combinatorial fuzz corpus (brief §3.3) and a next-Chromium
canary job (brief §3.4).

## [0.1.0] — 2026-07-03 — Phase 0 complete

From-zero start of the browser-native (Chromium print-to-PDF + MathJax SVG)
replacement for `hebrew-lualatex-pdf`. This release is **de-risking + scaffold
only**; content-capability parity is not yet built.

### Added
- `REQUIREMENTS.md` — extracted content-capability list + bidi bug catalogue
  from the old skill, with a per-class transfer verdict (disappears / transfers /
  spiked). The literal parity checklist.
- `PHASE0.md` — all four mandatory de-risking spikes, each with viewed evidence
  and a go/no-go/fallback decision. All four GO.
- `src/mathjax-render.mjs` — server-side TeX→SVG (MathJax 3.2.2, `fontCache:local`):
  deterministic, self-contained, genuine vector paths (0 raster images verified).
- `src/render.mjs` — HTML→PDF via pinned Chromium 1194, served over a local HTTP
  server (paged.js needs http:// for its stylesheet XHR), print-media, fonts
  awaited before print. `--pagedjs` mode.
- `scripts/normalize_pdf.py` — neutralizes Chromium's embedded timestamp + trailer
  `/ID` so repeated renders are byte-identical (Chromium ignores SOURCE_DATE_EPOCH).
- `assets/css/base.css` — RTL body + the `.h`/`.en`/`.code` direction-isolation
  trio (`unicode-bidi:isolate`), pinned woff2 fonts with `unicode-range` splits.
- `references/content-style.md` — ported verbatim from the old skill
  (presentation-agnostic content DNA).
- `versions.json` — pinned Chromium/MathJax/paged.js/font versions + font & vendor
  checksums.
- `spikes/` — the four spike generators + hand-authored fixtures.

### Verified (evidence in PHASE0.md)
- Math renders as vector, sharp at 300 dpi; Latin+parens in math `\text` do NOT mirror.
- paged.js TOC page numbers correct and pixel-stable across two builds;
  byte-identical after `normalize_pdf.py`.
- SVG diagram + quantum-circuit mixed Hebrew/Latin labels render correctly
  (the `reversed-latin-in-tikz-node` class structurally disappears).
- Per-glyph PDF position data extracts cleanly (render-gate substrate).

### Known engine limitation (named, not shipped silently)
- **MathJax cannot set Hebrew inside `\text{}`** — renders reversed + letter-spaced.
  Fallback: Hebrew math labels via HTML overlay / adjacent RTL prose; a
  `hebrew-in-math-text` linter guard will make it un-shippable. Build-phase task #1.

### Not yet built (tracked in REQUIREMENTS.md §B)
Content-capability parity (boxes, tables, listings, full diagram generators,
title page/TOC/parts wiring, topic rail, footnotes, cross-refs), the DOM-query
structural checker, the render-gate implementation, the fuzz corpus, the canary
job, and the regression harness.
