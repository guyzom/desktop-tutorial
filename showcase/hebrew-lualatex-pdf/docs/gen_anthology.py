#!/usr/bin/env python3
"""Generate a ~100-page Hebrew academic anthology following content-style.md.

Density DNA (skill references/content-style.md):
  - prose is the default vehicle
  - ~1–2 colored boxes per chapter (not a wall of boxes)
  - ≥1 numbered equation per chapter (spine)
  - chapter ≈ idea → (optional box) → numbered eq → short intuition
  - box share target ~⅓; checker warns if >55%
  - gray tablebox is OK (not counted as colored box)
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent / "anthology.tex"

PARTS = [
  ("ארכיטקטורת מעבדים", [
    ("צנרת בסיסית", "pipeline", "CPI", r"\mathrm{CPI}_{\mathrm{ideal}}=1",
     "def", "צנרת מפרקת הוראה לשלבים חופפים בזמן כך שבמצב יציב יוצאת הוראה בכל מחזור."),
    ("סכסוכי נתונים", "hazards", "RAW", r"T_{\mathrm{stall}}=N_{\mathrm{load\text{-}use}}",
     "warn", "גם עם קידום מלא, \\code{lw} ואחריו שימוש דורשים \\en{stall} של מחזור."),
    ("סכסוכי בקרה", "control", "branch", r"P_{\mathrm{mispredict}}\\cdot T_{\mathrm{penalty}}",
     "key", "מחיר קפיצה שגויה הוא מכפלת ההסתברות בעונש במחזורים."),
    ("קידום אוגרים", "forward", "bypass", r"T_{\mathrm{fwd}} \\ll T_{\mathrm{stall}}",
     "def", "קידום מעביר תוצאה מ־\\en{EX/MEM} או \\en{MEM/WB} בלי לחכות ל־\\en{WB}."),
    ("חיזוי קפיצות", "branchpred", "BHT", r"A = 1 - P_{\mathrm{mis}}",
     "note", "דיוק החיזוי $A$ הוא המשלים של שיעור השגיאה."),
    ("סופרסקלר", "superscalar", "IPC", r"\\mathrm{IPC}_{\\mathrm{peak}} = W",
     "def", "רוחב השיגור $W$ הוא חסם עליון ל־\\en{IPC}, לא הערך הטיפוסי."),
    ("ביצוע מחוץ לסדר", "ooo", "ROB", r"N_{\\mathrm{ROB}} \\ge W\\cdot L",
     "key", "גודל ה־\\en{ROB} חייב לכסות את חלון הביצוע $W\\cdot L$."),
    ("רישום מחדש", "rename", "RAT", r"\\mathrm{RAT}: a_r \\mapsto p_i",
     "def", "ה־\\en{RAT} ממפה אוגר ארכיטקטוני לאוגר פיזיקלי ושובר תלויות־שם."),
  ]),
  ("היררכיית זיכרון", [
    ("מטמון L1", "l1", "AMAT", r"T_{\\mathrm{avg}}=T_h+r_m T_m",
     "key", "\\en{AMAT} הוא המדד היחיד שמאחד \\en{hit time} ו־\\en{miss rate}."),
    ("מטמון L2/L3", "l2", "inclusive", r"T_{\\mathrm{avg}}=T_{L1}+r_1(T_{L2}+r_2 T_{\\mathrm{mem}})",
     "def", "נוסחת הרמות משרשרת עונשים לפי שיעורי החמצה בכל דרג."),
    ("מדיניות החלפה", "repl", "LRU", r"C_{\\mathrm{miss}} = C_{\\mathrm{comp}}+C_{\\mathrm{cap}}+C_{\\mathrm{conf}}",
     "note", "שלוש ה־C: compulsory, capacity, conflict — כל אחת דורשת טיפול אחר."),
    ("מקומיות", "locality", "temporal", r"P(\\mathrm{reuse}\\mid t) \\propto e^{-t/\\tau}",
     "def", "מקומיות זמנית דועכת עם הזמן; מטמון מנצל את הזנב הקצר."),
    ("TLB ותרגום", "tlb", "VPN", r"T_{\\mathrm{addr}}=T_{\\mathrm{TLB}}+r_{\\mathrm{TLB}}T_{\\mathrm{PTW}}",
     "key", "החמצת \\en{TLB} יקרה כי הולכים ל־\\en{page walk}."),
    ("זיכרון וירטואלי", "vm", "page", r"VA = VPN \\| offset",
     "def", "כתובת וירטואלית מפורקת למספר עמוד והיסט בתוך העמוד."),
    ("קוהרנטיות מטמונים", "coherency", "MESI", r"S \\xrightarrow{\\mathrm{write}} M",
     "warn", "כתיבה במצב Shared דורשת פסילת עותקים לפני מעבר ל־Modified."),
    ("רוחב פס זיכרון", "membw", "bandwidth", r"BW = f\\cdot W\\cdot U",
     "key", "רוחב הפס הוא תדר $\\times$ רוחב $\\times$ ניצולת — לא רק תדר השעון."),
  ]),
  ("מערכות הפעלה", [
    ("תהליכים וחוטים", "proc", "PCB", r"N_{\\mathrm{ready}} = N - N_{\\mathrm{blocked}}",
     "def", "תור המוכנים הוא מה שנשאר אחרי חסימות I/O וסנכרון."),
    ("תזמון מעבד", "sched", "CFS", r"vruntime_i += \\Delta t \\cdot w_0/w_i",
     "key", "\\en{CFS} מאזן הוגנות דרך \\en{vruntime} משוקלל."),
    ("סנכרון", "sync", "mutex", r"P(\\mathrm{contention}) \\propto N_{\\mathrm{cores}}",
     "warn", "נעילה גלובלית לא משתלבת עם מספר ליבות — צריך פיצול."),
    ("קיפאון", "deadlock", "Coffman", r"\\mathrm{safe} \\Leftarrow \\nexists\\,\\mathrm{cycle}",
     "thm", "בלי מעגל בהקצאת משאבים אין קיפאון."),
    ("ניהול זיכרון", "memman", "buddy", r"S_k = 2^k",
     "def", "שיטת buddy מקצה בלוקים בחזקות שתיים וממזגת שכנים חופשיים."),
    ("קלט/פלט", "io", "DMA", r"T_{\\mathrm{IO}}=T_{\\mathrm{setup}}+S/BW",
     "key", "\\en{DMA} מוריד את המעבד ממסלול ההעתקה אחרי \\en{setup}."),
    ("מערכות קבצים", "fs", "inode", r"S = n_{\\mathrm{blocks}}\\cdot B",
     "def", "גודל קובץ נגזר ממספר הבלוקים וגודל בלוק."),
    ("וירטואליזציה", "virt", "VMEXIT", r"T_{\\mathrm{virt}}=T_{\\mathrm{guest}}+f_{\\mathrm{exit}}T_{\\mathrm{exit}}",
     "warn", "תדירות \\en{VMEXIT} גבוהה הורסת את יתרון הווירטואליזציה."),
  ]),
  ("רשתות ותקשורת", [
    ("מודל השכבות", "layers", "OSI", r"L_i \\to L_{i-1}",
     "def", "כל שכבה מוסיפה כותרת ומעבירה מטה — חוזה ברור בין שכבות."),
    ("TCP", "tcp", "cwnd", r"cwnd_{t+1}=cwnd_t + 1/\\mathrm{cwnd}_t",
     "key", "העלאת \\en{cwnd} ב־\\en{AIMD} היא זהירה אחרי \\en{slow start}."),
    ("ניתוב", "routing", "SPF", r"d(v)=\\min_u\\, d(u)+w(u,v)",
     "def", "דייקסטרה בונה מרחקים קצרים ביותר מעץ שורש."),
    ("עומסים ו־QoS", "qos", "latency", r"L = L_{\\mathrm{prop}}+L_{\\mathrm{queue}}+L_{\\mathrm{tx}}",
     "key", "השהיה היא סכום התפשטות, תור ושידור — לא רק רוחב פס."),
    ("אבטחת רשת", "netsec", "TLS", r"\\mathrm{TLS}=\\mathrm{handshake}+\\mathrm{record}",
     "def", "\\en{TLS} מפריד משא ומתן מפתחות מרישום הנתונים המוצפן."),
    ("CDN ומטמונים", "cdn", "HIT", r"T_{\\mathrm{user}}=T_{\\mathrm{edge}}+r_{\\mathrm{miss}}T_{\\mathrm{origin}}",
     "key", "\\en{CDN} הוא \\en{AMAT} לרשת: פגיעה בקצה מול החמצה למקור."),
  ]),
  ("אלגוריתמים ומבני נתונים", [
    ("סיבוכיות", "complexity", "BigO", r"T(n)=\\Theta(n\\log n)",
     "def", "סימון אסימפטוטי מתעלם מקבועים ומתמקד בסדר הגדילה."),
    ("מיונים", "sort", "quicksort", r"T(n)=2T(n/2)+\\Theta(n)",
     "key", "פיצול מאוזן נותן $n\\log n$; פיצול גרוע מחזיר $n^2$."),
    ("גרפים", "graphs", "BFS", r"|E|_{\\mathrm{tree}}=|V|-1",
     "def", "עץ פורש על $|V|$ קודקודים מכיל בדיוק $|V|-1$ קשתות."),
    ("תכנון דינמי", "dp", "opt", r"OPT(i)=\\min_j OPT(j)+c(j,i)",
     "key", "אופטימום נבנה מאופטימומים של תתי־בעיות חופפות."),
    ("גיבוב", "hash", "chaining", r"\\alpha = n/m",
     "def", "מקדם העומס $\\alpha$ שולט באורך השרשראות הממוצע."),
    ("עצים מאוזנים", "trees", "AVL", r"h = O(\\log n)",
     "thm", "איזון גבהים מבטיח חיפוש לוגריתמי."),
    ("זרימה ברשתות", "flow", "maxflow", r"v(f)=\\sum_{e \\ni s} f(e)",
     "def", "ערך הזרימה הוא סכום היציאות מהמקור."),
    ("קירובים", "approx", "ratio", r"ALG \\le \\rho\\cdot OPT",
     "key", "יחס הקירוב $\\rho$ הוא ההבטחה כש־\\en{NP}-קשה מונע דיוק."),
  ]),
  ("למידת מכונה", [
    ("רגרסיה לינארית", "linreg", "MSE", r"\\hat\\beta=(X^\\top X)^{-1}X^\\top y",
     "def", "פחות ריבועים נותן את האומדן הליניארי בצורת מטריצה סגורה."),
    ("סיווג", "clf", "logistic", r"p=\\sigma(w^\\top x)",
     "key", "לוגיסטי ממפה ציון ליניארי להסתברות דרך $\\sigma$."),
    ("רגולריזציה", "reg", "ridge", r"\\mathcal{L}=\\|y-Xw\\|^2+\\lambda\\|w\\|^2",
     "warn", "בלי $\\lambda$ המודל משנן רעש; עם $\\lambda$ גדול מדי הוא מפספס אות."),
    ("רשתות עצביות", "nn", "backprop", r"\\delta^{(l)}=(W^{(l+1)})^\\top\\delta^{(l+1)}\\odot\\sigma'(z^{(l)})",
     "def", "שגיאה מתפשטת אחורה דרך היעקוביאן של כל שכבה."),
    ("הכללה", "gen", "VC", r"R(h)\\le\\hat R(h)+O\\!\\left(\\sqrt{d/n}\\right)",
     "thm", "פער הכללה קטן כש־$n$ גדול ביחס לסיבוכיות $d$."),
    ("למידה לא מפוקחת", "unsup", "kmeans", r"J=\\sum_k\\sum_{x\\in C_k}\\|x-\\mu_k\\|^2",
     "key", "\\en{k-means} ממזער ריבועי מרחק למרכזים — תלוי באתחול."),
    ("הטמעות", "embed", "word2vec", r"\\max \\sum_t \\log p(w_{t+j}\\mid w_t)",
     "def", "הטמעה לומדת הקשר מקומי: מילים קרובות מקבלות וקטורים קרובים."),
  ]),
  ("חישוב קוונטי", [
    ("הקיוביט", "qubit", "Bloch", r"\\ket\\psi=\\cos\\tfrac\\theta2\\ket0+e^{i\\varphi}\\sin\\tfrac\\theta2\\ket1",
     "def", "מצב טהור הוא נקודה על כדור בלוך — שני פרמטרים ממשיים."),
    ("שערים בסיסיים", "gates", "Hadamard", r"H\\ket0=\\ket{+}",
     "key", "הדמרד יוצר סופרפוזיציה שווה מ־$\\ket0$."),
    ("שזירה", "entangle", "Bell", r"\\ket{\\Phi^+}=\\tfrac1{\\sqrt2}(\\ket{00}+\\ket{11})",
     "def", "מצב בל הוא שזירה מקסימלית לשני קיוביטים."),
    ("אי־שכפול", "noclone", "no-cloning", r"\\nexists U:\\ U(\\ket\\psi\\otimes\\ket0)=\\ket\\psi\\otimes\\ket\\psi",
     "thm", "אין העתקה אוניטרית של מצב שרירותי."),
    ("טלפורטציה", "teleport", "EPR", r"\\ket\\psi_B = X^{m_2}Z^{m_1}\\ket\\psi",
     "key", "שתי סיביות קלאסיות + שזירה משחזרות את המצב אצל בוב."),
    ("אלגוריתם גרובר", "grover", "oracle", r"O(\\sqrt N)\\ \\mathrm{queries}",
     "def", "חיפוש לא ממוין מאיץ ריבועית מול סריקה קלאסית."),
    ("שור", "shor", "period", r"a^r \\equiv 1 \\pmod N",
     "key", "מציאת הסדר $r$ מפרקת את $N$ בפולינום."),
    ("קודים לתיקון שגיאות", "qec", "surface", r"d_{\\mathrm{code}} \\ge 2t+1",
     "def", "מרחק הקוד קובע כמה שגיאות אפשר לתקן."),
    ("VQE", "vqe", "ansatz", r"E(\\theta)=\\bra{\\psi(\\theta)}H\\ket{\\psi(\\theta)}",
     "note", "לולאה היברידית: מעגל מפרמטרי + אופטימיזציה קלאסית."),
    ("רעש ומדידה", "noise", "depolarizing", r"\\mathcal{E}(\\rho)=(1-p)\\rho+p\\tfrac{I}{2}",
     "warn", "רעש דה־פולריזציה מערבב את המצב עם הזהות — סימולציה אידיאלית מטעה."),
  ]),
  ("אבטחה וקריפטוגרפיה", [
    ("הצפנה סימטרית", "sym", "AES", r"C = E_K(P)",
     "def", "מפתח אחד מצפין ומפענח; סודיות המפתח היא הכל."),
    ("מפתח ציבורי", "pubkey", "RSA", r"c \\equiv m^e \\pmod n",
     "key", "הצפנה במפתח ציבורי; פיענוח רק למי שמחזיק $d$."),
    ("חתימות", "sig", "verify", r"\\mathsf{Vrfy}(pk,\\sigma,m)=1",
     "def", "חתימה מאמתת מקור ושלמות בלי לחשוף מפתח פרטי."),
    ("גיבוב קריפטוגרפי", "hashc", "SHA", r"H:\\{0,1\\}^*\\to\\{0,1\\}^n",
     "key", "עמידות להתנגשות חשובה יותר מאורך הפלט לבדו."),
    ("פרוטוקולי אימות", "auth", "challenge", r"\\mathsf{Adv} \\le \\varepsilon",
     "thm", "פרוטוקול בטוח אם יתרון היריב זניח."),
    ("ערוץ מאובטח", "securech", "AEAD", r"\\mathsf{Enc}_k(\\mathrm{nonce},\\mathrm{aad},\\mathrm{pt})",
     "def", "\\en{AEAD} מצפין ומאמת יחד — כולל נתונים נלווים."),
  ]),
]


def en(s):
    return r"\en{" + s + "}"


def latex_cmd(s: str) -> str:
    """Collapse accidental double-backslashes in raw eq strings to single TeX cmds."""
    while "\\" * 2 in s:
        s = s.replace("\\" * 2, "\\")
    return s


BOX_ENV = {
    "def": ("defbox", "הגדרה"),
    "thm": ("thmbox", "משפט"),
    "key": ("keybox", "רעיון מפתח"),
    "warn": ("warnbox", "מלכודת"),
    "note": ("notebox", "הערה"),
    "ex": ("exbox", "דוגמה"),
}


def chapter(i, title, key, keyword, eq_tex, box_kind, box_body):
    """content-style.md chapter: 1 box, ≥1 numbered eq, short intuition, ≤2 prose paras."""
    env, label = BOX_ENV[box_kind]
    eq_tex = latex_cmd(eq_tex)
    lines = []
    lines.append(f"\\chapter{{{title}}}")
    lines.append(f"\\label{{ch:{key}}}")
    lines.append("")
    # One framing sentence (not a soft intro paragraph)
    lines.append(
        f"היחידה נסגרת סביב {en(keyword)}: הגדרה, מדד, ומה נשבר כשמתעלמים ממנו."
    )
    lines.append("")
    # Exactly ONE colored box (semantic highlight — not a box wall)
    lines.append(f"\\begin{{{env}}}[frametitle={{{label} — {title}}}]")
    lines.append(box_body)
    lines.append(f"\\end{{{env}}}")
    lines.append("")
    # Numbered equation (spine)
    lines.append("\\begin{equation}")
    lines.append(f"\\label{{eq:{key}}}")
    lines.append(eq_tex)
    lines.append("\\end{equation}")
    lines.append("")
    # Short intuition (1–2 lines of prose — content-style §3)
    lines.append(
        f"המשמעות של~\\eqref{{eq:{key}}}: מודדים את {en(keyword)} קודם, ורק אחר כך צוללים לרכיב."
    )
    lines.append("")
    # Second numbered eq often (target ≥1–3 eqs/ch) — still prose-default, not more boxes
    if i % 2 == 1:
        lines.append("\\begin{equation}")
        lines.append(f"\\label{{eq:{key}-check}}")
        lines.append(r"\Delta M \propto \Delta x_{\mathrm{dom}}")
        lines.append("\\end{equation}")
        lines.append(
            f"כאן $M$ הוא {en(keyword)};~\\eqref{{eq:{key}-check}} מזכירה לחפש רגישות, לא מיקרו־אופטימיזציה."
        )
        lines.append("")
    # Gray table occasionally (neutral tablebox — not a colored box)
    if i % 4 == 0:
        lines.append("\\begin{tablebox}\\centering\\small")
        lines.append("\\begin{tabular}{@{}lll@{}}")
        lines.append("\\toprule")
        lines.append(f"\\textbf{{מצב}} & \\textbf{{סדר גודל}} & \\textbf{{פעולה}}\\\\")
        lines.append("\\midrule")
        lines.append(f"תקין & $\\sim 1\\times$ & שמור מדידה\\\\")
        lines.append(f"חשוד & $1.5$–$2\\times$ & בודקים תלות\\\\")
        lines.append(f"שבור & $\\ge 2\\times$ & תיקון מבני\\\\")
        lines.append("\\bottomrule")
        lines.append("\\end{tabular}")
        lines.append(f"\\tabcap{{כיול מהיר ל־{en(keyword)}.}}")
        lines.append("\\end{tablebox}")
        lines.append("")
    if i % 5 == 0:
        lines.append("רצף שממחיש לחץ על המדד:")
        lines.append("\\begin{asmblock}")
        lines.append("\\begin{lstlisting}[style=asm]")
        lines.append("lw   $t0, 0($s0)")
        lines.append("add  $t1, $t0, $s1   # depends on t0")
        lines.append("\\end{lstlisting}")
        lines.append("\\end{asmblock}")
        lines.append(
            f"התלות על \\code{{\\$t0}} היא עלות ב־{en(keyword)}, לא ״באג קוד״."
        )
        lines.append("")
    if i % 6 == 0:
        lines.append("\\begin{tikzpic}")
        lines.append("\\begin{tikzpicture}[font=\\small,node distance=8mm,>={Latex[length=2mm]},")
        lines.append("  box/.style={draw,thick,rounded corners,align=center,minimum width=2.4cm,minimum height=1.0cm,fill=cBlueBg}]")
        lines.append(f"  \\node[box] (a) {{{en('In')}}};")
        lines.append(f"  \\node[box,right=of a] (b) {{{en(keyword[:8])}}};")
        lines.append(f"  \\node[box,right=of b,fill=cGreenBg] (c) {{{en('Out')}}};")
        lines.append("  \\draw[->,thick] (a) -- (b);")
        lines.append("  \\draw[->,thick] (b) -- (c);")
        lines.append("\\end{tikzpicture}")
        lines.append("\\end{tikzpic}")
        lines.append(f"\\begin{{center}}\\small איור — זרימה ל־{en(keyword)}\\end{{center}}")
        lines.append("")
    lines.append("סדר עבודה:")
    lines.append("\\begin{enumerate}")
    lines.append(f"\\item[(\\textbf{{א}})] מדוד את {en(keyword)} לפי~\\eqref{{eq:{key}}}.")
    lines.append("\\item[(\\textbf{ב})] זהה גורם שולט אחד.")
    lines.append("\\item[(\\textbf{ג})] שנה אותו בלבד, ומדוד שוב.")
    lines.append("\\end{enumerate}")
    lines.append("")
    return "\n".join(lines)


def bridge(part_title, keys):
    # prose-only connective chapter, 0–1 box
    refs = ", ".join(rf"\\eqref{{eq:{k}}}" for k in keys[:4])
    return f"""
