# Roadmap — what's left to build, test, and verify

Phase 0 (de-risking + scaffold) is done and all four spikes are GO (`PHASE0.md`).
This file is the ordered work list to reach the brief's "definition of done":
full content-capability parity (`REQUIREMENTS.md §B`) plus, for every bug class,
a named independent mechanism that catches it with evidence it fires on a
positive and stays silent on a negative.

Legend: **[P0]** blocks other work · **[P1]** core parity · **[P2]** polish/scale.
Each item has an **acceptance test** — it isn't done until that passes and the
output is visually audited.

---

## A. Engine gaps found in Phase 0 (do first)

### A1. [P0] Hebrew-in-math overlay helper
MathJax renders Hebrew inside `\text{}` reversed + letter-spaced (spike 1).
Build a helper that keeps the math in MathJax and composes Hebrew labels
(`\underbrace` labels, Hebrew subscripts, "where … " annotations) as **HTML
positioned over/under the SVG**, or as adjacent RTL prose.
- **Acceptance:** render `\underbrace{mc^2}_{אנרגיית מנוחה}` equivalent; the
  Hebrew reads correctly RTL at 300 dpi; extracted glyph order is not reversed.

### A2. [P0] Linter check `hebrew-in-math-text`
Flag any Hebrew codepoint inside a `\text{}`/`\mathrm{}` fed to MathJax, so A1
can never regress silently.
- **Acceptance:** positive fixture (Hebrew in `\text`) trips it; negative fixture
  (Latin in `\text`, Hebrew in HTML label) stays silent.

---

## B. Verification pyramid (build alongside content, not after — brief §4.3)

### B1. [P0] Charset / encoding gate
Confusable-codepoint + font-coverage check against the pinned font set (Arabic
resh/yod look-alikes, raw Greek/math glyphs, Hebrew cantillation marks that tofu).
- **Acceptance:** the old skill's `charset_positive` cases flag; clean text passes.

### B2. [P0] DOM-query structural checker (the architectural win)
Load the rendered DOM (Playwright page eval or jsdom) and run **DOM queries**,
not regex, for the transferring bug set: every text node whose computed
`direction` differs from its parent must sit in an explicit isolate; adjacent
LTR islands separated by a neutral; Latin-token-before-paren; directional arrow
with a Hebrew operand; colon orphaned outside an isolate. IDs mirror the old
linter: `ADJACENT-LTR-ISLANDS`, `ISLAND-NEXT-TO-MATH`, `HEBREW-FLOW-ARROW`,
`HEBREW-EQUATION-ARROW`, plus `hebrew-in-math-text` (A2).
- **Acceptance:** a positive fixture trips every ID; a negative fixture is silent
  (port the old `lint_positives`/`lint_negatives` discipline).

### B3. [P0] Render-gate on the compiled PDF
Using PyMuPDF `rawdict` per-glyph positions (spike 4): detect reversed Latin
runs (visual x-order vs source token order), whole-token reversals, folio-digit
reversal. This is the layer that catches what the DOM check structurally cannot.
- **Acceptance:** fires on a known-bad fixture (deliberately reversed run),
  silent on all known-good example pages.

### B4. [P1] Deterministic build script
Wrap render + `normalize_pdf.py` into one command; prove byte-identical across
two runs (already demonstrated in spike 2 — formalize it as `build.sh` + a
repro check).
- **Acceptance:** `REPRO=1 build.sh doc.html` recompiles and hash-matches.

### B5. [P1] Fuzz-generated adversarial corpus
Combinatorial mixed-direction snippets (island type × separator × nesting ×
context) → render → use the render-gate (B3) as ground truth for reorder.
Mine any new CSS-isolation-specific failure classes (the old catalogue is a
floor, not a ceiling — brief §3.3).
- **Acceptance:** N00+ cases run; results documented; any new class gets a rule.

### B6. [P2] Canary against next Chromium
Re-run the render-gate suite against the next Chromium build; diff vs the pinned
baseline to catch a browser update changing bidi/layout (brief §3.4).

---

## C. Content capabilities (parity target — `REQUIREMENTS.md §B`)

Build as reusable components + a copy-paste gallery each (the old skill's lesson:
a working example to copy beats a list of prohibitions). Every one needs a
rendered, visually-audited example.

- **C1. [P1] Six box types** — `defbox/thmbox/notebox/exbox/warnbox/keybox`
  (color+role per REQUIREMENTS §B4); inner padding contains listings; `nobreak`
  (avoid-page-break) variant; per-line step layout. → `examples/boxes.html`.
- **C2. [P1] Five table patterns** — data / glossary / LTR-code-column /
  two-prose-column / wide-truth-table; uniform frame + auto-numbered "טבלה N.M."
  caption; per-chapter numbering; RTL vs forced-LTR column order. → `examples/tables.html`.
- **C3. [P1] Code listings** — line numbers, side-bar, a named style; contained
  in boxes; inline `.code` with isolated punctuation. Pick a highlighter or
  hand-roll. → `examples/listings.html`.
- **C4. [P1] Document structure** — title page, parts→chapters→sections, TOC
  (done in spike 2 — generalize), running header, footnotes, numbered
  cross-refs (`\ref`/`\eqref` equivalent: auto equation/figure/table numbers +
  links), Unicode PDF outline. → wire into a `document` template.
- **C5. [P1] Diagram generator** — reusable block-diagram + decision-tree +
  concept-map helpers emitting SVG with `<foreignObject>` bidi labels
  (feasibility proven, spike 3). → `examples/diagrams.html`.
- **C6. [P1] Quantum-circuit generator** — wires/gates/control/target/SWAP/meter/
  lstick from a compact spec to SVG (spike 3 hand-authored one; make it reusable).
- **C7. [P2] Charts** — pgfplots equivalent (axes, multiple curves, legend,
  function plots) via a JS/SVG chart approach.
- **C8. [P2] Topic-rail** — optional progress header, one dot per part, current
  enlarged (mirrors the old `topicrail.tex`).
- **C9. [P1] Gershayim + Hebrew list markers** — emit ״ (U+05F4) for quotes/
  abbreviations; support א,ב,ג ordered-list markers.

---

## D. Regression harness + docs

- **D1. [P1] `test_all.sh`** — charset fixtures, DOM-checker positives/negatives,
  render-gate fixtures, all example builds, reproducibility. Green before any
  change is "real" (old skill's discipline).
- **D2. [P1] `selftest`** — per-rule checker corpus (adversarial positives the
  linters must catch + hard-won negatives they must stay silent on).
- **D3. [P2] Single source of truth** — CI-check that every documented example
  actually renders against the current pipeline (brief §3.5).

---

## Suggested order
A1–A2 → B1–B3 (verification floor) → C1–C4 (the bulk of visible parity) →
D1–D2 (lock it) → C5–C9, B4–B6, D3 (scale + polish). Do **not** scale content
(C5+) on an unverified bidi foundation — B2/B3 first (brief §4.3).

## Definition of done (brief §6)
For each bug class in `REQUIREMENTS.md §A` plus every new class from fuzzing:
name the specific independent mechanism that catches it, with session evidence
it fires on a positive and stays silent on a negative — and produce, on demand,
a rendered multi-page document hitting every capability in §B that passes visual
audit.
