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

/** A rounded rectangle path, because canvas has no rounded fill of its own. */
function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The company's mark on a white tile, fitted inside a square, as a sign would carry it. */
function drawMark(ctx, image, x, y, size, radius = size * 0.22) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  rounded(ctx, x, y, size, size, radius);
  ctx.fill();
  ctx.clip();
  const pad = size * 0.14;
  const box = size - pad * 2;
  const scale = Math.min(box / image.width, box / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h);
  ctx.restore();
}

/**
 * A shop sign: the company's mark (or the sector's glyph when there is none),
 * the name, and a coloured bar top and bottom. `dir` matters — canvas lays
 * punctuation out by direction, and in RTL the icon belongs on the other side
 * of the name.
 */
export function signTexture(emoji, name, color, dir = 'ltr', logo = null) {
  const c = canvas(512, 160);
  const ctx = c.getContext('2d');
  const rtl = dir === 'rtl';

  // a white sign under daylight; the colour is the fascia, not the field
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 146, 512, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 14, 512, 4);

  const iconX = rtl ? 512 - 24 - 96 : 24;
  if (logo) {
    drawMark(ctx, logo, iconX, 32, 96);
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    rounded(ctx, iconX, 32, 96, 96, 21);
    ctx.stroke();
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr'; // the emoji is a glyph, not a sentence
    ctx.font = `66px ${FONT}`;
    ctx.fillText(emoji, iconX + 48, 82);
  }

  ctx.fillStyle = '#0b1220';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = dir;
  fitFont(ctx, name, 350, 56, '900');
  ctx.fillText(name, rtl ? 196 : 316, 80);

  return finish(c);
}

/**
 * The board on the roof: the mark, large, and the name under it. This is the
 * sign you read from across the plaza, so it is mostly logo and very little
 * else; a white panel in the brand's own frame.
 */
export function rooftopTexture(logo, name, brand = '#9aa5b1') {
  const c = canvas(512, 320);
  const ctx = c.getContext('2d');
  ctx.fillStyle = brand;
  rounded(ctx, 0, 0, 512, 320, 34);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  rounded(ctx, 12, 12, 488, 296, 26);
  ctx.fill();

  drawMark(ctx, logo, 256 - 90, 30, 180, 36);

  ctx.fillStyle = '#0b1220';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitFont(ctx, name, 440, 54, '900');
  ctx.fillText(name, 256, 262);
  return finish(c);
}

/**
 * The floor: one texture painted from the tile grid, so the whole city is a
 * single draw call.
 *
 * It is also where most of the "city" in the city comes from. Grass that runs
 * straight up to the asphalt is a board game; a pavement with a kerb along
 * every street, lane dashes down the middle of the road and no grid lines
 * stamped on anything is a town. All of it is paint — the walkable grid is
 * untouched, which is why a pavement can be drawn on a tile that is grass to
 * the collision code.
 */
export function groundTexture(grid, colors, tilePx = 24) {
  const h = grid.length;
  const w = grid[0].length;
  const c = canvas(w * tilePx, h * tilePx);
  const ctx = c.getContext('2d');
  const ROAD = 1;
  const at = (x, y) => (y < 0 || y >= h || x < 0 || x >= w ? -1 : grid[y][x]);
  const isRoad = (x, y) => at(x, y) === ROAD;
  const pavement = colors.pavement ?? '#dcdcd6';
  const kerb = colors.kerb ?? 'rgba(0,0,0,0.18)';

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tile = grid[y][x];
      const px = x * tilePx;
      const py = y * tilePx;
      // a non-road tile beside a road is pavement, whatever it is to the walker
      const besideRoad =
        tile !== ROAD && (isRoad(x - 1, y) || isRoad(x + 1, y) || isRoad(x, y - 1) || isRoad(x, y + 1));
      ctx.fillStyle = besideRoad && tile !== 2 ? pavement : colors[tile] ?? '#1b3226';
      ctx.fillRect(px, py, tilePx, tilePx);

      if (besideRoad && tile !== 2) {
        // paving joints, faint, and the kerb on the road side
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, tilePx - 1, tilePx - 1);
        ctx.fillStyle = kerb;
        if (isRoad(x - 1, y)) ctx.fillRect(px, py, 2, tilePx);
        if (isRoad(x + 1, y)) ctx.fillRect(px + tilePx - 2, py, 2, tilePx);
        if (isRoad(x, y - 1)) ctx.fillRect(px, py, tilePx, 2);
        if (isRoad(x, y + 1)) ctx.fillRect(px, py + tilePx - 2, tilePx, 2);
      } else if (tile === ROAD) {
        /* Lane dashes go on the edge shared by the two lanes: a road here is
           two tiles wide, so an edge is a centre line when the tile across it
           is road and the tile on this one's far side is not. A crossing of two
           roads has road on every side and gets no lines, which is also what a
           junction looks like. */
        const dash = (x0, y0, x1, y1) => {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([tilePx * 0.28, tilePx * 0.22]);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.setLineDash([]);
        };
        if (isRoad(x + 1, y) && !isRoad(x - 1, y) && !(isRoad(x, y - 1) && isRoad(x, y + 1)))
          dash(px + tilePx, py, px + tilePx, py + tilePx);
        if (isRoad(x, y + 1) && !isRoad(x, y - 1) && !(isRoad(x - 1, y) && isRoad(x + 1, y)))
          dash(px, py + tilePx, px + tilePx, py + tilePx);
        // the asphalt's grain, so a long street is not one flat grey
        ctx.fillStyle = (x + y) % 2 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(px, py, tilePx, tilePx);
      } else if (tile === 4) {
        // the plaza is paved in a diagonal pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + tilePx);
        ctx.lineTo(px + tilePx, py);
        ctx.stroke();
      } else if (tile === 2) {
        // water: a couple of light ripples
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 3, py + tilePx * 0.35 + (x % 3));
        ctx.lineTo(px + tilePx - 4, py + tilePx * 0.35 + (x % 3));
        ctx.stroke();
      }
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