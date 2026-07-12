#!/usr/bin/env python3
"""selftest.py — regression lock for the skill's checkers (v3.23).

Runs check_bidi_figures.py and check_charset.py against an embedded corpus of
known-good and known-bad patterns, every one of which was verified against a
REAL compile/render during the v3.20→v3.23 hardening. Run this after ANY edit
to the checkers (or the preamble macros they assume): a failure means you
reintroduced a bug class that was already paid for.

Usage:  python3 scripts/selftest.py          (exit 0 = all pass, 1 = drift)
"""
import os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
BIDI = os.path.join(HERE, 'check_bidi_figures.py')
CHARSET = os.path.join(HERE, 'check_charset.py')

# Each case: (name, source, checker, set-of-rule-names-that-MUST-fire (empty = must be clean))
# Sources are single snippets; multiline via \n.
CASES = [
    # ---- HEBREW-DOUBLE-HYPHEN: true positives ------------------------------
    ('dash: Hebrew spaced ---',       'טקסט עברי --- עוד עברית.',                       'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    ('dash: frametitle --- + code',   '\\begin{exbox}[frametitle={דוגמה --- \\code{foo}}]', 'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    ('dash: digit range 1990--2000',  'בשנים 1990--2000 חלה עלייה.',                    'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    ('dash: Latin--Latin run',        'הניסוי של Hong--Ou--Mandel המפורסם.',            'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    ('dash: inside \\text in math',   '\\[ x=1 \\quad \\text{טווח -- עולם} \\]',        'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    ('dash: Hebrew TikZ node text',   '\\begin{tikzpicture}\n\\node {\\h{שלב א --- שלב ב}};\n\\end{tikzpicture}', 'bidi', {'HEBREW-DOUBLE-HYPHEN'}),
    # ---- HEBREW-DOUBLE-HYPHEN: must stay clean -----------------------------
    ('dash-ok: single hyphens',       'מונח \\en{Hong-Ou-Mandel} וטווח 3-5 ומילה דו-רמתית.', 'bidi', set()),
    ('dash-ok: TikZ path ops',        '\\begin{tikzpicture}\n\\draw (0,0) -- (1,1) node[above] {\\h{שלום}};\n\\draw (a) -- (b) --cycle;\n\\end{tikzpicture}', 'bidi', set()),
    ('dash-ok: --flag in \\code',     'הדגל \\code{--break-system-packages} חשוב.',     'bidi', set()),
    ('dash-ok: comment rule',         'טקסט תקין.\n%---------------------------',        'bidi', set()),
    ('dash-ok: math minus',           'ביטוי $a--b$ במתמטיקה (מינוס כפול).',            'bidi', set()),
    ('dash-ok: \\url with --',        'קישור \\url{http://x.com/a--b} כאן.',            'bidi', set()),
    # ---- TEXT-MATH-CARET ----------------------------------------------------
    ('caret: bare ^ in \\text',       '\\begin{equation}a \\text{\\en{(linear 45^\\circ)}}\\end{equation}', 'bidi', {'TEXT-MATH-CARET'}),
    ('caret: \\(..\\) math form',     'נניח \\(\\theta = \\text{linear 45^\\circ}\\) בקיטוב.', 'bidi', {'TEXT-MATH-CARET'}),
    ('caret: $$..$$ form',            '$$ E = \\text{energy 2^n} $$',                    'bidi', {'TEXT-MATH-CARET'}),
    ('caret: between escaped \\$',    '$v = \\text{price \\$5^k\\$ approx}$',            'bidi', {'TEXT-MATH-CARET'}),
    ('caret-ok: escaped \\_',         '\\begin{equation}b=\\text{file\\_name}\\end{equation}', 'bidi', set()),
    ('caret-ok: nested $..$',         '\\begin{equation}c=\\text{ערך $x^2$ כאן}\\end{equation}', 'bidi', set()),
    ('caret-ok: nested \\(..\\)',     '$f = \\text{term \\(x^2\\) here}$',               'bidi', set()),
    # ---- TEXT-PARENS-IN-MATH: parens OUTSIDE an \en island (v3.23.4) ---------
    ('parens: (\\en{}) only-Latin',    '\\begin{equation}\\alpha\\quad\\text{(\\en{weak})}\\end{equation}', 'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('parens: [\\en{}] brackets',      '$T_{\\text{[\\en{RAID}]}}$',                     'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('parens: (\\en, \\en) list',      '$\\text{(\\en{a}, \\en{b})}$',                   'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('parens: bare Latin+paren (#7)',  '\\begin{equation}\\text{Spec (TNR)}\\end{equation}', 'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('parens-ok: \\en{(weak)} inside', '\\begin{equation}\\alpha\\quad\\text{\\en{(weak)}}\\end{equation}', 'bidi', set()),
    ('parens-ok: (Hebrew \\en) mixed', '\\begin{equation}P\\quad\\text{(הספק ב־\\en{CMOS})}\\end{equation}', 'bidi', set()),
    ('parens-ok: pure Hebrew parens',  '\\begin{equation}\\text{\\h{(שארית)}}\\end{equation}', 'bidi', set()),
    ('parens-ok: \\en no parens',      '\\begin{equation}\\text{\\en{weak}}\\end{equation}', 'bidi', set()),
    # -- multiline \text{}: the scan joins continuation lines (v3.23.5) --------
    ('ml: paren bug across lines',     '\\begin{equation}\\alpha\\quad\\text{(\\en{weak})%\n}\\end{equation}', 'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('ml: paren bug (no %)',           '$\\text{(\\en{strong})\n} x$',                   'bidi', {'TEXT-PARENS-IN-MATH'}),
    ('ml: caret bug across lines',     '\\begin{equation}x=\\text{val\n2^n}\\end{equation}', 'bidi', {'TEXT-MATH-CARET'}),
    ('ml: colon bug across lines',     '\\begin{equation}\\text{\\en{s-channel}:\n} q\\end{equation}', 'bidi', {'MATH-TEXT-EN-COLON'}),
    ('ml-ok: correct across lines',    '\\begin{equation}\\text{\\en{(weak)}\n} x\\end{equation}', 'bidi', set()),
    ('ml-ok: Hebrew across lines',     '\\begin{equation}\\text{שלום\nעולם}\\end{equation}', 'bidi', set()),
    # ---- PROVIDECOMMAND-PRIMITIVE (v3.23.6, DEFECTS BLD-9) -------------------
    ('prim: \\providecommand{\\ni}',  '\\providecommand{\\ni}{n_{\\mathrm i}}',           'bidi', {'PROVIDECOMMAND-PRIMITIVE'}),
    ('prim: unbraced \\providecommand\\Re', '\\providecommand\\Re{\\operatorname{Re}}',   'bidi', {'PROVIDECOMMAND-PRIMITIVE'}),
    ('prim-ok: \\renewcommand{\\ni}', '\\renewcommand{\\ni}{n_{\\mathrm i}}',             'bidi', set()),
    ('prim-ok: non-primitive name',   '\\providecommand{\\ketbra}[2]{|#1\\rangle\\langle#2|}\n\\providecommand{\\niv}{n_{iv}}', 'bidi', set()),
    # ---- TEXT-HEBREW-BETWEEN-ISLANDS (v3.23.6, DEFECTS BIDI-16) --------------
    ('heb-isl: \\en{(}עברית\\en{)}',  '\\begin{align}I_D &\\propto V_{GS} && \\text{\\en{(}תעלה רחבה\\en{)}}\\end{align}', 'bidi', {'TEXT-HEBREW-BETWEEN-ISLANDS'}),
    ('heb-isl: multiline \\text',     '$\\text{\\en{(}תעלה רחבה\n\\en{)}} x$',            'bidi', {'TEXT-HEBREW-BETWEEN-ISLANDS'}),
    ('heb-isl-ok: \\h one unit',      '\\begin{align}I_D &\\propto V_{GS} && \\text{\\h{(תעלה רחבה)}}\\end{align}', 'bidi', set()),
    ('heb-isl-ok: single island',     '\\begin{equation}\\text{רוחב \\en{W} גדול}\\end{equation}', 'bidi', set()),
    # -- v3.23.7 hardening (adversarial review of the two new rules) -----------
    ('prim: definition split lines',  '\\providecommand\n{\\ni}{n_{\\mathrm i}}',        'bidi', {'PROVIDECOMMAND-PRIMITIVE'}),
    ('prim: single-letter \\d',       '\\providecommand{\\d}{\\mathrm{d}}',              'bidi', {'PROVIDECOMMAND-PRIMITIVE'}),
    ('prim-ok: \\dd differential',    '\\providecommand{\\dd}{\\mathrm{d}}',             'bidi', set()),
    ('heb-isl-ok: nested $..$ island','$y = \\text{שלום $a_{\\text{\\en{on}}}$ עולם \\en{X}}$', 'bidi', set()),
    ('heb-isl-ok: maqaf between isl', '$\\text{\\en{A}־\\en{B}}$',                       'bidi', set()),
    ('ml-ok: island continuation',    '$\\text{שלום\n\\en{ok}} x$',                      'bidi', set()),
    # ---- UNDEFINED-COMMON-MACRO ---------------------------------------------
    ('undef: enquote',                'כתב \\enquote{שלום} כאן.',                        'bidi', {'UNDEFINED-COMMON-MACRO'}),
    ('undef: SI',                     'מרחק \\SI{5}{\\meter} נמדד.',                     'bidi', {'UNDEFINED-COMMON-MACRO'}),
    ('undef: qtyrange form',          'טווח \\qtyrange{10}{20}{\\kilo\\meter} כאן.',     'bidi', {'UNDEFINED-COMMON-MACRO'}),
    ('undef: unit form',              'יחידות \\unit{\\meter\\per\\second} כאן.',        'bidi', {'UNDEFINED-COMMON-MACRO'}),
    ('undef-ok: definition line',     '\\providecommand{\\SI}[2]{#1\\,#2}',              'bidi', set()),
    ('undef: inside macro body',      '\\newcommand{\\myqty}{\\SI{5}{\\meter} בקירוב}',  'bidi', {'UNDEFINED-COMMON-MACRO'}),
    ('undef-ok: defined then used',   '\\providecommand{\\SI}[2]{#1\\,#2}\nמרחק \\SI{5}{\\meter} נמדד.', 'bidi', set()),
    ('undef-ok: package loaded',      '\\usepackage{siunitx}\nמרחק \\SI{5}{\\meter} נמדד.', 'bidi', set()),
    ('undef-ok: lookalikes',          'נוסחה $\\sin\\theta+\\sigma_x\\sim\\angle$ ו-\\sgn.', 'bidi', set()),
    ('undef-ok: verbatim body',       '\\begin{verbatim}\n\\SI{5}{\\meter} \\enquote{x}\n\\end{verbatim}', 'bidi', set()),
    ('undef-ok: lstlisting body',     '\\begin{lstlisting}\n# uses \\SI{5}{m} literally\n\\end{lstlisting}', 'bidi', set()),
    # ---- legacy rules: the v3.22 repro set ----------------------------------
    ('legacy: \\en island + math',    'ולכן \\en{hit time}$=1$ מתקבל.',                  'bidi', {'ISLAND-NEXT-TO-MATH'}),
    ('legacy-ok: documented arrow fix', 'העבר את \\en{\\code{Rt}$\\to$\\code{ForwardB}} בצנרת.', 'bidi', set()),
    ('legacy: bare \\h in \\(..\\)',  'נגדיר את הגודל \\(\\h{מהירות}\\) ונמשיך.',        'bidi', {'LANG-RAW-IN-MATH'}),
    ('legacy-ok: \\h in intertext',   '\\begin{align}\nx &= 1\\\\\n\\intertext{\\h{הנחת היסוד} כאן}\ny &= 2\n\\end{align}', 'bidi', set()),
    ('legacy-ok: comment after \\\\%', 'אחד & שתיים \\\\% TODO ``old quotes`` and \\SI{5}{m}\nשלוש & ארבע \\\\', 'bidi', set()),
    ('legacy-ok: escaped \\$ heading', '\\section{עלות התוכנית ב-\\$ לחודש}',            'bidi', set()),
    ('legacy: math in heading',       '\\section{פעימת $\\pi$ כאן}',                     'bidi', {'MATH-IN-HEADING'}),
    ('legacy: axis end-then-begin',   '\\begin{tikzpicture}\n\\end{axis}\\begin{axis}[w]\n\\end{tikzpicture}', 'bidi', {'AXIS-EXTRA-END', 'AXIS-NO-END'}),
    ('legacy: 2-level island nesting', 'ולכן \\en{\\textbf{\\code{hit}}}$=1$ מיד.',      'bidi', {'ISLAND-NEXT-TO-MATH'}),
    ('legacy: adjacent islands',      'ספרים: \\en{Griffiths}, \\en{Thomson} כאן.',      'bidi', {'ADJACENT-LTR-ISLANDS'}),
    ('legacy-ok: merged island',      'ספרים: \\en{Griffiths, Thomson} כאן.',            'bidi', set()),
    ('legacy: quotes',                'ציטוט ``שגוי`` כאן.',                             'bidi', {'QUOTES'}),
    ('legacy-ok: gershayim',          'ציטוט ״נכון״ כאן.',                               'bidi', set()),
    # ---- charset -------------------------------------------------------------
    ('charset: Arabic confusable',    'מילה עם ر ערבית.',                                'charset', {'STRAY'}),
    ('charset: cantillation tofu',    'טעם ל֑א כאן.',                                    'charset', {'STRAY'}),
    ('charset: bidi control mark',    'סימן ‏ נסתר.',                               'charset', {'STRAY'}),
    ('charset-ok: degree+sheqel',     'זווית 45° ומחיר 100₪.',                           'charset', set()),
    ('charset-ok: maqaf+gershayim',   'אור־חומר ו״ציטוט״ וגרש ג׳יינס וניקוד קָמָץ.',      'charset', set()),
    ('charset-ok: dashes',            'קו — ארוך ו-– טווח.',                             'charset', set()),
    ('charset-ok: comment glyph',     'טקסט תקין. % הערה עם ★ בפנים',                    'charset', set()),
]


def run_case(name, src, which, expect):
    # v3.23.1: system temp dir, NOT dir=HERE — deployed skills are mounted
    # read-only (e.g. /mnt/skills/user), and writing scratch files into the
    # skill's own scripts/ dir crashed there with PermissionError (measured
    # as an unprivileged user). Checker paths are absolute; snippets include
    # nothing — nothing needs the cwd.
    with tempfile.NamedTemporaryFile('w', suffix='.tex', delete=False,
                                     encoding='utf-8') as f:
        f.write(src + '\n')
        path = f.name
    try:
        tool = BIDI if which == 'bidi' else CHARSET
        out = subprocess.run([sys.executable, tool, path],
                             capture_output=True, text=True).stdout
        base = os.path.basename(path)
        hits = set()
        for line in out.splitlines():
            if line.startswith(base) or line.startswith(path):
                m = re.search(r'\[([A-Z-]+)\]', line)
                hits.add(m.group(1) if m else 'STRAY')
        ok = (hits >= expect) and (not expect or True) and (expect or not hits)
        # exact semantics: every expected rule fired; if none expected, nothing fired
        ok = expect.issubset(hits) if expect else (len(hits) == 0)
        return ok, hits
    finally:
        os.unlink(path)


def main():
    failures = []
    for name, src, which, expect in CASES:
        ok, hits = run_case(name, src, which, expect)
        status = 'ok ' if ok else 'FAIL'
        print(f"  [{status}] {name:34} expected={sorted(expect) or 'clean'} got={sorted(hits) or 'clean'}")
        if not ok:
            failures.append(name)
    print('-' * 72)
    if failures:
        print(f"✗ selftest: {len(failures)}/{len(CASES)} case(s) DRIFTED: {failures}")
        return 1
    print(f"✓ selftest: all {len(CASES)} cases pass — checkers match the verified corpus.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
