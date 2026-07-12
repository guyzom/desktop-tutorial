#!/usr/bin/env bash
# build.sh — compile a Hebrew LuaLaTeX document and run the mandatory checks.
# Usage: bash build.sh doc.tex
#
# Compiles twice (for TOC/refs). FAILS (exit 1) on any of:
#   - the compile itself failing (lualatex non-zero, or the PDF not regenerated
#     this run — catches a crash that the old script reported as "0 errors"),
#   - missing characters (silent tofu — the #1 Hebrew-LaTeX failure mode),
#   - LaTeX errors.
# WARNS (but still exits 0, because the PDF is valid) on: hyperref PDF-string
# issues (a heading with math missing \texorpdfstring → garbled bookmark), and
# VISIBLE overfull hboxes (>5pt — text past the margin/box), listed by severity.
# After a clean build it also runs the bidi/figure check and the content-density
# heuristic (both non-failing, informational).
# A clean build is NOT the end: always inspect the PDF visually afterwards —
# the checkers are a first pass, never a substitute for viewing every page.
set -uo pipefail

# v3.22 — DETERMINISTIC BUILDS. Without this, identical input produces a
# byte-different PDF every run (embedded dates + /ID), which is exactly the
# soil the 1-in-80 page-number-reversal class grew in and makes diffing
# impossible. Measured: with SOURCE_DATE_EPOCH set, repeat compiles of a
# 28-page doc are sha256-identical — but ONLY at the aux fixed point (see the
# convergence loop below; pre-convergence passes differ deterministically).
# Override by exporting your own value; set REPRO=1 to have this script PROVE
# reproducibility (extra confirmation pass + hash compare at the fixed point).
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"

TEX="${1:?usage: bash build.sh doc.tex}"
[ -f "$TEX" ] || { echo "❌ no such file: $TEX"; exit 2; }
BASE="${TEX%.tex}"
LOG="${BASE}.log"
PDF="${BASE}.pdf"

command -v lualatex >/dev/null 2>&1 || {
  echo "❌ lualatex not found — see references/recipe.md step 0"
  echo "   (apt-get install -y texlive-luatex; then scripts/setup_fonts.sh)."
  exit 2
}

# 0) Charset pre-check (HARD gate, before wasting two compile passes).
# Catches stray/confusable codepoints — esp. Arabic ر/ي masquerading as Hebrew
# resh/yod — that compile to silent tofu. See scripts/check_charset.py.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/check_charset.py" ]; then
  if ! python3 "$SCRIPT_DIR/check_charset.py" "$TEX"; then
    echo "✗ stray codepoints (see above) — fix before building. BUILD NOT OK."
    exit 1
  fi
fi

# Remember the PDF's prior timestamp so we can prove THIS run rewrote it.
prev_mtime=0
[ -f "$PDF" ] && prev_mtime=$(stat -c %Y "$PDF" 2>/dev/null || echo 0)

# v3.23.3 — COMPILE TO THE FIXED POINT, not a fixed pass count. Measured on the
# 28-page example: from a clean state, pass 2 ships WRONG TOC page numbers
# (TOC insertion shifts content, so the .toc written by pass 2 differs from the
# one it read) — the document converges only at pass 3. We compile, then repeat
# (up to 5 passes) until two consecutive PDFs are byte-identical: that both
# guarantees correct TOC/refs AND is the reproducibility proof (hash compares
# are only meaningful at the fixed point — comparing earlier passes false-alarms).
echo "▶ pass 1 …"; lualatex -interaction=nonstopmode "$TEX" >/dev/null 2>&1; rc1=$?
rc2=$rc1
prev_hash=$(sha256sum "$PDF" 2>/dev/null | cut -d' ' -f1)
CONVERGED=0
for pass in 2 3 4 5; do
  echo "▶ pass $pass …"; lualatex -interaction=nonstopmode "$TEX" >/dev/null 2>&1; rc2=$?
  cur_hash=$(sha256sum "$PDF" 2>/dev/null | cut -d' ' -f1)
  if [ -n "$prev_hash" ] && [ "$cur_hash" = "$prev_hash" ]; then CONVERGED=1; break; fi
  prev_hash=$cur_hash
