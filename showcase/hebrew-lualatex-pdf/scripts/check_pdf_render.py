#!/usr/bin/env python3
"""check_pdf_render.py (v3.23) — verify the RENDERED PDF, not the source.

Every hard bidi defect in this project's history (reversed Latin in TikZ
nodes, page-number digits flipping 18->81, invisible emphasis) compiled
clean, passed every source-level linter, and was only visible on the page.
This checker closes part of that gap by inspecting the compiled PDF itself.

Checks (all empirically validated against deliberately-broken fixtures):

  R1. REVERSED-LATIN-RUN — a Latin word rendered right-to-left. Fingerprint
      (measured): LuaLaTeX+bidi emits a correctly-ordered Latin run as ONE
      text span, but a reversed run (Latin inside \\h{} in a TikZ node) as
      PER-GLYPH spans whose visual left-to-right order is the mirror of the
      logical word. We group consecutive single-Latin-char words on a line,
      read them left-to-right, and flag when that visual string is reversed
      relative to a Latin token found in the source .tex (strong), or when a
      fragmented Latin run >= 4 chars exists at all (weak, still reported —
      fragmentation itself is the bug's signature).

  R2. REVERSED-WHOLE-TOKEN — a whole extracted word that is NOT a source
      token but whose reverse IS (len >= 4). Catches reversals that the
      extractor happens to emit as one word.

  R3. PAGE-NUMBER-MISMATCH — the printed arabic folio in the footer differs
      from the expected sequence. The scheme's offset is inferred from the
      majority of pages (so front matter / roman folios don't false-flag);
      an outlier that equals the DIGIT-REVERSE of the expected value (81 for
      18) is flagged loudly as the known nondeterministic bidi glitch; any
      other outlier is reported as informational.

Exit status: 1 if any R1-strong/R2/reverse-folio hit; 0 otherwise.
This is a REQUIRED gate after build.sh, but it still does not see content
correctness or layout aesthetics — the visual audit of rendered pages and
the source cross-check (SKILL.md step 4) remain mandatory.

Usage:
    python3 check_pdf_render.py doc.pdf [doc.tex]
Requires: pymupdf  (pip install --break-system-packages pymupdf)
"""
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    print("check_pdf_render: pymupdf not installed — run:")
    print("  pip install --break-system-packages pymupdf")
    sys.exit(2)

LATIN1 = re.compile(r'^[A-Za-z]$')
LATINWORD = re.compile(r'^[A-Za-z][A-Za-z\-]{2,}$')
FOOTER_FRAC = 0.90          # words below 90% of page height = footer zone
MIN_RUN = 3                 # fragmented-run minimum length to consider
PALINDROME_SAFE = True      # skip palindromes (reverse == itself)


def source_latin_tokens(tex_path):
    """Latin tokens (len>=3) from the .tex source, comments and command
    names stripped. Lowercased set."""
    try:
        text = open(tex_path, encoding="utf-8", errors="replace").read()
    except OSError:
        return set()
    lines = [re.sub(r"(?<!\\)%.*$", "", ln) for ln in text.splitlines()]
    text = "\n".join(lines)
    text = re.sub(r"\\[A-Za-z@]+", " ", text)        # drop \commands
    toks = set(t.lower() for t in re.findall(r"[A-Za-z][A-Za-z\-]{2,}", text))
    return toks


def line_key(w):
    """Cluster words into visual lines by their vertical midpoint."""
    return round((w[1] + w[3]) / 2.0, 1)


def fragmented_runs(words):
    """Group consecutive single-Latin-char 'words' sharing a line into runs;
    yield (visual_string_left_to_right, page_y) for runs >= MIN_RUN."""
    singles = [w for w in words if LATIN1.match(w[4])]
    by_line = {}
    for w in singles:
        by_line.setdefault(line_key(w), []).append(w)
    for y, ws in by_line.items():
        ws.sort(key=lambda w: w[0])
        # split on horizontal gaps > 2.5x median glyph width
        widths = [w[2] - w[0] for w in ws] or [1]
        med = sorted(widths)[len(widths) // 2] or 1
        run = [ws[0]]
        for prev, cur in zip(ws, ws[1:]):
            if cur[0] - prev[2] > 2.5 * med:
                if len(run) >= MIN_RUN:
                    yield "".join(w[4] for w in run), y
                run = [cur]
            else:
                run.append(cur)
        if len(run) >= MIN_RUN:
            yield "".join(w[4] for w in run), y


def check(pdf_path, tex_path=None):
    doc = fitz.open(pdf_path)
    src = source_latin_tokens(tex_path) if tex_path else set()
    hard, soft = [], []

    folios = []  # (page_index0, printed_int)
    for pno, page in enumerate(doc):
        words = page.get_text("words")

        # --- R1: fragmented (per-glyph) Latin runs
        for vis, _y in fragmented_runs(words):
            rev = vis[::-1]
            if PALINDROME_SAFE and vis.lower() == rev.lower():
                continue
            if src and rev.lower() in src and vis.lower() not in src:
                hard.append((pno + 1, "REVERSED-LATIN-RUN",
                             f"renders '{vis}' (should be '{rev}')"))
            elif len(vis) >= 4:
                soft.append((pno + 1, "FRAGMENTED-LATIN-RUN",
                             f"per-glyph Latin run '{vis}' — likely reversed "
                             f"(reads '{rev}' logically)"))

        # --- R2: whole-token reversals
        if src:
            for w in words:
                t = w[4].strip(".,;:()[]")
                if LATINWORD.match(t) and len(t) >= 4:
                    tl, rl = t.lower(), t[::-1].lower()
                    if tl not in src and rl in src and tl != rl:
                        hard.append((pno + 1, "REVERSED-WHOLE-TOKEN",
                                     f"renders '{t}' (source has '{t[::-1]}')"))

        # --- collect footer folios for R3
        h = page.rect.height
        cands = [w[4] for w in words
                 if (w[1] + w[3]) / 2.0 > FOOTER_FRAC * h and w[4].isdigit()]
        if len(cands) == 1:
            folios.append((pno, int(cands[0])))

    # --- R3: folio sequence
    if len(folios) >= 3:
        offsets = [printed - idx for idx, printed in folios]
        # sorted() -> deterministic tie-break (max over a raw set breaks ties
        # by opaque iteration order — a nondeterminism inside the determinism gate)
        common = max(sorted(set(offsets)), key=offsets.count)
        if offsets.count(common) >= max(3, len(folios) // 2):
            for (idx, printed), off in zip(folios, offsets):
                if off == common:
                    continue
                expected = idx + common
                if str(printed) == str(expected)[::-1] and printed != expected:
                    hard.append((idx + 1, "PAGE-NUMBER-REVERSED",
                                 f"footer prints {printed}, expected {expected} "
                                 f"(digit-reversal — the known bidi glitch)"))
                else:
                    soft.append((idx + 1, "PAGE-NUMBER-ODD",
                                 f"footer prints {printed}, expected {expected}"))

    for pg, code, msg in hard:
        print(f"  ✗ p.{pg} [{code}] {msg}")
    for pg, code, msg in soft:
        print(f"  ⚠ p.{pg} [{code}] {msg}")
    if not hard and not soft:
        print(f"  ✓ render check clean ({len(doc)} pages: no reversed Latin "
              f"runs, folio sequence consistent)")
    return 1 if hard else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    pdf = sys.argv[1]
    tex = sys.argv[2] if len(sys.argv) > 2 else None
    sys.exit(check(pdf, tex))
