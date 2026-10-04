import { SECTORS } from '../stocks/catalog.js';

/**
 * The city as a plan: a square grid of tiles with a park and the headquarters
 * in the middle, a boulevard round the park, a cross of roads to the edges,
 * and one district per sector around them — eight districts in the eight
 * regions the roads cut, and the index funds in the park itself, beside the
 * headquarters, because an index fund *is* the whole market.
 *
 * Everything on the map sits on a tile, so the plan can be read back (what
 * is at x,y) and, later, edited. Districts are placed by sector in a fixed
 * order so a city looks the same every time it is opened; the plots inside a
 * district fill in order of position size, biggest nearest the centre.
 *
 * This file is the only place that knows where things go. The scene draws
 * what it is handed and never reasons about the grid.
 */

export const SIZE = 31;
export const TILE = {
  GRASS: 0,
  ROAD: 1,
  PARK: 2,
  WATER: 3,
  PLAZA: 4,
  PLOT: 5,
  LANE: 6, // a road without a centre line: the small streets inside a district
};

const C = SIZE / 2; // 15.5

/* The park is 11×11 around the centre, the HQ stands on a plaza in it. A
   boulevard (the cross at 8 and 22, the ring at 9 and 21) runs round the
   park and out to the edges, which cuts the rest into eight regions: four
   7×7 corners and four 11-long sides. */
const PARK = { x0: 10, y0: 10, x1: 20, y1: 20 };
const HQ = { x: 14, y: 14, w: 3, h: 3 };
const RING = { x0: 9, y0: 9, x1: 21, y1: 21 };
const CROSS = [8, 22];

/* Regions (inclusive tile ranges) between the ring road and the edge. Each
   is split by lanes into 3×3 plots: two a side on a 7-tile region, three on
   an 11-tile one. The park is a region too, with three plots in the corners
   the HQ, the lake and the treasury leave free. */
const REGIONS = {
  nw: { x0: 1, y0: 1, x1: 7, y1: 7 },
  n: { x0: 10, y0: 1, x1: 20, y1: 7 },
  ne: { x0: 23, y0: 1, x1: 29, y1: 7 },
  w: { x0: 1, y0: 10, x1: 7, y1: 20 },
  e: { x0: 23, y0: 10, x1: 29, y1: 20 },
  sw: { x0: 1, y0: 23, x1: 7, y1: 29 },
  s: { x0: 10, y0: 23, x1: 20, y1: 29 },
  se: { x0: 23, y0: 23, x1: 29, y1: 29 },
  park: { x0: 10, y0: 10, x1: 20, y1: 20, plots: [{ x: 18, y: 18 }, { x: 10, y: 18 }, { x: 18, y: 10 }] },
};

/** Sector id → region, and the district's character. Order is placement order. */
export const DISTRICTS = [
  { sector: 'tech', region: 'ne', name: { he: 'טכנולוגיה', en: 'Tech District' }, tint: '#7db7ff' },
  { sector: 'banks', region: 'nw', name: { he: 'פיננסים', en: 'Finance' }, tint: '#f5c542' },
  { sector: 'health', region: 'e', name: { he: 'בריאות', en: 'Healthcare' }, tint: '#ffb4aa' },
  { sector: 'energy', region: 'se', name: { he: 'אנרגיה', en: 'Energy' }, tint: '#ff9f45' },
  { sector: 'consumer', region: 'n', name: { he: 'מסחר', en: 'Retail' }, tint: '#f78fb3' },
  { sector: 'industry', region: 'sw', name: { he: 'תעשייה', en: 'Industrial' }, tint: '#8fb98f' },
  { sector: 'realestate', region: 'w', name: { he: 'נדל״ן', en: 'Real estate' }, tint: '#c9b08f' },
  { sector: 'comm', region: 's', name: { he: 'תקשורת', en: 'Media' }, tint: '#7fd3c8' },
  { sector: 'other', region: 'park', name: { he: 'קרנות ומדדים', en: 'ETF & Index' }, tint: '#c1c1ff' },
];
export const DISTRICT_BY_SECTOR = Object.fromEntries(DISTRICTS.map((d) => [d.sector, d]));

