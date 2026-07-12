# 🍕 צבי נינג'ה והפיצות!

משחק מגע מטורף לאייפד — לגיל 4+ (ובמיוחד לאחיינים שמכורים לפיצות).

## 🎮 לשחק עכשיו (אייפד / טלפון / מחשב)

**קישור:** https://guyzom.github.io/desktop-tutorial/

פתחו ב־Safari באייפד → **שתף → הוסף למסך הבית** — והמשחק נפתח כמו אפליקציה.

---

## ⚠️ הפעלה חד-פעמית (אם הקישור לא עובד / Actions נכשל)

השגיאה `Get Pages site failed` / `Not Found` אומרת ש-GitHub Pages **עדיין לא הופעל** בריפו.

### שלב 1 — הפעלת Pages (פעם אחת בלבד)

1. פתח: https://github.com/guyzom/desktop-tutorial/settings/pages
2. תחת **Build and deployment** → **Source**
3. בחר: **GitHub Actions** (לא "Deploy from a branch")

### שלב 2 — הרצה מחדש

1. פתח: https://github.com/guyzom/desktop-tutorial/actions
2. בחר **Deploy pizza game to GitHub Pages**
3. **Run workflow** → Run workflow (או Re-run על הריצה שנכשלה)

### שלב 3 — בדיקה

אחרי ~דקה, הקישור אמור לעבוד: https://guyzom.github.io/desktop-tutorial/

---

## איך משחקים

1. לחצו **בוא נשחק!** ובחרו צב: ליאו / ראף / דוני / מיקי.
2. **גררו** את הצב ימינה־שמאלה ותפסו פיצות שנופלות מהצינורות.
3. אפשר גם **ללחוץ על פיצה** באוויר!
4. כוכבים 🌟 = פיצת זהב (+5). ברוקולי 🥦 = יאק, מאפס את הרצף.

כל כמה פיצות מתחילה **סערת פיצות** — קואבונגה!

## פתיחה מקומית (מחשב)

לחיצה כפולה על [`index.html`](./index.html) בתיקייה הזו — כל הקבצים חייבים להיות יחד.

## קבצים

- `index.html` — מסכים ו־UI
- `style.css` — עיצוב ביוב־פיצה
- `game.js` — לוגיקת המשחק + צלילים
