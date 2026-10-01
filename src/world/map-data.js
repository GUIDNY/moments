import { BOARD_BY_SYMBOL, SECTORS, SECTOR_BY_ID } from '../stocks/catalog';

/**
 * The city, rebuilt from the portfolio.
 *
 * This file used to export a map computed once when the module loaded, which
 * was right when the town was fixed. A portfolio is not: holdings get added and
 * sold while the page is open, and every one of them is a tower. So the map is
 * a live object that `rebuild()` replaces, and the pieces that draw it read it
 * through the accessors rather than importing a frozen array.
 *
 * The streets themselves never move. They are the part that was carefully made
 * walkable — every plot's door touches a road and the whole grid is reachable
 * from the plaza — so the towers change and the city's bones do not.
 */

export const MAP_W = 34;
export const MAP_H = 24;

/** The plaza, used when there is nothing built yet. */
export const SPAWN = { x: 16, y: 14 };

export const TERRAIN = {
  GRASS: 0,
  ROAD: 1,
  WATER: 2,
  BLOCKED: 3,
  PLAZA: 4,
};

export const H_ROADS = [
  { y: 4, x0: 4, x1: 29 },
  { y: 5, x0: 4, x1: 29 },
  { y: 11, x0: 0, x1: MAP_W - 1 },
  { y: 12, x0: 0, x1: MAP_W - 1 },
  { y: 18, x0: 4, x1: 29 },
  { y: 19, x0: 4, x1: 29 },
];

export const V_ROADS = [
  { x: 4, y0: 2, y1: 21 },
  { x: 5, y0: 2, y1: 21 },
  { x: 16, y0: 0, y1: MAP_H - 1 },
  { x: 17, y0: 0, y1: MAP_H - 1 },
  { x: 28, y0: 2, y1: 21 },
  { x: 29, y0: 2, y1: 21 },
];

/**
 * Four plots per block, and which edge of a plot its door faces.
 *
 * `doorRow` is 'top' or 'bottom': a door has to touch a road, and whether the
 * road is above or below the plot depends on where in the grid the plot sits.
 * Getting this wrong gives a tower you can see and never enter, which is what
 * `unreachableDoors()` is here to catch.
 */
const BLOCKS = [
  { id: 'north',     doorRow: 'bottom', at: { x: 11, y: 1 },  plots: [[6, 2], [11, 2], [19, 2], [24, 2]] },
  { id: 'northwest', doorRow: 'split',  at: { x: 10, y: 8 },  plots: [[6, 6], [11, 6], [6, 9], [11, 9]] },
  { id: 'northeast', doorRow: 'split',  at: { x: 23, y: 8 },  plots: [[19, 6], [24, 6], [19, 9], [24, 9]] },
  { id: 'southwest', doorRow: 'split',  at: { x: 10, y: 15 }, plots: [[6, 13], [11, 13], [6, 16], [11, 16]] },
  { id: 'southeast', doorRow: 'split',  at: { x: 23, y: 15 }, plots: [[19, 13], [24, 13], [19, 16], [24, 16]] },
  { id: 'south',     doorRow: 'top',    at: { x: 16, y: 21 }, plots: [[6, 20], [11, 20], [19, 20], [24, 20]] },
];

/* Nearest the plaza first. A portfolio of three stocks scattered across six
   fixed quarters is a city you spawn in the middle of and cannot see a single
   tower from — correct, and useless. */
const BLOCKS_BY_DISTANCE = [...BLOCKS].sort(
  (a, b) =>
    (a.at.x - SPAWN.x) ** 2 + (a.at.y - SPAWN.y) ** 2 -
    ((b.at.x - SPAWN.x) ** 2 + (b.at.y - SPAWN.y) ** 2)
);

const PLOTS_PER_BLOCK = 4;
const W = 3;
const H = 2;

export const MAX_TOWERS = BLOCKS.length * PLOTS_PER_BLOCK;

