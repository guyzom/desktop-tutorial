#!/usr/bin/env python3
"""Generate a dense ~100-page Hebrew academic anthology for hebrew-lualatex-pdf."""
from pathlib import Path

OUT = Path(__file__).resolve().parent / "anthology.tex"

# Topic banks — real study-guide style units (idea → box → equation → intuition)
PARTS = [
  ("ארכיטקטורת מעבדים", [
    ("צנרת בסיסית", "pipeline", "CPI", r"\mathrm{CPI}_{\mathrm{ideal}}=1"),
    ("סכסוכי נתונים", "hazards", "RAW", r"T_{\mathrm{stall}}=N_{\mathrm{load\text{-}use}}\cdot 1"),
    ("סכסוכי בקרה", "control", "branch", r"P_{\mathrm{mispredict}}\cdot T_{\mathrm{penalty}}"),
    ("קידום אוגרים", "forward", "bypass", r"T_{\mathrm{fwd}} \ll T_{\mathrm{stall}}"),
    ("חיזוי קפיצות", "branchpred", "BHT", r"A = 1 - P_{\mathrm{mis}}"),
    ("סופרסקלר", "superscalar", "IPC", r"\mathrm{IPC}_{\mathrm{peak}} = W"),
    ("ביצוע מחוץ לסדר", "ooo", "ROB", r"N_{\mathrm{ROB}} \ge W\cdot L"),
    ("רישום מחדש", "rename", "RAT", r"\mathrm{RAT}: a_r \mapsto p_i"),
  ]),
  ("היררכיית זיכרון", [
    ("מטמון L1", "l1", "AMAT", r"T_{\mathrm{avg}}=T_h+r_m T_m"),
    ("מטמון L2/L3", "l2", "inclusive", r"T_{\mathrm{avg}}=T_{L1}+r_1(T_{L2}+r_2 T_{\mathrm{mem}})"),
    ("מדיניות החלפה", "repl", "LRU", r"C_{\mathrm{conflict}} \downarrow \text{ with associativity}"),
    ("מקומיות", "locality", "temporal", r"P(\mathrm{reuse}\mid t) \propto e^{-t/\tau}"),
    ("TLB ותרגום", "tlb", "VPN", r"T_{\mathrm{addr}}=T_{\mathrm{TLB}}+r_{\mathrm{TLB}}T_{\mathrm{PTW}}"),
    ("זיכרון וירטואלי", "vm", "page", r"VA = VPN \| offset"),
    ("קוהרנטיות מטמונים", "coherency", "MESI", r"S \to M \text{ on write}"),
    ("רוחב פס זיכרון", "membw", "bandwidth", r"BW = f\cdot W\cdot U"),
  ]),
  ("מערכות הפעלה", [
    ("תהליכים וחוטים", "proc", "PCB", r"N_{\mathrm{ready}} = N - N_{\mathrm{blocked}}"),
    ("תזמון מעבד", "sched", "CFS", r"vruntime_i += \Delta t \cdot w_0/w_i"),
    ("סנכרון", "sync", "mutex", r"P(\mathrm{contention}) \propto N_{\mathrm{cores}}"),
    ("קיפאון", "deadlock", "Coffman", r"\nexists\, \mathrm{cycle} \Rightarrow \mathrm{safe}"),
    ("ניהול זיכרון", "memman", "buddy", r"2^k \text{ blocks}"),
    ("קלט/פלט", "io", "DMA", r"T_{\mathrm{IO}}=T_{\mathrm{setup}}+S/BW"),
    ("מערכות קבצים", "fs", "inode", r"S = n_{\mathrm{blocks}}\cdot B"),
    ("וירטואליזציה", "virt", "VMEXIT", r"T_{\mathrm{virt}}=T_{\mathrm{guest}}+f_{\mathrm{exit}}T_{\mathrm{exit}}"),
  ]),
  ("רשתות ותקשורת", [
    ("מודל השכבות", "layers", "OSI", r"L_i \to L_{i-1}"),
    ("TCP", "tcp", "cwnd", r"cwnd_{t+1}=cwnd_t + 1/\mathrm{cwnd}_t"),
    ("ניתוב", "routing", "SPF", r"d(v)=\min_u d(u)+w(u,v)"),
    ("עומסים ו־QoS", "qos", "latency", r"L = L_{\mathrm{prop}}+L_{\mathrm{queue}}+L_{\mathrm{tx}}"),
    ("אבטחת רשת", "netsec", "TLS", r"\mathrm{TLS} = \mathrm{handshake}+\mathrm{record}"),
    ("CDN ומטמונים", "cdn", "HIT", r"T_{\mathrm{user}}=T_{\mathrm{edge}}+r_{\mathrm{miss}}T_{\mathrm{origin}}"),
  ]),
  ("אלגוריתמים ומבני נתונים", [
    ("סיבוכיות", "complexity", "BigO", r"T(n)=\Theta(n\log n)"),
    ("מיונים", "sort", "quicksort", r"T(n)=2T(n/2)+\Theta(n)"),
    ("גרפים", "graphs", "BFS", r"|E|_{\mathrm{tree}}=|V|-1"),
    ("תכנון דינמי", "dp", "opt", r"OPT(i)=\min_j OPT(j)+c(j,i)"),
    ("גיבוב", "hash", "chaining", r"\alpha = n/m"),
    ("עצים מאוזנים", "trees", "AVL", r"h = O(\log n)"),
    ("זרימה ברשתות", "flow", "maxflow", r"v(f)=\sum_{e\out{s}} f(e)"),
    ("קירובים", "approx", "ratio", r"ALG \le \rho\cdot OPT"),
  ]),
  ("למידת מכונה", [
    ("רגרסיה לינארית", "linreg", "MSE", r"\hat\beta=(X^\top X)^{-1}X^\top y"),
    ("סיווג", "clf", "logistic", r"p=\sigma(w^\top x)"),
    ("רגולריזציה", "reg", "ridge", r"\mathcal{L}=\|y-Xw\|^2+\lambda\|w\|^2"),
    ("רשתות עצביות", "nn", "backprop", r"\delta^{(l)}=(W^{(l+1)})^\top\delta^{(l+1)}\odot\sigma'(z^{(l)})"),
    ("הכללה", "gen", "VC", r"R(h)\le\hat R(h)+O\!\left(\sqrt{\frac{d}{n}}\right)"),
    ("למידה לא מפוקחת", "unsup", "kmeans", r"J=\sum_{k=1}^{K}\sum_{x\in C_k}\|x-\mu_k\|^2"),
    ("הטמעות", "embed", "word2vec", r"\max \sum_t \log p(w_{t+j}\mid w_t)"),
  ]),
  ("חישוב קוונטי", [
    ("הקיוביט", "qubit", "Bloch", r"\ket\psi=\cos\tfrac\theta2\ket0+e^{i\varphi}\sin\tfrac\theta2\ket1"),
    ("שערים בסיסיים", "gates", "Hadamard", r"H\ket0=\ket{+}"),
    ("שזירה", "entangle", "Bell", r"\ket{\Phi^+}=\tfrac1{\sqrt2}(\ket{00}+\ket{11})"),
    ("אי־שכפול", "noclone", "no-cloning", r"\nexists U:\ U(\ket\psi\otimes\ket0)=\ket\psi\otimes\ket\psi"),
    ("טלפורטציה", "teleport", "EPR", r"\ket\psi_B = X^{m_2}Z^{m_1}\ket\psi"),
    ("אלגוריתם גרובר", "grover", "oracle", r"O(\sqrt N)\ \mathrm{queries}"),
    ("שור של שור", "shor", "period", r"a^r \equiv 1 \pmod N"),
    ("קודים לתיקון שגיאות", "qec", "surface", r"d_{\mathrm{code}} \ge 2t+1"),
    ("VQE", "vqe", "ansatz", r"E(\theta)=\bra{\psi(\theta)}H\ket{\psi(\theta)}"),
    ("רעש ומדידה", "noise", "depolarizing", r"\mathcal{E}(\rho)=(1-p)\rho+p\tfrac{I}{2}"),
  ]),
  ("אבטחה וקריפטוגרפיה", [
    ("הצפנה סימטרית", "sym", "AES", r"C = E_K(P)"),
    ("מפתח ציבורי", "pubkey", "RSA", r"c \equiv m^e \pmod n"),
    ("חתימות", "sig", "verify", r"\mathsf{Vrfy}(pk,\sigma,m)=1"),
    ("גיבוב קריפטוגרפי", "hashc", "SHA", r"H:\{0,1\}^*\to\{0,1\}^n"),
    ("פרוטוקולי אימות", "auth", "challenge", r"\mathsf{Adv} \le \varepsilon"),
    ("ערוץ מאובטח", "securech", "AEAD", r"\mathsf{Enc}_{k}(nonce, aad, pt)"),
  ]),
]

