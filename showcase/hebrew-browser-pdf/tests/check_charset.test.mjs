// Fixtures for scripts/check_charset.mjs. Run: node tests/check_charset.test.mjs
import { scan } from '../scripts/check_charset.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.error(`FAIL: ${name}`); } };
const fires = (s) => scan(s, { raw: true }).length > 0;

// Positives — must fire.
ok('arabic yeh confusable', fires('מהירות ي'));                 // ي looks like Hebrew
ok('arabic reh confusable', fires('ر בתוך עברית'));             // ر looks like resh
ok('cyrillic lookalike', fires('AАB'));                        // Cyrillic А
ok('hebrew cantillation', fires('בְּרֵאשִׁ֑ית'));                // te'amim -> tofu in Frank Ruhl
ok('bidi override control', fires('שלום ‮ Datapath'));         // RLO
ok('zero-width', fires('קוד​פוינט'));

// Negatives — must stay silent.
ok('plain hebrew', !fires('שלום עולם, זהו טקסט תקין.'));
ok('hebrew+latin mix', !fires('מעבד (CPU) עם math'));
ok('nikud is fine', !fires('בְּרֵאשִׁית'));                          // vowels render in Frank Ruhl
ok('shekel and degree', !fires('טמפרטורה 20° ומחיר 5₪'));           // both render
ok('gershayim', !fires('ע״י וגם סה״כ'));                            // U+05F4 renders

console.log(`\ncheck_charset: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