function doorFor(x, y, doorRow) {
  const mid = x + 1;
  if (doorRow === 'top') return { x: mid, y };
  if (doorRow === 'bottom') return { x: mid, y: y + H - 1 };
  // the blocks between two roads: the upper row opens upward, the lower
  // row downward, so each reaches the street it is nearest
  return y <= 7 || (y >= 13 && y <= 14) ? { x: mid, y } : { x: mid, y: y + H - 1 };
}

/* The live city. Everything that draws reads through the accessors below. */
const city = {
  placement: new Map(),
  buildings: [],
  fillers: [],
  byDoor: {},
  props: [],
  grid: null,
  version: 0,
};

/** Static scenery. Anything that would land on a tower is dropped. */
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

function buildGrid(buildings, props) {
  const grid = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(TERRAIN.GRASS));

  for (let y = 0; y < MAP_H; y++) {
    grid[y][0] = TERRAIN.WATER;
    grid[y][1] = TERRAIN.WATER;
  }
  for (const r of H_ROADS) for (let x = r.x0; x <= r.x1; x++) grid[r.y][x] = TERRAIN.ROAD;
  for (const r of V_ROADS) for (let y = r.y0; y <= r.y1; y++) grid[y][r.x] = TERRAIN.ROAD;
  for (let y = 11; y <= 12; y++) for (let x = 16; x <= 17; x++) grid[y][x] = TERRAIN.PLAZA;

  for (const b of buildings) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) grid[y][x] = TERRAIN.BLOCKED;
    }
  }
  for (const p of props) if (p.blocked) grid[p.y][p.x] = TERRAIN.BLOCKED;
  return grid;
}

/**
 * Lay the holdings out as towers, grouped by sector.
 *
 * Sectors keep their name and their colour; which block they occupy adapts to
 * how much of the city is built, so the occupied ones crowd the plaza instead
 * of sitting one each in six empty quarters. A sector with more holdings than
 * a block has plots spills into whichever block still has room, because a tower
 * with nowhere to stand would vanish and the city would quietly stop matching
 * the portfolio.
 */
