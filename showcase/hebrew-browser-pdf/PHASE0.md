# Phase 0 — de-risking spikes (results)

Four mandatory spikes (brief §2). **Each produced actual, viewed output**, not a
plan. Evidence lives in `spikes/`. Every spike carries an explicit
go/no-go/fallback decision and any architectural risk found — including risks
that don't block progress (brief §4.4).

Environment pinned during these spikes: Chromium build **1194** (Playwright
1.56.1, `/opt/pw-browsers/chromium-1194`), MathJax **3.2.2** (SVG output,
server-side), paged.js **0.4.3**, Frank Ruhl Libre + Heebo + JetBrains Mono
(woff2, checksummed in `versions.json`). PDF inspection: PyMuPDF 1.28.0,
pdfminer.six, pikepdf 10.9.1.

---

## Spike 1 — MathJax SVG quality at print resolution → **GO (with one named risk)**

Built `spikes/spike1_math.html` reproducing the content edges of the old skill's
`example_math.tex`: named operators, Latin-in-math, braket macros, matrices,
display + inline math in RTL prose, and text-in-math with parentheses.
Rendered to PDF, rasterized at 300 dpi (`spikes/spike1_math_300dpi.png`), viewed.

**Vector confirmed, not eyeballed.** PyMuPDF object inspection:
`raster_images = 0`, `vector_drawings = 183` across the page. The math is
genuine `<path>` geometry (MathJax SVG output, `fontCache:'local'`), sharp at
300 dpi. No web fonts are needed for math — the glyphs are inlined paths.

**Bidi edges that PASS** (visually verified):
- `X ~ Normal(μ,σ²)`, `Specificity (TNR)`, `det(H) = −1` — **parentheses do NOT
  mirror.** The old skill's `text-in-math-parens-mirror` bug (needed
  `\text{\en{...}}`) **does not occur** — Latin+parens inside MathJax `\text{}`
  render correctly with no extra wrapping.
- Inline math sits correctly inside RTL Hebrew prose as an LTR island.
- `\id` renders 𝟙 (identity), not a turnstile.

