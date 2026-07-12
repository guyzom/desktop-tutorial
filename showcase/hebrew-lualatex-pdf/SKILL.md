---
name: hebrew-lualatex-pdf
description: Build polished academic PDFs in Hebrew (or mixed Hebrew/English) with real, vector-rendered LaTeX math, TikZ/pgfplots diagrams, code listings, and colored boxes, using a tested LuaLaTeX + babel bidi pipeline. Use whenever the user wants a Hebrew document with equations, diagrams, or code — lecture summaries, problem sets, course notes, math/physics/CS reports, study anthologies ("לקט"), "סיכום", "דף נוסחאות", "מסמך אקדמי" — especially when they want real LaTeX/.tex output rather than HTML, or the document mixes Hebrew prose with LaTeX math, TikZ figures, MIPS/assembly listings, or quantum circuits. Trigger even when the user just says "תבנה PDF עם נוסחאות" or "make this into a nice Hebrew document". The hard part is making Hebrew RTL coexist with LTR math/Latin/code without tofu, reversed labels, mirrored parens, or overflowing boxes; this skill encodes the preamble, isolation macros, content rules, and checks that solve it. For Hebrew docs without math/figures prefer .docx; English-only, plain LaTeX.
license: For personal use.
---

# Hebrew + Math + Figures academic PDFs (LuaLaTeX)

Produce typeset PDFs in Hebrew with real LaTeX math, TikZ/pgfplots diagrams,
code listings, colored definition/theorem/note/example boxes, quantum circuits,
a title page, and a TOC — RTL Hebrew prose with correctly-embedded LTR content.
Battle-tested: this pipeline built an **80-page quantum-computing summary**, a
**197-page computer-architecture anthology**, and a **192-page / 440-equation
document**, all with 0 missing characters. Version history and the empirical
story behind each rule live in `CHANGELOG.md` (not needed for use).

The single hardest problem is getting Hebrew (RTL) and everything-LTR — math,
Latin words, code, diagram labels — to coexist without glyphs turning into tofu
(□), text reversing, or parentheses mirroring. Everything below exists to solve
exactly that. Follow the steps in order — do not skip step 0 or verification.

## Three reference files (read the one you need)

- **`references/content-style.md`** — **READ THIS FIRST when producing a study
  guide / summary / לקט / מסמך אקדמי.** It is the deep dive on **what to write**:
  the density signature, the per-chapter rhythm (idea → numbered equation →
  one-line intuition), box discipline, the worked-exercise format, front-matter
  and the connective summary chapter — all with verbatim few-shot exemplars. The
  engine below makes a doc *compile clean*; this file makes it *not come out
  thin*. The thin-output problem is a content problem, and this is its fix.
- **`references/recipe.md`** — the deep dive on **Hebrew + math**: the `no-math`
  bug, fonts & Latin fallback, macro clashes, hyperref/bookmarks, quantum
  circuits, the full line-by-line preamble. Read it for math/circuit work.
- **`references/figures-boxes-listings.md`** — the deep dive on **mixed
  direction in figures, boxes, titles, code, and quotes**: the `\h`/`\en`/`\code`
  trio, the "Latin-in-`\h`-inside-TikZ reverses" bug, frametitle code
  scrambling, listing-in-box overflow, gershayim quotes, tables, margin
  overflow. Read it the moment you add a TikZ diagram, a code listing, a
  table, or a box with a code title.

## When to use this vs. the HTML route

| Need | Tool |
| :--- | :--- |
| Real LaTeX math, numbered equations, `.tex` deliverable, cross-refs, template | **this skill** (LuaLaTeX) |
| TikZ/pgfplots diagrams, code listings, colored boxes, quantum circuits, long multi-part document | **this skill** |
| Very fast design iteration / web-page-like layout freedom | `hebrew-academic-pdf` (HTML→WeasyPrint) |
| No full TeX install and no root to install one | `hebrew-academic-pdf` — this skill cannot run there |

## Step 0 — Environment check (mandatory, before anything)

```bash
kpsewhich luaotfload-main.lua    # non-empty path? engine ready → step 1
```

If empty, install (cloud sandboxes usually run as root, no `sudo` needed):

```bash
apt-get install -y texlive-luatex texlive-lang-other
kpsewhich luatexbase.sty         # verify: path, not empty
pip install --break-system-packages pymupdf   # required by the render gate (step 3)
```

No root / apt blocked / packages unavailable → **stop; use `hebrew-academic-pdf`.**
**Cloud sandboxes reset between tasks** — re-run step 0 every task. The Hebrew
locale file is `babel-he.ini` (not `babel-hebrew.ini`).

### Fonts

```bash
bash scripts/setup_fonts.sh                                  # Frank Ruhl Libre + Heebo → ~/.fonts
python3 scripts/font_coverage.py ~/.fonts/FrankRuhlLibre-Regular.ttf   # verify Hebrew coverage
```

A font can compile fine and still render every Hebrew letter as tofu. **Verify
coverage; don't assume.** DejaVu Serif is a Latin fallback inside Hebrew, never
the Hebrew body font.

**Font-specific facts** (build.sh warns if the log shows a different body font,
because these stop being true): Frank Ruhl Libre has **no `tlig`** — `---` stays
three hyphens, so **type `—` (U+2014) directly** (flagged `HEBREW-DOUBLE-HYPHEN`
next to Hebrew AND between Latin letters or digits — `Hong--Ou--Mandel`,
`1990--2000` — since those runs sit in the same Frank Ruhl body text; single
hyphens are fine, and `\code{}`/`\url{}`/TikZ path `--` are exempt); and it has
**no italic face** — the preamble synthesizes one (next section) so `\emph`
stays visible.