export function rebuild(holdings = []) {
  const bySector = new Map(SECTORS.map((s) => [s.id, []]));
  const spill = [];
  for (const h of holdings) {
    const list = bySector.get(h.sector) || bySector.get('other');
    if (list.length < PLOTS_PER_BLOCK) list.push(h);
    else spill.push(h);
  }
  for (const h of spill) {
    const room = SECTORS.find((s) => bySector.get(s.id).length < PLOTS_PER_BLOCK);
    if (room) bySector.get(room.id).push(h);
  }

  const placement = new Map();
  SECTORS.filter((s) => bySector.get(s.id).length > 0).forEach((sector, i) => {
    if (BLOCKS_BY_DISTANCE[i]) placement.set(sector.id, BLOCKS_BY_DISTANCE[i]);
  });

  const buildings = [];
  for (const sector of SECTORS) {
    const block = placement.get(sector.id);
    if (!block) continue;
    bySector.get(sector.id).forEach((holding, i) => {
      const [x, y] = block.plots[i];
      buildings.push({
        id: `t-${holding.symbol}`,
        target: holding.symbol,
        kind: 'holding',
        district: sector.id,
        symbol: holding.symbol,
        x, y, w: W, h: H,
        door: doorFor(x, y, block.doorRow),
        emoji: SECTOR_BY_ID[sector.id]?.emoji ?? '🏢',
        name: holding.name || { he: holding.symbol, en: holding.symbol },
        color: sector.color,
        // the company's mark lives at its domain; a symbol found by search has
        // none and keeps the sector's sign
        domain: BOARD_BY_SYMBOL[holding.symbol]?.domain ?? null,
      });
    });
  }

  /* Every plot nobody's money is standing on still gets a building. Three
     towers in a field are a chart; three towers among a hundred ordinary
     buildings are a city with three places that matter in it. Fillers have
     no door and nothing behind them, which is exactly what makes the towers
     read: the one with a sign is the one that is yours. */
  /* A city is not only buildings. The blocks nobody's money is in each get
     a character of their own, in order of distance from the plaza: the
     nearest empty block is the market, the next the park, and the rest are
     the suburbs. A block with a tower in it is downtown whatever its rank. */
  const THEMES = ['market', 'park', 'suburb', 'suburb', 'suburb', 'suburb'];
  let quiet = 0;
  const themeOf = new Map();
  for (const block of BLOCKS_BY_DISTANCE) {
    const lively = block.plots.some(([px, py]) => buildings.some((b) => b.x === px && b.y === py));
    themeOf.set(block.id, lively ? 'downtown' : THEMES[Math.min(quiet++, THEMES.length - 1)]);
  }

  const fillers = [];
  for (const block of BLOCKS) {
    const theme = themeOf.get(block.id);
    const lively = theme === 'downtown';
    block.plots.forEach(([x, y], i) => {
      if (buildings.some((b) => b.x === x && b.y === y)) return;
      const seed = (x * 73 + y * 151 + i * 17) % 97;
      fillers.push({
        lively,
        theme,
        slot: i,
        id: `f-${x}-${y}`,
        kind: 'filler',
        x, y, w: W, h: H,
        // which street it fronts, so an awning or a stoop faces a road
        facing: doorFor(x, y, block.doorRow).y === y ? -1 : 1,
        seed,
      });
    });
  }

  const footprints = [...buildings, ...fillers];
  const onBuilding = (x, y) =>
    footprints.some((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);

  city.placement = placement;
  city.buildings = buildings;
  city.fillers = fillers;
  city.byDoor = Object.fromEntries(buildings.map((b) => [`${b.door.x},${b.door.y}`, b]));
  city.props = RAW_PROPS.filter((p) => !onBuilding(p.x, p.y));
  city.grid = buildGrid(footprints, city.props);
  city.version++;
  // handy from the console, and what the phone test aims its taps with
  if (typeof window !== 'undefined') window.__doors = buildings.map((b) => ({ id: b.id, ...b.door }));
  return city;
}

rebuild([]);

/* ── what the renderers read ──────────────────────────────────────────────── */

export const getBuildings = () => city.buildings;
/** The ordinary buildings on the plots no holding occupies — scenery, not venues. */
export const getFillers = () => city.fillers;
export const getProps = () => city.props;
export const getGrid = () => city.grid;
export const getVersion = () => city.version;

/** Where each sector ended up this time round. */
export const getDistricts = () =>
  SECTORS.map((s) => ({
    id: s.id,
    at: city.placement.get(s.id)?.at ?? { x: 16, y: 12 },
    color: s.color,
  }));

/** Colours only — the positions move, so anything needing those calls above. */
export const DISTRICTS = SECTORS.map((s) => ({ id: s.id, at: { x: 16, y: 12 }, color: s.color }));

export const inBounds = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;

/** Door tiles punch back through their tower's blocked footprint. */
export function isWalkable(x, y) {
  if (!inBounds(x, y)) return false;
  if (city.byDoor[`${x},${y}`]) return true;
  const tile = city.grid[y][x];
  return tile !== TERRAIN.BLOCKED && tile !== TERRAIN.WATER;
}

/**
 * Where to put someone when the city opens.
 *
 * Not the plaza: with three holdings it is nowhere near any of them, and you
 * arrive in your own city unable to see a single tower. You start on the street
 * outside the first one instead — and a few steps back down that street, because
 * standing in the doorway puts the camera against the facade and one tower
 * fills the screen.
 */
export function getSpawn() {
  const first = city.buildings[0];
  if (!first) return SPAWN;

  /* The camera sits behind the player on the +z side, so anything at a smaller
     z than the player is what fills the screen. Stepping "back" out of a door
     that faces north therefore puts the tower *behind the camera* — you spawn
     looking at an empty street with your own building out of shot. The player
     goes to the south of the tower whatever side its door is on; walking round
     to the door is three seconds and seeing the thing is the point.

     The street, not the verge: every block has a road to its south, and a lane
     of that road is where you start, so the tower fills the top of the screen
     and the city fills the rest. And a clear line of sight: the camera is a
     dozen tiles further south, so a building in the first few tiles behind
     the player stands between the lens and the avatar, and the city opens on
     the back of a block with nobody in it. Now that every plot is built on,
     that is most tiles — the spawn slides sideways to the gap between two
     plots rather than standing where it cannot be seen. */
  const southEdge = first.y + first.h;
  const centre = first.x + 1;
  const clearBehind = (x, y) => {
    for (let k = 1; k <= 3; k++) {
      if (!inBounds(x, y + k)) return true;
      if (city.grid[y + k][x] === TERRAIN.BLOCKED) return false;
    }
    return true;
  };

  let best = null;
  let bestScore = Infinity;
  let fallback = null;
  for (let x = first.x - 2; x <= first.x + first.w + 1; x++) {
    for (let step = 1; step <= 8; step++) {
      const y = southEdge + step;
      if (!inBounds(x, y)) break;
      // a door tile is walkable, and standing on one enters that building —
      // spawning on another tower's doorstep opened its screen instantly
      if (city.byDoor[`${x},${y}`]) continue;
      if (!isWalkable(x, y)) continue;
      if (step >= 3 && x === centre && !fallback) fallback = { x, y };
      if (step < 2 || city.grid[y][x] !== TERRAIN.ROAD || !clearBehind(x, y)) continue;
      const score = Math.abs(x - centre) + step * 0.1;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best ?? fallback ?? SPAWN;
}

/** Every door reachable on foot from the plaza. Checked, never assumed. */
export function unreachableDoors() {
  const seen = new Set([`${SPAWN.x},${SPAWN.y}`]);
  const queue = [[SPAWN.x, SPAWN.y]];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !isWalkable(nx, ny)) continue;
      seen.add(key);
      if (!city.byDoor[key]) queue.push([nx, ny]);
    }
  }
  return city.buildings.filter((b) => !seen.has(`${b.door.x},${b.door.y}`)).map((b) => b.id);
}

