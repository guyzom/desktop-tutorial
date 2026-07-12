// Example gallery: Hebrew typography (ROADMAP C9 / REQUIREMENTS B1) — gershayim
// ״ (U+05F4) and geresh ׳ (U+05F3) in abbreviations, and Hebrew-numeral ordered
// lists (א,ב,ג). Everything here uses the CORRECT Unicode marks, so the charset
// gate allows them and the bidi linter's hebrew-ascii-quote rule stays silent;
// the same rule FIRES on the ASCII " / ' forms (proven in the corpus test).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { box, hebrewList } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const body = [
  box('note', 'גרשיים ״ בראשי־תיבות',
    `ראשי־תיבות עבריים נכתבים עם גרשיים לפני האות האחרונה: סה״כ, תנ״ך, ע״י, מו״ל, ד״ר, כ״ץ.
     יחידות ומידות: ק״מ, ס״מ, מ״ג. אין להשתמש בגרש כפול <span class="code">"</span> של מקלדת —
     הוא נראה שגוי ונתפס על־ידי <span class="en">check_bidi</span>.`),

  box('note', 'גרש ׳ במילה בודדת',
    `גרש בודד לקיצור או לתעתיק: ר׳ (רבי), עמ׳ (עמוד), וכו׳, ג׳ורג׳, צ׳ק, ג׳ל.`),

  box('key', 'רשימה ממוספרת עברית (א,ב,ג)',
    hebrewList([
      'הגדרת המרחב והבסיס.',
      'ניסוח תנאי הנרמול (אי <span class="en">LTR</span> משובץ נשאר תקין).',
      'הוכחת יחידוּת הפתרון עד כדי פאזה גלובלית.',
      'מסקנה: הייצוג חד־חד־ערכי.',
    ])),

  box('def', 'רשימת תבליטים רגילה',
    hebrewList([
      'איבר ראשון עם אי <span class="en">LTR</span> כמו <span class="code">git commit</span>.',
      'איבר שני עם קיצור ותק״ן (תקנון).',
      'איבר שלישי.',
    ], { ordered: false })),
].join('\n');

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style> @page { size: A4; margin: 18mm; } h1 { font-size: 17pt; } </style></head>
<body><h1>טיפוגרפיה עברית — גרשיים, גרש, ורשימות א,ב,ג</h1>
<p>הפיסוק העברי הנכון (״ ׳) והמרקרים העבריים הם חלק מ־parity; הצורה ה<span class="en">ASCII</span> נתפסת בשער.</p>
${body}
</body></html>`;

fs.writeFileSync(path.join(here, 'typography.html'), html);
console.log('wrote typography.html');
