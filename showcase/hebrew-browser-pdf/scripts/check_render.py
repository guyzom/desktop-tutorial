#!/usr/bin/env python3
r"""Render-gate (ROADMAP B3) — the only check that inspects the COMPILED PDF, not
the source. It catches what DOM/source checks structurally cannot: a Latin run
that renders visually reversed at the glyph level.

Mechanism (empirically grounded — see the note below): PyMuPDF returns glyphs in
VISUAL order (increasing x), so a reversed Latin word is stored as its reversed
spelling ("Datapath" -> "htapataD"). Monotonic-x therefore can't detect it; we
compare each PDF Latin run against the set of Latin tokens in the SOURCE: if a
run is not a source token but its REVERSE is, it rendered reversed. (This is the
old skill's render-gate fingerprint, rebuilt for the browser stack.)

Also checks folio monotonicity (page-number digits reversed, 18 -> 81, would
break the increasing footer sequence).

SCOPE — what this gate does NOT cover (by design): MathJax renders most math as
SVG vector PATHS with no text layer, so `get_text` extracts nothing from inside
most equations — verified, a 19-equation page with ordinary symbols yields zero
math tokens. BUT this is not universal: MathJax's SVG output falls back to a
live `<text>` element (not a path) for the "double-struck" font variant used by
`\mathbb{}` — found empirically in a downstream document using `\id`/`\R`/`\C`/
`\Z` (all `\mathbb{...}` under the hood): 73 such `<text data-variant="double-
struck">` elements, fully extractable by get_text(). One of those glyphs was a
double-struck "1" (𝟙, U+1D7D9) that happened to land in a page's bottom-10%
zone and was misread as a page-number digit by the folio check below, because
Python's `str.isdigit()` (and `.isdecimal()`) both return True for it — it's
Unicode category Nd, "decimal digit", same as ASCII 0-9. The folio check now
requires `[0-9]+` explicitly (ASCII only) to exclude this whole class of
mathematical-digit lookalikes. This does not weaken real reversed-folio
detection: genuine page-number footers are always plain ASCII digits, rendered
by CSS `counter(page)` in `direction:ltr`, never a MathJax glyph. Similarly, the
reversed-Latin check above is unaffected because `LATIN_RUN = [A-Za-z]{2,}`
already excludes non-ASCII letters, so a double-struck Latin letter (e.g. an
\mathbb{R}) was never at risk of matching it either.

Math-integrity beyond this gate's blind spot is guarded by: source linter
(hebrew-in-math-text) + determinism + visual audit — not by this gate. See
tests/fixtures/math_hebrew_in_text.tex.

Usage: python3 scripts/check_render.py <pdf> <source.html>
Exit 0 = clean, 1 = findings.
"""
import re
import sys
import fitz

LATIN_RUN = re.compile(r"[A-Za-z]{2,}")
ASCII_DIGITS = re.compile(r"^[0-9]+$")
HEBREW_WORD = re.compile(r"[\u05d0-\u05ea]{2,}")


def _visible_source_text(html_path):
    """Source HTML reduced to its VISIBLE text: comments, <style>, <script> and
    <svg> subtrees stripped (MathJax math renders as SVG whose glyphs mostly
    have no PDF text layer, so math tokens must not count as expected text)."""
    with open(html_path, encoding="utf-8") as f:
        html = f.read()
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<style\b.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<script\b.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<svg\b.*?</svg>", " ", html, flags=re.S | re.I)
    return re.sub(r"<[^>]+>", " ", html)


def source_tokens(html_path):
    return set(LATIN_RUN.findall(_visible_source_text(html_path)))


def completeness_findings(pdf_text, html_path, threshold=0.98, sample=8):
    """Content-completeness gate (v0.7.x): every visible word in the SOURCE must
    appear somewhere in the compiled PDF. paged.js has been caught silently
    DROPPING content twice now (a trailing paragraph past an overflow, and an
    entire >1-page table with everything after it) — losses that no reversal or
    folio check can see. Vocabulary comparison is layout-independent, so RTL
    visual reordering of extraction does not matter: we only ask whether each
    word occurs at all. Hebrew words (>=2 letters) + Latin runs (>=2), matched
    as substrings of the PDF text (extraction may join/split neighbours)."""
    src = _visible_source_text(html_path)
    vocab = set(HEBREW_WORD.findall(src)) | set(LATIN_RUN.findall(src))
    if not vocab:
        return []
    missing = sorted(w for w in vocab if w not in pdf_text)
    coverage = 1 - len(missing) / len(vocab)
    if coverage >= threshold:
        return []
    shown = ", ".join(repr(w) for w in missing[:sample])
    return [
        f"content loss: only {coverage:.1%} of {len(vocab)} source words found in PDF "
        f"({len(missing)} missing, e.g. {shown}) — paged.js likely dropped content"
    ]


def pdf_latin_runs(page):
    runs = []
    for b in page.get_text("rawdict")["blocks"]:
        for line in b.get("lines", []):
            for span in line.get("spans", []):
                s = "".join(c["c"] for c in span["chars"])
                runs.extend(LATIN_RUN.findall(s))
    return runs


def check(pdf_path, src_path):
    tokens = source_tokens(src_path)
    doc = fitz.open(pdf_path)
    findings = []

    # Content completeness (layout-independent vocabulary check).
    pdf_text = "".join(page.get_text() for page in doc)
    findings.extend(completeness_findings(pdf_text, src_path))

    # Reversed-Latin detection.
    for i, page in enumerate(doc):
        for run in pdf_latin_runs(page):
            if run in tokens:
                continue
            rev = run[::-1]
            if rev in tokens and rev != run:
                findings.append(f"page {i+1}: reversed Latin run {run!r} (source has {rev!r})")

    # Folio monotonicity (footer page numbers must not decrease/jump).
    folios = []
    for i, page in enumerate(doc):
        h = page.rect.height
        w = page.rect.width
        nums = []
        for b in page.get_text("dict")["blocks"]:
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    t = span["text"].strip()
                    x_mid = (span["bbox"][0] + span["bbox"][2]) / 2
                    # bottom 10% AND horizontally centered: a real folio is a
                    # centered footer; side-column digits that happen to reach
                    # the bottom zone (e.g. TOC page numbers on a full TOC
                    # page, stamped at the physical left) must not qualify.
                    if (ASCII_DIGITS.match(t) and span["bbox"][1] > h * 0.9
                            and abs(x_mid - w / 2) < 60):
                        nums.append(int(t))
        if nums:
            folios.append((i + 1, nums[-1]))
    for (pa, na), (pb, nb) in zip(folios, folios[1:]):
        if nb <= na:
            findings.append(f"page {pb}: folio {nb} not increasing after {na} (possible digit reversal)")

    return findings


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: check_render.py <pdf> <source.html>", file=sys.stderr)
        sys.exit(2)
    fs = check(sys.argv[1], sys.argv[2])
    for f in fs:
        print(f"[render-gate] {f}")
    print(f"{len(fs)} finding(s)." if fs else "render-gate clean.")
    sys.exit(1 if fs else 0)
