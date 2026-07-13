/* audio.js — window.GameAudio
 * Pure WebAudio synthesis (no asset files) for the Pizza Ninjas kids game.
 * Gentle, upbeat, non-startling. Low master gain. Never throws if AudioContext
 * is unavailable. All timing driven off the AudioContext clock.
 *
 * Public API:
 *   GameAudio.unlock()
 *   GameAudio.startMusic(world) / GameAudio.stopMusic()
 *   GameAudio.sfx(name)
 *   GameAudio.toggleMute() -> boolean
 *   GameAudio.isMuted() -> boolean
 *   GameAudio.setMuted(bool)
 */
(function () {
  'use strict';

  var MASTER_GAIN = 0.18;
  var MUTE_KEY = 'ninja-muted';

  // ---- persisted mute ------------------------------------------------------
  var muted = false;
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) { muted = false; }

  function persistMute() {
    try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
  }

  // ---- audio graph state ---------------------------------------------------
  var AC = window.AudioContext || window.webkitAudioContext || null;
  var ctx = null;         // AudioContext
  var master = null;      // master GainNode -> destination
  var musicGain = null;   // music sub-bus
  var sfxGain = null;     // sfx sub-bus

  // scheduler state
  var musicWorld = 0;         // 0 = stopped
  var schedulerTimer = null;  // setInterval id for look-ahead
  var nextNoteTime = 0;       // AC time of next scheduled step
  var stepIndex = 0;          // global step counter into the pattern
  var LOOKAHEAD_MS = 25;      // how often the JS scheduler runs
  var SCHEDULE_AHEAD = 0.15;  // seconds of audio scheduled ahead

  // musical timing
  var BPM = 108;
  var STEP = (60 / BPM) / 2;  // eighth-note step in seconds

  function ok() { return ctx && master; }

  // ---- lazy context creation ----------------------------------------------
  function ensureCtx() {
    if (ctx) return ctx;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_GAIN;
      master.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.9;
      musicGain.connect(master);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 1.0;
      sfxGain.connect(master);
    } catch (e) {
      ctx = null; master = null; musicGain = null; sfxGain = null;
      return null;
    }
    return ctx;
  }

  function unlock() {
    if (!AC) return;
    if (!ensureCtx()) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch (e) {}
    // apply persisted mute to a freshly created context
    applyMasterGain(false);
  }

  function applyMasterGain(smooth) {
    if (!ok()) return;
    var target = muted ? 0 : MASTER_GAIN;
    try {
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      if (smooth) {
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(target, now + 0.08);
      } else {
        master.gain.setValueAtTime(target, now);
      }
    } catch (e) {}
  }

  // ---- small synth helpers -------------------------------------------------
  // ADSR-ish gain envelope on a fresh gain node.
  function envGain(t0, peak, a, d, s, sLevel, r) {
    var g = ctx.createGain();
    var end = t0 + a + d + s + r;
    try {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + a);
      g.gain.linearRampToValueAtTime(peak * sLevel, t0 + a + d);
      g.gain.setValueAtTime(peak * sLevel, t0 + a + d + s);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    } catch (e) {}
    return { node: g, end: end };
  }

  // Play a single tone into a destination bus.
  function tone(opts, dest) {
    if (!ok()) return 0;
    var t0 = opts.t != null ? opts.t : ctx.currentTime;
    var freq = opts.freq || 440;
    var type = opts.type || 'sine';
    var peak = opts.gain != null ? opts.gain : 0.3;
    var a = opts.a != null ? opts.a : 0.005;
    var d = opts.d != null ? opts.d : 0.05;
    var s = opts.s != null ? opts.s : 0.0;
    var sLevel = opts.sLevel != null ? opts.sLevel : 0.6;
    var r = opts.r != null ? opts.r : 0.08;

    try {
      var osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.freq2 != null) {
        // pitch glide (sweeps)
        var mode = opts.glide === 'exp' ? 'exponentialRampToValueAtTime'
                                        : 'linearRampToValueAtTime';
        osc.frequency[mode](opts.freq2, t0 + (opts.glideT || (a + d + s + r)));
      }
      if (opts.detune) osc.detune.setValueAtTime(opts.detune, t0);

      var env = envGain(t0, peak, a, d, s, sLevel, r);
      osc.connect(env.node);

      var outNode = env.node;
      // optional gentle lowpass to keep timbres soft
      if (opts.lp) {
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(opts.lp, t0);
        env.node.connect(lp);
        outNode = lp;
      }
      outNode.connect(dest || sfxGain);

      osc.start(t0);
      osc.stop(env.end + 0.02);
      return env.end;
    } catch (e) { return 0; }
  }

  // Soft noise burst (for lands, whooshes) — band-limited, gentle.
  function noise(opts, dest) {
    if (!ok()) return 0;
    var t0 = opts.t != null ? opts.t : ctx.currentTime;
    var dur = opts.dur || 0.15;
    var peak = opts.gain != null ? opts.gain : 0.15;
    try {
      var frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
      var buf = ctx.createBuffer(1, frames, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < frames; i++) {
        // soft-ish noise, fades toward the end handled by env
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;

      var bp = ctx.createBiquadFilter();
      bp.type = opts.filter || 'bandpass';
      bp.frequency.setValueAtTime(opts.freq || 900, t0);
      if (opts.freq2 != null) {
        bp.frequency.linearRampToValueAtTime(opts.freq2, t0 + dur);
      }
      bp.Q.setValueAtTime(opts.q != null ? opts.q : 0.7, t0);

      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + Math.min(0.02, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      src.connect(bp); bp.connect(g); g.connect(dest || sfxGain);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      return t0 + dur;
    } catch (e) { return 0; }
  }

  // ---- SFX definitions -----------------------------------------------------
  // Note frequency helper (equal temperament, A4=440).
  function nf(semisFromA4) { return 440 * Math.pow(2, semisFromA4 / 12); }

  // Convenience: a happy little arpeggio ding.
  function ding(base, steps, type, gain, spacing, dest) {
    var t = ctx.currentTime;
    spacing = spacing || 0.06;
    for (var i = 0; i < steps.length; i++) {
      tone({
        t: t + i * spacing,
        freq: base * Math.pow(2, steps[i] / 12),
        type: type || 'triangle',
        gain: gain != null ? gain : 0.28,
        a: 0.004, d: 0.08, s: 0.02, sLevel: 0.4, r: 0.14,
        lp: 5200
      }, dest || sfxGain);
    }
  }

  var SFX = {
    select: function () {
      ding(nf(0), [0, 7], 'triangle', 0.26, 0.05);
    },
    start: function () {
      // rising "here we go!" arpeggio
      ding(nf(-5), [0, 4, 7, 12], 'triangle', 0.26, 0.07);
    },
    tap: function () {
      tone({ freq: nf(4), type: 'triangle', gain: 0.2, a: 0.003, d: 0.05, r: 0.06, lp: 4000 });
    },
    jump: function () {
      // quick upward blip
      tone({ freq: nf(0), freq2: nf(12), glide: 'exp', glideT: 0.16, type: 'triangle',
             gain: 0.24, a: 0.004, d: 0.02, s: 0.06, sLevel: 0.7, r: 0.06, lp: 4500 });
    },
    land: function () {
      // soft thump: low sine + gentle noise pat
      tone({ freq: nf(-17), freq2: nf(-24), glide: 'exp', glideT: 0.12, type: 'sine',
             gain: 0.26, a: 0.002, d: 0.1, r: 0.05, lp: 900 });
      noise({ freq: 500, gain: 0.06, dur: 0.09, q: 0.6 });
    },
    pizza: function () {
      // happy two-note ding
      ding(nf(7), [0, 5], 'triangle', 0.26, 0.05);
    },
    gold: function () {
      // sparkly three-note ding, brighter
      ding(nf(12), [0, 4, 9], 'triangle', 0.24, 0.045);
      tone({ t: ctx ? ctx.currentTime + 0.02 : 0, freq: nf(24), type: 'sine',
             gain: 0.08, a: 0.004, d: 0.12, r: 0.12, lp: 8000 });
    },
    combo: function () {
      // bright ascending run
      ding(nf(7), [0, 2, 4, 7, 11], 'square', 0.16, 0.05);
    },
    hit: function () {
      // soft, non-scary "boing" bump — low and short, not harsh
      tone({ freq: nf(-9), freq2: nf(-16), glide: 'exp', glideT: 0.18, type: 'sine',
             gain: 0.24, a: 0.004, d: 0.12, s: 0.02, sLevel: 0.5, r: 0.08, lp: 700 });
    },
    power: function () {
      // rising sweep + shimmer
      tone({ freq: nf(-12), freq2: nf(12), glide: 'exp', glideT: 0.4, type: 'triangle',
             gain: 0.2, a: 0.02, d: 0.05, s: 0.25, sLevel: 0.8, r: 0.12, lp: 6000 });
      ding(nf(12), [0, 7, 12], 'sine', 0.1, 0.12);
    },
    win: function () {
      // triumphant major arpeggio
      ding(nf(0), [0, 4, 7, 12, 16], 'triangle', 0.26, 0.09);
    },
    lose: function () {
      // gentle "aww" — soft descending, NOT harsh (kids never truly fail)
      ding(nf(4), [0, -2, -5], 'triangle', 0.2, 0.12);
    },
    star: function () {
      // twinkly high ding
      ding(nf(19), [0, 5, 7], 'sine', 0.16, 0.06);
    },
    whoosh: function () {
      // airy swept noise
      noise({ freq: 1400, freq2: 400, gain: 0.12, dur: 0.28, filter: 'bandpass', q: 0.5 });
    },
    boss: function () {
      // friendly big low "hello" — a couple of round low notes, not menacing
      ding(nf(-17), [0, 3, 5], 'sine', 0.24, 0.14, sfxGain);
      tone({ freq: nf(-29), type: 'sine', gain: 0.16, a: 0.02, d: 0.2, s: 0.2, sLevel: 0.5, r: 0.2, lp: 500 });
    }
  };

  function sfx(name) {
    if (!AC) return;
    if (!ensureCtx()) return;
    if (muted) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch (e) {}
    var fn = SFX[name];
    if (!fn) return;
    try { fn(); } catch (e) {}
  }

  // ---- Music: look-ahead scheduler ----------------------------------------
  // Per-world flavor: scale, lead timbre, bass timbre, pad.
  // Melodies are pentatonic-ish and gentle. 16-step loop.
  var WORLDS = {
    1: { // sewer — mellow, teal/green, soft square lead + round bass
      root: nf(-9),           // ~C4-ish region
      lead: 'triangle',
      bass: 'sine',
      lp: 2600,
      leadGain: 0.11,
      bassGain: 0.13,
      // scale degrees (semitones) — minor pentatonic, calm
      mel: [0, 3, 5, 7, 5, 3, 0, -2, 0, 3, 7, 10, 7, 5, 3, 0],
      bassSeq: [0, 0, -5, -5, -7, -7, -5, -5],
      arp: false
    },
    2: { // kitchen — warm, bouncy, happy major, triangle lead
      root: nf(-2),           // brighter
      lead: 'triangle',
      bass: 'triangle',
      lp: 3200,
      leadGain: 0.1,
      bassGain: 0.12,
      mel: [0, 4, 7, 9, 7, 4, 12, 9, 7, 4, 0, 4, 7, 12, 9, 7],
      bassSeq: [0, 0, 5, 5, -3, -3, 5, 7],
      arp: true
    },
    3: { // rooftops night — airy, dreamy, sine lead, sparse
      root: nf(3),            // higher, floaty
      lead: 'sine',
      bass: 'sine',
      lp: 3600,
      leadGain: 0.1,
      bassGain: 0.1,
      mel: [0, 5, 7, 12, 10, 7, 5, 0, 3, 7, 10, 12, 15, 12, 10, 7],
      bassSeq: [0, 0, 0, -5, -7, -7, -5, 0],
      arp: false
    }
  };

  function currentWorldCfg() {
    return WORLDS[musicWorld] || WORLDS[1];
  }

  // schedule one 16-step bar-worth of notes as they come due
  function scheduleStep(cfg, step, time) {
    if (!ok()) return;
    var i = step % 16;

    // --- lead melody (every step, but rest some steps for gentleness) ---
    var deg = cfg.mel[i];
    // gentle rest pattern: skip a couple steps to breathe
    var rest = (i === 6 || i === 14);
    if (!rest) {
      var f = cfg.root * Math.pow(2, deg / 12);
      tone({
        t: time, freq: f, type: cfg.lead,
        gain: cfg.leadGain,
        a: 0.01, d: 0.06, s: STEP * 0.5, sLevel: 0.5, r: 0.12,
        lp: cfg.lp
      }, musicGain);
      // soft octave-up sparkle occasionally
      if (cfg.arp && (i % 4 === 0)) {
        tone({ t: time, freq: f * 2, type: 'sine', gain: cfg.leadGain * 0.4,
               a: 0.01, d: 0.05, s: 0.02, sLevel: 0.3, r: 0.14, lp: 7000 }, musicGain);
      }
    }

    // --- bass on quarter notes (every 2 steps) ---
    if (i % 2 === 0) {
      var bIdx = (i / 2) % cfg.bassSeq.length;
      var bf = cfg.root * Math.pow(2, (cfg.bassSeq[bIdx] - 12) / 12);
      tone({
        t: time, freq: bf, type: cfg.bass,
        gain: cfg.bassGain,
        a: 0.01, d: 0.08, s: STEP * 0.7, sLevel: 0.5, r: 0.16,
        lp: 1400
      }, musicGain);
    }

    // --- soft percussion tick (gentle, not a snare) ---
    if (i % 4 === 2) {
      noise({ t: time, freq: 3200, gain: 0.03, dur: 0.05, filter: 'highpass', q: 0.5 }, musicGain);
    }
  }

  function schedulerTick() {
    if (!ok() || musicWorld === 0) return;
    var cfg = currentWorldCfg();
    try {
      while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
        scheduleStep(cfg, stepIndex, nextNoteTime);
        nextNoteTime += STEP;
        stepIndex++;
      }
    } catch (e) {}
  }

  function startMusic(world) {
    if (!AC) return;
    if (!ensureCtx()) return;
    world = (world === 2 || world === 3) ? world : 1;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch (e) {}

    // if already playing this world, do nothing
    if (musicWorld === world && schedulerTimer !== null) return;

    // (re)start scheduler
    stopScheduler();
    musicWorld = world;
    stepIndex = 0;
    try { nextNoteTime = ctx.currentTime + 0.08; } catch (e) { nextNoteTime = 0; }

    // prime immediately then keep ticking
    schedulerTick();
    schedulerTimer = window.setInterval(schedulerTick, LOOKAHEAD_MS);
  }

  function stopScheduler() {
    if (schedulerTimer !== null) {
      try { window.clearInterval(schedulerTimer); } catch (e) {}
      schedulerTimer = null;
    }
  }

  function stopMusic() {
    stopScheduler();
    musicWorld = 0;
    // fade the music bus quickly to avoid clicks; scheduled tails ring out.
    if (ok() && musicGain) {
      try {
        var now = ctx.currentTime;
        musicGain.gain.cancelScheduledValues(now);
        musicGain.gain.setValueAtTime(musicGain.gain.value, now);
        musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
        musicGain.gain.setValueAtTime(0.9, now + 0.2);
      } catch (e) {}
    }
  }

  // ---- mute API ------------------------------------------------------------
  function setMuted(v) {
    muted = !!v;
    persistMute();
    applyMasterGain(true);
  }
  function toggleMute() {
    setMuted(!muted);
    return muted;
  }
  function isMuted() { return muted; }

  // ---- export --------------------------------------------------------------
  window.GameAudio = {
    unlock: unlock,
    startMusic: startMusic,
    stopMusic: stopMusic,
    sfx: sfx,
    toggleMute: toggleMute,
    isMuted: isMuted,
    setMuted: setMuted
  };
})();
