import * as THREE from 'three';

/**
 * Every surface in the flat is painted here, on a canvas, at load time.
 * Nothing is downloaded — the page stays self-contained and the textures can be
 * tuned to the photos by hand instead of hunting for image files.
 */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

function toTexture(canvas, [rx, ry] = [1, 1]) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = 8;
  return tex;
}

/** deterministic noise so a reload looks the same */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

/* ── walls and floors ─────────────────────────────────────────────────────── */

/** The reclaimed-timber accent wall behind the TV: horizontal boards, mixed tones. */
export function woodPlankWall({ tint = 0 } = {}) {
  const { c, ctx } = makeCanvas(1024, 1024);
  const rand = rng(7);
  const TONES = [
    [109, 92, 72],
    [126, 108, 84],
    [92, 78, 62],
    [140, 124, 100],
    [102, 90, 78],
  ];
  const rows = 14;
  const rowH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    // boards are staggered, so each row is cut into a few lengths
    let x = -rand() * 300;
    while (x < 1024) {
      const w = 220 + rand() * 340;
      const base = mix(TONES[Math.floor(rand() * TONES.length)], [150, 140, 130], tint);
      ctx.fillStyle = rgb(base);
      ctx.fillRect(x, r * rowH, w - 2, rowH - 2);

      // grain
      for (let g = 0; g < 26; g++) {
        const gy = r * rowH + rand() * rowH;
        ctx.strokeStyle = `rgba(${base[0] - 26},${base[1] - 24},${base[2] - 20},${0.18 + rand() * 0.28})`;
        ctx.lineWidth = 0.6 + rand() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x + rand() * 30, gy);
        ctx.bezierCurveTo(x + w * 0.3, gy + (rand() - 0.5) * 5, x + w * 0.7, gy + (rand() - 0.5) * 5, x + w, gy);
        ctx.stroke();
      }
      // the odd knot
      if (rand() > 0.82) {
        const kx = x + 40 + rand() * (w - 80);
        const ky = r * rowH + rowH * 0.5;
        ctx.strokeStyle = `rgba(${base[0] - 45},${base[1] - 42},${base[2] - 38},0.7)`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 7, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      x += w;
    }
    // shadow line between courses
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, (r + 1) * rowH - 3, 1024, 3);
  }
  return toTexture(c, [1, 1]);
}

/** Wide grey-brown vinyl planks, as on the floor throughout. */
export function vinylFloor() {
  const { c, ctx } = makeCanvas(1024, 1024);
  const rand = rng(21);
  const rows = 8;
  const rowH = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    let x = -rand() * 400;
    while (x < 1024) {
      const w = 420 + rand() * 380;
      const base = mix([124, 110, 98], [150, 138, 126], rand());
      ctx.fillStyle = rgb(base);
      ctx.fillRect(x, r * rowH, w - 2, rowH - 2);
      for (let g = 0; g < 40; g++) {
        const gy = r * rowH + rand() * rowH;
        ctx.strokeStyle = `rgba(${base[0] - 30},${base[1] - 28},${base[2] - 26},${0.1 + rand() * 0.22})`;
        ctx.lineWidth = 0.6 + rand() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy + (rand() - 0.5) * 3);
        ctx.stroke();
      }
      x += w;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, (r + 1) * rowH - 2, 1024, 2);
  }
  return toTexture(c, [5, 8]);
}

/** Pale oak cabinet fronts — fine vertical grain, almost no contrast. */
export function oakPanel() {
  const { c, ctx } = makeCanvas(512, 512);
  const rand = rng(33);
  ctx.fillStyle = '#d6bd97';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = rand() * 512;
    ctx.strokeStyle = `rgba(160,132,96,${0.05 + rand() * 0.14})`;
    ctx.lineWidth = 0.4 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 12, 170, x + (rand() - 0.5) * 12, 340, x + (rand() - 0.5) * 8, 512);
    ctx.stroke();
  }
  return toTexture(c, [1.6, 1.6]);
}

/** Black speckled worktop. */
export function stoneWorktop() {
  const { c, ctx } = makeCanvas(512, 512);
  const rand = rng(51);
  ctx.fillStyle = '#17181c';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const v = 40 + rand() * 120;
    ctx.fillStyle = `rgba(${v},${v},${v + 6},${0.12 + rand() * 0.4})`;
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 1.8, 1 + rand() * 1.8);
  }
  return toTexture(c, [2, 2]);
}

/** The faceted bathroom tile from the photo — beige and grey diamonds. */
export function bathTile() {
  const { c, ctx } = makeCanvas(512, 512);
  const rand = rng(64);
  ctx.fillStyle = '#b9ad98';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 4;
  const rows = 8;
  const cw = 512 / cols;
  const ch = 512 / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw;
      const y = r * ch;
      const flip = (r + col) % 2 === 0;
      const light = mix([206, 196, 177], [176, 166, 150], rand() * 0.5);
      const dark = mix([137, 128, 112], [108, 102, 92], rand() * 0.5);

      // two facets per tile read as a moulded relief
      ctx.fillStyle = rgb(flip ? light : dark);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cw, y);
      ctx.lineTo(flip ? x : x + cw, y + ch);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = rgb(flip ? dark : light);
      ctx.beginPath();
      ctx.moveTo(x + cw, y + ch);
      ctx.lineTo(x, y + ch);
      ctx.lineTo(flip ? x + cw : x, y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(90,84,74,0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, cw, ch);
    }
  }
  return toTexture(c, [3, 2.4]);
}

