// SVG diagram + quantum-circuit generators (ROADMAP C5/C6).
// Labels are HTML inside <foreignObject> so they get full HTML bidi — the
// spike-3 result that makes the old "reversed-latin-in-tikz-node" class vanish.
// The label string is authored HTML: use .h/.en islands as needed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Colors are DATA (config/palette.json), not code.
const _here = path.dirname(fileURLToPath(import.meta.url));
const PALETTE = JSON.parse(fs.readFileSync(path.join(_here, '../config/palette.json'), 'utf8'));

// ---- Block / component diagrams (also serves decision trees & concept maps) ----
// blockDiagram({ width, height, nodes, edges, fontSize })
//   nodes: [{ id, x, y, w, h, label, fill?, stroke? }]   (x,y = top-left)
//   edges: [{ from, to, label?, dashed?, bidir? }]
function labelFO(x, y, w, h, label, fontSize) {
  return `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="height:${h}px;display:flex;` +
    `align-items:center;justify-content:center;text-align:center;direction:rtl;` +
    `font-family:'Frank Ruhl Libre',serif;font-size:${fontSize}px;line-height:1.15">${label}</div></foreignObject>`;
}
// Point where the segment center->toward exits an axis-aligned rect (half w/h).
function edgePoint(cx, cy, hw, hh, tx, ty) {
  const dx = tx - cx, dy = ty - cy;
  const sx = dx ? hw / Math.abs(dx) : Infinity;
  const sy = dy ? hh / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}
export function blockDiagram({ width, height, nodes, edges = [], fontSize = 15 }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const c = (n) => [n.x + n.w / 2, n.y + n.h / 2];
  const rects = nodes.map((n) =>
    `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" ` +
    `fill="${n.fill || PALETTE.blockNodeFill}" stroke="${n.stroke || PALETTE.blockNodeStroke}" stroke-width="1.5"/>` +
    labelFO(n.x, n.y, n.w, n.h, n.label, fontSize)).join('\n');
  const arrows = edges.map((e) => {
    const a = byId[e.from], b = byId[e.to];
    const [ax, ay] = c(a), [bx, by] = c(b);
    const [x1, y1] = edgePoint(ax, ay, a.w / 2, a.h / 2, bx, by);
    const [x2, y2] = edgePoint(bx, by, b.w / 2, b.h / 2, ax, ay);
    const dash = e.dashed ? ' stroke-dasharray="5 4"' : '';
    const startMark = e.bidir ? ' marker-start="url(#arrowrev)"' : '';
    let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="1.5" ` +
            `marker-end="url(#arrow)"${startMark}${dash}/>`;
    if (e.label) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      s += `<foreignObject x="${mx - 40}" y="${my - 22}" width="80" height="18">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;direction:rtl;` +
        `font-family:'Frank Ruhl Libre';font-size:${fontSize - 3}px;background:#fff">${e.label}</div></foreignObject>`;
    }
    return s;
  }).join('\n');
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#222"/></marker>
    <marker id="arrowrev" markerWidth="9" markerHeight="9" refX="1" refY="4.5" orient="auto"><path d="M9,0 L0,4.5 L9,9 z" fill="#222"/></marker>
  </defs>
  ${arrows}
  ${rects}