**RISK FOUND (does not block, but is build-phase task #1):**
**Hebrew text inside MathJax `\text{}` renders reversed and letter-spaced.**
The `\underbrace{mc^2}_{\text{אנרגיית מנוחה}}` label extracted from the PDF as
`הח ו נמת י י ג ר נא`, and `Entropy(קבוצה)` as `ה צ ו בק` — glyphs reversed and
spaced apart. MathJax 3's SVG output lays Hebrew runs left-to-right per glyph;
it has no real RTL shaping for `\text`. This is exactly the `A5/A6` "unknown —
needs spike" class from the requirements extraction, now **empirically failing**.

- **Decision:** Latin inside math `\text` is fine; **Hebrew must never go inside
  MathJax.** Fallback for Hebrew-labelled math (under/over-brace labels, Hebrew
  subscripts): render the math structure in MathJax and compose the Hebrew label
  as an **HTML overlay** positioned over the SVG, or keep Hebrew descriptions in
  RTL prose adjacent to the equation (the old skill's own A6 guidance). A reusable
  overlay helper is the first build-phase deliverable. A linter check
  `hebrew-in-math-text` (flag any Hebrew codepoint in a `\text{}` fed to MathJax)
  makes the failure impossible to ship silently.

---

## Spike 2 — paged-media reality check → **GO (paged.js clears the bar)**

The brief flags this as *not* natively solved by Chromium print-to-PDF, and as
the class of bug the old pipeline once shipped (v3.23.3's stale-TOC-page-numbers).
Built a 7-page document (`spikes/spike2_paged.html`) with a title page, a TOC, 5
chapters, a running header (current chapter via `string-set` + `@top-right`), and
an auto page-number footer. Paginated with paged.js 0.4.3; page numbers via CSS
`target-counter(attr(href), page)`.

**TOC page numbers are CORRECT** (`spikes/spike2_toc_build1.png`, viewed):
פרק א→3, ב→4, ג→5, ד→6, ה→7 — each matches the actual page where that chapter's
`<h1>` lands. Footer folio and running header render; folio is LTR-isolated so
digits can't reverse.

**Output is STABLE across builds.** Rendered the same HTML twice; **all 7 pages
are pixel-identical** (per-page 150-dpi raster sha256 match, build1 == build2).
The only byte-level difference was the Chromium-embedded `CreationDate`/`ModDate`
(a 2-second wall-clock delta) — the exact metadata non-determinism the brief
predicted. `scripts/normalize_pdf.py` neutralizes `/Info` dates + trailer `/ID`;
**after normalization the two builds are byte-identical** (sha256
`d66e34662674fcaa…` for both). "Fixed point" in this stack = *pixel-identical
render + normalized metadata*.

- **Decision:** paged.js is the paging layer. Determinism is a two-part
  guarantee: content is deterministic by construction; metadata is neutralized in
  a post-pass (Chromium ignores `SOURCE_DATE_EPOCH`, so post-processing replaces
  the old `SOURCE_DATE_EPOCH` mechanism).
- **Cross-environment caveat (named, non-blocking):** font discovery / Chromium
  build changes remain environment-specific by nature; the canary job (brief §3.4)
  guards against a browser update silently changing layout.
- **Minor note:** a two-pass fallback (render → measure DOM breaks → inject TOC →
  re-render) is available if paged.js ever regresses, but is not needed now.

---

## Spike 3 — diagram / quantum-circuit feasibility in SVG → **GO (both approaches work)**

SVG text direction is its own mechanism (brief §2.3), so tested two label
strategies head-to-head in `spikes/spike3_diagrams.html`
(`spikes/spike3_diagrams.png`, viewed):

- **Figure 1 — raw SVG `<text>`** with `<tspan class="h">`/`<tspan class="en">`
  carrying `direction` + `unicode-bidi:isolate`.
- **Figure 2 — SVG `<foreignObject>`** wrapping HTML with `<bdi>` islands.

Both render the mixed node `מעבד (CPU)` with the **Latin forward and the
parentheses un-mirrored**, the Hebrew-only node (`זיכרון`) and the Latin-only
node (`Datapath`) correct. The old skill's headline bug
`reversed-latin-in-tikz-node` (`Datapath`→`htapataD`) **structurally does not
occur** — confirming the requirements-extraction verdict (a).

- **Figure 3 — quantum circuit** (bell pair): wires, `H` gate, CNOT
  (control dot + ⊕ target), two measurement gates, `|0⟩` kets, and an
  LTR-isolated caption `(H → CNOT)`. All read correctly; the `→` inside the
  all-Latin/code caption correctly points forward.

- **Decision:** diagram labels use **`<foreignObject>` + HTML bidi** as the
  primary mechanism (full HTML bidi for free, reuses the `.h`/`.en` CSS), with
  raw SVG `<text>` + isolation as a lighter option for simple labels. Quantum
  circuits are hand-authored/generated SVG. A reusable circuit + block-diagram
  generator is a build-phase task (feasibility is proven here).
- **Risk (named):** raw SVG `<text>` requires *explicit* per-segment isolation
  (`<tspan>` with direction); a bare mixed `<text>` without isolation would rely
  on the UBA at the text-element level — foreignObject avoids the question
  entirely, which is why it's the default.

---

## Spike 4 — PDF text-layer extractability for the render-gate → **GO**

The render-gate (brief §3.2 layer 4) needs text runs **with left-to-right glyph
position data** from the *compiled* PDF, not just reading order. Verified with
PyMuPDF `get_text("rawdict")` on `spikes/spike1_math.pdf`: every character
carries an `origin` (x, y). The Latin run `Quantum` extracts as per-glyph
x-origins that are **monotonically increasing** (correct L→R order) — so a
reversed Latin run (mirrored glyph order) is detectable by comparing visual x-order
against source token order. 99 spans extracted from a single page with full
per-glyph geometry.

- **Decision:** PyMuPDF `rawdict` is the render-gate substrate (chosen over
  pdfminer.six and the accessibility tree). It gives per-glyph x/y directly.
- **Note:** RTL Hebrew extraction *reading order* is scrambled (the old
  "don't grep Hebrew from a PDF" fact reproduces here) — which is *why* the gate
  works on **positions**, not extracted strings, and why visual audit stays
  mandatory.

---

## Phase 0 summary

| Spike | Decision | Blocking risk? |
|---|---|---|
| 1 · MathJax SVG math | **GO** | No — but Hebrew-in-math-`\text` fails; fallback defined (build task #1) |
| 2 · paged.js TOC + determinism | **GO** | No — correct + byte-stable after metadata normalization |
| 3 · SVG diagrams + circuits | **GO** | No — A1 class structurally gone |
| 4 · PDF text-layer extraction | **GO** | No — per-glyph positions confirmed |

All four clear their bar. Proceed to §3 (target architecture). The one real
engine limitation discovered — **MathJax cannot set Hebrew inside math** — is
named, has a fallback, and gets a linter guard, rather than shipping silently.
