/**
 * What each tower should look like, published outside React.
 *
 * A tower's height is its share of the portfolio and its colour is how the day
 * has gone, and both ease towards their new value every frame. Driving that
 * through React state would re-render the whole city sixty times a second for
 * an animation that touches one number per building, so the targets live here
 * and `useFrame` reads them — the same arrangement as `playerPos` and `market`.
 */

export const towers = { bySymbol: {}, biggest: 0 };

const MIN_H = 2.2;   // even a token holding is a building, not a kerbstone
const MAX_H = 7.5;   // the camera sits 15 up and 14 back: taller than this
                     // and the biggest holding is a wall rather than a tower

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Green up, red down, grey flat — the one colour convention nobody misreads. */
export function moveColor(pct) {
  if (!Number.isFinite(pct)) return '#6b7a90';
  if (pct > 0.05) return '#2fbf71';
  if (pct < -0.05) return '#e5484d';
  return '#8a93a3';
}

/**
 * Height is the **square root** of the share, not the share itself.
 *
 * A portfolio is usually one big holding and a tail of small ones. Scaling
 * height linearly makes the tail a row of doorsteps next to one skyscraper, and
 * you cannot read a city like that. A square root keeps the biggest clearly
 * biggest while leaving the small ones tall enough to walk up to.
 */
export function computeTowers(positions, totalValue) {
  const bySymbol = {};
  let biggest = 0;

  for (const p of positions) {
    if (p.missing) continue;
    const share = totalValue > 0 && p.converted != null ? p.converted / totalValue : 0;
    const height = clamp(MIN_H + Math.sqrt(share) * (MAX_H - MIN_H), MIN_H, MAX_H);
    biggest = Math.max(biggest, height);

    bySymbol[p.symbol] = {
      height,
      share,
      dayPct: p.dayPct,
      gainPct: p.gainPct,
      roof: moveColor(p.dayPct),
      /* A holding under water is a building that has seen better days: the
         facade goes dim and grey. One in profit is lit and clean. It is the
         thing you notice from across the street, before any number. */
      body: p.gainPct == null
        ? '#39414f'
        : p.gainPct >= 0
          ? '#4a5768'
          : '#2b2f38',
      lit: p.gainPct == null ? 0.5 : clamp(0.25 + p.gainPct / 40, 0.08, 1),
    };
  }

  towers.bySymbol = bySymbol;
  towers.biggest = biggest;
  // handy from the console, and what the browser test asserts against
  if (typeof window !== 'undefined') window.__towers = towers;
  return towers;
}

export const towerFor = (symbol) => towers.bySymbol[symbol];
