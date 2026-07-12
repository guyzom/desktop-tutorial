#!/usr/bin/env python3
"""font_coverage.py — does a font actually contain Hebrew (and Latin)?

A font compiling without error does NOT mean it has Hebrew glyphs. On some
systems DejaVu Serif ships with Latin but ZERO Hebrew, so it silently renders
all Hebrew as tofu. Run this before trusting any font as the Hebrew body font.

Usage:
    python3 font_coverage.py /path/to/font.ttf [more.ttf ...]

Prints, per font, whether it covers Hebrew (aleph U+05D0) and Latin (A U+0041).
"""
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("fontTools not installed:  pip install --break-system-packages fonttools")

HEBREW, LATIN = 0x05D0, 0x0041  # aleph, A

if len(sys.argv) < 2:
    sys.exit(__doc__)

for path in sys.argv[1:]:
    try:
        cmap = TTFont(path).getBestCmap()
        heb, lat = HEBREW in cmap, LATIN in cmap
        verdict = ("OK for Hebrew body" if heb
                   else "Latin-only — use ONLY as a fallback, not the body font")
        print(f"{path}\n    Hebrew: {heb}   Latin: {lat}   → {verdict}")
    except Exception as e:  # noqa: BLE001
        print(f"{path}\n    ERROR: {e}")
