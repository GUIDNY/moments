import { OWNER, PROJECTS, ZONES, projectsIn } from '../portfolio/projects';

/**
 * The town, generated from the portfolio.
 *
 * Nothing here is hand-placed. Each zone owns four plots on the grid, and the
 * projects in that zone fill them in order — so adding a project is an entry in
 * `portfolio/projects.js` and never an edit to this file. A zone with two
 * projects simply has two empty plots, which reads as a quiet street rather
 * than a bug.
 *
 * Terrain is generated too: grass everywhere, roads carved on top, then props
 * scattered in whatever is left. Buildings are blocking rectangles with exactly
 * one walkable door tile inside their own footprint, and that tile touches a
 * road — so you enter a place only by deliberately stepping off the street.
 */

export const MAP_W = 34;
export const MAP_H = 24;

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
  { x: 4, y0: 2, y1: 21 },
  { x: 5, y0: 2, y1: 21 },
  { x: 16, y0: 0, y1: MAP_H - 1 },
  { x: 17, y0: 0, y1: MAP_H - 1 },
  { x: 28, y0: 2, y1: 21 },
  { x: 29, y0: 2, y1: 21 },
];

/**
 * Four plots per zone, and which edge of a plot its door faces.
 *
 * `doorRow` is 'top' or 'bottom': a door has to touch a road, and whether the
 * road is above or below the plot depends on where in the grid the plot sits.
 * Getting this wrong gives a building you can see and never enter, which is why
 * the reachability test at the bottom of this file exists.
 */
const PLOTS = {
  //            ┌ north strip, under the y=4 road
  business:  { doorRow: 'bottom', at: { x: 11, y: 1 }, plots: [[6, 2], [11, 2], [19, 2], [24, 2]] },
  //            ┌ north-west block
  automation:{ doorRow: 'split',  at: { x: 10, y: 8 }, plots: [[6, 6], [11, 6], [6, 9], [11, 9]] },
  web:       { doorRow: 'split',  at: { x: 23, y: 8 }, plots: [[19, 6], [24, 6], [19, 9], [24, 9]] },
  bots:      { doorRow: 'split',  at: { x: 10, y: 15 }, plots: [[6, 13], [11, 13], [6, 16], [11, 16]] },
  apps:      { doorRow: 'split',  at: { x: 23, y: 15 }, plots: [[19, 13], [24, 13], [19, 16], [24, 16]] },
  //            └ south strip, over the y=19 road
  studio:    { doorRow: 'top',    at: { x: 16, y: 21 }, plots: [[6, 20], [11, 20], [19, 20], [24, 20]] },
};

const W = 3;
const H = 2;

/** Where the door goes for a plot, given which road it can reach. */
function doorFor(x, y, doorRow) {
  const mid = x + 1;
  if (doorRow === 'top') return { x: mid, y };
  if (doorRow === 'bottom') return { x: mid, y: y + H - 1 };
  // 'split': the blocks between two roads — the upper row opens upward, the
  // lower row opens downward, so both reach the street they are nearest
  return y <= 7 || (y >= 13 && y <= 14) ? { x: mid, y } : { x: mid, y: y + H - 1 };
}

/* The two fixed doors of the studio: they are not projects, but they are
   places you walk into, so they are buildings like any other. */
const FIXED = [
  { id: 'about', target: 'about', emoji: '👋', name: { he: 'עליי', en: 'About me' } },
  { id: 'contact', target: 'contact', emoji: '✉️', name: { he: 'דברו איתי', en: 'Get in touch' } },
];

function buildBuildings() {
  const out = [];
  for (const zone of ZONES) {
    const layout = PLOTS[zone.id];
    if (!layout) continue;

    const occupants =
      zone.id === 'studio'
        ? FIXED
        : projectsIn(zone.id).map((p) => ({
            id: p.id,
            target: p.id,
            emoji: p.emoji,
            name: p.name,
          }));

    occupants.slice(0, layout.plots.length).forEach((occupant, i) => {
      const [x, y] = layout.plots[i];
      out.push({
        id: `b-${occupant.id}`,
        target: occupant.target,
        kind: zone.id === 'studio' ? 'screen' : 'project',
        district: zone.id,
        x, y, w: W, h: H,
        door: doorFor(x, y, layout.doorRow),
        emoji: occupant.emoji,
        name: occupant.name,
        color: zone.color,
      });
    });
  }
  return out;
}

export const BUILDINGS = buildBuildings();

export const DISTRICTS = ZONES.map((z) => ({
  id: z.id,
  at: PLOTS[z.id]?.at ?? { x: 16, y: 12 },
  color: z.color,
}));

export const BUILDING_BY_DOOR = Object.fromEntries(
  BUILDINGS.map((b) => [`${b.door.x},${b.door.y}`, b])
);

/** Static scenery. Anything that would land on a building is dropped below. */
const RAW_PROPS = [
  { x: 20, y: 8, emoji: '🌳', blocked: true },
  { x: 14, y: 7, emoji: '🌳', blocked: true },
  { x: 14, y: 15, emoji: '🌳', blocked: true },
  { x: 22, y: 15, emoji: '🌳', blocked: true },
  { x: 8, y: 8, emoji: '🌷', blocked: false },
  { x: 26, y: 8, emoji: '🌻', blocked: false },
  { x: 9, y: 15, emoji: '🌻', blocked: false },
  { x: 15, y: 10, emoji: '🚦', blocked: true },
  { x: 18, y: 13, emoji: '🚦', blocked: true },
  { x: 15, y: 13, emoji: '📮', blocked: true },
  { x: 18, y: 10, emoji: '🗿', blocked: true },
  { x: 14, y: 2, emoji: '🌲', blocked: true },
  { x: 22, y: 2, emoji: '🌲', blocked: true },
  { x: 14, y: 21, emoji: '🌲', blocked: true },
  { x: 22, y: 21, emoji: '🌲', blocked: true },
  { x: 31, y: 7, emoji: '🌲', blocked: true },
  { x: 32, y: 15, emoji: '🌲', blocked: true },
  { x: 31, y: 21, emoji: '🌲', blocked: true },
  { x: 31, y: 3, emoji: '🌲', blocked: true },
];

const onBuilding = (x, y) =>
  BUILDINGS.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);

export const PROPS = RAW_PROPS.filter((p) => !onBuilding(p.x, p.y));

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

export const SPAWN = { x: 16, y: 14 };

/**
 * Every door you can actually walk to from the spawn point.
 *
 * A generated town can put a door against a wall as easily as against a street,
 * and the failure is silent — the building is there, the sign is over it, and
 * you simply cannot get in. So it is checked rather than assumed, and the check
 * runs in the test suite against the real map.
 */
export function unreachableDoors() {
  const seen = new Set();
  const start = `${SPAWN.x},${SPAWN.y}`;
  const queue = [[SPAWN.x, SPAWN.y]];
  seen.add(start);
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !isWalkable(nx, ny)) continue;
      seen.add(key);
      // a door is where you stop, not a way through to the next street
      if (!BUILDING_BY_DOOR[key]) queue.push([nx, ny]);
    }
  }
  return BUILDINGS.filter((b) => !seen.has(`${b.door.x},${b.door.y}`)).map((b) => b.id);
}

/** Which zone a point belongs to — the nearest venue wins. */
export function districtAt(x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const b of BUILDINGS) {
    const dx = x - (b.x + b.w / 2);
    const dy = y - (b.y + b.h / 2);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = b;
    }
  }
  return best?.district ?? DISTRICTS[0].id;
}

export { OWNER, PROJECTS };
