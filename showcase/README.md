# Showcase — מבנה המחשב הקוונטי

שני מסמכי ראווה צפופים על אותו נושא, אחד לכל סקיל.

| | Browser | LuaLaTeX |
|---|---|---|
| סקיל | `hebrew-browser-pdf` v0.9.9 | `hebrew-lualatex-pdf` v3.23.7 |
| מקור | `hebrew-browser-pdf/docs/insanity.mjs` | `hebrew-lualatex-pdf/docs/insanity.tex` |
| PDF | `output/insanity.pdf` (~19 עמ׳) | `output/insanity-lualatex.pdf` (~25 עמ׳) |

שניהם מכסים: צנרת/hazards, מטמון/AMAT, קיוביטים, בל/טלפורטציה, בקרה היברידית, תרגילים פתורים.

## בניה — browser

```bash
cd hebrew-browser-pdf && npm install
node docs/insanity.mjs
node src/render.mjs docs/insanity.html ../../output/insanity.pdf
python3 scripts/normalize_pdf.py ../../output/insanity.pdf
```

## בניה — LuaLaTeX

```bash
cd hebrew-lualatex-pdf
bash scripts/setup_fonts.sh
cp assets/preamble.tex docs/
cd docs && bash ../scripts/build.sh insanity.tex
cp insanity.pdf ../../output/insanity-lualatex.pdf
```
