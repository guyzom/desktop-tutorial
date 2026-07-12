#!/usr/bin/env python3
"""check_bidi_figures.py — catch the mixed-direction bug class BEFORE you build.

Scans LaTeX source for failure modes that compile cleanly (0 missing characters,
0 errors) but render WRONG and are invisible in the source, plus a few that throw
errors far from their real cause.

  1. Latin text inside \\h{...} that sits INSIDE a tikzpicture environment.
     babel's bidi reorders Latin correctly in prose and tables, but NOT inside
     TikZ nodes — there the Latin comes out reversed (Datapath -> htapataD,
     CPU -> UPC) and parentheses mirror. Fix: isolate the Latin with \\en{...}
     or \\code{...}, or use bare Latin (no \\h) in the LTR `tikzpic` island.

  2. ASCII LaTeX quotes ``...'' anywhere. For Hebrew use gershayim ( \u05f4 ),
     which is symmetric; ``/'' produce mismatched English curly quotes.

  3. \\texttt{...} directly touching math, e.g. \\texttt{ALUOp}$=10$ -> "10ALUOp".
     Fix: one unit, \\code{ALUOp=10}.

  4. A \\begin{axis} (pgfplots) with no matching \\end{axis} before
     \\end{tikzpicture} — throws "Extra }" that CASCADES past the figure close.

  5. Math ($...$) in a heading without \\texorpdfstring — garbles the bookmark.

  9. ISLAND-NEXT-TO-MATH (v3.8.2; colon variant v3.10) — an \\en{...}/\\code{...}
     LTR island IMMEDIATELY followed by inline math in RTL prose, e.g.
     \\en{hit time}$=1$ or \\code{Rt}$\\to$\\code{ForwardB}. The island and the
     math are separate LTR runs, so they REORDER under RTL: the value/arrow jumps
     to the wrong side ("=1hit time", "ForwardB->Rt"). v3.10 also catches the
     COLON form \\en{label}: $math$ (the colon orphans: "q=... :s-channel", the
     detector-stable bug). COMPILES CLEAN. Fix: make it ONE island with the math
     INSIDE -> \\en{hit time $=1$} / \\en{label: $math$}. (A plain space with no
     colon, \\en{word} $x$, is FINE and is NOT flagged. Not flagged once wrapped:
     the check skips an island already inside an outer \\en{}/\\mbox{}.)

  10. ADJACENT-LTR-ISLANDS (v3.10) — two \\en{}/\\code{} islands separated ONLY
     by a comma or slash REORDER in RTL: \\en{Griffiths}, \\en{Thomson} renders
     "Thomson, Griffiths"; \\en{Breit-Wigner} / \\en{Lorentzian} -> "Lorentzian /
     Breit-Wigner"; \\code{lw}, \\code{sw} -> "sw, lw". COMPILES CLEAN, invisible
     in source. Fix: merge into ONE island -> \\en{Griffiths, Thomson} /
     \\en{Breit-Wigner / Lorentzian} / \\en{\\code{lw}, \\code{sw}}. (The merged
     form — inner islands inside an outer \\en — is NOT flagged.)

  11. MATH-TEXT-EN-COLON (v3.10) — \\text{\\en{label}:} inside math/align: the
     colon sits OUTSIDE the \\en (in the RTL \\text base), so it ORPHANS to the
     wrong side (":s-channel" instead of "s-channel:"). The align label of the
     virtual-mass box hit this. Fix: put the colon INSIDE -> \\text{\\en{label:}}.

  -- text-inside-math checks (v3.8) -----------------------------------------
  6. LANG-RAW-IN-MATH — a bare \\h{...} or \\en{...} sitting directly in math
     ($...$, \\[...\\], align, a subscript). \\h/\\en are \\foreignlanguage, which
     is INVALID in math -> "\\rmfamily invalid in math mode". Wrap the run in
     \\text{...}: Hebrew -> \\text{\\h{...}}, Latin -> \\text{...} (or \\text{\\en{...}}
     when it has parens, see #7). This was the single hardest error to localise
     in the data-science build: \\en{Normal} written straight into $...$.

  7. TEXT-PARENS-IN-MATH — a \\text{...} in math whose Latin content has ( ) or
     [ ] but is NOT wrapped in \\en{...}. Plain \\text inherits the surrounding
     RTL base, so the parentheses MIRROR: \\text{Specificity (TNR)} renders
     "Specificity (TNR(" . This COMPILES CLEAN and is invisible in the source.
     Fix: \\text{\\en{Specificity (TNR)}} (the \\en forces LTR so parens stay put).
     For a function on a Hebrew/text argument keep the parens at MATH level:
     \\text{Entropy}(\\text{\\h{...}}), never \\text{Entropy(arg)}. (Parens around
     PURE Hebrew, e.g. \\text{\\h{(...)}} or ESS \\h{(...)}, are fine — not flagged.)
     v3.23.4 also catches the INVERSE — parens OUTSIDE an \\en island that wrap
     ONLY Latin: \\text{(\\en{weak})} renders ")weak(" (the parens sit in the RTL
     \\text base). Fix: parens INSIDE the island -> \\text{\\en{(weak)}}. Parens
     that also wrap Hebrew (\\text{(הספק ב־\\en{CMOS})}) are Hebrew-directional and
     stay fine — NOT flagged.

NOTE (v3.8.1): bare Hebrew inside \\text{...} in math (e.g. \\text{מהירות}, a
subscript/underbrace label) is FINE — it compiles and renders correctly under
this LuaLaTeX+babel(bidi=basic) pipeline; \\h is OPTIONAL there. (Verified
empirically: \\text{שלום} and \\text{\\h{שלום}} render identically.) An earlier
HEBREW-RAW-IN-MATH check was removed as a false positive. The \\rmfamily error
comes ONLY from a bare \\h/\\en used DIRECTLY in math (outside \\text) — that is
check #6 above, which stands.

False positives avoided: \\command names and already-isolated spans
(\\en/\\code/\\texttt, and for the math checks \\h{...}/\\en{...}) are stripped
before the Latin/paren tests; \\text{...}/\\mbox{...} groups are stripped
before the bare-\\h/\\en-in-math scan, so \\text{\\h{...}} and \\mbox{\\en{...}}
do NOT trip #6.

  -- v3.21 lint rules -------------------------------------------------------
  B1. TEXT-MATH-CARET — a bare ^ or _ inside \\text{...} in math. \\text is NOT
     math, so it throws "! Missing $ inserted" (seen: \\text{\\en{(linear
     45^\\circ)}}). Fix: keep the math OUTSIDE the \\text — (\\text{\\en{linear }}
     45^\\circ), not \\text{...45^\\circ}. (Escaped \\^ \\_ and nested $...$ are fine.)
  B2. HEBREW-DOUBLE-HYPHEN — a -- / --- run renders as literal hyphens, NOT an
     en/em-dash: Frank Ruhl has no tlig (verified — width identical with/without
     Ligatures=TeX). This holds next to Hebrew AND between Latin/digits
     (1990--2000, Hong--Ou--Mandel — v3.22 flags those too). Type — (U+2014) /
     – (U+2013) directly. A SINGLE hyphen (Hong-Ou-Mandel, a range like 3-5) is
     correct and is not flagged. Skipped: math (minus), \\code/\\texttt/\\url spans.
  B3. UNDEFINED-COMMON-MACRO — \\enquote (csquotes) and \\SI/\\qty/\\SIrange
     (siunitx, all forms): packages this preamble does not load, so they throw "Undefined
     control sequence" (both broke a real build). Load the package or rewrite
     (gershayim for quotes; plain math+unit). \\expval/\\ketbra are now provided.
  B4. PROVIDECOMMAND-PRIMITIVE (v3.23.6) — \\providecommand{\\ni}{n_i} is a SILENT
     no-op: \\ni/\\Re/\\Im/\\det/... are TeX primitives / kernel math commands, so
     the name is already defined and every use renders the PRIMITIVE ("np=∋²").
     Compiles clean; was caught only on a rendered page (DEFECTS BLD-9). Fix:
     \\renewcommand (explicit override) or a different macro name.

  13. TEXT-HEBREW-BETWEEN-ISLANDS (v3.23.6) — RAW Hebrew inside \\text{} flanked
     on BOTH sides by \\en/\\code/\\texttt islands, e.g. an align regime label
     \\text{\\en{(}תעלה רחבה\\en{)}}: the two LTR islands bite the RTL run from
     both ends and the Hebrew renders REVERSED with displaced parens (DEFECTS
     BIDI-16). Compiles clean, invisible in source. Fix: the whole Hebrew label
     as ONE unit — \\text{\\h{(תעלה רחבה)}}. Hebrew around a SINGLE island
     (\\text{(הספק ב־\\en{CMOS})}) is fine and is NOT flagged.

MULTI-LINE \text (v3.23.5): a \text{...} whose braces span a SOURCE LINE BREAK is
now handled — _text_content() joins the continuation lines before the B1/#7/#7b/
colon scans, so a split \text{(\en{weak})} is caught like a single-line one.

Usage:   python3 scripts/check_bidi_figures.py file1.tex [file2.tex ...]
Exit:    0 if clean, 1 if any issue found (so it can gate a build).
"""
import re
import sys