ASM_SNIPPETS = [
("""add  $t0, $s0, $s1
sub  $t2, $t0, $s2
lw   $t3, 0($t0)
addi $t4, $t3, 4""", "RAW on \\code{\\$t0}; load-use needs a stall"),
("""beq  $t0, $t1, L1
add  $t2, $t3, $t4
L1:  nop""", "control hazard after a branch"),
("""lw   $t0, 0($s0)
lw   $t1, 4($s0)
add  $t2, $t0, $t1""", "two loads then dependent add"),
]

def en(s):
    return r"\en{" + s + "}"

def chapter(part_i, ch_i, title, key, keyword, eq_tex, total_ch_global):
    """Emit one dense chapter (~1.5–2.5pp target)."""
    lines = []
    lines.append(f"\\chapter{{{title}}}")
    lines.append(f"\\label{{ch:{key}}}")
    lines.append("")
    # Opening
    lines.append(
        f"הפרק הזה סוגר יחידה אחת סביב הרעיון המרכזי ״{title}״. "
        f"המילה המנחה היא {en(keyword)}; כל הנוסחאות והדוגמאות משרתות אותו."
    )
    lines.append("")
    # Definition box
    lines.append(f"\\begin{{defbox}}[frametitle={{הגדרה — {title}}}]")
    lines.append(
        f"מגדירים את המושג דרך מדד תפעולי: הקשר בין הקלטים לבין התוצאה הנמדדת. "
        f"בסימון מקוצר: המדד המרכזי הוא {en(keyword)}."
    )
    lines.append("\\end{defbox}")
    lines.append("")
    # Numbered equation
    lines.append("\\begin{equation}")
    lines.append(f"\\label{{eq:{key}}}")
    lines.append(eq_tex)
    lines.append("\\end{equation}")
    lines.append(
        f"משוואה~\\eqref{{eq:{key}}} היא עמוד השדרה של הפרק. "
        f"האינטואיציה: כל שיפור ב־{en(keyword)} חייב להשתקף בנוסחה הזו, אחרת הוא שיפור מדומה."
    )
    lines.append("")
    # Key idea
    lines.append("\\begin{keybox}[frametitle={רעיון מפתח}]")
    lines.append(
        f"אל תמדוד רכיב בבידוד. מדוד את השפעתו על המדד הגלובלי דרך~\\eqref{{eq:{key}}}. "
        f"זו המשמעת שמבדילה בין אופטימיזציה אמיתית לבין מיקרו־כוונון חסר תועלת."
    )
    lines.append("\\end{keybox}")
    lines.append("")
    # Second display (unnumbered) + prose
    lines.append("הצורה המורחבת שמופיעה בתרגילים:")
    lines.append("\\[")
    lines.append(eq_tex.replace("=", r"=\,", 1) if "=" in eq_tex else eq_tex)
    lines.append("\\]")
    lines.append(
        f"בפועל מפרקים את הביטוי לגורמים שניתן למדוד: זמן, הסתברות, רוחב, או מספר פעולות. "
        f"כל גורם מקבל ניסוי נפרד, ואז מרכיבים חזרה לפי~\\eqref{{eq:{key}}}."
    )
    lines.append("")
    # Occasional table
    if ch_i % 2 == 0:
        lines.append("\\begin{tablebox}\\centering\\small")
        lines.append("\\begin{tabular}{@{}lll@{}}")
        lines.append("\\toprule")
        lines.append(f"\\textbf{{מצב}} & \\textbf{{מדד}} & \\textbf{{השפעה על {en(keyword)}}}\\\\")
        lines.append("\\midrule")
        lines.append(f"אידיאלי & $1.0\\times$ & חסם תחתון\\\\")
        lines.append(f"טיפוסי & $1.2$–$1.8\\times$ & כולל תלויות\\\\")
        lines.append(f"גרוע & $\\ge 2\\times$ & דורש תיקון מבני\\\\")
        lines.append("\\bottomrule")
        lines.append("\\end{tabular}")
        lines.append(f"\\tabcap{{סדרי גודל ל־{en(keyword)} בפרק~\\ref{{ch:{key}}}.}}")
        lines.append("\\end{tablebox}")
        lines.append("")
    # Occasional listing
    if ch_i % 3 == 0:
        code, comment = ASM_SNIPPETS[ch_i % len(ASM_SNIPPETS)]
        lines.append("\\begin{exbox}[frametitle={דוגמה — רצף מובחן}]")
        lines.append(f"הרצף מדגים לחץ על {en(keyword)} ({comment}):")
        lines.append("\\begin{asmblock}")
        lines.append("\\begin{lstlisting}[style=asm]")
        lines.append(code)
        lines.append("\\end{lstlisting}")
        lines.append("\\end{asmblock}")
        lines.append("\\end{exbox}")
        lines.append("")
    # Occasional tikz (every 4th)
    if ch_i % 4 == 0:
        lines.append("\\begin{tikzpic}")
        lines.append("\\begin{tikzpicture}[font=\\small,node distance=7mm,>={Latex[length=2mm]},")
        lines.append("  box/.style={draw,thick,rounded corners,align=center,minimum width=2.2cm,minimum height=1.0cm,fill=cBlueBg}]")
        lines.append(f"  \\node[box] (a) {{{en('In')}}};")
        lines.append(f"  \\node[box,right=of a] (b) {{{en(keyword[:6] or 'Core')}}};")
        lines.append(f"  \\node[box,right=of b,fill=cGreenBg] (c) {{{en('Out')}}};")
        lines.append("  \\draw[->,thick] (a) -- (b);")
        lines.append("  \\draw[->,thick] (b) -- (c);")
        lines.append("\\end{tikzpicture}")
        lines.append("\\end{tikzpic}")
        lines.append(f"\\begin{{center}}\\small איור — זרימה סכמטית ל־{en(keyword)}\\end{{center}}")
        lines.append("")
    # Warn / note
    if ch_i % 2 == 1:
        lines.append("\\begin{warnbox}[frametitle={מלכודת נפוצה}]")
        lines.append(
            f"לשפר רכיב מקומי בלי לבדוק את~\\eqref{{eq:{key}}} יוצר אופטימיזציה מדומה. "
            f"ודא שהשיפור ב־{en(keyword)} שורד גם בעומס אמיתי, לא רק במיקרו־בנצ׳מרק."
        )
        lines.append("\\end{warnbox}")
        lines.append("")
    else:
        lines.append("\\begin{notebox}[frametitle={הערה}]")
        lines.append(
            f"הסימון אחיד לאורך הפרק: משתנים לטיניים ב־{en('math')}, מזהים ב־\\code{{code}}, "
            f"והסבר בעברית מחוץ לנוסחה."
        )
        lines.append("\\end{notebox}")
        lines.append("")
    # Closing intuition + list
    lines.append("סיכום תפעולי:")
    lines.append("\\begin{enumerate}")
    lines.append(f"\\item[(\\textbf{{א}})] זהה את המדד — כאן {en(keyword)} דרך~\\eqref{{eq:{key}}}.")
    lines.append(f"\\item[(\\textbf{{ב}})] פרק לגורמים מדידים וודא יחידות.")
    lines.append(f"\\item[(\\textbf{{ג}})] שפר גורם אחד בכל פעם ומדוד שוב.")
    lines.append("\\end{enumerate}")
    lines.append("")
    return "\n".join(lines)


