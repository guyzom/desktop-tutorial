/* meshes.js — window.GameArt
 * Pure procedural Three.js (r160). Bright, saturated cartoon/toon look.
 * Adorable heroic ninja turtles + friendly veggie foes + pizza + 3 worlds.
 * Everything is a THREE.Group. iPad-friendly poly counts.
 * Models face -Z (into the tunnel), feet rest at y = 0.
 */
(function (global) {
  "use strict";

  var THREE = global.THREE;

  // =====================================================================
  //  helpers
  // =====================================================================

  function shadowify(root, cast, receive) {
    cast = cast !== false; receive = receive !== false;
    root.traverse(function (o) {
      if (o.isMesh && !o.userData.noShadow) { o.castShadow = cast; o.receiveShadow = receive; }
    });
  }

  // capsule-ish limb whose pivot is at the TOP; extends down by `len`.
  function limbSeg(radTop, radBot, len, mat) {
    var g = new THREE.Group();
    var mesh;
    if (THREE.CapsuleGeometry && Math.abs(radTop - radBot) < 1e-4) {
      mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radTop, Math.max(0.01, len - radTop * 2), 6, 12), mat);
    } else {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(radTop, radBot, len, 14), mat);
    }
    mesh.position.y = -len / 2;
    g.add(mesh);
    g.userData.limbMesh = mesh;
    return g;
  }

  // toon outline: dark backface shell clone (classic cartoon silhouette)
  var OUTLINE_MAT = null;
  function outlineMat() {
    if (!OUTLINE_MAT) OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x0b2f14, side: THREE.BackSide });
    return OUTLINE_MAT;
  }
  function addOutline(mesh, scale) {
    var o = new THREE.Mesh(mesh.geometry, outlineMat());
    o.scale.setScalar(scale || 1.07);
    o.userData.noShadow = true;
    o.castShadow = false; o.receiveShadow = false;
    mesh.add(o);
    return o;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function srgb(tex) { if (tex && "colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace; return tex; }

  // =====================================================================
  //  shared textures (cached)
  // =====================================================================

  var _tex = {};

  function shellTexture() {
    if (_tex.shell) return _tex.shell;
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 104, 18, 128, 128, 150);
    g.addColorStop(0, "#b07d3c");
    g.addColorStop(0.55, "#875327");
    g.addColorStop(1, "#5c3617");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(46,26,10,0.9)"; ctx.lineJoin = "round";
    function hex(cx, cy, r) {
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      var gg = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.2, cx, cy, r);
      gg.addColorStop(0, "rgba(214,168,96,0.85)"); gg.addColorStop(1, "rgba(150,104,52,0.65)");
      ctx.fillStyle = gg; ctx.fill();
      ctx.stroke();
    }
    hex(128, 120, 48);
    [[128, 50], [198, 92], [198, 160], [128, 198], [58, 160], [58, 92]].forEach(function (p) { hex(p[0], p[1], 38); });
    _tex.shell = srgb(new THREE.CanvasTexture(c));
    return _tex.shell;
  }

  // freckled/spotted green turtle skin
  function skinTexture() {
    if (_tex.skin) return _tex.skin;
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#83d24f"); g.addColorStop(1, "#5cae32");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    // soft mottling
    for (var m = 0; m < 40; m++) {
      ctx.fillStyle = "rgba(120,196,74," + (0.05 + Math.random() * 0.12) + ")";
      ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 22, 0, Math.PI * 2); ctx.fill();
    }
    // freckles (darker green speckles, like the reference art)
    for (var i = 0; i < 210; i++) {
      var dark = Math.random() < 0.78;
      ctx.fillStyle = dark ? "rgba(52,120,30,0.55)" : "rgba(168,224,110,0.5)";
      var r = 1.2 + Math.random() * 3.4;
      ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2); ctx.fill();
    }
    var t = srgb(new THREE.CanvasTexture(c));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _tex.skin = t; return t;
  }

  function brickTexture() {
    if (_tex.brick) return _tex.brick;
    var w = 512, h = 512, c = document.createElement("canvas");
    c.width = w; c.height = h; var ctx = c.getContext("2d");
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#2b4b48"); grad.addColorStop(1, "#20403e");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    var cols = 6, rows = 10, bw = w / cols, bh = h / rows;
    for (var r = 0; r < rows; r++) {
      var off = (r % 2) * (bw / 2);
      for (var cn = -1; cn <= cols; cn++) {
        var x = cn * bw + off + 3, y = r * bh + 3;
        var shade = 0.7 + Math.random() * 0.4;
        var R = Math.floor(70 * shade), G = Math.floor(120 * shade), B = Math.floor(112 * shade);
        ctx.fillStyle = "rgb(" + R + "," + G + "," + B + ")";
        roundRect(ctx, x, y, bw - 6, bh - 6, 5); ctx.fill();
        ctx.fillStyle = "rgba(190,240,220,0.16)"; ctx.fillRect(x + 2, y + 2, bw - 12, 4);
        ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(x + 4, y + bh - 13, bw - 14, 5);
      }
    }
    for (var i = 0; i < 130; i++) {
      ctx.fillStyle = "rgba(90,220,150," + (0.06 + Math.random() * 0.18) + ")";
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
    }
    var t = srgb(new THREE.CanvasTexture(c));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    _tex.brick = t; return t;
  }

  function checkerTexture() {
    if (_tex.checker) return _tex.checker;
    var n = 8, s = 64, c = document.createElement("canvas");
    c.width = c.height = n * s; var ctx = c.getContext("2d");
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      ctx.fillStyle = ((x + y) % 2) ? "#e9412e" : "#fbf0da";
      ctx.fillRect(x * s, y * s, s, s);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 2;
    for (var i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, n * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(n * s, i * s); ctx.stroke(); }
    var t = srgb(new THREE.CanvasTexture(c));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    _tex.checker = t; return t;
  }

  function skylineTexture() {
    if (_tex.skyline) return _tex.skyline;
    var w = 1024, h = 256, c = document.createElement("canvas");
    c.width = w; c.height = h; var ctx = c.getContext("2d");
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#2a3b74"); grad.addColorStop(1, "#5566a8");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    // moon
    ctx.fillStyle = "#fff7d8"; ctx.beginPath(); ctx.arc(180, 70, 40, 0, Math.PI * 2); ctx.fill();
    // stars
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (var s = 0; s < 60; s++) { ctx.fillRect(Math.random() * w, Math.random() * h * 0.6, 2, 2); }
    // building silhouettes
    var x = 0;
    while (x < w) {
      var bw = 40 + Math.random() * 90;
      var bh = 60 + Math.random() * 150;
      var shade = 20 + Math.floor(Math.random() * 30);
      ctx.fillStyle = "rgb(" + shade + "," + (shade + 12) + "," + (shade + 40) + ")";
      ctx.fillRect(x, h - bh, bw, bh);
      // windows
      ctx.fillStyle = "rgba(255,220,120,0.85)";
      for (var wy = h - bh + 10; wy < h - 8; wy += 18) {
        for (var wx = x + 6; wx < x + bw - 8; wx += 16) {
          if (Math.random() < 0.55) ctx.fillRect(wx, wy, 7, 9);
        }
      }
      x += bw + 6;
    }
    _tex.skyline = srgb(new THREE.CanvasTexture(c));
    return _tex.skyline;
  }

  // =====================================================================
  //  TURTLE
  // =====================================================================

  var TURTLE_DEF = {
    leo:   { mask: 0x1e6bff, letter: "L", weapon: "katana" },
    raph:  { mask: 0xe53935, letter: "R", weapon: "sai" },
    don:   { mask: 0x9b4dca, letter: "D", weapon: "bo" },
    mikey: { mask: 0xff8a1a, letter: "M", weapon: "nunchaku" }
  };

  function beltLetter(letter, goldMat, inkMat) {
    var g = new THREE.Group();
    var plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 20), goldMat);
    plate.rotation.x = Math.PI / 2; g.add(plate);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 22), goldMat);
    ring.position.z = 0.005; g.add(ring);
    function bar(w, h, x, y) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), inkMat);
      m.position.set(x, y, -0.03); g.add(m);
    }
    letter = (letter || "L").toUpperCase();
    if (letter === "L") { bar(0.045, 0.16, -0.05, 0); bar(0.11, 0.045, 0.02, -0.06); }
    else if (letter === "R") { bar(0.045, 0.16, -0.055, 0); bar(0.09, 0.04, 0.02, 0.06); bar(0.09, 0.04, 0.02, 0.005); bar(0.045, 0.09, 0.05, -0.045); bar(0.04, 0.04, 0.04, 0.03); }
    else if (letter === "D") { bar(0.045, 0.16, -0.055, 0); bar(0.085, 0.04, 0.015, 0.06); bar(0.085, 0.04, 0.015, -0.06); bar(0.045, 0.12, 0.058, 0); }
    else { bar(0.04, 0.16, -0.075, 0); bar(0.04, 0.16, 0.075, 0); bar(0.04, 0.1, -0.028, 0.02); bar(0.04, 0.1, 0.028, 0.02); }
    g.scale.setScalar(0.62);
    return g;
  }

  function threeFingerHand(skinMat, padMat) {
    var fist = new THREE.Group();
    var palm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), skinMat);
    palm.scale.set(1.1, 0.9, 1.0); addOutline(palm, 1.08); fist.add(palm);
    for (var i = -1; i <= 1; i++) {
      var fg = THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.03, 0.055, 3, 8) : new THREE.CylinderGeometry(0.03, 0.025, 0.1, 8);
      var f = new THREE.Mesh(fg, skinMat);
      f.position.set(i * 0.055, -0.09, -0.03); f.rotation.x = 0.5; fist.add(f);
    }
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), padMat);
    band.position.y = 0.075; band.rotation.x = 0.15; fist.add(band);
    return fist;
  }

  function threeToeFoot(skinMat, padMat) {
    var foot = new THREE.Group();
    var pad = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skinMat);
    pad.scale.set(1.0, 0.6, 1.4); pad.position.z = -0.03; addOutline(pad, 1.06); foot.add(pad);
    for (var i = -1; i <= 1; i++) {
      var toe = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), skinMat);
      toe.position.set(i * 0.055, -0.02, -0.16); toe.scale.set(1, 0.75, 1.25); foot.add(toe);
    }
    var band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 14), padMat);
    band.position.y = 0.05; foot.add(band);
    return foot;
  }

  function buildWeapon(kind, mats) {
    // returns { held:Group (for right hand), heldL:Group|null (left hand), sheath:Group|null (on shell) }
    var metal = mats.metal, dark = mats.dark, wrap = mats.wrap, gold = mats.gold, wood = mats.wood;

    function katana() {
      var k = new THREE.Group();
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.02), metal);
      blade.position.y = 0.45; k.add(blade);
      var edge = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.9, 0.024), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9 }));
      edge.position.set(-0.018, 0.45, 0); k.add(edge);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 4), metal); tip.position.y = 0.95; k.add(tip);
      var guard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.07), gold); guard.position.y = -0.01; k.add(guard);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8), wrap); handle.position.y = -0.13; k.add(handle);
      var pommel = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), gold); pommel.position.y = -0.25; k.add(pommel);
      return k;
    }
    function sai() {
      var g = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 8), metal); shaft.position.y = 0.3; g.add(shaft);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.1, 6), metal); tip.position.y = 0.6; g.add(tip);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.16, 10), wrap); handle.position.y = -0.02; g.add(handle);
      var ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), metal); ball.position.y = -0.11; g.add(ball);
      var cross = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.026, 0.04), dark); cross.position.y = 0.08; g.add(cross);
      [-1, 1].forEach(function (s) {
        var prong = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.18, 6), metal);
        prong.position.set(s * 0.07, 0.16, 0); prong.rotation.z = -s * 0.13; g.add(prong);
        var pt = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 6), metal); pt.position.set(s * 0.083, 0.26, 0); pt.rotation.z = -s * 0.13; g.add(pt);
      });
      return g;
    }
    function boStaff() {
      var g = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 12), wood); g.add(shaft);
      [-0.83, 0.83].forEach(function (y) { var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.08, 10), dark); cap.position.y = y; g.add(cap); });
      [-0.25, 0.25].forEach(function (y) { var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 10), wrap); grip.position.y = y; g.add(grip); });
      return g;
    }
    function nunStick() {
      var s = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.3, 10), wood); s.add(body);
      var c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), dark); c1.position.y = 0.15; s.add(c1);
      var c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), dark); c2.position.y = -0.15; s.add(c2);
      return s;
    }

    if (kind === "katana") {
      var kR = katana(); var kL = katana();
      var sheath = new THREE.Group();
      for (var i = 0; i < 2; i++) {
        var saya = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.8, 10), dark);
        saya.position.set(i === 0 ? -0.13 : 0.13, 0.12, 0.42);
        saya.rotation.z = (i === 0 ? 1 : -1) * 0.6; saya.rotation.x = 0.25;
        sheath.add(saya);
      }
      return { held: kR, heldL: kL, sheath: sheath };
    }
    if (kind === "sai") { return { held: sai(), heldL: sai(), sheath: null }; }
    if (kind === "bo") {
      var held = boStaff();
      var spare = boStaff(); spare.scale.setScalar(1);
      var sh = new THREE.Group(); spare.rotation.z = Math.PI / 2 - 0.3; spare.rotation.x = 0.12; spare.position.set(0, 0.15, 0.46); sh.add(spare);
      return { held: held, heldL: null, sheath: sh, twoHand: true };
    }
    // nunchaku
    var nun = new THREE.Group();
    var a = nunStick(); a.position.set(0, 0, 0); nun.add(a);
    var b = nunStick(); b.position.set(0.12, -0.28, 0.05); b.rotation.z = -0.7; nun.add(b);
    var chainMat = mats.dark;
    for (var li = 0; li < 4; li++) {
      var link = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.007, 6, 10), chainMat);
      link.position.set(0.03 + li * 0.025, -0.16 - li * 0.03, 0.01);
      link.rotation.y = Math.PI / 2; nun.add(link);
    }
    return { held: nun, heldL: null, sheath: null };
  }

  function createTurtle(turtleId) {
    var def = TURTLE_DEF[turtleId] || TURTLE_DEF.leo;
    var maskHex = def.mask;

    var root = new THREE.Group();
    var frame = new THREE.Group();   // static: aligns feet to y=0 + scales to ~1.5
    root.add(frame);
    var bob = new THREE.Group();     // animated bob
    frame.add(bob);

    // ---- materials ----
    var skinTex = skinTexture();
    var skin = new THREE.MeshStandardMaterial({ map: skinTex, color: 0xffffff, roughness: 0.55, metalness: 0.0, emissive: 0x1f5416, emissiveIntensity: 0.1 });
    var skinDark = new THREE.MeshStandardMaterial({ color: 0x4a9e34, roughness: 0.6, emissive: 0x184010, emissiveIntensity: 0.1 });
    var skinLight = new THREE.MeshStandardMaterial({ color: 0x9fe067, roughness: 0.48, emissive: 0x2c6a20, emissiveIntensity: 0.12 });
    var shellMat = new THREE.MeshStandardMaterial({ map: shellTexture(), color: 0xffffff, roughness: 0.6, metalness: 0.04 });
    var shellRim = new THREE.MeshStandardMaterial({ color: 0xc79a52, roughness: 0.68 });
    var scute = new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.62 });
    var plastron = new THREE.MeshStandardMaterial({ color: 0xf4c73c, roughness: 0.42, emissive: 0x5a4008, emissiveIntensity: 0.12 });
    var plastronLine = new THREE.MeshStandardMaterial({ color: 0xbe8f26, roughness: 0.55 });
    var maskMat = new THREE.MeshStandardMaterial({ color: maskHex, roughness: 0.38, metalness: 0.04, emissive: maskHex, emissiveIntensity: 0.24 });
    var maskDark = new THREE.MeshStandardMaterial({ color: maskHex, roughness: 0.5, emissive: maskHex, emissiveIntensity: 0.12 });
    var eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 90, specular: 0x999999, emissive: 0x1a1a1a });
    var pupilMat = new THREE.MeshPhongMaterial({ color: 0x120d0a, shininess: 120, specular: 0x556677 });
    var irisMat = new THREE.MeshPhongMaterial({ color: 0x6f89ad, shininess: 34, specular: 0x2a3340, emissive: 0x141c26 });
    var shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var mouthMat = new THREE.MeshStandardMaterial({ color: 0x6f1c20, roughness: 0.5 });
    var tongueMat = new THREE.MeshStandardMaterial({ color: 0xf07d86, roughness: 0.5 });
    var toothMat = new THREE.MeshStandardMaterial({ color: 0xfff6e8, roughness: 0.4 });
    var beltMat = new THREE.MeshStandardMaterial({ color: 0x6a4526, roughness: 0.72 });
    var goldMat = new THREE.MeshStandardMaterial({ color: 0xffcf3f, roughness: 0.28, metalness: 0.75, emissive: 0x5a3d00, emissiveIntensity: 0.25 });
    var inkMat = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.5 });

    // colored wrap band helper (wrists / knees) — matches the mask
    function wrapBand(radius, tube, mat) {
      var b = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 18), mat);
      b.rotation.x = Math.PI / 2; return b;
    }

    // ================= LEGS (chunky) =================
    function makeLeg(side) {
      var thigh = limbSeg(0.17, 0.155, 0.3, skin);
      thigh.position.set(side * 0.24, 0.56, 0.02);
      addOutline(thigh.userData.limbMesh, 1.07);
      bob.add(thigh);
      var shin = limbSeg(0.155, 0.14, 0.28, skin);
      shin.position.y = -0.3; addOutline(shin.userData.limbMesh, 1.07); thigh.add(shin);
      // knee wrap (mask colour) at the joint
      var knee = wrapBand(0.16, 0.05, maskMat); knee.position.y = -0.01; shin.add(knee);
      var kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), maskMat);
      kneePad.position.set(0, -0.01, -0.13); kneePad.scale.set(1, 1, 0.7); shin.add(kneePad);
      var foot = threeToeFoot(skin, maskMat);
      foot.position.set(0, -0.28, -0.02); shin.add(foot);
      return { thigh: thigh, shin: shin, foot: foot };
    }
    var legL = makeLeg(-1), legR = makeLeg(1);

    // ================= TORSO =================
    var torso = new THREE.Group();
    torso.position.y = 0.98;
    bob.add(torso);

    var body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 24), skin);
    body.scale.set(1.04, 1.16, 0.95); addOutline(body, 1.05); torso.add(body);

    // golden plastron (chest + belly plate) with muscle segmentation
    var plas = new THREE.Mesh(new THREE.SphereGeometry(0.45, 26, 20), plastron);
    plas.scale.set(0.94, 1.12, 0.6); plas.position.set(0, -0.04, -0.3); torso.add(plas);
    // pecs
    [-1, 1].forEach(function (sx) {
      var pec = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), plastron);
      pec.scale.set(1.0, 0.82, 0.5); pec.position.set(sx * 0.15, 0.2, -0.5); torso.add(pec);
    });
    // grooves: center seam, pec V, ab lines
    var cseam = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.46, 0.03), plastronLine);
    cseam.position.set(0, -0.04, -0.58); torso.add(cseam);
    [-1, 1].forEach(function (sx) {
      var vg = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.22, 0.03), plastronLine);
      vg.position.set(sx * 0.085, 0.22, -0.55); vg.rotation.z = sx * 0.7; torso.add(vg);
    });
    [0.02, -0.11, -0.23].forEach(function (yy, i) {
      var w = 0.32 - i * 0.05;
      var ab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.03), plastronLine);
      ab.position.set(0, yy, -0.585 + i * 0.015); torso.add(ab);
    });

    // carapace shell (brown, on the back)
    var shell = new THREE.Group(); shell.position.set(0, 0.06, 0.34); torso.add(shell);
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.6), shellMat);
    dome.rotation.x = Math.PI / 2; dome.scale.set(1.16, 1.0, 1.32);
    var domeOut = new THREE.Mesh(dome.geometry, outlineMat()); domeOut.scale.setScalar(1.05); domeOut.userData.noShadow = true; dome.add(domeOut);
    shell.add(dome);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.11, 12, 30), shellRim);
    rim.rotation.x = Math.PI / 2; rim.position.z = -0.05; shell.add(rim);
    var centerScute = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.09, 6), scute);
    centerScute.rotation.x = Math.PI / 2; centerScute.position.set(0, 0.06, 0.48); shell.add(centerScute);
    for (var p = 0; p < 6; p++) {
      var ang = (p / 6) * Math.PI * 2 + Math.PI / 6;
      var sc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 6), scute);
      sc.rotation.x = Math.PI / 2 - 0.35; sc.rotation.z = ang;
      sc.position.set(Math.cos(ang) * 0.34, Math.sin(ang) * 0.25 + 0.04, 0.4); shell.add(sc);
    }

    // belt + buckle
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 26), beltMat);
    belt.rotation.x = Math.PI / 2; belt.position.y = -0.32; belt.scale.set(1.02, 1, 0.94); torso.add(belt);
    var buckle = beltLetter(def.letter, goldMat, inkMat);
    buckle.position.set(0, -0.32, -0.54); torso.add(buckle);

    // ================= HEAD (big & cute) =================
    var head = new THREE.Group();
    head.position.set(0, 0.64, -0.04); torso.add(head);

    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 24), skin);
    skull.scale.set(1.12, 1.02, 1.06); addOutline(skull, 1.05); head.add(skull);
    // chubby cheeks
    var cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), skinLight);
    cheekL.position.set(-0.27, -0.14, -0.26); cheekL.scale.set(0.92, 0.8, 0.9); head.add(cheekL);
    var cheekR = cheekL.clone(); cheekR.position.x = 0.27; head.add(cheekR);
    // snout
    var snout = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), skinDark);
    snout.position.set(0, -0.11, -0.4); snout.scale.set(1.25, 0.82, 1.0); head.add(snout);
    var nL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), inkMat); nL.position.set(-0.05, -0.09, -0.49); head.add(nL);
    var nR = nL.clone(); nR.position.x = 0.05; head.add(nR);

    // ---- bandana mask (classic TMNT: arches over the brow, points down the nose) ----
    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 32, 1, true), maskMat);
    band.position.set(0, 0.15, 0.02); band.scale.set(1.05, 1, 1.06); head.add(band);
    // forehead patch — the mask rises up the centre of the brow
    var foreMask = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), maskMat);
    foreMask.scale.set(1.16, 0.72, 0.55); foreMask.position.set(0, 0.31, -0.33); head.add(foreMask);
    // downward point between the eyes, onto the bridge of the nose
    var bridge = new THREE.Mesh(new THREE.ConeGeometry(0.078, 0.22, 4), maskMat);
    bridge.position.set(0, 0.03, -0.42); bridge.rotation.x = Math.PI - 0.12; head.add(bridge);
    // soft brow ridge arching over each eye
    [-1, 1].forEach(function (sx) {
      var brow = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), maskMat);
      brow.scale.set(1.05, 0.5, 0.55); brow.position.set(sx * 0.17, 0.29, -0.33); brow.rotation.z = sx * 0.32; head.add(brow);
    });
    // knot at back + two flowing tails
    var knot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), maskMat); knot.position.set(0, 0.14, 0.4); head.add(knot);
    var knotL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), maskDark); knotL.position.set(-0.07, 0.14, 0.44); head.add(knotL);
    var knotR = knotL.clone(); knotR.position.x = 0.07; head.add(knotR);

    // two flowing knotted tails (wide tapering ribbons)
    function makeTail(sideX) {
      var tail = new THREE.Group();
      tail.position.set(sideX, 0.14, 0.44);
      var segs = [];
      var prev = tail;
      for (var i = 0; i < 6; i++) {
        var seg = new THREE.Group();
        seg.position.set(0, 0, 0.15);
        var w = 0.2 - i * 0.022;
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, 0.16), i % 2 ? maskDark : maskMat);
        m.position.z = 0.08; seg.add(m);
        prev.add(seg); prev = seg; segs.push(seg);
      }
      tail.userData.segs = segs;
      return tail;
    }
    var tailL = makeTail(-0.12), tailR = makeTail(0.12);
    head.add(tailL); head.add(tailR);

    // HUGE glossy eyes (framed by the mask, no goggle rings)
    function makeEye(sideX) {
      var eye = new THREE.Group();
      eye.position.set(sideX, 0.12, -0.34);
      var wht = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), eyeWhiteMat);
      wht.scale.set(1.02, 1.28, 0.9); eye.add(wht);
      var iris = new THREE.Mesh(new THREE.SphereGeometry(0.089, 16, 14), irisMat);
      iris.position.set(-sideX * 0.05, -0.02, -0.075); iris.scale.set(1, 1.1, 0.7); eye.add(iris);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.053, 14, 12), pupilMat);
      pupil.position.set(-sideX * 0.05, -0.02, -0.12); pupil.scale.set(1, 1.12, 0.7); eye.add(pupil);
      var shine1 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), shineMat);
      shine1.position.set(-sideX * 0.05 - 0.055, 0.08, -0.14); eye.add(shine1);
      var shine2 = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 8), shineMat);
      shine2.position.set(-sideX * 0.05 + 0.04, -0.06, -0.15); eye.add(shine2);
      return eye;
    }
    var eyeL = makeEye(-0.17), eyeR = makeEye(0.17);
    head.add(eyeL); head.add(eyeR);

    // big open grin
    var mouth = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), mouthMat);
    mouth.scale.set(1.46, 0.64, 0.42); mouth.position.set(0, -0.25, -0.34); head.add(mouth);
    // upturned smile corners
    [-1, 1].forEach(function (sx) {
      var corner = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skinDark);
      corner.scale.set(0.8, 0.8, 0.6); corner.position.set(sx * 0.2, -0.21, -0.36); head.add(corner);
    });
    // upper teeth strip (thin)
    var teeth = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.034, 0.04), toothMat);
    teeth.position.set(0, -0.185, -0.45); teeth.rotation.x = 0.12; head.add(teeth);
    // tongue
    var tongue = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), tongueMat);
    tongue.scale.set(1.15, 0.5, 0.7); tongue.position.set(0, -0.29, -0.4); head.add(tongue);

    // ================= ARMS =================
    function makeArm(side) {
      var upper = limbSeg(0.15, 0.13, 0.34, skin);
      upper.position.set(side * 0.52, 1.22, 0.0);
      upper.rotation.z = side * 0.32; addOutline(upper.userData.limbMesh, 1.07); bob.add(upper);
      var shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), skin);
      shoulder.position.y = 0.04; upper.add(shoulder);
      var fore = limbSeg(0.13, 0.105, 0.3, skin);
      fore.position.y = -0.34; addOutline(fore.userData.limbMesh, 1.07); upper.add(fore);
      // forearm wrap (mask colour)
      var wrap = wrapBand(0.135, 0.05, maskMat); wrap.position.y = -0.02; fore.add(wrap);
      var fist = threeFingerHand(skin, maskMat);
      fist.position.y = -0.32; fore.add(fist);
      return { upper: upper, fore: fore, fist: fist };
    }
    var armL = makeArm(-1), armR = makeArm(1);

    // ================= WEAPON =================
    var wmats = {
      metal: new THREE.MeshStandardMaterial({ color: 0xeef2f7, roughness: 0.2, metalness: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x454b54, roughness: 0.35, metalness: 0.7 }),
      wrap: new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.85 }),
      gold: goldMat,
      wood: new THREE.MeshStandardMaterial({ color: 0x8a5220, roughness: 0.65 })
    };
    var w = buildWeapon(def.weapon, wmats);
    if (w.held) {
      var held = w.held;
      if (def.weapon === "katana") { held.scale.setScalar(1.12); held.rotation.set(-0.12, 0, -0.6); held.position.y = 0.03; }
      else if (def.weapon === "sai") { held.scale.setScalar(1.15); held.rotation.set(-0.1, 0, -0.42); held.position.y = 0.02; }
      else if (def.weapon === "bo") { held.scale.setScalar(1.05); held.rotation.set(0.12, 0, 0.5); held.position.set(0.02, -0.05, 0); }
      else if (def.weapon === "nunchaku") { held.scale.setScalar(1.15); held.rotation.set(0.1, 0, -0.35); held.position.y = 0.05; }
      armR.fist.add(held);
    }
    if (w.heldL) {
      var hl = w.heldL;
      if (def.weapon === "katana") { hl.scale.setScalar(1.12); hl.rotation.set(-0.12, 0, 0.6); hl.position.y = 0.03; }
      else { hl.scale.setScalar(1.15); hl.rotation.set(-0.1, 0, 0.42); hl.position.y = 0.02; }
      armL.fist.add(hl);
    }
    if (w.sheath) shell.add(w.sheath);
    if (w.twoHand) { armL.upper.rotation.z = 0.55; armL.fore.rotation.x = 0.9; }

    shadowify(root);

    // ---- align feet to y=0 and scale to ~1.5 tall ----
    var box = new THREE.Box3().setFromObject(root);
    var h = box.max.y - box.min.y;
    var s = 1.5 / h;
    frame.scale.setScalar(s);
    box = new THREE.Box3().setFromObject(root);
    frame.position.y = -box.min.y;

    root.userData.type = "turtle";
    root.userData.turtleId = turtleId;
    root.userData.anim = { action: 0 };
    root.userData.glowMats = [skin, skinDark, skinLight, maskMat];
    root.userData.parts = {
      bob: bob, torso: torso, head: head, shell: shell,
      armL: armL.upper, armR: armR.upper, foreL: armL.fore, foreR: armR.fore,
      legL: legL.thigh, legR: legR.thigh, shinL: legL.shin, shinR: legR.shin,
      tailL: tailL, tailR: tailR, eyeL: eyeL, eyeR: eyeR,
      fistL: armL.fist, fistR: armR.fist
    };
    // baseline rotations for restoration
    root.userData.base = {
      armLz: armL.upper.rotation.z, armRz: armR.upper.rotation.z,
      foreLx: armL.fore.rotation.x, foreRx: armR.fore.rotation.x
    };
    return root;
  }

  function flutterTails(p, t, amp, freq) {
    [p.tailL, p.tailR].forEach(function (tail, ti) {
      if (!tail || !tail.userData.segs) return;
      tail.userData.segs.forEach(function (seg, i) {
        var ph = t * freq + i * 0.7 + ti * 1.4;
        seg.rotation.x = Math.sin(ph) * amp * (0.5 + i * 0.15);
        seg.rotation.y = Math.cos(ph * 0.8) * amp * 0.6 * (0.4 + i * 0.15);
      });
    });
  }

  function animateTurtleIdle(group, t) {
    var p = group.userData.parts; if (!p) return;
    var b = group.userData.base;
    var breath = Math.sin(t * 2.0) * 0.03;
    p.bob.position.y = breath;
    p.torso.scale.y = 1 + breath * 0.5;
    p.torso.rotation.set(0, 0, 0);
    p.head.rotation.y = Math.sin(t * 0.8) * 0.32;
    p.head.rotation.z = Math.sin(t * 0.6) * 0.08;
    p.head.rotation.x = Math.sin(t * 1.1) * 0.05;
    p.armL.rotation.z = b.armLz + Math.sin(t * 1.4) * 0.08;
    p.armR.rotation.z = b.armRz - Math.sin(t * 1.4) * 0.08;
    p.armL.rotation.x = Math.sin(t * 1.2) * 0.12;
    p.armR.rotation.x = -Math.sin(t * 1.2) * 0.12;
    p.legL.rotation.x = 0; p.legR.rotation.x = 0;
    p.shinL.rotation.x = 0; p.shinR.rotation.x = 0;
    flutterTails(p, t, 0.4, 3.2);
    var blink = (Math.sin(t * 0.7) > 0.94) ? 0.14 : 1;
    if (p.eyeL) p.eyeL.scale.y = blink;
    if (p.eyeR) p.eyeR.scale.y = blink;
  }

  function animateTurtleAction(group, k) {
    // k: 0..1 progress of a swing burst
    var p = group.userData.parts; if (!p) return;
    var b = group.userData.base;
    var swing = Math.sin(k * Math.PI);
    p.armR.rotation.x = -1.9 * swing;
    p.foreR.rotation.x = b.foreRx - 0.8 * swing;
    p.armL.rotation.x = 0.8 * swing;
    p.armL.rotation.z = b.armLz + 0.3 * swing;
    p.armR.rotation.z = b.armRz;
    p.torso.rotation.y = -0.5 * swing;
    p.torso.rotation.z = 0.1 * swing;
    p.head.rotation.y = 0.35 * swing;
    p.bob.position.y = 0.14 * swing;
    flutterTails(group.userData.parts, k * 10, 0.7, 8);
  }

  function animateTurtleRun(group, t) {
    var p = group.userData.parts; if (!p) return;
    var a = group.userData.anim || (group.userData.anim = { action: 0 });
    if (a.action > 0) {
      animateTurtleAction(group, 1 - a.action);
      a.action = Math.max(0, a.action - 0.045);
      return;
    }
    var b = group.userData.base;
    var f = 13;
    var s = Math.sin(t * f), c = Math.cos(t * f);
    var sH = Math.sign(s) * Math.pow(Math.abs(s), 0.7);

    p.bob.position.y = Math.abs(s) * 0.16;
    p.bob.rotation.z = c * 0.05;
    p.torso.rotation.z = sH * 0.1;
    p.torso.rotation.x = -0.18;
    p.torso.rotation.y = c * 0.08;
    p.head.rotation.x = 0.1 + Math.abs(s) * 0.04;
    p.head.rotation.y = -c * 0.16;
    p.head.rotation.z = sH * -0.05;

    p.armL.rotation.x = sH * 1.3;
    p.armR.rotation.x = -sH * 1.3;
    p.armL.rotation.z = b.armLz;
    p.armR.rotation.z = b.armRz;
    p.foreL.rotation.x = b.foreLx + 0.5 + Math.max(0, s) * 0.8;
    p.foreR.rotation.x = b.foreRx + 0.5 + Math.max(0, -s) * 0.8;

    p.legL.rotation.x = -sH * 1.1;
    p.legR.rotation.x = sH * 1.1;
    p.shinL.rotation.x = 0.4 + Math.max(0, -s) * 0.9;
    p.shinR.rotation.x = 0.4 + Math.max(0, s) * 0.9;

    flutterTails(p, t, 0.5, f * 0.6);
    if (p.eyeL) p.eyeL.scale.y = 1;
    if (p.eyeR) p.eyeR.scale.y = 1;
  }

  function triggerTurtleAction(group) {
    if (!group.userData.anim) group.userData.anim = {};
    group.userData.anim.action = 1;
  }

  function setTurtleGlow(group, hexOrNull) {
    var mats = group.userData.glowMats; if (!mats) return;
    mats.forEach(function (m) {
      if (hexOrNull == null) {
        m.emissive.setHex(m.userData._baseEmissive != null ? m.userData._baseEmissive : m.emissive.getHex());
        if (m.userData._baseEmissiveInt != null) m.emissiveIntensity = m.userData._baseEmissiveInt;
      } else {
        if (m.userData._baseEmissive == null) { m.userData._baseEmissive = m.emissive.getHex(); m.userData._baseEmissiveInt = m.emissiveIntensity; }
        m.emissive.setHex(hexOrNull);
        m.emissiveIntensity = 0.85;
      }
    });
  }

  // =====================================================================
  //  FOES (friendly veggies)
  // =====================================================================

  function createFoe(type) {
    type = type || "scout";
    var g = new THREE.Group();
    var bob = new THREE.Group();
    g.add(bob);

    var scale = 1, floretHex = 0x3aa62f, stalkHex = 0xd7e6a0, emissive = 0x0a2a08;
    if (type === "ninja") { floretHex = 0x2b7a24; }
    if (type === "bomber") { floretHex = 0xe5432b; }
    if (type === "boss") { floretHex = 0x2f8f28; scale = 2.3; }

    var eyeW = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80, specular: 0x888888 });
    var eyeB = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 100, specular: 0x445 });
    var browMat = new THREE.MeshStandardMaterial({ color: 0x123309, roughness: 0.7 });
    var footMat = new THREE.MeshStandardMaterial({ color: stalkHex, roughness: 0.7 });

    if (type === "bomber") {
      // cute round tomato
      var tomatoMat = new THREE.MeshStandardMaterial({ color: floretHex, roughness: 0.4, emissive: 0x3a0a04, emissiveIntensity: 0.25 });
      var body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 18), tomatoMat);
      body.scale.set(1.1, 0.95, 1.1); body.position.y = 0.55; addOutline(body, 1.05); bob.add(body);
      var leaf = new THREE.MeshStandardMaterial({ color: 0x3a9e30, roughness: 0.6 });
      for (var i = 0; i < 5; i++) {
        var a = (i / 5) * Math.PI * 2;
        var lf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), leaf);
        lf.position.set(Math.cos(a) * 0.12, 1.02, Math.sin(a) * 0.12); lf.rotation.z = Math.cos(a) * 0.5; lf.rotation.x = Math.sin(a) * 0.5;
        bob.add(lf);
      }
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 8), leaf); stem.position.y = 1.06; bob.add(stem);
      // fuse spark
      var fuse = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd23a }));
      fuse.position.y = 1.18; bob.add(fuse);
      bob.userData.fuse = fuse;
      // eyes
      addFace(bob, 0.5, 0.5, 0.14, eyeW, eyeB, browMat, true);
      addFeet(bob, footMat);
    } else {
      // broccoli
      var floretMat = new THREE.MeshStandardMaterial({ color: floretHex, roughness: 0.7, emissive: emissive, emissiveIntensity: 0.3, flatShading: true });
      var stalkMat = new THREE.MeshStandardMaterial({ color: stalkHex, roughness: 0.72 });
      var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.5, 12), stalkMat);
      stalk.position.y = 0.25; addOutline(stalk, 1.06); bob.add(stalk);
      var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), floretMat);
      core.position.y = 0.78; addOutline(core, 1.05); bob.add(core);
      var mini = new THREE.IcosahedronGeometry(0.18, 0);
      [[0.36, 0.84, 0.12], [-0.32, 0.8, -0.08], [0.06, 1.08, 0.22], [-0.14, 1.1, -0.18], [0.24, 0.62, -0.3], [-0.24, 0.64, 0.27]].forEach(function (q) {
        var m = new THREE.Mesh(mini, floretMat); m.position.set(q[0], q[1], q[2]); bob.add(m);
      });
      addFace(bob, 0.78, 0.14, 0.38, eyeW, eyeB, browMat, false);
      addFeet(bob, stalkMat);

      if (type === "ninja") {
        var bandMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
        var bandeau = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.14, 18, 1, true), bandMat);
        bandeau.rotation.x = Math.PI / 2; bandeau.position.y = 0.82; bob.add(bandeau);
        [-1, 1].forEach(function (sx) {
          var tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.24), bandMat);
          tl.position.set(sx * 0.1, 0.82, 0.5); tl.rotation.y = sx * 0.3; bob.add(tl);
        });
      }
      if (type === "boss") {
        var spikeMat = new THREE.MeshStandardMaterial({ color: 0x1f4a17, roughness: 0.5, metalness: 0.2 });
        [[0.5, 0.95, 0], [-0.5, 0.95, 0], [0, 1.3, 0], [0, 0.8, 0.5], [0, 0.8, -0.5], [0.38, 1.15, 0.2], [-0.38, 1.15, 0.2]].forEach(function (d) {
          var sp = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.4, 7), spikeMat);
          sp.position.set(d[0], d[1], d[2]);
          sp.lookAt(d[0] * 3, d[1] + 1, d[2] * 3);
          bob.add(sp);
        });
        // crown scowl brows already added; make bigger angry brows
      }
    }

    g.scale.setScalar(scale);
    shadowify(g);
    g.userData.type = type;
    g.userData.parts = { bob: bob };
    return g;

    function addFace(parent, eyeY, faceOffY, zFront, ew, eb, bm, small) {
      var eR = small ? 0.12 : 0.11;
      var eL = new THREE.Mesh(new THREE.SphereGeometry(eR, 14, 12), ew); eL.position.set(-0.15, eyeY, -zFront); eL.scale.set(1, 1.15, 0.7); parent.add(eL);
      var eRr = eL.clone(); eRr.position.x = 0.15; parent.add(eRr);
      var pL = new THREE.Mesh(new THREE.SphereGeometry(eR * 0.5, 10, 8), eb); pL.position.set(-0.15, eyeY - 0.02, -zFront - 0.07); parent.add(pL);
      var pR = pL.clone(); pR.position.x = 0.15; parent.add(pR);
      var sh = new THREE.Mesh(new THREE.SphereGeometry(eR * 0.25, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      var s1 = sh.clone(); s1.position.set(-0.19, eyeY + 0.04, -zFront - 0.1); parent.add(s1);
      var s2 = sh.clone(); s2.position.set(0.11, eyeY + 0.04, -zFront - 0.1); parent.add(s2);
      // angry eyebrows
      var bL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.05), bm); bL.position.set(-0.15, eyeY + 0.14, -zFront - 0.02); bL.rotation.z = 0.5; parent.add(bL);
      var bR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.05), bm); bR.position.set(0.15, eyeY + 0.14, -zFront - 0.02); bR.rotation.z = -0.5; parent.add(bR);
      // little smile
      var mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a1010 }));
      mouth.position.set(0, eyeY - 0.16, -zFront - 0.02); mouth.rotation.set(Math.PI + 0.1, 0, 0); parent.add(mouth);
    }
    function addFeet(parent, fm) {
      var f1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), fm); f1.position.set(-0.17, 0.07, 0.06); f1.scale.set(1, 0.7, 1.3); parent.add(f1);
      var f2 = f1.clone(); f2.position.x = 0.17; parent.add(f2);
    }
  }

  function animateFoe(group, t) {
    var p = group.userData.parts, bob = p && p.bob; if (!bob) return;
    var type = group.userData.type;
    if (type === "ninja") {
      bob.rotation.y += 0.08;
      bob.position.y = Math.abs(Math.sin(t * 7)) * 0.14;
    } else if (type === "boss") {
      bob.position.y = Math.sin(t * 2) * 0.07;
      bob.rotation.z = Math.sin(t * 1.4) * 0.06;
      bob.rotation.y = Math.sin(t * 0.8) * 0.15;
    } else if (type === "bomber") {
      bob.position.y = Math.abs(Math.sin(t * 8)) * 0.12;
      if (bob.userData.fuse) { var s = 0.7 + Math.abs(Math.sin(t * 18)) * 0.6; bob.userData.fuse.scale.setScalar(s); }
    } else {
      bob.position.y = Math.abs(Math.sin(t * 6)) * 0.16;
      bob.rotation.y = Math.sin(t * 3) * 0.22;
    }
  }

  // =====================================================================
  //  PIZZA
  // =====================================================================

  function createPizza(gold) {
    var g = new THREE.Group();
    var spin = new THREE.Group();
    g.add(spin);
    var crustMat = new THREE.MeshStandardMaterial({ color: gold ? 0xffd24a : 0xd39a4a, roughness: 0.65, metalness: gold ? 0.45 : 0, emissive: gold ? 0xffa800 : 0x2a1500, emissiveIntensity: gold ? 0.6 : 0.08 });
    var cheeseMat = new THREE.MeshStandardMaterial({ color: gold ? 0xfff0a0 : 0xffcf5e, roughness: 0.5, emissive: gold ? 0xffe060 : 0x3a2a00, emissiveIntensity: gold ? 0.45 : 0.05 });
    var pepMat = new THREE.MeshStandardMaterial({ color: gold ? 0xffb84a : 0xc0301c, roughness: 0.45, emissive: gold ? 0xff9020 : 0x200500, emissiveIntensity: gold ? 0.4 : 0 });

    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.1, 30), crustMat);
    spin.add(base);
    var cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 30), cheeseMat);
    cheese.position.y = 0.06; spin.add(cheese);
    var pepGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 14);
    [[0, 0], [0.22, 0.15], [-0.2, 0.17], [0.14, -0.24], [-0.26, -0.09], [0.28, -0.07], [-0.06, 0.28]].forEach(function (q) {
      var m = new THREE.Mesh(pepGeo, pepMat); m.position.set(q[0], 0.1, q[1]); spin.add(m);
    });
    for (var i = 0; i < 5; i++) {
      var blob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheeseMat);
      blob.position.set(Math.cos(i * 1.3) * 0.28, 0.09, Math.sin(i * 1.3) * 0.28); blob.scale.set(1, 0.5, 1); spin.add(blob);
    }
    if (gold) {
      var star = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 30), new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.7 }));
      star.rotation.x = Math.PI / 2; g.add(star); g.userData.halo = star;
    }
    shadowify(g);
    g.userData.type = "pizza";
    g.userData.gold = !!gold;
    g.userData.parts = { spin: spin };
    return g;
  }

  function animatePizza(group, t) {
    var p = group.userData.parts, spin = (p && p.spin) || group;
    var gold = !!group.userData.gold;
    spin.rotation.y = t * (gold ? 3.4 : 2.0);
    spin.rotation.z = Math.sin(t * 3) * 0.1;
    spin.position.y = Math.sin(t * 4) * 0.07;
    if (gold) {
      var s = 1 + Math.sin(t * 6) * 0.06; spin.scale.set(s, s, s);
      if (group.userData.halo) { group.userData.halo.rotation.z = t * 2; group.userData.halo.scale.setScalar(1 + Math.sin(t * 5) * 0.15); }
    }
  }

  // =====================================================================
  //  GROUND CHUNKS (3 worlds)
  // =====================================================================

  function createGroundChunk(world, length) {
    length = length == null ? 20 : length;
    if (world === 2) return pizzeriaChunk(length);
    if (world === 3) return rooftopChunk(length);
    return sewerChunk(length);
  }

  function repeatMap(base, rx, ry) {
    var t = base.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
  }

  function sewerChunk(length) {
    var g = new THREE.Group();
    var width = 9, height = 5;
    var base = brickTexture();
    var floorMat = new THREE.MeshStandardMaterial({ map: repeatMap(base, length / 3.5, width / 3.5), color: 0xbfd8ce, roughness: 0.9 });
    var wallMat = new THREE.MeshStandardMaterial({ map: repeatMap(base, length / 3.5, height / 2.5), color: 0xaecfc4, roughness: 0.85 });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), floorMat);
    floor.position.y = -0.2; floor.receiveShadow = true; g.add(floor);
    [-1, 1].forEach(function (sx) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, height, length), wallMat);
      wall.position.set(sx * width / 2, height / 2, 0); wall.receiveShadow = true; g.add(wall);
    });
    var arch = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, length, 16, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ map: repeatMap(base, 4, length / 4), color: 0x88b0a4, roughness: 0.92, side: THREE.BackSide }));
    arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.y = height; g.add(arch);
    // pipes
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x7a95a0, roughness: 0.35, metalness: 0.7 });
    [-1, 1].forEach(function (sx) {
      var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, length, 12), pipeMat);
      pipe.rotation.x = Math.PI / 2; pipe.position.set(sx * (width / 2 - 0.5), 3.6, 0); g.add(pipe);
    });
    // glowing slime drips + lanterns
    var lanternMat = new THREE.MeshStandardMaterial({ color: 0xbfffe0, emissive: 0x39e79a, emissiveIntensity: 2.4 });
    var slimeMat = new THREE.MeshStandardMaterial({ color: 0x4dffa0, emissive: 0x2ccf6a, emissiveIntensity: 0.9, transparent: true, opacity: 0.85, roughness: 0.2 });
    var drips = [];
    for (var i = 0; i < 3; i++) {
      var lz = -length / 2 + 4 + i * (length / 3);
      var sx = (i % 2 ? 1 : -1);
      var lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), lanternMat);
      lantern.position.set(sx * (width / 2 - 0.6), 2.9, lz); g.add(lantern);
      var light = new THREE.PointLight(0x66ffc0, 1.1, 13, 1.6);
      light.position.copy(lantern.position); g.add(light);
      var halo = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), new THREE.MeshBasicMaterial({ color: 0x66ffc0, transparent: true, opacity: 0.16 }));
      halo.position.copy(lantern.position); g.add(halo);
      var drip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), slimeMat);
      drip.position.set((Math.random() - 0.5) * 3, 3.2, lz);
      drip.userData.drip = true; drip.userData.baseY = 3.2; drip.userData.phase = Math.random() * Math.PI * 2;
      g.add(drip); drips.push(drip);
    }
    // slime puddles
    for (var s = 0; s < 2; s++) {
      var puddle = new THREE.Mesh(new THREE.CircleGeometry(0.9 + Math.random() * 0.4, 20), slimeMat);
      puddle.rotation.x = -Math.PI / 2; puddle.position.set((Math.random() - 0.5) * 4, 0.02, (Math.random() - 0.5) * (length - 4)); g.add(puddle);
    }
    g.userData.type = "ground"; g.userData.world = 1; g.userData.length = length;
    return g;
  }

  function pizzeriaChunk(length) {
    var g = new THREE.Group();
    var width = 9, height = 5;
    var floorMat = new THREE.MeshStandardMaterial({ map: repeatMap(checkerTexture(), length / 3, width / 3), roughness: 0.5 });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), floorMat);
    floor.position.y = -0.2; floor.receiveShadow = true; g.add(floor);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xf6c98a, roughness: 0.8 });
    var wainMat = new THREE.MeshStandardMaterial({ color: 0xc9793a, roughness: 0.7 });
    [-1, 1].forEach(function (sx) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, height, length), wallMat);
      wall.position.set(sx * width / 2, height / 2, 0); wall.receiveShadow = true; g.add(wall);
      var wain = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.4, length), wainMat);
      wain.position.set(sx * width / 2, 0.7, 0); g.add(wain);
      // counters with pots
      var counterMat = new THREE.MeshStandardMaterial({ color: 0xded4c4, roughness: 0.6 });
      var counter = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, length * 0.9), counterMat);
      counter.position.set(sx * (width / 2 - 0.7), 0.5, 0); counter.receiveShadow = true; g.add(counter);
      var potMat = new THREE.MeshStandardMaterial({ color: 0x333840, roughness: 0.4, metalness: 0.6 });
      for (var pj = 0; pj < 2; pj++) {
        var pz = -length / 3 + pj * (length / 2);
        var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.34, 16), potMat);
        pot.position.set(sx * (width / 2 - 0.7), 1.17, pz); g.add(pot);
        var cheese = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffdf7a, roughness: 0.4, emissive: 0x6a5010, emissiveIntensity: 0.2 }));
        cheese.position.set(sx * (width / 2 - 0.7), 1.34, pz); g.add(cheese);
      }
    });
    // ceiling with hanging lamps
    var ceil = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, length), new THREE.MeshStandardMaterial({ color: 0xe8b878, roughness: 0.8 }));
    ceil.position.y = height; g.add(ceil);
    for (var i = 0; i < 3; i++) {
      var lz = -length / 2 + 4 + i * (length / 3);
      var lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffcf60, emissiveIntensity: 2.2 });
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), lampMat);
      lamp.rotation.x = Math.PI; lamp.position.set(0, height - 0.6, lz); g.add(lamp);
      var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x222 })); cord.position.set(0, height - 0.3, lz); g.add(cord);
      var light = new THREE.PointLight(0xffd070, 1.2, 14, 1.6); light.position.set(0, height - 0.8, lz); g.add(light);
    }
    g.userData.type = "ground"; g.userData.world = 2; g.userData.length = length;
    return g;
  }

  function rooftopChunk(length) {
    var g = new THREE.Group();
    var width = 9;
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x556080, roughness: 0.85 });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), roofMat);
    floor.position.y = -0.2; floor.receiveShadow = true; g.add(floor);
    // gravel specks / vents
    var ventMat = new THREE.MeshStandardMaterial({ color: 0x8894b0, roughness: 0.5, metalness: 0.4 });
    for (var v = 0; v < 3; v++) {
      var vz = -length / 2 + 5 + v * (length / 3);
      var vent = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), ventMat);
      vent.position.set((v % 2 ? 1 : -1) * 3, 0.25, vz); g.add(vent);
    }
    // parapet walls
    var parapetMat = new THREE.MeshStandardMaterial({ color: 0x46506e, roughness: 0.8 });
    [-1, 1].forEach(function (sx) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, length), parapetMat);
      wall.position.set(sx * width / 2, 0.5, 0); g.add(wall);
    });
    // city skyline billboards (both sides)
    var skyMat = new THREE.MeshBasicMaterial({ map: repeatMap(skylineTexture(), length / 22, 1), transparent: false });
    [-1, 1].forEach(function (sx) {
      var sky = new THREE.Mesh(new THREE.PlaneGeometry(length, 5), skyMat);
      sky.position.set(sx * (width / 2 + 3), 2.2, 0); sky.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      sky.userData.noShadow = true; g.add(sky);
    });
    // moon glow (far ahead)
    var moon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 16), new THREE.MeshBasicMaterial({ color: 0xfff7d8 }));
    moon.position.set(3, 6, -length / 2 - 2); g.add(moon);
    var moonLight = new THREE.PointLight(0xcfe0ff, 0.6, 40, 1.2); moonLight.position.copy(moon.position); g.add(moonLight);
    // string lights across
    var bulbColors = [0xff5a5a, 0xffd23a, 0x5affa0, 0x5ab8ff, 0xff8adf];
    for (var s = 0; s < 3; s++) {
      var sz = -length / 2 + 5 + s * (length / 3);
      var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, width, 5), new THREE.MeshStandardMaterial({ color: 0x222 }));
      wire.rotation.z = Math.PI / 2; wire.position.set(0, 2.4, sz); g.add(wire);
      for (var bI = 0; bI < 7; bI++) {
        var col = bulbColors[bI % bulbColors.length];
        var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.8 }));
        bulb.position.set(-width / 2 + 0.6 + bI * (width - 1.2) / 6, 2.3 - Math.sin(bI / 6 * Math.PI) * 0.15, sz);
        bulb.userData.twinkle = true; bulb.userData.phase = Math.random() * 6.28; g.add(bulb);
      }
    }
    g.userData.type = "ground"; g.userData.world = 3; g.userData.length = length;
    return g;
  }

  function animateGroundChunk(group, t) {
    if (!group) return;
    group.traverse(function (o) {
      if (o.userData && o.userData.drip) {
        o.position.y = o.userData.baseY - ((t * 1.5 + o.userData.phase) % 1.8);
        o.scale.setScalar(0.7 + 0.3 * Math.sin(t * 6 + o.userData.phase));
      } else if (o.userData && o.userData.twinkle) {
        var m = o.material; if (m) m.emissiveIntensity = 1.2 + Math.abs(Math.sin(t * 3 + o.userData.phase)) * 1.2;
      }
    });
  }

  // =====================================================================
  //  LANE GLOW
  // =====================================================================

  function createLaneGlow(laneXs) {
    laneXs = laneXs || [-2.2, 0, 2.2];
    var g = new THREE.Group();
    var stripLen = 60;
    laneXs.forEach(function (x, idx) {
      var color = (idx === 1) ? 0x7dffbf : 0x66c8ff;
      var strip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, stripLen), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.45 }));
      strip.position.set(x, 0.03, 0); g.add(strip);
      for (var i = 0; i < 14; i++) {
        var dot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.4), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 }));
        dot.position.set(x, 0.045, -stripLen / 2 + i * (stripLen / 14) + 1); g.add(dot);
      }
    });
    g.userData.type = "laneGlow";
    return g;
  }

  // =====================================================================
  //  SPEED LINES
  // =====================================================================

  function createSpeedLines() {
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    for (var i = 0; i < 26; i++) {
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.6 + Math.random() * 1.4), mat.clone());
      line.userData.baseX = (Math.random() - 0.5) * 8;
      line.userData.baseY = 0.4 + Math.random() * 3.6;
      line.userData.offset = Math.random() * 60;
      line.userData.speed = 0.7 + Math.random() * 1.6;
      line.position.set(line.userData.baseX, line.userData.baseY, 0);
      g.add(line);
    }
    g.userData.type = "speedLines"; g.userData.range = 40; g.visible = false;
    return g;
  }

  function animateSpeedLines(group, t, intensity) {
    if (!group || group.userData.type !== "speedLines") return;
    var range = group.userData.range || 40;
    var spd = Math.max(0, intensity == null ? 1 : intensity);
    group.visible = spd > 0.05;
    if (!group.visible) return;
    var boost = Math.min(1, spd / 3);
    group.children.forEach(function (line) {
      var u = line.userData;
      var z = (((t * (10 + spd * 12) * u.speed) + u.offset) % range) - range / 2;
      line.position.z = z;
      line.position.x = u.baseX + Math.sin(t * 2 + u.offset) * 0.05;
      line.scale.z = 1 + spd * 0.6;
      if (line.material) line.material.opacity = 0.3 * boost + 0.2;
    });
  }

  // =====================================================================
  //  FX
  // =====================================================================

  function createFX(kind, color) {
    kind = kind || "spark";
    color = color == null ? 0xffe27a : color;
    var g = new THREE.Group();
    g.userData.type = "fx";
    g.userData.kind = kind;

    if (kind === "ring") {
      var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 24), mat); ring.rotation.x = -Math.PI / 2; g.add(ring);
      var disc = new THREE.Mesh(new THREE.CircleGeometry(0.28, 18), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.005; g.add(disc);
      g.userData.ring = { total: 0.5, elapsed: 0, mat: mat, discMat: disc.material };
      g.userData.life = 0.5;
      return g;
    }
    if (kind === "star") {
      var starMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
      for (var s = 0; s < 8; s++) {
        var st = new THREE.Mesh(new THREE.TetrahedronGeometry(0.1), starMat.clone());
        var a = Math.random() * Math.PI * 2;
        st.position.set(Math.cos(a) * 0.15, Math.random() * 0.2, Math.sin(a) * 0.15);
        st.userData.vel = new THREE.Vector3(Math.cos(a) * 2.5, 2 + Math.random() * 2.5, Math.sin(a) * 2.5);
        st.userData.spin = (Math.random() - 0.5) * 12;
        g.add(st);
      }
      g.userData.life = 0.8;
      return g;
    }
    if (kind === "poof") {
      var poofMat = new THREE.MeshStandardMaterial({ color: color === 0xffe27a ? 0xdfe6ee : color, transparent: true, opacity: 0.85, roughness: 1 });
      for (var pI = 0; pI < 7; pI++) {
        var puff = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 8, 6), poofMat.clone());
        var pa = Math.random() * Math.PI * 2;
        puff.position.set(Math.cos(pa) * 0.15, 0.1 + Math.random() * 0.15, Math.sin(pa) * 0.15);
        puff.userData.vel = new THREE.Vector3(Math.cos(pa) * 1.5, 0.8 + Math.random() * 1.2, Math.sin(pa) * 1.5);
        puff.userData.grow = 1.5 + Math.random();
        g.add(puff);
      }
      g.userData.life = 0.6;
      return g;
    }
    if (kind === "confetti") {
      var palette = [0xff5a5a, 0xffd23a, 0x5affa0, 0x5ab8ff, 0xff8adf, 0xffffff];
      for (var i = 0; i < 16; i++) {
        var col = palette[i % palette.length];
        var m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.02), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5 }));
        m.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5);
        m.userData.spin = (Math.random() - 0.5) * 14;
        g.add(m);
      }
      g.userData.life = 0.9;
      return g;
    }
    // spark (default)
    var sparkMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 1.6 });
    for (var k = 0; k < 12; k++) {
      var sp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), sparkMat);
      var aa = Math.random() * Math.PI * 2;
      sp.position.set(Math.cos(aa) * 0.15, Math.random() * 0.3, Math.sin(aa) * 0.15);
      sp.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4);
      g.add(sp);
    }
    g.userData.life = 0.45;
    return g;
  }

  function updateFX(group, dt) {
    if (!group || group.userData.type !== "fx") return false;
    group.userData.life -= dt;

    if (group.userData.ring) {
      var r = group.userData.ring;
      r.elapsed += dt;
      var k = Math.min(1, r.elapsed / r.total);
      var scale = 0.4 + k * 3.2;
      group.scale.set(scale, 1, scale);
      var op = 1 - k;
      if (r.mat) r.mat.opacity = op;
      if (r.discMat) r.discMat.opacity = 0.5 * op;
      return group.userData.life > 0;
    }

    var fade = Math.max(0, group.userData.life);
    group.children.forEach(function (m) {
      if (m.userData.vel) {
        m.position.addScaledVector(m.userData.vel, dt);
        m.userData.vel.y -= 9 * dt;
        if (m.userData.spin) { m.rotation.x += m.userData.spin * dt; m.rotation.y += m.userData.spin * dt * 0.7; }
        else { m.rotation.x += dt * 8; m.rotation.y += dt * 6; }
      }
      if (m.userData.grow) m.scale.multiplyScalar(1 + m.userData.grow * dt);
      if (m.material && m.material.transparent && m.material.opacity !== undefined) {
        m.material.opacity = Math.min(1, fade * 2.2);
      }
    });
    return group.userData.life > 0;
  }

  // =====================================================================
  //  WORLD THEME
  // =====================================================================

  function worldTheme(world) {
    if (world === 2) {
      return { bg: 0x3a2416, fog: 0x54331c, fogNear: 16, fogFar: 52, hemiSky: 0xffe0b0, hemiGround: 0x5a3418, hemiInt: 1.3, sunColor: 0xfff2d0, sunInt: 1.5 };
    }
    if (world === 3) {
      return { bg: 0x1b2547, fog: 0x243060, fogNear: 18, fogFar: 56, hemiSky: 0xaec4ff, hemiGround: 0x1c2440, hemiInt: 1.15, sunColor: 0xd6e4ff, sunInt: 1.25 };
    }
    return { bg: 0x123033, fog: 0x184043, fogNear: 15, fogFar: 48, hemiSky: 0x7fecd6, hemiGround: 0x13363c, hemiInt: 1.2, sunColor: 0xffffff, sunInt: 1.35 };
  }

  // =====================================================================
  //  export
  // =====================================================================

  global.GameArt = {
    worldTheme: worldTheme,
    createTurtle: createTurtle,
    animateTurtleIdle: animateTurtleIdle,
    animateTurtleRun: animateTurtleRun,
    triggerTurtleAction: triggerTurtleAction,
    setTurtleGlow: setTurtleGlow,
    createFoe: createFoe,
    animateFoe: animateFoe,
    createPizza: createPizza,
    animatePizza: animatePizza,
    createGroundChunk: createGroundChunk,
    animateGroundChunk: animateGroundChunk,
    createLaneGlow: createLaneGlow,
    createSpeedLines: createSpeedLines,
    animateSpeedLines: animateSpeedLines,
    createFX: createFX,
    updateFX: updateFX
  };

})(window);
