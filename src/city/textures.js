import * as THREE from 'three';

/** Canvas-painted textures for the city: the ground, the plaques, the badges. */

const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

function finish(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const GROUND = {
  grass: '#a6d278',
  park: '#93c76b',
  road: '#cfcbc0',
  kerb: '#b9b4a6',
  pavement: '#ece5d3',
  plaza: '#efe8d6',
  plot: '#a6d278',
  water: '#62b8dc',
  lane: '#ffffff',
  path: '#e4dcc6',
};

/**
 * The whole ground in one texture: a road with a kerb and a narrow pavement
 * strip, lane dashes, paving on the plaza, paths through the districts, and
 * two tones of patch on every lawn so it is never one flat green. Drawn once
 * per layout. The pavement was once the whole tile beside a road, and since
 * two rows of every plot touch a road the city read as parking lots.
 */
export function groundTexture(grid, TILE, px = 24) {
  const n = grid.length;
  const c = document.createElement('canvas');
  c.width = n * px;
  c.height = n * px;
  const ctx = c.getContext('2d');
  const at = (x, y) => (y < 0 || x < 0 || y >= n || x >= n ? -1 : grid[y][x]);
  const isRoad = (x, y) => at(x, y) === TILE.ROAD || at(x, y) === TILE.LANE;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = grid[y][x];
      const X = x * px;
      const Y = y * px;
      let fill = GROUND.grass;
      if (t === TILE.ROAD || t === TILE.LANE) fill = GROUND.road;
      else if (t === TILE.PARK) fill = GROUND.park;
      else if (t === TILE.WATER) fill = GROUND.water;
      else if (t === TILE.PLAZA) fill = GROUND.plaza;
      else if (t === TILE.PLOT) fill = GROUND.plot;
      // a district lane is a path through the lawn, not a road
      if (t === TILE.LANE) fill = GROUND.grass;
      ctx.fillStyle = fill;
      ctx.fillRect(X, Y, px, px);

      if (t === TILE.GRASS || t === TILE.PARK || t === TILE.PLOT || t === TILE.LANE) {
        // a little life in the lawn: two tones of patch, never one flat green
        const k = (x * 7 + y * 13) % 7;
        ctx.fillStyle = k === 0 ? 'rgba(255,255,255,0.07)' : k < 3 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,160,0.04)';
        ctx.fillRect(X + ((x * 5) % px), Y + ((y * 9) % px), px * 0.45, px * 0.45);
      }
      if (t === TILE.LANE) {
        const h = isRoad(x - 1, y) || isRoad(x + 1, y);
        const v = isRoad(x, y - 1) || isRoad(x, y + 1);
        ctx.fillStyle = GROUND.path;
        if (h || !v) ctx.fillRect(X, Y + px * 0.3, px, px * 0.4);
        if (v || !h) ctx.fillRect(X + px * 0.3, Y, px * 0.4, px);
      }
      // the pavement is a strip along the road, a quarter of a tile, with a kerb
      const strip = px * 0.26;
      if (!isRoad(x, y) && t !== TILE.WATER && t !== TILE.LANE) {
        const side = (wx, wy) => at(wx, wy) === TILE.ROAD;
        ctx.fillStyle = GROUND.pavement;
        if (side(x - 1, y)) ctx.fillRect(X, Y, strip, px);
        if (side(x + 1, y)) ctx.fillRect(X + px - strip, Y, strip, px);
        if (side(x, y - 1)) ctx.fillRect(X, Y, px, strip);
        if (side(x, y + 1)) ctx.fillRect(X, Y + px - strip, px, strip);
        ctx.fillStyle = GROUND.kerb;
        if (side(x - 1, y)) ctx.fillRect(X, Y, 2, px);
        if (side(x + 1, y)) ctx.fillRect(X + px - 2, Y, 2, px);
        if (side(x, y - 1)) ctx.fillRect(X, Y, px, 2);
        if (side(x, y + 1)) ctx.fillRect(X, Y + px - 2, px, 2);
      }
      if (t === TILE.ROAD) {
        // a dashed centre line along straight runs of the main roads,
        // nothing at junctions and nothing on the district lanes
        const main = (wx, wy) => at(wx, wy) === TILE.ROAD;
        const h = main(x - 1, y) && main(x + 1, y);
        const v = main(x, y - 1) && main(x, y + 1);
        if (h !== v) {
          ctx.fillStyle = GROUND.lane;
          if (h) ctx.fillRect(X + px * 0.2, Y + px / 2 - 1, px * 0.6, 2);
          else ctx.fillRect(X + px / 2 - 1, Y + px * 0.2, 2, px * 0.6);
        }
      }
      if (t === TILE.PLAZA) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(X + 0.5, Y + 0.5, px - 1, px - 1);
      }
    }
  }
  const tex = finish(c);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/** The small plaque on a building: the mark and the ticker, on a white tile. */