# \h{...} with up to one level of nested braces.
H_PAT = re.compile(r'\\h\{((?:[^{}]|\{[^{}]*\})*)\}')
# ASCII LaTeX quotes.
QUOTE_PAT = re.compile(r"``|''")
# \texttt{...} directly touching math ($) — the "10ALUOp" jam in RTL prose.
TTMATH_PAT = re.compile(r'\\texttt\{[^{}]*\}\$|\$\\texttt\{')
# An \en{}/\code{} LTR island IMMEDIATELY followed by inline math, in RTL text.
# The island and the math are separate LTR runs -> they REORDER, so a trailing
# value lands on the wrong side: \en{hit time}$=1$ renders "=1hit time", and
# \code{Rt}$\to$\code{ForwardB} reverses to "ForwardB->Rt". Fix: ONE island with
# the math INSIDE it -> \en{hit time $=1$} / \en{\code{Rt}$\to$\code{ForwardB}}.
# v3.10: also catch the COLON variant \en{label}: $math$ — the colon ORPHANS to
# the wrong side (":s-channel q=..." / detector-stable). A plain SPACE with NO
# colon, \en{word} $x$, is FINE (verified) and is NOT matched here.
ISLAND_MATH_PAT = re.compile(
    r'\\(?:en|code)\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}(?:\$| *: *\$)')
# v3.10: two LTR islands (\en/\code/\texttt) separated ONLY by a comma or slash
# REORDER in RTL: \en{Griffiths}, \en{Thomson} -> "Thomson, Griffiths"; \en{A} /
# \en{B} -> "B / A"; \code{lw}, \code{sw} -> "sw, lw"; and (since v3.7 made
# \texttt LTR-ISOLATED) even letter-only \texttt{lw}/\texttt{sw} -> "sw/lw". Fix:
# merge into ONE island -> \en{Griffiths, Thomson} / \en{A / B} / \texttt{lw/sw}
# / \en{\code{lw}, \code{sw}}. (An island already INSIDE an outer \en{}/\mbox{},
# i.e. the merged form, is skipped.)
ADJ_LTR_PAT = re.compile(
    r'\\(?:en|code|texttt)\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\} *[,/] *\\(?:en|code|texttt)\{')
# Bare Latin identifier glued to an assignment math run, e.g.  op$=8$  ->  "op8".
BAREMATH_PAT = re.compile(r'(?<![\\A-Za-z])[A-Za-z]{2,}\$=')
# Two \texttt{} runs joined by / or , where a run contains \$  (the $ misplaces).
TTPAIR_PAT = re.compile(r'\\texttt\{([^{}]*)\}[/,]\\texttt\{([^{}]*)\}')
# A Latin token immediately before an English "(Cap...)" in Hebrew text mirrors.
LATPAREN_PAT = re.compile(r'(?<![\\A-Za-z])[A-Z]{2,}\s?\([A-Z]|\\textbf\{[A-Za-z][^{}]*\}\s?\([A-Z]')

# --- #12 Hebrew-flow / Hebrew-equation arrows (v3.14) ----------------------
# bidi does NOT mirror arrow glyphs. A rightward "flow/produces" arrow whose
# operands involve Hebrew points BACKWARD (against RTL reading). Two forms:
#   (a) bare arrow alone in inline math between Hebrew prose: שלב $\to$ עדכון
#   (b) arrow in a display/inline equation that carries a Hebrew \text OPERAND
#       (the Hebrew makes the whole equation RTL, flipping the arrow):
#       \text{חריגה ב־}EX \Rightarrow \text{בטל}... / \code{div}\Rightarrow ...=\text{מנה}
_HEBR = '\u0590-\u05ff'
HEB_CHAR2 = re.compile('[' + _HEBR + ']')
# rightward / "produces" arrows that bidi does NOT mirror (leftward forms are fine)
RARROW_PAT = re.compile(
    r'\\(?:to|rightarrow|longrightarrow|Rightarrow|Longrightarrow'
    r'|xrightarrow|twoheadrightarrow|hookrightarrow|mapsto)(?![A-Za-z])')
