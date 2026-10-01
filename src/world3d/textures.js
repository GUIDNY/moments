import * as THREE from 'three';

/** Canvas-backed textures — keeps Hebrew text crisp and in-world, with no font loader. */

const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finish(c, { repeat } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** Shrink the font until the text fits the width we have. */
function fitFont(ctx, text, maxWidth, startPx, weight = 'bold') {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > 18 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

/**
 * A shop sign: emoji, name, and a coloured bar top and bottom.
 * `dir` matters — canvas lays punctuation out by direction, and in RTL the icon
 * belongs on the other side of the name.
 */
export function signTexture(emoji, name, color, dir = 'ltr') {
  const c = canvas(512, 160);
  const ctx = c.getContext('2d');
  const rtl = dir === 'rtl';

  ctx.fillStyle = '#0e1219';
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 16);
  ctx.fillRect(0, 144, 512, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 150);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr'; // the emoji is a glyph, not a sentence
  ctx.font = `72px ${FONT}`;
  ctx.fillText(emoji, rtl ? 446 : 66, 82);

  ctx.fillStyle = '#ffffff';
  ctx.direction = dir;
  fitFont(ctx, name, 380, 58);
  ctx.fillText(name, rtl ? 226 : 290, 80);

  return finish(c);
}

/** The floor: one texture painted from the tile grid, so the whole city is a single draw call. */
export function groundTexture(grid, colors, tilePx = 16) {
  const h = grid.length;
  const w = grid[0].length;
  const c = canvas(w * tilePx, h * tilePx);
  const ctx = c.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = colors[grid[y][x]] ?? '#1b3226';
      ctx.fillRect(x * tilePx, y * tilePx, tilePx, tilePx);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tilePx + 0.5, y * tilePx + 0.5, tilePx - 1, tilePx - 1);
    }
  }

  const tex = finish(c);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** A flat emoji on transparent background, for billboarded props. */
export function emojiTexture(emoji, size = 128) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size * 0.78}px ${FONT}`;
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  return finish(c);
}

/** The big screen in the plaza. */
export function billboardTexture(lines, dir = 'ltr', accent = '#4caf7d') {
  const c = canvas(640, 360);
  const ctx = c.getContext('2d');

  /* A white board, not an LED one. The city is a model under daylight now and
     a black panel in the middle of the plaza is a hole in it; the only thing
     here that is allowed to be loud is the day's move. */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#eef2f7';
  ctx.fillRect(0, 0, 640, 14);
  ctx.strokeStyle = '#dde4ee';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 632, 352);

  ctx.textAlign = 'center';
  ctx.direction = dir;
  ctx.fillStyle = '#0b1220';
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText(lines[0], 320, 135);
  ctx.fillStyle = '#6b7a90';
  ctx.font = `36px ${FONT}`;
  ctx.fillText(lines[1], 320, 208);
  ctx.fillStyle = accent;
  ctx.font = `bold 48px ${FONT}`;
  ctx.fillText(lines[2], 320, 288);

  return finish(c);
}

/** A floating name tag for an avatar. */
export function labelTexture(text) {
  const c = canvas(256, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(15,19,28,0.78)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 48, 24);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#dfe2ef';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(text, 128, 33);
  return finish(c);
}

/* ── the daytime city ─────────────────────────────────────────────────────── */

const facadeCache = new Map();

/**
 * A building's facade, drawn once and repeated up its height.
 *
 * The difference between a box and a building is windows. One tile of this
 * texture is one storey — a pale wall, a band of glass across it with mullions
 * breaking it into panes, and a shadow line under the sill — and the shaft
 * repeats it as many times as it is storeys tall. Separate meshes per floor
 * would look the same and cost twenty draw calls a tower.
 */
export function facadeTexture(wall = '#f1efe8', glass = '#8fa3b4', style = 'window') {
  const key = `${wall}|${glass}|${style}`;
  if (facadeCache.has(key)) return facadeCache.get(key);

  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, size, size);

  /* Every style paints one storey, which tiles vertically. The differences are
     deliberately coarse: this is read from fifteen metres up and twenty back,
     where a window *pattern* survives and a window detail does not. */
  if (style === 'glass') {
    // curtain wall: the glass runs nearly edge to edge, split by hairline
    // mullions, and the floor slab between storeys is the only solid line
    const inset = size * 0.05;
    const top = size * 0.16;
    const tall = size * 0.68;
    ctx.fillStyle = glass;
    ctx.fillRect(inset, top, size - inset * 2, tall);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 1; i < 8; i++) {
      ctx.fillRect(inset + ((size - inset * 2) / 8) * i - 1, top, 2, tall);
    }
    // the reflection that stops flat glass reading as painted card
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(inset, top, (size - inset * 2) * 0.32, tall);
    ctx.fillStyle = wall;
    ctx.fillRect(0, top + tall, size, size - top - tall);
  } else if (style === 'stone') {
    // pilasters the full height of the storey, with a tall arched window
    // between each pair: the one pattern everybody reads as a bank
    const bays = 4;
    const bay = size / bays;
    for (let i = 0; i < bays; i++) {
      const w = bay * 0.42;
      const x = i * bay + (bay - w) / 2;
      const top = size * 0.2;
      const tall = size * 0.56;
      const r = w / 2;
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.moveTo(x, top + tall);
      ctx.lineTo(x, top + r);
      ctx.arc(x + r, top + r, r, Math.PI, 0);
      ctx.lineTo(x + w, top + tall);
      ctx.closePath();
      ctx.fill();
    }
    // the cornice band that separates one storey from the next
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, size * 0.86, size, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(0, size * 0.9, size, 5);
  } else if (style === 'industrial') {
    // a grid of small square lights over a dark service band: a plant, not
    // an office
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, size * 0.78, size, size * 0.14);
    const cols = 6;
    const cell = size / cols;
    ctx.fillStyle = glass;
    for (let i = 0; i < cols; i++) {
      for (let row = 0; row < 2; row++) {
        const w = cell * 0.52;
        const h = size * 0.17;
        ctx.fillRect(i * cell + (cell - w) / 2, size * (0.16 + row * 0.28), w, h);
      }
    }
  } else if (style === 'clinic') {
    // one long ribbon window with white frames — the calm, horizontal
    // facade of somewhere you are meant to feel looked after
    const inset = size * 0.1;
    const top = size * 0.3;
    const tall = size * 0.34;
    ctx.fillStyle = glass;
    ctx.fillRect(inset, top, size - inset * 2, tall);
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i < 5; i++) {
      ctx.fillRect(inset + ((size - inset * 2) / 5) * i - 2, top, 4, tall);
    }
    ctx.fillRect(inset - 3, top - 3, size - inset * 2 + 6, 3);
    ctx.fillRect(inset - 3, top + tall, size - inset * 2 + 6, 4);
  } else {
    // the plain office storey: a band of glass inset from both edges so the
    // corners of the block stay solid wall
    const inset = size * 0.14;
    const top = size * 0.26;
    const tall = size * 0.42;
    ctx.fillStyle = glass;
    ctx.fillRect(inset, top, size - inset * 2, tall);
    ctx.fillStyle = wall;
    for (let i = 1; i < 4; i++) {
      const x = inset + ((size - inset * 2) / 4) * i;
      ctx.fillRect(x - 1.5, top, 3, tall);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(inset - 2, top + tall, size - inset * 2 + 4, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(inset - 2, top + tall + 3, size - inset * 2 + 4, 5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  facadeCache.set(key, tex);
  return tex;
}