## Step 1 — Preamble

Use `assets/preamble.tex` verbatim (`\input` it or paste it). Compile with
`lualatex` only. For a short doc, change `report` → `article` at the top —
the preamble is class-aware (the `tbl` table counter binds to `chapter` when
it exists, `section` otherwise), so `article` compiles without edits.

What the preamble bundles, on top of the math setup from `recipe.md`:

- **The direction trio** `\h{}` (Hebrew/RTL island), `\en{}` (Latin/LTR
  isolate), `\code{}` (`\en` + monospace) — see Rule 7 below.
- **`\texttt` is direction-safe** — redefined to LTR-isolate its content
  (guarded by `\ifmmode`), so a paren/bracket/`$` inside `\texttt{}` (MIPS
  `0($s0)`, `$rs`, `arr[i]`) does not mirror/scramble. `\code{}` is an explicit
  alias; both are safe. (`\texttt{Hebrew}` still tofus — the monospace font has
  no Hebrew.) NOTE: because `\texttt` is LTR-isolated, even letter-only
  adjacent runs (`\texttt{lw}/\texttt{sw}`) reorder — merge them
  (`\texttt{lw/sw}`); flagged `ADJACENT-LTR-ISLANDS`.
- **`\emph` is real, visible emphasis.** Frank Ruhl has no italic, so the
  preamble defines a **FakeSlant italic face** on the `\babelfont{rm}` line —
  `\emph`/`\textit` render visibly slanted, and nested `\emph` toggles back
  upright (verified at 300dpi; 0 errors / 0 missing glyphs). Prefer bold
  emphasis for a given doc? one line: `\renewcommand{\emph}[1]{\textbf{#1}}`.
- **`\thepage` is wrapped LTR** so folio digits cannot reverse (18→81) in the
  RTL footer; the render gate (step 3) verifies the printed sequence anyway.
- **`\emergencystretch=3em`** rescues the small (~2–13pt) inline-prose
  overfulls Hebrew leaves when an unbreakable `\en{}`/math island lands at the
  margin. It touches ONLY those tie-break lines — display-math/table overfulls
  still surface for the content pass.
- **`\ketbra` and `\expval`** are provided (`\providecommand`) — quantikz
  defines neither.
- **`tikzpic`** — an LTR island for every `tikzpicture` (mirrors `qcirc`).
- **Six `mdframed` boxes** — `defbox`/`thmbox`/`notebox`/`exbox`/`warnbox`/
  `keybox`, each with inner padding so listings don't overflow.
- **`tablebox` + `\tabcap`** — the unified table wrapper: subtle uniform slate
  frame + auto-numbered "טבלה N.M." caption rendered *inside* the frame. Use for
  **every** table; never `\begin{table}`+`\caption*` (which leaks a stray
  "טבלה N : *" line and inconsistent numbering, since `caption` is not loaded).
- **`asm`/`cstyle` listing styles** with the box-overflow fix
  (`resetmargins=true` + `framexleftmargin=0pt`), and an `asmblock` LTR wrapper.
- **12pt + `\linespread{1.3}`** — readable defaults for a study guide (trim if
  you want denser output).

## Step 2 — The content rules that matter

### Step 2a — Content density & structure (do this BEFORE worrying about bidi)

A document can compile with zero missing glyphs and still be a **failure** if the
content is thin — long prose chapters, few numbered equations, no boxes, no
exercises, no rhythm. That is the single most common way output disappoints, and
it has nothing to do with the engine. **`references/content-style.md` is the fix**
and is mandatory reading for any study guide / summary / לקט / מסמך אקדמי.

The density signature to hit (from the 100-page reference doc — ~53 chapters,
143 numbered equations, 85 boxes, ~30 worked exercises):

- **Every sentence carries information.** Delete filler, soft intros, "as we saw."
- **Chapter = one idea, ~1–2.5 pages**, built as *idea → boxed definition/theorem
  → numbered equation → one-line intuition*. Not a lecture; a closed unit.
- **≥1 numbered equation and ~1–2 short boxes per chapter.** Numbered equations
  are the spine, not decoration. Boxes hold the *core only* (≤5 lines), discussion
  goes in prose after.
- **Never 3+ consecutive prose paragraphs** with no equation/box/list — that's the
  tell that content is missing.
- **A dedicated solved-exercises Part** at the end: each exercise *question (exbox)
  → step-by-step solution with numbered equations → one bold idea/takeaway line*.
- **Front matter**: short intro (one "what this is" line + a one-paragraph map of
  the Parts + a notation `notebox`). **Appendices**: identities, reference tables,
  a condensed formula sheet. **A connective summary chapter** ("התמונה הגדולה")
  before the appendices that *links* the material rather than repeating it.

`content-style.md` has verbatim few-shot exemplars for each of these — imitate
them. If your draft has 4-page chapters, a chapter with no numbered equation, or
zero exercises, you have reverted to the thin default: fix it before compiling.

Four structural rules that pair with the density signature:

- **Balance.** The default vehicle is **prose, standalone numbered equations,
  and (neutral gray) tables**; the six colored boxes are a **minority (~⅓ of
  content) for semantic emphasis only**. The gray `tablebox` is a data frame,
  *not* a colored box. `check_content_density.py` warns both ways — thin AND
  over-boxed (>~55%; the reference לקט is a healthy 35%).
