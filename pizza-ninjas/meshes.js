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

  // ---------- weapons ----------

  function attachTurtleWeapon(parts, turtleId) {
    if (!turtleId) return;
    var metal = new THREE.MeshStandardMaterial({ color: 0xd6d9df, roughness: 0.28, metalness: 0.85 });
    var darkMetal = new THREE.MeshStandardMaterial({ color: 0x6a707a, roughness: 0.4, metalness: 0.75 });
    var wrap = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xffcc55, roughness: 0.35, metalness: 0.6 });
    var wood = new THREE.MeshStandardMaterial({ color: 0x6b3a18, roughness: 0.75 });

    if (turtleId === "leo") {
      // Twin katanas as crossed scabbards on the shell (back)
      for (var i = 0; i < 2; i++) {
        var kat = new THREE.Group();
        var blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.015), metal);
        blade.position.y = 0.34;
        kat.add(blade);
        var guard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.05), gold);
        guard.position.y = -0.02;
        kat.add(guard);
        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.18, 0.038), wrap);
        handle.position.y = -0.13;
        kat.add(handle);
        var pommel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), gold);
        pommel.position.y = -0.23;
        kat.add(pommel);
        kat.position.set(0, 0.05, 0.22);
        kat.rotation.z = (i === 0 ? 1 : -1) * 0.55;
        kat.rotation.x = 0.15;
        parts.shell.add(kat);
      }
    } else if (turtleId === "raph") {
      // Sai in each fist (thin cylinders + crossguard prongs)
      function makeSai() {
        var g = new THREE.Group();
        var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 8), metal);
        shaft.position.y = -0.22;
        g.add(shaft);
        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), wrap);
        handle.position.y = 0.02;
        g.add(handle);
        var cross = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.03), darkMetal);
        cross.position.y = -0.05;
        g.add(cross);
        var pL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), metal);
        pL.position.set(-0.06, -0.11, 0);
        g.add(pL);
        var pR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), metal);
        pR.position.set(0.06, -0.11, 0);
        g.add(pR);
        return g;
      }
      var sL = makeSai(); sL.rotation.x = -0.4; parts.fistL.add(sL);
      var sR = makeSai(); sR.rotation.x = -0.4; parts.fistR.add(sR);
    } else if (turtleId === "don") {
      // Bo staff diagonally across the back
      var bo = new THREE.Group();
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.5, 10), wood);
      bo.add(shaft);
      var capA = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.06, 10), darkMetal);
      capA.position.y = 0.75;
      bo.add(capA);
      var capB = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.06, 10), darkMetal);
      capB.position.y = -0.75;
      bo.add(capB);
      var gripA = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 10), wrap);
      gripA.position.y = 0.18;
      bo.add(gripA);
      var gripB = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 10), wrap);
      gripB.position.y = -0.18;
      bo.add(gripB);
      bo.rotation.z = Math.PI / 2 - 0.5;
      bo.position.set(0, 0.05, 0.22);
      parts.shell.add(bo);
    } else if (turtleId === "mikey") {
      // Nunchucks hanging from right fist: two short cylinders + thin link
      var nun = new THREE.Group();
      var stickA = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 8), wood);
      stickA.position.set(-0.06, -0.16, 0);
      stickA.rotation.z = 0.35;
      nun.add(stickA);
      var stickB = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 8), wood);
      stickB.position.set(0.08, -0.22, 0);
      stickB.rotation.z = -0.15;
      nun.add(stickB);
      var link = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.09, 0.008), darkMetal);
      link.position.set(0.01, -0.05, 0);
      link.rotation.z = -0.5;
      nun.add(link);
      // metal caps
      var cA1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 8), darkMetal);
      cA1.position.copy(stickA.position); cA1.rotation.copy(stickA.rotation);
      cA1.translateY(0.12); nun.add(cA1);
      var cB1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 8), darkMetal);
      cB1.position.copy(stickB.position); cB1.rotation.copy(stickB.rotation);
      cB1.translateY(0.12); nun.add(cB1);
      parts.fistR.add(nun);
    }
  }

  // ---------- turtle ----------

  function createTurtle3D(maskColorHex, turtleId) {
    maskColorHex = maskColorHex == null ? 0x2f6bff : maskColorHex;
    var root = new THREE.Group();
    var rootBob = new THREE.Group();
    root.add(rootBob);

    var skin = new THREE.MeshStandardMaterial({ color: 0x5fd13a, roughness: 0.55, metalness: 0.05 });
    var skinDark = new THREE.MeshStandardMaterial({ color: 0x3fa028, roughness: 0.65 });
    var shellMat = new THREE.MeshStandardMaterial({ color: 0x6b3a18, roughness: 0.7, metalness: 0.1 });
    var shellEdge = new THREE.MeshStandardMaterial({ color: 0x3d220e, roughness: 0.8 });
    var platMat = new THREE.MeshStandardMaterial({ color: 0xffe4a1, roughness: 0.45 });
    var maskMat = new THREE.MeshStandardMaterial({ color: maskColorHex, roughness: 0.4, metalness: 0.05 });
    var white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    var iris = new THREE.MeshStandardMaterial({ color: maskColorHex, roughness: 0.3 });
    var pupil = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.2 });
    var beltMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 });
    var buckleMat = new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.35, metalness: 0.6 });

    // torso
    var torso = new THREE.Group();
    torso.position.y = 0.78;
    rootBob.add(torso);
    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 18), skin);
    belly.scale.set(1.05, 1.1, 0.95);
    torso.add(belly);
    var plastron = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), platMat);
    plastron.rotation.x = Math.PI;
    plastron.position.set(0, -0.02, -0.26);
    plastron.scale.set(1.15, 1.35, 0.55);
    torso.add(plastron);
    for (var i = 0; i < 3; i++) {
      var line = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.05, 0.02, 0.02), shellEdge);
      line.position.set(0, 0.08 - i * 0.12, -0.42);
      torso.add(line);
    }

    // shell
    var shell = new THREE.Group();
    shell.position.set(0, 0.08, 0.28);
    torso.add(shell);
    var shellDome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58), shellMat);
    shellDome.rotation.x = Math.PI / 2;
    shellDome.scale.set(1.1, 0.95, 1.2);
    shell.add(shellDome);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 10, 28), shellEdge);
    rim.rotation.x = Math.PI / 2;
    rim.position.z = -0.05;
    shell.add(rim);
    for (var p = 0; p < 6; p++) {
      var ang = (p / 6) * Math.PI * 2;
      var plate = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), shellEdge);
      plate.position.set(Math.cos(ang) * 0.22, Math.sin(ang) * 0.18 + 0.05, 0.32);
      plate.rotation.x = -0.9;
      shell.add(plate);
    }

    // belt + buckle
    var belt = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.045, 8, 28), beltMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = -0.18;
    torso.add(belt);
    var buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.06), buckleMat);
    buckle.position.set(0, -0.18, -0.46);
    torso.add(buckle);

    // head
    var head = new THREE.Group();
    head.position.set(0, 0.58, -0.12);
    torso.add(head);
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), skin);
    head.add(skull);
    var cheeks = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), skinDark);
    cheeks.position.set(0, -0.08, -0.12);
    cheeks.scale.set(1.4, 0.7, 0.9);
    head.add(cheeks);

    var mask = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.13, 24, 1, true), maskMat);
    mask.rotation.x = Math.PI / 2;
    mask.position.y = 0.05;
    head.add(mask);

    // bandana tails
    var bandL = new THREE.Group();
    bandL.position.set(-0.28, 0.06, 0.18);
    head.add(bandL);
    var bandR = new THREE.Group();
    bandR.position.set(0.28, 0.06, 0.18);
    head.add(bandR);
    for (var b = 0; b < 3; b++) {
      var segL = new THREE.Mesh(new THREE.BoxGeometry(0.09 - b * 0.015, 0.035, 0.14), maskMat);
      segL.position.set(-0.02, -b * 0.02, 0.1 + b * 0.11);
      bandL.add(segL);
      var segR = new THREE.Mesh(new THREE.BoxGeometry(0.09 - b * 0.015, 0.035, 0.14), maskMat);
      segR.position.set(0.02, -b * 0.02, 0.1 + b * 0.11);
      bandR.add(segR);
    }

    // eyes
    var eyeLG = new THREE.Group(); eyeLG.position.set(-0.13, 0.05, -0.26); head.add(eyeLG);
    var eyeRG = new THREE.Group(); eyeRG.position.set(0.13, 0.05, -0.26); head.add(eyeRG);
    eyeLG.add(new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), white));
    eyeRG.add(new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), white));
    var irisL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), iris); irisL.position.z = -0.055; eyeLG.add(irisL);
    var irisR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), iris); irisR.position.z = -0.055; eyeRG.add(irisR);
    var pupL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), pupil); pupL.position.z = -0.09; eyeLG.add(pupL);
    var pupR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), pupil); pupR.position.z = -0.09; eyeRG.add(pupR);
    var shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), white);
    var s1 = shine.clone(); s1.position.set(-0.03, 0.03, -0.1); eyeLG.add(s1);
    var s2 = shine.clone(); s2.position.set(-0.03, 0.03, -0.1); eyeRG.add(s2);

    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 14, Math.PI), pupil);
    smile.position.set(0, -0.1, -0.28);
    smile.rotation.set(Math.PI, 0, 0);
    head.add(smile);

    // two-bone arms
    function makeArm(side) {
      var upper = limbSeg(0.095, 0.34, skin);
      upper.position.set(side * 0.48, 0.2, -0.05);
      torso.add(upper);
      var fore = limbSeg(0.08, 0.30, skin);
      fore.position.y = -0.34;
      upper.add(fore);
      var wrap = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 14), maskMat);
      wrap.position.y = -0.12;
      fore.add(wrap);
      var fist = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), skin);
      fist.position.y = -0.34;
      fore.add(fist);
      return { upper: upper, fore: fore, fist: fist };
    }
    var leftArm = makeArm(-1);
    var rightArm = makeArm(1);

    // two-bone legs
    function makeLeg(side) {
      var thigh = limbSeg(0.11, 0.28, skin);
      thigh.position.set(side * 0.22, -0.42, 0);
      rootBob.add(thigh);
      var shin = limbSeg(0.095, 0.26, skin);
      shin.position.y = -0.28;
      thigh.add(shin);
      var wrap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 14), maskMat);
      wrap.position.y = -0.1;
      shin.add(wrap);
      var foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skin);
      foot.scale.set(1, 0.7, 1.35);
      foot.position.set(0, -0.3, -0.04);
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

    // optional weapon prop by turtle id
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
    var breath = Math.sin(t * 2.0) * 0.04;
    p.rootBob.position.y = breath;
    p.torso.scale.y = 1 + breath * 0.5;
    p.head.rotation.y = Math.sin(t * 0.9) * 0.35;
    p.head.rotation.z = Math.sin(t * 0.7) * 0.08;
    p.leftArm.rotation.z = 0.35 + Math.sin(t * 1.5) * 0.08;
    p.rightArm.rotation.z = -0.35 - Math.sin(t * 1.5) * 0.08;
    p.leftArm.rotation.x = Math.sin(t * 1.2) * 0.15;
    p.rightArm.rotation.x = -Math.sin(t * 1.2) * 0.15;
    p.bandL.rotation.x = Math.sin(t * 3.0) * 0.35;
    p.bandR.rotation.x = Math.sin(t * 3.0 + 1) * 0.35;
    p.bandL.rotation.z = Math.sin(t * 2.2) * 0.25;
    p.bandR.rotation.z = -Math.sin(t * 2.2 + 0.5) * 0.25;
    var blink = (Math.sin(t * 0.7) > 0.92) ? 0.15 : 1;
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
    // Punchier stride: faster cycle, bigger bob, extra shoulder + hip snap
    var f = 14;
    var s = Math.sin(t * f);
    var c = Math.cos(t * f);
    var sHard = Math.sign(s) * Math.pow(Math.abs(s), 0.7); // snappier ease

    p.rootBob.position.y = Math.abs(s) * 0.18;
    p.rootBob.rotation.z = c * 0.05;
    p.torso.rotation.z = sHard * 0.12;
    p.torso.rotation.x = -0.22; // stronger forward lean
    p.torso.rotation.y = c * 0.08;
    p.head.rotation.x = 0.12 + Math.abs(s) * 0.04;
    p.head.rotation.y = -c * 0.18;
    p.head.rotation.z = sHard * -0.05;

    p.leftArm.rotation.x = sHard * 1.35;
    p.rightArm.rotation.x = -sHard * 1.35;
    p.leftArm.rotation.z = 0.22 + Math.max(0, s) * 0.15;
    p.rightArm.rotation.z = -0.22 - Math.max(0, -s) * 0.15;
    p.leftFore.rotation.x = 0.5 + Math.max(0, s) * 0.85;
    p.rightFore.rotation.x = 0.5 + Math.max(0, -s) * 0.85;

    p.leftLeg.rotation.x = -sHard * 1.15;
    p.rightLeg.rotation.x = sHard * 1.15;
    p.leftShin.rotation.x = 0.4 + Math.max(0, -s) * 0.95;
    p.rightShin.rotation.x = 0.4 + Math.max(0, s) * 0.95;

    p.bandL.rotation.x = c * 0.95;
    p.bandR.rotation.x = -c * 0.95;
    p.bandL.rotation.y = s * 0.55;
    p.bandR.rotation.y = s * 0.55;
    p.bandL.rotation.z = 0.2 + Math.sin(t * f * 0.6) * 0.2;
    p.bandR.rotation.z = -0.2 - Math.sin(t * f * 0.6 + 0.3) * 0.2;

    if (p.eyeL) p.eyeL.scale.y = 1;
    if (p.eyeR) p.eyeR.scale.y = 1;
  }

  function animateTurtleAttack(group, t01) {
    var p = group.userData.parts; if (!p) return;
    var k = Math.sin(Math.min(1, Math.max(0, t01)) * Math.PI);
    p.rightArm.rotation.x = -1.5 * k;
    p.rightFore.rotation.x = -0.7 * k;
    p.leftArm.rotation.x = 0.6 * k;
    p.torso.rotation.y = -0.4 * k;
    p.head.rotation.y = 0.25 * k;
    p.rootBob.position.y = 0.1 * k;
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
