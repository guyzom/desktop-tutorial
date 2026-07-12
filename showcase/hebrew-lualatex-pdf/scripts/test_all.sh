#!/usr/bin/env bash
# test_all.sh (v3.23.7) — the skill's regression harness. ONE command that proves:
#   T1. the linters fire on every known bug class (tests/lint_positives.tex ->
#       every flag in tests/expected_flags.txt) and stay silent on correct
#       patterns (tests/lint_negatives.tex),
#   T2. the charset gate rejects confusable codepoints and passes clean text,
#   T3. all bundled example documents build clean end-to-end via build.sh
#       (which now includes the render gate),
#   T4. the render checker catches a deliberately-reversed TikZ token
#       (tests/render_broken.tex) and is quiet on a clean document,
#   T5. builds are reproducible (two compiles -> identical sha256).
#
# Run it after ANY change to the preamble, a checker, or an example file —
# a checker without a test that proves it fires is an assertion, not a check
# (the v3.19 box-chain checker was dropped for exactly this reason).
#
# Usage:  bash scripts/test_all.sh            # full run (compiles everything)
#         FAST=1 bash scripts/test_all.sh     # skip the big example compiles
set -uo pipefail
cd "$(dirname "$0")/.."          # skill root
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1700000000}"
PASS=0; FAIL=0
ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo "═══ T1: lint golden tests ═══"
POS_OUT=$(python3 scripts/check_bidi_figures.py tests/lint_positives.tex 2>&1 || true)
while read -r flag; do
  [ -z "$flag" ] && continue
  if grep -q "\[$flag\]" <<< "$POS_OUT"; then ok "fires: $flag"
  else bad "MISSING flag on positive fixture: $flag"; fi
done < tests/expected_flags.txt
NEG_HITS=$(python3 scripts/check_bidi_figures.py tests/lint_negatives.tex 2>&1 | grep -c '^tests/.*\[' || true)
if [ "${NEG_HITS:-0}" = "0" ]; then ok "silent on negatives"
else bad "$NEG_HITS false positive(s) on lint_negatives.tex"; fi

echo "═══ T1b: checker selftest corpus (78 cases) ═══"
if python3 scripts/selftest.py >/dev/null 2>&1; then ok "selftest corpus passes"
else bad "selftest corpus DRIFTED (run: python3 scripts/selftest.py)"; fi

echo "═══ T2: charset gate ═══"
if python3 scripts/check_charset.py tests/charset_positive.tex >/dev/null 2>&1; then
  bad "charset gate PASSED a confusable Arabic codepoint"
else ok "rejects confusable codepoints"; fi
if python3 scripts/check_charset.py tests/lint_negatives.tex >/dev/null 2>&1; then
  ok "passes clean Hebrew text"
else bad "charset gate false-positive on clean text"; fi

if [ "${FAST:-0}" != "1" ]; then
  echo "═══ T3: example documents build clean (incl. render gate) ═══"
  for f in example_math example_figures example_tables example_boxes example_topicrail; do
    if (cd assets && bash ../scripts/build.sh "$f.tex" >/dev/null 2>&1); then
      ok "builds clean: $f"
    else bad "BUILD FAILED: $f (run: cd assets && bash ../scripts/build.sh $f.tex)"; fi
  done
fi

echo "═══ T4: render checker (compiled-PDF gate) ═══"
if python3 -c "import fitz" 2>/dev/null; then
  (cd tests && lualatex -interaction=nonstopmode render_broken.tex >/dev/null 2>&1)
  if [ -f tests/render_broken.pdf ]; then
    if python3 scripts/check_pdf_render.py tests/render_broken.pdf tests/render_broken.tex >/dev/null 2>&1; then
      bad "render checker MISSED the reversed TikZ token"
    else ok "catches reversed Latin in the rendered PDF"; fi
  else bad "render_broken.tex did not compile"; fi
  if [ -f assets/example_figures.pdf ]; then
    if python3 scripts/check_pdf_render.py assets/example_figures.pdf assets/example_figures.tex >/dev/null 2>&1; then
      ok "quiet on a clean rendered PDF"
    else bad "render checker false-positive on example_figures"; fi
  fi
else
  bad "pymupdf missing — render tests skipped (pip install --break-system-packages pymupdf)"
fi

if [ "${FAST:-0}" != "1" ]; then
  echo "═══ T5: reproducibility ═══"
  (cd assets && lualatex -interaction=nonstopmode example_math.tex >/dev/null 2>&1)
  H1=$(sha256sum assets/example_math.pdf | cut -d' ' -f1)
  (cd assets && lualatex -interaction=nonstopmode example_math.tex >/dev/null 2>&1)
  H2=$(sha256sum assets/example_math.pdf | cut -d' ' -f1)
  if [ "$H1" = "$H2" ]; then ok "two builds byte-identical"
  else bad "builds NOT reproducible ($H1 != $H2)"; fi
fi

echo "────────────────────────────────"
echo "  $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && { echo "✓ ALL TESTS PASS"; exit 0; } || { echo "✗ HARNESS FAILED"; exit 1; }
