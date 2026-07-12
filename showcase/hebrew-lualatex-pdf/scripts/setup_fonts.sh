#!/usr/bin/env bash
# Fetch and install Hebrew fonts (Frank Ruhl Libre + Heebo) for the Hebrew
# academic-PDF pipelines (LuaLaTeX and the HTML route). Idempotent; safe to re-run.
set -euo pipefail

FONTDIR="${HOME}/.fonts"
mkdir -p "$FONTDIR"

# If already installed, just report and exit.
if ls "$FONTDIR"/FrankRuhlLibre-Regular.ttf >/dev/null 2>&1 \
   && ls "$FONTDIR"/Heebo-Regular.ttf >/dev/null 2>&1; then
  echo "Hebrew fonts already installed in $FONTDIR:"
  ls "$FONTDIR"/*.ttf
  exit 0
fi

WORK="$(mktemp -d)"
cd "$WORK"

echo "Fetching fonts from npm (fontsource)…"
npm pack @fontsource/frank-ruhl-libre @fontsource/heebo >/dev/null 2>&1
for t in *.tgz; do tar xzf "$t"; done

echo "Converting woff2 → ttf…"
pip install --quiet --break-system-packages fonttools brotli >/dev/null 2>&1 || true

python3 - "$FONTDIR" <<'PY'
import sys, os, glob
from fontTools.ttLib import TTFont
home = sys.argv[1]
base = "package/files"
want = [
    ("frank-ruhl-libre-hebrew-400-normal", "FrankRuhlLibre-Regular"),
    ("frank-ruhl-libre-hebrew-500-normal", "FrankRuhlLibre-Medium"),
    ("frank-ruhl-libre-hebrew-700-normal", "FrankRuhlLibre-Bold"),
    ("heebo-hebrew-400-normal",            "Heebo-Regular"),
    ("heebo-hebrew-700-normal",            "Heebo-Bold"),
]
for src, dst in want:
    p = os.path.join(base, src + ".woff2")
    if not os.path.exists(p):
        # fontsource layout sometimes nests differently; search for it
        hits = glob.glob(f"**/{src}.woff2", recursive=True)
        if not hits:
            print("  MISSING", src); continue
        p = hits[0]
    f = TTFont(p); f.flavor = None
    out = os.path.join(home, dst + ".ttf")
    f.save(out)
    print("  saved", out)
PY

fc-cache -f "$FONTDIR" >/dev/null 2>&1 || true
cd / && rm -rf "$WORK"

echo "Done. Installed fonts:"
ls "$FONTDIR"/*.ttf
echo
echo "luaotfload/fontspec now find them BY FAMILY NAME (fc-cache was run):"
echo "  \\babelfont{rm}[RawFeature={fallback=hebfb}]{Frank Ruhl Libre}"
echo "  \\babelfont{sf}[RawFeature={fallback=hebfb}]{Heebo}"
