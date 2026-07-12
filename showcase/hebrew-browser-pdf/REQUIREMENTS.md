# Requirements — Hebrew Academic PDF Pipeline v2 (browser-native)

Extracted from the LuaLaTeX skill `hebrew-lualatex-pdf` (v3.23.3), treated as a
**requirements specification, not an architecture to imitate**. Two things are
captured here: (A) the empirical **bidi bug catalogue** with a per-class verdict
on whether it survives the move to a browser bidi engine, and (B) the full
**content-capability list** the new pipeline must match. This is the literal
parity checklist for "done" (brief §0, §6).

Sources mined: `SKILL.md`, `CHANGELOG.md`, `references/recipe.md`,
`references/figures-boxes-listings.md`, `references/content-style.md`, and the
five `assets/example_*.tex` galleries.

---

## Orienting fact (why some bugs vanish and others don't)

The old engine is **babel `bidi=basic` inside LuaTeX**. It runs the Unicode
Bidirectional Algorithm (UBA) at paragraph level but **fails to apply it inside
"boxed" sub-contexts** (TikZ nodes, some `\text{}` atom chains). That single
distinction — "did the UBA run here or not" — predicts transfer:

- Bugs caused by **missing isolation in a sub-context** (LaTeX had no isolation
  primitive there) → **structurally disappear**, because HTML/CSS exposes
  `dir`, `unicode-bidi: isolate`, and `<bdi>` *everywhere*.
- Bugs that are **inherent UBA behavior** (neutral-char resolution, mirrored
  parens, non-mirrored arrows) → **transfer unchanged**; Chromium runs the same
  UBA and will reproduce them. These still need an **authoring linter**.

Corollary: the render engine will not save the author from the transferring
classes — they are *correct* Unicode behavior — so the guardrails move into
authoring/CI, exactly as the old pipeline did with `check_bidi_figures.py`.

---

## A. Bidi / directional bug catalogue

Verdict legend: **(a)** structurally disappears under CSS bidi · **(b)**
transfers, still needs an authoring guard · **(c)** unknown, required a Phase 0
spike. Spiked classes are annotated with the result (see `PHASE0.md`).

