# Showcase — Hebrew academic PDFs

## Short demos (same topic, both skills)

| | Browser | LuaLaTeX |
|---|---|---|
| Skill | `hebrew-browser-pdf` 0.9.9 | `hebrew-lualatex-pdf` 3.23.7 |
| Source | `hebrew-browser-pdf/docs/insanity.mjs` | `hebrew-lualatex-pdf/docs/insanity.tex` |
| PDF | `output/insanity.pdf` (~19 pp) | `output/insanity-lualatex.pdf` (~25 pp) |

## Long anthology (~163 pp) — LuaLaTeX

| | |
|---|---|
| Generator | `hebrew-lualatex-pdf/docs/gen_anthology.py` |
| Source | `hebrew-lualatex-pdf/docs/anthology.tex` |
| PDF | `output/anthology-100pp.pdf` |
| Contents | 8 parts, 61+ topic chapters, equations, boxes, tables, asm listings, TikZ, quantikz, plots, 24 exercises |
| Gates | charset+bidi clean; 0 missing glyphs; 0 overfull; render-gate green |

```bash
cd hebrew-lualatex-pdf
bash scripts/setup_fonts.sh
cp assets/preamble.tex docs/
cd docs && python3 gen_anthology.py && bash ../scripts/build.sh anthology.tex
cp anthology.pdf ../../output/anthology-100pp.pdf
```

## Agent brief

`briefs/make-browser-pdf-impressive.md` — how to make browser output more visually impressive.
