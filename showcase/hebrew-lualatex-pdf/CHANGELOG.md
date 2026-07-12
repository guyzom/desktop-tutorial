# hebrew-lualatex-pdf — version history

This file preserves the empirical narrative of how each rule was discovered.
**It is NOT needed to use the skill** — SKILL.md states every current rule in
the present tense. Read this only for the archaeology of a specific decision.

## v3.23.6 → v3.23.7 (2026-07) — adversarial hardening of the two new rules

The v3.23.6 rules got the same treatment as the rest of the skill: an adversarial
review agent tasked with breaking them (32 probes + 2 compile-and-render
experiments — two of which DISPROVED suspected gaps in the checker's favor).
Four findings held and are fixed here:

- **FP fixed: an island inside nested `$...$` counted as a flanking island.**
  `\text{שלום $a_{\text{\en{on}}}$ עולם \en{X}}` was flagged, but compiling it
  against an unflagged control showed identical rendering — nested math is its
  own context. `TEXT-HEBREW-BETWEEN-ISLANDS` now strips nested `$...$`/`\(..\)`
  first, exactly as `_parens_wrap_only_latin` already did.
- **FP fixed: Hebrew punctuation alone between islands.** `\text{\en{A}־\en{B}}`
  (maqaf) was flagged but is pixel-identical to the merged form — without Hebrew
  LETTERS there is no RTL run to break. The probe is now limited to א-ת.
- **FN fixed: a definition split across lines.** `\providecommand<newline>{\ni}`
  evaded the per-line scan; a single pass over the joined comment-stripped
  source now catches it (reporting only line-spanning matches — no duplicates).
- **Pre-existing FP exposed and fixed: `LANG-RAW-IN-MATH` on the continuation
  line of a multi-line `\text{}`.** A legitimate `\en{...}` there was flagged as
  bare-in-math because `_blank_text_mbox` is line-based. New cross-line state
  (`_line_text_spans`, blank-line self-heal like the math mask) suppresses it.
  This is §8's lesson (line-based scan vs. line-crossing logical unit) recurring
  in another rule — treat it as a standing failure pattern.
- **Primitive list extended** by the review's criterion — kernel names whose
  glyph DIFFERS from the plausible intent: `\d \i \j \O \L \l \H \S \P \b \t \v`
  (differential, imaginary unit, big-O, Lagrangian, Hamiltonian, action…).
  Operators whose no-op renders exactly what was meant (`\arcsin`) are
  deliberately excluded.
- **Proof + lock.** +6 selftest cases (72→78) covering every fix; harness
  assertion count unchanged (21); 0 false positives re-verified across all 123
  source files; full harness green.
- **Lesson.** A new checker rule is new code — it gets the same adversarial
  review as everything else before it is trusted.

## v3.23.5 → v3.23.6 (2026-07) — the two run-4 render-only defects get checker rules

The advanced-electronic-devices run (PROCESS §8) left two defects documented as
"uncatchable / candidate for a future rule" in DEFECTS.md (BLD-9, BIDI-16). This
release closes both, per the full skill-change protocol — each proven hermetically
(3 identical hashes), rendered and eyeballed with a positive control, and locked.

- **`PROVIDECOMMAND-PRIMITIVE` (B4, DEFECTS BLD-9).** `\providecommand{\ni}{n_i}`
  is a SILENT no-op — `\ni`/`\Re`/`\Im`/`\det`… are TeX primitives / kernel math
  commands, so the name is already defined and every `\ni` renders the primitive
  (`np=∋²`). Compiled clean, every source check blind; only the rendered page
  showed it. The rule flags `\providecommand` (braced or unbraced) on a curated
  primitive list; fix is `\renewcommand` (an explicit, loud override) or another
  name. Proven on the real occurrence: the pre-fix `macros.tex` (e9f171e) fires,
  the shipped `\renewcommand` form is silent.
- **`TEXT-HEBREW-BETWEEN-ISLANDS` (#13, DEFECTS BIDI-16).** Raw Hebrew inside
  `\text{}` flanked on BOTH sides by `\en`/`\code`/`\texttt` islands
  (`\text{\en{(}תעלה רחבה\en{)}}`) — the two LTR islands bite the RTL run from
  both ends and the Hebrew renders REVERSED with displaced parens. Compiled
  clean; `check_bidi` v3.23.5 reported clean; caught only when a reader saw
  page 116. The rule strips `\h{}` groups, then flags any raw Hebrew character
  with a Latin island both before and after it inside the `\text` content
  (multiline-aware via `_text_content`). Hebrew around a SINGLE island
  (`\text{(הספק ב־\en{CMOS})}`) renders fine and stays silent — verified. This
  closes the Hebrew side of the `TEXT-PARENS-IN-MATH` family (whose Latin side
  closed in v3.23.4). Proven on the real occurrences: the pre-fix
  `p09_mobility.tex` (926b774^) fires on all THREE labels, the shipped
  `\text{\h{...}}` form is silent.
- **Proof + lock.** +8 selftest cases (64→72: 2 positive + 2 negative per rule,
  incl. an unbraced `\providecommand\Re` and a multiline sandwich); positives +
  both flags added to the harness fixtures (assertions 19→21); failure-proofed
  (neutering either rule turns T1 red); 0 false positives across all seven
  collections + the skill's assets (123 files). Full harness 21/21 green.
- **Lesson.** "Uncatchable" is a status, not a fate: both rules were sitting one
  curated list / one sandwich test away. When a render-only defect is registered
  🔴, budget the checker rule — the register entry is the spec.

## v3.23.4 → v3.23.5 (2026-07) — the \text{} scans go multiline

Follow-up audit after v3.23.4: "are there other deterministic-but-uncaught bugs
like the paren mirror?" One held up — the skill's own documented KNOWN LIMITATION.

- **The gap.** `check_bidi_figures` scans line by line. The `\text{...}`-in-math
  checks (#7/#7b parens, B1 caret, MATH-TEXT-EN-COLON) matched a `\text{` and read
  to end-of-line, so a `\text{}` group that spans a SOURCE line break hid its
  parens/caret/colon from the scan. Proven hermetically: `\text{(\en{weak})}` split
  across two lines compiles clean, renders `)weak(` (deterministic — 3 identical
  hashes), and the old checker reported CLEAN. Same defect, one line-break away
  from being caught. (Latent in the repo — 0 multi-line `\text` groups shipped —
  but a real blind spot for future edits.)
- **The fix.** `_text_content()` returns the FULL `\text{}` content: fast path when
  it closes on the line, else it joins the following comment-stripped lines and
  brace-matches across them. All four `\text`-scoped checks now see multi-line
  groups. Content is newline-flattened only in the reported snippet.
- **Proof + lock.** +6 selftest cases (58→64): multi-line paren, caret, and colon
  bugs must fire; multi-line correct-form and Hebrew content must stay silent. A
  multi-line positive added to the harness fixture. 0 false positives across all
  six collections.
- **Lesson (compounding v3.23.4's).** A line-based scanner is blind to anything a
  logical unit carries across a line break. When you scope a check to a delimited
  group (`\text{...}`), match the group, not the line.

## v3.23.3 → v3.23.4 (2026-07) — TEXT-PARENS-IN-MATH: parens OUTSIDE an \en island

Prompted by a reader spotting mirrored parentheses on a rendered page of the
particles-nuclei anthology: `\alpha_W\sim\tfrac1{30}\ \text{(\en{weak})}` printed
as `)weak(`. Investigated hermetically — compiled 5× from clean (byte-identical
every time), so it is a **deterministic bidi bug, not nondeterminism**.

- **Root cause.** Inside `\text{...}` the parentheses sit in the RTL `\text` base,
  OUTSIDE the inner `\en{}` LTR island, so they mirror. The fix is to move the
  parens INSIDE the island: `\text{\en{(weak)}}` (or keep them at math level,
  `(\text{\en{weak}})`). Both verified at 150 dpi.
- **Why the checker missed it (the blind spot).** The `#7 TEXT-PARENS-IN-MATH`
  scan strips `\en{...}` FIRST, then tests for "Latin + parens". After stripping
  `\en{weak}` only an empty `()` remains — no Latin — so the rule never fired.
  `check_bidi_figures` reported the fragment CLEAN, and it passed the adversarial
  verification pass; only a human eye on the render caught it.
- **The fix.** `_parens_wrap_only_latin()` now flags a `( )`/`[ ]` pair inside a
  `\text{}` whose interior, after removing Latin islands and separators, is EMPTY
  (i.e. the parens wrap ONLY an `\en`/`\code`/`\texttt` island). Parens that also
  wrap Hebrew (`\text{(הספק ב־\en{CMOS})}`) are Hebrew-directional and stay
  SILENT — verified. Emitted under the existing `TEXT-PARENS-IN-MATH` flag.
- **Proof + lock.** 8 selftest cases added (4 positive incl. bracket and comma-list
  variants, 4 negative incl. the fix form and Hebrew-mixed parens) → selftest 50→58;
  a positive line + the flag added to the `test_all.sh` fixtures → harness 18→19.
  The rule was proven on the three real occurrences it found in the shipped repo
  (`particles-nuclei` weak/strong, `computer-architecture` RAID), all now fixed.
- **Lesson.** A checker that strips isolates before a test can be blind to defects
  that live in the *residue* of the strip. When a render-only bug slips a green
  checker, the fix is BOTH the source AND a new checker rule with its tests.

## v3.23.2 → v3.23.3 (2026-07) — the determinism claim, audited and corrected

Prompted by a direct challenge ("there are non-deterministic things there").
The audit proved the challenge right, twice:

- **The v3.22 determinism measurement was underpowered and confounded.** A
  12-run batch produced THREE distinct hashes *with* `SOURCE_DATE_EPOCH` set.
  Root cause isolated: not randomness but **aux-state dependence** — the batch
  started from a deleted-aux state, so runs 1–2 were TOC-convergence steps
  (1+1+10 hash distribution matches exactly). With state controlled, 16/16
  runs were byte-identical. Lesson encoded: hash comparisons are only
  meaningful at the aux fixed point.
- **Worse: build.sh's fixed double compile shipped WRONG output.** From a
  clean state, pass 2 of the 28-page example has stale TOC page numbers
  (מבוא→2 instead of 3; ch. VII→15 instead of 16 — extracted and diffed at
  text level). No gate checks TOC targets, so this shipped silently since the
  script existed. **Fix: compile-to-convergence** (repeat until two
  consecutive PDFs are byte-identical, max 5 passes, loud warning otherwise);
  the delivered PDF is now provably the fixed point, and the terminal
  identical pair doubles as the reproducibility proof. `REPRO=1` redefined as
  one extra confirmation pass at the fixed point (its old form false-alarmed
  on exactly the TOC-convergence case).
- **A nondeterminism inside the determinism gate**: `check_pdf_render.py`'s
  folio-offset inference broke count-ties by opaque set iteration order; now
  a deterministic sorted tie-break.
- Honest residuals, documented: the historical 1-in-80 folio-reversal cannot
  be declared dead by any feasible run count (~28 clean runs ≈ 70% chance of
  seeing nothing even if present) — the guarantee is *prevention* (LTR-wrapped
  `\thepage`) plus *per-build detection* (render gate R3), i.e. "cannot happen
  silently", not "cannot happen". Cross-environment output (TeX Live version,
  luaotfload cache/font discovery) remains environment-specific by nature.

## v3.23.1 (2026-07)

- **`selftest.py` wired into the harness as T1b.** `bash scripts/test_all.sh`
  now runs the 50-case checker corpus too, so one command proves the whole
  skill. Verified both ways: green on the clean tree; deliberately breaking a
  checker rule makes T1b (and the harness exit code) fail. (An intermediate
  merge round briefly dropped this stage; restored in v3.23.3 after an audit
  found no removal rationale.)
- **`selftest.py` runs from read-only mounts.** It wrote scratch `.tex`
  files into its own `scripts/` dir (`dir=HERE`); deployed skills are mounted
  read-only, where this crashes with PermissionError (reproduced as an
  unprivileged user, independently re-verified). Scratch files now go to the
  system temp dir; verified passing as `nobody` from a fully read-only tree.
  The full harness still needs a writable copy (it compiles documents) —
  documented in Step 5.

## v3.23 (2026-07)

Merge of two independent v3.22 hardening lines, cross-validated head-to-head
on shared adversarial corpora and two real anthologies (a known-clean one and
a known-dirty pre-fix snapshot). Each line's checkers were run against the
other line's test suites before merging; every kept behavior is the one that
won empirically, not the one that came first.

- **Checker line adopted: the 16-fix adversarial hardening.** The other
  v3.22's structural work (render gate, harness, deterministic builds) was
  kept wholesale, but its `check_bidi_figures.py` failed 20+ of the 50
  regression cases (its own changelog honestly said "no new bidi content
  rules"). This release keeps the hardened linter: math-mask that handles
  `\(...\)`, `$$`, and cross-line inline-`$` (blank-line reset);
  backslash-parity comment stripping routed through ALL legacy rules (six
  rules previously scanned the raw line); verbatim/lstlisting skip; guarded
  dash rules — spaced ` --- `→`—` plus letter/digit `--` via lookaround —
  that stay block-aware (**`--` is TikZ's path operator**: a blanket sweep
  breaks `\draw (0,0) -- (1,1)`; masked environments are exempt);
  `TEXT-MATH-CARET` for `^`/`_` inside `\text{}`; 2-level island-nesting
  detection; order-aware axis walk.
- **`UNDEFINED-COMMON-MACRO` = best of both.** The first-pass
  `user_defined` collection (define-anywhere-in-file exempts uses — the
  compiler catches true use-before-def anyway) merged with the
  package-aware skips (`\usepackage{siunitx}`/`csquotes` silences the
  corresponding macros) and the definition-site guard. Verified both ways:
  `\SI` inside another macro's *body* is flagged; a document that defines
  `\SI` then uses it is clean.
- **`check_charset.py` is font-reality-based.** Allow/block decided by what
  Frank Ruhl actually renders, verified glyph-by-glyph: `°` and `₪` are
  admitted (they render); Hebrew **cantillation marks** (U+0591–05AF,
  U+05C6, U+05C8–05CF) are blocked — they are valid Hebrew-block codepoints
  but tofu in this font. Bidi control marks report accurate names/reasons.
  Same parity-aware comment stripping as the linter (a `\%` no longer hides
  the rest of the line).
- **`scripts/selftest.py` (NEW here) — 50 embedded regression cases**, every
  one verified against a real compile/render during the hardening rounds.
  Locks all 16 adversarial fixes plus the merged B3 semantics (cases 49–50:
  flag-inside-macro-body, clean-when-defined-then-used).
- **Preamble is class-aware.** `\newcounter{tbl}[chapter]` crashed under
  `article` ("No counter 'chapter' defined") despite SKILL.md promising the
  report→article switch. The counter now binds via `\@ifundefined{c@chapter}`
  to `chapter` when present, `section` otherwise. Compile-verified both ways.
  FakeSlant `\emph` and the LTR folio fix from the other line are kept and
  were re-verified on the merged preamble (rendered slant visible; harness
  17/17 including reproducibility).
- Everything else from the structural v3.22 (render gate, `test_all.sh`,
  `SOURCE_DATE_EPOCH`, font warning, present-tense SKILL.md) is unchanged
  and passes on the merged package.

## v3.22 (2026-07)

Structural + verification release; no new bidi content rules.

- **SKILL.md rewritten as a present-tense manual.** The "As of vX" narrative
  (below) moved here; every rule now stated once, in current form.
- **`scripts/check_pdf_render.py` (NEW) — the render gate.** The first check
  that inspects the *compiled PDF*, not the source: reversed Latin runs
  (fingerprint: per-glyph text spans whose visual order mirrors a source
  token — measured on a deliberately broken fixture), whole-token reversals,
  and footer-folio digit reversal (18→81). Wired into `build.sh` as a HARD
  gate. Empirically validated: flags the broken fixtures, silent across all
  bundled examples (35 pages).
- **Deterministic builds.** `build.sh` exports `SOURCE_DATE_EPOCH` (measured:
  without it, identical input → different PDF every run; with it, 5/5 runs of
  a 28-page doc are sha256-identical). `REPRO=1` makes build.sh prove it.
  This retires the "non-reproducible build" soil the 1-in-80 folio-reversal
  class grew in, and makes binary diffing possible.
- **`scripts/test_all.sh` + `tests/` (NEW) — regression harness.** Golden
  positive/negative lint fixtures (every flag class must fire; correct
  patterns must stay silent), charset-gate fixtures, all example builds,
  render-gate fixtures, reproducibility. 17 assertions; run after any change.
- **`\emph` is real emphasis again.** Frank Ruhl has no italic face; instead
  of the v3.21 `\emph`→`\textbf` hack, the preamble now defines a FakeSlant
  italic face (slant verified visible at 300dpi; nesting toggles correctly;
  0 errors / 0 missing glyphs). One-line revert to bold is documented inline.
- **`build.sh` warns when the body font is not Frank Ruhl** (the em-dash and
  FakeSlant rules are font-specific facts).
- **`UNDEFINED-COMMON-MACRO` fixed properly**: a first pass collects macros
  the document defines itself (`\providecommand{\SI}`…), which are then never
  flagged — replacing both the v3.21_3 whole-line skip (missed real hits) and
  the v3.21_final blanket flag (flagged the user's own definition). Pattern
  extended to `\si`/`\num`/`\ang`. Validated both ways in the harness.
- **Content cross-check promoted to a numbered step** (SKILL.md Step 4) —
  previously one paragraph; it is the only gate for substantive correctness.

## v3.9–v3.21 — original narrative (verbatim from the old SKILL.md)

This pipeline built a **100-page Hebrew quantum-computing summary** and a
**130-page Hebrew computer-architecture anthology** (dozens of TikZ diagrams and
code listings), both compiling with **0 missing characters**. As of v3.11 the
skill also codifies the **content style** of those documents — their density,
chapter rhythm, box discipline, and exercise format — so output matches them in
substance, not just in typesetting (see `references/content-style.md`).
As of **v3.14**, the arrow-direction guidance is corrected (a display equation
holding a Hebrew `\text` *operand* renders RTL and flips `\to`/`\Rightarrow` —
it is **not** auto-LTR) and `check_bidi_figures.py` flags it
(`HEBREW-FLOW-ARROW`/`HEBREW-EQUATION-ARROW`); see `references/figures-boxes-listings.md`.
As of **v3.15**, table presentation is unified and a class of clarity/consistency
bugs is closed. **Every table now goes through the `tablebox` environment +
`\tabcap` command** (subtle uniform slate frame, auto-numbered "טבלה N.M." caption
*inside* the frame) — **never** raw `\begin{table}`+`\caption*`, which (since the
`caption` package is deliberately not loaded) leaks a stray "טבלה N : *" line and
inconsistent numbering. The preamble now bundles `tablebox`/`\tabcap` and `float`.
Three matching content rules are added: **glossary / symbol→meaning content is a
two-column table, not bullets**; **short reference boxes take `nobreak=true`** so they
move whole instead of orphaning a row; and **code columns in tables wrap the table in
`otherlanguage{english}`** (uniform left-aligned LTR code), use a nested left-aligned
`tabular` for multi-line code cells, and **never mix Hebrew inside a code sequence**
(use `#`-comments / a separate column / the caption) — `\beginL`/`\endL` are undefined
under luatex. See rules 5–7 in `references/content-style.md` and the two table sections in
`references/figures-boxes-listings.md`.
As of **v3.16**, an **Overfull-hbox (margin overflow) prevention** pass is codified:
wide unbreakable LTR islands (a single math island like `$(a),(b),(c)$`, or a `\code{}`
monospace run) overflow the margin/box; fixes are a compact single island, **one line per
numbered item** (`\\`) in step-boxes, a two-column tabular for code-lists, `{\small …}` for a
too-wide `align*`, and rephrasing so a break opportunity precedes a trailing code island —
plus the empirical loop (collect `Overfull \hbox` from the log, sort by severity, fix, re-verify
visually). See rule 8 in `references/content-style.md` and the new "חריגת שוליים" section in
`references/figures-boxes-listings.md`.
As of **v3.17**, the skill ships a **copy-paste table gallery**,
`assets/example_tables.tex` — five proven, topic-neutral, annotated table
templates (basic data; glossary symbol→meaning; LTR/code column with a
multi-line cell; two prose columns; wide/truth table). It embodies a principle
this project kept re-confirming: for guiding the agent, a **working example to
copy beats a list of prohibitions** — it saves reconstructing structure from
scratch (and re-hitting the RTL / `\caption*` / overflow traps). Reach for it
before hand-building any table; it is also a `tablebox`/`\tabcap` smoke test.
As of **v3.18**, two more additions. (a) A companion **box gallery**,
`assets/example_boxes.tex` — all six colored boxes with cross-domain content,
plus the stepped-list (`\\`) and `nobreak=true` patterns; pick a box by *role,
not colour*. (b) `scripts/build.sh` is now a **one-command verify**: on top of
the charset hard-gate and compile it now **reports overfull hboxes** (visible
>5pt offenders sorted by severity — a warning, not a failure) and **runs the
bidi/figure and content-density checkers automatically** after a clean build.
The checkers remain a first pass, never a substitute for viewing every page.
As of **v3.19**, the skill guards **balance** — the failure mode where a document
drifts into wall-to-wall colored boxes and abandons free prose. content-style §4
now opens with an explicit principle: the default vehicle is **prose, standalone
numbered equations, and (neutral gray) tables**; the six colored boxes are a
**minority (~⅓ of content) for semantic emphasis only**, and the gray `tablebox`
is a data frame, *not* a colored box. `check_content_density.py` is now **two-
sided**: on top of the thin-content warnings it reports the % of content inside
colored boxes and warns above ~55% (measured: the reference לקט is a healthy
35%). A back-to-back box-*chain* check was prototyped and **dropped** — on the
reference doc it false-flagged legitimate patterns (a theorem→example→note unit,
a run of exercise boxes), so it is not a reliable automated signal. The box
gallery header now leads with the same restraint note.
As of **v3.20**, a **consistency pass** fixes drift accumulated across v3.14–v3.19.
The biggest fix: `check_content_density.py` was **blind to tables** and judged
"thin" by numbered-equation count alone, so it **false-flagged the reference
formula sheet** (0.46 numbered-eq/ch) as sparse — even though that sheet is dense
(2.7 mapped elements/ch once tables and boxes are counted). It now counts
equations + tables + boxes and warns only below ~1.2 total mapped elements per
chapter. content-style §4 now lists **all six** box types (warnbox and keybox are
heavily used, not rare); the preamble version label is reconciled (unified
across the skill); the `example_math`/`example_figures` smoke tests were
cleaned of their last visible overfulls; and `recipe.md` now points to the table
and box galleries. All five example files compile clean (0 errors, 0 missing
glyphs, 0 visible overfulls, bidi clean), and every in-doc cross-reference
resolves to a file that exists.

As of **v3.21**, a **visual-render pass** closes defects that compile clean, pass
every checker, and are only visible on the rendered page (found across two real
builds — an 80-page and a 192-page/440-equation document). Preamble: (a) `\emph`
is redefined to `\textbf` (Frank Ruhl Libre has **no italic**, so `\emph`/`\textit`
render UPRIGHT — zero visible emphasis, verified by measuring identical width);
(b) `\thepage` is wrapped LTR so page-number digits cannot reverse (18→81) in the
RTL footer — a **non-deterministic** bidi glitch (this LuaLaTeX build is **not**
byte-reproducible: identical input yields a different PDF each run, which is
exactly how a 1-in-80 reversal arises); (c) `\emergencystretch=3em` rescues the
small (~2–13pt) inline-prose overfulls Hebrew leaves when an unbreakable `\en{}`/
math island lands at the margin (it touches ONLY those tie-break lines — display-
math/table overfulls still surface for the content pass); (d) `\ketbra` and
`\expval` are added via `\providecommand` (quantikz defines neither; their absence
threw "Undefined control sequence" in a real build). **Dashes:** `---` does **not**
become `—` under Frank Ruhl — the font has no `tlig` (verified: `---` width is
identical with/without `Ligatures=TeX`, while the mechanism *does* work on Latin
Modern). **Type the character `—` (U+2014) directly.** Three new `check_bidi_figures.py`
lint rules back this: **HEBREW-DOUBLE-HYPHEN** (`--`/`---` adjacent to Hebrew — but
NOT Latin-Latin like `Hong-Ou-Mandel`), **TEXT-MATH-CARET** (`^`/`_` inside `\text{}`
→ "Missing \$"), and **UNDEFINED-COMMON-MACRO** (`\enquote`/`\SI`/`\qty` from
unloaded packages). Finally, a verification principle (Step 3): **green gates verify
typography and direction, not content correctness** — for a document built from a
source, run a separate line-by-line cross-check against it (in one real build this
caught five physics errors that passed every automated gate).