- **Glossary / symbol→meaning content is a two-column table, not bullets.**
- **Short reference boxes take `nobreak=true`** so they move whole instead of
  orphaning a row.
- **Code columns in tables**: wrap the table in `otherlanguage{english}`
  (uniform left-aligned LTR), use a nested left-aligned `tabular` for
  multi-line code cells, and **never mix Hebrew inside a code sequence** (use
  `#`-comments / a separate column / the caption) — `\beginL`/`\endL` are
  undefined under luatex. **Start any table from `assets/example_tables.tex`**
  — copy the closest of its five proven patterns and swap content, rather than
  hand-building and re-hitting the RTL / `\caption*` / overflow traps.

**Margin-overflow (Overfull hbox) playbook.** Wide unbreakable LTR islands (a
single math island like `$(a),(b),(c)$`, or a `\code{}` monospace run) overflow
the margin/box. Fixes, in order of preference: a compact single island; **one
line per numbered item** (`\\`) in step-boxes; a two-column tabular for
code-lists; `{\small …}` for a too-wide `align*`; rephrasing so a break
opportunity precedes a trailing code island. The empirical loop: collect
`Overfull \hbox` from the log (build.sh sorts visible >5pt offenders by
severity), fix, re-verify visually; sub-3pt residues are acceptable.

### Step 2b — The bidi/math content rules

The math rules (Rules 1–6) are in `recipe.md`. The essentials: math just works
inside RTL prose, and **any _text_ inside math goes in a `\text{}`** (v3.8) —
Hebrew `\text{...}` (bare Hebrew is fine; `\h` optional), plain Latin
`\text{...}`, Latin-with-parentheses `\text{\en{...}}`. **The one hard rule:
never put a bare `\h{}`/`\en{}` _directly_ in `$…$`** (outside a `\text`) — that
is the `\rmfamily invalid in math` error. Full table in the box just below Rule 7.

The **figure/box/listing rules** (full detail + scripts in
`references/figures-boxes-listings.md`) — the essentials:

### Rule 7 (most important for figures) — the direction-isolation trio

`bidi=basic` reorders mixed Hebrew/Latin correctly **in prose and tables**, but
**NOT inside TikZ nodes**. Latin wrapped in `\h{}` inside a node comes out
**reversed** (`Datapath`→`htapataD`, `CPU`→`UPC`) and parentheses **mirror**.

- **Hebrew-only node** → `\h{...}`.
- **Latin/code-only node** → bare text inside the `tikzpic` island (no `\h`).
- **Mixed node** → wrap all in `\h{...}` for RTL base, and isolate every
  Latin/paren chunk with `\en{}` / `\code{}`:

```latex
\node {\h{מעבד \en{(CPU)}}};   % ✅   not  \node {\h{מעבד (CPU)}};   ❌ → )UPC(
\node {\en{Datapath}};         % ✅   not  \node {\h{Datapath}};     ❌ → htapataD
```

Parentheses around **Hebrew** are fine (`\h{זמן (מחזורים)}`); only **Latin**
inside `\h{}` needs isolation.

#### Text inside math (v3.8) — the unified rule

A bare `\h`/`\en`/`\code` is invalid in math **only when used directly** (outside
a `\text`). Put any text that sits inside math in a `\text{}`:

| in math you want… | write | not (and why) |
|---|---|---|
| a Hebrew label | `\text{...}` (bare Hebrew is fine; `\h` optional/harmless) | bare `\h{...}` **outside** `\text` → `\rmfamily` error |
| a plain Latin word | `\text{...}` | bare `\en{...}` → `\rmfamily` error |
| Latin **with `( )` or `[ ]`** | `\text{\en{...}}` | `\text{...}` → parens **mirror** (`Spec (TNR(`) |
| a function on a Hebrew/text arg | `\text{f}(\text{...})` | `\text{f(arg)}` → parens inside the box mirror |
| code | `\mathtt{...}` / `\texttt{...}` | — |

**Bare Hebrew inside `\text` renders correctly** — `\text{מהירות}` and
`\text{\h{מהירות}}` are identical (verified empirically); `\h` there is optional.
Parens around **pure Hebrew** in math (`\text{\h{(שארית)}}`, `ESS \h{(מוסבר)}`)
are also fine. `\mbox{...}` works too but doesn't scale in scripts, so prefer
`\text{}`. `scripts/check_bidi_figures.py` flags the two real mistakes:
`LANG-RAW-IN-MATH` (bare `\h`/`\en` in math) and `TEXT-PARENS-IN-MATH`.

### Rule 8 — code next to math: one `\code{}` unit, not `\texttt{}` + math

A `frametitle` is RTL context; bare `\texttt{C code;}` lets bidi fling the
trailing `;` to the front: `;if (i==j)...`. Use `\code{}` (LTR-isolated):

```latex
\begin{exbox}[frametitle={דוגמה — \code{if (i==j) f=g+h; else f=g-h;}}]   % ✅
```

The **same jam happens in body prose** when a `\texttt{}` identifier sits
directly next to math — `\texttt{ALUOp}$=10$` renders as `10ALUOp` (the number
glues to the name, the `=` floats), because `\texttt{}` sets monospace but not
direction, so the Latin run and the math run collide. Wrap the **whole
assignment as one LTR unit**:

