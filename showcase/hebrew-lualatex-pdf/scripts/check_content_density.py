#!/usr/bin/env python3
"""check_content_density.py (v3.23)

A heuristic guard on content BALANCE, pushing both ways:
  * against THIN output — sparse content: long prose chapters, few numbered
    equations, no boxes, no exercises; and
  * against OVER-BOXED output — most of the page stuffed into colored boxes
    instead of free prose / standalone numbered equations / gray tables. A
    balanced לקט keeps only ~1/3 of its content in colored boxes (content-style
    §4); the gray tablebox is a neutral data frame and is NOT counted as a box.

This is NOT a hard gate. It prints INFO + WARN lines so the author notices when a
draft has drifted — too sparse OR too boxy. Tune thresholds to the document type.

Usage:
    python3 check_content_density.py doc.tex [doc2.tex ...]
"""
import re
import sys

# Targets calibrated on two real reference documents: a ~100-page Hebrew study
# anthology (prose + derivations, many numbered equations) and a 37-chapter
# computer-architecture formula sheet (formulas carried in tables/boxes). Both are
# dense on TOTAL structure (>2 mapped elements/chapter) though they differ wildly
# in numbered-equation count — hence the structure-based threshold below.
# "Thin" is measured on TOTAL mapped structure, not numbered equations alone — a
# formula sheet / reference card legitimately carries its formulas in tables and
# boxes, so counting only \begin{equation} would false-flag it as thin (it did:
# the 37-chapter reference formula sheet scores 0.46 numbered-eq/ch but 2.7 mapped
# elements/ch — dense). Count equations + tables + boxes together.
STRUCT_PER_CHAPTER_MIN = 1.2  # < ~1.2 (numbered eqs + tables + boxes)/chapter = thin
MAX_PROSE_PARAS_RUN = 4       # 4+ consecutive prose paras = WARN (guideline is 3;
                              # warn at 4 to avoid flagging legit intro/foundation
                              # chapters that are prose-heavy by design)
CHAPTERS_FOR_EXERCISE = 8     # docs with >= this many chapters should have exercises
# Balance guard — the checker must push BOTH ways (thin AND over-boxed):
BOX_CONTENT_FRAC_MAX = 0.55   # >55% of body content inside colored boxes = over-boxed
                              # (a well-balanced לקט is ~1/3; see content-style §4)


def strip_comments(text: str) -> str:
    out = []
    for line in text.splitlines():
        # drop unescaped % to end of line
        out.append(re.sub(r"(?<!\\)%.*$", "", line))
    return "\n".join(out)


def box_balance(text: str):
    """Fraction of body content lines that sit INSIDE colored boxes. The gray
    tablebox is intentionally NOT counted — it is a neutral data frame, not a
    colored semantic box. See content-style §4.
    (A back-to-back box-CHAIN count was tried and dropped: on the reference doc
    it false-flagged legitimate patterns — a theorem→example→note unit and a
    series of exercise boxes — so it is not a reliable automated signal.)"""
    starts = re.compile(r"\\begin\{(defbox|thmbox|notebox|exbox|warnbox|keybox)\}")
    ends = re.compile(r"\\end\{(defbox|thmbox|notebox|exbox|warnbox|keybox)\}")
    depth = inbox = total = 0
    for line in text.split("\n"):
        s = line.strip()
        if starts.search(line):
            depth += 1
            continue
        if ends.search(line):
            depth -= 1
            continue
        if s:  # comments already stripped -> blank
            total += 1
            if depth > 0:
                inbox += 1
    return inbox / total if total else 0.0