# a \text{...} carrying Hebrew (an operand — unless it is a sub/superscript label)
HEB_TEXT_PAT = re.compile(r'\\text\{[^{}]*[' + _HEBR + r'][^{}]*\}')
# Hebrew LETTERS only (א-ת) — v3.23.7: the BIDI-16 probe uses this, not the full
# block: a lone maqaf/gershayim between two islands does NOT reorder (compiled,
# pixel-identical to the merged form); only Hebrew letters carry the RTL run.
HEB_LETTER = re.compile('[א-ת]')
# bare rightward arrow alone inside inline math:  $ \to $  ( \;,\, \quad spacing ok )
BARE_RARROW_DOLLAR_PAT = re.compile(
    r'\$(?:\s|\\[;,:!>| ]|\\quad|\\qquad)*'
    r'\\(?:to|rightarrow|longrightarrow|Rightarrow|Longrightarrow|mapsto)'
    r'(?:\s|\\[;,:!>| ]|\\quad|\\qquad)*\$')

# Heading commands (math in a bookmark must use \texorpdfstring).
HEADING_PAT = re.compile(
    r'\\(?:chapter|section|subsection|subsubsection|paragraph|part)\*?\{')

# --- math-mode detection (v3.8) --------------------------------------------
MATH_ENV_BEGIN = re.compile(
    r'\\begin\{(align\*?|gather\*?|equation\*?|multline\*?|eqnarray\*?'
    r'|flalign\*?|alignat\*?|aligned|gathered)\}')
MATH_ENV_END = re.compile(
    r'\\end\{(align\*?|gather\*?|equation\*?|multline\*?|eqnarray\*?'
    r'|flalign\*?|alignat\*?|aligned|gathered)\}')
# \h{...} or \en{...} with up to one nested-brace level (for stripping).
LANG_GROUP = re.compile(r'\\(?:h|en)\{(?:[^{}]|\{[^{}]*\})*\}')
# An LTR (Latin) island: \en / \code / \texttt with up to one level of nesting.
LATIN_ISLAND = re.compile(r'\\(?:en|code|texttt)\{(?:[^{}]|\{[^{}]*\})*\}')

# --- v3.21 lint rules ------------------------------------------------------
# B2 HEBREW-DOUBLE-HYPHEN — -- / --- adjacent to Hebrew renders as literal
#   hyphens, NOT an em-dash (Frank Ruhl lacks tlig; verified). Type — (U+2014)
#   directly. A hyphen run BETWEEN Latin tokens (Hong-Ou-Mandel, state-of-the-
#   art) is correct and is NOT matched (no Hebrew on either side). A SINGLE
#   hyphen (range 3-5) is not matched either — only runs of 2 or 3.
HEB_DHYPHEN_PAT = re.compile(
    r'[\u0590-\u05ff][ \t]*-{2,3}|-{2,3}[ \t]*[\u0590-\u05ff]')
# v3.22: the classic Latin/digit range idiom (1990--2000, Hong--Ou--Mandel) ALSO
# stays literal hyphens under Frank Ruhl (tlig never fires — verified). Letter or
# digit required on BOTH sides, so TikZ path ops ('(a) -- (b)', '--cycle', '--++')
# never match.
LAT_DHYPHEN_PAT = re.compile(r'[0-9A-Za-z]-{2,3}[0-9A-Za-z]')
# B3 UNDEFINED-COMMON-MACRO — macros from packages this preamble does NOT load,
#   so they throw "Undefined control sequence": \enquote (csquotes), \SI/\qty/
#   \SIrange (siunitx). (\expval and \ketbra ARE provided by the preamble as of
#   v3.21, so they are deliberately NOT listed here.)
UNDEF_MACRO_PAT = re.compile(
    r'\\(enquote|SIrange|SIlist|SI|si|qtyrange|qtylist|qtyproduct|qty'
    r'|numrange|numlist|num|ang|unit|DeclareSIUnit)(?![A-Za-z])')
# B4 (v3.23.6) PROVIDECOMMAND-PRIMITIVE — \providecommand{\ni}{n_{\mathrm i}} is
#   a SILENT NO-OP: \ni (the ∋ relation), \Re, \Im, \det ... are TeX primitives /
#   LaTeX-kernel math commands, so the name is already defined and \providecommand
#   does nothing. Every \ni then renders as ∋ ("np=∋²") — compiles clean, no
#   source signal; caught only on a rendered page in a real build (DEFECTS BLD-9).
#   Fix: \renewcommand (an explicit, loud override) or a different macro name.
#   v3.23.7 (adversarial review): single-letter KERNEL text commands added — the
#   classic shortcuts \d (differential), \i/\j (imaginary/dotless), \O (big-O),
#   \L/\l (Lagrangian/ell), \H (Hamiltonian), \S/\P (action/probability),
#   \b/\t/\v (bold/transpose/vector) are all kernel accents/glyphs (under-dot,
#   Ø, Ł, umlaut, §, ¶ ...), so \providecommand on them is the same silent no-op
#   with a DIFFERENT glyph than intended. Operators whose primitive meaning
#   equals the intended one (\arcsin, \angle) are deliberately NOT listed — the
#   no-op there renders exactly what was meant, no visual bug.
TEX_PRIMITIVE_SHADOW = (
    'ni|Re|Im|Pr|wp|top|bot|det|deg|gcd|hom|ker|dim|arg|exp|log|ln|lg'
    '|lim|limsup|liminf|min|max|sup|inf|sin|cos|tan|cot|sec|csc'
    '|sinh|cosh|tanh|coth|div|mod'
    '|d|i|j|O|L|l|H|S|P|b|t|v')
PROVIDE_PRIMITIVE_PAT = re.compile(
    r'\\providecommand\s*\*?\s*\{?\s*\\(?:' + TEX_PRIMITIVE_SHADOW + r')(?![A-Za-z])')


def _match_brace(s: str, open_idx: int) -> int:
    """s[open_idx] == '{'; return the index just past the matching '}'."""
    depth = 0
    for j in range(open_idx, len(s)):
        if s[j] == '{':
            depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0:
                return j + 1
    return len(s)


# Inline-comment strip, backslash-parity aware (same rule as the main scan loop).
_COMMENT_SUB = (r'(?<!\\)((?:\\\\)*)%.*', r'\1')


