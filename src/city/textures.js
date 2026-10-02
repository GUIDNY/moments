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
  grass: '#b9d49f',
  park: '#a8cc8e',
  road: '#d2d3cf',
  kerb: '#bfc1bd',
  pavement: '#e6e5df',
  plaza: '#e9e6dc',
  plot: '#dfe0d8',
  water: '#8ec5e3',
  lane: '#ffffff',
};

/**
 * The whole ground in one texture: a road with a kerb and a pavement, lane
 * dashes, paving on the plaza and plots, a soft noise on the lawns so they are
 * not one flat green. Drawn once per layout.
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
      const nearRoad = !isRoad(x, y) && t !== TILE.WATER && (isRoad(x - 1, y) || isRoad(x + 1, y) || isRoad(x, y - 1) || isRoad(x, y + 1));
      if (nearRoad && (t === TILE.GRASS || t === TILE.PLOT)) fill = GROUND.pavement;
      ctx.fillStyle = fill;
      ctx.fillRect(X, Y, px, px);

      if (t === TILE.GRASS || t === TILE.PARK) {
        // a little life in the lawn
        ctx.fillStyle = (x * 7 + y * 13) % 5 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.025)';
        ctx.fillRect(X + ((x * 5) % px), Y + ((y * 9) % px), px * 0.4, px * 0.4);
      }
      if (nearRoad && fill === GROUND.pavement) {
        ctx.fillStyle = GROUND.kerb;
        if (isRoad(x - 1, y)) ctx.fillRect(X, Y, 2, px);
        if (isRoad(x + 1, y)) ctx.fillRect(X + px - 2, Y, 2, px);
        if (isRoad(x, y - 1)) ctx.fillRect(X, Y, px, 2);
        if (isRoad(x, y + 1)) ctx.fillRect(X, Y + px - 2, px, 2);
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
      if (t === TILE.PLAZA || t === TILE.PLOT) {
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

/** A district name on the pavement — small, flat, part of the ground. */
export function districtLabel(text, colour, dir = 'ltr') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = colour;
  rounded(ctx, 0, 0, 512, 96, 48);
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 42px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = dir;
  ctx.fillText(text, 256, 50);
  return finish(c);
}