def main(paths):
    text = ""
    for p in paths:
        try:
            with open(p, encoding="utf-8") as f:
                text += "\n" + f.read()
        except OSError as e:
            print(f"WARN: cannot read {p}: {e}")
    text = strip_comments(text)

    chapters = len(re.findall(r"\\chapter\b", text))
    # numbered equations only (equation / align, not starred / not display \[ \])
    numbered_eq = len(re.findall(r"\\begin\{(equation|align|gather|multline)\}", text))
    tables = len(re.findall(r"\\begin\{tablebox\}", text))
    boxes = len(re.findall(r"\\begin\{(defbox|thmbox|notebox|exbox|warnbox|keybox)\}", text))
    exercises = len(re.findall(r"\\begin\{exbox\}\[frametitle=\{?\s*תרגיל", text))
    parts = len(re.findall(r"\\part\b", text))

    warns = []

    if chapters == 0:
        print("INFO: no \\chapter found — short/article doc; density checks skipped.")
    else:
        eq_ratio = numbered_eq / chapters
        tbl_ratio = tables / chapters
        box_ratio = boxes / chapters
        struct_ratio = (numbered_eq + tables + boxes) / chapters
        print(f"INFO: {parts} parts, {chapters} chapters, {numbered_eq} numbered "
              f"equations ({eq_ratio:.2f}/ch), {tables} tables ({tbl_ratio:.2f}/ch), "
              f"{boxes} boxes ({box_ratio:.2f}/ch), {exercises} exercises.")
        print(f"INFO: {struct_ratio:.2f} mapped structural elements per chapter "
              f"(equations + tables + boxes; thin below {STRUCT_PER_CHAPTER_MIN}).")
        if struct_ratio < STRUCT_PER_CHAPTER_MIN:
            warns.append(f"THIN: only {struct_ratio:.2f} mapped elements/chapter "
                         f"(numbered eqs + tables + boxes; target ≥{STRUCT_PER_CHAPTER_MIN}). "
                         f"The draft leans on prose — map more claims to numbered "
                         f"equations, tables, or boxes.")
        if chapters >= CHAPTERS_FOR_EXERCISE and exercises == 0:
            warns.append(f"DENSITY: {chapters} chapters but 0 worked exercises. A "
                         f"study guide should have a solved-exercises Part "
                         f"(exbox titled 'תרגיל N --- ...').")

    # Balance: OVER-boxing is as real a failure as thin content (content-style §4).
    # Runs for every doc type (article too), independent of chapter count.
    box_frac = box_balance(text)
    print(f"INFO: {100*box_frac:.0f}% of body content sits inside colored boxes "
          f"(balanced ≈ 33%; the rest = free prose / numbered eqs / gray tables).")
    if box_frac > BOX_CONTENT_FRAC_MAX:
        warns.append(f"OVER-BOX: {100*box_frac:.0f}% of content is in colored boxes "
                     f"(>{100*BOX_CONTENT_FRAC_MAX:.0f}%). Boxes are for emphasis, not the "
                     f"default — move discussion into prose and keep key formulas as "
                     f"standalone numbered equations. See content-style §4.")

    # consecutive-prose-paragraph runs, scanned per chapter body
    chunks = re.split(r"\\chapter\b", text)[1:]  # drop preamble/front
    structural = re.compile(
        r"\\begin\{(equation|align|gather|multline|defbox|thmbox|notebox|exbox|"
        r"warnbox|keybox|enumerate|itemize|qcirc|tikzpic|center)\}|\\\[|\$\$|"
        r"\\section\b|\\subsection\b")
    for ci, chunk in enumerate(chunks, 1):
        paras = re.split(r"\n\s*\n", chunk)
        run = 0
        worst = 0
        for para in paras:
            if para.strip() and not structural.search(para):
                run += 1
                worst = max(worst, run)
            else:
                run = 0
        if worst >= MAX_PROSE_PARAS_RUN:
            warns.append(f"RHYTHM: chapter #{ci} has a run of {worst} consecutive "
                         f"prose paragraphs with no equation/box/list — likely "
                         f"under-formalized; break it with numbered eqs or a box.")

    if warns:
        print("\n--- CONTENT WARNINGS (heuristic; not a hard failure) ---")
        for w in warns:
            print("  • " + w)
        print("See references/content-style.md for the density spec and exemplars.")
    else:
        print("OK: content density within target range.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    main(sys.argv[1:])
