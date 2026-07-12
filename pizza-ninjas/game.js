(() => {
  "use strict";

  if (!window.THREE || !window.TMNTMeshes) {
    console.error("Three.js / meshes missing");
    return;
  }

  const M = window.TMNTMeshes;
  const LANES_X = [-2.2, 0, 2.2];
  const SUPER_COST = 8;
  const SAVE_KEY = "tmnt-3d-save";

  const TURTLES = [
    { id: "leo", name: "ליאו", mask: "כחול · מנהיג", color: 0x2f6bff, superName: "סערת חרבות" },
    { id: "raph", name: "ראף", mask: "אדום · חזק", color: 0xe53935, superName: "רעש אדמה" },
    { id: "don", name: "דוני", mask: "סגול · גאון", color: 0x9b59d0, superName: "מגן חכם" },
    { id: "mikey", name: "מיקי", mask: "כתום · כיף", color: 0xff8f1f, superName: "גשם פיצות" },
  ];

  const STICKERS = [
    { id: "pizza", label: "🍕" }, { id: "gold", label: "🌟" }, { id: "broccoli", label: "🥦" },
    { id: "leo", label: "💙" }, { id: "raph", label: "❤️" }, { id: "don", label: "💜" },
    { id: "mikey", label: "🧡" }, { id: "sewer", label: "🐢" },
  ];

  function stagePack(world, name, lengthMs, enemies, pickups, boss) {
    return { world, name, lengthMs, enemies, pickups, boss: boss || null };
  }

  const STAGES = [
    stagePack(1, "הביוב הישן", 28000, [
      { at: 0.15, lane: 1, type: "scout", hp: 1 }, { at: 0.28, lane: 0, type: "scout", hp: 1 },
      { at: 0.42, lane: 2, type: "scout", hp: 1 }, { at: 0.55, lane: 1, type: "scout", hp: 1 },
      { at: 0.68, lane: 0, type: "scout", hp: 1 }, { at: 0.80, lane: 2, type: "scout", hp: 1 },
    ], [
      { at: 0.1, lane: 0 }, { at: 0.2, lane: 2 }, { at: 0.35, lane: 1 }, { at: 0.48, lane: 2, gold: true },
      { at: 0.6, lane: 0 }, { at: 0.72, lane: 1 }, { at: 0.85, lane: 2 },
    ]),
    stagePack(1, "צינורות", 30000, [
      { at: 0.12, lane: 1, type: "scout", hp: 1 }, { at: 0.24, lane: 2, type: "ninja", hp: 1 },
      { at: 0.38, lane: 0, type: "scout", hp: 1 }, { at: 0.5, lane: 1, type: "bomber", hp: 2 },
      { at: 0.62, lane: 2, type: "scout", hp: 1 }, { at: 0.74, lane: 0, type: "ninja", hp: 1 },
      { at: 0.86, lane: 1, type: "scout", hp: 1 },
    ], [
      { at: 0.08, lane: 2 }, { at: 0.22, lane: 0 }, { at: 0.4, lane: 1, gold: true },
      { at: 0.55, lane: 2 }, { at: 0.7, lane: 0 }, { at: 0.82, lane: 1, gold: true },
    ]),
    stagePack(1, "מנהרת הפיצה", 26000, [
      { at: 0.2, lane: 1, type: "scout", hp: 1 }, { at: 0.45, lane: 0, type: "scout", hp: 1 },
      { at: 0.7, lane: 2, type: "scout", hp: 1 },
    ], [
      { at: 0.1, lane: 0 }, { at: 0.18, lane: 1 }, { at: 0.26, lane: 2 }, { at: 0.34, lane: 0, gold: true },
      { at: 0.42, lane: 1 }, { at: 0.5, lane: 2 }, { at: 0.58, lane: 0 }, { at: 0.66, lane: 1, gold: true },
      { at: 0.74, lane: 2 }, { at: 0.82, lane: 1 },
    ]),
    stagePack(1, "ברוקולי ענק", 45000, [
      { at: 0.2, lane: 0, type: "scout", hp: 1 }, { at: 0.35, lane: 2, type: "scout", hp: 1 },
      { at: 0.55, lane: 1, type: "bomber", hp: 2 }, { at: 0.7, lane: 0, type: "scout", hp: 1 },
    ], [
      { at: 0.15, lane: 1 }, { at: 0.3, lane: 2, gold: true }, { at: 0.5, lane: 0 }, { at: 0.65, lane: 1 },
    ], { hp: 5, name: "ברוקולי ענק", variant: "boss" }),

    stagePack(2, "מטבח רשע", 30000, [
      { at: 0.14, lane: 1, type: "bomber", hp: 2 }, { at: 0.28, lane: 0, type: "scout", hp: 1 },
      { at: 0.4, lane: 2, type: "ninja", hp: 1 }, { at: 0.55, lane: 1, type: "bomber", hp: 2 },
      { at: 0.7, lane: 0, type: "scout", hp: 1 }, { at: 0.84, lane: 2, type: "bomber", hp: 2 },
    ], [
      { at: 0.1, lane: 2 }, { at: 0.25, lane: 0, gold: true }, { at: 0.45, lane: 1 }, { at: 0.6, lane: 2 },
      { at: 0.78, lane: 0, gold: true },
    ]),
    stagePack(2, "סירים רותחים", 32000, [
      { at: 0.12, lane: 2, type: "ninja", hp: 1 }, { at: 0.25, lane: 1, type: "bomber", hp: 2 },
      { at: 0.38, lane: 0, type: "scout", hp: 1 }, { at: 0.5, lane: 2, type: "bomber", hp: 2 },
      { at: 0.65, lane: 1, type: "ninja", hp: 1 }, { at: 0.8, lane: 0, type: "bomber", hp: 2 },
    ], [
      { at: 0.08, lane: 1 }, { at: 0.3, lane: 0 }, { at: 0.48, lane: 2, gold: true }, { at: 0.7, lane: 1 },
    ]),
    stagePack(2, "מסדרון הגבינה", 28000, [
      { at: 0.2, lane: 1, type: "scout", hp: 1 }, { at: 0.4, lane: 0, type: "bomber", hp: 2 },
      { at: 0.6, lane: 2, type: "ninja", hp: 1 }, { at: 0.78, lane: 1, type: "scout", hp: 1 },
    ], [
      { at: 0.1, lane: 0, gold: true }, { at: 0.22, lane: 1 }, { at: 0.35, lane: 2 }, { at: 0.5, lane: 0 },
      { at: 0.65, lane: 1, gold: true }, { at: 0.8, lane: 2 },
    ]),
    stagePack(2, "שף ברוקולי", 48000, [
      { at: 0.18, lane: 0, type: "bomber", hp: 2 }, { at: 0.35, lane: 2, type: "ninja", hp: 1 },
      { at: 0.55, lane: 1, type: "bomber", hp: 2 }, { at: 0.72, lane: 0, type: "scout", hp: 1 },
    ], [
      { at: 0.12, lane: 1, gold: true }, { at: 0.4, lane: 2 }, { at: 0.6, lane: 0, gold: true },
    ], { hp: 7, name: "שף ברוקולי", variant: "boss" }),

    stagePack(3, "גגות NY", 32000, [
      { at: 0.12, lane: 1, type: "ninja", hp: 1 }, { at: 0.25, lane: 0, type: "ninja", hp: 1 },
      { at: 0.4, lane: 2, type: "bomber", hp: 2 }, { at: 0.55, lane: 1, type: "ninja", hp: 1 },
      { at: 0.7, lane: 0, type: "scout", hp: 1 }, { at: 0.85, lane: 2, type: "ninja", hp: 1 },
    ], [
      { at: 0.1, lane: 2 }, { at: 0.3, lane: 0, gold: true }, { at: 0.5, lane: 1 }, { at: 0.75, lane: 2, gold: true },
    ]),
    stagePack(3, "קפיצה בין גגות", 34000, [
      { at: 0.15, lane: 2, type: "bomber", hp: 2 }, { at: 0.3, lane: 1, type: "ninja", hp: 1 },
      { at: 0.45, lane: 0, type: "ninja", hp: 1 }, { at: 0.6, lane: 2, type: "bomber", hp: 2 },
      { at: 0.75, lane: 1, type: "ninja", hp: 1 }, { at: 0.88, lane: 0, type: "bomber", hp: 2 },
    ], [
      { at: 0.2, lane: 1 }, { at: 0.4, lane: 0, gold: true }, { at: 0.65, lane: 2 }, { at: 0.82, lane: 1 },
    ]),
    stagePack(3, "לילה בניו יורק", 30000, [
      { at: 0.18, lane: 1, type: "ninja", hp: 1 }, { at: 0.35, lane: 0, type: "bomber", hp: 2 },
      { at: 0.52, lane: 2, type: "ninja", hp: 1 }, { at: 0.7, lane: 1, type: "bomber", hp: 2 },
      { at: 0.85, lane: 0, type: "ninja", hp: 1 },
    ], [
      { at: 0.12, lane: 2, gold: true }, { at: 0.4, lane: 1 }, { at: 0.6, lane: 0, gold: true }, { at: 0.8, lane: 2 },
    ]),
    stagePack(3, "שרדר-ברוקולי", 55000, [
      { at: 0.15, lane: 0, type: "ninja", hp: 1 }, { at: 0.3, lane: 2, type: "bomber", hp: 2 },
      { at: 0.45, lane: 1, type: "ninja", hp: 1 }, { at: 0.6, lane: 0, type: "bomber", hp: 2 },
      { at: 0.75, lane: 2, type: "ninja", hp: 1 },
    ], [
      { at: 0.1, lane: 1, gold: true }, { at: 0.35, lane: 0 }, { at: 0.55, lane: 2, gold: true }, { at: 0.8, lane: 1 },
    ], { hp: 10, name: "שרדר-ברוקולי", variant: "boss" }),
  ];

  // ---------- Save ----------
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      return {
        unlocked: Math.min(STAGES.length - 1, Math.max(0, raw.unlocked | 0)),
        stars: Array.isArray(raw.stars) ? raw.stars : Array(STAGES.length).fill(0),
        stickers: Array.isArray(raw.stickers) ? raw.stickers : [],
        turtleId: raw.turtleId || "leo",
        attempts: raw.attempts || {},
      };
    } catch (_) {
      return { unlocked: 0, stars: Array(STAGES.length).fill(0), stickers: [], turtleId: "leo", attempts: {} };
    }
  }
  function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }
  let save = loadSave();

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const screens = {
    start: $("screen-start"), pick: $("screen-pick"), map: $("screen-map"),
    stickers: $("screen-stickers"), game: $("screen-game"), pause: $("screen-pause"),
    clear: $("screen-clear"), retry: $("screen-retry"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    if (name === "pause" || name === "clear" || name === "retry") screens.game.classList.add("active");
    screens[name].classList.add("active");
    if (name === "game" || name === "pause") mode = "game";
    else if (name === "start" || name === "pick") {
      mode = "showcase";
      setShowcaseVisible(true);
    } else {
      mode = "idle";
      showcaseRoot.visible = false;
    }
  }

  function toast(text) {
    const el = $("toast");
    el.hidden = false; el.textContent = text;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 1100);
  }

  function celebrate(text) {
    const el = $("celebration");
    $("cele-text").textContent = text;
    el.hidden = false;
    clearTimeout(celebrate._t);
    celebrate._t = setTimeout(() => { el.hidden = true; }, 1400);
  }

  // ---------- Audio ----------
  let audioCtx = null;
  function unlockAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  }
  function beep(freq, dur, type, gain) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain || 0.07, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + dur);
  }

  // ---------- Three.js core ----------
  const canvas = $("c3d");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false,
    });
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div style="position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#04150f;color:#fff6e0;font-family:Fredoka,sans-serif;text-align:center;padding:24px"><div><h1>צריך WebGL</h1><p>הדפדפן לא הצליח להפעיל תלת־מימד. נסו Safari/Chrome מעודכן באייפד.</p></div></div>'
    );
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04150f);
  scene.fog = new THREE.Fog(0x04150f, 12, 48);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 3.2, 8);

  const hemi = new THREE.HemisphereLight(0xb1ffd0, 0x1a3a2a, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.35);
  sun.position.set(4, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  scene.add(sun);
  const fill = new THREE.PointLight(0x3ecf7a, 0.55, 30);
  fill.position.set(-3, 3, 2);
  scene.add(fill);

  const worldRoot = new THREE.Group();
  scene.add(worldRoot);
  const entityRoot = new THREE.Group();
  scene.add(entityRoot);
  const showcaseRoot = new THREE.Group();
  scene.add(showcaseRoot);

  const fxRoot = new THREE.Group();
  scene.add(fxRoot);
  const gameFX = [];

  let playerMesh = null;
  let mode = "showcase";
  const clock = new THREE.Clock();
  let camShake = 0;
  let prevLane = 1;

  function spawnFX(kind, position, color) {
    let mesh;
    if (kind === "spark" && M.createHitSpark) mesh = M.createHitSpark();
    else if (M.createConfettiBurst) mesh = M.createConfettiBurst(color || 0x3ecf7a);
    else return;
    mesh.position.copy(position);
    fxRoot.add(mesh);
    gameFX.push(mesh);
  }

  function updateAllFX(dt) {
    for (let i = gameFX.length - 1; i >= 0; i--) {
      const alive = M.updateFX ? M.updateFX(gameFX[i], dt) : false;
      if (!alive) {
        fxRoot.remove(gameFX[i]);
        gameFX.splice(i, 1);
      }
    }
  }

  function clearGroup(g) {
    while (g.children.length) {
      const c = g.children[0];
      g.remove(c);
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
  }

  function buildSewer(distance) {
    clearGroup(worldRoot);
    const chunkLen = 20;
    const count = Math.ceil(distance / chunkLen) + 2;
    for (let i = 0; i < count; i++) {
      worldRoot.add(M.createSewerChunk(-i * chunkLen, chunkLen));
    }
  }

  function setWorldTheme(world) {
    if (world === 2) {
      scene.background = new THREE.Color(0x1a1008);
      scene.fog.color.set(0x1a1008);
      hemi.color.set(0xffd0a0); hemi.groundColor.set(0x3a2010);
      sun.color.set(0xffc080);
    } else if (world === 3) {
      scene.background = new THREE.Color(0x081428);
      scene.fog.color.set(0x081428);
      hemi.color.set(0xa0c8ff); hemi.groundColor.set(0x101828);
      sun.color.set(0xc0d8ff);
    } else {
      scene.background = new THREE.Color(0x04150f);
      scene.fog.color.set(0x04150f);
      hemi.color.set(0xb1ffd0); hemi.groundColor.set(0x1a3a2a);
      sun.color.set(0xfff2cc);
    }
  }

  function spawnPlayerMesh(turtleId) {
    if (playerMesh) {
      scene.remove(playerMesh);
      clearGroup(playerMesh);
    }
    const t = TURTLES.find((x) => x.id === turtleId) || TURTLES[0];
    playerMesh = M.createTurtle3D(t.color);
    playerMesh.scale.setScalar(1.15);
    playerMesh.rotation.y = Math.PI; // face down the tunnel (-Z)
    playerMesh.visible = true;
    scene.add(playerMesh);
    return playerMesh;
  }

  // Showcase turtles on start/pick
  let showcaseTurtles = [];
  function setShowcaseVisible(on) {
    showcaseRoot.visible = !!on;
    if (on) {
      buildShowcase();
    }
  }

  function buildShowcase() {
    clearGroup(showcaseRoot);
    showcaseTurtles = [];
    TURTLES.forEach((t, i) => {
      const mesh = M.createTurtle3D(t.color);
      mesh.scale.setScalar(0.95);
      const ang = (i / 4) * Math.PI * 2;
      mesh.position.set(Math.sin(ang) * 3.2, 0, Math.cos(ang) * 3.2 - 1);
      mesh.userData.orbit = ang;
      showcaseRoot.add(mesh);
      showcaseTurtles.push(mesh);
    });
    if (mode !== "game") {
      buildSewer(40);
      setWorldTheme(1);
    }
  }

  // ---------- Game state ----------
  const game = {
    stageIndex: 0,
    running: false,
    paused: false,
    hearts: 3,
    pizzas: 0,
    progress: 0,
    lane: 1,
    laneX: 0,
    invulnUntil: 0,
    shieldUntil: 0,
    pizzaMult: 1,
    boss: null,
    bossHp: 0,
    bossMax: 0,
    entities: [],
    spawnedE: 0,
    spawnedP: 0,
    distance: 60,
    speed: 7,
    hitCooldown: 0,
    attempt: 0,
  };

  function getTurtle() {
    return TURTLES.find((t) => t.id === save.turtleId) || TURTLES[0];
  }

  function updateHud() {
    $("hearts").textContent = "❤".repeat(Math.max(0, game.hearts)) + (game.hearts < 3 ? "🖤".repeat(3 - game.hearts) : "");
    $("pizza-count").textContent = "🍕 " + game.pizzas;
    const stg = STAGES[game.stageIndex];
    $("stage-label").textContent = stg.world + "-" + ((game.stageIndex % 4) + 1);
    const btn = $("btn-super");
    const ready = game.pizzas >= SUPER_COST;
    btn.disabled = !ready;
    btn.classList.toggle("ready", ready);
    $("super-label").textContent = ready ? getTurtle().superName : "כוח על " + Math.min(game.pizzas, SUPER_COST) + "/" + SUPER_COST;
    if (stg.boss) {
      $("boss-hp").hidden = false;
      $("boss-hp").textContent = "🥦 " + "●".repeat(game.bossHp) + "○".repeat(Math.max(0, game.bossMax - game.bossHp));
    } else {
      $("boss-hp").hidden = true;
    }
  }

  function removeEntity(ent) {
    if (!ent) return;
    entityRoot.remove(ent.mesh);
    game.entities = game.entities.filter((e) => e !== ent);
  }

  function spawnEnemyDef(def) {
    const mesh = M.createBroccoli3D(def.type === "boss" ? "boss" : def.type);
    mesh.position.set(LANES_X[def.lane], 0, -game.distance * def.at - 8);
    entityRoot.add(mesh);
    game.entities.push({
      kind: "enemy", type: def.type, hp: def.hp, lane: def.lane, mesh,
      baseLane: def.lane, hit: false,
    });
  }

  function spawnPickupDef(def) {
    const mesh = M.createPizza3D(!!def.gold);
    mesh.scale.setScalar(0.7);
    mesh.position.set(LANES_X[def.lane], 0.7, -game.distance * def.at - 6);
    entityRoot.add(mesh);
    game.entities.push({ kind: "pickup", gold: !!def.gold, lane: def.lane, mesh });
  }

  function startStage(idx) {
    unlockAudio();
    game.stageIndex = idx;
    game.running = true;
    game.paused = false;
    game.hearts = 3;
    game.pizzas = 0;
    game.progress = 0;
    game.lane = 1;
    game.laneX = LANES_X[1];
    game.invulnUntil = 0;
    game.shieldUntil = 0;
    game.pizzaMult = 1;
    game.spawnedE = 0;
    game.spawnedP = 0;
    game.hitCooldown = 0;
    game.attempt = (save.attempts[idx] | 0);
    save.attempts[idx] = game.attempt + 1;
    persist();

    const stg = STAGES[idx];
    game.distance = 18 + stg.lengthMs * 0.0022;
    game.speed = 6.5 + stg.world * 0.4;

    clearGroup(entityRoot);
    game.entities = [];
    setShowcaseVisible(false);
    setWorldTheme(stg.world);
    worldRoot.position.z = 0;
    buildSewer(game.distance + 40);
    spawnPlayerMesh(save.turtleId);
    playerMesh.position.set(game.laneX, 0, 0);
    playerMesh.rotation.y = Math.PI; // face down the tunnel (-Z)

    game.boss = null;
    game.bossHp = 0;
    game.bossMax = 0;
    if (stg.boss) {
      let hp = stg.boss.hp;
      if (game.attempt >= 3) hp = Math.ceil(hp * 0.5);
      game.bossMax = hp;
      game.bossHp = hp;
      const mesh = M.createBroccoli3D("boss");
      mesh.position.set(0, 0, -14);
      entityRoot.add(mesh);
      game.boss = { mesh, hp };
    }

    updateHud();
    showScreen("game");
    $("drag-hint").hidden = false;
    setTimeout(() => { $("drag-hint").hidden = true; }, 2500);
    const banner = $("stage-banner");
    banner.hidden = false;
    banner.textContent = stg.name;
    setTimeout(() => { banner.hidden = true; }, 1400);
    toast("קדימה " + getTurtle().name + "!");
  }

  function hurtPlayer() {
    const now = performance.now();
    if (now < game.invulnUntil) return;
    if (now < game.shieldUntil) return;
    game.hearts -= 1;
    game.invulnUntil = now + 1500;
    beep(160, 0.15, "sawtooth", 0.05);
    updateHud();
    if (playerMesh) {
      playerMesh.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          o.material.emissive.setHex(0xff2222);
          setTimeout(() => o.material.emissive.setHex(0x000000), 250);
        }
      });
    }
    if (game.hearts <= 0) {
      game.running = false;
      showScreen("retry");
    }
  }

  function hitEnemy(ent) {
    if (!ent || ent.hp <= 0) return;
    ent.hp -= 1;
    beep(520, 0.08, "square", 0.07);
    ent.mesh.scale.multiplyScalar(0.92);
    if (ent.hp <= 0) {
      // poof
      ent.mesh.position.y += 0.5;
      removeEntity(ent);
      beep(680, 0.1, "triangle", 0.06);
    }
  }

  function hitBoss() {
    if (!game.boss || game.bossHp <= 0) return;
    const now = performance.now();
    if (now < game.hitCooldown) return;
    game.hitCooldown = now + 450;
    game.bossHp -= 1;
    beep(400, 0.1, "sawtooth", 0.07);
    game.boss.mesh.rotation.y += 0.4;
    updateHud();
    if (game.bossHp <= 0) {
      entityRoot.remove(game.boss.mesh);
      game.boss = null;
      finishStage(true);
    }
  }

  function activateSuper() {
    if (game.pizzas < SUPER_COST || !game.running || game.paused) return;
    game.pizzas -= SUPER_COST;
    updateHud();
    const id = getTurtle().id;
    celebrate(getTurtle().superName);
    beep(660, 0.12, "triangle", 0.08);
    setTimeout(() => beep(880, 0.15, "triangle", 0.08), 80);

    if (id === "leo" || id === "raph") {
      [...game.entities].forEach((e) => {
        if (e.kind === "enemy") removeEntity(e);
      });
      if (id === "raph") hitBoss();
      else if (game.boss) hitBoss();
    } else if (id === "don") {
      game.shieldUntil = performance.now() + 5000;
      game.pizzaMult = 2;
      setTimeout(() => { game.pizzaMult = 1; }, 5000);
      toast("מגן חכם!");
    } else if (id === "mikey") {
      for (let i = 0; i < 8; i++) {
        const mesh = M.createPizza3D(i % 3 === 0);
        mesh.scale.setScalar(0.65);
        mesh.position.set(LANES_X[i % 3], 0.8, -2 - i * 1.2);
        entityRoot.add(mesh);
        game.entities.push({ kind: "pickup", gold: i % 3 === 0, lane: i % 3, mesh });
      }
    }
  }

  function finishStage(bossWin) {
    game.running = false;
    const stars = Math.max(1, game.hearts);
    save.stars[game.stageIndex] = Math.max(save.stars[game.stageIndex] || 0, stars);
    if (game.stageIndex >= save.unlocked && game.stageIndex < STAGES.length - 1) {
      save.unlocked = game.stageIndex + 1;
    }
    const cleared = save.stars.filter((n) => n > 0).length;
    const want = Math.min(STICKERS.length, Math.floor(cleared / 3));
    while (save.stickers.length < want) {
      const next = STICKERS[save.stickers.length];
      if (next) save.stickers.push(next.id);
    }
    persist();

    $("clear-title").textContent = bossWin ? "ניצחנו את הבוס!" : "כל הכבוד!";
    $("stars-row").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
    $("clear-stats").textContent = "פיצות: " + game.pizzas;
    celebrate(bossWin && game.stageIndex === STAGES.length - 1 ? "הצלנו את העיר!" : "קואבונגה!!!");
    showScreen("clear");
  }

  // ---------- Input ----------
  let dragging = false;
  function setLaneFromClientY(clientY) {
    const y = clientY / window.innerHeight;
    // top of screen = lane 0, bottom = lane 2
    let lane = 1;
    if (y < 0.38) lane = 0;
    else if (y > 0.62) lane = 2;
    game.lane = lane;
  }
  function onDown(e) {
    if (!game.running || game.paused) return;
    // ignore UI chrome taps
    const t = e.target;
    if (t && t.closest && t.closest("button, .overlay-card, .hud-btn, .super-btn")) return;
    dragging = true;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setLaneFromClientY(y);
  }
  function onMove(e) {
    if (!dragging || !game.running || game.paused) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setLaneFromClientY(y);
    if (e.cancelable) e.preventDefault();
  }
  function onUp() { dragging = false; }

  // Bind to window so UI overlays cannot block lane dragging
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  document.addEventListener("touchmove", (e) => {
    if (dragging && game.running && !game.paused) e.preventDefault();
  }, { passive: false });

  // ---------- UI builders ----------
  function buildPicker() {
    const grid = $("turtle-grid");
    grid.innerHTML = "";
    TURTLES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "turtle-card";
      btn.dataset.id = t.id;
      btn.innerHTML = '<div class="swatch"></div><div class="name">' + t.name + '</div><div class="meta">' + t.mask + '</div><div class="meta">כוח: ' + t.superName + "</div>";
      btn.addEventListener("click", () => {
        unlockAudio(); beep(520, 0.08, "triangle", 0.07);
        save.turtleId = t.id; persist();
        $("map-turtle-label").textContent = "עם " + t.name + " · " + t.superName;
        buildMap();
        showScreen("map");
      });
      grid.appendChild(btn);
    });
  }

  function buildMap() {
    const board = $("map-board");
    board.innerHTML = "";
    const positions = [
      { x: 14, y: 78 }, { x: 30, y: 62 }, { x: 46, y: 78 }, { x: 60, y: 58 },
      { x: 20, y: 42 }, { x: 36, y: 26 }, { x: 52, y: 40 }, { x: 68, y: 24 },
      { x: 78, y: 40 }, { x: 86, y: 58 }, { x: 74, y: 74 }, { x: 58, y: 86 },
    ];
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "map-path");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    let d = "";
    positions.forEach((p, i) => { d += (i ? " L" : "M") + p.x + " " + p.y; });
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "path-line");
    path.setAttribute("d", d);
    svg.appendChild(path);
    board.appendChild(svg);

    STAGES.forEach((stg, idx) => {
      const p = positions[idx];
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
      else node.classList.add("open");
      if (idx === save.unlocked) node.classList.add("current");
      node.textContent = stg.world + "-" + ((idx % 4) + 1);
      node.addEventListener("click", () => {
        if (locked) { toast("עוד לא נפתח"); return; }
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
      if (save.stickers.indexOf(s.id) !== -1) {
        cell.classList.add("earned");
        cell.textContent = s.label + "\n" + s.id;
      } else cell.textContent = "🔒";
      grid.appendChild(cell);
    });
  }

  // ---------- Loop ----------
  function updateGame(dt, t) {
    if (!game.running || game.paused) return;
    const stg = STAGES[game.stageIndex];

    game.progress += (dt * game.speed) / game.distance;
    // spawn by progress
    while (game.spawnedE < stg.enemies.length && stg.enemies[game.spawnedE].at <= game.progress + 0.05) {
      spawnEnemyDef(stg.enemies[game.spawnedE++]);
    }
    while (game.spawnedP < stg.pickups.length && stg.pickups[game.spawnedP].at <= game.progress + 0.05) {
      spawnPickupDef(stg.pickups[game.spawnedP++]);
    }

    // move world / entities toward +Z (player fixed at z~0, looking down -Z)
    const move = game.speed * dt;
    worldRoot.position.z += move;
    worldRoot.children.forEach((chunk) => {
      if (M.animateSewerChunk) M.animateSewerChunk(chunk, t);
    });

    if (playerMesh) {
      const targetX = LANES_X[game.lane];
      const dxLane = targetX - game.laneX;
      game.laneX += dxLane * Math.min(1, dt * 12);
      playerMesh.position.x = game.laneX;
      playerMesh.position.z = 0;
      // lean into lane change + run cycle
      const lean = THREE.MathUtils.clamp(dxLane * 0.25, -0.45, 0.45);
      playerMesh.rotation.z = lean;
      playerMesh.rotation.y = Math.PI; // face down the tunnel (-Z)
      M.animateTurtleRun(playerMesh, t);
      if (prevLane !== game.lane) {
        prevLane = game.lane;
        camShake = 0.18;
      }
    }

    updateAllFX(dt);

    const px = game.laneX;
    const now = performance.now();

    for (const ent of [...game.entities]) {
      ent.mesh.position.z += move;
      if (ent.kind === "pickup") {
        ent.mesh.rotation.y += dt * 3.5;
        ent.mesh.rotation.x = Math.sin(t * 5) * 0.25;
        ent.mesh.position.y = 0.85 + Math.sin(t * 5 + ent.mesh.position.z) * 0.18;
        const dx = ent.mesh.position.x - px;
        const dz = ent.mesh.position.z - 0;
        if (Math.hypot(dx, dz) < 1.9) {
          game.pizzas += (ent.gold ? 3 : 1) * game.pizzaMult;
          spawnFX("confetti", ent.mesh.position.clone().setY(1), ent.gold ? 0xffd54a : 0xff8a1f);
          removeEntity(ent);
          beep(ent.gold ? 880 : 660, 0.08, "triangle", 0.06);
          updateHud();
        }
      } else if (ent.kind === "enemy") {
        if (M.animateBroccoli) M.animateBroccoli(ent.mesh, t, ent.type);
        if (ent.type === "ninja") {
          ent.mesh.position.x = LANES_X[ent.baseLane] + Math.sin(t * 4 + ent.mesh.id) * 0.7;
        }
        const dx = ent.mesh.position.x - px;
        const dz = ent.mesh.position.z - 0;
        const dist = Math.hypot(dx, dz);
        if (dist < 1.35 && Math.abs(dz) < 1.2 && Math.abs(dx) < 1.2) {
          if (!ent._hitAt || now - ent._hitAt > 280) {
            ent._hitAt = now;
            if (M.triggerAttack) M.triggerAttack(playerMesh);
            hitEnemy(ent);
            spawnFX("spark", ent.mesh.position.clone().setY(1.1));
            camShake = 0.25;
          }
        }
        if (ent.mesh.position.z > 1.2 && Math.abs(ent.mesh.position.x - px) < 1.0) {
          hurtPlayer();
          camShake = 0.35;
          removeEntity(ent);
        }
        if (ent.mesh.position.z > 8) removeEntity(ent);
      }
    }

    if (game.boss) {
      game.boss.mesh.position.z += move * 0.15;
      if (game.boss.mesh.position.z > -6) game.boss.mesh.position.z = -6;
      if (game.boss.mesh.position.z < -16) game.boss.mesh.position.z = -16;
      game.boss.mesh.position.x = Math.sin(t * 1.2) * 1.5;
      if (M.animateBroccoli) M.animateBroccoli(game.boss.mesh, t, "boss");
      const dx = game.boss.mesh.position.x - px;
      const dz = game.boss.mesh.position.z - 0;
      if (Math.hypot(dx, dz) < 2.5) {
        if (M.triggerAttack) M.triggerAttack(playerMesh);
        hitBoss();
        spawnFX("spark", game.boss.mesh.position.clone().setY(2));
        camShake = 0.3;
        if (Math.random() < 0.22 && now > game.invulnUntil) hurtPlayer();
      }
    }

    // shield destroys nearby enemies
    if (now < game.shieldUntil) {
      for (const ent of [...game.entities]) {
        if (ent.kind === "enemy" && Math.hypot(ent.mesh.position.x - px, ent.mesh.position.z) < 2.4) {
          spawnFX("confetti", ent.mesh.position.clone().setY(1), 0x9b59d0);
          removeEntity(ent);
        }
      }
      if (playerMesh) {
        playerMesh.traverse((o) => {
          if (o.isMesh && o.material && o.material.emissive) o.material.emissive.setHex(0x9b59d0);
        });
      }
    } else if (playerMesh && game.pizzaMult === 1) {
      playerMesh.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) o.material.emissive.setHex(0x000000);
      });
    }

    // cinematic camera follow + bob + shake
    camShake = Math.max(0, camShake - dt);
    const bob = Math.sin(t * 12) * 0.08;
    const shakeX = (Math.random() - 0.5) * camShake;
    const shakeY = (Math.random() - 0.5) * camShake;
    const desiredCamX = game.laneX * 0.45 + shakeX;
    camera.position.x += (desiredCamX - camera.position.x) * 0.12;
    camera.position.y = 2.85 + bob + shakeY;
    camera.position.z = 6.4;
    camera.lookAt(game.laneX * 0.25, 1.15, -5);

    if (!stg.boss && game.progress >= 1) finishStage(false);
    if (stg.boss && game.progress >= 1.15 && game.bossHp > 0) {
      // keep going until boss dies — gently pull boss closer
      if (game.boss) game.boss.mesh.position.z += dt * 1.5;
    }
  }

  function updateShowcase(t) {
    showcaseRoot.rotation.y = t * 0.25;
    showcaseTurtles.forEach((mesh, i) => {
      M.animateTurtleIdle(mesh, t + i);
      mesh.rotation.y = t * 0.6 + i;
    });
    camera.position.set(Math.sin(t * 0.2) * 1.5, 3.4, 9);
    camera.lookAt(0, 1.0, 0);
    worldRoot.position.z = (t * 2) % 20;
  }

  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    if (mode === "game") updateGame(dt, t);
    else if (mode === "showcase") updateShowcase(t);
    else {
      camera.position.set(0, 4, 10);
      camera.lookAt(0, 1, -5);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);

  // ---------- Bind UI ----------
  function bind() {
    $("btn-start").addEventListener("click", () => { unlockAudio(); beep(520, 0.1, "triangle", 0.07); buildPicker(); showScreen("pick"); });
    $("btn-back-start").addEventListener("click", () => showScreen("start"));
    $("btn-map-repick").addEventListener("click", () => { buildPicker(); showScreen("pick"); });
    $("btn-stickers").addEventListener("click", () => { buildStickers(); showScreen("stickers"); });
    $("btn-stickers-back").addEventListener("click", () => showScreen("map"));
    $("btn-pause").addEventListener("click", () => {
      if (!game.running) return;
      game.paused = true;
      $("pause-stats").textContent = $("stage-label").textContent + " · 🍕 " + game.pizzas;
      showScreen("pause");
    });
    $("btn-resume").addEventListener("click", () => { game.paused = false; showScreen("game"); });
    $("btn-exit-map").addEventListener("click", () => {
      game.running = false;
      if (playerMesh) playerMesh.visible = false;
      showcaseRoot.visible = false;
      buildMap();
      showScreen("map");
      mode = "idle";
    });
    $("btn-retry-map").addEventListener("click", () => {
      game.running = false;
      if (playerMesh) playerMesh.visible = false;
      showcaseRoot.visible = false;
      buildMap();
      showScreen("map");
      mode = "idle";
    });
    $("btn-retry").addEventListener("click", () => startStage(game.stageIndex));
    $("btn-clear-continue").addEventListener("click", () => {
      if (playerMesh) playerMesh.visible = false;
      showcaseRoot.visible = false;
      buildMap();
      showScreen("map");
      mode = "idle";
    });
    $("btn-super").addEventListener("click", activateSuper);
  }

  // boot
  buildShowcase();
  buildPicker();
  $("map-turtle-label").textContent = "עם " + getTurtle().name;
  bind();
  showScreen("start");
  onResize();
  requestAnimationFrame(frame);
})();
