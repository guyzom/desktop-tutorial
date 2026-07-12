#!/usr/bin/env python3
"""Restore the page chrome that the quarantined paged.js pipeline used to
provide, as a deterministic post-render pass (between render.mjs and
normalize_pdf.py):

  1. TOC page numbers + dotted leaders — Chromium preserves each TOC row's
     <a href="#id"> as a PDF link WITH its destination page, so the numbers
     are recovered from the compiled PDF itself (no re-measuring pass).
  2. Running chapter header (top, at the physical right — this is an RTL
     document) — chapter start pages come from the same TOC link
     destinations; part-divider pages are detected by their text being
     exactly a part label.
  3. Topic rail (one dot per part, current enlarged + labelled) at the top
     center — part labels are read from the build HTML (window.__railLabels
     is gone with the polyfill, so the <h1 class="part-title"> texts are the
     source).

Hebrew stamping: PyMuPDF does not do bidi, and Hebrew needs no shaping
(no joining forms), so a run-level reversal suffices: split into Hebrew /
non-Hebrew runs, emit runs in reversed order, reverse the characters inside
Hebrew runs only. Hebrew glyphs come from the vendored
assets/fonts/FrankRuhlLibre-Hebrew.ttf (converted once from the fontsource
woff2 — the hebrew subset has no Latin/digits, so non-Hebrew runs use the
built-in Helvetica, visually consistent at these small sizes).

Usage: python3 scripts/stamp_chrome.py <pdf> <source.html> [out.pdf]
(in-place if no out)
"""
import os
import re
import sys
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
HEB_TTF = os.path.join(HERE, "..", "assets", "fonts", "FrankRuhlLibre-Hebrew.ttf")

INK = (0x2C / 255, 0x47 / 255, 0x63 / 255)          # #2c4763 — document ink-blue
GRAY = (0.45, 0.45, 0.45)                           # header/leader gray
DOT_IDLE = (0xC3 / 255, 0xC8 / 255, 0xD0 / 255)     # rail idle dot

HEBREW_RUN = re.compile(r"([\u0590-\u05FF]+)")   # capturing: split() must KEEP the runs


# ---------------------------------------------------------------- bidi + text
def visual_runs(text):
    """Split into (is_hebrew, run) pieces in VISUAL left-to-right order for an
    RTL line: logical order reversed, Hebrew runs char-reversed. NOTE the
    capturing group in HEBREW_RUN — re.split() without one DISCARDS the
    matches, which silently deleted every Hebrew run (found empirically:
    stamped headers/labels came out as their Latin fragments only)."""
    parts = [p for p in HEBREW_RUN.split(text) if p != ""]
    heb = [bool(HEBREW_RUN.fullmatch(p)) for p in parts]
    out = []
    for p, h in reversed(list(zip(parts, heb))):
        out.append((h, p[::-1] if h else p))
    return out


class Stamper:
    def __init__(self, doc):
        self.doc = doc
        self.heb = fitz.Font(fontfile=HEB_TTF)
        self.helv = fitz.Font("helv")

    def _font_for(self, is_heb, run):
        if is_heb:
            return self.heb, True
        # helv is WinAnsi-ish: em-dashes and other non-ASCII punctuation come
        # out wrong. Use the Frank Ruhl face when it covers every char.
        if any(ord(c) > 127 for c in run) and all(
                c == " " or self.heb.has_glyph(ord(c)) for c in run):
            return self.heb, True
        return self.helv, False

    def width(self, text, size):
        return sum(self._font_for(h, t)[0].text_length(t, fontsize=size)
                   for h, t in visual_runs(text))

    def draw(self, page, x_left, y, text, size, color):
        """Draw mixed Hebrew/Latin text whose VISUAL left edge is x_left."""
        x = x_left
        for h, t in visual_runs(text):
            font, use_ttf = self._font_for(h, t)
            page.insert_text(
                (x, y), t, fontsize=size, color=color,
                fontname="FRLheb" if use_ttf else "helv",
                fontfile=HEB_TTF if use_ttf else None,
            )
            x += font.text_length(t, fontsize=size)
        return x


