# Showcase — Hebrew academic PDFs

## Short demos (same topic, both skills)

| | Browser | LuaLaTeX |
|---|---|---|
| Skill | `hebrew-browser-pdf` 0.9.9 | `hebrew-lualatex-pdf` 3.23.7 |
| Source | `hebrew-browser-pdf/docs/insanity.mjs` | `hebrew-lualatex-pdf/docs/insanity.tex` |
| PDF | `output/insanity.pdf` (~19 pp) | `output/insanity-lualatex.pdf` (~25 pp) |

Both cover: pipeline/hazards, cache/AMAT, qubits, Bell/teleport, hybrid control, worked exercises.

### Build — browser

```bash
cd hebrew-browser-pdf && npm install
node docs/insanity.mjs
node src/render.mjs docs/insanity.html ../../output/insanity.pdf
python3 scripts/normalize_pdf.py ../../output/insanity.pdf
```

### Build — LuaLaTeX (short demo)

```bash
cd hebrew-lualatex-pdf
bash scripts/setup_fonts.sh
cp assets/preamble.tex docs/
cd docs && bash ../scripts/build.sh insanity.tex
cp insanity.pdf ../../output/insanity-lualatex.pdf
```

## Long anthology (~102 pp) — LuaLaTeX (`content-style.md`)

Follows skill DNA: prose default, ~1–2 colored boxes/chapter (~12% in boxes), numbered equations as spine — not a gallery wall of boxes.

| | |
|---|---|
| Generator | `hebrew-lualatex-pdf/docs/gen_anthology.py` |
| Source | `hebrew-lualatex-pdf/docs/anthology.tex` |
| PDF | `output/anthology-100pp.pdf` |
| Density | ~73 chapters, ~92 numbered eqs, ~1.5 boxes/ch, exercises part at end |
| Gates | charset+bidi clean; 0 missing glyphs; 0 overfull; render-gate green; density OK |

```bash
cd hebrew-lualatex-pdf
bash scripts/setup_fonts.sh
cp assets/preamble.tex docs/
cd docs && python3 gen_anthology.py && bash ../scripts/build.sh anthology.tex
cp anthology.pdf ../../output/anthology-100pp.pdf
```

## Content-style galleries (new)

Compiled exemplars that teach **document rhythm**, not just widget catalogs:

| | |
|---|---|
| Chapter rhythm + density ruler | `hebrew-lualatex-pdf/assets/example_chapter.tex` → `output/example_chapter.pdf` (4 pp) |
| Before → after migrations | `hebrew-lualatex-pdf/assets/example_before_after.tex` → `output/example_before_after.pdf` (4 pp) |
| Page previews | `output/galleries/*.png` |

```bash
cd hebrew-lualatex-pdf/assets
bash ../scripts/build.sh example_chapter.tex
bash ../scripts/build.sh example_before_after.tex
cp example_chapter.pdf example_before_after.pdf ../../output/
pdftoppm -png -r 140 example_chapter.pdf ../../output/galleries/chapter
pdftoppm -png -r 140 example_before_after.pdf ../../output/galleries/before-after
```

## Agent brief

`briefs/make-browser-pdf-impressive.md` — how to make browser output more visually impressive.