</svg>`;
}

// ---- Line charts (ROADMAP C7 — pgfplots equivalent) ----
// lineChart({ width, height, series, xLabel, yLabel, xTicks, yTicks, legend })
//   series: [{ name, points: [[x,y],...], dashed?, color? }]
//   Axis labels are HTML (<foreignObject>) so Hebrew is bidi-correct.
export function lineChart({ width = 460, height = 300, series, xLabel = '', yLabel = '',
  xTicks = 5, yTicks = 5, legend = true, colors = PALETTE.chartSeries }) {
  const m = { top: 16, right: 16, bottom: 46, left: 52 };
  const iw = width - m.left - m.right, ih = height - m.top - m.bottom;
  const allX = series.flatMap((s) => s.points.map((p) => p[0]));
  const allY = series.flatMap((s) => s.points.map((p) => p[1]));
  const xmin = Math.min(...allX), xmax = Math.max(...allX);
  const ymin = Math.min(0, ...allY), ymax = Math.max(...allY);
  const sx = (x) => m.left + ((x - xmin) / (xmax - xmin || 1)) * iw;
  const sy = (y) => m.top + ih - ((y - ymin) / (ymax - ymin || 1)) * ih;
  const nice = (v) => (Math.abs(v) >= 100 || Number.isInteger(v)) ? String(Math.round(v)) : v.toFixed(1);

  let g = '';
  // gridlines + ticks
  for (let i = 0; i <= yTicks; i++) {
    const y = ymin + (i / yTicks) * (ymax - ymin), py = sy(y);
    g += `<line x1="${m.left}" y1="${py}" x2="${m.left + iw}" y2="${py}" stroke="#eee" stroke-width="1"/>`;
    g += `<text x="${m.left - 6}" y="${py + 3.5}" text-anchor="end" font-size="10" font-family="serif" fill="#555">${nice(y)}</text>`;
  }
  for (let i = 0; i <= xTicks; i++) {
    const x = xmin + (i / xTicks) * (xmax - xmin), px = sx(x);
    g += `<text x="${px}" y="${m.top + ih + 15}" text-anchor="middle" font-size="10" font-family="serif" fill="#555">${nice(x)}</text>`;
  }
  // axes
  g += `<line x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top + ih}" stroke="#222" stroke-width="1.2"/>`;
  g += `<line x1="${m.left}" y1="${m.top + ih}" x2="${m.left + iw}" y2="${m.top + ih}" stroke="#222" stroke-width="1.2"/>`;
  // series
  series.forEach((s, i) => {
    const col = s.color || colors[i % colors.length];
    const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
    g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.8"${s.dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
    s.points.forEach((p) => { g += `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="2.4" fill="${col}"/>`; });
  });
  // axis labels (HTML). The y-label sits horizontally just above the y-axis top
  // (a rotated <foreignObject> places unreliably across the print pipeline).
  if (yLabel) g += `<foreignObject x="${m.left - 6}" y="1" width="120" height="15"><div xmlns="http://www.w3.org/1999/xhtml" style="direction:rtl;font:11px 'Frank Ruhl Libre';color:#333">${yLabel}</div></foreignObject>`;
  if (xLabel) g += `<foreignObject x="${m.left}" y="${m.top + ih + 24}" width="${iw}" height="18"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;direction:rtl;font:11px 'Frank Ruhl Libre'">${xLabel}</div></foreignObject>`;
  // legend
  if (legend && series.length > 1) {
    let ly = m.top + 4;
    series.forEach((s, i) => {
      const col = s.color || colors[i % colors.length];
      g += `<line x1="${m.left + iw - 90}" y1="${ly}" x2="${m.left + iw - 72}" y2="${ly}" stroke="${col}" stroke-width="2"${s.dashed ? ' stroke-dasharray="4 3"' : ''}/>`;
      g += `<foreignObject x="${m.left + iw - 68}" y="${ly - 8}" width="64" height="16"><div xmlns="http://www.w3.org/1999/xhtml" style="direction:rtl;font:10px 'Frank Ruhl Libre'">${s.name}</div></foreignObject>`;
      ly += 15;
    });
  }
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${g}</svg>`;
}

// ---- Quantum circuits ----
// circuit({ wires, columns, wireLabels?, colGap?, wireGap? })
//   wires: number of qubits (top=0)
//   wireLabels: ['|0⟩', ...] shown at the left (LTR)
//   columns: array of columns; each column is an array of gate ops:
//     { g:'H', wire } box gate | { ctrl, target } control->target (CNOT) |
//     { x:wire } bare target (⊕) | { meter:wire } | { swap:[a,b] }
export function circuit({ wires, columns, wireLabels = [], colGap = 62, wireGap = 46, pad = 20, labelW = 46 }) {
  const x0 = pad + labelW;
  const width = x0 + columns.length * colGap + pad;
  const height = pad * 2 + (wires - 1) * wireGap + 20;
  const wy = (w) => pad + 10 + w * wireGap;
  const cx = (i) => x0 + i * colGap + colGap / 2;

  let els = '';
  // wires
  for (let w = 0; w < wires; w++) {
    els += `<line x1="${x0}" y1="${wy(w)}" x2="${width - pad}" y2="${wy(w)}" stroke="#222" stroke-width="1.3"/>`;
    if (wireLabels[w]) {
      els += `<foreignObject x="${pad - 4}" y="${wy(w) - 12}" width="${labelW}" height="24">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="direction:ltr;text-align:right;` +
        `font-family:serif;font-size:15px">${wireLabels[w]}</div></foreignObject>`;
    }
  }
  // columns
  columns.forEach((col, i) => {
    const x = cx(i);
    for (const op of col) {
      if (op.g != null) {
        const s = 32;
        els += `<rect x="${x - s / 2}" y="${wy(op.wire) - s / 2}" width="${s}" height="${s}" fill="#fff" stroke="#222" stroke-width="1.4"/>` +
          `<foreignObject x="${x - s / 2}" y="${wy(op.wire) - s / 2}" width="${s}" height="${s}">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" style="height:${s}px;display:flex;align-items:center;justify-content:center;direction:ltr;font-family:serif;font-size:16px">${op.g}</div></foreignObject>`;
      } else if (op.ctrl != null && op.target != null) {
        els += `<line x1="${x}" y1="${wy(op.ctrl)}" x2="${x}" y2="${wy(op.target)}" stroke="#222" stroke-width="1.3"/>` +
          `<circle cx="${x}" cy="${wy(op.ctrl)}" r="4.5" fill="#222"/>` +
          `<circle cx="${x}" cy="${wy(op.target)}" r="11" fill="none" stroke="#222" stroke-width="1.4"/>` +
          `<line x1="${x}" y1="${wy(op.target) - 11}" x2="${x}" y2="${wy(op.target) + 11}" stroke="#222" stroke-width="1.4"/>` +
          `<line x1="${x - 11}" y1="${wy(op.target)}" x2="${x + 11}" y2="${wy(op.target)}" stroke="#222" stroke-width="1.4"/>`;
      } else if (op.x != null) {
        els += `<circle cx="${x}" cy="${wy(op.x)}" r="11" fill="none" stroke="#222" stroke-width="1.4"/>` +
          `<line x1="${x}" y1="${wy(op.x) - 11}" x2="${x}" y2="${wy(op.x) + 11}" stroke="#222" stroke-width="1.4"/>`;
      } else if (op.meter != null) {
        const s = 34, y = wy(op.meter);
        els += `<rect x="${x - s / 2}" y="${y - 17}" width="${s}" height="34" fill="#fff" stroke="#222" stroke-width="1.4"/>` +
          `<path d="M${x - 10},${y + 6} A10,10 0 0,1 ${x + 10},${y + 6}" fill="none" stroke="#222" stroke-width="1.3"/>` +
          `<line x1="${x}" y1="${y + 6}" x2="${x + 8}" y2="${y - 7}" stroke="#222" stroke-width="1.3"/>`;
      } else if (op.swap) {
        const [a, b] = op.swap;
        els += `<line x1="${x}" y1="${wy(a)}" x2="${x}" y2="${wy(b)}" stroke="#222" stroke-width="1.3"/>`;
        for (const w of op.swap) {
          els += `<line x1="${x - 6}" y1="${wy(w) - 6}" x2="${x + 6}" y2="${wy(w) + 6}" stroke="#222" stroke-width="1.4"/>` +
            `<line x1="${x - 6}" y1="${wy(w) + 6}" x2="${x + 6}" y2="${wy(w) - 6}" stroke="#222" stroke-width="1.4"/>`;
        }
      }
    }
  });
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${els}</svg>`;
}
