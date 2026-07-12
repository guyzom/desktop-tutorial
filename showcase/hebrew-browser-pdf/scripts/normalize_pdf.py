#!/usr/bin/env python3
"""Neutralize the non-deterministic bits Chromium embeds in a printed PDF, so
that two renders of the same HTML are byte-identical (the "fixed point" the old
LuaLaTeX build.sh proved via SOURCE_DATE_EPOCH — Chromium ignores that env var,
so we post-process instead).

Non-determinism sources found empirically (spike 2):
  - /Info CreationDate and ModDate (wall-clock timestamp of the render)
  - the trailer /ID array (derived from content + time)
Both are set to fixed, content-independent constants.

Usage: python3 scripts/normalize_pdf.py <in.pdf> [out.pdf]   (in-place if no out)
"""
import re
import sys
import pikepdf

FIXED_DATE = "D:20000101000000+00'00'"
FIXED_ID = b"\x00" * 16

# paged.js mints a random UUID per footnote named-destination (invisible, but
# non-deterministic). They appear in the same ORDER across two renders of the
# same input, so remap each unique UUID to a canonical, length-preserving one by
# first-occurrence order — making the two byte-streams identical.
_UUID = re.compile(rb"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")

def canonicalize_uuids(data):
    mapping = {}
    def canon(i):
        h = f"{i:032x}"
        return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:]}".encode()
    def sub(m):
        u = m.group(0)
        if u not in mapping:
            mapping[u] = canon(len(mapping))
        return mapping[u]
    return _UUID.sub(sub, data)


def normalize(path_in, path_out=None):
    path_out = path_out or path_in
    # Pass 1: canonicalize paged.js UUIDs at the byte level (length-preserving),
    # before pikepdf so the two inputs become identical. Chromium output keeps
    # these plaintext (uncompressed), so a raw substitution reaches them.
    raw = canonicalize_uuids(open(path_in, "rb").read())
    open(path_in, "wb").write(raw)
    # Pass 2: fix metadata + deterministic /ID.
    with pikepdf.open(path_in, allow_overwriting_input=True) as pdf:
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            # Clear XMP dates if present.
            for k in ("dc:date", "xmp:CreateDate", "xmp:ModifyDate", "xmp:MetadataDate"):
                if k in meta:
                    del meta[k]
        if pdf.docinfo is not None:
            for k in ("/CreationDate", "/ModDate"):
                if k in pdf.docinfo:
                    pdf.docinfo[k] = FIXED_DATE
        # Deterministic trailer /ID.
        pdf.save(
            path_out,
            deterministic_id=False,
            fix_metadata_version=False,
            static_id=True,  # fixes the SECOND /ID element only (see below)
        )
    # Pass 3: pikepdf's static_id fixes only the SECOND /ID element and
    # preserves the first from the input. Zero out BOTH halves with a length-
    # preserving raw substitution (hex-for-hex, xref offsets stay valid), so
    # determinism never depends on what any upstream tool minted (caught as a
    # 50% T5 flake when a PyMuPDF post-processing step briefly sat upstream).
    data = open(path_out, "rb").read()
    def _zero_id(m):
        return b"/ID [<" + b"0" * len(m.group(1)) + b"><" + b"0" * len(m.group(2)) + b">]"
    data = re.sub(rb"/ID\s*\[\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\]", _zero_id, data)
    open(path_out, "wb").write(data)
    return path_out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: normalize_pdf.py <in.pdf> [out.pdf]", file=sys.stderr)
        sys.exit(2)
    out = normalize(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    print(f"normalized -> {out}")
