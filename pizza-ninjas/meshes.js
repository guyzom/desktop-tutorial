/* Rich procedural Three.js meshes + obvious kid-friendly animation
 * Global: window.TMNTMeshes  |  Requires THREE (r160)  |  iPad-friendly poly counts
 */
(function (global) {
  "use strict";

  // ---------- helpers ----------

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shadowify(root) {
    root.traverse(function (o) {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }

  function limbSeg(rad, len, mat) {
    var g = new THREE.Group();
    var mesh;
    if (THREE.CapsuleGeometry) {
      mesh = new THREE.Mesh(new THREE.CapsuleGeometry(rad, Math.max(0.01, len - rad * 2), 5, 10), mat);
    } else {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 10), mat);
    }
    mesh.position.y = -len / 2;
    g.add(mesh);
    return g;
  }

  // ---------- sewer brick texture (higher contrast) ----------

  function createSewerTexture() {
    var w = 512, h = 512;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var ctx = c.getContext("2d");
    // deep mortar background
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#100a08");
    grad.addColorStop(1, "#1a1210");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    var cols = 6, rows = 10, bw = w / cols, bh = h / rows;
    for (var r = 0; r < rows; r++) {
      var offset = (r % 2) * (bw / 2);
      for (var cn = -1; cn <= cols; cn++) {
        var x = cn * bw + offset + 3, y = r * bh + 3;
        var warm = (Math.random() < 0.5);
        var shade = 0.55 + Math.random() * 0.75; // wider range = more contrast
        var R, G, B;
        if (warm) {
          R = Math.floor(150 * shade); G = Math.floor(88 * shade); B = Math.floor(52 * shade);
        } else {
          R = Math.floor(105 * shade); G = Math.floor(80 * shade); B = Math.floor(70 * shade);
        }
        ctx.fillStyle = "rgb(" + R + "," + G + "," + B + ")";
        roundRect(ctx, x, y, bw - 6, bh - 6, 4);
        ctx.fill();
        // top highlight
        ctx.fillStyle = "rgba(255,225,180,0.14)";
        ctx.fillRect(x + 2, y + 2, bw - 12, 4);
        // bottom shadow
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.fillRect(x + 4, y + bh - 14, bw - 14, 5);
        // occasional crack
        if (Math.random() < 0.12) {
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          var cx = x + 6 + Math.random() * (bw - 18);
          var cy = y + 6 + Math.random() * (bh - 18);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 6 + Math.random() * 12, cy + (Math.random() - 0.5) * 8);
          ctx.stroke();
        }
      }
    }
    // moss speckles (brighter, more variance)
    for (var i = 0; i < 160; i++) {
      ctx.fillStyle = "rgba(60,150,80," + (0.08 + Math.random() * 0.22) + ")";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // grime streaks
    for (var s = 0; s < 20; s++) {
      ctx.fillStyle = "rgba(0,0,0," + (0.05 + Math.random() * 0.1) + ")";
      ctx.fillRect(Math.random() * w, 0, 2 + Math.random() * 3, h);
    }

    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ---------- premium iconic TMNT turtle ----------

  function canvasTex(draw, size) {
    size = size || 256;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function skinTexture() {
    return canvasTex(function (ctx, s) {
      var g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#6ee04a");
      g.addColorStop(0.5, "#4bc832");
      g.addColorStop(1, "#2f9a22");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      // subtle scale dots
      for (var y = 0; y < s; y += 10) {
        for (var x = 0; x < s; x += 10) {
          var ox = (y / 10) % 2 === 0 ? 0 : 5;
          ctx.fillStyle = "rgba(20,80,20," + (0.06 + Math.random() * 0.08) + ")";
          ctx.beginPath();
          ctx.ellipse(x + ox, y, 3.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // soft highlight
      ctx.fillStyle = "rgba(255,255,200,0.08)";
      ctx.beginPath();
      ctx.ellipse(s * 0.35, s * 0.3, s * 0.25, s * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }, 256);
  }

  function shellTexture() {
    return canvasTex(function (ctx, s) {
      var g = ctx.createRadialGradient(s * 0.5, s * 0.42, 8, s * 0.5, s * 0.5, s * 0.55);
      g.addColorStop(0, "#c48a4a");
      g.addColorStop(0.45, "#8a5224");
      g.addColorStop(1, "#3a1c0a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      function hex(cx, cy, r, fill) {
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        ctx.strokeStyle = "rgba(25,10,4,0.85)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,210,140,0.18)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      hex(s * 0.5, s * 0.46, s * 0.16, "rgba(180,110,50,0.35)");
      [[0.5, 0.22], [0.74, 0.38], [0.74, 0.62], [0.5, 0.74], [0.26, 0.62], [0.26, 0.38]].forEach(function (p, i) {
        hex(s * p[0], s * p[1], s * 0.13, i % 2 ? "rgba(90,45,18,0.35)" : "rgba(160,95,40,0.28)");
      });
      for (var i = 0; i < 50; i++) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
    }, 512);
  }

  function plastronTexture() {
    return canvasTex(function (ctx, s) {
      var g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#fff0c8");
      g.addColorStop(1, "#e0c080");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(140,100,50,0.55)";
      ctx.lineWidth = 5;
      // classic 4-panel plastron
      ctx.strokeRect(s * 0.18, s * 0.12, s * 0.64, s * 0.76);
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.12); ctx.lineTo(s * 0.5, s * 0.88);
      ctx.moveTo(s * 0.18, s * 0.38); ctx.lineTo(s * 0.82, s * 0.38);
      ctx.moveTo(s * 0.18, s * 0.62); ctx.lineTo(s * 0.82, s * 0.62);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(s * 0.22, s * 0.16, s * 0.25, s * 0.18);
    }, 256);
  }

  function maskTexture(hex) {
    var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    return canvasTex(function (ctx, s) {
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(0, 0, s, s);
      // fabric folds
      for (var i = 0; i < 14; i++) {
        var x = (i / 14) * s;
        ctx.fillStyle = "rgba(0,0,0," + (0.08 + (i % 2) * 0.06) + ")";
        ctx.fillRect(x, 0, 6, s);
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(x + 2, 0, 2, s);
      }
      // edge wear
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, s, 10);
      ctx.fillRect(0, s - 10, s, 10);
    }, 128);
  }

  function makeBeltLetter(letter, goldMat) {
    var g = new THREE.Group();
    var plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.07), goldMat);
    g.add(plate);
    var bevel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.02), new THREE.MeshStandardMaterial({
      color: 0xffe080, roughness: 0.35, metalness: 0.6
    }));
    bevel.position.z = -0.03;
    g.add(bevel);
    var ink = new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.45, metalness: 0.15 });
    function bar(w, h, x, y) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.055), ink);
      m.position.set(x, y, -0.05);
      g.add(m);
    }
    letter = (letter || "L").toUpperCase();
    if (letter === "L") {
      bar(0.055, 0.16, -0.06, 0); bar(0.13, 0.055, 0.02, -0.055);
    } else if (letter === "R") {
      bar(0.055, 0.16, -0.065, 0); bar(0.11, 0.045, 0.02, 0.06);
      bar(0.11, 0.045, 0.02, 0); bar(0.055, 0.09, 0.06, -0.04);
      bar(0.045, 0.045, 0.05, 0.03);
    } else if (letter === "D") {
      bar(0.055, 0.16, -0.065, 0); bar(0.1, 0.045, 0.02, 0.06);
      bar(0.1, 0.045, 0.02, -0.06); bar(0.055, 0.12, 0.065, 0);
    } else {
      bar(0.045, 0.16, -0.08, 0); bar(0.045, 0.16, 0.08, 0);
      bar(0.045, 0.11, -0.03, 0.02); bar(0.045, 0.11, 0.03, 0.02);
      bar(0.045, 0.055, 0, -0.02);
    }
    return g;
  }

  function makeThreeFingerHand(skinMat, maskMat) {
    var fist = new THREE.Group();
    var palm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), skinMat);
    palm.scale.set(1.2, 0.9, 1.0);
    fist.add(palm);
    for (var i = -1; i <= 1; i++) {
      var fingerGeo = THREE.CapsuleGeometry
        ? new THREE.CapsuleGeometry(0.032, 0.08, 4, 8)
        : new THREE.CylinderGeometry(0.032, 0.024, 0.12, 8);
      var finger = new THREE.Mesh(fingerGeo, skinMat);
      finger.position.set(i * 0.06, -0.12, -0.03);
      finger.rotation.x = 0.45;
      fist.add(finger);
      var knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), skinMat);
      knuckle.position.set(i * 0.06, -0.06, -0.02);
      fist.add(knuckle);
    }
    var wristBand = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 8, 18), maskMat);
    wristBand.position.y = 0.09;
    fist.add(wristBand);
    return fist;
  }

  function makeThreeToeFoot(skinMat, maskMat) {
    var foot = new THREE.Group();
    var pad = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), skinMat);
    pad.scale.set(1.1, 0.5, 1.45);
    foot.add(pad);
    for (var i = -1; i <= 1; i++) {
      var toe = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), skinMat);
      toe.position.set(i * 0.055, -0.01, -0.16);
      toe.scale.set(1, 0.65, 1.3);
      foot.add(toe);
    }
    var ankle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.032, 8, 16), maskMat);
    ankle.position.y = 0.07;
    foot.add(ankle);
    return foot;
  }

  function makeShellDome(shellMat, rimMat, scuteMat, scuteDark) {
    var shell = new THREE.Group();
    // Domed carapace sitting clearly on the BACK
    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
      shellMat
    );
    dome.rotation.x = Math.PI / 2;
    dome.scale.set(1.15, 0.95, 1.2);
    dome.position.z = 0.08;
    shell.add(dome);

    // rim only as a BACK crescent (half-torus look via scaled torus + push back)
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 28, Math.PI * 1.3), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = Math.PI;
    rim.position.z = 0.06;
    shell.add(rim);

    function scute(rad, x, y, z, tilt, mat) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.9, rad, 0.11, 6), mat);
      m.rotation.x = Math.PI / 2 + tilt;
      m.position.set(x, y, z);
      shell.add(m);
    }
    scute(0.22, 0, 0.06, 0.52, 0, scuteMat);
    for (var p = 0; p < 6; p++) {
      var a = (p / 6) * Math.PI * 2 + Math.PI / 6;
      scute(0.14, Math.cos(a) * 0.32, Math.sin(a) * 0.22 + 0.02, 0.42, -0.4, p % 2 ? scuteDark : scuteMat);
    }
    return shell;
  }

  function attachTurtleWeapon(parts, turtleId) {
    if (!turtleId) return;
    var metal = new THREE.MeshStandardMaterial({ color: 0xf0f3f8, roughness: 0.18, metalness: 0.95 });
    var darkMetal = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.35, metalness: 0.85 });
    var wrap = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.9 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xffc94a, roughness: 0.28, metalness: 0.75 });
    var wood = new THREE.MeshStandardMaterial({ color: 0x8a4a1a, roughness: 0.65 });

    if (turtleId === "leo") {
      function makeKatana() {
        var kat = new THREE.Group();
        var blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.95, 0.02), metal);
        blade.position.y = 0.45; kat.add(blade);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), metal);
        tip.position.y = 0.98; kat.add(tip);
        var guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.07), gold);
        guard.position.y = -0.02; kat.add(guard);
        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.045), wrap);
        handle.position.y = -0.15; kat.add(handle);
        for (var w = 0; w < 5; w++) {
          var ring = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.014, 0.052), gold);
          ring.position.y = -0.06 - w * 0.035; kat.add(ring);
        }
        var pommel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), gold);
        pommel.position.y = -0.28; kat.add(pommel);
        return kat;
      }
      for (var i = 0; i < 2; i++) {
        var saya = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.75, 10), darkMetal);
        saya.position.set(i === 0 ? -0.14 : 0.14, 0.1, 0.4);
        saya.rotation.z = (i === 0 ? 1 : -1) * 0.7;
        saya.rotation.x = 0.25;
        parts.shell.add(saya);
      }
      var kL = makeKatana(); kL.rotation.set(Math.PI, 0, 0.35); kL.position.set(0.02, -0.04, 0); parts.fistL.add(kL);
      var kR = makeKatana(); kR.rotation.set(Math.PI, 0, -0.35); kR.position.set(-0.02, -0.04, 0); parts.fistR.add(kR);
    } else if (turtleId === "raph") {
      function makeSai() {
        var g = new THREE.Group();
        var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.48, 8), metal);
        shaft.position.y = -0.28; g.add(shaft);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 6), metal);
        tip.position.y = -0.55; g.add(tip);
        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), wrap);
        handle.position.y = 0.02; g.add(handle);
        var cross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.04), darkMetal);
        cross.position.y = -0.07; g.add(cross);
        [-1, 1].forEach(function (s) {
          var prong = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.18, 6), metal);
          prong.position.set(s * 0.07, -0.16, 0);
          prong.rotation.z = s * 0.2;
          g.add(prong);
        });
        return g;
      }
      var sL = makeSai(); sL.rotation.x = Math.PI; parts.fistL.add(sL);
      var sR = makeSai(); sR.rotation.x = Math.PI; parts.fistR.add(sR);
    } else if (turtleId === "don") {
      function makeBo() {
        var bo = new THREE.Group();
        var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.7, 12), wood);
        bo.add(shaft);
        [-0.8, 0.8].forEach(function (y) {
          var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), darkMetal);
          cap.position.y = y; bo.add(cap);
        });
        [-0.25, 0.25].forEach(function (y) {
          var grip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.15, 10), wrap);
          grip.position.y = y; bo.add(grip);
        });
        return bo;
      }
      var held = makeBo();
      held.scale.setScalar(0.9);
      held.rotation.x = Math.PI;
      held.position.set(0.02, -0.4, 0);
      parts.fistR.add(held);
      var back = makeBo();
      back.rotation.z = Math.PI / 2 - 0.4;
      back.rotation.x = 0.2;
      back.position.set(0, 0.15, 0.45);
      parts.shell.add(back);
    } else if (turtleId === "mikey") {
      function stick() {
        var s = new THREE.Group();
        s.add(new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.28, 10), wood));
        var c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.028, 10), darkMetal);
        c1.position.y = 0.14; s.add(c1);
        var c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.028, 10), darkMetal);
        c2.position.y = -0.14; s.add(c2);
        return s;
      }
      var nun = new THREE.Group();
      var a = stick(); a.position.set(-0.02, -0.16, 0); a.rotation.z = 0.5; nun.add(a);
      var b = stick(); b.position.set(0.12, -0.32, 0.02); b.rotation.z = -0.3; nun.add(b);
      for (var li = 0; li < 5; li++) {
        var link = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.007, 6, 10), darkMetal);
        link.position.set(0.035 + li * 0.028, -0.1 - li * 0.045, 0);
        link.rotation.y = Math.PI / 2;
        nun.add(link);
      }
      parts.fistR.add(nun);
      var nun2 = nun.clone();
      nun2.scale.setScalar(0.9);
      parts.fistL.add(nun2);
    }
  }

  function createTurtle3D(maskColorHex, turtleId) {
    maskColorHex = maskColorHex == null ? 0x1e6bff : maskColorHex;
    var letter = ({ leo: "L", raph: "R", don: "D", mikey: "M" })[turtleId] || "L";

    var root = new THREE.Group();
    var rootBob = new THREE.Group();
    root.add(rootBob);

    var skinMap = skinTexture();
    var shellMap = shellTexture();
    var plastMap = plastronTexture();
    var maskMap = maskTexture(maskColorHex);

    var skin = new THREE.MeshStandardMaterial({ map: skinMap, color: 0xffffff, roughness: 0.55, metalness: 0.02 });
    var skinDark = new THREE.MeshStandardMaterial({ color: 0x2f9a28, roughness: 0.62 });
    var skinLight = new THREE.MeshStandardMaterial({ map: skinMap, color: 0xb8ff90, roughness: 0.5 });
    var shellMat = new THREE.MeshStandardMaterial({ map: shellMap, color: 0xffffff, roughness: 0.72, metalness: 0.06 });
    var shellRim = new THREE.MeshStandardMaterial({ color: 0x3a1f0c, roughness: 0.85 });
    var scuteRaised = new THREE.MeshStandardMaterial({ color: 0x9a5a28, roughness: 0.65, metalness: 0.05 });
    var scuteDark = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.8 });
    var platMat = new THREE.MeshStandardMaterial({ map: plastMap, color: 0xffffff, roughness: 0.4 });
    var maskMat = new THREE.MeshStandardMaterial({
      map: maskMap, color: 0xffffff, roughness: 0.55, metalness: 0.05,
      emissive: maskColorHex, emissiveIntensity: 0.12
    });
    var maskSolid = new THREE.MeshStandardMaterial({
      color: maskColorHex, roughness: 0.5, metalness: 0.05,
      emissive: maskColorHex, emissiveIntensity: 0.1
    });
    var white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.18 });
    var pupil = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.12 });
    var beltMat = new THREE.MeshStandardMaterial({ color: 0x241408, roughness: 0.75 });
    var goldMat = new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.25, metalness: 0.8 });
    var beakMat = new THREE.MeshStandardMaterial({ map: skinMap, color: 0x90e060, roughness: 0.55 });

    // ========== TORSO: one clear body (no stacked-sphere caterpillar) ==========
    var torso = new THREE.Group();
    torso.position.y = 0.78;
    rootBob.add(torso);

      // ternary for CapsuleGeometry availability
      var chestGeo = THREE.CapsuleGeometry
        ? new THREE.CapsuleGeometry(0.4, 0.35, 6, 16)
        : new THREE.CylinderGeometry(0.4, 0.42, 0.7, 18);
      var chest = new THREE.Mesh(chestGeo, skin);
    chest.position.y = 0.02;
    torso.add(chest);
    // soft shoulder caps only (not a second body ball)
    var shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skinDark);
    shoulderL.position.set(-0.38, 0.28, 0);
    torso.add(shoulderL);
    var shoulderR = shoulderL.clone();
    shoulderR.position.x = 0.38;
    torso.add(shoulderR);

    // cream plastron — iconic belly plate
    var plastBulge = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), platMat);
    plastBulge.rotation.x = Math.PI;
    plastBulge.position.set(0, 0.02, -0.3);
    plastBulge.scale.set(1.2, 1.45, 0.4);
    torso.add(plastBulge);
    // panel lines
    for (var pi = 0; pi < 3; pi++) {
      var seam = new THREE.Mesh(new THREE.BoxGeometry(0.5 - pi * 0.04, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0xc9a46a }));
      seam.position.set(0, 0.14 - pi * 0.12, -0.44);
      torso.add(seam);
    }
    var midSeam = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0xc9a46a }));
    midSeam.position.set(0, 0.02, -0.44);
    torso.add(midSeam);

    // ========== SHELL — oversized classic carapace ==========
    var shell = makeShellDome(shellMat, shellRim, scuteRaised, scuteDark);
    shell.position.set(0, 0.1, 0.28);
    shell.scale.set(1.25, 1.15, 1.35);
    torso.add(shell);

    // ========== BELT + LETTER ==========
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.055, 8, 28), beltMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = -0.2;
    torso.add(belt);
    var buckle = makeBeltLetter(letter, goldMat);
    buckle.position.set(0, -0.2, -0.5);
    buckle.scale.setScalar(1.2);
    torso.add(buckle);

    // ========== HEAD — smaller relative to shell (classic cartoon) ==========
    var head = new THREE.Group();
    head.position.set(0, 0.52, -0.28);
    head.scale.setScalar(0.95);
    torso.add(head);

    // skull — slightly flattened, not a perfect ball
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 28, 22), skin);
    skull.scale.set(1.12, 0.88, 1.05);
    head.add(skull);
    // brow ridge
    var browRidge = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skinDark);
    browRidge.position.set(0, 0.12, -0.12);
    browRidge.scale.set(1.15, 0.35, 0.7);
    head.add(browRidge);
    // muzzle / beak — clearly turtle
    var muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), beakMat);
    muzzle.position.set(0, -0.06, -0.32);
    muzzle.scale.set(1.25, 0.7, 1.2);
    head.add(muzzle);
    var beakTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), beakMat);
    beakTip.position.set(0, -0.08, -0.46);
    beakTip.scale.set(1.1, 0.7, 1.0);
    head.add(beakTip);
    var nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), skinDark);
    nostrilL.position.set(-0.04, -0.02, -0.5); head.add(nostrilL);
    var nostrilR = nostrilL.clone(); nostrilR.position.x = 0.04; head.add(nostrilR);

    // MASK — thick fabric wrap (classic)
    var maskBand = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 32, 1, true), maskMat);
    maskBand.rotation.x = Math.PI / 2;
    maskBand.position.set(0, 0.08, 0.02);
    head.add(maskBand);
    // mask cheeks (soft, not a box)
    var mCheekL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), maskSolid);
    mCheekL.position.set(-0.26, 0.07, -0.18);
    mCheekL.scale.set(0.9, 0.65, 0.95);
    head.add(mCheekL);
    var mCheekR = mCheekL.clone(); mCheekR.position.x = 0.26; head.add(mCheekR);
    // knot
    var knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), maskSolid);
    knot.position.set(0, 0.06, 0.34);
    head.add(knot);

    // long bandana tails
    var bandL = new THREE.Group();
    bandL.position.set(-0.12, 0.04, 0.32);
    head.add(bandL);
    var bandR = new THREE.Group();
    bandR.position.set(0.12, 0.04, 0.32);
    head.add(bandR);
    for (var b = 0; b < 7; b++) {
      var tw = 0.13 - b * 0.012;
      var segL = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.04, 0.17), b % 2 ? maskSolid : maskMat);
      segL.position.set(-0.05 - b * 0.015, -b * 0.045, 0.08 + b * 0.13);
      segL.rotation.y = -0.2;
      bandL.add(segL);
      var segR = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.04, 0.17), b % 2 ? maskSolid : maskMat);
      segR.position.set(0.05 + b * 0.015, -b * 0.045, 0.08 + b * 0.13);
      segR.rotation.y = 0.2;
      bandR.add(segR);
    }

    // EYES — almond cartoon slits inside mask (not googly balls)
    var eyeLG = new THREE.Group(); eyeLG.position.set(-0.13, 0.08, -0.28); head.add(eyeLG);
    var eyeRG = new THREE.Group(); eyeRG.position.set(0.13, 0.08, -0.28); head.add(eyeRG);
    [-1, 1].forEach(function (side) {
      var hole = side < 0 ? eyeLG : eyeRG;
      var rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.028, 8, 20), maskSolid);
      rim.scale.set(1.35, 1.05, 1);
      rim.position.z = 0.01;
      hole.add(rim);
    });
    // flattened oval whites
    var eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), white);
    eyeWhiteL.scale.set(1.35, 0.95, 0.35);
    eyeWhiteL.position.z = -0.02;
    eyeLG.add(eyeWhiteL);
    var eyeWhiteR = eyeWhiteL.clone();
    eyeRG.add(eyeWhiteR);
    var pupL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), pupil);
    pupL.position.set(0.015, -0.005, -0.055);
    pupL.scale.set(1.1, 1.2, 0.6);
    eyeLG.add(pupL);
    var pupR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), pupil);
    pupR.position.set(-0.015, -0.005, -0.055);
    pupR.scale.set(1.1, 1.2, 0.6);
    eyeRG.add(pupR);
    var shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), white);
    var sh1 = shine.clone(); sh1.position.set(-0.03, 0.03, -0.06); eyeLG.add(sh1);
    var sh2 = shine.clone(); sh2.position.set(-0.03, 0.03, -0.06); eyeRG.add(sh2);

    // smile
    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 14, Math.PI), pupil);
    smile.position.set(0, -0.16, -0.4);
    smile.rotation.set(Math.PI, 0, 0);
    head.add(smile);

    // ========== ARMS — thick, readable, away from body ==========
    function makeArm(side) {
      var upper = new THREE.Group();
      upper.position.set(side * 0.62, 0.2, 0.02);
      upper.rotation.z = side * 0.72; // wide A-pose — limbs must read
      torso.add(upper);
      var shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), skinDark);
      upper.add(shoulder);
      var uMesh = THREE.CapsuleGeometry
        ? new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.22, 5, 12), skin)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 12), skin);
      uMesh.position.y = -0.2;
      upper.add(uMesh);
      var bicep = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skinLight);
      bicep.position.set(0, -0.18, 0);
      bicep.scale.set(1.15, 0.85, 1.1);
      upper.add(bicep);
      var elbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), maskSolid);
      elbowPad.position.y = -0.4;
      upper.add(elbowPad);
      var fore = new THREE.Group();
      fore.position.y = -0.4;
      upper.add(fore);
      var fMesh = THREE.CapsuleGeometry
        ? new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.18, 5, 12), skin)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.09, 0.34, 12), skin);
      fMesh.position.y = -0.18;
      fore.add(fMesh);
      var fist = makeThreeFingerHand(skin, maskSolid);
      fist.position.y = -0.38;
      fist.scale.setScalar(1.2);
      fore.add(fist);
      return { upper: upper, fore: fore, fist: fist };
    }
    var leftArm = makeArm(-1);
    var rightArm = makeArm(1);

    // ========== LEGS ==========
    function makeLeg(side) {
      var thigh = new THREE.Group();
      thigh.position.set(side * 0.22, -0.5, 0.04);
      rootBob.add(thigh);
      var tMesh = THREE.CapsuleGeometry
        ? new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.16, 5, 12), skin)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.32, 12), skin);
      tMesh.position.y = -0.16;
      thigh.add(tMesh);
      var bulk = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skinDark);
      bulk.position.set(0, -0.1, 0);
      bulk.scale.set(1.2, 0.85, 1.1);
      thigh.add(bulk);
      var kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), maskSolid);
      kneePad.position.y = -0.32;
      thigh.add(kneePad);
      var shin = new THREE.Group();
      shin.position.y = -0.32;
      thigh.add(shin);
      var sMesh = THREE.CapsuleGeometry
        ? new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.14, 5, 12), skin)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.095, 0.28, 12), skin);
      sMesh.position.y = -0.15;
      shin.add(sMesh);
      var foot = makeThreeToeFoot(skin, maskSolid);
      foot.position.set(0, -0.32, -0.04);
      foot.scale.setScalar(1.2);
      shin.add(foot);
      return { thigh: thigh, shin: shin, foot: foot };
    }
    var leftLeg = makeLeg(-1);
    var rightLeg = makeLeg(1);

    var parts = {
      rootBob: rootBob,
      head: head,
      torso: torso,
      shell: shell,
      leftArm: leftArm.upper,
      rightArm: rightArm.upper,
      leftFore: leftArm.fore,
      rightFore: rightArm.fore,
      leftLeg: leftLeg.thigh,
      rightLeg: rightLeg.thigh,
      leftShin: leftLeg.shin,
      rightShin: rightLeg.shin,
      bandL: bandL,
      bandR: bandR,
      eyeL: eyeLG,
      eyeR: eyeRG,
      fistL: leftArm.fist,
      fistR: rightArm.fist
    };

    attachTurtleWeapon(parts, turtleId);
    shadowify(root);
    root.userData.parts = parts;
    root.userData.type = "turtle";
    root.userData.turtleId = turtleId || null;
    root.userData.anim = { attack: 0, blink: 0 };
    return root;
  }

  function animateTurtleIdle(group, t) {
    var p = group.userData.parts; if (!p) return;
    var breath = Math.sin(t * 2.0) * 0.03;
    p.rootBob.position.y = breath;
    p.torso.scale.y = 1 + breath * 0.35;
    p.head.rotation.y = Math.sin(t * 0.8) * 0.28;
    p.head.rotation.z = Math.sin(t * 0.6) * 0.08;
    p.head.rotation.x = Math.sin(t * 1.0) * 0.04;
    // keep A-pose readable while breathing
    p.leftArm.rotation.z = 0.72 + Math.sin(t * 1.3) * 0.08;
    p.rightArm.rotation.z = -0.72 - Math.sin(t * 1.3) * 0.08;
    p.leftArm.rotation.x = Math.sin(t * 1.1) * 0.12;
    p.rightArm.rotation.x = -Math.sin(t * 1.1) * 0.12;
    p.bandL.rotation.x = Math.sin(t * 3.2) * 0.5;
    p.bandR.rotation.x = Math.sin(t * 3.2 + 1.1) * 0.5;
    p.bandL.rotation.z = 0.3 + Math.sin(t * 2.3) * 0.4;
    p.bandR.rotation.z = -0.3 - Math.sin(t * 2.3 + 0.6) * 0.4;
    p.bandL.rotation.y = Math.sin(t * 1.9) * 0.22;
    p.bandR.rotation.y = -Math.sin(t * 1.9 + 0.4) * 0.22;
    var blink = (Math.sin(t * 0.6) > 0.94) ? 0.1 : 1;
    if (p.eyeL) p.eyeL.scale.y = blink;
    if (p.eyeR) p.eyeR.scale.y = blink;
  }

  function animateTurtleRun(group, t) {
    var p = group.userData.parts; if (!p) return;
    var a = group.userData.anim || (group.userData.anim = { attack: 0 });
    if (a.attack > 0) {
      animateTurtleAttack(group, 1 - a.attack);
      a.attack = Math.max(0, a.attack - 0.05);
      return;
    }
    var f = 14;
    var s = Math.sin(t * f);
    var c = Math.cos(t * f);
    var sHard = Math.sign(s) * Math.pow(Math.abs(s), 0.7);

    p.rootBob.position.y = Math.abs(s) * 0.18;
    p.rootBob.rotation.z = c * 0.05;
    p.torso.rotation.z = sHard * 0.12;
    p.torso.rotation.x = -0.22;
    p.torso.rotation.y = c * 0.08;
    p.head.rotation.x = 0.12 + Math.abs(s) * 0.04;
    p.head.rotation.y = -c * 0.2;
    p.head.rotation.z = sHard * -0.05;

    p.leftArm.rotation.x = sHard * 1.35;
    p.rightArm.rotation.x = -sHard * 1.35;
    p.leftArm.rotation.z = 0.35 + Math.max(0, s) * 0.15;
    p.rightArm.rotation.z = -0.35 - Math.max(0, -s) * 0.15;
    p.leftFore.rotation.x = 0.5 + Math.max(0, s) * 0.85;
    p.rightFore.rotation.x = 0.5 + Math.max(0, -s) * 0.85;

    p.leftLeg.rotation.x = -sHard * 1.15;
    p.rightLeg.rotation.x = sHard * 1.15;
    p.leftShin.rotation.x = 0.4 + Math.max(0, -s) * 0.95;
    p.rightShin.rotation.x = 0.4 + Math.max(0, s) * 0.95;

    p.bandL.rotation.x = c * 1.15 + 0.35;
    p.bandR.rotation.x = -c * 1.15 + 0.35;
    p.bandL.rotation.y = s * 0.7;
    p.bandR.rotation.y = s * 0.7;
    p.bandL.rotation.z = 0.4 + Math.sin(t * f * 0.7) * 0.4;
    p.bandR.rotation.z = -0.4 - Math.sin(t * f * 0.7 + 0.4) * 0.4;

    if (p.eyeL) p.eyeL.scale.y = 1;
    if (p.eyeR) p.eyeR.scale.y = 1;
  }

  function animateTurtleAttack(group, t01) {
    var p = group.userData.parts; if (!p) return;
    var k = Math.sin(Math.min(1, Math.max(0, t01)) * Math.PI);
    p.rightArm.rotation.x = -1.7 * k;
    p.rightFore.rotation.x = -0.85 * k;
    p.leftArm.rotation.x = 0.7 * k;
    p.torso.rotation.y = -0.45 * k;
    p.head.rotation.y = 0.3 * k;
    p.rootBob.position.y = 0.12 * k;
  }

  function triggerAttack(group) {
    if (!group.userData.anim) group.userData.anim = {};
    group.userData.anim.attack = 1;
  }

  // ---------- broccoli ----------

  function createBroccoli3D(variant) {
    variant = variant || "scout";
    var g = new THREE.Group();
    var bob = new THREE.Group();
    g.add(bob);
    var floretColor = 0x2f9b2f, stalkColor = 0xd8e6a8, scale = 1, emissive = 0x000000;
    if (variant === "bomber") { floretColor = 0x7a9a2a; emissive = 0x551010; }
    if (variant === "ninja") { floretColor = 0x15401c; stalkColor = 0x3a4a3a; }
    if (variant === "boss") { floretColor = 0x276b26; scale = 2.35; }

    var floretMat = new THREE.MeshStandardMaterial({ color: floretColor, roughness: 0.8, emissive: emissive, emissiveIntensity: 0.4, flatShading: true });
    var stalkMat = new THREE.MeshStandardMaterial({ color: stalkColor, roughness: 0.75 });
    var eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var eyeB = new THREE.MeshStandardMaterial({ color: 0x111111 });

    var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.45, 12), stalkMat);
    stalk.position.y = 0.22; bob.add(stalk);
    var core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), floretMat);
    core.position.y = 0.72; bob.add(core);
    var mini = new THREE.IcosahedronGeometry(0.17, 0);
    [[0.34,0.78,0.12],[-0.3,0.75,-0.08],[0.05,1.0,0.22],[-0.12,1.02,-0.18],[0.22,0.58,-0.28],[-0.22,0.6,0.25]].forEach(function (p) {
      var m = new THREE.Mesh(mini, floretMat); m.position.set(p[0], p[1], p[2]); bob.add(m);
    });
    var eL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeW); eL.position.set(-0.14, 0.72, -0.36); bob.add(eL);
    var eR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeW); eR.position.set(0.14, 0.72, -0.36); bob.add(eR);
    var pL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), eyeB); pL.position.set(-0.14, 0.7, -0.44); bob.add(pL);
    var pR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), eyeB); pR.position.set(0.14, 0.7, -0.44); bob.add(pR);
    var browL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), eyeB); browL.position.set(-0.14, 0.84, -0.4); browL.rotation.z = 0.45; bob.add(browL);
    var browR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.03), eyeB); browR.position.set(0.14, 0.84, -0.4); browR.rotation.z = -0.45; bob.add(browR);

    var footMat = stalkMat;
    var f1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), footMat); f1.position.set(-0.16, 0.06, 0.1); bob.add(f1);
    var f2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), footMat); f2.position.set(0.16, 0.06, 0.1); bob.add(f2);

    if (variant === "boss") {
      var spikeMat = new THREE.MeshStandardMaterial({ color: 0x1a331a, metalness: 0.35, roughness: 0.45 });
      [[0.5,0.9,0],[ -0.5,0.9,0],[0,1.25,0],[0,0.75,0.5],[0,0.75,-0.5]].forEach(function (d) {
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 8), spikeMat);
        sp.position.set(d[0], d[1], d[2]);
        bob.add(sp);
      });
    }
    if (variant === "ninja") {
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      band.rotation.x = Math.PI / 2; band.position.y = 0.72; bob.add(band);
    }

    g.scale.setScalar(scale);
    shadowify(g);
    g.userData.type = "broccoli";
    g.userData.variant = variant;
    g.userData.parts = { bob: bob };
    return g;
  }

  function animateBroccoli(group, t, variant) {
    var bob = group.userData.parts && group.userData.parts.bob;
    if (!bob) return;
    variant = variant || group.userData.variant || "scout";
    if (variant === "ninja") {
      bob.rotation.y += 0.12;
      bob.position.y = Math.abs(Math.sin(t * 8)) * 0.15;
    } else if (variant === "boss") {
      bob.position.y = Math.sin(t * 2) * 0.08;
      bob.rotation.z = Math.sin(t * 1.5) * 0.08;
    } else {
      bob.position.y = Math.abs(Math.sin(t * 6)) * 0.18;
      bob.rotation.y = Math.sin(t * 3) * 0.25;
    }
  }

  // ---------- pizza ----------

  function createPizza3D(gold) {
    var g = new THREE.Group();
    var spin = new THREE.Group();
    g.add(spin);
    var crustMat = new THREE.MeshStandardMaterial({
      color: gold ? 0xffd94a : 0xd39a4a, roughness: 0.7,
      emissive: gold ? 0xffb800 : 0x000000, emissiveIntensity: gold ? 0.6 : 0, metalness: gold ? 0.4 : 0
    });
    var cheeseMat = new THREE.MeshStandardMaterial({
      color: gold ? 0xfff2a0 : 0xffd066, roughness: 0.5,
      emissive: gold ? 0xffea70 : 0x000000, emissiveIntensity: gold ? 0.4 : 0
    });
    var pepMat = new THREE.MeshStandardMaterial({ color: gold ? 0xffb040 : 0xb02a1a, roughness: 0.5 });
    spin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.09, 28), crustMat));
    var cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.045, 28), cheeseMat);
    cheese.position.y = 0.06; spin.add(cheese);
    var pepGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.025, 14);
    [[0,0],[0.2,0.14],[-0.18,0.16],[0.12,-0.22],[-0.24,-0.08],[0.26,-0.06],[-0.05,0.26]].forEach(function (p) {
      var m = new THREE.Mesh(pepGeo, pepMat); m.position.set(p[0], 0.09, p[1]); spin.add(m);
    });
    for (var i = 0; i < 4; i++) {
      var blob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheeseMat);
      blob.position.set(Math.cos(i)*0.25, 0.08, Math.sin(i)*0.25);
      blob.scale.set(1, 0.5, 1);
      spin.add(blob);
    }
    shadowify(g);
    g.userData.type = gold ? "pizza_gold" : "pizza";
    g.userData.parts = { spin: spin };
    g.userData.gold = !!gold;
    return g;
  }

  // Cute spin + hover; supports gold pulse
  function animatePizza(mesh, t) {
    if (!mesh) return;
    var spin = mesh.userData.parts && mesh.userData.parts.spin;
    var target = spin || mesh;
    var gold = !!(mesh.userData && mesh.userData.gold);
    target.rotation.y = t * (gold ? 3.6 : 2.2);
    target.rotation.z = Math.sin(t * 3) * 0.12;
    target.position.y = Math.sin(t * 4) * 0.08 + (gold ? 0.05 : 0);
    if (gold) {
      var s = 1 + Math.sin(t * 6) * 0.07;
      target.scale.set(s, s, s);
    }
  }

  // ---------- sewer chunk ----------

  var _brick = null;
  function brickTex() {
    if (!_brick) _brick = createSewerTexture();
    return _brick;
  }

  function createSewerChunk(zPos, length) {
    length = length == null ? 20 : length;
    var g = new THREE.Group();
    var width = 9, height = 5.2;
    var base = brickTex();
    function map(rx, ry) {
      var t = base.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
    }
    // Higher contrast tinting per surface
    var floorMat = new THREE.MeshStandardMaterial({ map: map(length / 3.5, width / 3.5), color: 0xd8cfc4, roughness: 0.95 });
    var wallMat = new THREE.MeshStandardMaterial({ map: map(length / 3.5, height / 2.5), color: 0xb8a898, roughness: 0.9 });
    var ceilMat = new THREE.MeshStandardMaterial({ map: map(length / 3.5, width / 3.5), color: 0x6d5d54, roughness: 0.96 });

    var floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, length), floorMat);
    floor.position.y = -0.22; g.add(floor);
    var left = new THREE.Mesh(new THREE.BoxGeometry(0.4, height, length), wallMat);
    left.position.set(-width / 2, height / 2, 0); g.add(left);
    var right = new THREE.Mesh(new THREE.BoxGeometry(0.4, height, length), wallMat);
    right.position.set(width / 2, height / 2, 0); g.add(right);
    var arch = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, length, 16, 1, true, 0, Math.PI), ceilMat);
    arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.y = height; g.add(arch);

    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x6a7380, roughness: 0.35, metalness: 0.75 });
    var pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, length, 12);
    var pL = new THREE.Mesh(pipeGeo, pipeMat); pL.rotation.x = Math.PI / 2; pL.position.set(-width / 2 + 0.45, 3.5, 0); g.add(pL);
    var pR = new THREE.Mesh(pipeGeo, pipeMat); pR.rotation.x = Math.PI / 2; pR.position.set(width / 2 - 0.45, 3.5, 0); g.add(pR);

    // hanging pipes + drips
    var hangMat = new THREE.MeshStandardMaterial({ color: 0x555e68, metalness: 0.7, roughness: 0.4 });
    for (var h = 0; h < 3; h++) {
      var hz = -length / 2 + 4 + h * (length / 3);
      var hang = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), hangMat);
      hang.position.set((h % 2 ? 1 : -1) * 1.8, 4.2, hz); g.add(hang);
      var drip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshStandardMaterial({
        color: 0x7dffb0, emissive: 0x3ecf7a, emissiveIntensity: 1.1, transparent: true, opacity: 0.9
      }));
      drip.position.set(hang.position.x, 3.4, hz);
      drip.userData.drip = true;
      drip.userData.baseY = 3.4;
      drip.userData.phase = Math.random() * Math.PI * 2;
      g.add(drip);
    }

    // brighter lanterns
    var lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfff0b0, emissive: 0xffaa30, emissiveIntensity: 2.2
    });
    var lanternCage = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.6, metalness: 0.4 });
    for (var L = 0; L < 2; L++) {
      var lz = -length / 2 + 6 + L * (length / 2);
      [[-1, -width / 2 + 0.4], [1, width / 2 - 0.4]].forEach(function (side) {
        var lantern = new THREE.Group();
        var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), lanternMat);
        lantern.add(bulb);
        var cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 10), lanternCage);
        cap.position.y = 0.22;
        lantern.add(cap);
        var hook = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), lanternCage);
        hook.position.y = 0.44;
        lantern.add(hook);
        lantern.position.set(side[1], 2.7, lz);
        g.add(lantern);
        var light = new THREE.PointLight(0xffc060, 1.15, 12, 1.6);
        light.position.set(side[1], 2.6, lz);
        g.add(light);
        // subtle halo billboard
        var halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 12, 10),
          new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0.14 })
        );
        halo.position.copy(lantern.position);
        g.add(halo);
      });
    }

    // slime puddles
    var slimeMat = new THREE.MeshStandardMaterial({
      color: 0x39ff88, emissive: 0x22cc55, emissiveIntensity: 1.0,
      roughness: 0.25, transparent: true, opacity: 0.8
    });
    for (var sp = 0; sp < 2; sp++) {
      var slime = new THREE.Mesh(new THREE.CircleGeometry(0.9 + Math.random() * 0.5, 22), slimeMat);
      slime.rotation.x = -Math.PI / 2;
      slime.position.set((Math.random() - 0.5) * 4, 0.02, (Math.random() - 0.5) * (length - 4));
      g.add(slime);
    }

    var grate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, length), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.65, roughness: 0.45 }));
    grate.position.y = 0.01; g.add(grate);

    shadowify(g);
    floor.castShadow = false; arch.castShadow = false;
    g.position.z = zPos;
    g.userData.type = "sewerChunk";
    g.userData.length = length;
    return g;
  }

  function animateSewerChunk(group, t) {
    group.traverse(function (o) {
      if (o.userData && o.userData.drip) {
        o.position.y = o.userData.baseY - ((t * 1.5 + o.userData.phase) % 1.8);
        o.scale.setScalar(0.7 + 0.3 * Math.sin(t * 6 + o.userData.phase));
      }
    });
  }

  // ---------- lane markers ----------

  function createLaneMarkers() {
    var g = new THREE.Group();
    var lanes = [-2.2, 0, 2.2];
    var stripLen = 60, stripW = 0.16;
    lanes.forEach(function (x, idx) {
      var color = (idx === 1) ? 0x66ffa8 : 0x66c8ff;
      var mat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.55
      });
      var strip = new THREE.Mesh(new THREE.BoxGeometry(stripW, 0.02, stripLen), mat);
      strip.position.set(x, 0.03, 0);
      g.add(strip);
      // dashed centerline glow dots
      for (var i = 0; i < 12; i++) {
        var dot = new THREE.Mesh(
          new THREE.BoxGeometry(stripW * 0.9, 0.015, 0.35),
          new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 })
        );
        dot.position.set(x, 0.04, -stripLen / 2 + i * (stripLen / 12) + 1);
        g.add(dot);
      }
    });
    g.userData.type = "laneMarkers";
    return g;
  }

  // ---------- speed lines ----------

  function createSpeedLines() {
    var g = new THREE.Group();
    var count = 26;
    var mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.55
    });
    for (var i = 0; i < count; i++) {
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1.6 + Math.random() * 1.4), mat);
      line.userData.baseX = (Math.random() - 0.5) * 7.5;
      line.userData.baseY = 0.4 + Math.random() * 3.6;
      line.userData.offset = Math.random() * 60;
      line.userData.baseSpeed = 0.7 + Math.random() * 1.6;
      line.userData.baseLen = line.geometry.parameters.depth;
      line.position.set(line.userData.baseX, line.userData.baseY, 0);
      g.add(line);
    }
    g.userData.type = "speedLines";
    g.userData.range = 40;
    g.visible = false;
    return g;
  }

  function animateSpeedLines(group, t, speed) {
    if (!group || group.userData.type !== "speedLines") return;
    var range = group.userData.range || 40;
    var spd = Math.max(0, speed == null ? 1 : speed);
    // Fade in/out by target speed
    var vis = spd > 0.05;
    group.visible = vis;
    if (!vis) return;
    var opacityBoost = Math.min(1, spd / 3);
    group.children.forEach(function (line) {
      var u = line.userData;
      var z = (((t * (10 + spd * 12) * u.baseSpeed) + u.offset) % range) - range / 2;
      line.position.z = z;
      // slight lateral wobble
      line.position.x = u.baseX + Math.sin(t * 2 + u.offset) * 0.05;
      // stretch by speed
      var stretch = 1 + spd * 0.6;
      line.scale.z = stretch;
      if (line.material && line.material.opacity !== undefined) {
        line.material.opacity = 0.35 * opacityBoost + 0.2;
      }
    });
  }

  // ---------- FX: sparks / confetti / collect ring ----------

  function createHitSpark() {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0xffe27a, emissive: 0xffaa00, emissiveIntensity: 1.5 });
    for (var i = 0; i < 10; i++) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat);
      var a = Math.random() * Math.PI * 2;
      m.position.set(Math.cos(a) * 0.2, Math.random() * 0.4, Math.sin(a) * 0.2);
      m.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4);
      g.add(m);
    }
    g.userData.life = 0.45;
    g.userData.type = "fx";
    return g;
  }

  function createConfettiBurst(color) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: color || 0x3ecf7a, emissive: color || 0x3ecf7a, emissiveIntensity: 0.6 });
    for (var i = 0; i < 14; i++) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), mat);
      m.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5);
      g.add(m);
    }
    g.userData.life = 0.7;
    g.userData.type = "fx";
    return g;
  }

  // Expanding torus "ding!" ring for pickups
  function createCollectRing(color) {
    color = color == null ? 0xffe27a : color;
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: 1.0
    });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.055, 8, 24), mat);
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    // inner sparkle disc
    var disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 18),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.005;
    g.add(disc);
    g.userData.type = "fx";
    g.userData.ring = { total: 0.5, elapsed: 0, mat: mat, discMat: disc.material };
    g.userData.life = 0.5;
    return g;
  }

  function updateFX(group, dt) {
    if (!group || group.userData.type !== "fx") return false;
    group.userData.life -= dt;

    // Expanding-ring update path
    if (group.userData.ring) {
      var r = group.userData.ring;
      r.elapsed += dt;
      var k = Math.min(1, r.elapsed / r.total);
      var scale = 0.4 + k * 3.2;
      group.scale.set(scale, 1, scale);
      var op = 1 - k;
      if (r.mat) r.mat.opacity = op;
      if (r.discMat) r.discMat.opacity = 0.55 * op;
      return group.userData.life > 0;
    }

    group.children.forEach(function (m) {
      if (!m.userData.vel) return;
      m.position.addScaledVector(m.userData.vel, dt);
      m.userData.vel.y -= 9 * dt;
      m.rotation.x += dt * 8;
      m.rotation.y += dt * 6;
    });
    return group.userData.life > 0;
  }

  // ---------- exports ----------

  global.TMNTMeshes = {
    createTurtle3D: createTurtle3D,
    createBroccoli3D: createBroccoli3D,
    createPizza3D: createPizza3D,
    createSewerChunk: createSewerChunk,
    createSewerTexture: createSewerTexture,
    createHitSpark: createHitSpark,
    createConfettiBurst: createConfettiBurst,
    createCollectRing: createCollectRing,
    createLaneMarkers: createLaneMarkers,
    createSpeedLines: createSpeedLines,
    animateTurtleIdle: animateTurtleIdle,
    animateTurtleRun: animateTurtleRun,
    animateTurtleAttack: animateTurtleAttack,
    animateBroccoli: animateBroccoli,
    animateSewerChunk: animateSewerChunk,
    animateSpeedLines: animateSpeedLines,
    animatePizza: animatePizza,
    triggerAttack: triggerAttack,
    updateFX: updateFX
  };
})(window);
