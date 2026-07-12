// Document assembly (ROADMAP C4): title page, parts, chapters, a paged.js TOC,
// auto-numbered display equations with cross-references, and footnotes.
// Numbering + refs are resolved at build time (a linear pass with a placeholder
// substitution at the end, so forward refs also work). Pagination, TOC page
// numbers, running headers and page-number footers come from paged.js + @page
// (proven in Phase 0 spike 2).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tex2svg } from './mathjax-render.mjs';

const D = (t) => tex2svg(t, { display: true });
// UI labels are DATA (config/labels.json).
const _here = path.dirname(fileURLToPath(import.meta.url));
const LABELS = JSON.parse(fs.readFileSync(path.join(_here, '../config/labels.json'), 'utf8'));

export class Doc {
  constructor({ title, subtitle = '' } = {}) {
    this.title = title;
    this.subtitle = subtitle;
    this.chunks = [];       // body HTML fragments
    this.toc = [];          // {id, label, kind}
    this.eqCount = 0;
    this.refs = {};         // key -> number (equations, chapters)
    this.footnotes = [];    // per-page footnote defs are inlined at the marker
    this._chAuto = 0;
    this._partIdx = -1;
    this.rail = null;       // opt-in topic rail: array of part labels
  }

  // Opt-in "you are here" progress rail (one dot per part, current enlarged).
  // Pass one short label per part, in order.
  topicRail(labels) { this.rail = labels; return this; }

  part(label) {
    this._partIdx += 1;
    this.chunks.push(`<section class="part-divider" data-part="${this._partIdx}"><h1 class="part-title">${label}</h1></section>`);
    return this;
  }

  chapter(label, key) {
    const id = key || `ch${++this._chAuto}`;
    this._chAuto = Math.max(this._chAuto, 0);
    this.toc.push({ id, label, kind: 'chapter' });
    if (key) this.refs[key] = this.toc.filter((t) => t.kind === 'chapter').length;
    this.chunks.push(`<h2 class="chapter" id="${id}">${label}</h2>`);
    return this;
  }

  html(fragment) { this.chunks.push(fragment); return this; }
  p(fragment) { this.chunks.push(`<p>${fragment}</p>`); return this; }

  // Auto-numbered display equation. key -> referenceable via ref(key).
  // Use this ONLY for equations actually cited later via ref()/chapRef(), or
  // the single landmark result of a definition/theorem. Numbering every
  // display equation (a common LaTeX-\begin{equation}-by-default habit) buries
  // the few that matter under many that are never pointed back to — prefer
  // display() below for one-off math that stands on its own.
  eq(tex, key) {
    const n = ++this.eqCount;
    if (key) this.refs['eq:' + key] = n;
    const id = key ? `eq-${key}` : `eq-${n}`;
    this.chunks.push(
      `<div class="eq" id="${id}"><span class="eqno">(${n})</span>` +
      `<span class="eqbody">${D(tex)}</span></div>`);
    return this;
  }

  // Unnumbered display equation: centered, same spacing as eq(), but no
  // number and not referenceable. This is the default choice for display math
  // that is shown once and not cited again — most display equations in a
  // running exposition. Reach for eq() only when you already know this
  // expression will be the target of a later ref()/chapRef().
  display(tex) {
    this.chunks.push(`<div class="eq eq-plain"><span class="eqbody">${D(tex)}</span></div>`);
    return this;
  }

  // Cross-reference: resolved at render() time (works for forward refs too).
  ref(key) { return `<a class="xref" href="#eq-${key}">§EQREF:${key}§</a>`; }
  chapRef(key) { return `<span class="xref">§CHREF:${key}§</span>`; }

  // Footnote: a superscript marker + the note text, placed as a paged.js
  // page-bottom float.
  footnote(noteHtml) {
    const n = ++this._fnAuto || (this._fnAuto = 1);
    return `<span class="fn"><sup class="fn-mark">${n}</sup>` +
           `<span class="fn-def">${noteHtml}</span></span>`;
  }

  _resolve(html) {
    return html
      .replace(/§EQREF:([^§]+)§/g, (_, k) => this.refs['eq:' + k] != null ? `(${this.refs['eq:' + k]})` : '(??)')
      .replace(/§CHREF:([^§]+)§/g, (_, k) => this.refs[k] != null ? `${this.refs[k]}` : '??');
  }

  render({ css = '../assets/css/base.css', paged = false } = {}) {
    const tocRows = this.toc.map((t) =>
      `<li><span class="name"><a href="#${t.id}">${t.label}</a></span>` +
      `<span class="lead"></span><span class="pgcell"><a href="#${t.id}"></a></span></li>`).join('\n');
    const body = this._resolve(this.chunks.join('\n'));
    // PAGED.JS QUARANTINE (v0.8.0): the polyfill silently DROPS content at
    // natural page overflow — proven by the content-completeness render gate on
    // a real 57-page document (entire boxes and exercise tails missing) and on
    // controlled fixtures (60-row table: 0/60 rows under break-inside:avoid,
    // 26/60 under auto, 18/60 even pre-chunked). Default is therefore PLAIN
    // Chromium pagination, which rendered 100% of the same content. Modern
    // Chromium renders @page margin boxes with counter(page) NATIVELY, so the
    // folio (@bottom-center in document.css) needs no polyfill; string-set /
    // string() does NOT render natively, so the cost until a replacement lands
    // is: no running chapter header and no topic rail. paged:true stays
    // available for isolated experiments only.
    const railStyle = paged && this.rail ? `<style>@page{@top-center{content:'';}}</style>` : '';
    const railScript = paged && this.rail
      ? `<script>window.__railLabels=${JSON.stringify(this.rail)};</script>\n<script src="../assets/topicrail.js"></script>`
      : '';
    const pagedScripts = paged
      ? `<script>window.PagedConfig={auto:true,after:()=>{window.__pagedRendered=true;}};</script>\n<script src="../assets/vendor/paged.polyfill.js"></script>\n`
      : '';
    return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="${css}">
<link rel="stylesheet" href="../assets/css/document.css">${railStyle}</head>
<body>
<section class="titlepage"><div class="tp-title">${this.title}</div>${this.subtitle ? `<div class="tp-sub">${this.subtitle}</div>` : ''}</section>
<nav class="toc"><h2>${LABELS.tableOfContents}</h2><ul>${tocRows}</ul></nav>
${body}
${pagedScripts}${railScript}
</body></html>`;
  }
}
