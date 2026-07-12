# Brief — Make `hebrew-browser-pdf` output the most impressive academic PDF

You are upgrading the **product look** of documents produced by `hebrew-browser-pdf`, not reinventing the bidi engine. Goal: a reader should open the PDF and feel “this is a polished study anthology,” matching or beating `hebrew-lualatex-pdf` visually while keeping the browser pipeline’s correctness advantages.

## Context (read first)

- Skill root: `showcase/hebrew-browser-pdf/` (or the skill folder in use).
- Reference “already impressive” look: `showcase/output/insanity-lualatex.pdf` + LuaLaTeX boxes/chapter chrome.
- Current browser showcase: `docs/insanity.mjs` → `showcase/output/insanity.pdf`.
- Design history that weakened impressiveness: changelog **0.9.6** (monochrome ink accents) and **0.9.7** (bar-less filled cards). Those helped calm reading; they also reduced “textbook presence.” Restore **semantic visual hierarchy** without returning to clutter.

## Non-goals

- Do not port LuaLaTeX code.
- Do not weaken bidi isolation, linters, render-gate, or fail-loud MathJax.
- Do not re-enable paged.js as default pagination (known content-drop risk). Prefer Chromium native `@page` + post-stamp if needed for headers/TOC.
- Do not turn the page into a marketing landing layout (no hero cards, pill clusters, purple glow aesthetics).

## Definition of done

A re-rendered multi-page showcase (update `docs/insanity.mjs` or equivalent) that a human visual audit judges **more impressive than the current browser PDF** on:

1. Book chrome (chapter/eq numbering, headers/folios, TOC presence)
2. Box role readability at a glance
3. Page density / rhythm (less sparse than today; part pages intentional)
4. Diagram/circuit/chart visual weight
5. Display-math presence

Also required:

- `node scripts/check_bidi.mjs` clean on authored sources
- charset gate clean
- harness green (or `FAST=1` + full example render of the showcase)
- before/after raster of ≥4 content pages saved next to the PDF
- short note in `CHANGELOG.md` under a new semver describing the visual changes

## Work package (do in order)

### A. Book chrome (highest impact)

1. **Chapter numbering in the heading** — e.g. `פרק 3` + title (mirror LuaLaTeX report feel), not bare `h2`.
2. **Equation numbers as `(chapter.n)` or `(N.M)`** when chapters exist; keep left-pinned eqnos.
3. **Running header** — current chapter title in `@page` margin (native Chromium if possible; else stamp post-pass like existing `stamp_chrome.py` patterns).
4. **TOC** — leader dots + correct page numbers; links that work in common PDF viewers (explicit GOTO if needed).
5. Folio: stable LTR page numbers (already partly there — verify no 18→81 class).

Acceptance: open the PDF mid-document and immediately know which chapter you’re in; equations cite as `(3.1)`-style; TOC navigates.

### B. Boxes — semantic color without clutter

Restore role signaling that survived LuaLaTeX’s colored frametitles:

- Keep filled-card model if desired, but add **one strong role cue**:
  - preferred: colored **title bar** or thick **inline-start rule** + role title color, **or**
  - stronger per-role fill + title ink (def/thm/key/result/warn/note/ex distinct at arm’s length).
- `warn` stays the interrupting warm accent.
- Scarcity rule unchanged: prose default; ~1 box/chapter; box share not a rainbow wall.

Implement via `config/boxes.json` + `scripts/gen-css.mjs` (data-driven). Do not hardcode one-off CSS in the showcase only.

Acceptance: from a 110dpi raster, you can tell def vs thm vs warn vs key without reading body text.

### C. Density & page rhythm

1. Tighten vertical rhythm: paragraph ↔ display eq ↔ box gaps (CSS in `document.css` / `base.css`).
2. Part dividers: either fewer blank calories or a stronger part page (large title + short deck), not a lonely line in a sea of white.
3. Captions (`איור — …`, `טבלה N.`) — consistent size/color/weight; slightly stronger than body secondary text.

Acceptance: content pages feel “full” like the LuaLaTeX showcase without looking cramped; part pages feel designed.

### D. Math presence

1. Slightly larger display math; ensure eq number contrast.
2. Keep Hebrew math labels as HTML overlays (`mathUnderLabel` / `mathOverLabel`) — never MathJax `\text{עברית}`.
3. Audit inline vs display rules already in the skill (`inline-math-chain`); don’t regress.

Acceptance: display equations dominate their band of the page like TeX, not like small UI icons.

### E. Figures / circuits / charts

1. Block diagrams: clearer fills/strokes, consistent node radius, edge labels readable.
2. Quantum circuits: closer to quantikz weight (stroke, gate size, spacing); polish generator defaults in `src/diagram.mjs`.
3. Charts: axis ink, grid subtle, legend clear; Hebrew axis labels remain bidi-correct.

Acceptance: at least one diagram and one circuit on the showcase look “print textbook,” not wireframe.

### F. Typography

1. Prefer real italic face for emphasis if the font stack allows (browser advantage over FakeSlant).
2. Stronger hierarchy: part > chapter > section > body > caption.
3. Keep Frank Ruhl + JetBrains Mono; don’t switch to Inter/Roboto/system UI fonts.

## Verification loop (mandatory)

For every visual claim:

1. Render PDF.
2. `pdftoppm` (or PyMuPDF pixmap) at ~110–140 dpi.
3. **Open and look** — do not declare done from logs.
4. Do not grep Hebrew from PDF text extraction to judge RTL.

Run bidi/charset on sources; run render-gate on known fixtures if you touch render/stamp.

## Suggested file touch list

- `config/boxes.json`, `config/theme.json`, `config/palette.json`
- `scripts/gen-css.mjs` → `assets/css/base.css`
- `assets/css/document.css`
- `src/document.mjs` (chapter/eq numbering, TOC chrome)
- `src/diagram.mjs` (defaults)
- `scripts/stamp_chrome.py` (if headers/TOC need post-pass)
- `docs/insanity.mjs` (dogfood)
- `CHANGELOG.md`

## Out of scope unless blocking

- Full paged.js restoration
- Charts feature parity beyond polish of existing `lineChart`
- Content rewrite of the whole anthology (reuse showcase; tighten structure only as needed)

## Deliverable summary for the human

When finished, report:

- What changed visually (5 bullets max)
- Paths to new PDF + before/after rasters
- Gate status (bidi/charset/harness)
- Anything still weaker than LuaLaTeX and why