export function plaqueTexture(logo, ticker, brand = '#6b7a90') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  rounded(ctx, 0, 0, 256, 96, 18);
  ctx.fill();
  ctx.fillStyle = brand;
  rounded(ctx, 0, 84, 256, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 84, 256, 4);
  if (logo) {
    const s = 60;
    const k = Math.min(s / logo.width, s / logo.height);
    ctx.drawImage(logo, 16 + (s - logo.width * k) / 2, 12 + (s - logo.height * k) / 2, logo.width * k, logo.height * k);
  }
  ctx.fillStyle = '#0b1220';
  ctx.font = `900 34px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';
  ctx.fillText(ticker.replace(/\.(TA|L)$/, '').slice(0, 6), logo ? 88 : 20, 44);
  return finish(c);
}

/** A hover badge: "+2.41%" in its colour on white. */
export function badgeTexture(text, colour) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 80;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  rounded(ctx, 4, 4, 248, 72, 24);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.font = `900 36px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';
  ctx.fillText(text, 128, 42);
  return finish(c);
}

/** The ticker and the day's move on a small dark pill over the roof: the
    one label every building always carries, so the city reads as "these are
    my stocks" without a tap. */
export function tickerBadge(ticker, pct, colour) {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 88;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(30, 37, 48, 0.92)';
  rounded(ctx, 4, 4, 312, 80, 26);
  ctx.fill();
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';
  ctx.font = `900 34px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  if (pct == null) {
    ctx.textAlign = 'center';
    ctx.fillText(ticker, 160, 46);
    return finish(c);
  }
  ctx.textAlign = 'left';
  const tw = ctx.measureText(ticker).width;
  ctx.font = `800 30px ${FONT}`;
  const pw = ctx.measureText(pct).width;
  const x0 = 160 - (tw + 14 + pw) / 2;
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText(ticker, x0, 46);
  ctx.font = `800 30px ${FONT}`;
  ctx.fillStyle = colour;
  ctx.fillText(pct, x0 + tw + 14, 47);
  return finish(c);
}

/** A district's name on a small dark pill with the district's colour as a
    dot — floating over its lane, read when looked for. */
export function districtLabel(text, colour, dir = 'ltr') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(30, 37, 48, 0.9)';
  rounded(ctx, 4, 4, 504, 88, 44);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = dir;
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, 256 + 16, 50);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(256 - tw / 2 - 12, 50, 12, 0, Math.PI * 2);
  ctx.fill();
  return finish(c);
}

/** The news board's screen: one headline, wrapped, with its source and a
    tag for the stock it is about. Dark screen, light type — a screen in a
    park, read from a few metres. `dir` follows the headline's language. */
export function newsTexture({ title, source, tag: label, colour }, dir = 'rtl') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 416;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b2230';
  rounded(ctx, 0, 0, 1024, 416, 28);
  ctx.fill();
  // the tag bar
  ctx.fillStyle = colour || '#ff8a3d';
  rounded(ctx, 0, 0, 1024, 14, 7);
  ctx.fill();
  const rtl = dir === 'rtl';
  const x = rtl ? 984 : 40;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = rtl ? 'right' : 'left';
  ctx.textBaseline = 'alphabetic';
  if (label) {
    ctx.font = `900 30px ${FONT}`;
    ctx.fillStyle = colour || '#ff8a3d';
    ctx.fillText(label, x, 64);
  }
  // the headline, up to three lines
  ctx.font = `800 54px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  const words = String(title || '').split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 944 && line) {
      lines.push(line);
      line = w;
    } else line = test;
    if (lines.length === 3) break;
  }
  if (lines.length < 3 && line) lines.push(line);
  if (lines.length === 3 && words.join(' ') !== lines.join(' ')) lines[2] = `${lines[2].slice(0, -1)}…`;
  lines.forEach((l, i) => ctx.fillText(l, x, 140 + i * 70));
  // the source, small, at the foot; a live dot the other side
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = '#9aa6b8';
  if (source) ctx.fillText(source, x, 384);
  ctx.fillStyle = '#4caf7d';
  ctx.beginPath();
  ctx.arc(rtl ? 56 : 968, 376, 10, 0, Math.PI * 2);
  ctx.fill();
  return finish(c);
}