| ID | Trigger (LaTeX) | Symptom | Verdict | New-pipeline handling |
|---|---|---|---|---|
| **reversed-latin-in-tikz-node** | Latin inside `\h{}` in a TikZ node | `Datapath`→`htapataD`; parens mirror | **(a)** — *spike 3 confirms* | diagram labels are HTML (`<bdi>`) or SVG `<text>` with `direction`+`unicode-bidi:isolate`; both render correctly |
| **adjacent-ltr-islands** | `\en{A}, \en{B}` (comma/slash between isolates) | order reverses → `B, A` | **(b)→(a) — DISPROVEN, v0.3** | *Verified by rendering: does NOT reproduce in Chromium.* Comma/slash-separated `.en`/`<bdi>` islands render in correct reading order — CSS isolation places each isolate in logical (RTL) order. No linter rule needed. |
| **island-next-to-math** | `\en{x}: $=v$`, `\code{name}$=10$` | colon/number jumps side | **(b)→(a) likely** | same isolation mechanism as adjacent-islands; treat as CSS-handled (confirm per case). |
| **latin-before-paren-mirror** | Latin token immediately before `(` in RTL prose | `(` renders `)` | **(b)→(a) — DISPROVEN, v0.3** | *Verified by rendering: `CPI (Cycles Per Instruction)` parens do NOT mirror in Chromium.* CSS isolation on the block + the browser UBA handle it. No linter rule needed. |
| **text-in-math-parens-mirror** | `\text{Spec (TNR)}` in math | parens mirror silently | **(c)→(a)** — *spike 1: Latin+parens inside MathJax `\text` render correctly, un-mirrored* | keep Latin in `\text{...}`; no extra wrap needed in MathJax |
| **hebrew-in-math-text-reversed** | `\text{עברית}` / `\underbrace{}_{\text{עברית}}` | **Hebrew reversed + letter-spaced** | **(c)→FAIL** — *spike 1: MathJax SVG breaks Hebrew inside `\text`* | **do NOT put Hebrew inside MathJax.** Hebrew labels for math go in HTML; under/over-brace Hebrew labels use an HTML-overlay helper (build-phase task #1) |
| **hebrew-sentence-in-display-math** | Hebrew sentence split across several `\text` atoms in display math | scrambled/reversed | **(b)** (arch) | authoring rule: Hebrew prose never lives in display math — put it in an RTL HTML line with inline math |
| **hebrew-equation-arrow-flip** | `\to`/`\Rightarrow` in a display eq with a Hebrew operand | arrow points backward | **(b)** — arrows not mirrored by UBA | linter `HEBREW-EQUATION-ARROW`; use `\leftarrow` or a Hebrew connective |
| **hebrew-flow-arrow-flip** | `$\to$` between Hebrew prose words | arrow points against reading | **(b)** | linter `HEBREW-FLOW-ARROW`; use `←`/`⇐` in Hebrew flow; keep `→` only for all-math/all-code operands |
| **boundary-space-swallowed** | Latin trapped between Hebrew via separate math atoms | space before Latin vanishes | **(a)** — TeX atom artifact; HTML whitespace survives | none needed |
| **frametitle-code-punct-jump** | bare `\texttt{if…;}` in a box title | trailing `;` jumps to front | **(a)** — missing isolation | global CSS `code{unicode-bidi:isolate}` |
| **texttt-neutrals-mirror** | `0($s0)`, `arr[i]`, `$rs` in `\texttt{}` | brackets/`$` mirror/migrate | **(a)** — missing isolation | `<code dir=ltr>` |
| **mirrored-parens-general** | any bracketing neutral at a wrong-context boundary | mirrored glyph | **(b)+(a)** mixed | UBA law transfers; isolation-triggered subset disappears |
| **hebrew-quotes-asymmetric** | `` `` ``…`''` used for Hebrew | asymmetric “ ” | **(a)** mechanism gone / **(b)** requirement | no `` `` ``→“ ligature in HTML; still must emit gershayim ״ (U+05F4) for quotes + abbreviations; smart-quotes must be Hebrew-aware or off |
| **overfull-unbreakable-ltr-island** | wide `\code{}`/math island at margin | Overfull hbox / margin spill | **(a)** mostly — CSS `overflow-wrap`, `overflow-x:auto` | layout concern, not `\hbox`; wide code/tables in scroll containers |
| **bare-macro-in-math** | `\h`/`\en` bare in `$...$` | `\rmfamily invalid in math` | **(a)** — no such error in MathJax | n/a |
| **math-title-bookmark / nonunicode-bookmarks** | `\section{$n$}`, hyperref w/o `[unicode]` | corrupt/garbled PDF outline | **(a)** — Chromium outline is Unicode from HTML headings | ensure headings carry clean Hebrew text; math headings need accessible text |

**Toolchain artifacts that simply disappear** (no bidi content): math-operator
tofu (`[no-math]`), Latin-in-Hebrew tofu (font fallback), DejaVu-no-Hebrew,
`\mathbb{1}` glyph, macro-name collisions, pgfplots missing `\end{axis}`,
`echo`-corrupts-tex, Hebrew-enumerate-label-vanish, tcolorbox-broken-under-rtl,
listing-spills-box-margin. Each was a LaTeX-stack cost the new pipeline does not
inherit — but three leave a **requirement** behind: (1) the web font stack must
be verified to cover Hebrew + Latin + math; (2) Hebrew-alphabet ordered-list
markers (א,ב,ג) must be supported; (3) box styling must contain code without
spill (trivial in the CSS box model).

### The transferring set (the linter's job) — narrowed by empirical testing
The extraction *predicted* a broad transferring set. Rendering-and-viewing each
class (v0.3) narrowed it sharply: **CSS `unicode-bidi: isolate` eliminates the
reorder/mirror classes** (`adjacent-ltr-islands`, `latin-before-paren-mirror`,
and by the same mechanism `island-next-to-math`) — DISPROVEN in Chromium, no
guard needed. What genuinely transfers:
- **`hebrew-flow-arrow-flip` / `hebrew-equation-arrow-flip`** — UBA never mirrors
  arrow glyphs, so a rightward `→` in RTL Hebrew points backward. Caught by
  `scripts/check_dom.mjs` (`flow-arrow-rtl`).
- **`hebrew-in-math-text`** (new, spike 1) — Hebrew inside MathJax `\text`
  renders reversed. Caught by `scripts/check_bidi.mjs`.
The brief's "catalogue is a floor, not a ceiling" played out in reverse here:
CSS isolation removed more classes than it added.

---

## B. Content-capability list (parity target)

Each capability is a checklist item; "done" = demonstrated with a rendered,
visually-audited example (brief §5, §6). Status tracked in `CHANGELOG.md`.

### B1. Prose / bidi
- [ ] RTL Hebrew body, justified.
- [ ] Inline LTR islands (single Latin words, multi-word runs, citations, acronyms).
- [ ] Direction-isolation triad: `.h` (RTL island), `.en` (LTR island), `.code` (LTR+mono). *(base.css — done)*
- [ ] Long Latin runs (title pages, English quotations, author names) as explicit LTR units.
- [ ] Latin-name + math parameter as one unit (`Bernoulli (p)`).
- [x] Hebrew ordered-list markers א,ב,ג. *(base.css `ol.heb` + components.hebrewList; examples/typography)*
- [x] Gershayim ״ (U+05F4) for quotes and abbreviations (ע״י, סה״כ). *(examples/typography; the ASCII-quote misuse is caught by check_bidi `hebrew-ascii-quote`)*
- [ ] Reading-direction-aware arrows in prose.
- [ ] Per-glyph font fallback (Hebrew body + Latin + math coverage, verified).
- [ ] Footnotes, cross-references, citations.

### B2. Math (MathJax SVG)
- [ ] Inline math in RTL prose. *(spike 1 — done)*
- [ ] Display math, centered. *(spike 1 — done)*
- [ ] Matrices (`pmatrix`), `cases`, `align`, `aligned`.
- [ ] `amsmath`/`amssymb`/`mathtools` surface: `\coloneqq`, `\tfrac`, `\underbrace`, `\xrightarrow`, `\mapsto`.
- [ ] Named operators: `\sin \cos \det \Tr \gcd` and custom. *(spike 1 — done)*
- [ ] Quantum/braket: `\ket \bra \braket \dyad \expval`, `a^\dagger`, Pauli. *(macros wired in mathjax-render.mjs)*
- [ ] Blackboard/special glyphs (`\mathbb{1}` identity) — verify glyph. *(spike 1: renders 𝟙)*
- [ ] **Hebrew labels adjacent to / inside math** — via HTML overlay, NOT MathJax `\text` (see bug `hebrew-in-math-text`).
- [ ] Monospace in math (`\mathtt`).
- [ ] Math in headings with clean outline text.

### B3. Diagrams / figures (SVG)
- [ ] Block/component diagrams: filled rounded boxes, arrows between anchors, mixed Hebrew+Latin labels. *(spike 3 — done)*
- [ ] Multi-line centered nodes.
- [ ] Decision trees (per-level spacing, yes/no edges, colored leaves).
- [ ] Concept maps (explicit coords, two-line labels).
- [ ] Layered/pyramid diagrams.
- [ ] Line charts (axes, xlabel/ylabel, multiple curves solid+dashed, legend, function plots) — pick a JS/SVG chart approach.
- [ ] Quantum circuits: wires, gates (`H`, multi-qubit `\gate[n]`), control/target, SWAP, measurement, lstick labels. *(spike 3: hand-SVG bell pair — done; needs a reusable generator)*
- [ ] All diagram labels bidi-correct (the A1 win). *(spike 3 — done)*

### B4. Six box types (choose by role, not color)
- [ ] `defbox` (blue) — definition.
- [ ] `thmbox` (green) — theorem/law.
- [ ] `notebox` (amber) — note/convention/tip.
- [ ] `exbox` (purple) — exercise/example (holds code listings).
- [ ] `warnbox` (red) — common-mistake/trap.
- [ ] `keybox` (teal) — key idea / summary / step list.
- [ ] Per-instance titles; inner padding contains listings; `nobreak` (avoid-page-break) variant; per-line step layout.

### B5. Five table patterns (uniform frame + auto-numbered "טבלה N.M." caption inside frame)
- [ ] 1. Basic data table (Hebrew headers, short math islands, booktabs rules).
- [ ] 2. Glossary symbol→meaning (2-col; symbol col r-aligned, meaning col wraps).
- [ ] 3. LTR/code column + multi-line code cell.
- [ ] 4. Two prose columns (term→explanation).
- [ ] 5. Wide numeric / truth table (columns must read L→R — do NOT reverse).
- [ ] Governing rule: Hebrew-primary → columns lay out RTL; LTR-primary (code/truth/matrix) → force LTR column order.
- [ ] Per-chapter table numbering; math islands in cells; very wide → `overflow-x:auto`.

### B6. Listings / code
- [ ] Code blocks with line numbers, colored side-bar, a named style (asm/c).
- [ ] Code inside boxes stays within the border (CSS box model).
- [ ] Inline code with isolated punctuation (`ALUOp=10`, `$rs + $rt`, `lw $t0,0($s0)`).
- [ ] Comments/placeholders in code are English `#`, never Hebrew.

### B7. Document structure
- [ ] Long docs: parts → chapters/sections; short docs: sections only.
- [ ] Title page (large centered Hebrew title; Latin author lines as LTR units).
- [ ] Table of contents with correct, navigable page numbers. *(spike 2 — done via paged.js target-counter)*
- [ ] PDF outline/bookmarks in Unicode Hebrew.
- [ ] Running header ("topic rail" equivalent) + auto page-number footer. *(spike 2 — done via @page margin boxes + string-set)*
- [ ] Footnotes; numbered cross-refs (`\ref`/`\eqref`); equation/table/figure numbering.
- [ ] Optional topic-rail progress header (one dot per part, current enlarged).
- [ ] Multi-file/chapter document composition.
- [ ] Content DNA from `references/content-style.md` applied (density, chapter rhythm, box discipline, worked-exercise format, connective summary chapter). *(ported verbatim)*

### B8. Verification pyramid (process parity)
- [x] Charset/encoding gate (confusable codepoints, font coverage). *(scripts/check_charset.mjs + corpus)*
- [x] DOM-query structural checker (the transferring bug set) — the real-DOM win over regex. *(scripts/check_dom.mjs + dom_ok/dom_bad fixtures)*
- [x] Deterministic print-to-PDF, proven stable. *(normalize_pdf.py + harness T5 byte-compare)*
- [x] Render-gate on the compiled PDF (glyph-order vs reading order). *(scripts/check_render.py + harness T3b)*
- [x] Fail-loud math: any undefined macro / parse error throws at build time, never ships a silent red glyph or `<merror>`. *(src/mathjax-render.mjs + tests/mathjax_render.test.mjs)*
- [x] Fuzz-generated adversarial corpus (island × separator × context). *(scripts/fuzz_bidi.mjs → 140 cases; scripts/check_fuzz.py reading-order oracle + render-gate + dom-check, harness T6)*
- [ ] Visual audit every session. *(process discipline — not automatable)*
- [ ] Content cross-check (physics/math correctness — no gate covers it).
- [x] Pinned versions; the deterministic fuzz corpus doubles as a Chromium canary. *(a dedicated next-Chromium diff, ROADMAP B6, is still open)*