\\chapter{{חיבור — {part_title}}}
\\label{{ch:bridge-{keys[0]}}}

הפרקים בחלק ״{part_title}״ חולקים משמעת אחת: מדד, נוסחה, מדידה.
הנוסחאות {refs} אינן אוסף עובדות — הן חוזה מדידה.

\\begin{{keybox}}[frametitle={{חוזה החלק}}]
לכל נוסחה ממוספרת בחלק כתוב ניסוי אחד שמאמת אותה. בלי ניסוי — היא דקורציה.
\\end{{keybox}}

כששני מדדים מתנגשים, בוחרים לפי מטרת המערכת (השהיה מול מעבר־נתונים, דיוק מול עלות),
לא לפי הנוסחה היפה יותר.
"""


def exercise(i, key, keyword):
    # exbox (question) + keybox (solution) — allowed in exercises part
    return f"""
\\begin{{exbox}}[frametitle={{תרגיל {i} — {en(keyword)}}}]
\\textbf{{(א)}} חשב לפי~\\eqref{{eq:{key}}} עם $a=1$, $b=0.05$, $c=80$.\\\\[3pt]
\\textbf{{(ב)}} הורד את $b$ ל־$0.02$ והעלה את $a$ ל־$2$. האם כדאי?\\\\[3pt]
\\textbf{{(ג)}} מתי הקירוב נשבר?
\\end{{exbox}}

