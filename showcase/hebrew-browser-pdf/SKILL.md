---
name: hebrew-browser-pdf
description: Browser-native pipeline for polished academic PDFs in Hebrew (or mixed Hebrew/English) with real vector math (MathJax SVG), SVG diagrams and quantum circuits, code listings, colored boxes, and a paginated TOC — rendered by pinned headless Chromium (HTML/CSS print-to-PDF) instead of LaTeX. RTL Hebrew prose with correctly-isolated LTR islands via CSS unicode-bidi, not babel. STATUS: Phase 0 (de-risking) complete; the verification floor is complete (charset gate, DOM structural checker, render-gate on the compiled PDF, fail-loud MathJax, a combinatorial bidi fuzz corpus, and deterministic build — 43/43 harness); the core content capabilities are demonstrated (six boxes, five tables, listings, diagrams + quantum circuit, numbered equations + cross-refs, footnotes, TOC, topic rail, Hebrew typography — gershayim / geresh / א,ב,ג lists), with charts and a reusable quantum-circuit generator still open (see REQUIREMENTS.md §B and CHANGELOG.md). For the production, battle-tested pipeline today, use the sibling skill hebrew-lualatex-pdf.
license: For personal use.
---

# Hebrew + Math + Figures academic PDFs (browser-native, v2)

A from-scratch, browser-native alternative to `hebrew-lualatex-pdf`. Same
deliverable target — dense RTL Hebrew academic documents with real vector math,
diagrams, quantum circuits, boxes, tables, listings, a title page and TOC — but
the engine is **pinned headless Chromium printing HTML/CSS to PDF**, math is
**MathJax SVG**, bidi is **CSS `unicode-bidi: isolate` / `<bdi>` / `dir`**, and
paging is **paged.js**.

**Why a browser engine.** Chromium's bidi is UAX#9-compliant production code
exercised by billions of RTL pages daily — a lower baseline failure rate than
babel `bidi=basic`. Crucially, HTML exposes isolation primitives (`dir`,
`unicode-bidi`, `<bdi>`) in *every* context, so a whole family of the old
pipeline's bugs (Latin reversed in a TikZ node, code punctuation jumping in a
box title, `\texttt` neutrals mirroring) **structurally disappears**. The bugs
that remain are *correct* Unicode behavior (neutral reordering between adjacent
LTR islands, paren mirroring, non-mirrored arrows) and are caught by an
authoring linter, exactly as before. Full analysis: `REQUIREMENTS.md`.

This is **not** a claim the browser is bug-free. Phase 0 already found one hard
engine limit — **MathJax cannot set Hebrew inside `\text{}`** (renders reversed);
Hebrew math labels use an HTML overlay instead. See `PHASE0.md`.

## Status & where to read

| Doc | What it is |
|---|---|
| `REQUIREMENTS.md` | The parity target: content-capability checklist (§B) + bidi bug catalogue with transfer verdicts (§A). Start here. |
| `PHASE0.md` | The four de-risking spikes with viewed evidence + go/no-go decisions. All GO. |
| `CHANGELOG.md` / `HISTORY.md` | What is built (semver) / why (empirical narrative). |
| `references/content-style.md` | The content DNA (density, chapter rhythm, box discipline, exercise format) — ported verbatim; presentation-agnostic. **Read before writing content.** |

## Setup

```bash
npm install                                  # pins in package.json / versions.json
pip install --break-system-packages pymupdf pdfminer.six pikepdf
```

Chromium is the pinned Playwright build 1194 (`versions.json`); no download needed
in this environment (`/opt/pw-browsers/chromium-1194`).

## Render

```bash
node src/render.mjs input.html output.pdf              # CSS @page paging
node src/render.mjs input.html output.pdf --pagedjs    # paged.js (TOC, running headers)
python3 scripts/normalize_pdf.py output.pdf            # deterministic metadata (byte-stable)
```

Math is pre-rendered server-side to inline SVG (`src/mathjax-render.mjs`) — the
HTML is self-contained, deterministic, and genuinely vector at any print DPI.

## Verify (the discipline carries over from v1 — non-negotiable)

Never declare a stage done from a log. For every output: rasterize, **view**, and
for text-order claims extract per-glyph positions from the compiled PDF and check
them (`PyMuPDF get_text("rawdict")`). Do **not** grep Hebrew from a PDF — RTL
extraction is scrambled; render and look at the image. Green typographic gates are
not evidence of correct physics/math — that is a separate manual pass.

## Architecture at a glance

```
content (HTML with .h/.en/.code islands + $tex$)
  └─ src/mathjax-render.mjs   TeX → inline SVG (vector, deterministic)
  └─ assets/css/base.css      RTL body, unicode-bidi isolation, pinned fonts
  └─ paged.js (opt)           TOC target-counter, running headers, page nums
     └─ src/render.mjs         pinned Chromium → PDF (served over http://)
        └─ scripts/normalize_pdf.py   byte-stable output
           └─ verification pyramid    charset · DOM structural · render-gate · visual · content
```

The verification pyramid (charset gate, DOM-query structural checker, render-gate
on the compiled PDF, fuzz corpus, visual audit, content cross-check) is specified
in `REQUIREMENTS.md §B8` and is the next build phase.