def _text_content(lines, li: int, code: str, brace_pos: int) -> str:
    """Content inside a \\text{...} whose '{' is at code[brace_pos] (code = the
    comment-stripped source line at 0-based index `li`). If the group closes on
    this line, return that (fast path). If it SPANS a source line break, join the
    following comment-stripped lines and match there — closing the v3.23.5
    KNOWN-LIMITATION blind spot where a multi-line \\text hid its parens/caret/colon
    from the line-based scans (e.g. \\text{(\\en{weak})} split across two lines
    still mirrors to ")weak(" but used to evade #7/#7b/B1/MATH-TEXT-EN-COLON)."""
    depth = 0
    for j in range(brace_pos, len(code)):
        if code[j] == '{':
            depth += 1
        elif code[j] == '}':
            depth -= 1
            if depth == 0:
                return code[brace_pos + 1:j]            # closed on this line
    # spans lines: join the rest of the file (comment-stripped) and match there
    tail = [re.sub(_COMMENT_SUB[0], _COMMENT_SUB[1], lines[k])
            for k in range(li + 1, len(lines))]
    combined = code[brace_pos:] + '\n' + '\n'.join(tail)
    d = 0
    for j in range(len(combined)):
        if combined[j] == '{':
            d += 1
        elif combined[j] == '}':
            d -= 1
            if d == 0:
                return combined[1:j]
    return combined[1:]                                 # unbalanced source


def _parens_wrap_only_latin(content: str) -> bool:
    """True if a ( ) or [ ] pair in the \\text{} BASE wraps ONLY a Latin island
    (\\en/\\code/\\texttt) — e.g. \\text{(\\en{weak})}. There the parens sit in the
    RTL \\text base, OUTSIDE the LTR island, so they MIRROR to ")weak(". The fix is
    to move the parens INSIDE the island: \\text{\\en{(weak)}}. Parens that also
    enclose Hebrew (\\text{(הספק ב־\\en{CMOS})}) render fine and are NOT flagged —
    those are Hebrew-directional parens. This is the blind spot of the plain #7
    scan, which strips \\en first and then sees only empty "()" (no Latin left)."""
    s = content
    s = s.replace(r'\(', '  ').replace(r'\)', '  ')   # escaped parens: literal
    s = s.replace(r'\[', '  ').replace(r'\]', '  ')
    s = re.sub(r'\$[^$]*\$', ' ', s)                  # nested $...$ math is fine
    s = LATIN_ISLAND.sub('\x01', s)                   # Latin island -> marker
    s = re.sub(r'\\h\{(?:[^{}]|\{[^{}]*\})*\}', '\x02', s)  # Hebrew island -> marker
    stack = []
    for i, ch in enumerate(s):
        if ch in '([':
            stack.append((ch, i))
        elif ch in ')]':
            if not stack:
                continue
            op, oi = stack.pop()
            if (op, ch) not in (('(', ')'), ('[', ']')):
                continue
            interior = s[oi + 1:i]
            if '\x01' not in interior:                # no Latin island inside
                continue
            if '\x02' in interior:                    # a Hebrew island inside -> fine
                continue
            if re.search(r'[\u0590-\u05ff]', interior):  # bare Hebrew inside -> fine
                continue
            # strip the Latin markers + neutral separators; anything left means the
            # parens also wrap non-Latin text (a function name etc.) — handled by #7.
            core = interior.replace('\x01', '')
            core = re.sub(r'[\s,.;:/+\-–—]', '', core)
            if core == '':                            # parens wrap ONLY Latin island(s)
                return True
    return False


def math_mask(code: str, state: dict):
    """Return (mask, state): mask[i] True iff code[i] is in math mode.

    state carries cross-line block math: {'display': bool, 'env': int}.
    Handles inline $...$, \\[ \\], and the display-math environments above.
    """
    n = len(code)
    mask = [False] * n
    # inline-$ state is carried ACROSS lines (a $...$ split over a line break is
    # legal); a blank line resets it (TeX itself errors on a blank line in math,
    # so this self-heals a stray unmatched $).
    if not code.strip():
        state['inline'] = False
        state['paren'] = False
    inline = state.get('inline', False)
    i = 0
    while i < n:
        # LaTeX line break  \\  (optionally \\[len]) — consume both backslashes
        # FIRST, so a following '[' is not misread as \[ (display-math open).
        if code.startswith('\\\\', i):
            cur = inline or state['display'] or state['env'] > 0
            mask[i] = cur
            mask[i + 1] = cur
            i += 2
            continue
        if not inline:
            m = MATH_ENV_BEGIN.match(code, i)
            if m:
                state['env'] += 1
                for k in range(i, m.end()):
                    mask[k] = True
                i = m.end()
                continue
            m = MATH_ENV_END.match(code, i)
            if m:
                for k in range(i, m.end()):
                    mask[k] = True
                state['env'] = max(0, state['env'] - 1)
                i = m.end()
                continue
            if code.startswith(r'\[', i):
                state['display'] = True
                mask[i] = mask[i + 1] = True
                i += 2
                continue
            if code.startswith(r'\]', i):
                mask[i] = mask[i + 1] = True
                state['display'] = False
                i += 2
                continue
        if code.startswith(r'\$', i):                 # escaped dollar (literal)
            cur = inline or state['display'] or state['env'] > 0 or state.get('paren', False)
            mask[i] = mask[i + 1] = cur
            i += 2
            continue
        # \( ... \) inline math (standard LaTeX; can span lines)
        if code.startswith(r'\(', i) and not inline:
            state['paren'] = True
            mask[i] = mask[i + 1] = True
            i += 2
            continue
        if code.startswith(r'\)', i):
            mask[i] = mask[i + 1] = True
            state['paren'] = False
            i += 2
            continue
        # $$ display toggle — treat the PAIR as one delimiter (plain-TeX display)
        if code.startswith('$$', i):
            state['display'] = not state['display']
            mask[i] = mask[i + 1] = True
            i += 2
            continue
        if code[i] == '$':
            inline = not inline
            mask[i] = True
            i += 1
            continue
        mask[i] = inline or state['display'] or state['env'] > 0 or state.get('paren', False)
        i += 1
    state['inline'] = inline
    return mask, state


_TEXT_OPEN = re.compile(r'\\(?:text|mbox|intertext|shortintertext)\{')


def _line_text_spans(code: str, carry_depth: int):
    """(v3.23.7) intext[i] = True where code[i] sits inside a \\text{...}/
    \\mbox{...} group — INCLUDING a group carried open from a previous line
    (carry_depth > 0). Returns (intext, new_carry_depth). This closes the
    LANG-RAW-IN-MATH false positive on the continuation lines of a multi-line
    \\text: an \\en{...} there is legitimately inside the \\text, but the
    line-based _blank_text_mbox cannot know that."""
    intext = [False] * len(code)
    depth = carry_depth
    starts = {m.end() - 1 for m in _TEXT_OPEN.finditer(code)}
    for i, ch in enumerate(code):
        if depth > 0:
            intext[i] = True
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
        elif i in starts:
            depth = 1
            intext[i] = True
    return intext, depth


