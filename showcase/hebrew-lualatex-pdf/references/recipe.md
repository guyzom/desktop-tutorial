# מתכון LuaLaTeX לעברית + מתמטיקה (גרסה 3.8)

תיעוד של סטאק שעבד בפועל ליצירת קובצי PDF אקדמיים בעברית עם נוסחאות LaTeX.
כולל את המתכון המלא, כל כלל עם הסיבה שמאחוריו, ודוגמה מינימלית שמתקמפלת.

> **מה השתנה מגרסה 1** (כל השינויים מסומנים `★` בגוף המסמך):
> 1. **`[no-math]` ב-fontspec** — תיקון הבאג שגרם לאופרטורים מתמטיים (`\sin`, `\cos`,
>    `\operatorname`, אותיות לטיניות במתמטיקה) לצאת כריבועי tofu. זה הבאג המרכזי של גרסה 1,
>    והוא פגע בדיוק בשימוש המוצהר — "עברית + מתמטיקה".
> 2. **Frank Ruhl Libre כברירת מחדל** לפונט הגוף (לא DejaVu Sans), + **fallback ללטינית
>    בתוך עברית** כדי שמילים אנגליות בפסקה לא יצאו tofu.
> 3. **קופסאות צבעוניות עם `mdframed`** — עובד מצוין ב-LuaLaTeX תחת RTL. (גרסה 1 ניתבה את
>    זה בטעות למסלול ה-HTML.)
> 4. **מעגלים קוונטיים עם `quantikz`** — עטיפה ב-island של LTR. לא היה במקור.
> 5. **`report` למסמכים ארוכים** רב-חלקיים (לא `article`).
> 6. **דוגמה מינימלית חזקה יותר** — מפעילה את הקצוות (operators, לטינית במתמטיקה, קופסה,
>    מעגל) כדי שתתפוס באגים במקום להסתיר אותם.