/**
 * The walk from one tile to another, for tap-to-walk: a breadth-first search
 * over the walkable grid, four-connected, so the route follows the streets
 * and turns corners rather than cutting through walls. Door tiles are
 * walkable but entering one opens that building, so a door is only ever the
 * last tile of a route, never a shortcut through someone else's lobby — the
 * same rule `unreachableDoors()` applies. Returns the tiles after `from`, or
 * null when there is no way there.
 */
export function findPath(from, to) {
  const fx = Math.floor(from.x);
  const fy = Math.floor(from.y);
  const tx = Math.floor(to.x);
  const ty = Math.floor(to.y);
  if (!isWalkable(tx, ty)) return null;
  if (fx === tx && fy === ty) return [];
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(fx, fy), null]]);
  const queue = [[fx, fy]];
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (prev.has(k) || !isWalkable(nx, ny)) continue;
      prev.set(k, key(x, y));
      if (nx === tx && ny === ty) {
        const path = [];
        let cur = k;
        while (cur && cur !== key(fx, fy)) {
          const [cx, cy] = cur.split(',').map(Number);
          path.push({ x: cx, y: cy });
          cur = prev.get(cur);
        }
        return path.reverse();
      }
      // a door is a destination, not a corridor
      if (!city.byDoor[k]) queue.push([nx, ny]);
    }
  }
  return null;
}

/** Which sector a point belongs to — the nearest tower wins. */
export function districtAt(x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const b of city.buildings) {
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