```latex
\texttt{ALUOp}$=10$              % ❌ → 10ALUOp
\code{ALUOp=10}                  % ✅   one clean LTR unit
\code{\$rs + \$rt}               % ✅   not \texttt{\$rs}$+$\texttt{\$rt}
```

The same reorder hits when the label is **prose, not code**, and the value is a
separate math run — `\en{hit time}$=1$` → `=1hit time`, `\en{offset}$=\log_2 16=4$`
→ `4offset…`, or an arrow `\code{Rt}$\to$\code{ForwardB}` → reversed
`ForwardB→Rt`. Fix: merge the math **inside one `\en{}`** so name + value form a
single LTR unit:

```latex
\en{hit time}$=1$                  % ❌ → "=1hit time"
\en{hit time $=1$}                 % ✅   "hit time = 1"
\code{Rt}$\to$\code{ForwardB}      % ❌ → reversed
\en{\code{Rt}$\to$\code{ForwardB}} % ✅   wrap code+arrow as one unit
```

A **colon between an `\en{}` label and math** triggers the same reorder — the
colon orphans to the wrong side: `\en{s-channel}: $q=p_1+p_2$` renders
`q=p_1+p_2 :s-channel`, and `(\en{detector-stable}: $p,n,e$)` puts the list
before the label. (A plain **space** with no colon, `\en{word} $x$`, is fine —
verified; only the colon, or zero-gap adjacency, reorders.) Merge the whole unit:

```latex
\en{detector-stable}: $p,n,e$      % ❌ → ":detector-stable" orphaned
\en{detector-stable: $p,n,e$}      % ✅   one LTR unit, colon stays put
```

`check_bidi_figures.py` flags all of the above as `ISLAND-NEXT-TO-MATH` (colon
variant v3.10).

### Rule 8b (v3.10) — adjacent LTR islands reorder: merge comma/slash lists

The root of a whole family of "reversed Latin" bugs: **two or more LTR runs
(`\en{}`, `\code{}`, or math) separated only by a neutral char (comma, slash,
colon) REORDER under RTL.** A book list, a `BaBar, Belle`, a `keV, MeV`, a
`Breit-Wigner / Lorentzian` all come out **backwards** — each `\en{}` is its own
RTL-ordered island, so they print right-to-left:

```latex
\en{Griffiths}, \en{Thomson}, \en{PDG}   % ❌ → "PDG, Thomson, Griffiths"
\en{Griffiths, Thomson, PDG}             % ✅   one island, forward order
\en{Breit-Wigner} / \en{Lorentzian}      % ❌ → "Lorentzian / Breit-Wigner"
\en{Breit-Wigner / Lorentzian}           % ✅
\code{lw}, \code{sw}                     % ❌ → "sw, lw"
\en{\code{lw}, \code{sw}}                % ✅   wrap the whole code list in \en
```

**Rule: any run of Latin/code/math joined only by neutrals goes in ONE `\en{}`.**
A **period** (`\en{First}. \en{Second}`) and a plain **space** (`\en{A} \en{B}`)
do *not* reorder — only comma/slash (between islands) and colon (before math).
Flagged `ADJACENT-LTR-ISLANDS`. This is invisible in the source and compiles
clean; the checker is the only pre-render guard.

For a multi-step description (pipeline stages, a control-signal list), put one
step per line (`\\`) and the assignments on a dedicated line as `\code{}` units —
reads like equations. Stage labels: put the colon **inside** the isolate,
`\textbf{\en{IF:}}` — a colon *outside* (`\textbf{\en{IF}:}`) can orphan to the
wrong side, and inside an `align`/`\text{}` it definitely does (`:IF` instead of
`IF:`). Full example in `references/figures-boxes-listings.md`.

### Rule 9 — code listings inside boxes: stop the overflow

A listing inside an `mdframed` box computes margins from the page, so its frame
and line numbers spill out the box border. The preamble's `asm`/`cstyle` styles
already fix this with `resetmargins=true` + `framexleftmargin=0pt`, and the
boxes have `innerleftmargin`/`innerrightmargin`. Wrap listings in `asmblock`.

### Rule 10 — Hebrew quotation marks: gershayim ״, not `` `` ``/`''`

LaTeX `` `` ``/`''` give mismatched English curly quotes (“ ”), wrong for Hebrew.
Use **gershayim ״** (U+05F4), symmetric. A global replace also fixes Hebrew
abbreviations (ע״י, סה״כ). Script in `references/figures-boxes-listings.md`.

### Hebrew enumerate labels

Automatic Hebrew labels via `\setlist{label=...}` fail silently. Use explicit:
`\item[(\textbf{א})]`, `\item[(\textbf{ב})]`, …

### Colored boxes and circuits

Six `mdframed` boxes are defined (see preamble). `tcolorbox` is **not** an
option (breaks under bidi). Quantum circuits go in the `qcirc` island; TikZ
diagrams in the `tikzpic` island.

```latex
\begin{exbox}[frametitle={דוגמה — \code{strcpy} ב-MIPS}]
\begin{asmblock}
\begin{lstlisting}[style=asm]
strcpy: add  $t0, $zero, $zero   # i = 0
        ...
\end{lstlisting}
\end{asmblock}
\end{exbox}
```

## Step 3 — Build and verify (not optional)

```bash
bash scripts/build.sh doc.tex        # THE one-command verify (details below)
```

What one `build.sh` run does, in order — each stage exists because its bug
class occurred in a real build:

