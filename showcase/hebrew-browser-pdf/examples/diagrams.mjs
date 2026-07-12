// Example: diagram + quantum-circuit generators (ROADMAP C5/C6).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blockDiagram, circuit, lineChart } from '../src/diagram.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// 1. Block diagram — CPU datapath, mixed Hebrew/Latin labels.
const datapath = blockDiagram({
  width: 560, height: 170,
  nodes: [
    { id: 'pc',  x: 30,  y: 65, w: 90,  h: 44, label: '<bdi dir="ltr">PC</bdi>' },
    { id: 'imem',x: 165, y: 65, w: 110, h: 44, label: 'זיכרון <bdi dir="ltr">(IMEM)</bdi>' },
    { id: 'reg', x: 320, y: 65, w: 110, h: 44, label: 'קובץ אוגרים' },
    { id: 'alu', x: 470, y: 65, w: 70,  h: 44, label: '<bdi dir="ltr">ALU</bdi>', fill: '#eafaef', stroke: '#4a9d63' },
  ],
  edges: [
    { from: 'pc', to: 'imem' },
    { from: 'imem', to: 'reg' },
    { from: 'reg', to: 'alu' },
  ],
});

// 2. Decision tree — colored leaves + yes/no edge labels (same primitive).
const tree = blockDiagram({
  width: 520, height: 230,
  nodes: [
    { id: 'q',  x: 190, y: 15,  w: 140, h: 42, label: 'פגיעת <bdi dir="ltr">cache</bdi>?' },
    { id: 'hit',x: 60,  y: 150, w: 130, h: 42, label: 'קרא מהיר', fill: '#eafaef', stroke: '#4a9d63' },
    { id: 'miss',x: 330, y: 150, w: 150, h: 42, label: 'טען מ<bdi dir="ltr">DRAM</bdi>', fill: '#fdeeec', stroke: '#c0392b' },
  ],
  edges: [
    { from: 'q', to: 'hit',  label: 'כן' },
    { from: 'q', to: 'miss', label: 'לא' },
  ],
});

// 3. Quantum circuits.
const bell = circuit({
  wires: 2, wireLabels: ['|0⟩', '|0⟩'],
  columns: [
    [{ g: 'H', wire: 0 }],
    [{ ctrl: 0, target: 1 }],
    [{ meter: 0 }, { meter: 1 }],
  ],
});
const teleport = circuit({
  wires: 3, wireLabels: ['|ψ⟩', '|0⟩', '|0⟩'],
  columns: [
    [{ g: 'H', wire: 1 }],
    [{ ctrl: 1, target: 2 }],
    [{ ctrl: 0, target: 1 }],
    [{ g: 'H', wire: 0 }],
    [{ meter: 0 }, { meter: 1 }],
    [{ g: 'Z', wire: 2 }],
  ],
});

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style> @page { size: A4; margin: 18mm; } h1{font-size:17pt} h2{font-size:13pt;margin:16px 0 6px}
  .fig{margin:8px 0 4px} svg{display:block;margin:0 auto} .cap{text-align:center;font-size:10pt;color:#444} </style></head>
<body><h1>דיאגרמות ומעגלים — מחוללים</h1>

<h2>1 · דיאגרמת בלוקים (תוויות מעורבות עברית/לטינית)</h2>
<div class="fig">${datapath}</div>
<div class="cap">נתיב נתונים: <bdi dir="ltr">PC → IMEM</bdi> ← אוגרים ← <bdi dir="ltr">ALU</bdi> — הלטינית קדימה, ללא היפוך</div>

<h2>2 · עץ החלטה (עלים צבועים, תוויות קשת)</h2>
<div class="fig">${tree}</div>

<h2>3 · מעגל זוג בל</h2>
<div class="fig">${bell}</div>
<div class="cap"><bdi dir="ltr">H</bdi> ואז <bdi dir="ltr">CNOT</bdi> ואז מדידה</div>

<h2>4 · מעגל טלפורטציה</h2>
<div class="fig">${teleport}</div>

<h2>5 · גרף קווי (האצה מול מספר ליבות — חוק אמדל)</h2>
<div class="fig">${lineChart({
  xLabel: 'מספר ליבות', yLabel: 'האצה', xTicks: 4,
  series: [
    { name: 'אידאלי', points: [[1,1],[2,2],[4,4],[8,8],[16,16]], dashed: true },
    { name: 'בפועל (p=0.9)', points: [[1,1],[2,1.8],[4,3.1],[8,4.7],[16,6.4]] },
  ],
})}</div>
<div class="cap">קו מקווקו — האצה אידאלית; קו מלא — חוק אמדל עם חלק סדרתי של <span class="en">10%</span></div>
</body></html>`;

fs.writeFileSync(path.join(here, 'diagrams.html'), html);
console.log('wrote diagrams.html');
