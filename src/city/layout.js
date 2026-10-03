import { SECTORS } from '../stocks/catalog.js';

/**
 * The city as a plan: a square grid of tiles with a park and the headquarters
 * in the middle, a cross of roads, and one district per sector around them.
 *
 * Everything on the map sits on a tile, so the plan can be read back (what
 * is at x,y) and, later, edited. Districts are placed by sector in a fixed
 * order so a city looks the same every time it is opened; the plots inside a
 * district fill in order of position size, biggest nearest the centre.
 *
 * This file is the only place that knows where things go. The scene draws
 * what it is handed and never reasons about the grid.
 */

export const SIZE = 28;
export const TILE = {
  GRASS: 0,
  ROAD: 1,
  PARK: 2,
  WATER: 3,
  PLAZA: 4,
  PLOT: 5,
  LANE: 6, // a road without a centre line: the small streets inside a district
};

const C = SIZE / 2; // 14

/* The park is 8×8 around the centre, the HQ stands on a plaza in it. A road
   ring runs round the park and a road cross reaches the edges, which cuts
   the rest into eight regions; six of them are districts, the two in the
   middle of the north and south sides are a square and a lake. */
const PARK = { x0: 10, y0: 10, x1: 17, y1: 17 };
const HQ = { x: 13, y: 13, w: 2, h: 2 };
const RING = { x0: 9, y0: 9, x1: 18, y1: 18 };

/* Regions (inclusive tile ranges) between the ring road and the edge, with
   the lane that splits each into four 3×3 plots. Plot order: nearest the
   centre first. */
const REGIONS = {
  nw: { x0: 1, y0: 1, x1: 7, y1: 7 },
  ne: { x0: 20, y0: 1, x1: 26, y1: 7 },
  sw: { x0: 1, y0: 20, x1: 7, y1: 26 },
  se: { x0: 20, y0: 20, x1: 26, y1: 26 },
  w: { x0: 1, y0: 10, x1: 7, y1: 17 },
  e: { x0: 20, y0: 10, x1: 26, y1: 17 },
};

/** Sector id → region, and the district's character. Order is placement order. */
export const DISTRICTS = [
  { sector: 'tech', region: 'ne', name: { he: 'טכנולוגיה', en: 'Tech District' }, tint: '#7db7ff' },
  { sector: 'banks', region: 'nw', name: { he: 'פיננסים', en: 'Finance' }, tint: '#f5c542' },
  { sector: 'health', region: 'e', name: { he: 'בריאות', en: 'Healthcare' }, tint: '#ffb4aa' },
  { sector: 'energy', region: 'se', name: { he: 'אנרגיה', en: 'Energy' }, tint: '#ff9f45' },
  { sector: 'defence', region: 'sw', name: { he: 'תעשייה', en: 'Industrial' }, tint: '#8fb98f' },
  { sector: 'other', region: 'w', name: { he: 'קרנות ומדדים', en: 'ETF & Index' }, tint: '#c1c1ff' },
];
export const DISTRICT_BY_SECTOR = Object.fromEntries(DISTRICTS.map((d) => [d.sector, d]));

/** Four 3×3 plots in a region, nearest the city centre first. */
function plotsOf(region) {
  const { x0, y0, x1, y1 } = REGIONS[region];
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  // the lane sits in the middle; plots hug the corners
  const xs = [x0, x1 - 2];
  const ys = h >= 7 ? [y0, y1 - 2] : [y0];
  const plots = [];
  for (const py of ys) for (const px of xs) plots.push({ x: px, y: py, w: 3, h: 3 });
  // wider regions (w/e) get a third column
  if (w >= 8) for (const py of ys) plots.push({ x: x0 + 4, y: py, w: 3, h: 3 });
  return plots.sort((a, b) => dist2(a) - dist2(b));
}
const dist2 = (p) => (p.x + 1.5 - C) ** 2 + (p.y + 1.5 - C) ** 2;

/**
 * Lay the positions out. `positions` carry `symbol`, `sector`, `valueUsd`,
 * `name`, `domain`; the result is what the scene draws.
 */
