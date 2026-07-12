// Generate the data-driven parts of base.css from config/*.json.
// The JSON files are the source of truth; this injects the generated rules into
// marked blocks in assets/css/base.css (single linked stylesheet — no @import,
// which the paged.js re-fetch handles unreliably).
//
// Blocks (delimited by "/* @generated <name> ... */ ... /* @end <name> */"):
//   boxes  — the six .box-<role> colour rules   (config/boxes.json)
//   tokens — :root design tokens                (config/theme.json)
//   labels — the table-caption prefix rule       (config/labels.json)
//
// Run: node scripts/gen-css.mjs   (idempotent; the harness runs it first)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = (f) => JSON.parse(fs.readFileSync(path.join(here, '../config', f), 'utf8'));
const CSS = path.join(here, '../assets/css/base.css');

function genBoxes() {
  const boxes = cfg('boxes.json');
  // Bar-less filled cards (v0.9.7): the full-card fill carries the weight
  // ladder; the title color names the role. No border rules are emitted.
  return Object.entries(boxes).filter(([k]) => k !== '_comment').map(([role, c]) =>
    `.box-${role} { background: ${c.body}; } ` +
    `.box-${role} .box-title { color: ${c.title}; }`).join('\n');
}

function genTokens() {
  const t = cfg('theme.json');
  const vars = Object.entries(t).filter(([k]) => k !== '_comment')
    .map(([k, v]) => `  --${k}: ${v};`).join('\n');
  return `:root {\n${vars}\n}`;
}

function genLabels() {
  const l = cfg('labels.json');
  return `.tablebox .tabcap::before { content: "${l.tableCaptionPrefix}" counter(tbl) ". "; }`;
}

const GEN = { boxes: genBoxes, tokens: genTokens, labels: genLabels };

let css = fs.readFileSync(CSS, 'utf8');
for (const [name, gen] of Object.entries(GEN)) {
  const re = new RegExp(`(/\\* @generated ${name}[^*]*\\*/)[\\s\\S]*?(/\\* @end ${name} \\*/)`);
  if (!re.test(css)) { console.warn(`[gen-css] no @generated ${name} block in base.css — skipped`); continue; }
  css = css.replace(re, `$1\n${gen()}\n$2`);
}
fs.writeFileSync(CSS, css);
console.log('[gen-css] base.css regenerated from config/');