1. **Charset hard gate** (`check_charset.py`) — stray/confusable codepoints
   (Arabic ر/ي as Hebrew resh/yod, raw Greek/math glyphs) → silent tofu.
2. **Deterministic compile to the FIXED POINT** — `SOURCE_DATE_EPOCH` is
   exported, and the script recompiles (up to 5 passes) until two consecutive
   PDFs are byte-identical. A fixed pass count is wrong twice over (measured):
   pass 2 of a TOC document ships **stale TOC page numbers** (the TOC shifts
   content, so convergence lands at pass 3+), and hash-comparing pre-fixed-point
   passes reports phantom "nondeterminism" that is really deterministic aux
   convergence. The final identical pair IS the reproducibility proof;
   `REPRO=1` adds one independent confirmation pass. A non-convergence warning
   after 5 passes means genuine flakiness — audit visually with extra care.
3. **Log gates** — missing characters (hard fail), LaTeX errors (hard fail),
   hyperref bookmark warnings (warn), visible overfull hboxes >5pt listed by
   severity (warn).
4. **Render gate** (`check_pdf_render.py`, HARD fail) — the only automated
   check that inspects the **compiled PDF, not the source**: reversed Latin
   runs (a Latin word inside `\h{}` in a TikZ node renders per-glyph,
   mirrored — the checker reads the glyph runs and compares against source
   tokens), whole-token reversals, and footer-folio digit reversal (18→81).
   Every historical defect of this class compiled clean and passed every
   source-level check; this gate exists so that can't happen silently again.
5. **Font-identity warning** — if the log shows a body font other than Frank
   Ruhl, the font-specific rules (em-dash, FakeSlant) may not apply.
6. **Source linters** (informational) — `check_bidi_figures.py` (Rule 7–10
   violations, arrows, double-hyphens, undefined macros, unbalanced axis…)
   and `check_content_density.py` (thin OR over-boxed drafts).

Each checker also runs standalone:
`python3 scripts/check_charset.py doc.tex`,
`python3 scripts/check_bidi_figures.py doc.tex`,
`python3 scripts/check_pdf_render.py doc.pdf doc.tex`,
`python3 scripts/check_content_density.py doc.tex`.

Then **always audit visually** — some direction/layout errors remain invisible
to every gate but obvious on the page:

```bash
pdftoppm -png -r 110 doc.pdf page        # then OPEN the PNGs and look
```

**Do not verify Hebrew with `pdftotext` + grep** — RTL extraction is scrambled.
Render and view the image instead (crop with PIL for a specific region). Confirm:
Hebrew reads right-to-left; formulas centered LTR; **diagram Latin labels read
forward and parentheses are correct**; code listings sit **inside** their boxes;
no tofu; box title bars full and colored; nothing clipped or overlapping;
`\emph` runs are visibly slanted.

## Step 4 — Content cross-check (the gate no script covers)

**Green gates ≠ correct content.** Steps 0–3 verify typography and direction —
not whether the physics/math is right. In one real 192-page build, **five**
substantive errors passed every gate: an empty denominator, a spurious `×4`
factor, a wrong sphere volume, `√(n-1)` where the physics needs `√(n+1)`, and a
wrong angle choice in a CHSH exercise. For any document built from a source
(lecture notes, past exams, a textbook), budget this as a distinct step:

1. **Chunk the source and the output** into matching units (per chapter /
   exercise / derivation).
2. **Cross-check line-by-line**: formula against formula, coefficient against
   coefficient, index against index, sign against sign. Read the output's
   equation and the source's equation *side by side*, not from memory.
3. **Recompute spot checks**: for each derivation, verify one intermediate
   step and the final result independently (dimensional analysis, limits,
   a numeric sanity value).
4. **Log every discrepancy before fixing any** — fixes made mid-scan cause
   missed neighbors.

## Step 5 — After changing the skill itself: run the harness

Any edit to the preamble, a checker, or an example file must pass the
regression harness before the change is real:

```bash
bash scripts/test_all.sh          # full: lint goldens, 78-case checker
                                  # selftest, charset, all example builds,
                                  # render gate, reproducibility
FAST=1 bash scripts/test_all.sh   # skips the big example compiles
python3 scripts/selftest.py       # just the checker corpus (fast, standalone)
```

`selftest.py` runs from anywhere, including a read-only mount. The full
harness compiles documents, so run it from a **writable copy** of the tree.

A checker without a test that proves it fires is an assertion, not a check —
`tests/lint_positives.tex` must trip every flag in `tests/expected_flags.txt`,
and `tests/lint_negatives.tex` must stay silent. When you add a lint rule, add
its positive + negative case and its flag name in the same commit.

## Optional: a "you are here" topic rail (progress header)

For a long multi-part study guide, a thin progress rail in the running header —
one dot per `\part`, the current one enlarged and labelled — gives readers
orientation ("where am I in the arc"). It is **opt-in**; the base pipeline is
unchanged. Source: `assets/topicrail.tex`; working demo: `assets/example_topicrail.tex`.

```latex
\input{preamble.tex}
\input{topicrail.tex}                       % AFTER the preamble (needs \h, tikz, colors)
\STnames{יסודות,נתונים,הסקה,מידול,רשתות,הכללה}   % one short label per part, no spaces after commas
\begin{document}
\pagestyle{empty}                            % front matter (title/TOC/intro): no rail
... title, \tableofcontents, \chapter*{מבוא} ...
\clearpage
\pagestyle{STtopic}                          % turn the rail on; then \part{...} as usual
```

