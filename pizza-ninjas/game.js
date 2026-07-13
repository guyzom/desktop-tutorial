/* game.js — צבי נינג'ה: הרפתקת פיצה
 * Owns index.html + style.css + game.js. Consumes window.GameArt + window.GameAudio.
 * Endless-runner adventure tuned for age ~4: no real failure, lots of juice.
 */
(() => {
  "use strict";

  // ---------------------------------------------------------------- constants
  const LANE_XS = [-2.2, 0, 2.2];
  const SUPER_COST = 10;      // pizzas to charge Super
  const SAVE_KEY = "tmnt-pizza-save-v2";
  const SPAWN_AHEAD = 60;     // units ahead a spawn appears
  const PLAYER_Z = 0;

  const TURTLES = [
    { id: "leo",   name: "ליאו",  letter: "L", color: 0x1e6bff, superName: "סופת חרבות",  emoji: "💙" },
    { id: "raph",  name: "ראף",   letter: "R", color: 0xe53935, superName: "אגרוף רעם",   emoji: "❤️" },
    { id: "don",   name: "דוני",  letter: "D", color: 0x9b4dca, superName: "מגן פיצה",    emoji: "💜" },
    { id: "mikey", name: "מיקי",  letter: "M", color: 0xff8a1a, superName: "גשם פיצות",   emoji: "🧡" },
  ];
  const turtleById = (id) => TURTLES.find((t) => t.id === id) || TURTLES[0];

  const STICKERS = [
    { id: "leo",   label: "💙" }, { id: "raph", label: "❤️" }, { id: "don", label: "💜" }, { id: "mikey", label: "🧡" },
    { id: "pizza", label: "🍕" }, { id: "gold", label: "🌟" }, { id: "boss", label: "🥦" }, { id: "star",  label: "⭐" },
    { id: "world1",label: "🐢" }, { id: "world2",label: "🍕" }, { id: "world3",label: "🌃" }, { id: "hero",  label: "🏆" },
  ];

  // Stage schedule. `at` is a fraction 0..1 of course length.
  function S(world, name, seconds, enemies, pickups, boss) {
    return { world, name, seconds, enemies, pickups, boss: boss || null };
  }
  const STAGES = [
    // ---- World 1 : sewer ----
    S(1, "הביוב", 24, [
      { at: 0.20, lane: 1, type: "scout" }, { at: 0.34, lane: 0, type: "scout" },
      { at: 0.50, lane: 2, type: "scout" }, { at: 0.66, lane: 1, type: "scout" },
      { at: 0.80, lane: 0, type: "scout" },
    ], [
      { at: 0.12, lane: 0 }, { at: 0.22, lane: 2 }, { at: 0.30, lane: 1 }, { at: 0.42, lane: 2, gold: true },
      { at: 0.56, lane: 0 }, { at: 0.62, lane: 1 }, { at: 0.74, lane: 2 }, { at: 0.88, lane: 1, gold: true },
    ]),
    S(1, "הצינורות", 26, [
      { at: 0.18, lane: 1, type: "scout" }, { at: 0.32, lane: 2, type: "ninja" },
      { at: 0.46, lane: 0, type: "scout" }, { at: 0.60, lane: 1, type: "bomber" },
      { at: 0.74, lane: 2, type: "scout" }, { at: 0.86, lane: 0, type: "ninja" },
    ], [
      { at: 0.10, lane: 2 }, { at: 0.24, lane: 0 }, { at: 0.38, lane: 1, gold: true },
      { at: 0.52, lane: 2 }, { at: 0.66, lane: 0 }, { at: 0.80, lane: 1 }, { at: 0.90, lane: 2, gold: true },
    ]),
    S(1, "בוס ברוקולי", 30, [
      { at: 0.22, lane: 0, type: "scout" }, { at: 0.40, lane: 2, type: "scout" },
      { at: 0.58, lane: 1, type: "ninja" },
    ], [
      { at: 0.14, lane: 1 }, { at: 0.30, lane: 2, gold: true }, { at: 0.46, lane: 0 }, { at: 0.64, lane: 1 },
    ], { hp: 4, name: "ברוקולי ענק" }),

    // ---- World 2 : pizzeria kitchen ----
    S(2, "המטבח", 26, [
      { at: 0.16, lane: 1, type: "scout" }, { at: 0.30, lane: 0, type: "bomber" },
      { at: 0.44, lane: 2, type: "ninja" }, { at: 0.58, lane: 1, type: "scout" },
      { at: 0.72, lane: 0, type: "scout" }, { at: 0.86, lane: 2, type: "bomber" },
    ], [
      { at: 0.10, lane: 2 }, { at: 0.24, lane: 0, gold: true }, { at: 0.40, lane: 1 }, { at: 0.54, lane: 2 },
      { at: 0.68, lane: 0 }, { at: 0.82, lane: 1, gold: true },
    ]),
    S(2, "הסירים", 28, [
      { at: 0.18, lane: 2, type: "ninja" }, { at: 0.32, lane: 1, type: "bomber" },
      { at: 0.46, lane: 0, type: "scout" }, { at: 0.60, lane: 2, type: "ninja" },
      { at: 0.74, lane: 1, type: "scout" }, { at: 0.88, lane: 0, type: "bomber" },
    ], [
      { at: 0.12, lane: 1 }, { at: 0.28, lane: 0 }, { at: 0.44, lane: 2, gold: true }, { at: 0.62, lane: 1 },
      { at: 0.78, lane: 0, gold: true }, { at: 0.90, lane: 2 },
    ]),
    S(2, "שף ברוקולי", 32, [
      { at: 0.20, lane: 0, type: "bomber" }, { at: 0.38, lane: 2, type: "ninja" },
      { at: 0.56, lane: 1, type: "scout" },
    ], [
      { at: 0.14, lane: 1, gold: true }, { at: 0.34, lane: 2 }, { at: 0.52, lane: 0, gold: true }, { at: 0.68, lane: 1 },
    ], { hp: 5, name: "שף ברוקולי" }),

    // ---- World 3 : rooftops night ----
    S(3, "הגגות", 28, [
      { at: 0.16, lane: 1, type: "ninja" }, { at: 0.30, lane: 0, type: "ninja" },
      { at: 0.44, lane: 2, type: "bomber" }, { at: 0.58, lane: 1, type: "scout" },
      { at: 0.72, lane: 0, type: "ninja" }, { at: 0.86, lane: 2, type: "bomber" },
    ], [
      { at: 0.10, lane: 2 }, { at: 0.26, lane: 0, gold: true }, { at: 0.42, lane: 1 }, { at: 0.58, lane: 2 },
      { at: 0.74, lane: 0 }, { at: 0.88, lane: 1, gold: true },
    ]),
    S(3, "לילה בעיר", 30, [
      { at: 0.18, lane: 2, type: "bomber" }, { at: 0.32, lane: 1, type: "ninja" },
      { at: 0.46, lane: 0, type: "ninja" }, { at: 0.60, lane: 2, type: "bomber" },
      { at: 0.74, lane: 1, type: "ninja" }, { at: 0.88, lane: 0, type: "bomber" },
    ], [
      { at: 0.12, lane: 1 }, { at: 0.28, lane: 0, gold: true }, { at: 0.46, lane: 2 }, { at: 0.64, lane: 1 },
      { at: 0.80, lane: 0, gold: true },
    ]),
    S(3, "בוס על", 34, [
      { at: 0.18, lane: 0, type: "ninja" }, { at: 0.36, lane: 2, type: "bomber" },
      { at: 0.54, lane: 1, type: "ninja" },
    ], [
      { at: 0.12, lane: 1, gold: true }, { at: 0.32, lane: 0 }, { at: 0.50, lane: 2, gold: true }, { at: 0.66, lane: 1 },
    ], { hp: 6, name: "מלך הברוקולי" }),
  ];
  const stageLabel = (idx) => STAGES[idx].world + "-" + ((idx % 3) + 1);

  // ---------------------------------------------------------------- save
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      return {
        unlocked: Math.min(STAGES.length - 1, Math.max(0, raw.unlocked | 0)),
        stars: Array.isArray(raw.stars) && raw.stars.length === STAGES.length ? raw.stars : Array(STAGES.length).fill(0),
        stickers: Array.isArray(raw.stickers) ? raw.stickers : [],
        turtleId: turtleById(raw.turtleId).id,
      };
    } catch (_) {
      return { unlocked: 0, stars: Array(STAGES.length).fill(0), stickers: [], turtleId: "leo" };
    }
  }
  let save = loadSave();
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (_) {} }
  const getTurtle = () => turtleById(save.turtleId);

  // ---------------------------------------------------------------- audio shim
  const GA = window.GameAudio || {};
  const A = {
    unlock:     () => { try { GA.unlock && GA.unlock(); } catch (_) {} },
    startMusic: (w) => { try { GA.startMusic && GA.startMusic(w); } catch (_) {} },
    stopMusic:  () => { try { GA.stopMusic && GA.stopMusic(); } catch (_) {} },
    sfx:        (n) => { try { GA.sfx && GA.sfx(n); } catch (_) {} },
    toggleMute: () => { try { return GA.toggleMute ? GA.toggleMute() : false; } catch (_) { return false; } },
    isMuted:    () => { try { return GA.isMuted ? GA.isMuted() : false; } catch (_) { return false; } },
  };
  let audioUnlocked = false;
  function unlockAudioOnce() { if (!audioUnlocked) { audioUnlocked = true; A.unlock(); } }

  // ---------------------------------------------------------------- DOM
  const $ = (id) => document.getElementById(id);
  const screens = {
    start: $("screen-start"), pick: $("screen-pick"), map: $("screen-map"),
    stickers: $("screen-stickers"), game: $("screen-game"), pause: $("screen-pause"),
    clear: $("screen-clear"), retry: $("screen-retry"),
  };
  const OVERLAYS = { pause: 1, clear: 1, retry: 1 };

  let mode = "showcase"; // showcase | game | idle

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    if (OVERLAYS[name]) screens.game.classList.add("active");
    screens[name].classList.add("active");

    if (name === "game" || name === "pause") mode = "game";
    else if (name === "start" || name === "pick") { mode = "showcase"; ensureShowcase(); }
    else { mode = "idle"; if (showcaseRoot) showcaseRoot.visible = false; }

    const inStage = (name === "game" || name === "pause");
    if (laneGlow) laneGlow.visible = inStage;
    if (speedLines) speedLines.visible = inStage;
    if (playerMesh) playerMesh.visible = inStage;
    if (worldRoot) worldRoot.visible = (mode !== "idle");
    if (showcaseRoot) showcaseRoot.visible = (mode === "showcase");
  }

  function toast(text, ms) {
    const el = $("toast");
    el.hidden = false; el.textContent = text;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, ms || 1100);
  }
  function celebrate(text) {
    $("cele-text").textContent = text;
    $("celebration").hidden = false;
    clearTimeout(celebrate._t);
    celebrate._t = setTimeout(() => { $("celebration").hidden = true; }, 1500);
  }
  function banner(text) {
    const el = $("stage-banner");
    el.hidden = false; el.textContent = text;
    clearTimeout(banner._t);
    banner._t = setTimeout(() => { el.hidden = true; }, 1500);
  }

  // ---------------------------------------------------------------- WebGL / renderer
  const GAr = window.GameArt;
  const canvas = $("c3d");
  let renderer;
  try {
    if (!window.THREE) throw new Error("THREE missing");
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false,
      powerPreference: "high-performance", failIfMajorPerformanceCaveat: false,
    });
  } catch (err) {
    console.warn("WebGL unavailable:", err && err.message);
    $("no-webgl").hidden = false;
    $("ui").style.display = "none";
    return;
  }
  if (!GAr) { console.error("GameArt (meshes.js) missing"); $("no-webgl").hidden = false; return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 220);
  camera.position.set(0, 3, 7);

  // Lights (driven by GameArt.worldTheme)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(5, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  scene.add(sun);
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.5); // front fill so faces read
  keyLight.position.set(0, 3, 8);
  scene.add(keyLight);

  scene.fog = new THREE.Fog(0x0a2233, 30, 150);

  // roots
  const worldRoot = new THREE.Group();   scene.add(worldRoot);
  const entityRoot = new THREE.Group();  scene.add(entityRoot);
  const bossRoot = new THREE.Group();    scene.add(bossRoot);
  const showcaseRoot = new THREE.Group(); scene.add(showcaseRoot);
  const fxRoot = new THREE.Group();      scene.add(fxRoot);

  let laneGlow = null, speedLines = null, playerMesh = null;
  const fxList = [];

  function applyTheme(world) {
    let th = null;
    try { th = GAr.worldTheme && GAr.worldTheme(world); } catch (_) {}
    th = th || {};
    const bg = th.bg != null ? th.bg : 0x0a2233;
    scene.background = new THREE.Color(bg);
    scene.fog.color.set(th.fog != null ? th.fog : bg);
    scene.fog.near = th.fogNear != null ? th.fogNear : 30;
    scene.fog.far = th.fogFar != null ? th.fogFar : 150;
    hemi.color.set(th.hemiSky != null ? th.hemiSky : 0xffffff);
    hemi.groundColor.set(th.hemiGround != null ? th.hemiGround : 0x334455);
    hemi.intensity = th.hemiInt != null ? th.hemiInt : 1.1;
    sun.color.set(th.sunColor != null ? th.sunColor : 0xffffff);
    sun.intensity = th.sunInt != null ? th.sunInt : 1.5;
  }

  function disposeGroup(g) {
    for (let i = g.children.length - 1; i >= 0; i--) {
      const c = g.children[i];
      g.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m && m.dispose && m.dispose());
        }
      });
    }
  }

  // ---- ground chunks (recycled, endless) ----
  let groundChunks = [];
  let chunkLen = 40;
  const CHUNK_POOL = 6;
  function buildGround(world) {
    disposeGroup(worldRoot);
    groundChunks = [];
    for (let i = 0; i < CHUNK_POOL; i++) {
      let chunk;
      try { chunk = GAr.createGroundChunk(world, chunkLen); } catch (_) { chunk = new THREE.Group(); }
      chunk.position.z = -i * chunkLen;
      worldRoot.add(chunk);
      groundChunks.push(chunk);
    }
  }

  function ensureDecor() {
    if (!laneGlow) {
      try { laneGlow = GAr.createLaneGlow(LANE_XS); } catch (_) { laneGlow = new THREE.Group(); }
      scene.add(laneGlow);
    }
    if (!speedLines) {
      try { speedLines = GAr.createSpeedLines(); } catch (_) { speedLines = new THREE.Group(); }
      scene.add(speedLines);
    }
  }

  function spawnFX(kind, pos, color) {
    let g = null;
    try { g = GAr.createFX(kind, color); } catch (_) { g = null; }
    if (!g) return;
    if (pos) g.position.copy(pos);
    fxRoot.add(g);
    fxList.push(g);
  }
  function updateFX(dt) {
    for (let i = fxList.length - 1; i >= 0; i--) {
      let alive = false;
      try { alive = GAr.updateFX ? GAr.updateFX(fxList[i], dt) : false; } catch (_) { alive = false; }
      if (!alive) { fxRoot.remove(fxList[i]); fxList.splice(i, 1); }
    }
  }

  // ---- showcase (start / pick) ----
  let showcaseMeshes = [];
  function ensureShowcase() {
    if (showcaseMeshes.length) { showcaseRoot.visible = true; highlightShowcase(); return; }
    disposeGroup(showcaseRoot);
    showcaseMeshes = [];
    TURTLES.forEach((t, i) => {
      let m;
      try { m = GAr.createTurtle(t.id); } catch (_) { m = new THREE.Group(); }
      m.position.set((i - 1.5) * 1.9, 0, 0);
      m.rotation.y = Math.PI; // face the camera (+Z)
      m.userData.slot = i;
      showcaseRoot.add(m);
      showcaseMeshes.push(m);
    });
    if (!worldRoot.children.length) buildGround(1);
    applyTheme(1);
    ensureDecor();
    if (laneGlow) laneGlow.visible = false;
    if (speedLines) speedLines.visible = false;
    showcaseRoot.visible = true;
    highlightShowcase();
  }
  function highlightShowcase() {
    const selId = save.turtleId;
    showcaseMeshes.forEach((m) => {
      const t = TURTLES[m.userData.slot];
      const on = t.id === selId;
      m.scale.setScalar(on ? 1.15 : 0.92);
    });
  }

  function spawnPlayer(turtleId) {
    if (playerMesh) { scene.remove(playerMesh); disposeGroup(playerMesh); }
    try { playerMesh = GAr.createTurtle(turtleId); } catch (_) { playerMesh = new THREE.Group(); }
    playerMesh.rotation.y = 0; // face -Z into the tunnel
    scene.add(playerMesh);
    return playerMesh;
  }

  // ---------------------------------------------------------------- game state
  const G = {
    idx: 0, running: false, paused: false,
    dist: 0, courseLen: 200, speed: 9, baseSpeed: 9,
    lane: 1, laneX: 0, laneTargetX: 0,
    jumpY: 0, jumpV: 0, onGround: true,
    squash: 0,
    energy: 3, energyMax: 3,
    pizzas: 0, superCharge: 0,
    combo: 0, bestCombo: 0,
    invulnUntil: 0, shieldUntil: 0, pizzaMult: 1,
    ents: [], spawnE: 0, spawnP: 0,
    boss: null, bossHp: 0, bossMax: 0, bossHitAt: 0, bossActive: false,
    finished: false,
    camShake: 0,
  };

  function currentIntensity() {
    return Math.min(2.2, 0.8 + G.combo * 0.05 + (G.speed - G.baseSpeed) * 0.1);
  }

  // ---------------------------------------------------------------- HUD
  function updateHud() {
    const hearts = $("hearts").children;
    const full = Math.ceil(G.energy - 0.001);
    for (let i = 0; i < hearts.length; i++) {
      hearts[i].classList.toggle("empty", i >= full);
    }
    $("pizza-count").textContent = "🍕 " + G.pizzas;
    $("stage-label").textContent = stageLabel(G.idx);

    const ready = G.superCharge >= SUPER_COST;
    const btn = $("btn-super");
    btn.disabled = !ready;
    btn.classList.toggle("ready", ready);
    $("super-fill").style.width = Math.min(100, (G.superCharge / SUPER_COST) * 100) + "%";
    $("super-label").textContent = ready ? getTurtle().superName : "כוח על";

    const stg = STAGES[G.idx];
    const bar = $("boss-hp");
    if (stg.boss && G.bossActive) {
      bar.hidden = false;
      $("boss-fill").style.width = (G.bossMax ? (G.bossHp / G.bossMax) * 100 : 0) + "%";
    } else {
      bar.hidden = true;
    }
  }

  function showCombo() {
    const el = $("combo");
    if (G.combo >= 3) {
      el.hidden = false;
      el.textContent = "x" + G.combo;
      el.style.animation = "none";
      // reflow to restart animation
      void el.offsetWidth;
      el.style.animation = "";
    }
    clearTimeout(showCombo._t);
    showCombo._t = setTimeout(() => { el.hidden = true; }, 1200);
  }

  // ---------------------------------------------------------------- spawning
  function spawnEnemy(def) {
    let m;
    try { m = GAr.createFoe(def.type); } catch (_) { m = new THREE.Group(); }
    m.position.set(LANE_XS[def.lane], 0, -def.at * G.courseLen);
    entityRoot.add(m);
    G.ents.push({ kind: "foe", type: def.type, lane: def.lane, baseX: LANE_XS[def.lane], mesh: m, bumped: false });
  }
  function spawnPizza(def, extraZ) {
    let m;
    try { m = GAr.createPizza(!!def.gold); } catch (_) { m = new THREE.Group(); }
    m.position.set(LANE_XS[def.lane], 0.8, -def.at * G.courseLen - (extraZ || 0));
    entityRoot.add(m);
    G.ents.push({ kind: "pizza", gold: !!def.gold, lane: def.lane, mesh: m });
  }

  function clearEntities() {
    disposeGroup(entityRoot);
    disposeGroup(bossRoot);
    G.ents = [];
    G.boss = null;
  }
  function removeEnt(ent) {
    entityRoot.remove(ent.mesh);
    ent.mesh.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { const a = Array.isArray(o.material) ? o.material : [o.material]; a.forEach((m) => m.dispose && m.dispose()); }
    });
    const i = G.ents.indexOf(ent);
    if (i >= 0) G.ents.splice(i, 1);
  }

  // ---------------------------------------------------------------- start / finish
  function startStage(idx) {
    unlockAudioOnce();
    const stg = STAGES[idx];
    G.idx = idx;
    G.running = true; G.paused = false; G.finished = false;
    G.dist = 0;
    G.baseSpeed = 8.5 + stg.world * 0.6;
    G.speed = G.baseSpeed;
    G.courseLen = G.baseSpeed * stg.seconds;
    G.lane = 1; G.laneX = 0; G.laneTargetX = 0;
    G.jumpY = 0; G.jumpV = 0; G.onGround = true; G.squash = 0;
    G.energy = G.energyMax = 3;
    G.pizzas = 0; G.superCharge = 0;
    G.combo = 0; G.bestCombo = 0;
    G.invulnUntil = 0; G.shieldUntil = 0; G.pizzaMult = 1;
    G.spawnE = 0; G.spawnP = 0;
    G.camShake = 0;
    G.boss = null; G.bossHp = 0; G.bossMax = 0; G.bossActive = false; G.bossHitAt = 0;

    if (stg.boss) { G.bossMax = G.bossHp = stg.boss.hp; }

    chunkLen = 40;
    buildGround(stg.world);
    applyTheme(stg.world);
    ensureDecor();
    clearEntities();

    spawnPlayer(save.turtleId);
    playerMesh.position.set(0, 0, PLAYER_Z);
    playerMesh.scale.setScalar(1.15);

    showScreen("game");
    if (laneGlow) laneGlow.visible = true;
    if (speedLines) speedLines.visible = true;

    A.startMusic(stg.world);
    A.sfx("start");
    updateHud();

    banner(stg.name);
    $("drag-hint").hidden = false;
    clearTimeout(startStage._h);
    startStage._h = setTimeout(() => { $("drag-hint").hidden = true; }, 3000);
    toast("קוואבנגה! " + getTurtle().name + "!", 1300);
  }

  function computeStars() {
    // Always at least 1 — never punish. Reward pizzas + combo.
    let s = 1;
    if (G.pizzas >= 8) s = 2;
    if (G.pizzas >= 16 || G.bestCombo >= 8) s = 3;
    return s;
  }

  function grantStickers() {
    const cleared = save.stars.filter((n) => n > 0).length;
    const want = Math.min(STICKERS.length, 1 + Math.floor(cleared / 1)); // 1 sticker per cleared stage-ish
    while (save.stickers.length < Math.min(STICKERS.length, want)) {
      const next = STICKERS[save.stickers.length];
      if (!next) break;
      save.stickers.push(next.id);
    }
  }

  function finishStage(bossWin) {
    if (G.finished) return;
    G.finished = true;
    G.running = false;
    A.stopMusic();
    A.sfx("win");

    const stars = computeStars();
    save.stars[G.idx] = Math.max(save.stars[G.idx] || 0, stars);
    if (G.idx >= save.unlocked && G.idx < STAGES.length - 1) save.unlocked = G.idx + 1;
    grantStickers();
    persist();

    const stg = STAGES[G.idx];
    const lastOfAll = G.idx === STAGES.length - 1;
    $("clear-emoji").textContent = lastOfAll ? "🏆" : (stg.boss ? "🥦🎉" : "🎉");
    $("clear-title").textContent = lastOfAll ? "הצלנו את העיר!" : (stg.boss ? "ניצחתם את הבוס!" : "כל הכבוד!");
    $("stars-row").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    $("clear-stats").textContent = "🍕 " + G.pizzas + "   🔥 x" + G.bestCombo;
    for (let i = 0; i < stars; i++) setTimeout(() => A.sfx("star"), 200 + i * 220);
    // The win card is itself the celebration; a full-screen banner here would overlap it.
    showScreen("clear");
  }

  // ---------------------------------------------------------------- hit / pickup
  function collectPizza(ent) {
    const gain = (ent.gold ? 3 : 1) * G.pizzaMult;
    G.pizzas += gain;
    G.superCharge = Math.min(SUPER_COST, G.superCharge + (ent.gold ? 3 : 1));
    G.combo += 1;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    // entity positions are local to entityRoot; convert to world z for FX (which live in scene)
    const wp = new THREE.Vector3(ent.mesh.position.x, 1.0, ent.mesh.position.z + entityRoot.position.z);
    spawnFX(ent.gold ? "star" : "ring", wp, ent.gold ? 0xffd23e : 0xff8a1f);
    spawnFX("confetti", wp, ent.gold ? 0xffd23e : 0xff8a1f);
    A.sfx(ent.gold ? "gold" : "pizza");
    removeEnt(ent);
    if (G.combo % 5 === 0) { A.sfx("combo"); banner("קוואבנגה!"); }
    else if (G.combo >= 3) showCombo();
    updateHud();
  }

  function stumble(ent) {
    const now = performance.now();
    if (now < G.invulnUntil || now < G.shieldUntil) { if (ent) bumpFoeAway(ent); return; }
    G.invulnUntil = now + 1100;
    G.energy = Math.max(0, G.energy - 1);
    if (G.energy <= 0) G.energy = 1; // never zero-out: gentle floor
    G.combo = 0;
    G.squash = 1;           // squash pose
    G.camShake = Math.max(G.camShake, 0.4);
    A.sfx("hit");
    if (playerMesh) { try { GAr.setTurtleGlow && GAr.setTurtleGlow(playerMesh, 0xff5555); } catch (_) {} setTimeout(() => { try { GAr.setTurtleGlow && GAr.setTurtleGlow(playerMesh, null); } catch (_) {} }, 300); }
    // scatter 1-2 pizzas
    const scatter = 1 + (Math.random() < 0.5 ? 1 : 0);
    if (playerMesh) {
      const base = new THREE.Vector3(G.laneX, 1.0 + G.jumpY, PLAYER_Z);
      for (let i = 0; i < scatter; i++) spawnFX("poof", base.clone(), 0xffd23e);
      spawnFX("spark", base.clone(), 0xffaa33);
    }
    if (ent) { try { GAr.triggerTurtleAction && GAr.triggerTurtleAction(playerMesh); } catch (_) {} bumpFoeAway(ent); }
    updateHud();
  }
  function bumpFoeAway(ent) {
    if (!ent || ent.bumped) return;
    ent.bumped = true;
    ent.mesh.userData.vz = 26;      // fling backward toward camera
    ent.mesh.userData.spin = (Math.random() - 0.5) * 12;
    const wp = new THREE.Vector3(ent.mesh.position.x, 0.8, ent.mesh.position.z + entityRoot.position.z);
    spawnFX("poof", wp, 0x8bd450);
  }

  function hitBoss() {
    if (!G.boss || G.bossHp <= 0) return;
    const now = performance.now();
    if (now < G.bossHitAt) return;
    G.bossHitAt = now + 500;
    G.bossHp -= 1;
    G.camShake = Math.max(G.camShake, 0.5);
    A.sfx("boss");
    try { GAr.triggerTurtleAction && GAr.triggerTurtleAction(playerMesh); } catch (_) {}
    const wp = new THREE.Vector3(G.boss.position.x, 1.6, G.boss.position.z);
    spawnFX("spark", wp, 0x8bd450);
    spawnFX("ring", wp, 0xffd23e);
    updateHud();
    if (G.bossHp <= 0) {
      spawnFX("confetti", wp, 0x8bd450);
      bossRoot.remove(G.boss); G.boss = null; G.bossActive = false;
      finishStage(true);
    }
  }

  // ---------------------------------------------------------------- super
  function activateSuper() {
    if (G.superCharge < SUPER_COST || !G.running || G.paused) return;
    G.superCharge = 0;
    updateHud();
    const id = getTurtle().id;
    A.sfx("power");
    celebrate(getTurtle().superName);
    G.camShake = Math.max(G.camShake, 0.4);

    if (id === "leo" || id === "raph") {
      // clear foes ahead with a flourish
      [...G.ents].forEach((e) => {
        if (e.kind === "foe") {
          const wp = new THREE.Vector3(e.mesh.position.x, 0.9, e.mesh.position.z + entityRoot.position.z);
          spawnFX("confetti", wp, id === "leo" ? 0x1e6bff : 0xe53935);
          removeEnt(e);
        }
      });
      if (G.boss && G.bossActive) { G.bossHitAt = 0; hitBoss(); }
    } else if (id === "don") {
      G.shieldUntil = performance.now() + 5000;
      G.pizzaMult = 2;
      clearTimeout(activateSuper._t);
      activateSuper._t = setTimeout(() => { G.pizzaMult = 1; }, 5000);
      toast("מגן פיצה! 🛡️", 1400);
    } else { // mikey — pizza rain (spawn a line of pizzas just ahead of the player)
      for (let i = 0; i < 10; i++) {
        let m;
        const gold = i % 4 === 0;
        try { m = GAr.createPizza(gold); } catch (_) { m = new THREE.Group(); }
        // local z so that world z (= local + G.dist) is a bit ahead of the player
        m.position.set(LANE_XS[i % 3], 0.8, -G.dist - (12 + i * 4.5));
        entityRoot.add(m);
        G.ents.push({ kind: "pizza", gold: gold, lane: i % 3, mesh: m });
      }
      toast("גשם פיצות! 🍕", 1400);
    }
  }

  // ---------------------------------------------------------------- input (touch-pad)
  const pad = $("touch-pad");
  let dragging = false, pointerId = null;
  let downX = 0, downY = 0, downT = 0, moved = false;

  function padToWorldX(clientX) {
    const r = pad.getBoundingClientRect();
    let nx = (clientX - r.left) / Math.max(1, r.width);
    nx = Math.min(1, Math.max(0, nx));
    // RTL-agnostic: left edge -> lane -2.2, right edge -> +2.2
    return (nx - 0.5) * 2 * 2.4;
  }
  function applyFinger(clientX) {
    const x = padToWorldX(clientX);
    G.laneTargetX = Math.min(LANE_XS[2], Math.max(LANE_XS[0], x));
    if (G.laneTargetX < -1.1) G.lane = 0;
    else if (G.laneTargetX > 1.1) G.lane = 2;
    else G.lane = 1;
  }
  function snapLane() {
    let best = 1, bd = Infinity;
    for (let i = 0; i < 3; i++) { const d = Math.abs(LANE_XS[i] - G.laneTargetX); if (d < bd) { bd = d; best = i; } }
    G.lane = best; G.laneTargetX = LANE_XS[best];
  }
  function tryJump() {
    if (!G.running || G.paused || !G.onGround) return;
    G.jumpV = 8.6; G.onGround = false;
    A.sfx("jump");
  }

  function onDown(e) {
    if (!G.running || G.paused) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    unlockAudioOnce();
    dragging = true; moved = false; pointerId = e.pointerId;
    downX = e.clientX; downY = e.clientY; downT = performance.now();
    A.sfx("tap");
    try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    applyFinger(e.clientX);
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging || !G.running || G.paused) return;
    if (pointerId != null && e.pointerId !== pointerId) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) moved = true;
    applyFinger(e.clientX);
    e.preventDefault();
  }
  function onUp(e) {
    if (pointerId != null && e.pointerId !== pointerId) return;
    const held = performance.now() - downT;
    if (!moved && held < 260) tryJump();
    dragging = false; pointerId = null;
    snapLane();
    try { if (e.pointerId != null) pad.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  pad.addEventListener("pointerdown", onDown, { passive: false });
  pad.addEventListener("pointermove", onMove, { passive: false });
  pad.addEventListener("pointerup", onUp, { passive: false });
  pad.addEventListener("pointercancel", onUp, { passive: false });
  pad.addEventListener("lostpointercapture", () => { dragging = false; pointerId = null; });

  // ---------------------------------------------------------------- UI builders
  function buildPicker() {
    const grid = $("turtle-grid");
    grid.innerHTML = "";
    TURTLES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "turtle-card";
      btn.dataset.id = t.id;
      btn.innerHTML =
        '<span class="face" style="--c:#' + t.color.toString(16).padStart(6, "0") + '" data-letter="' + t.letter + '"></span>' +
        '<span class="tname">' + t.name + '</span>' +
        '<span class="tsuper">' + t.emoji + " " + t.superName + '</span>';
      btn.addEventListener("click", () => {
        unlockAudioOnce(); A.sfx("select");
        save.turtleId = t.id; persist();
        highlightShowcase();
        openMap();
      });
      grid.appendChild(btn);
    });
  }

  function buildMap() {
    const board = $("map-board");
    board.innerHTML = "";
    const pos = [
      { x: 16, y: 80 }, { x: 34, y: 62 }, { x: 24, y: 40 },
      { x: 46, y: 26 }, { x: 62, y: 42 }, { x: 52, y: 64 },
      { x: 70, y: 78 }, { x: 84, y: 58 }, { x: 78, y: 34 },
    ];
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "map-path");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    let d = "";
    pos.forEach((p, i) => { d += (i ? " L" : "M") + p.x + " " + p.y; });
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "path-line");
    path.setAttribute("d", d);
    svg.appendChild(path);
    board.appendChild(svg);

    STAGES.forEach((stg, idx) => {
      const p = pos[idx] || { x: 50, y: 50 };
      const node = document.createElement("button");
      node.type = "button";
      node.className = "map-node";
      node.style.left = p.x + "%";
      node.style.top = p.y + "%";
      const locked = idx > save.unlocked;
      const done = (save.stars[idx] || 0) > 0;
      if (stg.boss) node.classList.add("boss");
      if (locked) node.classList.add("locked");
      else if (done) node.classList.add("done");
      if (idx === save.unlocked && !locked) node.classList.add("current");
      node.textContent = stageLabel(idx);
      if (done) {
        const st = document.createElement("span");
        st.className = "stars";
        st.textContent = "⭐".repeat(save.stars[idx]);
        node.appendChild(st);
      }
      node.addEventListener("click", () => {
        if (locked) { A.sfx("hit"); toast("עוד נעול 🔒", 900); return; }
        A.sfx("select");
        startStage(idx);
      });
      board.appendChild(node);
    });
  }

  function buildStickers() {
    const grid = $("sticker-grid");
    grid.innerHTML = "";
    STICKERS.forEach((s) => {
      const cell = document.createElement("div");
      cell.className = "sticker-cell";
      if (save.stickers.indexOf(s.id) !== -1) { cell.classList.add("earned"); cell.textContent = s.label; }
      else cell.textContent = "❔";
      grid.appendChild(cell);
    });
  }

  function openMap() {
    A.stopMusic();
    G.running = false;
    $("map-turtle-label").textContent = getTurtle().emoji + " " + getTurtle().name + " · " + getTurtle().superName;
    buildMap();
    showScreen("map");
  }

  function updateMuteBtn() {
    const muted = A.isMuted();
    const b = $("btn-mute");
    b.textContent = muted ? "🔇" : "🔊";
  }

  // ---------------------------------------------------------------- update loop
  function updateGame(dt, t) {
    const stg = STAGES[G.idx];

    // difficulty-free pace: gently speed up with combo, ease back after hits
    const targetSpeed = G.baseSpeed + Math.min(3, G.combo * 0.12);
    G.speed += (targetSpeed - G.speed) * Math.min(1, dt * 1.5);

    const move = G.speed * dt;
    G.dist += move;

    // energy auto-refill
    if (G.energy < G.energyMax) { G.energy = Math.min(G.energyMax, G.energy + dt * 0.28); }

    worldRoot.position.z = G.dist;
    entityRoot.position.z = G.dist;

    // recycle ground chunks
    for (const c of groundChunks) {
      const eff = c.position.z + G.dist;
      if (eff > chunkLen) c.position.z -= CHUNK_POOL * chunkLen;
      try { GAr.animateGroundChunk && GAr.animateGroundChunk(c, t); } catch (_) {}
    }

    // spawn by distance
    while (G.spawnE < stg.enemies.length && stg.enemies[G.spawnE].at * G.courseLen <= G.dist + SPAWN_AHEAD) {
      spawnEnemy(stg.enemies[G.spawnE++]);
    }
    while (G.spawnP < stg.pickups.length && stg.pickups[G.spawnP].at * G.courseLen <= G.dist + SPAWN_AHEAD) {
      spawnPizza(stg.pickups[G.spawnP++]);
    }

    // boss reveal near the end of a boss stage
    if (stg.boss && !G.bossActive && !G.finished && G.dist >= G.courseLen * 0.82) {
      G.bossActive = true;
      let m;
      try { m = GAr.createFoe("boss"); } catch (_) { m = new THREE.Group(); }
      m.position.set(0, 0, -12);
      bossRoot.add(m);
      G.boss = m;
      A.sfx("boss");
      banner(stg.boss.name);
      updateHud();
    }

    // player physics
    if (playerMesh) {
      G.jumpV -= 24 * dt;
      G.jumpY += G.jumpV * dt;
      if (G.jumpY <= 0) {
        if (!G.onGround) { A.sfx("land"); G.squash = Math.max(G.squash, 0.7); }
        G.jumpY = 0; G.jumpV = 0; G.onGround = true;
      }
      // follow finger smoothly
      const dx = G.laneTargetX - G.laneX;
      G.laneX += dx * Math.min(1, dt * 15);
      playerMesh.position.set(G.laneX, G.jumpY, PLAYER_Z);
      playerMesh.rotation.y = 0;
      playerMesh.rotation.z = THREE.MathUtils.clamp(-dx * 0.18, -0.4, 0.4);
      playerMesh.rotation.x = G.jumpY > 0.2 ? -0.1 : 0;
      // squash/stretch
      G.squash = Math.max(0, G.squash - dt * 3.2);
      const sq = G.squash;
      const stretch = (!G.onGround && G.jumpV > 0) ? 0.12 : 0;
      playerMesh.scale.set(1.15 * (1 + sq * 0.25 - stretch * 0.5), 1.15 * (1 - sq * 0.35 + stretch), 1.15 * (1 + sq * 0.25 - stretch * 0.5));
      try { GAr.animateTurtleRun && GAr.animateTurtleRun(playerMesh, t); } catch (_) {}
    }

    if (speedLines && speedLines.visible) { try { GAr.animateSpeedLines && GAr.animateSpeedLines(speedLines, t, currentIntensity()); } catch (_) {} }

    updateFX(dt);

    // entities
    const airborne = G.jumpY > 0.6;
    for (const ent of [...G.ents]) {
      const eff = ent.mesh.position.z + G.dist; // world z (player at 0)
      // knock-back flung foes
      if (ent.mesh.userData.vz) {
        ent.mesh.position.z += ent.mesh.userData.vz * dt;
        ent.mesh.userData.vz *= (1 - dt * 1.5);
        ent.mesh.rotation.z += (ent.mesh.userData.spin || 0) * dt;
        ent.mesh.position.y += dt * 2;
      }
      if (ent.kind === "pizza") {
        try { GAr.animatePizza && GAr.animatePizza(ent.mesh, t); } catch (_) { ent.mesh.rotation.y += dt * 3; }
        const dxp = ent.mesh.position.x - G.laneX;
        const dyp = (ent.mesh.position.y || 0.8) - (G.jumpY + 0.8);
        if (Math.abs(eff) < 1.8 && Math.abs(dxp) < 1.5 && Math.abs(dyp) < 2.2) collectPizza(ent);
        else if (eff > 10) removeEnt(ent);
      } else if (ent.kind === "foe") {
        try { GAr.animateFoe && GAr.animateFoe(ent.mesh, t); } catch (_) {}
        if (ent.type === "ninja" && !ent.bumped) {
          ent.mesh.position.x = ent.baseX + Math.sin(t * 3 + ent.mesh.id) * 0.7;
        }
        if (!ent.bumped) {
          const dxp = ent.mesh.position.x - G.laneX;
          if (Math.abs(eff) < 1.2 && Math.abs(dxp) < 1.15) {
            if (airborne) {
              // hopped over — reward a tiny cheer, no stumble
              ent.bumped = true; ent.mesh.userData.vz = 6;
            } else {
              stumble(ent);
            }
          }
        }
        if (eff > 12) removeEnt(ent);
      }
    }

    // boss behaviour
    if (G.boss) {
      G.boss.position.x = Math.sin(t * 1.3) * 1.6;
      G.boss.position.z = -9 + Math.sin(t * 0.8) * 1.2;
      try { GAr.animateFoe && GAr.animateFoe(G.boss, t); } catch (_) {}
      const dxb = G.boss.position.x - G.laneX;
      if (Math.abs(dxb) < 1.9 && G.boss.position.z > -7) {
        hitBoss();
      }
    }

    // shield sweep
    const now = performance.now();
    if (now < G.shieldUntil) {
      for (const ent of [...G.ents]) {
        if (ent.kind === "foe" && !ent.bumped) {
          const eff = ent.mesh.position.z + G.dist;
          if (eff > -3 && eff < 4) {
            const wp = new THREE.Vector3(ent.mesh.position.x, 0.9, eff);
            spawnFX("confetti", wp, 0x9b4dca);
            removeEnt(ent);
          }
        }
      }
    }

    // camera — dynamic chase
    G.camShake = Math.max(0, G.camShake - dt * 1.6);
    const bob = Math.sin(t * 11) * 0.07;
    const shx = (Math.random() - 0.5) * G.camShake;
    const shy = (Math.random() - 0.5) * G.camShake;
    const camTargetX = G.laneX * 0.45 + shx;
    camera.position.x += (camTargetX - camera.position.x) * 0.12;
    camera.position.y = 2.9 + bob + shy + G.jumpY * 0.28;
    camera.position.z = 6.4;
    camera.lookAt(G.laneX * 0.25, 1.2 + G.jumpY * 0.2, -6);

    updateHud();

    // finish (non-boss = reach the end; boss = beat the boss)
    if (!G.finished) {
      if (!stg.boss && G.dist >= G.courseLen) finishStage(false);
      // boss stages never auto-finish; beaten via hitBoss()
    }
  }

  function updateShowcase(t) {
    showcaseMeshes.forEach((m, i) => {
      try { GAr.animateTurtleIdle && GAr.animateTurtleIdle(m, t + i * 0.6); } catch (_) {}
      m.rotation.y = Math.PI + Math.sin(t * 0.7 + i) * 0.12;
      m.position.y = Math.sin(t * 1.5 + i) * 0.04;
    });
    // Frame turtles LOW on screen: look ABOVE them so heads sit ~mid, bodies lower.
    camera.position.set(Math.sin(t * 0.2) * 0.4, 2.4, 6.2);
    camera.lookAt(0, 2.15, 0);
    worldRoot.position.z = (t * 2) % chunkLen;
    for (const c of groundChunks) {
      const eff = c.position.z + worldRoot.position.z;
      if (eff > chunkLen) c.position.z -= CHUNK_POOL * chunkLen;
    }
  }

  // ---------------------------------------------------------------- main frame
  const clock = new THREE.Clock();
  let pageHidden = false;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    if (pageHidden) return; // pause rendering when tab hidden
    if (mode === "game") {
      if (G.running && !G.paused) updateGame(dt, t);
    } else if (mode === "showcase") {
      updateShowcase(t);
    } else {
      camera.position.set(0, 4, 10);
      camera.lookAt(0, 1, -5);
    }
    renderer.render(scene, camera);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", () => {
    pageHidden = document.hidden;
    if (pageHidden && G.running && !G.paused) { /* keep state; loop skips render */ }
    if (!pageHidden) clock.getDelta(); // drop the accumulated hidden time
  });

  // ---------------------------------------------------------------- bind UI
  function bind() {
    $("btn-start").addEventListener("click", () => { unlockAudioOnce(); A.sfx("start"); buildPicker(); showScreen("pick"); });
    $("btn-pick-back").addEventListener("click", () => { A.sfx("select"); showScreen("start"); });
    $("btn-map-repick").addEventListener("click", () => { A.sfx("select"); buildPicker(); showScreen("pick"); });
    $("btn-stickers").addEventListener("click", () => { A.sfx("select"); buildStickers(); showScreen("stickers"); });
    $("btn-stickers-back").addEventListener("click", () => { A.sfx("select"); showScreen("map"); });

    $("btn-pause").addEventListener("click", () => {
      if (!G.running) return;
      G.paused = true;
      $("pause-stats").textContent = stageLabel(G.idx) + " · 🍕 " + G.pizzas;
      showScreen("pause");
    });
    $("btn-resume").addEventListener("click", () => { A.sfx("select"); G.paused = false; showScreen("game"); });
    $("btn-exit-map").addEventListener("click", () => { A.sfx("select"); openMap(); });

    $("btn-retry").addEventListener("click", () => { A.sfx("select"); startStage(G.idx); });
    $("btn-retry-map").addEventListener("click", () => { A.sfx("select"); openMap(); });

    $("btn-clear-continue").addEventListener("click", () => { A.sfx("select"); openMap(); });

    $("btn-super").addEventListener("click", activateSuper);

    $("btn-mute").addEventListener("click", () => { unlockAudioOnce(); A.toggleMute(); updateMuteBtn(); });
  }

  // ---------------------------------------------------------------- boot
  applyTheme(1);
  buildGround(1);
  ensureDecor();
  ensureShowcase();
  buildPicker();
  bind();
  updateMuteBtn();
  $("map-turtle-label").textContent = getTurtle().emoji + " " + getTurtle().name;
  showScreen("start");
  onResize();
  requestAnimationFrame(frame);
})();
