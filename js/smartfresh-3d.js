/* ============================================================
   SUSTAINOVA / SMARTFRESH — WebGL 3D layer
   v20261007

   Two lightweight three.js scenes:
     1. HERO     — a procedural 3D milk pouch with a live
                   colour-changing freshness indicator.
     2. CIRCULAR — an orbiting 4-node circular-economy ring that
                   wraps the lifecycle diagram.

   Both scenes are optional. If WebGL is unavailable, or the
   visitor turns 3D off, the site falls back to its flat assets.
   ============================================================ */

import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Shared palette ─────────────────────────────────────────── */
const LIME = '#d8e99a';

/* Freshness indicator colours — matches the 2D calibration set */
const INDICATOR = {
  fresh:    '#4b3fb0',
  changing: '#b5179e',
  spoiled:  '#bd272e'
};

/* ── Tiny helpers ───────────────────────────────────────────── */
function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

/* Soft radial contact shadow */
function shadowTexture() {
  const { c, ctx } = canvas2d(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.00, 'rgba(16,40,28,.40)');
  g.addColorStop(0.35, 'rgba(16,40,28,.20)');
  g.addColorStop(0.70, 'rgba(16,40,28,.05)');
  g.addColorStop(1.00, 'rgba(16,40,28,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Small leaf mark used on the printed pouch label */
function drawLeaf(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(34, -30);
  ctx.bezierCurveTo(6, -26, -14, -6, -18, 26);
  ctx.bezierCurveTo(2, 22, 26, 8, 34, -30);
  ctx.moveTo(-24, 20);
  ctx.bezierCurveTo(-38, 8, -40, -10, -30, -26);
  ctx.moveTo(4, 30);
  ctx.bezierCurveTo(-6, 40, -20, 42, -34, 36);
  ctx.stroke();
  ctx.restore();
}

/* Printed front label for the pouch */
function labelTexture() {
  const W = 560, H = 640;
  const { c, ctx } = canvas2d(W, H);

  ctx.clearRect(0, 0, W, H);

  // Faint paper tone so the printed area reads against the film
  ctx.fillStyle = 'rgba(255,254,248,.55)';
  ctx.fillRect(0, 0, W, H);

  const ink = 'rgba(23,58,43,.88)';
  const soft = 'rgba(23,58,43,.55)';

  // Top brand row
  drawLeaf(ctx, 84, 112, 1.05, '#4f7a3f');
  ctx.fillStyle = ink;
  ctx.font = '700 54px "DM Sans", Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SMARTFRESH', 136, 128);
  ctx.font = '500 24px "DM Mono", monospace';
  ctx.fillStyle = soft;
  ctx.fillText('FRESHNESS YOU CAN SEE', 138, 166);

  // Rule
  ctx.strokeStyle = 'rgba(23,58,43,.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 206);
  ctx.lineTo(W - 56, 206);
  ctx.stroke();

  // Big volume
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = '700 124px "DM Sans", Helvetica, Arial, sans-serif';
  ctx.fillText('250', W / 2, 356);
  ctx.font = '500 40px "DM Mono", monospace';
  ctx.fillStyle = soft;
  ctx.fillText('ml', W / 2, 412);

  ctx.font = '500 22px "DM Mono", monospace';
  ctx.fillStyle = soft;
  ctx.fillText('BIO-BASED MILK POUCH', W / 2, 468);

  // Bottom block
  ctx.strokeStyle = 'rgba(23,58,43,.18)';
  ctx.beginPath();
  ctx.moveTo(56, 500);
  ctx.lineTo(W - 56, 500);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '500 20px "DM Mono", monospace';
  ctx.fillStyle = soft;
  ctx.fillText('BATCH', 56, 538);
  ctx.fillText('MATERIAL', 56, 586);
  ctx.fillStyle = ink;
  ctx.font = '700 24px "DM Sans", Helvetica, Arial, sans-serif';
  ctx.fillText('SF26—0918—PN01', 56, 564);
  ctx.font = '500 22px "DM Sans", Helvetica, Arial, sans-serif';
  ctx.fillText('PVA + pectin + xanthan', 56, 612);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* Stylised QR block for the pouch back */
function qrTexture() {
  const S = 220;
  const { c, ctx } = canvas2d(S, S);
  ctx.fillStyle = '#fbf8ef';
  ctx.fillRect(0, 0, S, S);

  const cell = 10;
  const grid = 18;
  const off = (S - grid * cell) / 2;
  const dark = '#173a2b';

  const finder = (gx, gy) => {
    ctx.fillStyle = dark;
    ctx.fillRect(off + gx * cell, off + gy * cell, cell * 5, cell * 5);
    ctx.fillStyle = '#fbf8ef';
    ctx.fillRect(off + (gx + 1) * cell, off + (gy + 1) * cell, cell * 3, cell * 3);
    ctx.fillStyle = dark;
    ctx.fillRect(off + (gx + 2) * cell, off + (gy + 2) * cell, cell, cell);
  };
  finder(0, 0); finder(grid - 5, 0); finder(0, grid - 5);

  // Deterministic pseudo-random data modules
  let seed = 20260927;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.fillStyle = dark;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const inFinder =
        (x < 6 && y < 6) || (x > grid - 7 && y < 6) || (x < 6 && y > grid - 7);
      if (inFinder) continue;
      if (rnd() > 0.52) ctx.fillRect(off + x * cell, off + y * cell, cell, cell);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Node caption texture for the circular-economy ring */
function nodeLabelTexture(title, sub) {
  const W = 512, H = 128;
  const { c, ctx } = canvas2d(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.font = '700 50px "DM Sans", Helvetica, Arial, sans-serif';
  ctx.fillText(title.toUpperCase(), W / 2, 60);
  ctx.fillStyle = 'rgba(216,233,154,.9)';
  ctx.font = '500 28px "DM Mono", monospace';
  ctx.fillText(sub, W / 2, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}


/* ============================================================
   SCENE 1 — HERO: 3D SMARTFRESH POUCH
   ============================================================ */
class PouchScene {
  constructor(host) {
    this.host = host;
    this.clock = new THREE.Clock();
    this.pointer = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.drag = { x: 0, y: 0 };
    this.indicatorColor = new THREE.Color(INDICATOR.fresh);
    this.indicatorTarget = new THREE.Color(INDICATOR.fresh);
    this._dummy = new THREE.Object3D();

    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    const el = this.renderer.domElement;
    el.classList.add('gl-canvas');
    el.setAttribute('aria-hidden', 'true');
    host.appendChild(el);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
    this.camera.position.set(0, 0.15, 7);

    this.buildLights();
    this.buildPouch();
    this.buildParticles();
    this.buildGround();

    this.bindEvents();
    this.resize();
  }

  /* ── Lighting ── */
  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8e9a0, 0.85));

    const key = new THREE.DirectionalLight(0xfff4dd, 2.4);
    key.position.set(3.4, 4.6, 4.2);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xe4ecff, 0.85);
    fill.position.set(-4.2, 1.4, 2.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd8e99a, 1.4);
    rim.position.set(-1.6, 2.2, -4.4);
    this.scene.add(rim);

    // Glow cast by the freshness indicator onto the pouch
    this.indicatorLight = new THREE.PointLight(INDICATOR.fresh, 5, 6, 2);
    this.indicatorLight.position.set(0, -0.78, 0.55);
    this.scene.add(this.indicatorLight);
  }

  /* ── The pouch itself ── */
  buildPouch() {
    this.root = new THREE.Group();
    this.scene.add(this.root);

    const H = 3.4;            // overall pouch height
    const CRIMP = 0.46;       // top weld height
    const W = 1.62;           // pouch width
    const D = 0.16;           // extrusion depth
    const BT = 0.07;          // bevel thickness
    const BS = 0.07;          // bevel size
    const R = 0.32;           // corner radius

    /* --- body silhouette ---
       ExtrudeGeometry grows the outline outward by bevelSize, so the
       profile is inset up-front to land exactly on W / H afterwards. */
    const s = new THREE.Shape();
    const hw = W / 2 - BS;
    const top = (H / 2 - CRIMP) - BS;
    const bot = (-H / 2) + BS;
    s.moveTo(-hw + R, bot);
    s.lineTo(hw - R, bot);
    s.quadraticCurveTo(hw, bot, hw, bot + R);
    s.lineTo(hw, top - 0.12);
    s.quadraticCurveTo(hw, top, hw - 0.12, top);
    s.lineTo(-hw + 0.12, top);
    s.quadraticCurveTo(-hw, top, -hw, top - 0.12);
    s.lineTo(-hw, bot + R);
    s.quadraticCurveTo(-hw, bot, -hw + R, bot);

    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: D,
      bevelEnabled: true,
      bevelThickness: BT,
      bevelSize: BS,
      bevelOffset: 0,
      bevelSegments: 5,
      curveSegments: 26
    });
    bodyGeo.translate(0, 0, -D / 2);
    bodyGeo.scale(1, 1, 1.3);
    bodyGeo.computeBoundingBox();

    const bb = bodyGeo.boundingBox;
    const TH = (bb.max.z - bb.min.z) / 2;   // true half-thickness

    const film = new THREE.MeshPhysicalMaterial({
      color: 0xfbf8ef,
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.24,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, film);
    this.root.add(body);
    this.film = film;

    /* --- crimped top seal --- */
    const crimpMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2eee2,
      roughness: 0.52,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.4
    });
    const crimp = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.08, CRIMP, TH * 2 * 0.95), crimpMat
    );
    crimp.position.y = H / 2 - CRIMP / 2;
    this.root.add(crimp);

    // Weld ridges across the crimp
    const ridgeMat = new THREE.MeshPhysicalMaterial({
      color: 0xe7e1d1, roughness: 0.72, metalness: 0
    });
    for (let i = 0; i < 5; i++) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(W + 0.13, 0.034, TH * 2 * 1.06), ridgeMat
      );
      ridge.position.set(0, H / 2 - CRIMP + 0.035 + i * 0.098, 0);
      this.root.add(ridge);
    }

    /* --- bottom seal band --- */
    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.97, 0.26, TH * 2 * 0.95), crimpMat
    );
    bottom.position.y = -H / 2 + 0.13;
    this.root.add(bottom);

    /* --- freshness indicator --- */
    const indZ = TH + 0.014;
    this.indicatorMat = new THREE.MeshStandardMaterial({
      color: INDICATOR.fresh,
      emissive: new THREE.Color(INDICATOR.fresh),
      emissiveIntensity: 0.6,
      roughness: 0.26,
      metalness: 0.05
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.47, 64), this.indicatorMat);
    disc.position.set(0, -0.78, indZ);
    this.root.add(disc);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.036, 16, 72),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 })
    );
    ring.position.set(0, -0.78, indZ - 0.012);
    this.root.add(ring);

    /* Sits between the film surface (TH) and the disc (indZ) so the glow
       reads around the indicator without washing over it. */
    this.haloMat = new THREE.MeshBasicMaterial({
      color: INDICATOR.fresh, transparent: true, opacity: 0.16, depthWrite: false
    });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.82, 48), this.haloMat);
    halo.position.set(0, -0.78, indZ - 0.004);
    this.root.add(halo);

    /* --- printed label --- */
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.32),
      new THREE.MeshStandardMaterial({
        map: labelTexture(), transparent: true, roughness: 0.55, metalness: 0, depthWrite: false
      })
    );
    label.position.set(0, 0.46, indZ + 0.006);
    this.root.add(label);

    /* --- QR block on the back --- */
    const qr = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.52),
      new THREE.MeshStandardMaterial({ map: qrTexture(), roughness: 0.5, metalness: 0 })
    );
    qr.position.set(0, 0.5, -(TH + 0.006));
    qr.rotation.y = Math.PI;
    this.root.add(qr);
  }

  /* ── Drifting natural particles ── */
  buildParticles() {
    const COUNT = 70;
    const geo = new THREE.IcosahedronGeometry(0.035, 1);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.45, metalness: 0, emissive: new THREE.Color(0x2c3a22), emissiveIntensity: 0.25
    });
    this.particles = new THREE.InstancedMesh(geo, mat, COUNT);

    const palette = [
      new THREE.Color(LIME), new THREE.Color('#b7d66c'),
      new THREE.Color('#f4c56e'), new THREE.Color('#ffffff'),
      new THREE.Color('#c98b9a')
    ];
    this.pData = [];
    for (let i = 0; i < COUNT; i++) {
      this.pData.push({
        x: (Math.random() - 0.5) * 5.2,
        y: (Math.random() - 0.5) * 6.2,
        z: (Math.random() - 0.5) * 3.2 - 0.4,
        sp: 0.12 + Math.random() * 0.3,
        ph: Math.random() * Math.PI * 2,
        sc: 0.5 + Math.random() * 1.5
      });
      this.particles.setColorAt(i, palette[(Math.random() * palette.length) | 0]);
    }
    if (this.particles.instanceColor) this.particles.instanceColor.needsUpdate = true;
    this.scene.add(this.particles);
  }

  /* ── Soft contact shadow ── */
  buildGround() {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshBasicMaterial({
        map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.95
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = -2.12;
    this.scene.add(m);
  }

  /* ── Interaction ── */
  bindEvents() {
    const host = this.host;

    const move = (e) => {
      const r = host.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (this.dragging) {
        this.drag.x += (x - this.lastX) * 3.6;
        this.drag.y += (y - this.lastY) * 2.2;
        this.lastX = x;
        this.lastY = y;
      }
      this.pointer.x = x;
      this.pointer.y = y;
    };

    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', () => { this.pointer.x = 0; this.pointer.y = 0; });
    host.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.lastX = this.pointer.x;
      this.lastY = this.pointer.y;
      host.classList.add('is-grabbing');
      host.setPointerCapture?.(e.pointerId);
    });
    const end = () => { this.dragging = false; host.classList.remove('is-grabbing'); };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.camera.aspect = w / h;
    // Pull the camera back on narrow stages so the pouch always fits.
    this.camera.position.z = w < 560 ? 9.4 : (h < 540 ? 8.6 : 7.2);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  setIndicator(key) {
    const hex = INDICATOR[key];
    if (!hex) return;
    this.indicatorTarget.set(hex);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    // Smooth colour transition for the indicator
    this.indicatorColor.lerp(this.indicatorTarget, 1 - Math.pow(0.002, dt));
    this.indicatorMat.color.copy(this.indicatorColor);
    this.indicatorMat.emissive.copy(this.indicatorColor);
    this.indicatorLight.color.copy(this.indicatorColor);
    this.haloMat.color.copy(this.indicatorColor);
    this.haloMat.opacity = 0.12 + Math.sin(t * 2.1) * 0.05;

    // Pointer parallax + drag spin
    const auto = REDUCED ? 0 : t * 0.17;
    const ry = auto + this.drag.x + this.pointer.x * 0.5;
    const rx = this.drag.y * 0.6 - this.pointer.y * 0.3 + (REDUCED ? 0 : Math.sin(t * 0.7) * 0.03);

    const k = Math.min(1, dt * 4);
    this.root.rotation.y += (ry - this.root.rotation.y) * k;
    this.root.rotation.x += (rx - this.root.rotation.x) * k;
    this.root.rotation.z = REDUCED ? 0.05 : Math.sin(t * 0.55) * 0.025 + 0.05;
    this.root.position.y = REDUCED ? 0 : Math.sin(t * 0.9) * 0.055;

    // Particles drift upward and wrap
    const d = this._dummy;
    for (let i = 0; i < this.pData.length; i++) {
      const p = this.pData[i];
      p.y += p.sp * dt;
      if (p.y > 3.4) p.y = -3.4;
      d.position.set(
        p.x + Math.sin(t * 0.5 + p.ph) * 0.22,
        p.y,
        p.z + Math.cos(t * 0.42 + p.ph) * 0.18
      );
      d.rotation.set(t * 0.4 + p.ph, t * 0.3, 0);
      d.scale.setScalar(p.sc);
      d.updateMatrix();
      this.particles.setMatrixAt(i, d.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.host.querySelectorAll('.gl-canvas').forEach(c => c.remove());
  }
}


/* ============================================================
   SCENE 2 — CIRCULAR ECONOMY ORBIT
   A thin rotating ring with four glowing beads that trace the
   loop just outside the lifecycle diagram. Hovering a lifecycle
   step in the copy column lights up its matching bead.
   ============================================================ */
const RING_NODES = [
  { title: 'Recover',   color: '#b7d66c' },
  { title: 'Transform', color: '#f4c56e' },
  { title: 'Recreate',  color: '#d8e99a' },
  { title: 'Return',    color: '#9ec98a' }
];

const NODE_RADIUS = 0.17;   // bead radius (world units)
const NODE_HALO = 0.27;     // halo ring radius
const NODE_CLEARANCE = 0.55; // room kept free at the canvas edge

class RingScene {
  constructor(host) {
    this.host = host;
    this.clock = new THREE.Clock();
    this.active = -1;
    this.pulse = 0;

    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const el = this.renderer.domElement;
    el.classList.add('gl-canvas');
    el.setAttribute('aria-hidden', 'true');
    host.appendChild(el);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 1.25, 6.4);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xcfe0b0, 1.1));
    const d = new THREE.DirectionalLight(0xfff6e2, 2.0);
    d.position.set(3, 5, 4);
    this.scene.add(d);
    const back = new THREE.DirectionalLight(0xd8e99a, 1.0);
    back.position.set(-3, 1, -3);
    this.scene.add(back);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildRing();
    this.buildNodes();
    this.buildTooltip();

    // A modest tip so the loop reads as a tilted 3D ring rather than a flat line
    this.group.rotation.x = 0.24;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  buildRing() {
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.03, 12, 180),
      new THREE.MeshStandardMaterial({
        color: 0x2f6a4c, roughness: 0.35, metalness: 0.2,
        transparent: true, opacity: 0.55
      })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.group.add(this.ring);

    // Dashed-looking accent ring, a touch wider
    this.accent = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012, 8, 140),
      new THREE.MeshBasicMaterial({ color: 0xb7d66c, transparent: true, opacity: 0.5 })
    );
    this.accent.rotation.x = Math.PI / 2;
    this.accent.scale.setScalar(1.14);
    this.group.add(this.accent);
  }

  buildNodes() {
    this.nodes = [];
    RING_NODES.forEach((n, i) => {
      const g = new THREE.Group();
      g.userData.angle = (i / RING_NODES.length) * Math.PI * 2;

      const mat = new THREE.MeshStandardMaterial({
        color: n.color, emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.1
      });
      g.add(new THREE.Mesh(new THREE.SphereGeometry(NODE_RADIUS, 28, 20), mat));

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(NODE_HALO, 0.018, 8, 40),
        new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.7 })
      );
      g.add(halo);

      g.userData.halo = halo;
      g.userData.mat = mat;
      this.group.add(g);
      this.nodes.push(g);
    });
  }

  /* One shared caption, shown only while a lifecycle step is hovered */
  buildTooltip() {
    this.tip = null;
    try {
      const tip = document.createElement('span');
      tip.className = 'ring-tip';
      tip.setAttribute('aria-hidden', 'true');
      this.host.parentElement?.appendChild(tip);
      this.tip = tip;
    } catch (err) {
      this.tip = null;   // caption is a nice-to-have; never fatal
    }
  }

  resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    if (w < 2 || h < 2) return;

    this.camera.aspect = w / h;
    this.camera.position.z = w / h < 1 ? 7.8 : 6.4;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);

    // Fit the orbit into the canvas, leaving room for the beads.
    let radius = 1.2;
    const img = this.host.parentElement?.querySelector('img');
    if (img) {
      const r = img.getBoundingClientRect();
      if (r.width && r.height) {
        const worldH = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
        const pxPerUnit = h / worldH;
        const want = (Math.hypot(r.width, r.height) / 2 + 30) / pxPerUnit;
        const max = Math.min(w, h) / 2 / pxPerUnit - NODE_CLEARANCE;
        radius = Math.max(0.7, Math.min(want, max));
      }
    }
    this.radius = radius;
    this.ring.scale.setScalar(radius);
    this.accent.scale.setScalar(radius * 1.14);
  }

  setActive(i) {
    const next = (i >= 0 && i < this.nodes.length) ? i : -1;
    if (this.active === next) return;
    this.active = next;
    this.pulse = 1;
    this.nodes.forEach((n, k) => {
      const on = k === next;
      n.userData.mat.emissiveIntensity = on ? 1.4 : 0.5;
      n.userData.halo.material.opacity = on ? 1 : 0.7;
      n.scale.setScalar(on ? 1.5 : 1);
    });
    if (!this.tip) return;
    if (next >= 0) {
      this.tip.textContent = RING_NODES[next].title;
      this.tip.classList.add('is-visible');
    } else {
      this.tip.classList.remove('is-visible');
    }
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    if (!REDUCED) this.group.rotation.y += dt * 0.24;
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt * 2.2);
    const pulseScale = 1 + this.pulse * 0.06;
    this.ring.scale.setScalar(this.radius * pulseScale);
    this.accent.scale.setScalar(this.radius * 1.14 * pulseScale);
    this.accent.material.opacity = 0.5 + this.pulse * 0.4;

    const proj = new THREE.Vector3();
    this.nodes.forEach((n, i) => {
      const a = n.userData.angle + (REDUCED ? 0 : t * 0.24);
      n.position.set(
        Math.cos(a) * this.radius,
        REDUCED ? 0 : Math.sin(t * 1.3 + i) * 0.05,
        Math.sin(a) * this.radius
      );
      n.userData.halo.rotation.x = t * 0.9 + i;
      n.userData.halo.rotation.y = t * 0.6;

      // Park the caption next to the active bead
      if (this.active === i && this.tip) {
        proj.copy(n.position).applyMatrix4(this.group.matrixWorld).project(this.camera);
        const x = (proj.x * 0.5 + 0.5) * (this.host.clientWidth || 1);
        const y = (-proj.y * 0.5 + 0.5) * (this.host.clientHeight || 1);
        this.tip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.tip?.remove();
    this.tip = null;
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => m.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.host.querySelectorAll('.gl-canvas').forEach(c => c.remove());
  }
}


/* ============================================================
   BOOTSTRAP
   ============================================================ */
const scenes = {};
let rafId = null;

const $ = (sel) => document.querySelector(sel);

function canWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

function isInView(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  return r.bottom > -140 && r.top < vh + 140;
}

function frame() {
  rafId = requestAnimationFrame(frame);
  const heroHost = $('#hero3d');
  const ringHost = $('#circular3d');
  if (scenes.hero && heroHost && isInView(heroHost)) scenes.hero.update();
  if (scenes.ring && ringHost && isInView(ringHost)) scenes.ring.update();
}

function startHero() {
  const host = $('#hero3d');
  if (!host || scenes.hero) return;
  try {
    scenes.hero = new PouchScene(host);
    scenes.hero.setIndicator(window.SmartFresh3DState.key);
  } catch (err) {
    console.warn('[SmartFresh 3D] hero scene unavailable:', err);
    scenes.hero = null;
    disable3D();
  }
}

function startRing() {
  const host = $('#circular3d');
  if (!host || scenes.ring) return;
  try {
    scenes.ring = new RingScene(host);
  } catch (err) {
    console.warn('[SmartFresh 3D] ring scene unavailable:', err);
    scenes.ring = null;
  }
}

function stopAll() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  Object.keys(scenes).forEach((k) => {
    scenes[k]?.dispose();
    delete scenes[k];
  });
}

function enable3D() {
  document.documentElement.classList.remove('no-3d');
  document.documentElement.classList.add('has-3d');
  window.SmartFresh3DState.enabled = true;
  if (!canWebGL()) { disable3D(); return; }
  startHero();
  startRing();
  if (!rafId) frame();
}

function disable3D() {
  document.documentElement.classList.add('no-3d');
  document.documentElement.classList.remove('has-3d');
  stopAll();
  window.SmartFresh3DState.enabled = false;
}

/* Public bridge used by script.js */
window.SmartFresh3DState = { enabled: true, key: 'fresh' };
window.SmartFresh3D = {
  enable: enable3D,
  disable: disable3D,
  setIndicator(key) {
    if (!INDICATOR[key]) return;
    window.SmartFresh3DState.key = key;
    scenes.hero?.setIndicator(key);
  },
  setRingActive(i) { scenes.ring?.setActive(i); },
  refreshRing() { scenes.ring?.resize(); }
};

if (canWebGL()) {
  if (document.documentElement.classList.contains('no-3d')) {
    window.SmartFresh3DState.enabled = false;
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enable3D, { once: true });
  } else {
    enable3D();
  }
} else {
  document.documentElement.classList.add('no-3d');
  window.SmartFresh3DState.enabled = false;
}