done
if [ "$CONVERGED" = "1" ]; then
  echo "✓ converged: passes $((pass-1)) and $pass byte-identical ($cur_hash)"
else
  echo "⚠ NOT CONVERGED after 5 passes — genuine nondeterminism or an unstable"
  echo "  document (e.g. a package writing changing aux data). Audit visually"
  echo "  with extra care; TOC/page references may be stale."
fi

count() { local n; n=$(grep -c "$1" "$LOG" 2>/dev/null) || true; echo "${n:-0}"; }
miss=$(count "Missing character")
errs=$(count "^!")
toks=$(count "Token not allowed")
pages=$(pdfinfo "$PDF" 2>/dev/null | grep -oP 'Pages:\s*\K\d+' || echo "?")
ovf_all=$(count "Overfull .hbox")
ovf_vis=$(grep -oE "Overfull .hbox \([0-9.]+pt too wide\)" "$LOG" 2>/dev/null | grep -oE "[0-9.]+pt" | sed 's/pt//' | awk '$1>5' | wc -l | tr -d ' ')

echo "────────────────────────────────────────"
echo "  lualatex exit (final pass): $rc2"
echo "  missing characters     : $miss   (MUST be 0)"
echo "  LaTeX errors (^!)       : $errs"
echo "  hyperref PDF warnings   : $toks   (math in a heading without \\texorpdfstring?)"
echo "  pages                   : $pages"
echo "  overfull hboxes         : ${ovf_all:-0} total, ${ovf_vis:-0} visible (>5pt)"
echo "────────────────────────────────────────"

fail=0

# 1) Did the compile actually succeed AND (re)write the PDF this run?
if [ "${rc2:-1}" -ne 0 ]; then
  echo "✗ lualatex exited non-zero ($rc2) — build FAILED. Last log lines:"
  tail -15 "$LOG" 2>/dev/null
  fail=1
fi
if [ ! -f "$PDF" ]; then
  echo "✗ no PDF produced ($PDF)."
  fail=1
else
  cur_mtime=$(stat -c %Y "$PDF" 2>/dev/null || echo 0)
  if [ "$cur_mtime" -le "$prev_mtime" ]; then
    echo "✗ $PDF was not updated this run — a pass crashed before shipout."
    fail=1
  fi
fi

# 2) Missing glyphs = silent tofu. Hard fail.
if [ "$miss" != "0" ]; then
  echo "✗ $miss missing glyph(s) — sample:"
  grep "Missing character" "$LOG" | head -3
  echo "  → usually a missing [no-math] on fontspec, a missing Latin fallback,"
  echo "    or a body font with no Hebrew. See references/recipe.md."
  fail=1
fi

# 3) Hard LaTeX errors.
if [ "$errs" != "0" ]; then
  echo "✗ LaTeX error(s):"; grep "^!" "$LOG" | head -5; fail=1
fi

# 4) Bookmark warnings: degraded but valid PDF → warn, do not fail.
if [ "$toks" != "0" ]; then
  echo "⚠ $toks hyperref PDF-string warning(s): a heading with math lacks a clean"
  echo "  \\texorpdfstring{...}{plain}. The PDF is valid but its bookmarks are garbled."
fi