How it behaves (all verified): the rail shows on chapter-opening **and** body
pages, and is **hidden** on front matter and on part-divider pages. It is
RTL by default (first dot on the right) and identical across every page of a
topic. Knobs: `\STrailangle{40}` (label tilt), `\STrailwidth{15}` (cm),
`\STdirLTR`. Practical limits: ~12–13 dots is the legible maximum for the
rotated labels; each rail adds ~50pt of header height (a real per-page cost in
a dense doc — drop labels or shrink the font if space is tight).

Two design notes baked in (do not "fix" them):
- It drives off `\value{part}` (stepped by the class on the divider, so timing
  is always right) — **not** page marks, because `\chapter` overwrites
  `\markboth` and would clobber a mark-based rail.
- It `\patchcmd`s `\part` to give dividers a blank style (`STblank`) while
  chapter openings keep `plain` (which the file redefines to carry the rail).
  If a future class change breaks the patch, you get a `topicrail` warning.

## Assembling multiple .tex files

```bash
cat main.tex p1.tex p2.tex > final.tex
printf '\\end{document}\n' >> final.tex      # printf, NOT echo ( \e = ESC byte )
```

**str_replace anchor hazard (editing):** when an anchor's tail includes a
`\section{...}` / `\chapter*{...}` / `\begin{box}` header, the replacement MUST
reproduce that header or it gets deleted → `missing \item` / lost heading. The
sandbox shell is `/bin/sh` (dash): use Python for loops; `pip` needs
`--break-system-packages`.

