# hebrew-browser-pdf

A **browser-native** pipeline for polished academic PDFs in Hebrew (or mixed
Hebrew/English): real vector math (MathJax SVG), SVG diagrams and quantum
circuits, code listings, colored boxes, and a paginated TOC — rendered by pinned
headless **Chromium** (HTML/CSS print-to-PDF) instead of LaTeX. RTL Hebrew prose
with correctly-isolated LTR islands via CSS `unicode-bidi`, not babel.

It is a from-scratch, browser-native alternative to the LuaLaTeX skill
`hebrew-lualatex-pdf`, built from that skill's capability set as a requirements
spec (not a port of its code).

> **Status: Phase 0 (de-risking) complete.** The four architectural unknowns are
> spiked with viewed evidence, the scaffold and deterministic render pipeline are
> in place. Content-capability parity (boxes, tables, listings, diagram
> generators, full document structure, the verification pyramid) is the next
> phase — tracked as a literal checklist in [`REQUIREMENTS.md`](./REQUIREMENTS.md).

## Read order

| Doc | What it is |
|---|---|
| [`SKILL.md`](./SKILL.md) | How to use it: architecture, setup, render, verify. |
| [`REQUIREMENTS.md`](./REQUIREMENTS.md) | The parity target — capability checklist (§B) + the bidi bug catalogue with transfer verdicts (§A). |
| [`PHASE0.md`](./PHASE0.md) | The four de-risking spikes with viewed evidence + go/no-go decisions. All GO. |
| [`CHANGELOG.md`](./CHANGELOG.md) / [`HISTORY.md`](./HISTORY.md) | What's built (semver) / the empirical story behind each decision. |
| [`references/content-style.md`](./references/content-style.md) | The content DNA (density, chapter rhythm, box discipline). Read before writing content. |
| [`versions.json`](./versions.json) | Pinned Chromium / MathJax / paged.js / font versions + checksums. |

## Setup

```bash
npm install                                              # pins in package.json
pip install --break-system-packages pymupdf pdfminer.six pikepdf
```

Chromium is the Playwright-managed build pinned in `versions.json` (build 1194).
In a Playwright-provisioned environment it is already present; otherwise
`npx playwright install chromium` fetches the matching build.

## Render

```bash
# Generate a spike document, then render it:
node spikes/spike1_math.mjs                              # -> spikes/spike1_math.html
node src/render.mjs spikes/spike1_math.html out.pdf      # CSS @page paging
node src/render.mjs spikes/spike2_paged.html out.pdf --pagedjs   # paged.js: TOC, running headers
python3 scripts/normalize_pdf.py out.pdf                 # byte-stable metadata
```

Math is pre-rendered server-side to inline SVG (`src/mathjax-render.mjs`), so the
HTML is self-contained, deterministic, and genuinely vector at any print DPI.

## Reproduce the Phase 0 evidence

```bash
node spikes/spike1_math.mjs   && node src/render.mjs spikes/spike1_math.html spikes/spike1_math.pdf
node spikes/spike2_build.mjs  && node src/render.mjs spikes/spike2_paged.html spikes/spike2_build1.pdf --pagedjs
node src/render.mjs spikes/spike3_diagrams.html spikes/spike3_diagrams.pdf
# then rasterize + view the PDFs, and (spike 4) extract per-glyph positions with PyMuPDF rawdict.
```

## License

For personal use.