def exercise_block(i, key, keyword, eq_ref):
    return f"""
\\begin{{exbox}}[frametitle={{תרגיל {i} — {en(keyword)}}}]
\\textbf{{(א)}} חשב את ערך המדד לפי~\\eqref{{eq:{eq_ref}}} עבור המספרים שבטבלה למטה.\\\\[4pt]
\\textbf{{(ב)}} שנה פרמטר אחד ב־$10\\%$ והסבר את כיוון השינוי.\\\\[4pt]
\\textbf{{(ג)}} ציין מתי הקירוב נשבר.
\\end{{exbox}}

\\begin{{tablebox}}\\centering\\small
\\begin{{tabular}}{{@{{}}lll@{{}}}}
\\toprule
\\textbf{{פרמטר}} & \\textbf{{ערך א}} & \\textbf{{ערך ב}}\\\\
\\midrule
$a$ & $1.0$ & $1.2$\\\\
$b$ & $0.05$ & $0.02$\\\\
$c$ & $80$ & $100$\\\\
\\bottomrule
\\end{{tabular}}
\\tabcap{{נתונים לתרגיל {i}.}}
\\end{{tablebox}}

\\begin{{keybox}}[frametitle={{פתרון {i}}},nobreak=true]
\\textbf{{פתרון (א).}}\\\\
מצבים לתוך~\\eqref{{eq:{eq_ref}}} ומקבלים ערך מספרי יחיד.\\\\[3pt]
\\textbf{{פתרון (ב).}}\\\\
נגזרת/רגישות לפי הגורם ששינית — כיוון השינוי חייב להתאים לנוסחה.\\\\[3pt]
\\textbf{{פתרון (ג).}}\\\\
הקירוב נשבר כשיש תלות סמויה בין גורמים שנחשבו בלתי־תלויים.\\\\[3pt]
\\textbf{{לקח.}} מדוד דרך הנוסחה, לא דרך תחושת בטן.
\\end{{keybox}}
"""


