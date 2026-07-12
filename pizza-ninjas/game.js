(() => {
  "use strict";

  const ASSETS = {
    leo: "assets/leo.png",
    raph: "assets/raph.png",
    don: "assets/don.png",
    mikey: "assets/mikey.png",
    pizza: "assets/pizza.png",
    gold: "assets/pizza-gold.png",
    broccoli: "assets/broccoli.png",
  };

  const TURTLES = [
    { id: "leo", name: "ליאו", mask: "כחול · מנהיג", img: ASSETS.leo, cheer: "ליאו תופס!" },
    { id: "raph", name: "ראף", mask: "אדום · חזק", img: ASSETS.raph, cheer: "ראף בום!" },
    { id: "don", name: "דוני", mask: "סגול · גאון", img: ASSETS.don, cheer: "דוני חכם!" },
    { id: "mikey", name: "מיקי", mask: "כתום · כיף", img: ASSETS.mikey, cheer: "מיקי קואבונגה!" },
  ];

  const CHEERS = [
    "קואבונגה!!!",
    "פיצה!!!",
    "יששש!",
    "אלוף!",
    "עוד אחת!",
    "מטורף!!!",
    "סופר פיצה!",
    "וואו!",
    "נינג'ה!",
    "בום פיצה!",
  ];

  const state = {
    turtle: null,
    score: 0,
    streak: 0,
    running: false,
    paused: false,
    pizzas: [],
    spawnTimer: 0,
    spawnEvery: 850,
    lastTs: 0,
    playerX: 0.5,
    dragging: false,
    crazyUntil: 0,
    nextMilestone: 8,
    audioReady: false,
    comboFlash: 0,
  };

  const els = {
    start: document.getElementById("screen-start"),
    pick: document.getElementById("screen-pick"),
    game: document.getElementById("screen-game"),
    pause: document.getElementById("screen-pause"),
    grid: document.getElementById("turtle-grid"),
    arena: document.getElementById("arena"),
    player: document.getElementById("player"),
    playerImg: document.getElementById("player-img"),
    score: document.getElementById("score"),
    streak: document.getElementById("streak"),
    comboPill: document.getElementById("combo-pill"),
    comboLabel: document.getElementById("combo-label"),
    toast: document.getElementById("toast"),
    crazy: document.getElementById("crazy-banner"),
    catchFx: document.getElementById("catch-fx"),
    cele: document.getElementById("celebration"),
    celeText: document.getElementById("cele-text"),
    pauseStats: document.getElementById("pause-stats"),
    floatLayer: document.querySelector(".floating-pizzas"),
  };

  let audioCtx = null;

  function showScreen(name) {
    [els.start, els.pick, els.game, els.pause].forEach((s) => s.classList.remove("active"));
    if (name === "start") els.start.classList.add("active");
    if (name === "pick") els.pick.classList.add("active");
    if (name === "game") els.game.classList.add("active");
    if (name === "pause") {
      els.game.classList.add("active");
      els.pause.classList.add("active");
    }
  }

  function unlockAudio() {
    if (state.audioReady) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(audioCtx.destination);
      src.start(0);
      state.audioReady = true;
    } catch (_) {
      /* ignore */
    }
  }

  function beep(freq, dur, type = "square", gain = 0.08) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  function sfxCatch(gold) {
    beep(gold ? 660 : 440, 0.08, "square", 0.09);
    setTimeout(() => beep(gold ? 880 : 660, 0.12, "triangle", 0.07), 60);
    if (gold) setTimeout(() => beep(1046, 0.15, "sine", 0.06), 120);
  }

  function sfxMiss() {
    beep(180, 0.15, "sawtooth", 0.04);
    setTimeout(() => beep(120, 0.2, "sawtooth", 0.03), 80);
  }

  function sfxCelebrate() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      setTimeout(() => beep(f, 0.18, "triangle", 0.09), i * 80);
    });
  }

  function preloadAssets() {
    Object.values(ASSETS).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  function buildFloatingPizzas() {
    const layer = els.floatLayer;
    if (!layer) return;
    layer.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const img = document.createElement("img");
      img.className = "float-item";
      img.src = i % 4 === 0 ? ASSETS.gold : ASSETS.pizza;
      img.alt = "";
      img.style.left = `${4 + i * 9.5}%`;
      img.style.animationDuration = `${6 + (i % 5)}s`;
      img.style.animationDelay = `${i * 0.55}s`;
      layer.appendChild(img);
    }
  }

  function buildTurtlePicker() {
    els.grid.innerHTML = "";
    TURTLES.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "turtle-card";
      btn.type = "button";
      btn.dataset.id = t.id;
      btn.innerHTML = `
        <div class="avatar" aria-hidden="true"><img src="${t.img}" alt="" /></div>
        <div class="name">${t.name}</div>
        <div class="mask">${t.mask}</div>
      `;
      btn.addEventListener("click", () => startGame(t));
      els.grid.appendChild(btn);
    });
  }

  function startGame(turtle) {
    unlockAudio();
    state.turtle = turtle;
    state.score = 0;
    state.streak = 0;
    state.running = true;
    state.paused = false;
    state.pizzas = [];
    state.spawnTimer = 0;
    state.spawnEvery = 850;
    state.playerX = 0.5;
    state.crazyUntil = 0;
    state.nextMilestone = 8;
    state.lastTs = 0;
    state.comboFlash = 0;

    els.arena.querySelectorAll(".pizza").forEach((p) => p.remove());
    els.arena.classList.remove("crazy-mode", "shake");
    els.player.className = `turtle-player mask-${turtle.id}`;
    els.playerImg.src = turtle.img;
    els.player.style.left = "50%";
    els.crazy.hidden = true;
    els.comboPill.hidden = true;
    updateHud();
    showScreen("game");
    requestAnimationFrame(loop);
    showToast(turtle.cheer);
    beep(520, 0.1, "triangle", 0.08);
  }

  function updateHud() {
    els.score.textContent = String(state.score);
    els.streak.textContent = String(state.streak);
    if (state.streak >= 3) {
      els.comboPill.hidden = false;
      els.comboLabel.textContent = `×${state.streak}`;
    } else {
      els.comboPill.hidden = true;
    }
  }

  function showToast(text) {
    els.toast.hidden = false;
    els.toast.textContent = text;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 900);
  }

  function celebrate(text) {
    sfxCelebrate();
    els.cele.hidden = false;
    els.celeText.textContent = text;
    shakeArena();
    clearTimeout(celebrate._t);
    celebrate._t = setTimeout(() => {
      els.cele.hidden = true;
    }, 1200);
  }

  function shakeArena() {
    els.arena.classList.remove("shake");
    void els.arena.offsetWidth;
    els.arena.classList.add("shake");
    clearTimeout(shakeArena._t);
    shakeArena._t = setTimeout(() => els.arena.classList.remove("shake"), 450);
  }

  function burst(x, y, gold) {
    const wave = document.createElement("div");
    wave.className = "shockwave";
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    els.catchFx.appendChild(wave);
    setTimeout(() => wave.remove(), 500);

    for (let i = 0; i < 12; i++) {
      const crumb = document.createElement(i % 3 === 0 ? "div" : "img");
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 50 + Math.random() * 80;
      crumb.style.left = `${x}px`;
      crumb.style.top = `${y}px`;
      crumb.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      crumb.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);

      if (crumb.tagName === "IMG") {
        crumb.className = "crumb";
        crumb.src = gold ? ASSETS.gold : i % 2 === 0 ? ASSETS.pizza : ASSETS.gold;
        crumb.alt = "";
      } else {
        crumb.className = "crumb emoji";
        crumb.textContent = gold ? "⭐" : "✨";
      }
      els.catchFx.appendChild(crumb);
      setTimeout(() => crumb.remove(), 750);
    }
  }

  function spawnPizza() {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pizza";
    el.setAttribute("aria-label", "פיצה");

    const roll = Math.random();
    let kind = "normal";
    if (roll > 0.9) kind = "gold";
    else if (roll < 0.07 && state.score > 4) kind = "bomb";

    const img = document.createElement("img");
    img.alt = "";
    if (kind === "gold") {
      el.classList.add("gold");
      img.src = ASSETS.gold;
    } else if (kind === "bomb") {
      el.classList.add("bomb");
      img.src = ASSETS.broccoli;
    } else {
      img.src = ASSETS.pizza;
    }
    el.appendChild(img);

    const x = 0.1 + Math.random() * 0.8;
    el.style.left = `${x * 100}%`;
    els.arena.appendChild(el);

    const crazy = performance.now() < state.crazyUntil;
    const speed =
      (kind === "gold" ? 0.24 : kind === "bomb" ? 0.14 : 0.17) +
      Math.min(state.score, 100) * 0.0018 +
      (crazy ? 0.14 : 0);

    const pizza = {
      el,
      x,
      y: -0.1,
      speed,
      kind,
      radius: kind === "gold" ? 0.065 : 0.055,
      wobble: Math.random() * Math.PI * 2,
      alive: true,
    };

    el.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (!state.running || state.paused || !pizza.alive) return;
      catchPizza(pizza, true);
    });

    state.pizzas.push(pizza);
  }

  function catchPizza(pizza, tapped) {
    if (!pizza.alive) return;
    pizza.alive = false;
    pizza.el.remove();

    const rect = els.arena.getBoundingClientRect();
    const px = pizza.x * rect.width;
    const py = Math.max(40, pizza.y * rect.height);

    if (pizza.kind === "bomb") {
      state.streak = 0;
      sfxMiss();
      showToast("ברוקולי? יאק!");
      burst(px, py, false);
      shakeArena();
      updateHud();
      return;
    }

    const comboBonus = state.streak >= 5 ? 1 : 0;
    const points = (pizza.kind === "gold" ? 5 : 1) + comboBonus;
    state.score += points;
    state.streak += 1;
    sfxCatch(pizza.kind === "gold");
    burst(px, py, pizza.kind === "gold");

    els.player.classList.remove("catching");
    void els.player.offsetWidth;
    els.player.classList.add("catching");

    if (pizza.kind === "gold") showToast(`פיצה זהב! +${points}`);
    else if (tapped) showToast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    else if (state.streak > 0 && state.streak % 4 === 0) showToast(`רצף ${state.streak}!`);

    if (state.score >= state.nextMilestone) {
      celebrate(state.nextMilestone >= 24 ? "מטורף לגמרי!!!" : "קואבונגה!!!");
      state.nextMilestone += 8;
      startCrazyMode();
    }

    if (state.streak === 6 || state.streak === 12) {
      startCrazyMode();
      showToast("סערת פיצות!");
    }

    updateHud();
  }

  function startCrazyMode() {
    state.crazyUntil = performance.now() + 5200;
    state.spawnEvery = 240;
    els.crazy.hidden = false;
    els.arena.classList.add("crazy-mode");
    shakeArena();
    clearTimeout(startCrazyMode._t);
    startCrazyMode._t = setTimeout(() => {
      els.crazy.hidden = true;
      els.arena.classList.remove("crazy-mode");
      state.spawnEvery = Math.max(380, 850 - state.score * 4);
    }, 5200);
  }

  function setPlayerFromClientX(clientX) {
    const rect = els.arena.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    state.playerX = Math.min(0.9, Math.max(0.1, x));
    els.player.style.left = `${state.playerX * 100}%`;
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(40, ts - state.lastTs);
    state.lastTs = ts;

    if (!state.paused) {
      const crazy = ts < state.crazyUntil;
      state.spawnTimer += dt;
      const every = crazy ? 180 : state.spawnEvery;
      if (state.spawnTimer >= every) {
        state.spawnTimer = 0;
        spawnPizza();
        if (crazy && Math.random() > 0.35) spawnPizza();
        if (crazy && Math.random() > 0.7) spawnPizza();
      }

      const rect = els.arena.getBoundingClientRect();
      const playerY = 1 - (110 + 28) / rect.height;
      const catchR = 0.11;

      for (const pizza of state.pizzas) {
        if (!pizza.alive) continue;
        pizza.y += pizza.speed * (dt / 1000);
        pizza.wobble += dt * 0.004;
        const sway = Math.sin(pizza.wobble) * 0.012;
        const drawX = pizza.x + sway;
        pizza.el.style.left = `${drawX * 100}%`;
        pizza.el.style.top = `${pizza.y * 100}%`;

        const dx = drawX - state.playerX;
        const dy = pizza.y - playerY;
        if (Math.hypot(dx, dy) < catchR + pizza.radius) {
          catchPizza(pizza, false);
          continue;
        }

        if (pizza.y > 1.14) {
          pizza.alive = false;
          pizza.el.remove();
          if (pizza.kind !== "bomb") {
            state.streak = 0;
            updateHud();
          }
        }
      }

      state.pizzas = state.pizzas.filter((p) => p.alive);
    }

    requestAnimationFrame(loop);
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = true;
    els.pauseStats.textContent = `פיצות: ${state.score} · רצף: ${state.streak}`;
    showScreen("pause");
  }

  function resumeGame() {
    state.paused = false;
    state.lastTs = 0;
    showScreen("game");
  }

  function bindControls() {
    const arena = els.arena;

    const onDown = (e) => {
      if (!state.running || state.paused) return;
      unlockAudio();
      state.dragging = true;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPlayerFromClientX(x);
    };

    const onMove = (e) => {
      if (!state.dragging || !state.running || state.paused) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setPlayerFromClientX(x);
      e.preventDefault();
    };

    const onUp = () => {
      state.dragging = false;
    };

    arena.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    arena.addEventListener(
      "touchmove",
      (e) => {
        if (state.dragging) e.preventDefault();
      },
      { passive: false }
    );

    document.getElementById("btn-start").addEventListener("click", () => {
      unlockAudio();
      showScreen("pick");
    });
    document.getElementById("btn-back-start").addEventListener("click", () => showScreen("start"));
    document.getElementById("btn-pause").addEventListener("click", pauseGame);
    document.getElementById("btn-resume").addEventListener("click", resumeGame);
    document.getElementById("btn-restart").addEventListener("click", () => {
      state.running = false;
      state.paused = false;
      els.arena.querySelectorAll(".pizza").forEach((p) => p.remove());
      state.pizzas = [];
      els.arena.classList.remove("crazy-mode");
      showScreen("pick");
    });

    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.target.closest("#arena")) e.preventDefault();
      },
      { passive: false }
    );
  }

  function init() {
    preloadAssets();
    buildFloatingPizzas();
    buildTurtlePicker();
    bindControls();
    showScreen("start");
  }

  init();
})();