def _blank_text_mbox(code: str) -> str:
    """Replace every \\text{...}/\\mbox{...} group (with content) by spaces,
    preserving length so positions still align with the math mask. Lets a
    \\h/\\en INSIDE a \\text/\\mbox not count as 'bare in math'."""
    out = list(code)
    for mm in re.finditer(r'\\(?:text|mbox|intertext|shortintertext)\{', code):
        b = mm.end() - 1                      # index of the '{'
        end = _match_brace(code, b)
        for k in range(mm.start(), end):
            out[k] = ' '
    return ''.join(out)


def _wrapper_depth(code: str):
    """depth[i] = how many \\en{...}/\\mbox{...} groups CONTAIN position i (inside
    the braces). Used so an island already wrapped in an outer LTR container
    (\\en{\\code{X}$\\to$Y}) is not flagged by the island-next-to-math check."""
    depth = [0] * len(code)
    for m in re.finditer(r'\\(?:en|mbox)\{', code):
        b = m.end() - 1                       # index of the '{'
        end = _match_brace(code, b)           # past the matching '}'
        for k in range(b + 1, end - 1):       # strictly inside the braces
            depth[k] += 1
    return depth


def latin_outside_isolation(inner: str) -> bool:
    """True if `inner` has real Latin once \\command names and isolated
    (\\en/\\code/\\texttt) spans are removed."""
    s = re.sub(r'\\(en|code|texttt)\{[^{}]*\}', '', inner)
    s = re.sub(r'\\[a-zA-Z]+', '', s)
    return bool(re.search(r'[A-Za-z]', s))


def _is_subsup_label(code: str, pos: int) -> bool:
    """True if the \\text{ starting at `pos` is a sub/superscript LABEL
    (\\underbrace{..}_{\\text{..}}, x^{\\text{..}}, \\xrightarrow{\\text{..}})
    rather than an operand — labels render RTL fine and are not the bug."""
    k = pos - 1
    while k >= 0 and code[k] == '{':
        k -= 1
    while k >= 0 and code[k] in ' \t':
        k -= 1
    return k >= 0 and code[k] in '_^'


def _skip_xarrow_args(code: str, k: int) -> int:
    """Skip an x-arrow's optional [below] and {above} arguments starting at k,
    so we can inspect the real operand that follows."""
    while k < len(code) and code[k] in '[{':
        opn = code[k]
        cls = ']' if opn == '[' else '}'
        depth = 1
        k += 1
        while k < len(code) and depth:
            if code[k] == opn:
                depth += 1
            elif code[k] == cls:
                depth -= 1
            k += 1
    return k


def _arrow_operand_hebrew(code: str, i: int, j: int) -> bool:
    """The immediate left/right operand of an arrow spanning code[i:j] is a
    Hebrew \\text{...} block or raw Hebrew (so the arrow flips under RTL)."""
    left = code[max(0, i - 28):i]
    rstart = _skip_xarrow_args(code, j)
    right = code[rstart:rstart + 28]
    if re.match(r'\s*\\text\{[^{}]*[' + _HEBR + r']', right):
        return True
    if re.match(r'\s*[' + _HEBR + r']', right):
        return True
    if re.search(r'\\text\{[^{}]*[' + _HEBR + r'][^{}]*\}\s*$', left):
        return True
    if re.search(r'[' + _HEBR + r']\s*$', left):
        return True
    return False