def quantum_circuit_chapter():
    return r"""
\chapter{מעגל בל כתבנית עבודה}
\label{ch:bell-template}

מצב בל הוא תבנית העבודה לשזירה דו־קיוביטית:
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
לא קיים $U$ אוניטרי כך ש־$U(\ket\psi\otimes\ket0)=\ket\psi\otimes\ket\psi$ לכל $\ket\psi$.
\end{thmbox}

\noindent\textbf{הוכחה (בקצרה).}
 נניח שקיים. אז $\braket{\psi}{\phi}=\braket{\psi}{\phi}^2$,
ולכן $\braket{\psi}{\phi}\in\{0,1\}$ — סתירה לליניאריות. $\qquad\blacksquare$
"""


def main():
    chunks = []
    chunks.append(r"""% anthology.tex — dense ~100-page Hebrew academic showcase (generated)
% Build: bash ../scripts/build.sh anthology.tex
\input{preamble.tex}
\usepackage{graphicx}

\title{לקט מערכות וחישוב}
\author{אנציקלופדיית לימוד צפופה — ראווה ל־hebrew-lualatex-pdf}
\date{}

\begin{document}
\begin{titlepage}
\centering\vspace*{3.8cm}
{\Huge\bfseries לקט מערכות וחישוב\par}
\vspace{1.0cm}
{\Large ארכיטקטורה $\cdot$ מערכות $\cdot$ אלגוריתמים $\cdot$ למידה $\cdot$ קוונטים $\cdot$ אבטחה\par}
\vspace{0.8cm}
{\large מסמך ראווה צפוף לצינור \en{hebrew-lualatex-pdf}\par}
\vspace{0.5cm}
{\large מטרה: $\sim$100 עמודים עם משוואות, קופסאות, טבלאות, קוד ותרגילים\par}
\vfill
\end{titlepage}

\tableofcontents
\clearpage
""")
    # Fix middle-dot in title page - charset may reject · 
    # I'll fix below by regenerating without ·

    eq_keys = []
    global_ch = 0
    for part_title, chapters in PARTS:
        chunks.append(f"\\part{{{part_title}}}\n")
        for i, (title, key, keyword, eq_tex) in enumerate(chapters):
            global_ch += 1
            chunks.append(chapter(0, i, title, key, keyword, eq_tex, global_ch))
            eq_keys.append(key)
        # Extra connective chapter per part
        chunks.append(f"""
\\chapter{{חיבור הפרק — {part_title}}}
\\label{{ch:bridge-{len(eq_keys)}}}

הפרקים הקודמים בחלק ״{part_title}״ חולקים מבנה זהה: מדד $\\leftarrow$ נוסחה $\\leftarrow$ מדידה.
הטעות הנפוצה היא לאסוף עובדות במקום לשלוט במדד.
\\begin{{keybox}}[frametitle={{התמונה הגדולה של החלק}}]
חזור על כל משוואה ממוספרת בחלק, וכתוב במשפט אחד איזה ניסוי מאמת אותה.
אם אין ניסוי — הנוסחה עדיין דקורטיבית.
\\end{{keybox}}
""")

    chunks.append(quantum_circuit_chapter())

    # pgfplots chapter
    chunks.append(r"""
\chapter{עקומות ביצוע — קריאה נכונה}
\label{ch:curves}

גרף אינו קישוט: הוא מדידה. הציר האופקי הוא פרמטר תכנון; האנכי הוא המדד.

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

\begin{notebox}[frametitle={איך קוראים את הגרף}]
חפש נקודת שבת: מעבר אליה העלות עולה מהר והתועלת יורדת.
זו נקודת התכנון, לא קצה העקומה.
\end{notebox}
""")

    # Exercises part
    chunks.append("\\part{תרגילים פתורים}\n")
    chunks.append("\\chapter{תרגילים מסכמים}\n\\label{ch:ex}\n")
    # pick subset of keys for exercises
    for i, key in enumerate(eq_keys[::3][:24], start=1):
        # find keyword from PARTS
        kw = key
        for _, chs in PARTS:
            for title, k, keyword, _ in chs:
                if k == key:
                    kw = keyword
                    break
        chunks.append(exercise_block(i, key, kw, key))

    chunks.append(r"""
\chapter{נספח — זהויות וקיצורים}
\label{ch:appendix}

\[
T = \mathrm{IC}\times\mathrm{CPI}\times T_{\mathrm{clk}},\qquad
T_{\mathrm{avg}}=T_{\mathrm{hit}}+r_{\mathrm{miss}}T_{\mathrm{miss}}
\]
\[
HXH=Z,\qquad HZH=X,\qquad H^2=I
\]
\[
\ket{\Phi^\pm}=\tfrac1{\sqrt2}(\ket{00}\pm\ket{11}),\qquad
\ket{\Psi^\pm}=\tfrac1{\sqrt2}(\ket{01}\pm\ket{10})
\]

\begin{tablebox}\centering\small
\begin{tabular}{@{}ll@{}}
\toprule
\textbf{קיצור} & \textbf{משמעות}\\
\midrule
\en{CPI} & מחזורים להוראה\\
\en{AMAT} & זמן גישה ממוצע לזיכרון\\
\en{IPC} & הוראות למחזור\\
\en{TLB} & מטמון תרגום כתובות\\
\en{VQE} & אומדן ערך עצמי וריאציוני\\
\bottomrule
\end{tabular}
\tabcap{קיצורים מרכזיים.}
\end{tablebox}

\noindent סוף הלקט. המסמך נועד לתרגול הצינור בעומס אמיתי:
מאות משוואות־עזר, עשרות קופסאות, טבלאות, קטעי קוד ותרגילים — בלי tofu ובלי היפוכי כיוון.

\end{document}
""")

    text = "\n".join(chunks)
    # Charset hygiene: remove middle dots and other forbidden chars
    text = text.replace("·", "---")  # will fix -- to emdash issues; use ASCII hyphen phrase instead
    text = text.replace("---", " / ")
    text = text.replace("בנצ׳מרק", "benchmark")  # geresh in middle might be ok; avoid weird chars
    # Fix title page line that had cdot in latex - use text
    text = text.replace(
        r"ארכיטקטורה $\cdot$ מערכות $\cdot$ אלגוריתמים $\cdot$ למידה $\cdot$ קוונטים $\cdot$ אבטחה",
        r"ארכיטקטורה / מערכות / אלגוריתמים / למידה / קוונטים / אבטחה",
    )
    # Fix broken flow math in coherency if any
    text = text.replace(r"\out{s}", r"\mid s")  # fix invalid macro in flow chapter

    OUT.write_text(text, encoding="utf-8")
    nch = sum(1 for p, chs in PARTS for _ in chs)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes), topic chapters={nch}, eq_keys={len(eq_keys)}")


if __name__ == "__main__":
    main()
