/* Procedural Three.js meshes — no character image sprites */
(function (global) {
  "use strict";

  function createSewerTexture(opts) {
    opts = opts || {};
    var w = opts.w || 256, h = opts.h || 256;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#2a2320";
    ctx.fillRect(0, 0, w, h);
    var cols = 4, rows = 8, bw = w / cols, bh = h / rows;
    for (var r = 0; r < rows; r++) {
      var offset = (r % 2) * (bw / 2);
      for (var cn = -1; cn < cols + 1; cn++) {
        var x = cn * bw + offset + 2, y = r * bh + 2;
        var shade = 0.85 + Math.random() * 0.3;
        ctx.fillStyle = "rgb(" + Math.floor(90*shade) + "," + Math.floor(70*shade) + "," + Math.floor(54*shade) + ")";
        ctx.fillRect(x, y, bw - 4, bh - 4);
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function shadowify(root) {
    root.traverse(function (o) {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
  }

  function makeLimb(len, rad, mat) {
    var limb = new THREE.Group();
    var m;
    if (THREE.CapsuleGeometry) {
      m = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 4, 8), mat);
    } else {
      m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), mat);
    }
    m.position.y = -len / 2;
    limb.add(m);
    var fist = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.15, 10, 8), mat);
    fist.position.y = -len - rad * 0.4;
    limb.add(fist);
    return limb;
  }

  function createTurtle3D(maskColorHex) {
    maskColorHex = maskColorHex == null ? 0xff5555 : maskColorHex;
    var g = new THREE.Group();
    var skinMat = new THREE.MeshStandardMaterial({ color: 0x66bb3a, roughness: 0.7, metalness: 0 });
    var shellMat = new THREE.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.85 });
    var platMat = new THREE.MeshStandardMaterial({ color: 0xf3d98b, roughness: 0.6 });
    var maskMat = new THREE.MeshStandardMaterial({ color: maskColorHex, roughness: 0.5 });
    var whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    var pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    var body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), skinMat);
    body.position.y = 0.72; body.scale.set(1, 1.05, 0.95); g.add(body);

    var plastron = new THREE.Mesh(new THREE.SphereGeometry(0.30, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), platMat);
    plastron.rotation.x = Math.PI; plastron.position.set(0, 0.7, -0.22); plastron.scale.set(1.1, 1.4, 0.6); g.add(plastron);

    var shell = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), shellMat);
    shell.position.set(0, 0.78, 0.22); shell.rotation.x = Math.PI / 2; shell.scale.set(1.05, 0.9, 1.15); g.add(shell);

    var head = new THREE.Group(); head.position.set(0, 1.25, -0.15); g.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), skinMat));
    var mask = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.11, 20, 1, true), maskMat);
    mask.rotation.x = Math.PI / 2; mask.position.set(0, 0.04, 0); head.add(mask);
    var tailGeo = new THREE.BoxGeometry(0.08, 0.04, 0.22);
    var tailL = new THREE.Mesh(tailGeo, maskMat); tailL.position.set(-0.22, 0.05, 0.18); head.add(tailL);
    var tailR = new THREE.Mesh(tailGeo, maskMat); tailR.position.set(0.22, 0.05, 0.18); head.add(tailR);

    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), whiteMat); eyeL.position.set(-0.12, 0.04, -0.22); head.add(eyeL);
    var eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), whiteMat); eyeR.position.set(0.12, 0.04, -0.22); head.add(eyeR);
    var pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pupilMat); pupilL.position.set(-0.12, 0.04, -0.29); head.add(pupilL);
    var pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pupilMat); pupilR.position.set(0.12, 0.04, -0.29); head.add(pupilR);

    var leftArm = makeLimb(0.28, 0.09, skinMat); leftArm.position.set(-0.42, 0.95, -0.05); leftArm.rotation.z = 0.25; g.add(leftArm);
    var rightArm = makeLimb(0.28, 0.09, skinMat); rightArm.position.set(0.42, 0.95, -0.05); rightArm.rotation.z = -0.25; g.add(rightArm);
    var leftLeg = makeLimb(0.22, 0.11, skinMat); leftLeg.position.set(-0.22, 0.42, -0.02); g.add(leftLeg);
    var rightLeg = makeLimb(0.22, 0.11, skinMat); rightLeg.position.set(0.22, 0.42, -0.02); g.add(rightLeg);

    shadowify(g);
    g.userData.parts = { head: head, leftArm: leftArm, rightArm: rightArm, leftLeg: leftLeg, rightLeg: rightLeg, shell: shell };
    g.userData.type = "turtle";
    return g;
  }

  function animateTurtleIdle(group, t) {
    var p = group.userData && group.userData.parts; if (!p) return;
    var bob = Math.sin(t * 2.2) * 0.05;
    p.head.position.y = 1.25 + bob * 0.5;
    p.head.rotation.y = Math.sin(t * 0.8) * 0.15;
    p.leftArm.rotation.x = Math.sin(t * 2.2) * 0.35;
    p.rightArm.rotation.x = -Math.sin(t * 2.2) * 0.35;
    p.leftLeg.rotation.x = -Math.sin(t * 2.2) * 0.25;
    p.rightLeg.rotation.x = Math.sin(t * 2.2) * 0.25;
  }

  function animateTurtleRun(group, t) {
    var p = group.userData && group.userData.parts; if (!p) return;
    var s = Math.sin(t * 10);
    p.leftArm.rotation.x = s * 0.7;
    p.rightArm.rotation.x = -s * 0.7;
    p.leftLeg.rotation.x = -s * 0.6;
    p.rightLeg.rotation.x = s * 0.6;
    p.head.position.y = 1.25 + Math.abs(s) * 0.03;
  }

  function createBroccoli3D(variant) {
    variant = variant || "scout";
    var g = new THREE.Group();
    var floretColor = 0x2f8f2f, stalkColor = 0xd8e6a8, scale = 1, emissive = 0x000000;
    if (variant === "bomber") { floretColor = 0x6a8a2a; emissive = 0x441111; }
    if (variant === "ninja") { floretColor = 0x143d1a; stalkColor = 0x445544; }
    if (variant === "boss") { floretColor = 0x276b26; scale = 2.4; }

    var floretMat = new THREE.MeshStandardMaterial({ color: floretColor, roughness: 0.85, emissive: emissive, emissiveIntensity: 0.35, flatShading: true });
    var stalkMat = new THREE.MeshStandardMaterial({ color: stalkColor, roughness: 0.8 });
    var eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var eyeBlack = new THREE.MeshStandardMaterial({ color: 0x000000 });

    var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 10), stalkMat);
    stalk.position.y = 0.2; g.add(stalk);
    var floret = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), floretMat);
    floret.position.y = 0.7; g.add(floret);
    var miniGeo = new THREE.IcosahedronGeometry(0.18, 0);
    [[0.35,0.75,0.1],[-0.32,0.72,-0.05],[0.05,0.95,0.25],[-0.15,0.98,-0.2],[0.2,0.55,-0.3]].forEach(function (p) {
      var m = new THREE.Mesh(miniGeo, floretMat); m.position.set(p[0], p[1], p[2]); g.add(m);
    });
    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), eyeWhite); eyeL.position.set(-0.14, 0.72, -0.36); g.add(eyeL);
    var eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), eyeWhite); eyeR.position.set(0.14, 0.72, -0.36); g.add(eyeR);
    var pL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), eyeBlack); pL.position.set(-0.14, 0.7, -0.44); g.add(pL);
    var pR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), eyeBlack); pR.position.set(0.14, 0.7, -0.44); g.add(pR);

    if (variant === "boss") {
      var spikeMat = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.6, metalness: 0.3 });
      var spikeGeo = new THREE.ConeGeometry(0.08, 0.32, 8);
      [[0.45,0.9,0,0,0,Math.PI/2],[-0.45,0.9,0,0,0,-Math.PI/2],[0,1.2,0,0,0,0],[0,0.7,0.45,Math.PI/2,0,0]].forEach(function (d) {
        var s = new THREE.Mesh(spikeGeo, spikeMat); s.position.set(d[0],d[1],d[2]); s.rotation.set(d[3],d[4],d[5]); g.add(s);
      });
    }
    if (variant === "ninja") {
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.12, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      band.position.set(0, 0.72, 0); band.rotation.x = Math.PI / 2; g.add(band);
    }
    g.scale.setScalar(scale);
    shadowify(g);
    g.userData.type = "broccoli"; g.userData.variant = variant;
    return g;
  }

  function createPizza3D(gold) {
    var g = new THREE.Group();
    var crustMat = new THREE.MeshStandardMaterial({ color: gold ? 0xffd94a : 0xd39a4a, roughness: 0.75, emissive: gold ? 0xffb800 : 0x000000, emissiveIntensity: gold ? 0.55 : 0, metalness: gold ? 0.35 : 0 });
    var cheeseMat = new THREE.MeshStandardMaterial({ color: gold ? 0xfff2a0 : 0xffd066, roughness: 0.6, emissive: gold ? 0xffea70 : 0x000000, emissiveIntensity: gold ? 0.35 : 0 });
    var pepMat = new THREE.MeshStandardMaterial({ color: gold ? 0xffb040 : 0xb02a1a, roughness: 0.55 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 24), crustMat));
    var cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 24), cheeseMat); cheese.position.y = 0.055; g.add(cheese);
    var pepGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12);
    [[0,0],[0.22,0.15],[-0.2,0.18],[0.12,-0.25],[-0.25,-0.1],[0.28,-0.08]].forEach(function (p) {
      var m = new THREE.Mesh(pepGeo, pepMat); m.position.set(p[0], 0.085, p[1]); g.add(m);
    });
    shadowify(g); g.userData.type = gold ? "pizza_gold" : "pizza"; return g;
  }

  var _sewerBrickTex = null;
  function getSewerBrickTex() {
    if (!_sewerBrickTex) _sewerBrickTex = createSewerTexture();
    return _sewerBrickTex;
  }

  function createSewerChunk(zPos, length) {
    length = length || 20;
    var g = new THREE.Group();
    var width = 8, height = 5;
    var brickTex = getSewerBrickTex();
    function texClone(rx, ry) {
      var t = brickTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
    }
    var floorMat = new THREE.MeshStandardMaterial({ map: texClone(length / 4, width / 4), color: 0xbbbbbb, roughness: 0.95 });
    var wallMat = new THREE.MeshStandardMaterial({ map: texClone(length / 4, height / 3), color: 0xaaaaaa, roughness: 0.9 });
    var ceilMat = new THREE.MeshStandardMaterial({ map: texClone(length / 4, width / 4), color: 0x888888, roughness: 0.95 });

    var floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, length), floorMat); floor.position.y = -0.2; g.add(floor);
    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, length), wallMat); leftWall.position.set(-width / 2, height / 2, 0); g.add(leftWall);
    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, length), wallMat); rightWall.position.set(width / 2, height / 2, 0); g.add(rightWall);
    var ceilArch = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, length, 12, 1, true, 0, Math.PI), ceilMat);
    ceilArch.rotation.z = Math.PI / 2; ceilArch.rotation.y = Math.PI / 2; ceilArch.position.y = height; g.add(ceilArch);

    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });
    var pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, length, 10);
    var pipeL = new THREE.Mesh(pipeGeo, pipeMat); pipeL.rotation.x = Math.PI / 2; pipeL.position.set(-width / 2 + 0.35, 3.4, 0); g.add(pipeL);
    var pipeR = new THREE.Mesh(pipeGeo, pipeMat); pipeR.rotation.x = Math.PI / 2; pipeR.position.set(width / 2 - 0.35, 3.4, 0); g.add(pipeR);

    var slime = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), new THREE.MeshStandardMaterial({ color: 0x39ff88, emissive: 0x22cc55, emissiveIntensity: 0.9, roughness: 0.3, transparent: true, opacity: 0.85 }));
    slime.rotation.x = -Math.PI / 2; slime.position.set((Math.random() - 0.5) * 4, 0.02, (Math.random() - 0.5) * (length - 4)); g.add(slime);

    shadowify(g); floor.castShadow = false; ceilArch.castShadow = false;
    g.position.z = zPos; g.userData.type = "sewerChunk"; g.userData.length = length;
    return g;
  }

  global.TMNTMeshes = {
    createTurtle3D: createTurtle3D,
    createBroccoli3D: createBroccoli3D,
    createPizza3D: createPizza3D,
    createSewerChunk: createSewerChunk,
    createSewerTexture: createSewerTexture,
    animateTurtleIdle: animateTurtleIdle,
    animateTurtleRun: animateTurtleRun
  };
})(window);
