/**
 * The city grid.
 *
 * Terrain is generated rather than hand-drawn so the streets always line up:
 * grass everywhere, roads carved on top, then trees and props scattered in the
 * leftovers. Buildings are blocking rectangles with exactly one walkable door
 * tile inside their own footprint, and that tile touches a road — so you enter
 * a place only by deliberately stepping off the street into its doorway.
 */

export const MAP_W = 34;
export const MAP_H = 24;
export const TILE = 40;

export const TERRAIN = {
  GRASS: 0,
  ROAD: 1,
  WATER: 2,
  BLOCKED: 3,
  PLAZA: 4,
};

const H_ROADS = [
  { y: 4, x0: 4, x1: 29 },
  { y: 5, x0: 4, x1: 29 },
  { y: 11, x0: 0, x1: MAP_W - 1 },
  { y: 12, x0: 0, x1: MAP_W - 1 },
  { y: 18, x0: 4, x1: 29 },
  { y: 19, x0: 4, x1: 29 },
];

const V_ROADS = [
  { x: 4, y0: 4, y1: 19 },
  { x: 5, y0: 4, y1: 19 },
  { x: 16, y0: 0, y1: MAP_H - 1 },
  { x: 17, y0: 0, y1: MAP_H - 1 },
  { x: 28, y0: 4, y1: 19 },
  { x: 29, y0: 4, y1: 19 },
];

export const DISTRICTS = [
  { id: 'study', name: 'רובע הלימוד', at: { x: 10, y: 3 }, color: '#44e092' },
  { id: 'speed', name: 'רובע המהירות', at: { x: 23, y: 3 }, color: '#f5c542' },
  { id: 'finance', name: 'הרובע הפיננסי', at: { x: 10, y: 20 }, color: '#c1c1ff' },
  { id: 'fun', name: 'פארק השעשועים', at: { x: 23, y: 20 }, color: '#ffb4aa' },
];

/**
 * `target` is the id the world hands back when you step into the doorway:
 * either a mini-game id from the registry or one of the city screens.
 */
export const BUILDINGS = [
  // ── רובע הלימוד ────────────────────────────────────────────────────────
  { id: 'b-chart', target: 'chart-reading', kind: 'game', district: 'study',
    x: 6, y: 6, w: 3, h: 2, door: { x: 7, y: 6 }, emoji: '📈', name: 'מגדל הגרפים', color: '#44e092' },
  { id: 'b-quiz', target: 'pattern-quiz', kind: 'game', district: 'study',
    x: 11, y: 6, w: 3, h: 2, door: { x: 12, y: 6 }, emoji: '🔍', name: 'מכון התבניות', color: '#44e092' },
  { id: 'b-memory', target: 'memory', kind: 'game', district: 'study',
    x: 6, y: 9, w: 3, h: 2, door: { x: 7, y: 10 }, emoji: '🃏', name: 'בית הזיכרון', color: '#44e092' },
  { id: 'b-percent', target: 'percent', kind: 'game', district: 'study',
    x: 11, y: 9, w: 3, h: 2, door: { x: 12, y: 10 }, emoji: '🧮', name: 'אולם האחוזים', color: '#44e092' },

  // ── רובע המהירות ───────────────────────────────────────────────────────
  { id: 'b-speed', target: 'speed-run', kind: 'game', district: 'speed',
    x: 19, y: 6, w: 3, h: 2, door: { x: 20, y: 6 }, emoji: '⚡', name: 'מסלול המהירות', color: '#f5c542' },
  { id: 'b-reflex', target: 'reflex', kind: 'game', district: 'speed',
    x: 24, y: 6, w: 3, h: 2, door: { x: 25, y: 6 }, emoji: '🎯', name: 'מכון הרפלקס', color: '#f5c542' },
  { id: 'b-survival', target: 'survival', kind: 'game', district: 'speed',
    x: 19, y: 9, w: 3, h: 2, door: { x: 20, y: 10 }, emoji: '💀', name: 'מגדל ההישרדות', color: '#f5c542' },
  { id: 'b-bullbear', target: 'bull-vs-bear', kind: 'game', district: 'speed',
    x: 24, y: 9, w: 3, h: 2, door: { x: 25, y: 10 }, emoji: '🐂', name: 'זירת השור והדוב', color: '#f5c542' },

  // ── הרובע הפיננסי ──────────────────────────────────────────────────────
  { id: 'b-floor', target: 'trading-floor', kind: 'game', district: 'finance',
    x: 6, y: 13, w: 3, h: 2, door: { x: 7, y: 13 }, emoji: '🏛️', name: 'חדר המסחר', color: '#c1c1ff' },
  { id: 'b-bank', target: 'bank', kind: 'screen', district: 'finance',
    x: 11, y: 13, w: 3, h: 2, door: { x: 12, y: 13 }, emoji: '🏦', name: 'הבנק', color: '#c1c1ff' },
  { id: 'b-home', target: 'profile', kind: 'screen', district: 'finance',
    x: 6, y: 16, w: 3, h: 2, door: { x: 7, y: 17 }, emoji: '🏠', name: 'הבית שלך', color: '#c1c1ff' },
  { id: 'b-shop', target: 'shop', kind: 'screen', district: 'finance',
    x: 11, y: 16, w: 3, h: 2, door: { x: 12, y: 17 }, emoji: '🛍️', name: 'החנות', color: '#c1c1ff' },

  // ── פארק השעשועים ──────────────────────────────────────────────────────
  { id: 'b-wheel', target: 'wheel', kind: 'game', district: 'fun',
    x: 19, y: 13, w: 3, h: 2, door: { x: 20, y: 13 }, emoji: '🎡', name: 'גלגל המזל', color: '#ffb4aa' },
];

