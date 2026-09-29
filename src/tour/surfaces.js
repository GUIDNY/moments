import * as THREE from 'three';

/**
 * Every surface in a surveyed home is painted here, from the colours the survey
 * read off the photographs.
 *
 * The apartment page has a materials file too, but that one is a fixed set for
 * one flat modelled by hand. This one is a set of *recipes*: give it the colour
 * that came back for a room's walls or floor and it paints that room. Nothing
 * is downloaded — a canvas is faster to make than an image is to fetch, and it
 * cannot 404 in the middle of a client's tour.
 *
 * Textures are cached by their arguments. Without that, a flat with six rooms
 * paints six near-identical floors on every re-render and the phone melts.
 */

const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

/* ── colour ───────────────────────────────────────────────────────────────── */

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

export function rgb(hex) {
  const h = String(hex || '#cccccc').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return Number.isFinite(n)
    ? { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
    : { r: 204, g: 204, b: 204 };
}

/** Lighten (amount > 0) or darken (amount < 0) a colour, as a css string. */
export function shade(hex, amount) {
  const { r, g, b } = rgb(hex);
  const to = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return `rgb(${clamp255(r + (to - r) * t)},${clamp255(g + (to - g) * t)},${clamp255(b + (to - b) * t)})`;
}

/** How light a colour reads, 0..1 — used to decide what contrasts with it. */
export function luminance(hex) {
  const { r, g, b } = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function canvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d')];
}

function finish(c, repeat = 1) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Speckle, so a flat colour does not read as plastic under a point light. */
function grain(ctx, size, strength, count = 2600) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * strength;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
}

/* ── walls ────────────────────────────────────────────────────────────────── */

export function plaster(color) {
  return memo(`plaster:${color}`, () => {
    const size = 128;
    const [c, ctx] = canvas(size);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    grain(ctx, size, 0.035, 1400);
    return finish(c, 1);
  });
}

/* ── floors ───────────────────────────────────────────────────────────────── */

function planks(color) {
  const size = 256;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const rows = 6;
  const h = size / rows;
  for (let i = 0; i < rows; i++) {
    // each plank a shade off its neighbours, the way a real floor is
    ctx.fillStyle = shade(color, (i % 2 ? 0.05 : -0.05) + (Math.random() - 0.5) * 0.06);
    ctx.fillRect(0, i * h, size, h - 1);
    // the grain
    ctx.strokeStyle = shade(color, -0.18);
    ctx.globalAlpha = 0.25;
    for (let g = 0; g < 4; g++) {
      const y = i * h + 3 + Math.random() * (h - 6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // the joint between the courses
    ctx.fillStyle = shade(color, -0.35);
    ctx.fillRect(0, i * h + h - 1, size, 1);
    const seam = Math.random() * size;
    ctx.fillRect(seam, i * h, 1, h);
  }
  return c;
}

function tiles(color, cells = 4) {
  const size = 256;
  const [c, ctx] = canvas(size);
  const s = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = shade(color, (Math.random() - 0.5) * 0.07);
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  ctx.strokeStyle = shade(color, -0.3);
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s, 0);
    ctx.lineTo(i * s, size);
    ctx.moveTo(0, i * s);
    ctx.lineTo(size, i * s);
    ctx.stroke();
  }
  grain(ctx, size, 0.02, 900);
  return c;
}

function speckled(color, strength) {
  const size = 256;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  grain(ctx, size, strength, 5200);
  return c;
}

function weave(color) {
  const size = 128;
  const [c, ctx] = canvas(size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = shade(color, -0.12);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < size; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

/**
 * A floor for a room, from the kind the survey named and the colour it read.
 * `metres` is how far across the floor runs, so the pattern keeps its real
 * scale instead of stretching planks across a whole living room.
 */
export function floorTexture(kind, color, metres = 4) {
  return memo(`floor:${kind}:${color}:${Math.round(metres)}`, () => {
    let c;
    let tileM;
    switch (kind) {
      case 'tile':
        c = tiles(color, 4);
        tileM = 2.4;
        break;
      case 'stone':
        c = tiles(color, 2);
        tileM = 2.0;
        break;
      case 'carpet':
        c = weave(color);
        tileM = 1.4;
        break;
      case 'concrete':
        c = speckled(color, 0.05);
        tileM = 3.0;
        break;
      case 'vinyl':
        c = planks(color);
        tileM = 2.6;
        break;
      case 'wood':
      default:
        c = planks(color);
        tileM = 2.2;
        break;
    }
    return finish(c, Math.max(1, Math.round(metres / tileM)));
  });
}

/* ── the view out ─────────────────────────────────────────────────────────── */

/**
 * Whatever is beyond the window. The survey cannot see out of the photographs
 * reliably, so this stays a soft gradient rather than a claim about the view —
 * a sky that lets light in without pretending to be somewhere.
 */
export function outside() {
  return memo('outside', () => {
    const [c, ctx] = canvas(512);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#9dc3e6');
    g.addColorStop(0.55, '#cfe0ee');
    g.addColorStop(0.75, '#d8dcd2');
    g.addColorStop(1, '#b9bfae');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, 40 + Math.random() * 150, 30 + Math.random() * 60, 12 + Math.random() * 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}