\\begin{{keybox}}[frametitle={{פתרון {i}}},nobreak=true]
\\textbf{{פתרון (א).}} מצבים ל~\\eqref{{eq:{key}}} ומקבלים ערך יחיד.\\\\[2pt]
\\textbf{{פתרון (ב).}} משווים שני ערכים של המדד — ההחלטה לפי המספר, לא לפי אינטואיציה.\\\\[2pt]
\\textbf{{פתרון (ג).}} כשגורמים שנחשבו בלתי־תלויים מתואמים.\\\\[2pt]
\\textbf{{לקח.}} מדוד דרך הנוסחה.
\\end{{keybox}}
"""


def main():
    chunks = []
    chunks.append(r"""% anthology.tex — content-style disciplined (~1 box/ch, prose spine)
% Generated by gen_anthology.py — follows references/content-style.md
\input{preamble.tex}
\usepackage{graphicx}

\begin{document}
\begin{titlepage}
\centering\vspace*{3.8cm}
{\Huge\bfseries לקט מערכות וחישוב\par}
\vspace{1.0cm}
{\Large ארכיטקטורה / מערכות / אלגוריתמים / למידה / קוונטים / אבטחה\par}
\vspace{0.8cm}
{\large ראווה ל־\en{hebrew-lualatex-pdf} — לפי \texttt{content-style.md}\par}
\vspace{0.4cm}
{\large יעד: פרוזה + משוואות ממוספרות כשדרה; $\sim$1--2 קופסאות לפרק\par}
\vfill
\end{titlepage}