/** The 3×3 plots of a region, nearest the city centre first. */
function plotsOf(region) {
  const r = REGIONS[region];
  if (r.plots) return r.plots.map((p) => ({ ...p, w: 3, h: 3 })).sort((a, b) => dist2(a) - dist2(b));
  const { x0, y0, x1, y1 } = r;
  // a column of plots every four tiles (three of plot, one of lane)
  const cols = [];
  for (let x = x0; x + 2 <= x1; x += 4) cols.push(x);
  const rows = [];
  for (let y = y0; y + 2 <= y1; y += 4) rows.push(y);
  const plots = [];
  for (const py of rows) for (const px of cols) plots.push({ x: px, y: py, w: 3, h: 3 });
  return plots.sort((a, b) => dist2(a) - dist2(b));
}
const dist2 = (p) => (p.x + 1.5 - C) ** 2 + (p.y + 1.5 - C) ** 2;

/** How many positions a district can hold before it spills. */
export const capacityOf = (sector) => plotsOf(DISTRICT_BY_SECTOR[sector]?.region ?? 'park').length;

/**
 * Lay the positions out. `positions` carry `symbol`, `sector`, `valueUsd`,
 * `share`, `name`, `domain`; the result is what the scene draws.
 */
export function planCity(positions = []) {
  const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill(TILE.GRASS));
  const set = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) grid[y][x] = v;
  };

  // park and plaza
  for (let y = PARK.y0; y <= PARK.y1; y++) for (let x = PARK.x0; x <= PARK.x1; x++) set(x, y, TILE.PARK);
  for (let y = HQ.y - 1; y <= HQ.y + HQ.h; y++) for (let x = HQ.x - 1; x <= HQ.x + HQ.w; x++) set(x, y, TILE.PLAZA);
  // the lake, along the park's west side
  const lake = [[10, 13], [11, 13], [10, 14], [11, 14], [12, 14], [10, 15], [11, 15], [12, 15], [10, 16], [11, 16], [12, 16], [10, 17], [11, 17]];
  for (const [x, y] of lake) set(x, y, TILE.WATER);

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
    for (const c of CROSS) {
      set(i, c, TILE.ROAD);
      set(c, i, TILE.ROAD);
    }
  }
  // lanes inside districts: between every column and row of plots
  for (const [key, r] of Object.entries(REGIONS)) {
    if (key === 'park') continue;
    for (let lx = r.x0 + 3; lx < r.x1; lx += 4) for (let y = r.y0; y <= r.y1; y++) set(lx, y, TILE.LANE);
    for (let ly = r.y0 + 3; ly < r.y1; ly += 4) for (let x = r.x0; x <= r.x1; x++) set(x, ly, TILE.LANE);
  }

  // positions into plots, by sector, biggest first; overflow spills to the
  // district with room nearest the centre
  const bySector = new Map(DISTRICTS.map((d) => [d.sector, []]));
  const sorted = [...positions].sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));
  const spill = [];
  for (const p of sorted) {
    const sector = bySector.has(p.sector) ? p.sector : 'other';
    const list = bySector.get(sector);
    if (list.length < capacityOf(sector)) list.push(p);
    else spill.push(p);
  }
  for (const p of spill) {
    const room = DISTRICTS.find((d) => bySector.get(d.sector).length < capacityOf(d.sector));
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
    // the name's pill goes at the outer end of the district, by the kerb —
    // over the lane crossing it stacked on the nearest building's
    const mx = (r.x0 + r.x1 + 1) / 2;
    const my = (r.y0 + r.y1 + 1) / 2;
    const label =
      d.region === 'park' ? { x: mx, z: r.y1 + 0.5 }
      : d.region === 'nw' || d.region === 'ne' || d.region === 'n' ? { x: mx, z: r.y0 + 0.6 }
      : d.region === 'sw' || d.region === 'se' || d.region === 's' ? { x: mx, z: r.y1 + 0.4 }
      : d.region === 'w' ? { x: r.x0 + 0.6, z: my }
      : { x: r.x1 + 0.4, z: my };
    return { ...d, cx: mx, cz: my, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, label, used: bySector.get(d.sector).length };
  });

  const hq = { x: HQ.x, y: HQ.y, w: HQ.w, h: HQ.h, cx: HQ.x + HQ.w / 2, cz: HQ.y + HQ.h / 2 };
  return {
    size: SIZE,
    grid,
    buildings,
    districts,
    hq,
    park: PARK,
    ring: RING,
    // where the park's furniture stands: the treasury east of the plaza, the
    // news board in the north-west corner (up the screen is −x−z), the
    // fountain on the plaza's south side
    treasury: { x: 19.5, z: hq.cz },
    board: { x: 11.5, z: 11.5 },
    fountain: { x: hq.cx, z: HQ.y + HQ.h + 1.4 },
    centre: { x: C, z: C },
  };
}

export const SECTOR_IDS = SECTORS.map((s) => s.id);