export function planCity(positions = []) {
  const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(TILE.GRASS));
  const set = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) grid[y][x] = v;
  };

  // park and plaza
  for (let y = PARK.y0; y <= PARK.y1; y++) for (let x = PARK.x0; x <= PARK.x1; x++) set(x, y, TILE.PARK);
  for (let y = HQ.y - 1; y <= HQ.y + HQ.h; y++) for (let x = HQ.x - 1; x <= HQ.x + HQ.w; x++) set(x, y, TILE.PLAZA);
  // a small lake in the park's corner
  for (const [x, y] of [[10, 16], [11, 16], [10, 17], [11, 17], [12, 17], [10, 15]]) set(x, y, TILE.WATER);

  // the ring and the cross
  for (let x = RING.x0; x <= RING.x1; x++) {
    set(x, RING.y0, TILE.ROAD);
    set(x, RING.y1, TILE.ROAD);
  }
  for (let y = RING.y0; y <= RING.y1; y++) {
    set(RING.x0, y, TILE.ROAD);
    set(RING.x1, y, TILE.ROAD);
  }
  for (let i = 0; i < SIZE; i++) {
    set(i, 8, TILE.ROAD);
    set(i, 19, TILE.ROAD);
    set(8, i, TILE.ROAD);
    set(19, i, TILE.ROAD);
  }
  // the north and south squares: a paved square with trees, and the lake side
  for (let y = 1; y <= 7; y++) for (let x = 10; x <= 17; x++) set(x, y, TILE.PARK);
  for (let y = 20; y <= 26; y++) for (let x = 10; x <= 17; x++) set(x, y, TILE.PARK);
  // lanes inside districts
  for (const r of Object.values(REGIONS)) {
    const lx = r.x0 + 3;
    for (let y = r.y0; y <= r.y1; y++) set(lx, y, TILE.LANE);
    if (r.y1 - r.y0 + 1 >= 7) for (let x = r.x0; x <= r.x1; x++) set(x, r.y0 + 3, TILE.LANE);
  }

  // positions into plots, by sector, biggest first; overflow spills to the
  // district with room nearest the centre
  const bySector = new Map(DISTRICTS.map((d) => [d.sector, []]));
  const sorted = [...positions].sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));
  const spill = [];
  for (const p of sorted) {
    const list = bySector.get(p.sector) ?? bySector.get('other');
    if (list.length < plotsOf(DISTRICT_BY_SECTOR[p.sector]?.region ?? 'w').length) list.push(p);
    else spill.push(p);
  }
  for (const p of spill) {
    const room = DISTRICTS.find((d) => bySector.get(d.sector).length < plotsOf(d.region).length);
    if (room) bySector.get(room.sector).push(p);
  }

  const buildings = [];
  for (const d of DISTRICTS) {
    const plots = plotsOf(d.region);
    bySector.get(d.sector).forEach((p, i) => {
      const plot = plots[i];
      for (let y = plot.y; y < plot.y + plot.h; y++) for (let x = plot.x; x < plot.x + plot.w; x++) set(x, y, TILE.PLOT);
      buildings.push({
        id: `b-${p.symbol}`,
        symbol: p.symbol,
        sector: d.sector,
        district: d,
        plot,
        cx: plot.x + plot.w / 2,
        cz: plot.y + plot.h / 2,
        // faces the lane or the ring, whichever is nearer the centre
        facing: plot.y + 1.5 < C ? 1 : -1,
        valueUsd: p.valueUsd ?? 0,
        share: p.share ?? 0,
        name: p.name,
        domain: p.domain ?? null,
      });
    });
  }

  const districts = DISTRICTS.map((d) => {
    const r = REGIONS[d.region];
    // the name's pill goes at the outer end of the district's lane, by the
    // shore — over the lane crossing it stacked on the nearest building's
    const lx = r.x0 + 3.5;
    const ly = r.y0 + 3.5;
    const label =
      d.region === 'nw' || d.region === 'ne' ? { x: lx, z: r.y0 + 0.6 }
      : d.region === 'sw' || d.region === 'se' ? { x: lx, z: r.y1 + 0.4 }
      : d.region === 'w' ? { x: r.x0 + 0.6, z: ly }
      : { x: r.x1 + 0.4, z: ly };
    return { ...d, cx: (r.x0 + r.x1 + 1) / 2, cz: (r.y0 + r.y1 + 1) / 2, label, used: bySector.get(d.sector).length };
  });

  return {
    size: SIZE,
    grid,
    buildings,
    districts,
    hq: { x: HQ.x, y: HQ.y, w: HQ.w, h: HQ.h, cx: HQ.x + HQ.w / 2, cz: HQ.y + HQ.h / 2 },
    park: PARK,
    centre: { x: C, z: C },
  };
}

export const SECTOR_IDS = SECTORS.map((s) => s.id);