# ------------------------------------------------------------------- parsing
def parse_structure(html_path):
    """Ordered TOC entries [(id, label)], part labels in document order, and
    the part index each chapter belongs to (chapters before the first part
    get -1)."""
    with open(html_path, encoding="utf-8") as f:
        html = f.read()
    toc = re.findall(r'<li><span class="name"><a href="#([^"]+)">([^<]+)</a>', html)
    stream = re.findall(
        r'<section class="part-divider" data-part="(\d+)"><h1 class="part-title">([^<]+)</h1></section>'
        r'|<h2 class="chapter" id="([^"]+)">',
        html,
    )
    parts, chap_part = [], {}
    cur = -1
    for pidx, plabel, chid in stream:
        if plabel:
            cur = int(pidx)
            # rail label = the TOPIC, not the full divider title: strip the
            # leading 'חלק <numeral> —' prefix (the dots already encode which
            # part this is; repeating 'חלק VII' in the label wastes the width
            # budget and squeezed the running header for nothing).
            parts.append(re.sub(r"^חלק\s+\S+\s*[—·\-]\s*", "", plabel))
        elif chid:
            chap_part[chid] = cur
    return toc, parts, chap_part


def toc_rows(doc, n_expected):
    """TOC rows in reading order as (dest_page_0based, row_rect), collected
    from the link annotations on the TOC pages (grouped by row y — a row may
    carry both the name link and the pgcell link)."""
    rows = []
    for pno in range(1, min(6, doc.page_count)):
        links = [l for l in doc[pno].get_links() if "page" in l and l["page"] >= 0]
        if not links:
            break
        links.sort(key=lambda l: (round(l["from"].y0, 1), l["from"].x0))
        seen_y = None
        for l in links:
            y = round(l["from"].y0, 1)
            if seen_y is not None and abs(y - seen_y) < 2:
                continue  # second link of the same row
            seen_y = y
            rows.append((pno, l["page"], l["from"]))
    if len(rows) != n_expected:
        print(f"[stamp] WARNING: {len(rows)} TOC link rows vs {n_expected} entries", file=sys.stderr)
    return rows


