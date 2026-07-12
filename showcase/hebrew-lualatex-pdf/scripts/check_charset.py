#!/usr/bin/env python3
"""check_charset.py — catch stray/confusable codepoints BEFORE you compile.

Every character in a .tex source for this pipeline must be one the fonts can
render: ASCII (LaTeX commands + Latin), the Hebrew block, or a short list of
typographic punctuation. Anything else compiles to a "Missing character"
(silent tofu) or — worse — a *confusable*: an Arabic/Cyrillic letter that looks
identical to a Hebrew/Latin one in your editor but is a different codepoint.

The classic trap this catches: typing "סקרי" (scree) where the ר/י were
auto-"corrected" to the Arabic ر (U+0631) / ي (U+064A). It looks perfect on
screen, compiles, and renders two tofu boxes. `build.sh` runs this as a HARD
gate (like missing characters) because every hit is a guaranteed render bug.

Usage:  python3 check_charset.py file1.tex [file2.tex ...]
Exit:   0 = clean, 1 = stray codepoints found, 2 = bad usage.
"""
import sys, unicodedata, re

# A codepoint inside a LaTeX comment cannot tofu (the comment is not rendered),
# so — like check_bidi_figures — blank the comment tail before scanning. Blank
# with spaces (not delete) so reported line:col stays exact for real code hits.
# Matches check_bidi_figures' (?<!\\)%.* rule, keeping the two checkers uniform.
def _strip_comment(line: str) -> str:
    """Blank the comment tail. Backslash-PARITY aware: \% is a literal percent,
    but \\% (table line-break then %) DOES start a comment."""
    i = 0
    while True:
        j = line.find('%', i)
        if j < 0:
            return line
        k = j - 1
        while k >= 0 and line[k] == '\\':
            k -= 1
        if (j - 1 - k) % 2 == 0:            # even backslash run -> real comment
            return line[:j] + ' ' * (len(line) - j)
        i = j + 1

# --- allowed singletons (control + the typographic marks we actually use) ----
ALLOWED_SINGLE = {0x09, 0x0A, 0x0D, 0xA0}            # tab, LF, CR, nbsp
ALLOWED_PUNCT = set("\u2013\u2014\u2026\u201c\u201d\u2018\u2019\u05be\u00b0\u20aa")  # – — … " " ' ' ־ ° ₪ (all render via Frank Ruhl/fallback — verified)

def allowed(cp: int) -> bool:
    if 0x20 <= cp <= 0x7E:            return True   # ASCII printable (LaTeX + Latin)
    if 0x0590 <= cp <= 0x05FF:
        # v3.22: NOT the whole block — cantillation marks and rare signs TOFU in
        # Frank Ruhl (verified: U+0591/0596/05C6 -> Missing character). Letters,
        # niqqud, maqaf, geresh/gershayim, sof-pasuq all render.
        if cp == 0x0590 or 0x0591 <= cp <= 0x05AF:  return False  # cantillation
        if cp == 0x05C6 or 0x05C8 <= cp <= 0x05CF:  return False  # rare/reserved
        return True
    if cp in ALLOWED_SINGLE:          return True
    if cp in (ord(c) for c in ALLOWED_PUNCT): return True
    return False

# blocks whose chars masquerade as Hebrew/Latin — name them explicitly
CONFUSABLE = [
    (0x0591, 0x05AF, "Hebrew CANTILLATION mark — tofu in Frank Ruhl (drop it, or switch to a font with te'amim)"),
    (0x200E, 0x200F, "bidi CONTROL mark (LRM/RLM) — invisible direction voodoo; use \\en{}/\\h{} isolation instead"),
    (0x202A, 0x202E, "bidi EMBEDDING mark — invisible direction voodoo; use \\en{}/\\h{} isolation instead"),
    (0xFB1D, 0xFB4F, "Hebrew PRESENTATION form — normalize to base letter + mark (NFC)"),
    (0x0600, 0x06FF, "ARABIC (ر/ي look like Hebrew resh/yod!)"),
    (0x0400, 0x04FF, "CYRILLIC (а/е/о/р/с look like Latin a/e/o/p/c)"),
    (0x0370, 0x03FF, "GREEK (type \\alpha, \\Omega … in math, not the raw glyph)"),
    (0x2200, 0x22FF, "MATH SYMBOL (type \\le \\in \\to … not the raw ≤ ∈ →)"),
]
def why(cp: int) -> str:
    for lo, hi, msg in CONFUSABLE:
        if lo <= cp <= hi:
            return msg
    return "outside Hebrew/Latin/allowed-punct — will tofu"

def main(argv):
    files = argv[1:]
    if not files:
        print("usage: python3 check_charset.py file.tex [...]"); return 2
    hits = 0
    for path in files:
        try:
            lines = open(path, encoding="utf-8").read().splitlines()
        except OSError as e:
            print(f"❌ cannot read {path}: {e}"); hits += 1; continue
        for ln, raw in enumerate(lines, 1):
            line = _strip_comment(raw)          # ignore codepoints in comments
            for col, ch in enumerate(line, 1):
                cp = ord(ch)
                if allowed(cp):
                    continue
                hits += 1
                try:    name = unicodedata.name(ch)
                except ValueError: name = "?"
                ctx = raw.strip()[:60]
                print(f"{path}:{ln}:{col}: U+{cp:04X} {ch!r} ({name})")
                print(f"    → {why(cp)}")
                print(f"    … {ctx}")
    print("-" * 60)
    if hits:
        print(f"✗ {hits} stray codepoint(s). Replace each with its ASCII/Hebrew")
        print("  equivalent (e.g. Arabic ر→Hebrew ר, Greek Ω→$\\Omega$).")
        return 1
    print("✓ charset clean: only ASCII, Hebrew, and allowed punctuation.")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