\tableofcontents
\clearpage
""")

    all_keys = []
    global_i = 0
    for part_title, chapters in PARTS:
        chunks.append(f"\\part{{{part_title}}}\n")
        part_keys = []
        for title, key, keyword, eq_tex, box_kind, box_body in chapters:
            chunks.append(chapter(global_i, title, key, keyword, eq_tex, box_kind, box_body))
            part_keys.append(key)
            all_keys.append((key, keyword))
            global_i += 1
        chunks.append(bridge(part_title, part_keys))

    # One quantum circuit showcase chapter (thm box + prose proof — like skill exemplar)
    chunks.append(r"""
\part{תבניות עבודה}
\chapter{מעגל בל ואי־שכפול}
\label{ch:bell-template}

מצב בל הוא תבנית העבודה לשזירה דו־קיוביטית.

\begin{equation}
\label{eq:bell-template}
\ket{\Phi^+} = \tfrac1{\sqrt2}(\ket{00}+\ket{11})
\end{equation}

\begin{qcirc}
\begin{quantikz}
\lstick{$\ket0$} & \gate{H} & \ctrl{1} & \meter{} \\
\lstick{$\ket0$} & \qw & \targ{} & \meter{}
\end{quantikz}
\end{qcirc}
\begin{center}\small איור — הכנת $\ket{\Phi^+}$ ומדידה\end{center}

