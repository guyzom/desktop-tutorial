# hebrew-browser-pdf — empirical history

The narrative behind each decision, kept out of `CHANGELOG.md` so that stays
scannable. Read this for the archaeology of a specific choice.

## Phase 0 (v0.1.0) — the four spikes, and what they actually showed

The brief mandated four de-risking spikes before any full build, each producing
*viewed* output, not a plan. All four were run; here is what surprised us.

**MathJax SVG math (spike 1) — the good and the one bad.** Server-side TeX→SVG
with `fontCache:'local'` gave exactly what was hoped: PyMuPDF reported 0 raster
images / 183 vector drawings on the math page, sharp at 300 dpi, and the
notorious `\text{Latin (parens)}` mirror bug from the LaTeX world simply did not
occur — MathJax isolates Latin+parens correctly. The surprise was the *inverse*:
Hebrew inside `\text{}` renders **reversed and letter-spaced**
(`אנרגיית מנוחה` → `הח ו נמת י י ג ר נא`, extracted from the PDF text layer).
MathJax 3's SVG output has no RTL shaping for `\text`. This is the single hard
engine limit found in Phase 0. The requirements extraction had flagged this exact
class (A5/A6) as "unknown — needs spike"; the spike turned unknown into a firm
"do not put Hebrew in MathJax," with an HTML-overlay fallback and a linter guard.
Notably the *Latin* half of that class (A5) came out fine — so the rule is
asymmetric: Latin-in-math-text is safe, Hebrew-in-math-text is not.

**paged.js (spike 2) — the CORS trap, then a clean pass.** The first render hung:
paged.js re-fetches the document stylesheet via XHR to re-parse `@page` rules, and
under `file://` that XHR is blocked by CORS (`Cross origin requests are only
supported for … http, https`). The fix reshaped the render harness — it now
serves the tree over a throwaway local HTTP server and navigates to
`http://127.0.0.1`. After that, paged.js `target-counter` produced correct TOC
page numbers (verified by viewing the TOC page, not grepping it), and two
consecutive builds were **pixel-identical on all 7 pages**. The only byte
difference was Chromium's embedded `CreationDate`/`ModDate` — the metadata
non-determinism the brief predicted. Since Chromium ignores `SOURCE_DATE_EPOCH`,
determinism is enforced by a post-pass (`normalize_pdf.py`, pikepdf `static_id` +
fixed `/Info` dates); after it, the two builds hash-match exactly. "Fixed point"
in this stack = pixel-identical render + normalized metadata. This is the same
class of bug the old pipeline shipped once (v3.23.3 stale TOC numbers) and caught
only by explicit audit — so it was audited explicitly here, by viewing and by
cross-build pixel hashing, before declaring GO.

**SVG diagrams (spike 3) — A1 really does vanish.** The old skill's most
expensive bug was `reversed-latin-in-tikz-node` (`Datapath` → `htapataD`). Two
label strategies were tested side by side: raw SVG `<text>` with isolated
`<tspan>`s, and `<foreignObject>` wrapping HTML `<bdi>`. Both rendered
`מעבד (CPU)` with forward Latin and un-mirrored parens, and a hand-authored bell-
pair circuit read correctly. foreignObject won as the default (full HTML bidi for
free, reuses the `.h`/`.en` CSS). The A1 class is structurally gone, confirming
the requirements verdict — the "box that skips bidi" pathology has no HTML
analogue.

**PDF extraction (spike 4) — positions, not strings.** The render-gate needs
left-to-right glyph geometry from the compiled PDF. PyMuPDF `rawdict` gives a
per-character `origin`; the Latin run `Quantum` extracted with monotonically
increasing x (correct order), so a mirrored run is detectable by comparing visual
x-order against source tokens. And the old "don't grep Hebrew from a PDF" fact
reproduced — RTL *reading order* is scrambled on extraction — which is exactly why
the gate must work on positions and visual audit stays mandatory.

**Net.** All four GO. The scaffold, pinned versions, deterministic render, and the
render-gate substrate are in place. The first build-phase task is the Hebrew-in-
math fallback, because it is the one place the engine cannot be trusted.

## v0.4.2 — the fuzz corpus, and the reading-order invariant that fought back

Building the combinatorial bidi fuzz (ROADMAP B5) turned into a lesson in how
easy it is to encode a *wrong* oracle and have it look right. The plan: for a
case `Hebrew <islandA> sep <islandB> Hebrew`, assert the two `.en` islands land
in correct reading order. The first attempt asserted island A must be to the
**left** of island B — reasoning that a neutral separator between two LTR runs
coalesces them into one left-to-right group. A quick calibration "confirmed" it:
35 cases, 0 violations. So the oracle shipped that invariant — and then fired on
all 105 real cases.

The debugging is the point. Standalone the same markup rendered A-left (oracle
happy); in the full corpus it rendered A-**right** (oracle furious) — a
context-dependent flip that looked, for an hour, like a genuine Chromium reorder
bug (it was even reproduced in a hi-res raster). It was not. The calibration had
been run from a `/tmp` file whose relative `../assets/css/base.css` href
404'd — so it rendered **without** `.en { unicode-bidi: isolate }`. The whole
"A-left" model was measured on un-isolated text. With isolation actually applied
(served under the repo root), the invariant is the opposite and uniform: each
isolate is an independent object placed in the RTL run, so the **first-logical
island is rightmost**, and reading right-to-left recovers the correct order —
across pure-Latin, digit-suffixed, and three-island cases alike. The oracle's
comparison was flipped to `x(A) > x(B)`, the corpus went clean 140/140, and a
deliberately mis-authored fixture proves it still fires.

Two lessons banked: (1) a bidi oracle must be calibrated against the *actual*
rendering path (CSS loaded, served exactly as production serves it), or it
measures the wrong thing convincingly; (2) the render fail-loud work landed the
same week for the same reason — a 404 that silently drops the stylesheet should
never again pass as a successful render, and now it exits nonzero.