def scan_file(path: str):
    issues = []
    try:
        lines = open(path, encoding='utf-8').read().splitlines()
    except (OSError, UnicodeDecodeError) as e:
        return [(0, 'READ-ERROR', str(e))]

    in_tikz = False
    in_verbatim = False        # verbatim/lstlisting content is LITERAL — no rules apply
    axis_stack = []
    # UNDEFINED-COMMON-MACRO: if the document actually loads the package, the
    # macros are defined — drop them from the blacklist for this file.
    _src = '\n'.join(lines)
    _has_siunitx = bool(re.search(r'\\usepackage(\[[^\]]*\])?\{[^}]*siunitx', _src))
    _has_csquotes = bool(re.search(r'\\usepackage(\[[^\]]*\])?\{[^}]*csquotes', _src))
    # v3.23 (merged design): FIRST PASS collects macros the document defines
    # itself — those are never flagged, without skipping the whole line (a
    # definition line may still USE another undefined macro in its body).
    user_defined = set()
    _DEF_PAT = re.compile(
        r'\\(?:(?:re)?newcommand|providecommand|DeclareRobustCommand'
        r'|NewDocumentCommand|def)\s*\*?\s*\{?\\([A-Za-z@]+)')
    for _l in lines:
        for _m in _DEF_PAT.finditer(re.sub(r'(?<!\\)((?:\\\\)*)%.*', r'\1', _l)):
            user_defined.add(_m.group(1))
    mstate = {'display': False, 'env': 0, 'inline': False, 'paren': False}  # cross-line math state
    text_carry = 0        # open \text{}/\mbox{} depth carried across lines (v3.23.7)
    nc_lines = []         # per-line comment-stripped code ('' for verbatim lines)
    for n, line in enumerate(lines, 1):
        # verbatim/listing blocks: content is literal (never executed/typeset as
        # macros) — skip every rule, including comment-stripping (% is literal).
        if in_verbatim:
            if re.search(r'\\end\{(verbatim|lstlisting|Verbatim)\}', line):
                in_verbatim = False
            nc_lines.append('')
            continue
        if re.search(r'\\begin\{(verbatim|lstlisting|Verbatim)\}', line):
            in_verbatim = True
            nc_lines.append('')
            continue
        # strip inline comment — backslash-PARITY aware: an even run of
        # backslashes before % (e.g. table line-break \\%) still starts a comment.
        code = re.sub(r'(?<!\\)((?:\\\\)*)%.*', r'\1', line)
        nc_lines.append(code)

        # math mask for this line (advances cross-line block state)
        mask, mstate = math_mask(code, mstate)
        # v3.23.7: cross-line \text{} state — a blank line self-heals unbalanced
        # braces (TeX itself errors on a blank line inside \text), like math_mask.
        if not code.strip():
            text_carry = 0
        intext, text_carry = _line_text_spans(code, text_carry)

        # pgfplots axis balance — walk tokens IN ORDER (an \end before a
        # \begin on the same line is a stray end + a new unclosed begin)
        for am in re.finditer(r'\\(begin|end)\{axis\}', code):
            if am.group(1) == 'begin':
                axis_stack.append(n)
            elif axis_stack:
                axis_stack.pop()
            else:
                issues.append((n, 'AXIS-EXTRA-END',
                               r'\end{axis} with no matching \begin{axis}'))
        # math in a heading without \texorpdfstring
        if (HEADING_PAT.search(code) and re.search(r'(?<!\\)\$', code)
                and r'\texorpdfstring' not in code):
            issues.append((n, 'MATH-IN-HEADING', line.strip()[:90]))
        if r'\begin{tikzpicture}' in line:
            in_tikz = True
        english_ctx = ('foreignlanguage{english}' in line
                       or r'\en{' in line
                       or r'otherlanguage{english}' in line)
        if QUOTE_PAT.search(code) and not english_ctx:
            issues.append((n, 'QUOTES', line.strip()[:90]))
        if TTMATH_PAT.search(code) and not english_ctx:
            issues.append((n, 'TEXTTT-NEXT-TO-MATH', line.strip()[:90]))
        if BAREMATH_PAT.search(code) and not english_ctx:
            issues.append((n, 'BARE-IDENT-NEXT-TO-MATH', line.strip()[:90]))
        if not english_ctx:
            for m in TTPAIR_PAT.finditer(code):
                if '\\$' in m.group(1) or '\\$' in m.group(2):
                    issues.append((n, 'DOLLAR-CODE-SPLIT', line.strip()[:90]))
                    break
        if (LATPAREN_PAT.search(code) and not english_ctx
                and ' & ' not in line and not line.lstrip().startswith('%')):
            issues.append((n, 'LATIN-BEFORE-PAREN', line.strip()[:90]))
        # B2 (v3.21/.22): -- / --- renders as LITERAL hyphens under Frank Ruhl —
        #   next to Hebrew AND in the classic Latin/digit range idiom (1990--2000,
        #   Hong--Ou--Mandel): tlig never fires in this pipeline (verified).
        #   Skips: math (there - is a minus) EXCEPT inside \text{}/\mbox{} whose
        #   interior is text mode; \code/\texttt/\url/\path/\href spans (literal).
        code_nc = re.sub(r'\\(?:code|texttt|url|path|href)\{(?:[^{}]|\{[^{}]*\})*\}',
                         lambda mm: ' ' * len(mm.group()), code)
        _tspans = []
        for _tm in re.finditer(r'\\(?:text|mbox)\{', code_nc):
            _b = _tm.end() - 1
            _tspans.append((_b + 1, _match_brace(code_nc, _b) - 1))
        def _textmode(pos):
            return (not mask[pos]) or any(a <= pos < b for a, b in _tspans)
        _dash_done = False
        for m in HEB_DHYPHEN_PAT.finditer(code_nc):
            if _textmode(m.start()):
                issues.append((n, 'HEBREW-DOUBLE-HYPHEN',
                               code[max(0, m.start() - 6):m.start() + 12].strip()))
                _dash_done = True
        if not _dash_done:
            for m in LAT_DHYPHEN_PAT.finditer(code_nc):
                if _textmode(m.start() + 1):
                    issues.append((n, 'HEBREW-DOUBLE-HYPHEN',
                                   code[max(0, m.start() - 6):m.start() + 14].strip()))
                    break
        # B3 (v3.21): macros from packages the preamble does not load.
        #   Skip lines that DEFINE the macro (\providecommand{\SI}... is the
        #   user supplying it themselves — not an error). Known tradeoff: a
        #   definition line that also USES another unloaded macro is skipped too.
        for m in UNDEF_MACRO_PAT.finditer(code):
            name = m.group(1)
            if name in user_defined:
                continue                      # the document defines it itself
            if name == 'enquote' and _has_csquotes:
                continue                      # csquotes actually loaded
            if name != 'enquote' and _has_siunitx:
                continue                      # siunitx actually loaded
            pre = code[max(0, m.start() - 40):m.start()]
            if re.search(r'\\(?:(?:re)?newcommand|providecommand'
                         r'|DeclareRobustCommand|NewDocumentCommand|def)'
                         r'\s*\*?\s*\{?\s*$', pre):
                continue                      # this IS the definition site
            issues.append((n, 'UNDEFINED-COMMON-MACRO', m.group()))
        # B4 (v3.23.6): \providecommand on a TeX primitive / kernel command is a
        # silent no-op — the primitive keeps rendering (\ni -> ∋, not n_i).
        for m in PROVIDE_PRIMITIVE_PAT.finditer(code):
            issues.append((n, 'PROVIDECOMMAND-PRIMITIVE', m.group().strip()))
        # \en{}/\code{} island glued to inline math in TEXT -> reorders in RTL
        # (a trailing value/arrow lands on the wrong side). Independent of
        # english_ctx (this check is ABOUT \en/\code). Skip if it's in math, or
        # already wrapped in an outer \en{}/\mbox{} (the correct merged form).
        wdepth = _wrapper_depth(code)
        for m in ISLAND_MATH_PAT.finditer(code):
            if not mask[m.start()] and wdepth[m.start()] == 0:
                issues.append((n, 'ISLAND-NEXT-TO-MATH',
                               code[m.start():m.start() + 42].strip()))
        # v3.10: two \en/\code islands separated only by a comma/slash REORDER in
        # RTL text. Skip if in math (would be a bare-in-math error, caught below)
        # or if the first island is already inside an outer \en{}/\mbox{} (the
        # correct merged form, e.g. \en{\code{a}, \code{b}}).
        for m in ADJ_LTR_PAT.finditer(code):
            if not mask[m.start()] and wdepth[m.start()] == 0:
                issues.append((n, 'ADJACENT-LTR-ISLANDS',
                               code[m.start():m.start() + 48].strip()))

        # #12 HEBREW-FLOW-ARROW / HEBREW-EQUATION-ARROW (v3.14) — a rightward
        # arrow whose operands involve Hebrew renders BACKWARD under RTL (bidi
        # does not mirror arrow glyphs). NOT flagged: pure-math/code arrows
        # (s\to\infty, f:A\to B, x\mapsto y, \code{lw}\to\code{add}); Hebrew that
        # is only a sub/superscript LABEL (\underbrace{}_{\text{..}}) is ignored.
        # (a) bare arrow alone in inline math with Hebrew prose on a side
        for m in BARE_RARROW_DOLLAR_PAT.finditer(code):
            if wdepth[m.start()] > 0:
                continue  # inside \en{...}: the wrapped arrow is the DOCUMENTED fix
            if (HEB_CHAR2.search(code[max(0, m.start() - 30):m.start()])
                    or HEB_CHAR2.search(code[m.end():m.end() + 30])):
                issues.append((n, 'HEBREW-FLOW-ARROW',
                               code[max(0, m.start() - 18):m.end() + 18].strip()))
        # (b) math arrow with a Hebrew operand, OR an implication \Rightarrow on a
        # line carrying a (non-label) Hebrew \text operand (Hebrew -> RTL equation)
        line_heb_text = any(not _is_subsup_label(code, t.start())
                            for t in HEB_TEXT_PAT.finditer(code))
        for m in RARROW_PAT.finditer(code):
            if not mask[m.start()]:
                continue
            is_impl = m.group().startswith(('\\Rightarrow', '\\Longrightarrow'))
            if _arrow_operand_hebrew(code, m.start(), m.end()) or (is_impl and line_heb_text):
                issues.append((n, 'HEBREW-EQUATION-ARROW',
                               code[max(0, m.start() - 18):m.start() + 26].strip()))

        # -- text-inside-math checks (v3.8) ---------------------------------
        # #6 bare \h{ / \en{ in math (NOT inside \text/\mbox) -> rmfamily error
        blanked = _blank_text_mbox(code)
        for m in re.finditer(r'\\(?:h|en)\{', blanked):
            # v3.23.7: `intext` also covers a \text{} carried OPEN from a
            # previous line — an \en on a continuation line is inside the \text.
            if mask[m.start()] and not intext[m.start()]:
                issues.append((n, 'LANG-RAW-IN-MATH',
                               code[m.start():m.start() + 32]))
        # #7/#8 inspect each \text{...} that lives in math
        for mm in re.finditer(r'\\text\{', code):
            if not mask[mm.start()]:
                continue
            # v3.23.5: content is now MULTILINE-AWARE — if the \text{} group spans a
            # source line break, _text_content joins the following lines so the
            # paren/caret/colon checks still fire (the old code truncated at EOL).
            content = _text_content(lines, n - 1, code, mm.end() - 1)
            _disp = content[:48].replace('\n', ' ')
            bare = LANG_GROUP.sub('', content)         # drop \h{..}/\en{..}
            bare = re.sub(r'\\\(.*?\\\)', '', bare)     # nested \(..\) math is fine
            # #7 Latin + parens/brackets, not isolated by \en -> parens mirror.
            # (Bare Hebrew in \text is NOT flagged — it renders fine; \h optional.)
            # #7b (v3.23.4): the mirror also happens when the Latin IS in an \en but
            # the parens sit OUTSIDE it — \text{(\en{weak})} -> ")weak(". #7 misses
            # this (stripping \en leaves an empty "()", no Latin); _parens_wrap_only_latin
            # catches parens that wrap ONLY a Latin island. Skip if #7 already fired.
            if re.search(r'[A-Za-z]', bare) and re.search(r'[()\[\]]', bare):
                issues.append((n, 'TEXT-PARENS-IN-MATH',
                               '\\text{' + _disp + '}'))
            elif _parens_wrap_only_latin(content):
                issues.append((n, 'TEXT-PARENS-IN-MATH',
                               '\\text{' + _disp + '}'))
            # v3.10: \text{\en{label}:} in math/align — the colon sits OUTSIDE the
            # \en (in the RTL \text), so it ORPHANS to the wrong side (":s-channel"
            # instead of "s-channel:"). Fix: put the colon INSIDE -> \en{label:}.
            if re.search(r'\\en\{(?:[^{}]|\{[^{}]*\})*\}:', content):
                issues.append((n, 'MATH-TEXT-EN-COLON',
                               '\\text{' + _disp + '}'))
            # B1 (v3.21): a bare ^ or _ inside \text{} — text mode is not math,
            #   so it throws "! Missing $ inserted". Escaped \^ \_ are literal
            #   (fine); a nested $...$ inside \text is math (fine) — both stripped.
            _c = content.replace('\\$', '  ')            # escaped \$ is NOT a delimiter
            _c = re.sub(r'\$[^$]*\$', '', _c)             # nested $...$ math is fine
            content_nomath = re.sub(r'\\\(.*?\\\)', '', _c)   # nested \(...\) math too
            if re.search(r'(?<!\\)[\^_]', content_nomath):
                issues.append((n, 'TEXT-MATH-CARET',
                               '\\text{' + _disp + '}'))
            # BIDI-16 (v3.23.6): RAW Hebrew inside \text{} flanked on BOTH sides
            # by LTR islands (\en/\code/\texttt) — the two islands bite the RTL
            # run from both ends and the Hebrew renders REVERSED with displaced
            # parens: \text{\en{(}תעלה רחבה\en{)}} -> "הבחר הלעת". Compiles
            # clean; was caught only on the rendered page (PROCESS §8.6). Fix:
            # the whole label as ONE unit — \text{\h{(תעלה רחבה)}}. Hebrew
            # around a SINGLE island (\text{(הספק ב־\en{CMOS})}) renders fine
            # and stays silent; \h-wrapped Hebrew is an explicit RTL island and
            # is stripped before the test.
            # v3.23.7: nested $...$/\(..\) inside the \text is its OWN math
            # context — an island in there does not flank the outer Hebrew
            # (compiled: rendering identical with/without it). Strip it first,
            # exactly as _parens_wrap_only_latin does. And probe Hebrew LETTERS
            # only — a lone maqaf between islands does not reorder (compiled).
            s16 = re.sub(r'\$[^$]*\$', ' ', content)
            s16 = re.sub(r'\\\(.*?\\\)', ' ', s16, flags=re.S)
            s16 = re.sub(r'\\h\{(?:[^{}]|\{[^{}]*\})*\}', ' ', s16)
            isl16 = [i16.span() for i16 in LATIN_ISLAND.finditer(s16)]
            if len(isl16) >= 2:
                for h16 in HEB_LETTER.finditer(s16):
                    p16 = h16.start()
                    if (any(e <= p16 for _b, e in isl16)
                            and any(b > p16 for b, _e in isl16)):
                        issues.append((n, 'TEXT-HEBREW-BETWEEN-ISLANDS',
                                       '\\text{' + _disp + '}'))
                        break

        # Latin-in-\h — only inside tikz
        if in_tikz:
            for m in H_PAT.finditer(code):
                if latin_outside_isolation(m.group(1)):
                    issues.append((n, 'LATIN-IN-H-IN-TIKZ',
                                   '\\h{' + m.group(1)[:60] + '}'))
        if r'\end{tikzpicture}' in line:
            in_tikz = False
    # v3.23.7: a definition split across source lines (\providecommand<newline>
    # {\ni}) evades the per-line B4 scan — rescan the joined comment-stripped
    # source once, reporting only matches that actually span a line break.
    joined = '\n'.join(nc_lines)
    for m in PROVIDE_PRIMITIVE_PAT.finditer(joined):
        if '\n' in m.group():
            ln = joined.count('\n', 0, m.start()) + 1
            issues.append((ln, 'PROVIDECOMMAND-PRIMITIVE',
                           m.group().replace('\n', ' ').strip()))
    for ln in axis_stack:
        issues.append((ln, 'AXIS-NO-END',
                       r'\begin{axis} with no \end{axis} before \end{tikzpicture}'))
    issues.sort(key=lambda t: t[0])
    return issues


