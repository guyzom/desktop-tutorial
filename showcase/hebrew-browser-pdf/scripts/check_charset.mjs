// Charset gate (ROADMAP B1). Flags codepoints that silently tofu or confuse:
// Arabic/Cyrillic look-alikes of Hebrew/Latin, Hebrew cantillation marks (valid
// Hebrew-block codepoints that Frank Ruhl Libre has no glyph for), and stray
// bidi/zero-width control characters. Allow-list is font-reality-based: what
// Frank Ruhl actually renders is permitted (° ₪ nikud maqaf geresh/gershayim).
//
// Usage: node scripts/check_charset.mjs <file...>   (scans .html/.mjs text)
//        import { scan } from './check_charset.mjs'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rules are DATA (config/charset-rules.json); this stays a generic range lookup.
const here = path.dirname(fileURLToPath(import.meta.url));
const RULES = JSON.parse(fs.readFileSync(path.join(here, '../config/charset-rules.json'), 'utf8')).rules
  .map((r) => ({ reason: r.reason, ranges: r.ranges.map(([lo, hi]) => [parseInt(lo, 16), parseInt(hi, 16)]) }));

function classify(cp) {
  for (const r of RULES) {
    if (r.ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) return r.reason;
  }
  return null;
}

const NAME = (cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');

// Strip tags/style/script/comments so we scan visible authored text only.
function visibleText(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export function scan(src, { raw = false } = {}) {
  const text = raw ? src : visibleText(src);
  const findings = [];
  let line = 1;
  for (const ch of text) {
    if (ch === '\n') { line++; continue; }
    const cp = ch.codePointAt(0);
    const reason = classify(cp);
    if (reason) findings.push({ line, cp: NAME(cp), char: ch, reason });
  }
  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: check_charset.mjs <file...>'); process.exit(2); }
  let total = 0;
  for (const f of files) {
    // .mjs authored source is scanned raw (it IS the content); .html stripped.
    const raw = f.endsWith('.mjs');
    for (const x of scan(fs.readFileSync(f, 'utf8'), { raw })) {
      total++;
      console.log(`${f}:${x.line}: [charset] ${x.cp} (${JSON.stringify(x.char)}) — ${x.reason}`);
    }
  }
  console.log(total ? `\n${total} finding(s).` : 'charset clean.');
  process.exit(total ? 1 : 0);
}
