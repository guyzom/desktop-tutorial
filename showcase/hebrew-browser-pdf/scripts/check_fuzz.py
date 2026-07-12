#!/usr/bin/env python3
"""Reading-order oracle for the bidi fuzz corpus (ROADMAP B5).

For each fuzz case the generator (scripts/fuzz_bidi.mjs) declares two unique
Latin islands, `data-a` (first in logical/reading order) and `data-b` (second),
inside RTL Hebrew text. Each island is `.en` (`unicode-bidi: isolate`), so to the
RTL paragraph it is an independent object; the objects lay out right-to-left, and
the correct reading is recovered by scanning RTL: island A (first) sits to the
RIGHT of island B (larger x). If isolation broke and the two islands instead
coalesced into one left-to-right group (the LaTeX `adjacent-ltr-islands` bug), A
would fall to the LEFT of B and this gate fires.

(This "first-island-rightmost" invariant was established empirically before it
was trusted: with `.en` isolation active it holds uniformly across pure-Latin,
digit-suffixed, and multi-island cases. It is NOT the naive "coalesce to LTR"
model — a subtlety worth stating, since an island's own content can otherwise
change its x-order once isolation is removed. See HISTORY.md.)

Islands are located by their unique token in the per-glyph stream (PyMuPDF
`rawdict`, the same visual-order glyph source the render-gate uses), so Hebrew
extraction scrambling never touches the measurement.

Cases whose two islands did not land on the same visual line (line wrap) are
SKIPPED, not failed — wrapping is a layout artifact, not a bidi defect. The count
of skips is reported so silent truncation of coverage is visible.

Usage: python3 scripts/check_fuzz.py <pdf> <corpus.html>
Exit 0 = clean, 1 = findings.
"""
import re
import sys
import fitz

TOKEN_RUN = re.compile(r"[A-Za-z0-9]{2,}")
CASE_RE = re.compile(
    r'data-a="([^"]+)" data-b="([^"]+)"'
    r' data-atype="([^"]+)" data-btype="([^"]+)"'
    r' data-sep="([^"]+)" data-ctx="([^"]+)"'
)
SAME_LINE_TOL = 4.0  # pt; two islands on one line share a baseline within this


def parse_cases(html_path):
    html = open(html_path, encoding="utf-8").read()
    return [
        dict(a=m[0], b=m[1], atype=m[2], btype=m[3], sep=m[4], ctx=m[5])
        for m in CASE_RE.findall(html)
    ]


def token_positions(pdf_path):
    """First (x0, y0) of every unique Latin/digit run, reconstructed from the
    per-glyph stream so the coordinate is the run's true left edge."""
    pos = {}
    doc = fitz.open(pdf_path)
    for page in doc:
        for b in page.get_text("rawdict")["blocks"]:
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    run, x0, y0 = "", None, None
                    for c in span["chars"]:
                        ch = c["c"]
                        if ch.isascii() and (ch.isalpha() or ch.isdigit()):
                            if not run:
                                x0, y0 = c["bbox"][0], c["bbox"][1]
                            run += ch
                        else:
                            if len(run) >= 2 and run not in pos:
                                pos[run] = (x0, y0)
                            run, x0, y0 = "", None, None
                    if len(run) >= 2 and run not in pos:
                        pos[run] = (x0, y0)
    return pos


def check(pdf_path, html_path):
    cases = parse_cases(html_path)
    pos = token_positions(pdf_path)
    findings, skipped, checked = [], 0, 0

    for c in cases:
        pa, pb = pos.get(c["a"]), pos.get(c["b"])
        tag = f'ctx={c["ctx"]} pair={c["atype"]}/{c["btype"]} sep={c["sep"]}'
        if pa is None or pb is None:
            findings.append(f"{tag}: island(s) not found in PDF ({c['a']!r}/{c['b']!r})")
            continue
        (xa, ya), (xb, yb) = pa, pb
        if abs(ya - yb) > SAME_LINE_TOL:
            skipped += 1  # islands wrapped to different lines — not a bidi defect
            continue
        checked += 1
        # Isolated islands => A (first logical) must be RIGHT of B (larger x).
        if not xa > xb:
            findings.append(
                f"{tag}: reading-order violation — island A {c['a']!r} (x={xa:.0f}) "
                f"is not right of island B {c['b']!r} (x={xb:.0f})"
            )

    return findings, checked, skipped, len(cases)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: check_fuzz.py <pdf> <corpus.html>", file=sys.stderr)
        sys.exit(2)
    fs, checked, skipped, total = check(sys.argv[1], sys.argv[2])
    for f in fs:
        print(f"[fuzz] {f}")
    print(
        f"{len(fs)} finding(s) — {checked}/{total} cases order-checked, "
        f"{skipped} skipped (line-wrapped)."
        if fs else
        f"fuzz clean — {checked}/{total} cases order-checked, {skipped} skipped (line-wrapped)."
    )
    sys.exit(1 if fs else 0)