def main(argv):
    files = argv[1:]
    if not files:
        print(__doc__)
        return 2
    total = 0
    for path in files:
        issues = scan_file(path)
        for n, kind, text in issues:
            total += 1
            print(f"{path}:{n}: [{kind}] {text}")
    print('-' * 60)
    if total:
        print(f"\u2717 {total} issue(s) found.")
        print("  LATIN-IN-H-IN-TIKZ -> wrap the Latin in \\en{{...}} or \\code{{...}}")
        print("                       (or use bare Latin in the tikzpic island).")
        print("  QUOTES             -> replace ``...'' with gershayim \u05f4 .")
        print("  TEXTTT-NEXT-TO-MATH -> combine into one unit: \\code{{name=val}},")
        print("                        not \\texttt{{name}}$=val$ (it jams in RTL).")
        print("  ISLAND-NEXT-TO-MATH -> \\en{{x}}$=v$ / \\code{{x}}$\\to$y reorder in RTL")
        print("                        (\"=v\" jumps before x). Merge the math INSIDE")
        print("                        the island: \\en{{x $=v$}} / \\en{{\\code{{x}}$\\to$y}}.")
        print("                        Also \\en{{label}}: $math$ -> colon ORPHANS; merge:")
        print("                        \\en{{label: $math$}}. (A plain space \\en{{x}} $m$ is fine.)")
        print("  ADJACENT-LTR-ISLANDS -> \\en{{A}}, \\en{{B}} / \\en{{A}} / \\en{{B}} reorder to")
        print("                        \"B, A\" / \"B / A\". Merge into ONE island:")
        print("                        \\en{{A, B}} / \\en{{A / B}} / \\en{{\\code{{a}}, \\code{{b}}}}.")
        print("  HEBREW-FLOW-ARROW  -> a rightward arrow between Hebrew prose points")
        print("                        BACKWARD in RTL (שלב $\\to$ שלב). Use $\\leftarrow$")
        print("                        / $\\Leftarrow$ (points to the next step/conclusion).")
        print("  HEBREW-EQUATION-ARROW -> a rightward/implication arrow in an equation that")
        print("                        holds a Hebrew \\text OPERAND flips (the Hebrew makes")
        print("                        the eq RTL). Rewrite with a colon or Hebrew connective")
        print("                        (\\text{{אם}} ... \\text{{אז}}, \\text{{גורר}}), or use \\Leftarrow.")
        print("                        Pure math (s\\to\\infty, \\code{{lw}}\\to\\code{{add}}) is fine.")
        print("  MATH-TEXT-EN-COLON -> \\text{{\\en{{label}}:}} in align orphans the colon")
        print("                        (\":label\"). Put it inside: \\text{{\\en{{label:}}}}.")
        print("  DOLLAR-CODE-SPLIT  -> combine into one unit: \\code{{\\$a/\\$b}},")
        print("                        not \\texttt{{\\$a}}/\\texttt{{\\$b}} (the $ misplaces).")
        print("  LATIN-BEFORE-PAREN -> \\en{{(...)}} the paren; a Latin token before")
        print("                        '(' in Hebrew text mirrors it (CPI (Cycles...)).")
        print("  LANG-RAW-IN-MATH   -> \\h/\\en are invalid bare in math. Wrap in")
        print("                        \\text{{...}}: \\text{{\\h{{..}}}} / \\text{{\\en{{..}}}}.")
        print("  TEXT-PARENS-IN-MATH -> \\text{{Eng (parens)}} mirrors parens in RTL;")
        print("                        use \\text{{\\en{{Eng (parens)}}}} (\\en forces LTR).")
        print("                        f(Hebrew): \\text{{f}}(\\text{{\\h{{..}}}}) — parens at")
        print("                        math level, NOT inside the \\text box.")
        print("  AXIS-NO-END        -> add \\end{{axis}} before \\end{{tikzpicture}}. A")
        print("                        missing one throws 'Extra }}' that CASCADES to the")
        print("                        next \\end{{otherlanguage}}/island close.")
        print("  AXIS-EXTRA-END     -> stray \\end{{axis}} with no \\begin{{axis}}.")
        print("  MATH-IN-HEADING    -> wrap heading math: \\texorpdfstring{{$..$}}{{ascii}}")
        print("                        (ascii arg free of $ ^ _), else bookmark garbles.")
        print("  HEBREW-DOUBLE-HYPHEN -> a -- / --- run stays literal hyphens (no tlig in")
        print("                        Frank Ruhl) — next to Hebrew AND between Latin/digits")
        print("                        (1990--2000, Hong--Ou--Mandel). Type — (U+2014) /")
        print("                        – (U+2013) directly. SINGLE hyphens (Hong-Ou-Mandel) fine.")
        print("  UNDEFINED-COMMON-MACRO -> \\enquote/\\SI/\\qty need csquotes/siunitx, which")
        print("                        this preamble does not load. Load the package, or")
        print("                        rewrite: gershayim \\u05f4..\\u05f4 for quotes; plain math+unit.")
        print("  TEXT-MATH-CARET    -> ^ or _ inside \\text{{}} throws 'Missing $' (text is")
        print("                        not math). Move the math OUT: (\\text{{..}}45^\\circ),")
        print("                        not \\text{{..45^\\circ}}.")
        print("  PROVIDECOMMAND-PRIMITIVE -> \\providecommand on a TeX primitive (\\ni, \\Re,")
        print("                        \\Im, \\det...) is a SILENT no-op — the primitive keeps")
        print("                        rendering (\\ni -> ∋). Use \\renewcommand or another name.")
        print("  TEXT-HEBREW-BETWEEN-ISLANDS -> raw Hebrew between two \\en{{}} islands inside")
        print("                        \\text{{}} renders REVERSED. Make the label ONE unit:")
        print("                        \\text{{\\h{{(תעלה רחבה)}}}}, not \\en{{(}}עברית\\en{{)}}.")
        return 1
    print("\u2713 clean: no Latin-in-\\h-in-TikZ, quotes, code-next-to-math, split-$,")
    print("  Latin-before-paren, raw \\h/\\en or mirrored-parens in math,")
    print("  unbalanced axis, or unwrapped heading math.")
    print("  (Still verify visually: pdftoppm -png -r 110 doc.pdf page)")
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