# ------------------------------------------------------------------ stamping
def stamp(pdf_in, html_path, pdf_out):
    toc, parts, chap_part = parse_structure(html_path)
    doc = fitz.open(pdf_in)
    st = Stamper(doc)

    rows = toc_rows(doc, len(toc))

    # 1) TOC page numbers + dotted leaders. Physical LEFT side (RTL document).
    NUM_X_RIGHT = 90.0
    for pno, dest, rect in rows:
        page = doc[pno]
        label = str(dest + 1)
        y = rect.y1 - 3
        w = st.helv.text_length(label, fontsize=10)
        page.insert_text((NUM_X_RIGHT - w, y), label, fontsize=10, color=(0.25, 0.25, 0.25))
        # the stamped number is a navigation affordance — make it clickable
        # (Chromium's own anchor covers only the title span on the right).
        page.insert_link({"kind": fitz.LINK_GOTO, "page": dest,
                          "from": fitz.Rect(NUM_X_RIGHT - w - 4, y - 11, NUM_X_RIGHT + 4, y + 3),
                          "to": fitz.Point(0, 0)})
        x0, x1 = NUM_X_RIGHT + 6, rect.x0 - 6
        if x1 - x0 > 12:
            ly = rect.y1 - 6
            x = x0
            while x < x1:
                page.draw_line((x, ly), (min(x + 1.5, x1), ly), color=(0.72, 0.72, 0.72), width=0.7)
                x += 5.0
    last_toc_page = rows[-1][0] if rows else 1

    # 1b) Maximal viewer compatibility: Chromium emits links as NAMED
    # destinations resolved via a legacy PDF-1.1 /Dests dictionary — valid,
    # but embedded/mobile viewers are flaky about the name lookup (found
    # empirically: TOC clicks did nothing in the user's viewer). Rewrite every
    # named link in the document as an explicit GOTO to the resolved page.
    for pno in range(doc.page_count):
        page = doc[pno]
        for lnk in page.get_links():
            if lnk.get("kind") == fitz.LINK_NAMED and lnk.get("page", -1) >= 0:
                new = {"kind": fitz.LINK_GOTO, "page": lnk["page"],
                       "from": lnk["from"], "to": fitz.Point(0, 0)}
                page.delete_link(lnk)
                page.insert_link(new)

    # chapter start pages (0-based) in document order + part pages by label.
    chap_start = {}
    for (pno, dest, _), (chid, chlabel) in zip(rows, toc):
        chap_start[dest] = (chid, chlabel)
    part_pages = {}
    for pno in range(last_toc_page + 1, doc.page_count):
        t = doc[pno].get_text().strip()
        for i, plabel in enumerate(parts):
            words = set(plabel.split())
            if len(t) < 90 and words and words.issubset(set(t.split())):
                part_pages[pno] = i
    # walk pages: current chapter + current part.
    cur_ch, cur_part = None, -1
    W = doc[0].rect.width
    for pno in range(last_toc_page + 1, doc.page_count):
        page = doc[pno]
        if pno in part_pages:
            cur_part = part_pages[pno]
            cur_ch = None
        if pno in chap_start:
            chid, chlabel = chap_start[pno]
            cur_ch = chlabel
            if chid in chap_part and chap_part[chid] >= 0:
                cur_part = chap_part[chid]

        # 2) running chapter header — top, physical right, like the old @top-right.
        if cur_ch and pno not in part_pages:
            size = 9.0
            # helv (WinAnsi) has no em-dash; a middot separator is the DESIGN,
            # not an encoding accident.
            title = cur_ch.replace("—", "·")
            # available width: from just past the rail's right extent (dots or
            # label, whichever is wider) to the right margin. Long chapter
            # titles are ellipsized word-by-word — a running head is a locator,
            # not the full title (found empirically: page 50's title reached
            # x=252, inside the rail zone).
            # the header's vertical band (baseline 40) overlaps the DOTS row
            # (cy 38) but not the label row (baseline 50), so only the dots
            # constrain the header's horizontal budget.
            rail_half = (len(parts) - 1) * 11.0 / 2 + 6 if parts else 0.0
            max_w = (W - 51) - (W / 2 + rail_half) - 12
            w = st.width(title, size)
            if w > max_w:
                words = title.split()
                while len(words) > 1 and st.width(" ".join(words) + " ...", size) > max_w:
                    words.pop()
                title = " ".join(words) + " ..."
                w = st.width(title, size)
            st.draw(page, W - 51 - w, 40, title, size, GRAY)

        # 3) topic rail — top center dots + current part label.
        if parts and cur_part >= 0:
            n = len(parts)
            gap, r_idle, r_cur = 11.0, 2.1, 3.4
            total = (n - 1) * gap
            cx0 = (W - total) / 2
            cy = 38.0
            for i in range(n):
                # dot order right-to-left (RTL): part 0 is the RIGHTMOST dot.
                cx = cx0 + (n - 1 - i) * gap
                cur = i == cur_part
                page.draw_circle((cx, cy), r_cur if cur else r_idle,
                                 color=None, fill=INK if cur else DOT_IDLE)
            label = parts[cur_part]
            lw = st.width(label, 6.5)
            st.draw(page, (W - lw) / 2, cy + 12, label, 6.5, INK)

    doc.save(pdf_out, deflate=True)
    doc.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: stamp_chrome.py <pdf> <source.html> [out.pdf]", file=sys.stderr)
        sys.exit(2)
    src, html = sys.argv[1], sys.argv[2]
    dst = sys.argv[3] if len(sys.argv) > 3 else src
    if dst == src:
        tmp = src + ".stamp.tmp"
        stamp(src, html, tmp)
        os.replace(tmp, src)
    else:
        stamp(src, html, dst)
    print(f"stamped chrome -> {dst}")
