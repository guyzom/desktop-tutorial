#!/usr/bin/env bash
# Regression harness (ROADMAP D1). A change is not "real" until this is green.
# Runs: checker corpus, source lint, every example render, and a determinism
# check (render flagship twice -> normalize -> byte-compare). Mirrors the old
# skill's test_all.sh discipline for the browser stack.
#
# Usage:  bash scripts/test_all.sh          (from the skill root)
#         FAST=1 bash scripts/test_all.sh   (skip the multi-page flagship + determinism)
set -u
cd "$(dirname "$0")/.."
ROOT=$(pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
fail=0
pass=0
step() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
ok()   { pass=$((pass+1)); printf '  \033[32mPASS\033[0m %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf '  \033[31mFAIL\033[0m %s\n' "$1"; }

step "T0 · data-driven CSS in sync (config/*.json -> base.css)"
before=$(sha256sum assets/css/base.css | cut -d' ' -f1)
node scripts/gen-css.mjs >/dev/null 2>&1
after=$(sha256sum assets/css/base.css | cut -d' ' -f1)
if [ "$before" = "$after" ]; then ok "gen-css idempotent (base.css == config)"; else bad "base.css out of sync with config — run scripts/gen-css.mjs and commit"; fi

step "T1 · checker corpora"
if node tests/check_bidi.test.mjs >/dev/null 2>&1; then ok "check_bidi corpus"; else bad "check_bidi corpus"; fi
if node tests/check_charset.test.mjs >/dev/null 2>&1; then ok "check_charset corpus"; else bad "check_charset corpus"; fi
if node tests/mathjax_render.test.mjs >/dev/null 2>&1; then ok "mathjax_render corpus (fail-loud: bad TeX throws, valid renders)"; else bad "mathjax_render corpus"; fi

step "T2 · source gates (every example .mjs clean: bidi + charset)"
for f in examples/*.mjs; do
  [ -e "$f" ] || continue
  if node scripts/check_bidi.mjs "$f" >/dev/null 2>&1; then ok "bidi $f"; else bad "bidi $f (hebrew-in-math-text)"; fi
  if node scripts/check_charset.mjs "$f" >/dev/null 2>&1; then ok "charset $f"; else bad "charset $f (confusable/tofu codepoint)"; fi
done
# The one math-order risk (Hebrew in \text) is caught at the SOURCE layer, since
# the render-gate is blind to vector math (see check_render.py SCOPE note).
if node scripts/check_bidi.mjs tests/fixtures/math_hebrew_in_text.tex >/dev/null 2>&1; then
  bad "check_bidi did NOT fire on Hebrew-in-\\text math fixture"
else ok "check_bidi fires on Hebrew-in-\\text math fixture (source guard for math)"; fi

step "T2b · render fail-loud (nonzero exit on a page error, zero on a clean page)"
# The render CLI must surface a compromised page to ANY caller via its exit code,
# not just to this harness's stderr grep.
if node src/render.mjs tests/fixtures/page_error.html "$TMP/pe.pdf" >/dev/null 2>&1; then
  bad "render exited 0 on a page with a JS error (should be nonzero)"
else ok "render exits nonzero on a page error"; fi
if node src/render.mjs examples/boxes.html "$TMP/pe_ok.pdf" >/dev/null 2>&1; then
  ok "render exits zero on a clean page"
else bad "render exited nonzero on a clean page (false positive)"; fi

step "T3 · example renders (build HTML + print to PDF, no page errors)"
# generator .mjs -> .html
for g in spikes/spike1_math.mjs spikes/spike2_build.mjs examples/math_labels.mjs \
         examples/boxes.mjs examples/tables.mjs examples/listings.mjs examples/diagrams.mjs \
         examples/typography.mjs; do
  [ -e "$g" ] || continue
  node "$g" >/dev/null 2>&1 || bad "generate $g"
done
render() { # <html> <pdf> [--pagedjs]
  out=$(node src/render.mjs "$1" "$TMP/$2" ${3:-} 2>&1)
  if printf '%s' "$out" | grep -qi 'page errors'; then bad "render $1 (page errors)"; else ok "render $1"; fi
}
render spikes/spike1_math.html s1.pdf
render examples/math_labels.html mlabels.pdf
render examples/boxes.html boxes.pdf
render examples/tables.html tables.pdf
render examples/listings.html listings.pdf
render examples/diagrams.html diagrams.pdf
render examples/typography.html typography.pdf

step "T3b · render-gate (fires on a known-bad, silent on known-good)"
node src/render.mjs tests/fixtures/render_bad.html "$TMP/bad.pdf" >/dev/null 2>&1
if python3 scripts/check_render.py "$TMP/bad.pdf" tests/fixtures/render_bad.html >/dev/null 2>&1; then
  bad "render-gate did NOT fire on the known-bad fixture"
else ok "render-gate fires on known-bad (reversed Latin)"; fi
gate_silent() { # <pdf> <src>
  if python3 scripts/check_render.py "$1" "$2" >/dev/null 2>&1; then ok "render-gate silent on $2"; else bad "render-gate false-positive on $2"; fi
}
gate_silent "$TMP/boxes.pdf" examples/boxes.html
gate_silent "$TMP/tables.pdf" examples/tables.html
gate_silent "$TMP/diagrams.pdf" examples/diagrams.html
gate_silent "$TMP/typography.pdf" examples/typography.html
gate_silent "$TMP/s1.pdf" spikes/spike1_math.html    # math-heavy page: gate is blind to vector math, must not false-positive
# Regression (v0.4.9): a \mathbb{} glyph renders as live SVG <text> (double-struck
# 𝟙, Unicode Nd) — if it lands in the bottom-10% zone it must NOT be misread as a
# folio digit (the old str.isdigit() check false-positived on exactly this).
if node src/render.mjs tests/fixtures/render_ok_mathbb_footer.html "$TMP/mathbb.pdf" --pagedjs >/dev/null 2>&1; then
  gate_silent "$TMP/mathbb.pdf" tests/fixtures/render_ok_mathbb_footer.html
else bad "render tests/fixtures/render_ok_mathbb_footer.html (page errors)"; fi
# Regression (v0.8.0): a 60-row tableBox({tall:true}) plus a trailing paragraph
# must survive the DEFAULT (plain-Chromium) pipeline completely — the armed
# completeness check inside check_render.py is what verifies nothing was
# dropped (paged.js, now quarantined, lost 42-60 of these rows).
if node src/render.mjs tests/fixtures/render_ok_tall_table.html "$TMP/tall.pdf" >/dev/null 2>&1; then
  gate_silent "$TMP/tall.pdf" tests/fixtures/render_ok_tall_table.html
else bad "render tests/fixtures/render_ok_tall_table.html (page errors)"; fi

step "T3c · DOM structural check (flow-arrow: fires on bad, silent on good)"
if node scripts/check_dom.mjs tests/fixtures/dom_bad.html >/dev/null 2>&1; then
  bad "dom-check did NOT fire on the known-bad (rightward arrow in RTL)"
else ok "dom-check fires on known-bad (flow-arrow-rtl)"; fi
if node scripts/check_dom.mjs tests/fixtures/dom_ok.html examples/boxes.html examples/tables.html >/dev/null 2>&1; then
  ok "dom-check silent on known-good (incl. CSS-handled island/paren cases)"
else bad "dom-check false-positive on known-good"; fi

step "T6 · bidi fuzz corpus (island × separator × context, all gates clean)"
# Enumerate the cross product and prove the whole matrix is free of the reorder,
# reversal, and page-error classes — the "catalogue is a floor, not a ceiling"
# mechanism, doubling as a Chromium canary (deterministic corpus).
# Generated into spikes/ (gitignored) so its ../assets/css/base.css resolves
# under the repo root exactly as the committed examples do.
node scripts/fuzz_bidi.mjs >/dev/null 2>&1 || bad "generate fuzz corpus"
if node src/render.mjs spikes/fuzz_bidi.html "$TMP/fuzz.pdf" >/dev/null 2>&1; then ok "fuzz corpus renders (no page errors)"; else bad "fuzz corpus render (page errors)"; fi
# Reading-order oracle: fires on a reversed known-bad, silent on the corpus.
node src/render.mjs tests/fixtures/fuzz_bad.html "$TMP/fuzz_bad.pdf" >/dev/null 2>&1
if python3 scripts/check_fuzz.py "$TMP/fuzz_bad.pdf" tests/fixtures/fuzz_bad.html >/dev/null 2>&1; then
  bad "check_fuzz did NOT fire on the reversed known-bad fixture"
else ok "check_fuzz fires on known-bad (reversed island order)"; fi
if python3 scripts/check_fuzz.py "$TMP/fuzz.pdf" spikes/fuzz_bidi.html >/dev/null 2>&1; then ok "check_fuzz silent on corpus (first island rightmost across matrix)"; else bad "check_fuzz reading-order violation in corpus"; fi
if python3 scripts/check_render.py "$TMP/fuzz.pdf" spikes/fuzz_bidi.html >/dev/null 2>&1; then ok "render-gate silent on corpus (no letter-reversal)"; else bad "render-gate finding in fuzz corpus"; fi
if node scripts/check_dom.mjs spikes/fuzz_bidi.html >/dev/null 2>&1; then ok "dom-check silent on corpus (no isolation/arrow violation)"; else bad "dom-check finding in fuzz corpus"; fi

if [ "${FAST:-0}" != "1" ]; then
  step "T4 · flagship multi-page (plain-Chromium default pipeline)"
  node examples/flagship.mjs >/dev/null 2>&1 || bad "generate flagship"
  render examples/flagship.html flagship.pdf
  gate_silent "$TMP/flagship.pdf" examples/flagship.html   # armed completeness: nothing dropped

  step "T5 · determinism (render twice -> stamp chrome -> normalize -> byte-identical)"
  node src/render.mjs examples/flagship.html "$TMP/d1.pdf" >/dev/null 2>&1
  node src/render.mjs examples/flagship.html "$TMP/d2.pdf" >/dev/null 2>&1
  if [ ! -s "$TMP/d1.pdf" ] || [ ! -s "$TMP/d2.pdf" ]; then
    bad "determinism renders missing (a silent-pass bug used to hide exactly this)"
  else
    python3 scripts/stamp_chrome.py "$TMP/d1.pdf" examples/flagship.html >/dev/null 2>&1
    python3 scripts/stamp_chrome.py "$TMP/d2.pdf" examples/flagship.html >/dev/null 2>&1
    python3 scripts/normalize_pdf.py "$TMP/d1.pdf" >/dev/null 2>&1
    python3 scripts/normalize_pdf.py "$TMP/d2.pdf" >/dev/null 2>&1
    if [ "$(sha256sum <"$TMP/d1.pdf")" = "$(sha256sum <"$TMP/d2.pdf")" ]; then
      ok "flagship byte-identical after normalization"
    else bad "flagship non-deterministic"; fi
  fi
fi

printf '\n\033[1m%d passed, %d failed\033[0m\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
