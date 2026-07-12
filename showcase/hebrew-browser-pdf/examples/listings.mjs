// Example: code listings (ROADMAP C3), including a listing inside a box.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { box, codeBlock } from '../src/components.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const mips = `strcpy: addi $sp, $sp, -4      # push frame
        sw   $s0, 0($sp)       # save $s0
        add  $s0, $zero, $zero # i = 0
loop:   add  $t1, $s0, $a1     # &y[i]
        lb   $t2, 0($t1)       # $t2 = y[i]
        add  $t3, $s0, $a0     # &x[i]
        sb   $t2, 0($t3)       # x[i] = y[i]
        beq  $t2, $zero, done  # if y[i]==0 stop
        addi $s0, $s0, 1       # i++
        j    loop
done:   lw   $s0, 0($sp)`;

const py = `def teleport(state):
    # share a Bell pair, then measure
    a, b = bell_pair()
    m1, m2 = measure_bell(state, a)
    return correct(b, m1, m2)  # apply X/Z`;

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<link rel="stylesheet" href="../assets/css/base.css">
<style> @page { size: A4; margin: 18mm; } h1{font-size:17pt} h2{font-size:12pt;color:#555;margin:14px 0 4px} </style></head>
<body><h1>רשימות קוד</h1>
<p>קוד תמיד <span class="en">LTR</span> מבודד — סימני פיסוק (<span class="code">$ ( ) [ ] ; :</span>) לא מתהפכים. הערות באנגלית, לעולם לא עברית בתוך רצף קוד.</p>

<h2>1 · רשימה עם מספרי שורות</h2>
${codeBlock(mips, { numbered: true, lang: 'mips' })}

<h2>2 · רשימה בתוך קופסת תרגיל (מוכלת במסגרת)</h2>
${box('ex', 'תרגיל — <span class="code">strcpy</span> ב־MIPS',
  `<div>ממשו העתקת מחרוזת. הפתרון בהמשך; שימו לב לשמירת <span class="code">$s0</span> במחסנית.</div>` +
  codeBlock(mips, { numbered: false, lang: 'mips' }))}

<h2>3 · קוד גבוה יותר (<span class="en">Python</span>)</h2>
${codeBlock(py, { numbered: true, lang: 'python' })}
</body></html>`;

fs.writeFileSync(path.join(here, 'listings.html'), html);
console.log('wrote listings.html');