/** Small mosaic for the shower floor. */
export function mosaicFloor() {
  const { c, ctx } = makeCanvas(256, 256);
  const rand = rng(88);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = mix([176, 166, 148], [122, 114, 102], rand());
      ctx.fillStyle = rgb(v);
      ctx.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    }
  }
  return toTexture(c, [3, 3]);
}

/** The dark blue-grey sofa weave. */
export function sofaFabric() {
  const { c, ctx } = makeCanvas(256, 256);
  const rand = rng(97);
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = rand();
    ctx.fillStyle = `rgba(${v > 0.5 ? 90 : 40},${v > 0.5 ? 102 : 52},${v > 0.5 ? 122 : 68},0.35)`;
    ctx.fillRect(rand() * 256, rand() * 256, 2, 1);
  }
  return toTexture(c, [4, 3]);
}

/** Heavy grey-blue curtain, vertical folds. */
export function curtainFabric() {
  const { c, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = '#7d8f99';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const g = ctx.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.2)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 16, 256);
  }
  return toTexture(c, [3, 1]);
}

/* ── the two "screens" ────────────────────────────────────────────────────── */

/** Summer alpine view for the window: sky, ridge lines, green slopes. */
export function mountainView() {
  const { c, ctx } = makeCanvas(1024, 640);
  const rand = rng(11);

  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  sky.addColorStop(0, '#4d8fd0');
  sky.addColorStop(0.6, '#93c1e4');
  sky.addColorStop(1, '#cfe2ef');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 400);

  const ridge = (baseY, height, colour, jag) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.lineTo(0, baseY);
    let x = 0;
    let y = baseY;
    while (x < 1024) {
      const step = 40 + rand() * 90;
      x += step;
      y += (rand() - 0.5) * jag;
      y = Math.max(baseY - height, Math.min(baseY + height * 0.4, y));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 640);
    ctx.closePath();
    ctx.fill();
  };

  ridge(300, 120, '#7d93a8', 70); // far, hazy
  ridge(360, 110, '#5f7d6b', 80); // middle
  ridge(430, 90, '#4a6b4f', 60); // near slope

  // grass + rock speckle on the nearest slope
  for (let i = 0; i < 5000; i++) {
    const x = rand() * 1024;
    const y = 430 + rand() * 210;
    const g = 70 + rand() * 60;
    ctx.fillStyle = `rgba(${g * 0.7},${g},${g * 0.6},${0.25 + rand() * 0.35})`;
    ctx.fillRect(x, y, 2 + rand() * 3, 2);
  }
  return toTexture(c, [1, 1]);
}

/** The fireplace loop playing on the TV — one frame, lit by a flickering light. */
export function fireplaceScreen() {
  const { c, ctx } = makeCanvas(640, 384);
  const rand = rng(5);

  ctx.fillStyle = '#140a08';
  ctx.fillRect(0, 0, 640, 384);

  // firebox brickwork
  for (let y = 0; y < 384; y += 32) {
    for (let x = (y / 32) % 2 ? -24 : 0; x < 640; x += 48) {
      const v = 40 + rand() * 26;
      ctx.fillStyle = `rgb(${v + 22},${v},${v - 6})`;
      ctx.fillRect(x + 2, y + 2, 44, 28);
    }
  }

  // grate
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(120, 286, 400, 16);

  // logs
  ctx.fillStyle = '#2b1d14';
  ctx.fillRect(170, 262, 300, 26);
  ctx.fillRect(210, 240, 220, 24);

  // flames — stacked translucent tongues
  const flame = (cx, cy, w, h, colour, alpha) => {
    ctx.fillStyle = colour;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.bezierCurveTo(cx + w, cy - h * 0.45, cx + w * 0.7, cy, cx, cy);
    ctx.bezierCurveTo(cx - w * 0.7, cy, cx - w, cy - h * 0.45, cx, cy - h);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  for (let i = 0; i < 16; i++) {
    const cx = 200 + rand() * 240;
    flame(cx, 268, 26 + rand() * 34, 90 + rand() * 130, '#ff6b12', 0.42);
  }
  for (let i = 0; i < 12; i++) {
    const cx = 240 + rand() * 160;
    flame(cx, 266, 18 + rand() * 22, 70 + rand() * 110, '#ffb43a', 0.55);
  }
  for (let i = 0; i < 8; i++) {
    const cx = 270 + rand() * 100;
    flame(cx, 264, 12 + rand() * 16, 50 + rand() * 70, '#fff0b8', 0.7);
  }

  // glow on the back wall
  const glow = ctx.createRadialGradient(320, 250, 10, 320, 250, 300);
  glow.addColorStop(0, 'rgba(255,150,40,0.5)');
  glow.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 640, 384);

  return toTexture(c, [1, 1]);
}

/** Every texture, built once and shared by the whole scene. */
export function buildMaterials() {
  return {
    wood: woodPlankWall(),
    woodLight: woodPlankWall({ tint: 0.35 }),
    floor: vinylFloor(),
    oak: oakPanel(),
    worktop: stoneWorktop(),
    tile: bathTile(),
    mosaic: mosaicFloor(),
    sofa: sofaFabric(),
    curtain: curtainFabric(),
    view: mountainView(),
    fire: fireplaceScreen(),
  };
}