> **★★ מה השתנה מגרסה 2** (מסומן `★★`, מתוך בנייה בפועל של מסמך בן 100 עמ'):
> 1. **התנגשויות שמות מאקרו בפרמבל** — `\proj` (quantikz), `\mod` (amsmath), `\ket`/`\bra`/`\braket`
>    (quantikz) עוצרים הידור עם "already defined". הפתרון: `\providecommand` ל-braket + הימנעות מהשמות התפוסים.
> 2. **`hyperref` בעברית** — חובה `[unicode]` לבוקמרקים, ו-`\texorpdfstring` לכל כותרת שמכילה מתמטיקה
>    (הגאפ הכי שקט של גרסה 2 — הבוקמרק יוצא משובש בלי אזהרה קשה).
> 3. **ריצות לטיניות ארוכות** (עמוד שער, ציטוטי ספרים) — עטוף ב-`\foreignlanguage{english}{...}`; ה-fallback
>    לבדו לא תמיד תופס כיוון נכון לריצה מרובת-מילים.
> 4. **הבהרות** — `babel-he.ini` (לא `babel-hebrew.ini`); `\lstick` עברי מותר אך `\gate` לא; `\swap`/`\targX`
>    עובדים; הדוגמה המינימלית חוזקה לכלול כותרת-עם-מתמטיקה + hyperref כדי לתפוס את באג הבוקמרק.

> **✓ מה תוקן בגרסה 3.1** (תיקון עקביות, לא תוכן חדש): סתירת DejaVu בגוף המסמך. ה-TL;DR ורשימת
> הפונטים המליצו `\babelfont{rm}{DejaVu Serif}` כגוף, בעוד האזהרה ★★ והדוגמה אמרו של-Serif אין
> עברית. אומת אמפירית ב-build הזה: `DejaVuSerif.ttf` → אין aleph (U+05D0), כל העברית tofu;
> `DejaVuSans.ttf` → aleph קיים. תוקן: הגוף הוא Frank Ruhl; DejaVu Serif הוא fallback ללטינית
> בלבד; חירום בלי-רשת = DejaVu **Sans** (לא Serif).

> **✓ מה תוקן בגרסה 3.2** (חיזוק כלים וניידות, אומת בקומפילציה): (1) **`build.sh` נכשל-סגור** —
> בודק את קוד היציאה של lualatex ומוודא שה-PDF נוצר מחדש בריצה; קריסה שהגרסה הקודמת דיווחה עליה
> כ-"0 שגיאות" עכשיו יוצאת non-zero. (2) **פונט לפי שם משפחה** בפרמבל במקום `Path=/root/.fonts/`
> הקשיח — נייד בין מכונות (HOME שונה); נתיב מפורש נשאר כמוצא חירום. (3) **מקור-אמת יחיד**:
> `example.tex` עושה `\input{preamble.tex}` (בודק את הפרמבל האמיתי, לא עותק מוקטן); אם ה-recipe
> סותר את ה-assets — ה-assets קובעים. (4) `setup_fonts.sh` נוקה מהוראות CSS שדלפו מסקיל ה-HTML.

> **✓ מה תוקן בגרסה 3.3** (באג גליף שקט, אומת בעין): המאקרו `\id` (אופרטור הזהות) הוגדר
> `\mathbb{1}`. הפונט msbm של `amssymb` מכיל בלקבורד רק לאותיות A–Z, בלי ספרות — לכן `\mathbb{1}`
> אינו 𝟙 אלא גליף שגוי (סימן turnstile שלול), והבעיה **שקטה**: `missing characters = 0` וה-build
> ירוק. תוקן ל-`\mathbb{I}` (= 𝕀, סימון זהות מקובל) שעובד מול ה-amssymb הקיים **בלי חבילה נוספת**;
> נוספה הערת-מגן בפרמבל שתמנע החזרה ל-`\mathbb{1}` (ומכוונת ל-`dsfont`/`\mathds{1}` למי שחייב דווקא 𝟙).
> בנוסף: `example.tex` עכשיו **מפעיל את `\id`** (עם בדיקה עצמית בטקסט), כדי שבר עתידי ייראה בעין
> במקום "0 missing". זהו סוג הבאג שכל הסקיל קיים כדי לתפוס, וה-smoke-test הקודם פספס אותו כי לא הפעיל את `\id`.
> אומת בפועל: `example.tex` התקמפל נקי (0 חסרים, 0 שגיאות, בוקמרק נקי), ושלושת מסלולי הכשל של
> `build.sh` (שגיאה / קריסה עם PDF ישן / גליפים חסרים) כולם יוצאים non-zero.

> **★ מה נוסף בגרסה 3.4** (מחלקת באגים חדשה — דיאגרמות, קוד וגרשיים): כל מה שקשור
> ל**כיוון מעורב בתוך רכיבים** (לא רק בפסקה) עבר למסמך ייחוס נפרד —
> `references/figures-boxes-listings.md`. בקצרה: שלישיית בידוד הכיוון `\h{}`/`\en{}`/`\code{}`;
> הבאג ש**לטינית בתוך `\h{}` בתוך צומת TikZ יוצאת הפוכה** (טבלאות ופרוזה תקינות — רק צמתי TikZ
> נשברים); כותרת קופסה עם קוד דורשת `\code{}` ולא `\texttt{}` (אחרת `;` קופץ להתחלה); רשימת
> `lstlisting` בקופסה חורגת מהמסגרת אלא אם `resetmargins=true`+`framexleftmargin=0pt`; וגרשיים
> עבריים הם ״ (U+05F4) ולא `` ``...'' ``. הפרמבל ב-`assets/preamble.tex` כבר כולל את כל אלה,
> ו-`scripts/check_bidi_figures.py` סורק אותם. הפרמבל גם הורחב ל-12pt+`\linespread{1.3}`,
> שש קופסאות, חבילות `tikz`/`pgfplots`/`listings`, וסביבת `tikzpic` (island ל-TikZ כמו `qcirc`).

---

## שלב 0 — זיהוי סביבה (חובה, לפני הכל)

המתכון הזה **תלוי-סביבה**. אל תניח שהוא רץ אצלך — בדוק, לפי הסדר:

```bash
kpsewhich luaotfload-main.lua    # בדיקה 1
```

- **החזיר נתיב** → המנוע שלם. דלג לשלב 1 (preamble).
- **ריק** → נסה להתקין:

```bash
apt-get install -y texlive-luatex texlive-lang-other   # (אולי עם sudo)
kpsewhich luatexbase.sty                               # אמת: נתיב, לא ריק
```

> ★★ **הבהרה (גרסה 3):** קובץ הלוקייל של עברית הוא `babel-he.ini`, **לא** `babel-hebrew.ini`. babel ממפה
> `hebrew`→`he` אוטומטית, ולכן `\babelprovide[...]{hebrew}` עובד כרגיל — אבל אל תיבהל אם `kpsewhich
> babel-hebrew.ini` מחזיר ריק. אם בכל זאת רוצים לאמת לוקייל: `kpsewhich babel-he.ini`.


- **ההתקנה הצליחה** → המשך.
- **אין root / apt חסום / החבילות לא קיימות** → **עצור. המתכון הזה לא ירוץ כאן.**
  השתמש במסלול HTML+MathJax→WeasyPrint (סקיל `hebrew-academic-pdf`) במקום.

סביבות מוכרות נכון לכתיבת שורות אלה:

| סביבה | מצב | מסקנה |
| :---- | :---- | :---- |
| sandbox של claude.ai (יש root) | `apt-get` עובד | המתכון רץ אחרי שלב 0 |
| Cowork sandbox | אין root, אין `luaotfload`, CTAN חסום | מת. השתמש ב-hebrew-academic-pdf |
| מחשב אישי עם TeX Live מלא | הכל קיים | רץ ישירות |

**שים לב: סביבות ענן מתאפסות בין משימות.** חבילות שהתקנת ייעלמו — הרץ את שלב 0 בכל משימה מחדש.
(נתקל בפועל: `luatexbase.sty not found` במשימה שעבדה יום קודם.)

---

## מתי להשתמש במתכון הזה, ומתי במסלול השני

| צורך | הכלי הנכון |
| :---- | :---- |
| הערות שוליים, ביבליוגרפיה (biblatex), הפניות צולבות, תבנית מוסדית, הגשת .tex | **המתכון הזה** (LuaLaTeX) |
| ★ קופסאות צבעוניות, מעגלים קוונטיים, מטריצות, טבלאות, מסמך ארוך רב-חלקים | **המתכון הזה** — ראה הסעיפים הייעודיים למטה |
| איטרציות עיצוב מהירות מאוד / חופש עיצובי כמו דף אינטרנט | סקיל `hebrew-academic-pdf` (HTML) |
| סביבה בלי TeX שלם / בלי root | סקיל `hebrew-academic-pdf` — אין ברירה |

> ★ **תיקון מגרסה 1:** קופסאות צבעוניות וטבלאות מעוצבות **אינן** סיבה לעבור ל-HTML.
> `mdframed` ו-`booktabs` עובדים מצוין ב-LuaLaTeX תחת RTL (ראה למטה). מה שכן שבור הוא
> `tcolorbox` — ראה מלכודות.
>
> ★ **טבלאות וקופסאות --- תבניות מוכנות:** אל תבנה מאפס. לטבלאות השתמש במנגנון
> `tablebox`+`\tabcap` (מסגרת אחידה, מספור אוטומטי, לעולם לא `\caption*`) --- גלריה ב-`assets/example_tables.tex`;
> לקופסאות --- `assets/example_boxes.tex`. פירוט מלא ב-`figures-boxes-listings.md`.

הערה: בשני המסלולים אסור עברית בתוך נוסחאות או בתוך SVG — זו מגבלה משותפת (ראה כלל 4).

---

## למה דווקא LuaLaTeX ולא XeLaTeX

המסלול הסטנדרטי לעברית-LaTeX הוא XeLaTeX + polyglossia + bidi. הוא נכשל בסביבות חסרות:

```
! LaTeX Error: File `bidi.sty' not found.
```

`bidi.sty` ארוז תחת `texlive-lang-arabic` או `texlive-full`, שלרוב לא מותקנים, ו-CTAN חסום
ברוב סביבות הענן.

**הפתרון:** ל-LuaLaTeX יש טיפול bidi מובנה ברמת המנוע דרך `babel` עם `bidi=basic` — **לא דורש
את `bidi.sty` בכלל**. קומבינציה פחות מתועדת אבל לגיטימית לחלוטין, עם פחות תלויות.

| | XeLaTeX + polyglossia | LuaLaTeX + babel `bidi=basic` |
| :---- | :---- | :---- |
| דורש `bidi.sty` | כן | **לא** |
| טיפול RTL | חבילה חיצונית | מובנה במנוע |

---

## המתכון בקצרה (TL;DR)

```bash
# 1. זיהוי סביבה + התקנה אם צריך (שלב 0 לעיל)
# 2. הדר עם lualatex (לא xelatex, לא pdflatex)
lualatex -interaction=nonstopmode doc.tex
# 3. בדוק ויזואלית (חובה — שגיאות עברית בלתי-נראות במקור)
pdftoppm -png -r 110 doc.pdf page
```

ה-preamble המינימלי:

```latex
\documentclass[11pt]{article}
\usepackage[no-math]{fontspec}        % ★ no-math — קריטי, ראה הסבר
\usepackage[bidi=basic]{babel}
\babelprovide[import,main]{hebrew}
\babelprovide[import]{english}
\babelfont{rm}{DejaVu Sans}           % ★★ Sans — ל-DejaVu Serif אין עברית! ושדרג ל-Frank Ruhl
\usepackage{amsmath,amssymb}
```

---

## ★ הבאג שעולה הכי הרבה זמן: math + פונט עברי

זה הכלל הכי חשוב ב-**הגדרות** (כלל 4 הוא הכי חשוב ב-**תוכן**). קרא אותו לפני שאתה מדר.

ברגע שאתה מגדיר פונט עברי כ-`\babelfont{rm}{...}`, fontspec — אם לא נאמר לו אחרת — מנסה
**להשתלט גם על פונט המתמטיקה**. הפונט העברי (Frank Ruhl / DejaVu) אין לו גליפים לטיניים
ואין לו אות מתמטיות, ולכן:

- `\sin`, `\cos`, `\tan`, `\log`, `\det`, `\Tr`, `\gcd`, ושמות אופרטורים — יוצאים **tofu** (□□□).
- אותיות לטיניות בתוך מתמטיקה (`$x$`, `$U_f$`, `$\text{...}$` לטיני) — לפעמים נשברות.

**הסימפטום מטעה:** המקור נראה תקין, ההידור עובר בלי שגיאה, ורק על הדף רואים ריבועים במקום
`sin`. אם תבדוק עם נוסחה "קלה" כמו $\sigma_y$ או $\hbar\omega$ — לא תראה כלום, כי הסמלים האלה
קיימים. הבאג מתגלה רק כשיש operator או לטינית במתמטיקה. (לכן הדוגמה המינימלית למטה **מכוונת**
לכלול `\sin`/`\cos` ולטינית — כדי לתפוס את זה.)

**הפתרון — שורה אחת:**

```latex
\usepackage[no-math]{fontspec}
```

`[no-math]` אומר ל-fontspec "אל תיגע במתמטיקה" — המתמטיקה נשארת ב-Computer Modern (שיש לו
את כל הגליפים), והפונט העברי חל רק על הטקסט. **תמיד** השתמש בזה כשיש גם עברית וגם מתמטיקה.

> אם בכל זאת יש לך אותיות לטיניות בתוך **טקסט עברי רגיל** (לא במתמטיקה) שיוצאות tofu — זו בעיה
> נפרדת, ופתרונה fallback (ראה הסעיף הבא), לא `[no-math]`.

---

## ★ פונט הגוף ו-fallback ללטינית

★★ **תוקן בגרסה 3.1:** הגרסאות הקודמות התלבטו בין DejaVu Sans ל-Serif כגוף — וזה היה שגוי.
הכלל הנכון: לגוף עברי השתמש ב-**Frank Ruhl Libre**. DejaVu הוא חירום בלבד, ומבין פניו רק
DejaVu **Sans** מכיל עברית; ל-DejaVu **Serif** אין גליפים עבריים בחלק מהבניות (ראה האזהרה
למטה) — לכן הוא פסול כגוף עברי ומשמש רק כ-fallback ללטינית. העדף, מהטובה לחירום:

1. **Frank Ruhl Libre** — פונט ספרים עברי אמיתי, הבחירה הנכונה למסמך רציני (התקנה למטה).
2. **DejaVu Sans** — חירום בלי רשת בלבד: הפונט היחיד מ-DejaVu עם עברית וגם לטינית, ולכן עובד
   כגוף מלא בלי fallback. מכוער יותר (sans-serif) אבל לא tofu. לא DejaVu Serif — אין בו עברית.

התקנת Frank Ruhl (npm, בלי CTAN):

```bash
npm pack @fontsource/frank-ruhl-libre   # חלץ את ה-woff2 והמר ל-ttf, או:
bash /mnt/skills/user/hebrew-academic-pdf/scripts/setup_fonts.sh   # מתקין ל-~/.fonts/
```

```latex
\usepackage[no-math]{fontspec}
% פונט לפי שם משפחה — נייד בין מכונות. setup_fonts.sh מריץ fc-cache, אז luaotfload מוצא אותו.
\babelfont{rm}[
  RawFeature={fallback=hebfb}            % ★ fallback ללטינית בתוך עברית
]{Frank Ruhl Libre}
% מוצא חירום (מערכת בלי רענון fontconfig): נתיב מפורש —
%   [Path=/abs/.fonts/, UprightFont=FrankRuhlLibre-Regular.ttf, BoldFont=...]
```

**Fallback ללטינית בתוך עברית.** Frank Ruhl אין לו גליפים לטיניים, אז מילה אנגלית בתוך פסקה
עברית (למשל "מצב qubit") תצא tofu. הגדר fallback ב-luaotfload **לפני** `\babelfont`:

```latex
\directlua{luaotfload.add_fallback("hebfb", {"DejaVuSerif:mode=node;"})}
```

ואז ה-`RawFeature={fallback=hebfb}` ב-`\babelfont` למעלה תופס כל גליף חסר ומצייר אותו ב-DejaVu.
(אם אתה משתמש גם ב-`sf`, הגדר `hebfbsf` עם `DejaVuSans` באותו אופן.)

> ★★ **בלי רשת? בדוק כיסוי עברית לפני שאתה סומך על פונט (גרסה 3).** הנחת גרסה 2 ש"ל-DejaVu יש
> גם עברית וגם לטינית" **אינה אמת בכל בנייה**. ב-build שנבדק כאן, `DejaVu Serif` מכיל לטינית אבל
> **אפס גליפים עבריים** — `\babelfont{rm}{DejaVu Serif}` הפיק את כל העברית כ-tofu (182 תווים חסרים).
> לכן DejaVu Serif הוא fallback **ללטינית** מצוין, אבל פונט גוף עברי גרוע/שבור בחלק מהמערכות.
>
> בדוק כיסוי לפני שאתה בונה מסמך שלם:
>
> ```bash
> python3 -c "from fontTools.ttLib import TTFont; c=TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf').getBestCmap(); print('Hebrew aleph:', 0x05D0 in c)"
> # או: otfinfo -u FONT.ttf | grep -i 05d0
> ```
>
> אם אין עברית — השתמש ב-Frank Ruhl (שמותקן ל-`~/.fonts/` ע"י `setup_fonts.sh`) כפונט הגוף,
> ובלית ברירה חפש פונט עברי אחר. **אל תניח; בדוק.**

---

## ה-preamble המלא, שורה-שורה

```latex
\documentclass[11pt]{report}             % (0) ★ report למסמך ארוך; article לקצר
\usepackage[no-math]{fontspec}           % (1) ★ no-math — ראה הבאג למעלה
\usepackage[bidi=basic]{babel}           % (2)
\babelprovide[import,main]{hebrew}       % (3)
\babelprovide[import]{english}           % (4)
\directlua{luaotfload.add_fallback("hebfb",{"DejaVuSerif:mode=node;"})}  % (5a) ★
\babelfont{rm}[RawFeature={fallback=hebfb}]{Frank Ruhl Libre}            % (5b) ★★ פונט לפי שם משפחה (נייד)
\usepackage{amsmath,amssymb,mathtools}   % (6)
\usepackage[margin=2.4cm]{geometry}      % (7)
```

**(0) `report`** — ל-`\part`/`\chapter`/`\tableofcontents` במסמך ארוך. ל-`article` אין `\chapter`.
ל-PDF קצר (מבחן + פתרון) `article` מספיק.

**(1) `[no-math]{fontspec}`** — טעינת פונטים מערכתיים, **בלי לגעת במתמטיקה**. בלי `[no-math]`
האופרטורים המתמטיים יוצאים tofu (ראה הבאג למעלה). עובד רק עם LuaLaTeX/XeLaTeX.

**(2) `bidi=basic`** — הלב. מפעיל את אלגוריתם הכיווניות המובנה של LuaLaTeX; מחליף את `bidi.sty`
החסר. דווקא `basic` (לא `default`) מטפל נכון בערבוב RTL/LTR.

**(3) `\babelprovide[import,main]{hebrew}`** — עברית כשפה ראשית: כיוון ברירת-המחדל RTL.

**(4) `\babelprovide[import]{english}`** — אנגלית כשפה משנית, ל-LTR נכון של מונחים לועזיים.

**(5a/5b) פונט עברי + fallback** — Frank Ruhl Libre כגוף, DejaVu Serif fallback ללטינית בתוכו.
ראה הסעיף הקודם.

**(6) `amsmath,amssymb,mathtools`** — מטריצות, `align`, `cases`, `\coloneqq` וכו'. הכרחי לתוכן מדעי.

**(7) `geometry`** — שוליים.

---

## ★★ התנגשויות שמות מאקרו בפרמבל (גרסה 3)

ברגע שבונים פרמבל אמיתי (לא הדוגמה המינימלית) עם פקודות braket משלך **וגם** עם `quantikz`, נתקלים
בהתנגשויות ש**עוצרות את ההידור**: `! LaTeX Error: Command \... already defined`. שלוש מלכודות
קונקרטיות שנתקלנו בהן:

| מאקרו | מי כבר מגדיר | מה לעשות במקום |
| :---- | :---- | :---- |
| `\proj` | quantikz | השתמש בשם אחר, למשל `\dyad{x}` עבור $\lvert x\rangle\langle x\rvert$ |
| `\mod` | amsmath | השתמש ב-`\bmod`/`\pmod` המובנים, או שם אחר |
| `\ket` / `\bra` / `\braket` | quantikz | `\providecommand` (ראה למטה), לא `\newcommand` |

**הכלל הזהב — `\providecommand` ל-braket, וטען `quantikz` לפני ההגדרות שלך.** `\providecommand`
מגדיר פקודה **רק אם אינה קיימת**, כך שאין התנגשות ואין צורך לעקוב מי הגדיר מה:

```latex
\usepackage{quantikz}          % טען לפני הגדרות ה-braket שלך
% --- braket בטוח גם אם quantikz כבר הגדיר ---
\providecommand{\ket}[1]{\left|#1\right\rangle}
\providecommand{\bra}[1]{\left\langle#1\right|}
\providecommand{\braket}[2]{\left\langle#1|#2\right\rangle}
% --- שמות משלך, בלי להתנגש ---
\newcommand{\dyad}[1]{\ket{#1}\!\bra{#1}}     % לא \proj
\newcommand{\expval}[1]{\left\langle#1\right\rangle}
\DeclareMathOperator{\Tr}{Tr}                  % \Tr בטוח; \mod לא — השתמש ב-\bmod
```

> כלל אצבע: לפני שאתה מגדיר מאקרו מתמטי קצר ונפוץ (`\proj`,`\mod`,`\span`,`\dyad`,`\Re`,`\Im`),
> הנח שמישהו כבר הגדיר אותו. `\Re`/`\Im` קיימים בליבת LaTeX — אם אתה רוצה לשנותם, `\renewcommand`.
> בכל ספק: `\providecommand`, או שם ייחודי.

---

## ★★ hyperref: סדר טעינה, יוניקוד, ומתמטיקה בכותרות (גרסה 3)

למסמך ארוך עם תוכן עניינים מקושר טוענים `hyperref` — ושלושה דברים שוברים אותו בעברית:

**1. סדר טעינה — `hyperref` כמעט אחרון.** טען אחרי כל החבילות, **במיוחד אחרי הגדרות הצבעים**
של `mdframed`. בפועל: שורה אחת לפני `\begin{document}`.

**2. `unicode` — חובה לבוקמרקים בעברית.** בלעדיו הבוקמרקים (סרגל הניווט של ה-PDF) יוצאים ג'יבריש:

```latex
\usepackage[hidelinks,unicode]{hyperref}
```

**3. ★★ מתמטיקה בכותרות → `\texorpdfstring`.** זה הגאפ הכי **שקט** של גרסה 2. אם כותרת `\chapter`/
`\section` מכילה מתמטיקה (נפוץ מאוד: "אומדן פאזה ל-$n$ סיביות", "$c^n$-$Z$ מטופולי"), hyperref מנסה
לדחוף את ה-LaTeX הגולמי לבוקמרק ומתריע `Token not allowed in a PDF string` — והבוקמרק יוצא משובש.
תן לו גרסת טקסט נקייה:

```latex
\section{אומדן פאזה ל-\texorpdfstring{$n$}{n} סיביות}
\chapter{\texorpdfstring{$c^n$-$Z$}{c\textasciicircum n-Z} מטופולי}
```

`\texorpdfstring{גרסת-מתמטיקה}{גרסת-טקסט}` — הראשונה נכנסת לדף, השנייה לבוקמרק. השתמש בכל כותרת
עם `$...$`.

> ★★ **מלכודת בתוך המלכודת:** הארגומנט **השני** (טקסט הבוקמרק) חייב להיות נקי מתווים מתמטיים
> פעילים — `^`, `_`, `$`. אם תכתוב `\texorpdfstring{$c^n$}{c^n}`, ה-`^` בארגומנט השני עדיין מפעיל
> אזהרת `Token not allowed ... removing 'superscript'` ובוקמרק משובש. כתוב `c\textasciicircum n`
> (או פשוט מילים: `c power n`). אומת בבנייה.

---

## כללי כתיבת התוכן

### כלל 1 — מתמטיקה inline בתוך עברית עובדת אוטומטית

```latex
נתון אוסצילטור עם $H_0 = \hbar\omega(a^\dagger a + \tfrac{1}{2})$ ומצב יסוד.
```

ה-`bidi=basic` מזהה את גוש המתמטיקה כיחידה LTR ומשבץ אותה נכון בפסקה ה-RTL.

### כלל 2 — נוסחאות display כרגיל

```latex
\[
i\hbar\frac{\partial}{\partial t}|\psi(t)\rangle = H|\psi(t)\rangle.
\]
```

### כלל 3 — מטריצות, cases, align — ללא בעיה

```latex
\[ \sigma_y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix} \]
```

ה-`&` בתוך `pmatrix`/`align`/`cases` הוא מפריד עמודות תקני ולא מתנגש עם כיווניות.

### כלל 4 — טקסט בתוך מצב מתמטי: עטוף ב-`\text{}` (גרסה 3.8)

הכלל הכי חשוב בתוכן. הדבר היחיד שאסור במתמטיקה הוא `\h`/`\en` (=`\foreignlanguage`) **חשוף, ישירות
מחוץ ל-`\text`** (שגיאת `\rmfamily invalid in math mode`). בנוסף, סוגריים אנגליים ב-`\text{}`
**מתהפכים** ב-RTL (מתקמפל נקי — באג בלתי-נראה). הפתרון: **כל טקסט בתוך מתמטיקה נכנס ל-`\text{}`:**

| בתוך math רוצים… | כותבים | ❌ לא (ולמה) |
|---|---|---|
| תווית עברית | `\text{...}` (עברית גולמית תקינה; `\h` רשות) | `\h{...}` **חשוף מחוץ** ל-`\text` → שגיאת `\rmfamily` |
| מילה לטינית רגילה | `\text{...}` | `\en{...}` חשוף → שגיאת `\rmfamily` |
| לטינית עם `( )` או `[ ]` | `\text{\en{...}}` | `\text{...}` → הסוגריים **מתהפכים** (`Spec (TNR(`) |
| פונקציה על ארגומנט עברי/טקסט | `\text{f}(\text{...})` | `\text{f(arg)}` → הסוגריים בתוך הקופסה מתהפכים |
| קוד | `\mathtt{...}` / `\texttt{...}` | — |

- **עברית גולמית בתוך `\text` נראית נכון** — `\text{מהירות}` ו-`\text{\h{מהירות}}` זהים (אומת אמפירית); `\h` שם רשות בלבד.
- ❌ `$X \sim \en{Normal}(\mu,\sigma)$` — `\en` חשוף ב-math → שגיאה. ✅ `$X \sim \text{\en{Normal}}(\mu,\sigma)$`
- ✅ סוגריים סביב **עברית טהורה** תקינים: `\text{\h{(שארית)}}`, `ESS \h{(מוסבר)}` — לא באג.
- `\mbox{...}` גם עובד אך לא מתכווץ ב-תחתי/עילי — העדף `\text{}`.
- ❌ **`^` או `_` בתוך `\text{}` שוברים קומפילציה** (`! Missing $` — מצב טקסט אינו מתמטי). השאר את המתמטיקה **מחוץ** ל-`\text`: ✅ `(\text{\en{linear }}45^\circ)`, לא ❌ `\text{\en{(linear 45^\circ)}}`. (`\^`/`\_` עם לוכסן הפוך = תו מילולי, תקין; `$...$` מקונן בתוך `\text` = מתמטיקה, תקין.) נצפה בבנייה אמת. `check_bidi_figures.py` מסמן זאת (`TEXT-MATH-CARET`, גרסה 3.21).
- הסבר עברי ארוך — עדיין עדיף בטקסט הרגיל ליד הנוסחה. `check_bidi_figures.py` מסמן את הטעויות האמיתיות (גרסה 3.8).

### ★ כלל 5 — אופרטורים בעלי שם

מאחר שיש `[no-math]`, אופרטורים סטנדרטיים (`\sin`,`\Tr` וכו') עובדים. אופרטור משלך:

```latex
\DeclareMathOperator{\Tr}{Tr}    % בתוך ה-preamble
...
$\Tr(\rho A)$                     % בגוף
```

### ★★ כלל 6 — ריצות לטיניות ארוכות: עטוף ב-`\foreignlanguage` (גרסה 3)

ה-fallback (סעיף הפונט) פותר גליפים לטיניים **בודדים** בתוך עברית. אבל **ריצה לטינית ארוכה** —
כותרת ספר, שם מחבר, ציטוט אנגלי שלם, ובמיוחד בעמוד השער — עלולה לצאת עם כיוון או רווחים שגויים תחת
`bidi=basic`, כי המנוע לא תמיד מזהה היכן הריצה ה-LTR מתחילה ונגמרת. הפתרון המפורש:

```latex
\foreignlanguage{english}{N. D. Mermin, ``Quantum Computer Science''}
```

- גליף בודד / מילה אחת בתוך עברית → ה-fallback מספיק.
- משפט / ציטוט / שם מרובה-מילים, ובמיוחד בעמוד שער או בכותרת → `\foreignlanguage{english}{...}` מפורש.
- **שם לטיני עם פרמטרים מתמטיים בתוך פרוזה/טבלה עברית** → עטוף את השם **והפרמטרים יחד** כיחידת LTR אחת,
  אחרת הם מסתדרים RTL: `\en{Bernoulli$(p)$}` → "Bernoulli (p)" ✅, לעומת `\en{Bernoulli}$(p)$` → "(p)Bernoulli" ❌
  (שני איים נפרדים). זה חל על שמות התפלגויות, חתימות פונקציות, וכו'. (זה כלל **טקסט**, לא math — בתוך math ראו כלל 4.)

זה חל גם על מעגלים: עברית קצרה ב-`\lstick` עובדת (זה טקסט שעובר bidi, למשל `\lstick{עזר $\ket0$}`),
אבל ציטוט לטיני ארוך שם — עטוף. להבדיל מ-`\gate{...}`, שבו אסור עברית בכלל (כלל 4).

---

## תוויות עבריות ב-enumerate — הבעיה והפתרון

### הבעיה

ברירת המחדל נותנת תוויות לטיניות, וניסיון להגדיר label עברי אוטומטי דרך
`\setlist[enumerate]{label=...}` **נכשל בשקט** — התוויות פשוט נעלמות (אינטראקציה של הוצאת
אותיות עבריות בהקשר המטא-מאקרו של enumitem).

### הפתרון שעובד — תוויות מפורשות

```latex
\begin{enumerate}
  \item[(\textbf{א})] הסעיף הראשון.
  \item[(\textbf{ב})] הסעיף השני.
  \item[(\textbf{ג})] הסעיף השלישי.
\end{enumerate}
```

`\item[...]` עוקף את מנגנון המספור לחלוטין ושם מחרוזת קבועה. אין מאקרו שמתפרק — אין מה להישבר.
(עם תוויות מפורשות אין הבדל בין `itemize` ל-`enumerate`.)

### אוטומציה — אם יש הרבה פריטים

אפשר לכתוב `\item` רגיל ולהמיר בסקריפט:

```python
import re
heb = ['א','ב','ג','ד','ה','ו','ז','ח','ט']
def fix_enum(match):
    block = match.group(0)
    parts = re.split(r'\\item\b', block)
    out = parts[0]
    for i, body in enumerate(parts[1:]):
        out += (f'\\item[(\\textbf{{{heb[i]}}})]' if i < len(heb) else '\\item') + body
    return out
with open('doc.tex') as f: content = f.read()
content = re.sub(r'\\begin\{enumerate\}.*?\\end\{enumerate\}', fix_enum, content, flags=re.DOTALL)
with open('doc.tex','w') as f: f.write(content)
```

**אזהרה: הסקריפט נשבר על enumerate מקונן** — ה-regex הלא-חמדן נעצר ב-`\end` הראשון. אם יש קינון —
כתוב את התוויות ידנית מההתחלה (גם מתברר כפשוט יותר).

---

## ★ קופסאות צבעוניות — `mdframed` (לא tcolorbox)

`tcolorbox` **שבור** תחת bidi=basic (הרקע/המסגרת יוצאים לא במקום). `mdframed` עובד מצוין.
דוגמה לארבע סביבות (הגדרה/משפט/הערה/דוגמה):

```latex
\usepackage{mdframed}
\usepackage{xcolor}
\definecolor{cBlue}{HTML}{1F4E79}   \definecolor{cBlueBg}{HTML}{EAF1F8}
\definecolor{cGreen}{HTML}{2E6B4F}  \definecolor{cGreenBg}{HTML}{EAF4EE}
% ... אחרי הגדרת כל הצבעים, ורק אז hyperref אם בכלל

\newmdenv[linecolor=cBlue,backgroundcolor=cBlueBg,linewidth=1pt,
  frametitlebackgroundcolor=cBlue,frametitlefontcolor=white,
  skipabove=8pt,skipbelow=8pt]{defbox}
```

שימוש:

```latex
\begin{defbox}[frametitle={הגדרה — קיוביט}]
קיוביט הוא מערכת קוונטית עם מרחב הילברט דו-ממדי.
\end{defbox}
```

> סדר טעינה: הגדר את כל הצבעים **לפני** `hyperref`. הכותרת (`frametitle`) יוצאת RTL ברוחב מלא
> אוטומטית.

---

## ★ מעגלים קוונטיים — `quantikz` ב-island של LTR

מעגל הוא ישות LTR מובהקת. אם תשים אותו ישירות בפסקה עברית, החוטים והשערים יתהפכו. עטוף תמיד:

```latex
\usepackage{quantikz}

\newenvironment{qcirc}{\par\begin{otherlanguage}{english}\begin{center}}
  {\end{center}\end{otherlanguage}\par}
```

```latex
\begin{qcirc}
\begin{quantikz}
\lstick{$\ket0$} & \gate{H} & \ctrl{1} & \meter{} \\
\lstick{$\ket0$} & \qw      & \targ{}  & \qw
\end{quantikz}
\end{qcirc}
```

> שתי מלכודות: (1) `quantikz` מגדיר בעצמו את `\ket`/`\bra`/`\braket`, אז אם הגדרת אותם —
> השתמש ב-`\renewcommand`, לא `\newcommand`, אחרת שגיאת "already defined". (2) טקסט עברי בתוך
> `\gate{...}` כפוף לכלל 4 — אל תכניס עברית לתוך תוויות שער.
>
> ★★ (גרסה 3) הפקודות `\swap{n}`/`\targX{}` (שער SWAP), `\ctrl{}`, ו-`\gate[n]{...}` (שער רב-קיוביטי
> כמו `\gate[4]{\mathrm{QFT}^{-1}}`) — כולן עובדות תחת ה-island של LTR ומציירות נכון.

---

## תהליך הבנייה והבדיקה

### בנייה

```bash
# קמפל עד נקודת השבת: חזור עד ששני PDF עוקבים זהים בית-בבית. מסמך עם TOC מתכנס
# רק במעבר השלישי — קומפילציה של פעמיים בלבד שולחת מספרי-עמוד שגויים ב-TOC.
# הדרך הפשוטה: bash build.sh (מקמפל עד התכנסות ומריץ את כל השערים).
lualatex -interaction=nonstopmode doc.tex
lualatex -interaction=nonstopmode doc.tex
lualatex -interaction=nonstopmode doc.tex   # ★ לפחות שלוש — ל-TOC והפניות
```

`-interaction=nonstopmode` מונע עצירה אינטראקטיבית על שגיאה.

### ★ בדיקה אוטומטית ראשונה — אפס תווים חסרים

לפני הצפייה בעיניים, ספור tofu מתוך הלוג:

```bash
grep -c "Missing character" doc.log    # ★ חייב להחזיר 0
```

כל ערך > 0 = יש גליפים חסרים (כמעט תמיד הבאג של `[no-math]` או fallback חסר). תקן לפני שתמשיך.

### בדיקה ויזואלית — לא אופציונלי

שגיאות עברית-LaTeX בלתי-נראות במקור אך בולטות על הדף: תוויות הפוכות, tofu □, מתמטיקה שגולשת.

```bash
pdftoppm -png -r 110 doc.pdf page
```

ואז פתח את התמונות וודא: עברית קוראת ימין-לשמאל, נוסחאות ממורכזות, אין tofu, מעגלים שלמים
(חוטים+שערים+מדידות), קופסאות עם פס כותרת מלא, טבלאות מיושרות, שום דבר לא חתוך.

### איחוד / הרכבת קבצים

```bash
# הרכבה ממספר קבצי .tex לקובץ אחד (זהירות — ראה אזהרה):
cat main.tex part1.tex part2.tex > final.tex
printf '\\end{document}\n' >> final.tex     # ★ printf, לא echo

# או מיזוג PDF-ים מוכנים:
qpdf --empty --pages a.pdf b.pdf -- combined.pdf
```

> ★ **אזהרה חשובה:** בהוספת `\end{document}` השתמש ב-`printf '\\end{document}\n'`, **לא** ב-`echo`.
> `echo "\end{document}"` מפרש את `\e` כתו ESC (בייט 0x1B) ומשחית את הקובץ בשקט.

---

## דוגמה מינימלית מלאה שמתקמפלת (★ מחוזקת)

★★ **גרסה 3 — נבדקה והתקמפלה בפועל: 0 תווים חסרים, 0 שגיאות, 0 אזהרות `Token not allowed`.**
משתמשת בפונט Frank Ruhl + fallback (לא DejaVu — שאין בו עברית בחלק מהמערכות, ראה הסעיף על הפונט).
**בכוונה** מפעילה את כל הקצוות שמסתירים באגים: `\sin`/`\cos` ואופרטור (באג ה-no-math), לטינית
במתמטיקה, `\providecommand` ל-braket מול quantikz, `hyperref[unicode]`, כותרת עם מתמטיקה דרך
`\texorpdfstring`, קופסה צבעונית, ומעגל עם `\swap`/`\targX`.

```latex
\documentclass[11pt]{article}
\usepackage[no-math]{fontspec}
\usepackage[bidi=basic]{babel}
\babelprovide[import,main]{hebrew}
\babelprovide[import]{english}
% ★★ עברית = Frank Ruhl (יש בו עברית); DejaVu = fallback ללטינית בלבד
\directlua{luaotfload.add_fallback("hebfb",{"DejaVuSerif:mode=node;"})}
\babelfont{rm}[RawFeature={fallback=hebfb}]{Frank Ruhl Libre}   % לפי שם משפחה (נייד)
\usepackage{amsmath,amssymb}
\usepackage{mdframed,xcolor}
\usepackage{quantikz}
\usepackage[margin=2.5cm]{geometry}

\providecommand{\ket}[1]{\left|#1\right\rangle}
\providecommand{\bra}[1]{\left\langle#1\right|}
\newcommand{\dyad}[1]{\ket{#1}\!\bra{#1}}      % לא \proj
\DeclareMathOperator{\Tr}{Tr}                   % \mod אסור — \bmod

\definecolor{cBlue}{HTML}{1F4E79}\definecolor{cBlueBg}{HTML}{EAF1F8}
\newmdenv[linecolor=cBlue,backgroundcolor=cBlueBg,linewidth=1pt,
  frametitlebackgroundcolor=cBlue,frametitlefontcolor=white]{defbox}
\newenvironment{qcirc}{\par\begin{otherlanguage}{english}\begin{center}}
  {\end{center}\end{otherlanguage}\par}

\usepackage[hidelinks,unicode]{hyperref}   % ★★ אחרון, עם unicode

\begin{document}

\begin{center}\Large\textbf{מסמך לדוגמה — עברית עם מתמטיקה}\end{center}
\foreignlanguage{english}{N. D. Mermin, ``Quantum Computer Science'' (2007)}

% ★★ מתמטיקה בכותרת: הארגומנט השני (לבוקמרק) חייב להיות נקי מ-^ _ $ פעילים
\section{אומדן פאזה ל-\texorpdfstring{$n$}{n} סיביות ושער
  \texorpdfstring{$c^n$-$Z$}{c\textasciicircum n-Z}}

\noindent
נתון אוסצילטור עם $H_0 = \hbar\omega(a^\dagger a + \tfrac12)$, ומצב qubit כללי.
אופרטורים: $\sin\theta$, $\cos\theta$, $\Tr(\dyad{\psi})=1$ — אם יוצאים tofu, חסר \verb|[no-math]|.

\[ i\hbar\frac{\partial}{\partial t}\ket{\psi} = H\ket{\psi},\qquad
   \sigma_y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}. \]

\begin{defbox}[frametitle={הגדרה — שער הדמרד}]
$H=\tfrac1{\sqrt2}(X+Z)$, ומקיים $HXH=Z$. לטינית במתמטיקה: $\det(H)=-1$.
\end{defbox}

\noindent\textbf{מעגל (זוג בל) עם SWAP:}
\begin{qcirc}
\begin{quantikz}
\lstick{$\ket0$} & \gate{H} & \ctrl{1} & \swap{1} & \meter{} \\
\lstick{$\ket0$} & \qw      & \targ{}  & \targX{} & \qw
\end{quantikz}
\end{qcirc}

\begin{itemize}
\item[(\textbf{א})] סעיף ראשון, עם $\langle x\rangle=0$.
\item[(\textbf{ב})] סעיף שני: the energy is $E_n=\hbar\omega(n+\tfrac12)$.
\end{itemize}

\end{document}
```

> הדוגמה משתמשת ב-`\providecommand` ל-`\ket`/`\bra`, ולכן אין התנגשות עם `quantikz`. אם בכל זאת
> תגדיר `\newcommand{\ket}` תקבל "command already defined" — עבור ל-`\providecommand` (ראה סעיף
> ההתנגשויות).

---

## מלכודות נפוצות (סיכום)

| מלכודת | תסמין | פתרון |
| :---- | :---- | :---- |
| ★ `fontspec` בלי `[no-math]` | אופרטורים (`sin`,`Tr`) ולטינית במתמטיקה כ-tofu □ | `\usepackage[no-math]{fontspec}` |
| ★ לטינית בתוך עברית = tofu | "qubit" בפסקה יוצא ריבועים | `add_fallback` + `RawFeature={fallback=hebfb}` |
| ★ דוגמת בדיקה חלשה | באג עובר כי הבדיקה לא הפעילה אותו | בדוק עם `\sin`/`\cos`/לטינית, לא רק $\sigma_y$ |
| הרצה בסביבה בלי luaotfload | fontspec לא מוצא פונט | שלב 0; אין root → hebrew-academic-pdf |
| XeLaTeX + polyglossia | `bidi.sty not found` | LuaLaTeX + babel `bidi=basic` |
| חבילות נעלמו (סביבה מתאפסת) | `luatexbase.sty not found` | `apt-get install texlive-luatex` כל משימה |
| `\setlist{label=...}` עברי | תוויות נעלמות בשקט | תוויות מפורשות `\item[(\textbf{א})]` |
| `\h`/`\en` חשוף ב-math, או סוגריים אנגליים ב-`\text` | שגיאת `\rmfamily` / סוגריים הפוכים | עטוף ב-`\text{}`; אנגלית-עם-סוגריים → `\text{\en{..(..)}}` — כלל 4 |
| ★ `tcolorbox` תחת RTL | מסגרת/רקע לא במקום | `mdframed` במקום |
| ★★ `\proj`/`\mod`/`\ket` "already defined" | הידור נעצר | `\providecommand` ל-braket; `\dyad` לא `\proj`; `\bmod` לא `\mod` |
| ★★ מתמטיקה בכותרת + hyperref | אזהרת "Token not allowed", בוקמרק משובש | `\texorpdfstring{$..$}{..}` בכותרת |
| ★★ `hyperref` בלי `unicode` | בוקמרקים בעברית = ג'יבריש | `[hidelinks,unicode]{hyperref}` |
| ★★ `^`/`_` בארגומנט הטקסט של `\texorpdfstring` | אזהרת "removing superscript", בוקמרק משובש | בארגומנט השני: `\textasciicircum`/מילים, לא `^` גולמי |
| ★★ `DejaVu Serif` בלי עברית (build מסוים) | כל העברית tofu למרות שהקומפילציה עברה | בדוק כיסוי (fontTools/otfinfo); השתמש ב-Frank Ruhl לגוף |
| ★★ ריצה לטינית ארוכה (עמוד שער) | כיוון/רווח שגוי | `\foreignlanguage{english}{...}` |
| ★ `quantikz` בפסקה עברית | חוטים/שערים הפוכים | עטוף ב-`otherlanguage{english}`+center |
| ★ `\ket` "already defined" | שגיאה כשטוענים quantikz | `\renewcommand` במקום `\newcommand` |
| ★ `echo "\end{document}"` | קובץ מושחת (בייט ESC) | `printf '\\end{document}\n'` |
| הידור עם pdflatex | פונט לא נטען | רק lualatex (עם fontspec) |
| סקריפט התוויות על רשימה מקוננת | תוויות משובשות | תוויות ידניות מההתחלה |
| דילוג על בדיקה | שגיאות סמויות עוברות | `grep "Missing character"` + `pdftoppm` + צפייה |

---

## סיכום הסטאק

- **זיהוי סביבה:** `kpsewhich luaotfload-main.lua` — לפני הכל; אין → apt; אין root → המסלול השני
- **מנוע:** LuaLaTeX (לא XeLaTeX, לא pdflatex)
- **טיפול עברית:** babel עם `bidi=basic` (לא polyglossia, לא bidi.sty)
- ★ **מתמטיקה:** `[no-math]{fontspec}` — תמיד, כשיש עברית+מתמטיקה
- ★ **פונט:** Frank Ruhl Libre לגוף + DejaVu Serif כ-fallback ללטינית בלבד; בלי רשת — DejaVu **Sans** כגוף (לא Serif!). ודא כיסוי תמיד: `font_coverage.py` / `fc-list :lang=he`
- ★ **קופסאות:** `mdframed` (לא tcolorbox)
- ★★ **מאקרו:** `\providecommand` ל-braket, הימנע מ-`\proj`/`\mod`; טען `quantikz` מוקדם
- ★★ **hyperref:** כמעט אחרון, עם `[unicode]`; `\texorpdfstring` לכל כותרת עם מתמטיקה
- ★ **מעגלים:** `quantikz` בתוך island של `otherlanguage{english}`
- **כיתת מסמך:** `report` לארוך, `article` לקצר
- **תוויות רשימה:** ידני `\item[(\textbf{א})]` (לא label אוטומטי)
- ★ **הרכבה:** `printf` להוספת `\end{document}` (לא echo)
- **בדיקה:** `grep "Missing character"` (=0) + `pdftoppm` + צפייה ויזואלית, תמיד