# 5) Overfull hboxes = text past the margin/box. Never a hard fail (the PDF is
# valid), but VISIBLE ones (>5pt) are real friction; <3pt is a glyph touching
# the margin and is usually fine. See "חריגת שוליים" in figures-boxes-listings.md.
if [ "${ovf_vis:-0}" != "0" ]; then
  echo "⚠ ${ovf_vis} visible overfull hbox(es) (>5pt — text spills past the margin/box):"
  grep -oE "Overfull .hbox \([0-9.]+pt too wide\)( in paragraph at lines [0-9]+--[0-9]+| detected at line [0-9]+)" "$LOG" \
    | sort -t'(' -k2 -rn | head -6 | sed 's/^/    /'
  echo "  → usually a wide unbreakable LTR island. Fixes: a compact single island,"
  echo "    ONE item per line in step-boxes, an otherlanguage code column, or {\\small}"
  echo "    for a wide align*. Re-run after each fix; sub-3pt residues are acceptable."
fi

if [ "$fail" -ne 0 ]; then
  echo "✗ BUILD NOT OK — fix the above and rebuild."
  exit 1
fi

# v3.22 — RENDER GATE: inspect the compiled PDF itself (reversed Latin runs,
# flipped folio digits). This is a HARD gate — every historical bidi defect of
# this class compiled clean and passed every source-level check.
if [ -f "$SCRIPT_DIR/check_pdf_render.py" ]; then
  echo ""
  echo "▶ render check (compiled PDF):"
  if python3 -c "import fitz" 2>/dev/null; then
    if ! python3 "$SCRIPT_DIR/check_pdf_render.py" "$PDF" "$TEX"; then
      echo "✗ RENDER CHECK FAILED — the PDF contains reversed text. BUILD NOT OK."
      exit 1
    fi
  else
    echo "⚠ pymupdf missing — render check SKIPPED. Install it (it is the only"
    echo "  automated check that sees the rendered page, not the source):"
    echo "    pip install --break-system-packages pymupdf"
  fi
fi

# v3.22 — font identity: several preamble rules are FONT-SPECIFIC facts about
# Frank Ruhl Libre (no tlig -> type — directly; no italic -> FakeSlant face).
# If the body font changed, those rules are silently wrong — say so.
if ! grep -qi "FrankRuhlLibre" "$LOG" 2>/dev/null; then
  echo "⚠ Frank Ruhl Libre not found in the log — the body font differs, so the"
  echo "  font-specific rules (em-dash, FakeSlant italics) may not apply as-is."
fi

# v3.23.3 — the convergence loop above already ends with two byte-identical
# consecutive passes (that IS the reproducibility proof, taken at the fixed
# point). REPRO=1 adds one independent confirmation pass on top; a mismatch
# here means genuine run-to-run flakiness, not TOC convergence.
if [ "${REPRO:-0}" = "1" ]; then
  h1=$(sha256sum "$PDF" | cut -d' ' -f1)
  lualatex -interaction=nonstopmode "$TEX" >/dev/null 2>&1
  h2=$(sha256sum "$PDF" | cut -d' ' -f1)
  if [ "$h1" = "$h2" ]; then echo "✓ reproducible: extra pass byte-identical ($h1)"
  else echo "⚠ NOT reproducible AT THE FIXED POINT: $h1 != $h2 — genuine nondeterminism; audit visually with extra care."; fi
fi

echo "✓ clean build. Now VERIFY VISUALLY (not optional):"
echo "    pdftoppm -png -r 110 ${PDF} page   # then open the PNGs"

# Bidi / figure check — reversed Latin-in-Hebrew, wrong-way arrows, code jammed
# next to math, split $…$, etc. Non-failing (false positives exist, and the
# visual audit is the real arbiter), but issues here usually mean garbled text.
if [ -f "$SCRIPT_DIR/check_bidi_figures.py" ]; then
  echo ""
  echo "▶ bidi / figure check:"
  python3 "$SCRIPT_DIR/check_bidi_figures.py" "$TEX" || true
fi

# Content-density heuristic — non-failing. Surfaces THIN output (few numbered
# eqs/boxes per chapter, no exercises, long prose runs). See content-style.md.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/check_content_density.py" ]; then
  echo ""
  echo "▶ content-density check (heuristic; informational):"
  python3 "$SCRIPT_DIR/check_content_density.py" "$TEX" || true
fi