export const BUILDING_BY_DOOR = Object.fromEntries(
  BUILDINGS.map((b) => [`${b.door.x},${b.door.y}`, b])
);

/** Static scenery. Blocking props keep the streets feeling narrow and alive. */
export const PROPS = [
  // park in the south-east block
  { x: 24, y: 13, emoji: '🌳', blocked: true },
  { x: 26, y: 14, emoji: '🌳', blocked: true },
  { x: 25, y: 16, emoji: '⛲', blocked: true },
  { x: 23, y: 17, emoji: '🌷', blocked: false },
  { x: 27, y: 16, emoji: '🌳', blocked: true },
  { x: 20, y: 16, emoji: '🪑', blocked: true },
  { x: 22, y: 15, emoji: '🌻', blocked: false },
  { x: 19, y: 17, emoji: '🌳', blocked: true },
  // street furniture
  { x: 15, y: 10, emoji: '🚦', blocked: true },
  { x: 18, y: 13, emoji: '🚦', blocked: true },
  { x: 15, y: 13, emoji: '📮', blocked: true },
  { x: 18, y: 10, emoji: '🗿', blocked: true },
  { x: 6, y: 20, emoji: '🌳', blocked: true },
  { x: 9, y: 21, emoji: '🌳', blocked: true },
  { x: 13, y: 20, emoji: '🌳', blocked: true },
  { x: 21, y: 21, emoji: '🌳', blocked: true },
  { x: 26, y: 20, emoji: '🌳', blocked: true },
  { x: 7, y: 2, emoji: '🌲', blocked: true },
  { x: 11, y: 1, emoji: '🌲', blocked: true },
  { x: 20, y: 2, emoji: '🌲', blocked: true },
  { x: 25, y: 1, emoji: '🌲', blocked: true },
  { x: 31, y: 7, emoji: '🌲', blocked: true },
  { x: 32, y: 15, emoji: '🌲', blocked: true },
  { x: 31, y: 21, emoji: '🌲', blocked: true },
];

const PROP_BY_KEY = Object.fromEntries(PROPS.map((p) => [`${p.x},${p.y}`, p]));

function buildTerrain() {
  const grid = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(TERRAIN.GRASS));

  // a river frames the west edge
  for (let y = 0; y < MAP_H; y++) {
    grid[y][0] = TERRAIN.WATER;
    grid[y][1] = TERRAIN.WATER;
  }

  for (const r of H_ROADS) {
    for (let x = r.x0; x <= r.x1; x++) grid[r.y][x] = TERRAIN.ROAD;
  }
  for (const r of V_ROADS) {
    for (let y = r.y0; y <= r.y1; y++) grid[y][r.x] = TERRAIN.ROAD;
  }

  // the crossroads in the middle of town reads as a plaza
  for (let y = 11; y <= 12; y++) {
    for (let x = 16; x <= 17; x++) grid[y][x] = TERRAIN.PLAZA;
  }

  for (const b of BUILDINGS) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) grid[y][x] = TERRAIN.BLOCKED;
    }
  }

  for (const p of PROPS) {
    if (p.blocked) grid[p.y][p.x] = TERRAIN.BLOCKED;
  }

  return grid;
}

export const TERRAIN_GRID = buildTerrain();

export const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

/** Door tiles punch back through their building's blocked footprint. */
export function isWalkable(x, y) {
  if (!inBounds(x, y)) return false;
  if (BUILDING_BY_DOOR[`${x},${y}`]) return true;
  return TERRAIN_GRID[y][x] !== TERRAIN.BLOCKED && TERRAIN_GRID[y][x] !== TERRAIN.WATER;
}

export const propAt = (x, y) => PROP_BY_KEY[`${x},${y}`] ?? null;

export const SPAWN = { x: 16, y: 14 };

/** Breadth-first path between two tiles. Returns the steps after `from`. */
export function findPath(from, to) {
  if (!isWalkable(to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];

  const key = (x, y) => y * MAP_W + x;
  const prev = new Map();
  const seen = new Uint8Array(MAP_W * MAP_H);
  const queue = [from];
  seen[key(from.x, from.y)] = 1;

  const DIRS = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (node.x === to.x && node.y === to.y) {
      const path = [];
      let cur = node;
      while (cur.x !== from.x || cur.y !== from.y) {
        path.push(cur);
        cur = prev.get(key(cur.x, cur.y));
      }
      return path.reverse();
    }
    for (const [dx, dy] of DIRS) {
      const nx = node.x + dx;
      const ny = node.y + dy;
      if (!isWalkable(nx, ny) || seen[key(nx, ny)]) continue;
      // never path *through* a doorway — you only ever arrive at one
      if (BUILDING_BY_DOOR[`${nx},${ny}`] && !(nx === to.x && ny === to.y)) continue;
      seen[key(nx, ny)] = 1;
      prev.set(key(nx, ny), node);
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}
