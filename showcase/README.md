# Showcase — מבנה המחשב הקוונטי

מסמך ראווה צפוף (~19 עמודים) שנבנה עם הסקיל **hebrew-browser-pdf** v0.9.9.

## מה בפנים

- RTL עברית + איי LTR (`en` / `code`)
- מתמטיקה וקטורית (MathJax SVG) + תוויות עבריות ב־HTML overlay
- קופסאות: def / thm / key / result / warn / note / ex / steps
- טבלאות (נתונים, מילון, truth table עם LTR)
- listings עם מספרי שורות (asm + Python)
- דיאגרמות בלוקים, עץ החלטה, מעגלי בל/טלפורטציה, גרף קו
- משוואות ממוספרות + הפניות, הערות שוליים, רשימות א,ב,ג
- 5 חלקים + תרגילים פתורים

## בניה

```bash
cd hebrew-browser-pdf
npm install
pip install --break-system-packages pymupdf pikepdf
node docs/insanity.mjs
node src/render.mjs docs/insanity.html ../../output/insanity.pdf
python3 scripts/normalize_pdf.py ../../output/insanity.pdf
```

הפלט: `showcase/output/insanity.pdf`
