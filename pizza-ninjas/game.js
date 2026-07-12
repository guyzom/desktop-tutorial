(function () {
  "use strict";

  /* ==========================================================
   * צבי נינג'ה: הרפתקה בביוב
   * Kid-first (age 4+) one-finger side-scrolling adventure.
   * Player fixed near the right, world scrolls right-to-left.
   * ========================================================== */

  // ---------- Assets ----------
  const ASSETS = {
    leo: "assets/leo.png",
    raph: "assets/raph.png",
    don: "assets/don.png",
    mikey: "assets/mikey.png",
    pizza: "assets/pizza.png",
    gold: "assets/pizza-gold.png",
    broccoli: "assets/broccoli.png",
  };

  // ---------- Turtle data ----------
  const TURTLES = [
    {
      id: "leo",
      name: "ליאו",
      mask: "כחול · מנהיג",
      img: ASSETS.leo,
      cheer: "ליאו תופס!",
      superName: "סערת חרבות",
    },
    {
      id: "raph",
      name: "ראף",
      mask: "אדום · חזק",
      img: ASSETS.raph,
      cheer: "ראף בום!",
      superName: "רעש אדמה",
    },
    {
      id: "don",
      name: "דוני",
      mask: "סגול · גאון",
      img: ASSETS.don,
      cheer: "דוני חכם!",
      superName: "מגן חכם",
    },
    {
      id: "mikey",
      name: "מיקי",
      mask: "כתום · כיף",
      img: ASSETS.mikey,
      cheer: "מיקי קואבונגה!",
      superName: "גשם פיצות",
    },
  ];

  // ---------- Stickers ----------
  const STICKERS = [
    { id: "pizza", label: "פיצה", img: ASSETS.pizza },
    { id: "gold", label: "פיצת זהב", img: ASSETS.gold },
    { id: "broccoli", label: "ברוקולי", img: ASSETS.broccoli },
    { id: "leo", label: "ליאו", img: ASSETS.leo },
    { id: "raph", label: "ראף", img: ASSETS.raph },
    { id: "don", label: "דוני", img: ASSETS.don },
    { id: "mikey", label: "מיקי", img: ASSETS.mikey },
    { id: "sewer", label: "ביוב", img: null },
  ];

  // ---------- Stage config ----------
  // World 1: הביוב הישן  (stages 0-3)
  // World 2: מטבח הרשע    (stages 4-7)
  // World 3: גג ניו יורק  (stages 8-11)
  // Each: 3 normal + 1 boss.
  // Entities' `at` is a progress fraction 0..1 for the stage timeline.
  const STAGES = [
    // ------- WORLD 1 -------
    {
      id: 0, world: 1, name: "הביוב הישן",
      lengthMs: 26000,
      enemies: [
        { at: 0.14, lane: 1, type: "scout", hp: 1 },
        { at: 0.22, lane: 0, type: "scout", hp: 1 },
        { at: 0.32, lane: 2, type: "scout", hp: 1 },
        { at: 0.44, lane: 1, type: "scout", hp: 1 },
        { at: 0.56, lane: 0, type: "scout", hp: 1 },
        { at: 0.66, lane: 2, type: "scout", hp: 1 },
        { at: 0.78, lane: 1, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.10, lane: 0 }, { at: 0.18, lane: 2 }, { at: 0.28, lane: 1 },
        { at: 0.40, lane: 2 }, { at: 0.50, lane: 0, gold: true },
        { at: 0.60, lane: 1 }, { at: 0.72, lane: 0 }, { at: 0.84, lane: 2 },
      ],
    },
    {
      id: 1, world: 1, name: "מנהרות הזרם",
      lengthMs: 30000,
      enemies: [
        { at: 0.12, lane: 1, type: "scout", hp: 1 },
        { at: 0.22, lane: 2, type: "ninja", hp: 1 },
        { at: 0.34, lane: 0, type: "scout", hp: 1 },
        { at: 0.44, lane: 1, type: "bomber", hp: 2 },
        { at: 0.54, lane: 2, type: "scout", hp: 1 },
        { at: 0.64, lane: 0, type: "ninja", hp: 1 },
        { at: 0.74, lane: 1, type: "scout", hp: 1 },
        { at: 0.84, lane: 2, type: "bomber", hp: 2 },
      ],
      pickups: [
        { at: 0.08, lane: 2 }, { at: 0.18, lane: 0 }, { at: 0.30, lane: 1 },
        { at: 0.42, lane: 2 }, { at: 0.52, lane: 1, gold: true },
        { at: 0.62, lane: 0 }, { at: 0.72, lane: 2 }, { at: 0.80, lane: 1 },
        { at: 0.90, lane: 0, gold: true },
      ],
    },
    {
      id: 2, world: 1, name: "מפלי הביוב",
      lengthMs: 32000,
      enemies: [
        { at: 0.10, lane: 2, type: "scout", hp: 1 },
        { at: 0.18, lane: 1, type: "ninja", hp: 1 },
        { at: 0.28, lane: 0, type: "bomber", hp: 2 },
        { at: 0.38, lane: 2, type: "scout", hp: 1 },
        { at: 0.46, lane: 1, type: "ninja", hp: 1 },
        { at: 0.56, lane: 0, type: "scout", hp: 1 },
        { at: 0.64, lane: 2, type: "bomber", hp: 2 },
        { at: 0.72, lane: 1, type: "ninja", hp: 1 },
        { at: 0.82, lane: 0, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.06, lane: 0 }, { at: 0.14, lane: 2 }, { at: 0.24, lane: 1 },
        { at: 0.34, lane: 0, gold: true }, { at: 0.44, lane: 2 },
        { at: 0.54, lane: 1 }, { at: 0.66, lane: 0 }, { at: 0.76, lane: 2, gold: true },
        { at: 0.86, lane: 1 }, { at: 0.92, lane: 0 },
      ],
    },
    {
      id: 3, world: 1, name: "ראש הביוב",
      lengthMs: 34000,
      boss: { hp: 5, name: "מפלצת הבוץ" },
      enemies: [
        { at: 0.15, lane: 1, type: "scout", hp: 1 },
        { at: 0.28, lane: 2, type: "ninja", hp: 1 },
        { at: 0.42, lane: 0, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.10, lane: 2 }, { at: 0.22, lane: 1 }, { at: 0.34, lane: 0, gold: true },
        { at: 0.48, lane: 2 }, { at: 0.60, lane: 1 }, { at: 0.72, lane: 0, gold: true },
      ],
    },

    // ------- WORLD 2 -------
    {
      id: 4, world: 2, name: "מטבח פוט",
      lengthMs: 30000,
      enemies: [
        { at: 0.12, lane: 0, type: "bomber", hp: 2 },
        { at: 0.22, lane: 1, type: "scout", hp: 1 },
        { at: 0.32, lane: 2, type: "ninja", hp: 1 },
        { at: 0.42, lane: 0, type: "scout", hp: 1 },
        { at: 0.52, lane: 1, type: "bomber", hp: 2 },
        { at: 0.62, lane: 2, type: "scout", hp: 1 },
        { at: 0.72, lane: 1, type: "ninja", hp: 1 },
        { at: 0.82, lane: 0, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.08, lane: 1 }, { at: 0.18, lane: 2 }, { at: 0.28, lane: 0 },
        { at: 0.40, lane: 1, gold: true }, { at: 0.50, lane: 2 },
        { at: 0.60, lane: 0 }, { at: 0.70, lane: 1 }, { at: 0.80, lane: 2, gold: true },
        { at: 0.90, lane: 0 },
      ],
    },
    {
      id: 5, world: 2, name: "מסעדת הפיצה הרעה",
      lengthMs: 32000,
      enemies: [
        { at: 0.10, lane: 2, type: "scout", hp: 1 },
        { at: 0.18, lane: 1, type: "bomber", hp: 2 },
        { at: 0.26, lane: 0, type: "ninja", hp: 1 },
        { at: 0.36, lane: 2, type: "scout", hp: 1 },
        { at: 0.46, lane: 1, type: "ninja", hp: 1 },
        { at: 0.56, lane: 0, type: "bomber", hp: 2 },
        { at: 0.66, lane: 2, type: "scout", hp: 1 },
        { at: 0.76, lane: 1, type: "ninja", hp: 1 },
        { at: 0.86, lane: 0, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.06, lane: 0 }, { at: 0.16, lane: 2 }, { at: 0.28, lane: 1 },
        { at: 0.40, lane: 0, gold: true }, { at: 0.52, lane: 2 },
        { at: 0.64, lane: 1, gold: true }, { at: 0.74, lane: 0 },
        { at: 0.84, lane: 2 }, { at: 0.92, lane: 1 },
      ],
    },
    {
      id: 6, world: 2, name: "מחסן הברוקולי",
      lengthMs: 34000,
      enemies: [
        { at: 0.10, lane: 1, type: "ninja", hp: 1 },
        { at: 0.18, lane: 0, type: "bomber", hp: 2 },
        { at: 0.26, lane: 2, type: "scout", hp: 1 },
        { at: 0.34, lane: 1, type: "bomber", hp: 2 },
        { at: 0.42, lane: 0, type: "ninja", hp: 1 },
        { at: 0.52, lane: 2, type: "bomber", hp: 2 },
        { at: 0.62, lane: 1, type: "scout", hp: 1 },
        { at: 0.70, lane: 0, type: "ninja", hp: 1 },
        { at: 0.80, lane: 2, type: "bomber", hp: 2 },
      ],
      pickups: [
        { at: 0.06, lane: 2 }, { at: 0.14, lane: 1 }, { at: 0.22, lane: 0 },
        { at: 0.32, lane: 1, gold: true }, { at: 0.44, lane: 0 },
        { at: 0.56, lane: 2 }, { at: 0.66, lane: 1, gold: true },
        { at: 0.76, lane: 0 }, { at: 0.88, lane: 2, gold: true },
      ],
    },
    {
      id: 7, world: 2, name: "השף פוט",
      lengthMs: 36000,
      boss: { hp: 6, name: "השף פוט" },
      enemies: [
        { at: 0.14, lane: 1, type: "ninja", hp: 1 },
        { at: 0.28, lane: 0, type: "bomber", hp: 2 },
        { at: 0.42, lane: 2, type: "ninja", hp: 1 },
        { at: 0.56, lane: 1, type: "scout", hp: 1 },
      ],
      pickups: [
        { at: 0.08, lane: 2 }, { at: 0.20, lane: 1 }, { at: 0.34, lane: 0, gold: true },
        { at: 0.48, lane: 2 }, { at: 0.60, lane: 1 }, { at: 0.74, lane: 0, gold: true },
      ],
    },

    // ------- WORLD 3 -------
    {
      id: 8, world: 3, name: "גגות מנהטן",
      lengthMs: 32000,
      enemies: [
        { at: 0.10, lane: 0, type: "ninja", hp: 1 },
        { at: 0.18, lane: 2, type: "ninja", hp: 1 },
        { at: 0.28, lane: 1, type: "bomber", hp: 2 },
        { at: 0.38, lane: 0, type: "scout", hp: 1 },
        { at: 0.48, lane: 2, type: "ninja", hp: 1 },
        { at: 0.58, lane: 1, type: "bomber", hp: 2 },
        { at: 0.68, lane: 0, type: "ninja", hp: 1 },
        { at: 0.78, lane: 2, type: "scout", hp: 1 },
        { at: 0.86, lane: 1, type: "ninja", hp: 1 },
      ],
      pickups: [
        { at: 0.06, lane: 1 }, { at: 0.14, lane: 0 }, { at: 0.24, lane: 2 },
        { at: 0.34, lane: 1, gold: true }, { at: 0.44, lane: 0 },
        { at: 0.54, lane: 2 }, { at: 0.64, lane: 1 }, { at: 0.74, lane: 0, gold: true },
        { at: 0.86, lane: 2 }, { at: 0.94, lane: 1 },
      ],
    },
    {
      id: 9, world: 3, name: "צינורות הענן",
      lengthMs: 34000,
      enemies: [
        { at: 0.08, lane: 2, type: "bomber", hp: 2 },
        { at: 0.16, lane: 1, type: "ninja", hp: 1 },
        { at: 0.24, lane: 0, type: "ninja", hp: 1 },
        { at: 0.32, lane: 2, type: "bomber", hp: 2 },
        { at: 0.42, lane: 1, type: "scout", hp: 1 },
        { at: 0.52, lane: 0, type: "bomber", hp: 2 },
        { at: 0.62, lane: 2, type: "ninja", hp: 1 },
        { at: 0.72, lane: 1, type: "bomber", hp: 2 },
        { at: 0.82, lane: 0, type: "ninja", hp: 1 },
      ],
      pickups: [
        { at: 0.06, lane: 0 }, { at: 0.14, lane: 2 }, { at: 0.24, lane: 1 },
        { at: 0.34, lane: 0, gold: true }, { at: 0.44, lane: 2 },
        { at: 0.56, lane: 1 }, { at: 0.66, lane: 0 }, { at: 0.76, lane: 2, gold: true },
        { at: 0.88, lane: 1, gold: true },
      ],
    },
    {
      id: 10, world: 3, name: "מגדל הצללים",
      lengthMs: 36000,
      enemies: [
        { at: 0.08, lane: 1, type: "ninja", hp: 1 },
        { at: 0.16, lane: 2, type: "bomber", hp: 2 },
        { at: 0.24, lane: 0, type: "bomber", hp: 2 },
        { at: 0.32, lane: 1, type: "ninja", hp: 1 },
        { at: 0.40, lane: 2, type: "ninja", hp: 1 },
        { at: 0.50, lane: 0, type: "bomber", hp: 2 },
        { at: 0.60, lane: 1, type: "bomber", hp: 2 },
        { at: 0.70, lane: 2, type: "ninja", hp: 1 },
        { at: 0.80, lane: 0, type: "ninja", hp: 1 },
        { at: 0.88, lane: 1, type: "bomber", hp: 2 },
      ],
      pickups: [
        { at: 0.06, lane: 2 }, { at: 0.14, lane: 0 }, { at: 0.24, lane: 1 },
        { at: 0.34, lane: 2 }, { at: 0.44, lane: 0, gold: true },
        { at: 0.54, lane: 1 }, { at: 0.66, lane: 2, gold: true },
        { at: 0.76, lane: 0 }, { at: 0.86, lane: 1, gold: true },
      ],
    },
    {
      id: 11, world: 3, name: "שרדר!",
      lengthMs: 40000,
      boss: { hp: 8, name: "שרדר" },
      enemies: [
        { at: 0.14, lane: 1, type: "ninja", hp: 1 },
        { at: 0.28, lane: 2, type: "bomber", hp: 2 },
        { at: 0.42, lane: 0, type: "ninja", hp: 1 },
        { at: 0.56, lane: 1, type: "bomber", hp: 2 },
      ],
      pickups: [
        { at: 0.10, lane: 2 }, { at: 0.22, lane: 1, gold: true },
        { at: 0.34, lane: 0 }, { at: 0.46, lane: 2, gold: true },
        { at: 0.60, lane: 1 }, { at: 0.74, lane: 0, gold: true },
      ],
    },
  ];

  // ---------- Persistence ----------
  const SAVE_KEY = "tmnt-sewer-save";

  function defaultSave() {
    return {
      unlocked: 0,
      stars: new Array(STAGES.length).fill(0),
      stickers: [],
      turtleId: null,
      attempts: new Array(STAGES.length).fill(0),
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      const base = defaultSave();
      return {
        unlocked: Math.min(Math.max(parsed.unlocked | 0, 0), STAGES.length - 1),
        stars: Array.isArray(parsed.stars) && parsed.stars.length === STAGES.length
          ? parsed.stars.map((n) => Math.max(0, Math.min(3, n | 0)))
          : base.stars,
        stickers: Array.isArray(parsed.stickers) ? parsed.stickers.filter((s) => typeof s === "string") : [],
        turtleId: typeof parsed.turtleId === "string" ? parsed.turtleId : null,
        attempts: Array.isArray(parsed.attempts) && parsed.attempts.length === STAGES.length
          ? parsed.attempts.map((n) => Math.max(0, n | 0))
          : base.attempts,
      };
    } catch (e) {
      return defaultSave();
    }
  }

  function persistSave() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) { /* quota / private mode — silently ignore */ }
  }

  const save = loadSave();

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const dom = {
    screens: {
      start: $("screen-start"),
      pick: $("screen-pick"),
      map: $("screen-map"),
      stickers: $("screen-stickers"),
      game: $("screen-game"),
      pause: $("screen-pause"),
      clear: $("screen-clear"),
      retry: $("screen-retry"),
    },
    turtleGrid: $("turtle-grid"),
    mapBoard: $("map-board"),
    mapTurtleLabel: $("map-turtle-label"),
    stickerGrid: $("sticker-grid"),
    hearts: $("hearts"),
    pizzaCount: $("pizza-count"),
    stageLabel: $("stage-label"),
    bossHp: $("boss-hp"),
    btnPause: $("btn-pause"),
    arena: $("arena"),
    arenaSky: $("arena-sky"),
    world: $("world"),
    fx: $("fx-layer"),
    player: $("player"),
    playerImg: $("player-img"),
    attackFlash: $("attack-flash"),
    stageBanner: $("stage-banner"),
    btnSuper: $("btn-super"),
    superRing: $("super-ring"),
    superLabel: $("super-label"),
    toast: $("toast"),
    pauseStats: $("pause-stats"),
    clearTitle: $("clear-title"),
    starsRow: $("stars-row"),
    clearStats: $("clear-stats"),
    celebration: $("celebration"),
    celeText: $("cele-text"),
  };

  // ---------- Audio (WebAudio beeps) ----------
  let audioCtx = null;
  function audio() {
    if (audioCtx) return audioCtx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function beep(freq, dur, type, gain) {
    const ctx = audio();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.15, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.15));
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + (dur || 0.15) + 0.02);
    } catch (e) { /* ignore */ }
  }
  const sfx = {
    tap:    () => beep(680, 0.08, "square", 0.10),
    coin:   () => { beep(880, 0.08, "triangle", 0.14); setTimeout(() => beep(1320, 0.10, "triangle", 0.14), 60); },
    gold:   () => { beep(1200, 0.10, "triangle", 0.15); setTimeout(() => beep(1600, 0.14, "triangle", 0.14), 80); },
    hit:    () => beep(160, 0.20, "sawtooth", 0.18),
    hurt:   () => { beep(220, 0.18, "square", 0.20); setTimeout(() => beep(120, 0.30, "sawtooth", 0.18), 90); },
    super:  () => { beep(500, 0.10, "sawtooth", 0.16); setTimeout(() => beep(900, 0.10, "sawtooth", 0.16), 100); setTimeout(() => beep(1300, 0.20, "triangle", 0.18), 200); },
    clear:  () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, "triangle", 0.18), i * 110)); },
    win:    () => { [523, 659, 784, 1046, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.22, "triangle", 0.20), i * 130)); },
  };

  // ---------- Utilities ----------
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
  const now   = () => performance.now();

  function toast(msg, ms) {
    dom.toast.textContent = msg;
    dom.toast.hidden = false;
    dom.toast.style.animation = "none";
    // reflow to restart animation
    // eslint-disable-next-line no-unused-expressions
    void dom.toast.offsetWidth;
    dom.toast.style.animation = "";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { dom.toast.hidden = true; }, ms || 1400);
  }

  function celebrate(text, ms) {
    dom.celeText.textContent = text || "קואבונגה!!!";
    dom.celebration.hidden = false;
    clearTimeout(celebrate._t);
    celebrate._t = setTimeout(() => { dom.celebration.hidden = true; }, ms || 1500);
  }

  function showScreen(id) {
    Object.values(dom.screens).forEach((s) => s.classList.remove("active"));
    const el = dom.screens[id];
    if (el) el.classList.add("active");
  }

  // ---------- Turtle picker ----------
  function buildTurtlePicker() {
    dom.turtleGrid.innerHTML = "";
    TURTLES.forEach((t) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "turtle-card";
      card.setAttribute("aria-label", t.name);
      card.innerHTML =
        '<div class="badge"><img src="' + t.img + '" alt="" /></div>' +
        '<div class="name">' + t.name + '</div>' +
        '<div class="weapon">' + t.mask + '</div>' +
        '<div class="weapon">כוח על: ' + t.superName + '</div>';
      card.addEventListener("click", () => {
        sfx.tap();
        save.turtleId = t.id;
        persistSave();
        applyTurtleToPlayer();
        buildMap();
        showScreen("map");
      });
      dom.turtleGrid.appendChild(card);
    });
  }

  function getTurtle() {
    return TURTLES.find((t) => t.id === save.turtleId) || TURTLES[0];
  }

  function applyTurtleToPlayer() {
    const t = getTurtle();
    dom.playerImg.src = t.img;
    dom.player.classList.remove("mask-leo", "mask-raph", "mask-don", "mask-mikey");
    dom.player.classList.add("mask-" + t.id);
    if (dom.mapTurtleLabel) dom.mapTurtleLabel.textContent = "עם " + t.name + " · " + t.superName;
  }

  // ---------- Map ----------
  function buildMap() {
    dom.mapBoard.innerHTML = "";
    // Layout: 12 nodes across a curvy path — coords in % (relative to map-board)
    const nodePositions = [
      { x: 10, y: 78 }, { x: 24, y: 60 }, { x: 38, y: 80 }, { x: 52, y: 58 },
      { x: 15, y: 40 }, { x: 30, y: 24 }, { x: 46, y: 40 }, { x: 62, y: 22 },
      { x: 78, y: 34 }, { x: 88, y: 56 }, { x: 74, y: 74 }, { x: 60, y: 88 },
    ];

    // SVG dashed path connecting nodes
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "map-path");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    let d = "";
    nodePositions.forEach((p, i) => { d += (i === 0 ? "M" : " L") + p.x + " " + p.y; });
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "path-line");
    path.setAttribute("d", d);
    svg.appendChild(path);
    dom.mapBoard.appendChild(svg);

    STAGES.forEach((stg, idx) => {
      const p = nodePositions[idx];
      const node = document.createElement("button");
      node.type = "button";
      node.className = "map-node";
      node.style.left = p.x + "%";
      node.style.top  = p.y + "%";
      const isBoss   = !!stg.boss;
      const isLocked = idx > save.unlocked;
      const isDone   = (save.stars[idx] || 0) > 0;
      const isCurrent = idx === save.unlocked && !isDone;
      if (isBoss)    node.classList.add("boss");
      if (isLocked)  node.classList.add("locked");
      else if (isDone) node.classList.add("done");
      else             node.classList.add("open");
      if (isCurrent) node.classList.add("current");

      const worldLabel = stg.world + "-" + (((idx % 4) + 1));
      node.innerHTML =
        '<span class="node-num">' + worldLabel + '</span>' +
        '<span class="node-label">' + stg.name + '</span>';

      node.addEventListener("click", () => {
        if (isLocked) {
          sfx.hit();
          toast("עוד לא נפתח — נצחו את השלב הקודם");
          return;
        }
        sfx.tap();
        startStage(idx);
      });
      dom.mapBoard.appendChild(node);
    });
  }

  // ---------- Stickers ----------
  function buildStickers() {
    dom.stickerGrid.innerHTML = "";
    STICKERS.forEach((s) => {
      const cell = document.createElement("div");
      cell.className = "sticker-cell";
      const earned = save.stickers.indexOf(s.id) !== -1;
      if (earned) {
        cell.classList.add("earned");
        if (s.img) {
          const img = document.createElement("img");
          img.src = s.img; img.alt = s.label;
          cell.appendChild(img);
        } else {
          const span = document.createElement("span");
          span.style.fontSize = "36px";
          span.textContent = "🐢";
          cell.appendChild(span);
        }
        const cap = document.createElement("div");
        cap.style.cssText = "position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:11px;color:#4d2f00;text-shadow:0 1px 0 rgba(255,255,255,.5);font-weight:700;";
        cap.textContent = s.label;
        cell.appendChild(cap);
      } else {
        const lock = document.createElement("span");
        lock.className = "locked-mark";
        lock.textContent = "🔒";
        cell.appendChild(lock);
      }
      dom.stickerGrid.appendChild(cell);
    });
  }

  function maybeAwardStickers() {
    // Every 3 stages cleared → 1 sticker.
    const cleared = save.stars.filter((n) => n > 0).length;
    const target = Math.min(STICKERS.length, Math.floor(cleared / 3));
    const owned = save.stickers.length;
    if (target > owned) {
      const toAward = STICKERS.slice(owned, target);
      toAward.forEach((s) => { if (save.stickers.indexOf(s.id) === -1) save.stickers.push(s.id); });
      persistSave();
      const label = toAward[toAward.length - 1].label;
      toast("מדבקה חדשה: " + label + "!", 1800);
    }
  }

  // ==========================================================
  // GAME ENGINE
  // ==========================================================

  // Runtime state
  const game = {
    stageIndex: 0,
    stage: null,
    playing: false,
    paused: false,
    startedAt: 0,
    elapsed: 0,        // ms since stage start (excluding pause)
    progress: 0,       // 0..1 within stage timeline (excludes boss phase)
    hearts: 3,
    pizzas: 0,
    superCharge: 0,    // 0..8
    superReady: false,
    shieldUntil: 0,
    invulnUntil: 0,
    lane: 1,           // 0/1/2 (top/middle/bottom)
    playerY: 0.5,      // fractional 0..1 of arena height, smoothed
    playerX: 0.72,     // fractional 0..1 (fixed near right)
    dragging: false,
    entities: [],      // { el, type: 'enemy'|'pickup'|'boss', kind, hp, lane, at, x, y, ... }
    boss: null,
    bossHp: 0,
    bossMaxHp: 0,
    bossPhase: false,
    lastTs: 0,
    scrollSpeed: 0.12, // fraction of screen per second at 1.0 speed
    arenaRect: null,
  };

  // Lane centers (fraction of arena height from top)
  const LANE_Y = [0.30, 0.50, 0.72];
  const SUPER_TARGET = 8;

  function refreshArenaRect() {
    game.arenaRect = dom.arena.getBoundingClientRect();
  }

  function updateHeartsUI() {
    dom.hearts.textContent = "❤".repeat(Math.max(0, game.hearts)) + "🖤".repeat(Math.max(0, 3 - game.hearts));
    dom.hearts.classList.remove("hurt");
    // trigger reflow to restart shake if needed
    // eslint-disable-next-line no-unused-expressions
    void dom.hearts.offsetWidth;
  }

  function updateSuperUI() {
    const pct = Math.min(100, Math.round((game.superCharge / SUPER_TARGET) * 100));
    dom.superRing.style.setProperty("--super", pct);
    if (game.superReady) {
      dom.btnSuper.classList.add("ready");
      dom.btnSuper.disabled = false;
      dom.superLabel.textContent = getTurtle().superName;
    } else {
      dom.btnSuper.classList.remove("ready");
      dom.btnSuper.disabled = true;
      dom.superLabel.textContent = "כוח על";
    }
  }

  function updateBossHpUI() {
    if (!game.boss) {
      dom.bossHp.hidden = true;
      return;
    }
    dom.bossHp.hidden = false;
    const pct = Math.max(0, Math.round((game.bossHp / game.bossMaxHp) * 100));
    dom.bossHp.style.setProperty("--hp", pct + "%");
    dom.bossHp.textContent = "בוס " + "❤".repeat(Math.max(0, Math.min(6, game.bossHp)));
  }

  function updatePizzaUI() {
    dom.pizzaCount.textContent = String(game.pizzas);
  }

  function updateStageLabel() {
    const stg = game.stage;
    const perWorld = (game.stageIndex % 4) + 1;
    dom.stageLabel.textContent = stg.world + "-" + perWorld;
  }

  function showStageBanner(text) {
    dom.stageBanner.textContent = text;
    dom.stageBanner.hidden = false;
    dom.stageBanner.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    void dom.stageBanner.offsetWidth;
    dom.stageBanner.style.animation = "";
    clearTimeout(showStageBanner._t);
    showStageBanner._t = setTimeout(() => { dom.stageBanner.hidden = true; }, 1600);
  }

  // ---------- Entity helpers ----------
  function createEntityEl(cls, imgSrc) {
    const el = document.createElement("div");
    el.className = "entity " + cls;
    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = "";
    el.appendChild(img);
    return el;
  }

  function spawnEnemy(def) {
    const kind = def.type;
    const el = createEntityEl("enemy " + kind, ASSETS.broccoli);
    dom.world.appendChild(el);
    const ent = {
      el, type: "enemy", kind,
      hp: def.hp || 1, maxHp: def.hp || 1,
      lane: def.lane, at: def.at,
      x: 1.15,                              // start off right
      y: LANE_Y[def.lane],
      baseY: LANE_Y[def.lane],
      phase: Math.random() * Math.PI * 2,
      alive: true,
    };
    game.entities.push(ent);
    return ent;
  }

  function spawnPickup(def) {
    const isGold = !!def.gold;
    const el = createEntityEl("pickup" + (isGold ? " gold" : ""), isGold ? ASSETS.gold : ASSETS.pizza);
    dom.world.appendChild(el);
    const ent = {
      el, type: "pickup", gold: isGold,
      lane: def.lane, at: def.at,
      x: 1.15, y: LANE_Y[def.lane],
      baseY: LANE_Y[def.lane],
      alive: true,
    };
    game.entities.push(ent);
    return ent;
  }

  function spawnBoss(cfg) {
    const el = createEntityEl("boss", ASSETS.broccoli);
    dom.world.appendChild(el);
    const ent = {
      el, type: "boss",
      hp: cfg.hp, maxHp: cfg.hp,
      lane: 1, at: 0.99,
      x: 0.22, y: LANE_Y[1],
      targetLane: 1,
      lastLaneShift: now(),
      lastAttack: now(),
      alive: true,
      angry: false,
    };
    game.entities.push(ent);
    game.boss = ent;
    return ent;
  }

  function removeEntity(ent, withPoof) {
    ent.alive = false;
    if (withPoof) poofAt(ent.x, ent.y);
    if (ent.el && ent.el.parentNode) {
      ent.el.classList.add("leaving");
      const el = ent.el;
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 360);
    }
  }

  // ---------- FX ----------
  function fxAt(x, y, cls) {
    const rect = game.arenaRect || dom.arena.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = cls;
    el.style.left = (x * rect.width) + "px";
    el.style.top  = (y * rect.height) + "px";
    dom.fx.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }
  function poofAt(x, y) { fxAt(x, y, "poof"); }
  function shockwaveAt(x, y) { fxAt(x, y, "shockwave"); }
  function starPop(x, y) {
    const rect = game.arenaRect || dom.arena.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "star-pop";
    el.textContent = "★";
    el.style.left = (x * rect.width) + "px";
    el.style.top  = (y * rect.height) + "px";
    dom.fx.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }

  function attackFlash() {
    dom.player.classList.remove("attack");
    // eslint-disable-next-line no-unused-expressions
    void dom.player.offsetWidth;
    dom.player.classList.add("attack");
    dom.attackFlash.hidden = false;
    dom.attackFlash.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    void dom.attackFlash.offsetWidth;
    dom.attackFlash.style.animation = "";
    clearTimeout(attackFlash._t);
    attackFlash._t = setTimeout(() => { dom.attackFlash.hidden = true; dom.player.classList.remove("attack"); }, 320);
  }

  function shakeArena(ms) {
    dom.arena.classList.add("shake");
    dom.arena.style.animation = "hurt-shake .35s ease-in-out";
    // eslint-disable-next-line no-unused-expressions
    void dom.arena.offsetWidth;
    setTimeout(() => { dom.arena.classList.remove("shake"); dom.arena.style.animation = ""; }, ms || 400);
  }

  // ---------- Start Stage ----------
  function startStage(idx) {
    const stg = STAGES[idx];
    if (!stg) return;
    game.stageIndex = idx;
    game.stage = stg;
    game.playing = true;
    game.paused = false;
    game.startedAt = now();
    game.elapsed = 0;
    game.progress = 0;
    game.hearts = 3;
    game.pizzas = 0;
    game.superCharge = 0;
    game.superReady = false;
    game.shieldUntil = 0;
    game.invulnUntil = 0;
    game.lane = 1;
    game.playerY = LANE_Y[1];
    game.dragging = false;
    game.entities.forEach((e) => { if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); });
    game.entities = [];
    game.boss = null;
    game.bossPhase = false;
    game.lastTs = now();
    stg._spawned = false;
    stg._bossSpawned = false;

    save.attempts[idx] = (save.attempts[idx] || 0) + 1;
    persistSave();

    // World background
    dom.arenaSky.classList.remove("world-2", "world-3");
    if (stg.world === 2) dom.arenaSky.classList.add("world-2");
    else if (stg.world === 3) dom.arenaSky.classList.add("world-3");

    // Reset player position visually
    dom.player.classList.remove("hit", "attack", "shield");
    dom.player.style.left = (game.playerX * 100) + "%";
    dom.player.style.top  = (game.playerY * 100) + "%";

    applyTurtleToPlayer();
    updateHeartsUI();
    updatePizzaUI();
    updateSuperUI();
    updateStageLabel();

    // Boss stage HUD
    if (stg.boss) {
      game.bossPhase = false;
      game.bossHp = stg.boss.hp;
      // Forgiveness: after 3+ attempts, start boss at 50% HP
      if (save.attempts[idx] >= 3) game.bossHp = Math.ceil(stg.boss.hp / 2);
      game.bossMaxHp = game.bossHp;
      dom.bossHp.hidden = false;
    } else {
      game.bossHp = 0;
      game.bossMaxHp = 0;
      dom.bossHp.hidden = true;
    }
    updateBossHpUI();

    showScreen("game");
    refreshArenaRect();
    showStageBanner(stg.world + "-" + ((idx % 4) + 1) + "  " + stg.name);
    sfx.tap();

    // start loop
    requestAnimationFrame(gameLoop);
  }

  // ---------- Main loop ----------
  function gameLoop(ts) {
    if (!game.playing) return;
    if (game.paused) { game.lastTs = ts; requestAnimationFrame(gameLoop); return; }
    const dt = Math.min(50, ts - game.lastTs); // ms, capped
    game.lastTs = ts;
    game.elapsed += dt;

    updateWorld(dt);
    updatePlayer(dt);
    updateEntities(dt);
    checkCollisions();
    checkStageEnd();

    requestAnimationFrame(gameLoop);
  }

  function updateWorld(dt) {
    const stg = game.stage;
    if (!stg) return;
    if (stg.boss && game.bossPhase) {
      // progress freezes during boss phase
    } else {
      // progress advances with elapsed / lengthMs, capped at ~0.98 on boss stages until boss arrives
      const target = game.elapsed / stg.lengthMs;
      game.progress = Math.min(1, target);
    }

    // Spawn entities whose `at` is within a lookahead window and not yet spawned.
    // Instead of tracking spawned separately, we lazily spawn from stage definition once.
    if (!stg._spawned) {
      stg._spawned = true;
      stg.enemies.forEach((def) => spawnEnemy(def));
      stg.pickups.forEach((def) => spawnPickup(def));
      if (stg.boss) {
        // boss actually spawns when we reach bossPhase
        stg._bossSpawned = false;
      }
    }
  }

  function updatePlayer(dt) {
    const targetY = LANE_Y[game.lane];
    const t = 1 - Math.pow(0.001, dt / 1000); // exponential smoothing
    game.playerY = game.playerY + (targetY - game.playerY) * t;

    dom.player.style.top  = (game.playerY * 100) + "%";
    dom.player.style.left = (game.playerX * 100) + "%";

    // Shield visuals
    if (now() < game.shieldUntil) dom.player.classList.add("shield");
    else dom.player.classList.remove("shield");
  }

  function updateEntities(dt) {
    const stg = game.stage;
    const speed = game.scrollSpeed; // fraction of screen per second at normal pace
    const dx = -(speed * (dt / 1000));

    for (let i = 0; i < game.entities.length; i++) {
      const ent = game.entities[i];
      if (!ent.alive) continue;

      if (ent.type === "boss") {
        // Boss AI: hovers on left, periodically dashes toward player, retreats.
        const nowT = now();
        if (nowT - ent.lastLaneShift > 1800) {
          ent.targetLane = (ent.lane + (Math.random() < 0.5 ? -1 : 1) + 3) % 3;
          if (ent.targetLane === ent.lane) ent.targetLane = (ent.lane + 1) % 3;
          ent.lane = ent.targetLane;
          ent.lastLaneShift = nowT;
        }
        const targetY = LANE_Y[ent.targetLane];
        const kt = 1 - Math.pow(0.001, dt / 1000);
        ent.y = ent.y + (targetY - ent.y) * kt;

        // Lunge cycle: chase player for ~1.4s, retreat for ~1.6s
        if (!ent.mode) { ent.mode = "chase"; ent.modeStart = nowT; }
        const modeAge = nowT - ent.modeStart;
        if (ent.mode === "chase") {
          const chaseX = 0.58; // reach range that can contact player at 0.72
          const kx = 1 - Math.pow(0.002, dt / 1000);
          ent.x = ent.x + (chaseX - ent.x) * kx;
          if (modeAge > 1400) { ent.mode = "retreat"; ent.modeStart = nowT; ent.el.classList.remove("angry"); }
        } else {
          const restX = 0.18;
          const kx = 1 - Math.pow(0.02, dt / 1000);
          ent.x = ent.x + (restX - ent.x) * kx;
          if (modeAge > 1600) { ent.mode = "chase"; ent.modeStart = nowT; ent.el.classList.add("angry"); }
        }
      } else {
        ent.x += dx;
        if (ent.type === "enemy" && ent.kind === "ninja") {
          ent.phase += dt / 400;
          ent.y = ent.baseY + Math.sin(ent.phase) * 0.06;
        }
      }

      // Position DOM
      const rect = game.arenaRect || dom.arena.getBoundingClientRect();
      ent.el.style.left = (ent.x * 100) + "%";
      ent.el.style.top  = (ent.y * 100) + "%";

      // Off-screen left → remove
      if (ent.x < -0.15) {
        removeEntity(ent, false);
      }
    }

    // Cleanup dead
    for (let i = game.entities.length - 1; i >= 0; i--) {
      if (!game.entities[i].alive) game.entities.splice(i, 1);
    }
  }

  function checkCollisions() {
    // Player collision box in fractional space
    const px = game.playerX;
    const py = game.playerY;
    // generous magnet for pickups; smaller for enemy contact combat
    const enemyR = 0.10;
    const pickupR = 0.13;
    const shielded = now() < game.shieldUntil;

    for (let i = 0; i < game.entities.length; i++) {
      const ent = game.entities[i];
      if (!ent.alive) continue;
      const dx = ent.x - px;
      const dy = ent.y - py;
      const dist = Math.hypot(dx, dy);

      if (ent.type === "pickup") {
        if (dist < pickupR) {
          collectPickup(ent);
        }
      } else if (ent.type === "enemy") {
        if (dist < enemyR) {
          if (shielded) {
            // enemies die on contact w/ shield
            damageEnemy(ent, ent.hp);
            continue;
          }
          // player walks into enemy — attack
          attackEnemy(ent);
        }
      } else if (ent.type === "boss") {
        if (dist < 0.18 && now() - (ent.lastAttack || 0) > 550) {
          ent.lastAttack = now();
          if (shielded) {
            damageBoss(1);
          } else {
            damageBoss(1);
            // Boss retaliates ~30% of the time; otherwise just a bounce w/ short invuln
            if (Math.random() < 0.30) {
              takeDamage(1);
            } else {
              game.invulnUntil = now() + 700;
            }
          }
        }
      }
    }
  }

  function collectPickup(ent) {
    if (!ent.alive) return;
    const doubled = now() < game.shieldUntil; // don's shield doubles pizza
    const val = ent.gold ? 3 : 1;
    const total = val * (doubled ? 2 : 1);
    game.pizzas += total;
    game.superCharge = Math.min(SUPER_TARGET, game.superCharge + (ent.gold ? 2 : 1));
    if (game.superCharge >= SUPER_TARGET && !game.superReady) {
      game.superReady = true;
      toast("כוח על מוכן!");
    }
    updatePizzaUI();
    updateSuperUI();
    starPop(ent.x, ent.y);
    if (ent.gold) sfx.gold(); else sfx.coin();
    removeEntity(ent, true);
  }

  function attackEnemy(ent) {
    if (!ent.alive) return;
    attackFlash();
    damageEnemy(ent, 1);
  }

  function damageEnemy(ent, amount) {
    if (!ent.alive) return;
    ent.hp -= amount;
    if (ent.hp <= 0) {
      shockwaveAt(ent.x, ent.y);
      poofAt(ent.x, ent.y);
      sfx.hit();
      // Chance to drop pizza
      if (Math.random() < 0.35) {
        spawnPickup({ at: 0, lane: ent.lane, gold: Math.random() < 0.15 });
        const dropped = game.entities[game.entities.length - 1];
        dropped.x = ent.x;
        dropped.y = ent.y;
      }
      // Small super charge on kill
      game.superCharge = Math.min(SUPER_TARGET, game.superCharge + 1);
      if (game.superCharge >= SUPER_TARGET && !game.superReady) {
        game.superReady = true;
        toast("כוח על מוכן!");
      }
      updateSuperUI();
      removeEntity(ent, false);
    } else {
      ent.el.classList.add("hit");
      setTimeout(() => { if (ent.el) ent.el.classList.remove("hit"); }, 220);
      bounceEnemy(ent);
      sfx.hit();
    }
  }

  function bounceEnemy(ent) {
    // Nudge enemy back to give kid breathing room
    ent.x += 0.09;
  }

  function damageBoss(amount) {
    if (!game.boss || !game.boss.alive) return;
    game.bossHp -= amount;
    game.boss.el.classList.add("angry");
    attackFlash();
    // Force boss into retreat so kid gets breathing room after landing a hit.
    if (game.boss.mode !== "retreat") {
      game.boss.mode = "retreat";
      game.boss.modeStart = now();
    }
    shockwaveAt(game.boss.x, game.boss.y);
    sfx.hit();
    updateBossHpUI();
    if (game.bossHp <= 0) {
      poofAt(game.boss.x, game.boss.y);
      poofAt(game.boss.x + 0.05, game.boss.y - 0.05);
      poofAt(game.boss.x - 0.05, game.boss.y + 0.05);
      removeEntity(game.boss, true);
      game.boss = null;
      game.progress = 1;
    }
  }

  function takeDamage(amount) {
    if (now() < game.invulnUntil) return;
    if (now() < game.shieldUntil) return;
    game.hearts -= amount;
    updateHeartsUI();
    dom.hearts.classList.add("hurt");
    dom.player.classList.add("hit");
    setTimeout(() => dom.player.classList.remove("hit"), 500);
    game.invulnUntil = now() + 1100;
    sfx.hurt();
    // bounce back — brief lane wiggle
    if (game.hearts <= 0) {
      failStage();
    }
  }

  // ---------- Stage end handling ----------
  function checkStageEnd() {
    const stg = game.stage;
    if (!stg) return;

    // Boss trigger: when non-boss progress reaches ~0.85, enter boss phase
    if (stg.boss && !game.bossPhase && game.progress >= 0.82) {
      game.bossPhase = true;
      game.progress = 0.9; // freeze
      // Spawn the boss
      spawnBoss(stg.boss);
      showStageBanner(stg.boss.name + "!");
      updateBossHpUI();
      // pizzas/enemies still on screen scroll off naturally
    }

    // Clear conditions
    if (stg.boss) {
      if (game.bossPhase && game.boss === null) stageCleared();
    } else if (game.progress >= 1) {
      // give a beat for last entities to pass, then clear
      stageCleared();
    }
  }

  function stageCleared() {
    if (!game.playing) return;
    game.playing = false;

    const idx = game.stageIndex;
    const stars = Math.max(1, Math.min(3, game.hearts));
    if (stars > (save.stars[idx] || 0)) save.stars[idx] = stars;
    if (idx + 1 < STAGES.length && save.unlocked < idx + 1) save.unlocked = idx + 1;
    persistSave();
    maybeAwardStickers();

    dom.starsRow.textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    dom.clearTitle.textContent = getTurtle().cheer;
    dom.clearStats.textContent = "פיצות שנאספו: " + game.pizzas;
    sfx.clear();

    // Big celebration if this was the final boss
    if (idx === STAGES.length - 1) {
      celebrate("הצלנו את העיר!", 2200);
      sfx.win();
    } else if (stg_is_boss(idx)) {
      celebrate("ניצחנו את הבוס!");
    } else {
      celebrate("כל הכבוד!");
    }

    setTimeout(() => showScreen("clear"), 900);
  }

  function stg_is_boss(idx) {
    return !!STAGES[idx].boss;
  }

  function failStage() {
    if (!game.playing) return;
    game.playing = false;
    // Friendly retry screen (never "game over")
    setTimeout(() => showScreen("retry"), 500);
  }

  // ---------- Super ----------
  function activateSuper() {
    if (!game.superReady) return;
    const t = getTurtle();
    game.superReady = false;
    game.superCharge = 0;
    updateSuperUI();
    sfx.super();
    celebrate(t.superName + "!", 1000);

    if (t.id === "leo") {
      // Clear all on-screen enemies (visible only: x between 0..1)
      game.entities.forEach((e) => {
        if (e.type === "enemy" && e.x > -0.1 && e.x < 1.15) {
          shockwaveAt(e.x, e.y);
          removeEntity(e, true);
        }
      });
      if (game.boss) damageBoss(2);
    } else if (t.id === "raph") {
      // Clear all + screen shake
      game.entities.forEach((e) => {
        if (e.type === "enemy" && e.x > -0.1 && e.x < 1.15) {
          shockwaveAt(e.x, e.y);
          removeEntity(e, true);
        }
      });
      if (game.boss) damageBoss(3);
      shakeArena(600);
    } else if (t.id === "don") {
      // 5s shield
      game.shieldUntil = now() + 5000;
      dom.player.classList.add("shield");
      setTimeout(() => dom.player.classList.remove("shield"), 5000);
    } else if (t.id === "mikey") {
      // Spawn 8 collectible pizzas near player
      for (let i = 0; i < 8; i++) {
        const lane = i % 3;
        const ent = spawnPickup({ at: 0, lane: lane, gold: i % 4 === 0 });
        ent.x = clamp(game.playerX + rand(-0.20, 0.20), 0.10, 0.95);
        ent.y = clamp(LANE_Y[lane] + rand(-0.03, 0.03), 0.15, 0.85);
      }
    }
  }

  // ---------- Input: one-finger drag ----------
  function laneFromY(clientY) {
    const rect = game.arenaRect || dom.arena.getBoundingClientRect();
    const rel = (clientY - rect.top) / rect.height;
    // find nearest lane center
    let best = 0, bestD = 1e9;
    for (let i = 0; i < LANE_Y.length; i++) {
      const d = Math.abs(rel - LANE_Y[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function onArenaDown(ev) {
    if (!game.playing || game.paused) return;
    game.dragging = true;
    const t = (ev.touches && ev.touches[0]) || ev;
    if (t && typeof t.clientY === "number") {
      game.lane = laneFromY(t.clientY);
    }
  }
  function onArenaMove(ev) {
    if (!game.playing || game.paused) return;
    if (!game.dragging) return;
    const t = (ev.touches && ev.touches[0]) || ev;
    if (t && typeof t.clientY === "number") {
      game.lane = laneFromY(t.clientY);
    }
    ev.preventDefault && ev.preventDefault();
  }
  function onArenaUp() { game.dragging = false; }

  // ---------- Pause / resume / exit ----------
  function pauseGame() {
    if (!game.playing) return;
    game.paused = true;
    dom.pauseStats.textContent = "שלב " + game.stage.world + "-" + ((game.stageIndex % 4) + 1) + " · פיצות: " + game.pizzas;
    showScreen("pause");
  }
  function resumeGame() {
    if (!game.playing) return;
    game.paused = false;
    game.lastTs = now();
    showScreen("game");
    requestAnimationFrame(gameLoop);
  }
  function exitToMap() {
    game.playing = false;
    game.paused = false;
    // Clear entities
    game.entities.forEach((e) => { if (e.el && e.el.parentNode) e.el.parentNode.removeChild(e.el); });
    game.entities = [];
    game.boss = null;
    if (game.stage) game.stage._spawned = false;
    buildMap();
    showScreen("map");
  }

  function retryStage() {
    if (game.stage) game.stage._spawned = false;
    startStage(game.stageIndex);
  }

  function continueFromClear() {
    if (game.stage) game.stage._spawned = false;
    const nextIdx = game.stageIndex + 1;
    if (nextIdx < STAGES.length && save.unlocked >= nextIdx) {
      buildMap();
      showScreen("map");
    } else {
      buildMap();
      showScreen("map");
    }
  }

  // ==========================================================
  // Wire up UI
  // ==========================================================
  function bind() {
    $("btn-start").addEventListener("click", () => {
      sfx.tap();
      audio(); // unlock audio on user gesture
      buildTurtlePicker();
      showScreen("pick");
    });
    $("btn-back-start").addEventListener("click", () => { sfx.tap(); showScreen("start"); });
    $("btn-stickers").addEventListener("click", () => { sfx.tap(); buildStickers(); showScreen("stickers"); });
    $("btn-stickers-back").addEventListener("click", () => { sfx.tap(); showScreen("map"); });
    $("btn-map-repick").addEventListener("click", () => { sfx.tap(); buildTurtlePicker(); showScreen("pick"); });
    $("btn-pause").addEventListener("click", () => { sfx.tap(); pauseGame(); });
    $("btn-resume").addEventListener("click", () => { sfx.tap(); resumeGame(); });
    $("btn-exit-map").addEventListener("click", () => { sfx.tap(); exitToMap(); });
    $("btn-clear-continue").addEventListener("click", () => { sfx.tap(); continueFromClear(); });
    $("btn-retry").addEventListener("click", () => { sfx.tap(); retryStage(); });
    $("btn-retry-map").addEventListener("click", () => { sfx.tap(); exitToMap(); });

    dom.btnSuper.addEventListener("click", () => {
      if (game.superReady) { sfx.tap(); activateSuper(); }
    });

    // Arena drag input — support both touch and mouse
    const arena = dom.arena;
    arena.addEventListener("touchstart", onArenaDown, { passive: true });
    arena.addEventListener("touchmove",  onArenaMove, { passive: false });
    arena.addEventListener("touchend",   onArenaUp);
    arena.addEventListener("touchcancel", onArenaUp);
    arena.addEventListener("mousedown",  onArenaDown);
    arena.addEventListener("mousemove",  onArenaMove);
    arena.addEventListener("mouseup",    onArenaUp);
    arena.addEventListener("mouseleave", onArenaUp);

    window.addEventListener("resize", refreshArenaRect);
    window.addEventListener("orientationchange", refreshArenaRect);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && game.playing && !game.paused) pauseGame();
    });
  }

  // ==========================================================
  // Boot
  // ==========================================================
  function boot() {
    bind();
    applyTurtleToPlayer();
    if (save.turtleId) buildMap();
    else buildTurtlePicker();
    showScreen("start");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