\begin{thmbox}[frametitle={משפט — אי־שכפול}]
לא קיים אופרטור אוניטרי $U$ כך ש־$U(\ket\psi\otimes\ket0)=\ket\psi\otimes\ket\psi$ לכל $\ket\psi$.
\end{thmbox}

\noindent\textbf{הוכחה (בקצרה).}
 נניח שקיים $U$ לשני מצבים. אז $\braket{\psi}{\phi}=\braket{\psi}{\phi}^2$,
ולכן $\braket{\psi}{\phi}\in\{0,1\}$ — סתירה לליניאריות על מצב שרירותי. $\qquad\blacksquare$

הלקח התפעולי: שזירה לא ניתנת להעתקה מקומית; כל פרוטוקול שמניח עותק שקט של מצב שזור שבור מראש.
""")

    chunks.append(r"""
\chapter{עקומות ביצוע}
\label{ch:curves}

גרף הוא מדידה: ציר $x$ פרמטר תכנון, ציר $y$ המדד.

\begin{tikzpic}
\begin{tikzpicture}
\begin{axis}[
  width=11cm, height=6cm,
  xlabel={גודל (יח')},
  ylabel={עלות / שגיאה},
  legend style={at={(0.97,0.97)},anchor=north east,font=\small},
  grid=major, grid style={gray!20},
]
\addplot[thick,mark=*] coordinates {(1,18)(2,14)(4,10)(8,7)(16,5)(32,4)};
\addlegendentry{בסיס}
\addplot[thick,dashed,mark=square*] coordinates {(1,14)(2,10)(4,7)(8,4.5)(16,3)(32,2.2)};
\addlegendentry{משופר}
\end{axis}
\end{tikzpicture}
\end{tikzpic}
\begin{center}\small איור — ירידת שגיאה עם גודל המשאב\end{center}

נקודת התכנון היא שם שהתועלת השולית יורדת מתחת לעלות השולית — לא קצה העקומה.
""")

    chunks.append("\\part{תרגילים פתורים}\n\\chapter{תרגילים מסכמים}\n\\label{ch:ex}\n")
    for i, (key, kw) in enumerate(all_keys[::3][:20], start=1):
        chunks.append(exercise(i, key, kw))

    chunks.append(r"""
\chapter{נספח — זהויות}
\label{ch:appendix}

\[
T = \mathrm{IC}\times\mathrm{CPI}\times T_{\mathrm{clk}},\qquad
T_{\mathrm{avg}}=T_{\mathrm{hit}}+r_{\mathrm{miss}}T_{\mathrm{miss}}
\]
\[
HXH=Z,\qquad HZH=X,\qquad H^2=I
\]

\begin{tablebox}\centering\small
\begin{tabular}{@{}ll@{}}
\toprule
\textbf{קיצור} & \textbf{משמעות}\\
\midrule
\en{CPI} & מחזורים להוראה\\
\en{AMAT} & זמן גישה ממוצע\\
\en{IPC} & הוראות למחזור\\
\en{TLB} & מטמון תרגום\\
\en{VQE} & אומדן ערך עצמי וריאציוני\\
\bottomrule
\end{tabular}
\tabcap{קיצורים מרכזיים.}
\end{tablebox}

\end{document}
""")

    text = "\n".join(chunks)
    # Fix double-escaped backslashes from PARTS raw strings that used \\ for latex
    # PARTS eq_tex used r"..." with \\mathrm - in chapter we need single \
    # Actually in PARTS I used r"T_{\\mathrm{avg}}" which becomes T_{\mathrm{avg}} in the file - good.
    # Wait - in the first few I used single \ in r-strings like r"\mathrm{CPI}" - good
    # Later ones have \\mathrm which writes \mathrm - good
    # But some have \\cdot which is \cdot - good
    # Problem: r"P_{\mathrm{mispredict}}\\cdot T" -> P_{\mathrm{mispredict}}\cdot T - good

    # Charset: avoid middle dots etc already
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes), chapters≈{global_i}")


if __name__ == "__main__":
    main()