## Top pitfalls (full tables in the two reference files)

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| Operators (`sin`,`Tr`) / Latin-in-math are tofu | `fontspec` without `[no-math]` | `\usepackage[no-math]{fontspec}` |
| All Hebrew is tofu though it compiled | body font has no Hebrew | `font_coverage.py`; use Frank Ruhl |
| Latin word in a Hebrew line is tofu | no Latin fallback | `add_fallback` + `RawFeature={fallback=hebfb}` |
| **Latin in a TikZ node reversed; parens mirrored** | **Latin inside `\h{}` in a node** | **`\en{}`/`\code{}`; bare Latin in the `tikzpic` island** |
| **Box/circuit Latin flipped** | **not wrapped in an LTR island** | **`tikzpic` / `qcirc`** |
| **`;` jumps to the front of a code title** | **bare `\texttt{}` in `frametitle`** | **`\code{}` in the title** |
| **Signal name glues to its value (`10ALUOp`)** | **`\texttt{name}$=val$` (texttt split from math)** | **one unit: `\code{name=val}`** |
| **Prose label / arrow jumps side: `=1hit time`, reversed `ForwardB→Rt`** | **`\en{x}$=v$` / `\code{x}$\to$y` — island split from math, they reorder in RTL** | **merge math inside one island: `\en{x $=v$}` / `\en{\code{x}$\to$y}` (flagged `ISLAND-NEXT-TO-MATH`)** |
| **`\en{}` label + colon + math reorders: `q=… :s-channel`, list-before-label in `(detector-stable: …)`** | **colon between the `\en{}` and `$…$` orphans; the two LTR runs swap (a plain space does NOT — only the colon)** | **merge: `\en{s-channel: $q=…$}`, `\en{detector-stable: $p,n,e$}` (flagged `ISLAND-NEXT-TO-MATH`)** |
| **Latin list backwards: book list, `BaBar, Belle`→`Belle, BaBar`, `keV, MeV`→`MeV, keV`, `Breit-Wigner / Lorentzian` reversed** | **adjacent `\en{}`/`\code{}` islands separated by comma/slash each order RTL → print right-to-left** | **one island for the whole list: `\en{BaBar, Belle}`, `\en{Breit-Wigner / Lorentzian}` (flagged `ADJACENT-LTR-ISLANDS`; period/space do NOT reorder)** |
| **Align/`\text{}` label colon orphans: `:s-channel` instead of `s-channel:`** | **`\text{\en{s-channel}:}` — colon outside the `\en`, in the RTL `\text` base** | **colon inside: `\text{\en{s-channel:}}` (flagged `MATH-TEXT-EN-COLON`)** |
| **Dollar misplaced in `$a/$b` register list** | **`\texttt{\$a}/\texttt{\$b}` (split runs, `$` is bidi-sensitive)** | **one unit: `\code{\$a/\$b}`. NOTE: since v3.7 `\texttt` is LTR-isolated, so even letter-only `\texttt{lw}/\texttt{sw}` now reverses to `sw/lw` — merge those too (`\texttt{lw/sw}`); flagged `ADJACENT-LTR-ISLANDS`** |
| **Parens mirror: `CPI (Cycles…)`, heading `R (Register)`** | **a Latin token right before `(` in Hebrew text** | **`\en{}` the paren (Hebrew-before, e.g. `צנרת (pipelining)`, is already fine)** |
| **MIPS addressing parens/brackets/$ scramble inside `\texttt{}`: `(lw $t0,0($s0`, `$rs`→`rs$`, `arr[i]`→`[arr[i`** | **`(`, `)`, `[`, `]`, `$` set no direction, so inside `\texttt{}` they mirror/migrate in RTL** | **The preamble redefines `\texttt` (since v3.7) to LTR-isolate its content (guarded for math), so plain `\texttt{lw \$t0,0(\$s0)}` is now safe automatically — no `\code{}` needed. `\code{}` remains as an explicit alias.** |
| **Items in `(\code{a}, \code{b})` print reversed** | **each `\code{}` is a separate RTL-ordered island** | **wrap the list: `\en{(\texttt{a}, \texttt{b})}` (now flagged `ADJACENT-LTR-ISLANDS`)** |
| **Diagram nodes overlap** | **relative `=of` chains with many nodes** | **explicit `at (x,y)`, generous spacing, two-line labels** |
| **`Extra }` / `forgotten \endgroup` at `\end{tikzpicture}` — or at a far-away `\end{otherlanguage}`/table** | **a pgfplots `\begin{axis}` with no `\end{axis}`; the error cascades past the `tikzpic`/`qcirc` island close, so the reported line is misleading** | **add `\end{axis}` before every `\end{tikzpicture}`; `check_bidi_figures.py` reports the exact unclosed line. (A division-by-zero in `\addplot` at a domain endpoint is NOT the cause — pgfplots silently drops it under `compat=1.18`; don't chase it.)** |
| **Code listing spills out of its box** | **listing margins are page-relative** | **`resetmargins=true` + `framexleftmargin=0pt` + box padding** |
| **Mismatched “ ” quotes in Hebrew** | **`` `` ``/`''`** | **gershayim ״ (U+05F4)** |
| `\rmfamily invalid in math mode` | a bare `\h`/`\en` used **directly** in math (outside `\text`) | wrap it in `\text{}`: Hebrew `\text{..}` (bare is fine), Latin `\text{..}`/`\text{\en{..}}`. (Bare Hebrew *inside* `\text` does NOT error.) |
| **Flow/implication arrow points backward in RTL prose** (`שלב $\to$ שלב`, `A $\Rightarrow$ B` between Hebrew) — compiles clean, invisible in source | bidi does NOT mirror arrow glyphs, so `→`/`⇒` point right = against RTL reading | use **`\leftarrow`/`\Leftarrow`** in Hebrew prose (points to next step/conclusion). KEEP `\to`/`\Rightarrow` ONLY where **all operands are math/code**: limits `\lambda\to\infty`, maps `f:A\to B`, `x\mapsto y`, `\xrightarrow`, `\code{lw}\to\code{add}`. ⚠ **A display equation is NOT auto-LTR**: if it holds a `\text{עברית}` OPERAND it renders RTL and the arrow flips (`\text{חריגה}EX \Rightarrow \text{בטל}…`, even Hebrew on one side / at the start) — rewrite with a colon or Hebrew connective (`\text{אם}…\text{אז}`, `\code{div}:\ …`) instead of a directional arrow, or use `\Leftarrow`. Caught by `check_bidi_figures.py` (`HEBREW-FLOW-ARROW`/`HEBREW-EQUATION-ARROW`). Full note in `references/figures-boxes-listings.md`. |
| **Hebrew SENTENCE inside `equation`/`align`/`\[..\]` reads reversed (LTR)** — e.g. "עוצמה ↑ כש: …" prints with עוצמה on the **left**; or a split parenthetical "(או … כש־σ לא ידועה)" scrambles | display math is LTR; a sentence split across **several `\text` blocks** is laid left-to-right | put verbal statements/relations in a **`\begin{center}…\end{center}`** RTL line (or prose) with inline `$…$` math, not in display math. Keep pure math (`LHS=RHS`, `\Loss(f_{-j},D_j)`) in display; push Hebrew descriptions to prose after. A **single** `\text{}` block (one label, `\underbrace` label, `\text{(מבחן דו־צדדי)}`) is fine. Full note in `references/figures-boxes-listings.md`. |
| **English parens MIRROR in math: `Spec (TNR(`** (compiles clean — invisible!) | `\text{Eng (parens)}` — a plain `\text` inherits the RTL base | **`\text{\en{Eng (parens)}}`** — `\en` forces LTR; for `f(arg)` keep parens at math level: `\text{f}(\text{\h{arg}})` |
| **Parens MIRROR even WITH an `\en`: `\text{(\en{weak})}` → `)weak(`** (v3.23.4; compiles clean) | the parens sit OUTSIDE the `\en`, in the RTL `\text` base — the `\en` isolates only `weak`, not the parens | **put the parens INSIDE: `\text{\en{(weak)}}`** (or at math level: `(\text{\en{weak}})`). Flagged `TEXT-PARENS-IN-MATH`. Parens that also wrap Hebrew, `\text{(דין ב־\en{CMOS})}`, are fine |
| `perhaps a missing \item` in a node | `\\` in a node without `align=center` | add `align=center` |
| Hebrew **directly** in `$...$` (no `\text`) reads oddly | Hebrew with no `\text` wrapper | wrap it: `\text{...}` (bare Hebrew inside `\text` renders correctly — `\h` optional) |
| `\proj`/`\mod`/`\ket` "already defined" | clash with quantikz/amsmath | `\providecommand`; `\dyad` not `\proj`; `\bmod` not `\mod` |
| **Shortcut macro renders the WRONG glyph: `\ni`→∋ (`np=∋²`), compiles clean** | `\providecommand{\ni}` is a SILENT no-op — `\ni`/`\Re`/`\Im`/`\det`… are TeX primitives, already defined | **`\renewcommand`** (explicit override) or another name; render a page using every new shortcut before trusting it. Flagged `PROVIDECOMMAND-PRIMITIVE` |
| **Hebrew label between two `\en{}` islands inside `\text{}` renders REVERSED** (`\text{\en{(}תעלה רחבה\en{)}}` → scrambled Hebrew, displaced parens; compiles clean) | the two LTR islands bite the RTL run from both ends | **one whole unit: `\text{\h{(תעלה רחבה)}}`** — never raw Hebrew between `\en` islands. Hebrew around a *single* island (`\text{(הספק ב־\en{CMOS})}`) is fine. Flagged `TEXT-HEBREW-BETWEEN-ISLANDS` |
| Bookmark gibberish | hyperref without `unicode` | `[hidelinks,unicode]{hyperref}` |
| Math in heading warns/garbles bookmark | no `\texorpdfstring` | `\texorpdfstring{$..$}{plain}` (no raw `^`/`_` in arg 2) |
| `bidi.sty not found` | tried XeLaTeX/polyglossia | LuaLaTeX + babel `bidi=basic` |
| Corrupted file after append | `echo "\end..."` | `printf '\\end{document}\n'` |
| Scrambled grep of Hebrew from PDF | `pdftotext` mangles RTL | `pdftoppm` + view the image |

## Bundled resources

**Canonical source:** `assets/preamble.tex` is what actually compiles; if a
reference disagrees with it, the asset wins.

- `assets/preamble.tex` — the tested preamble (input it).
- `assets/example_figures.tex` — a full document exercising a mixed-label TikZ
  diagram, a code listing inside a box, gershayim quotes, a code title, and a
  per-level-spaced decision tree; compile it first to confirm the setup.
- `assets/example_math.tex` — math/circuit smoke test (operators, Latin-in-math,
  braket vs quantikz, hyperref, math-in-heading, a box, a SWAP circuit).
- `assets/example_tables.tex` — a gallery of **5 proven table patterns** (basic
  data; glossary symbol→meaning; LTR/code column with a multi-line cell; two
  prose columns; wide/truth table), each annotated with *when to use it*.
  **Start here** — copy the pattern you need and swap the content. Governing
  rule at the top: Hebrew-primary → plain `tabular`; LTR-primary (code,
  formulas, truth tables) → wrap in `otherlanguage{english}`.
- `assets/example_boxes.tex` — a gallery of the six colored boxes
  (`defbox`/`thmbox`/`notebox`/`exbox`/`warnbox`/`keybox`), each annotated with
  its semantic role, plus the stepped-list (`\\`) and `nobreak=true` patterns.
  Pick a box by *role, not colour*; `frametitle` is per-instance.
- `assets/topicrail.tex` — optional "you are here" progress header (see the
  topic-rail section above); `assets/example_topicrail.tex` — its 12-part demo.
- `references/recipe.md` — the complete Hebrew+math recipe.
- `references/figures-boxes-listings.md` — the complete figures/boxes/listings/
  tables/quotes recipe.
- `references/content-style.md` — **the content DNA**: density signature,
  per-chapter rhythm, box discipline, worked-exercise format, front-matter and
  connective-summary structure, with verbatim few-shot exemplars. Read it for
  any study guide / summary / לקט so the output is dense, not thin.
- `scripts/build.sh` — the one-command verify (charset gate → deterministic
  compile to the fixed point → log gates → **render gate** → font check → linters).
- `scripts/check_pdf_render.py` — the render gate: reversed Latin runs,
  whole-token reversals, folio digit reversal — in the **compiled PDF**.
- `scripts/check_charset.py` — stray/confusable codepoints (Arabic/Cyrillic
  look-alikes, raw Greek/math glyphs) that silently tofu. The allow-list is
  **font-reality-based**: it admits what Frank Ruhl actually renders (`°`,
  `₪`, nikud, maqaf, geresh/gershayim) and blocks what it tofus — including
  Hebrew **cantillation marks** (U+0591–05AF etc.), which pass a naive
  "it's a Hebrew block codepoint" filter but have no glyph in the font.
- `scripts/check_bidi_figures.py` — source linter: Latin-in-`\h`-in-TikZ, bad
  quotes, island-next-to-math reorders, `ADJACENT-LTR-ISLANDS`, label-colon
  orphans, unbalanced pgfplots `axis`, unwrapped heading math,
  `HEBREW-FLOW-ARROW`/`HEBREW-EQUATION-ARROW`, `HEBREW-DOUBLE-HYPHEN`,
  `TEXT-MATH-CARET`, `UNDEFINED-COMMON-MACRO` (skips macros the document
  defines itself), `PROVIDECOMMAND-PRIMITIVE` (a shortcut macro silently
  shadowed by a TeX primitive), `TEXT-HEBREW-BETWEEN-ISLANDS` (raw Hebrew
  sandwiched between `\en` islands inside `\text{}`).
- `scripts/check_content_density.py` — two-sided heuristic: warns on thin AND
  over-boxed drafts.
- `scripts/test_all.sh` + `tests/` — the regression harness (step 5): golden
  lint fixtures + expected flags, charset fixtures, example builds, render-gate
  fixtures, reproducibility. Run after any change to the skill.
- `scripts/selftest.py` — 78 embedded checker regression cases (every one
  verified against a real compile/render): adversarial positives the linters
  must catch and hard-won negatives they must stay silent on. Complements
  `test_all.sh` (which tests the pipeline end-to-end) with fine-grained
  per-rule locking. Run both after touching any checker.
- `scripts/setup_fonts.sh` / `scripts/font_coverage.py` — fonts.
- `CHANGELOG.md` — version history and the empirical story behind each rule
  (not needed for use).
