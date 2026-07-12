// Regression fixtures for src/document.mjs's eq()/display() split.
// eq() is for equations actually cross-referenced later (or a landmark
// result); display() is the unnumbered default for one-off display math.
// This file guards the contract: eq() always numbers + is referenceable,
// display() never numbers and never touches eqCount/refs.
// Run: node tests/document.test.mjs
import { Doc } from '../src/document.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); } };

// eq() numbers sequentially and registers a ref.
{
  const d = new Doc({ title: 't' });
  d.eq('x=1', 'first');
  d.eq('y=2', 'second');
  ok('eq() increments eqCount', d.eqCount === 2);
  ok('eq() registers key ref', d.refs['eq:first'] === 1 && d.refs['eq:second'] === 2);
  const html = d.render();
  ok('eq() emits a visible number', html.includes('(1)') && html.includes('(2)'));
  ok('eq() ref() resolves to the right number', d._resolve(d.ref('first')).includes('(1)'));
}

// display() must NOT number, NOT touch eqCount, and NOT be referenceable.
{
  const d = new Doc({ title: 't' });
  d.display('x=1');
  d.display('y=2');
  ok('display() does not increment eqCount', d.eqCount === 0);
  ok('display() registers no refs', Object.keys(d.refs).length === 0);
  const html = d.render();
  ok('display() emits no eqno span', !html.includes('class="eqno"'));
  ok('display() still emits an eqbody', (html.match(/class="eqbody"/g) || []).length === 2);
  ok('display() uses the eq-plain class', (html.match(/class="eq eq-plain"/g) || []).length === 2);
}

// Mixed usage: display() calls must not perturb eq()'s numbering sequence.
{
  const d = new Doc({ title: 't' });
  d.display('a=1');
  d.eq('b=2', 'only');
  d.display('c=3');
  ok('display() calls do not shift eq() numbering', d.refs['eq:only'] === 1);
}

console.log(`document: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
