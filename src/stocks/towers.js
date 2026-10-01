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

const MIN_H = 5;     // above the tallest ordinary building on the street: even
                     // a token holding is the landmark on its block
const MAX_H = 11;    // the camera sits 15 up and 14 back: taller than this
                     // and the biggest holding is a wall rather than a tower

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Green up, red down, grey flat — the one colour convention nobody misreads.
 *
 * Softened for a daylight city: against pale concrete a saturated red reads as
 * an alarm rather than a price. These still separate instantly, which is the
 * only thing the colour has to do.
 */
export function moveColor(pct) {
  if (!Number.isFinite(pct)) return '#9aa5b1';
  if (pct > 0.05) return '#4caf7d';
  if (pct < -0.05) return '#e2706f';
  return '#a9b2bc';
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
         render goes a little darker and a little cold. One in profit is clean,
         warm and bright. It is the thing you notice from across the street,
         before any number.

         This is a *shade*, not a colour, because each district is built out of
         its own material now — stone for the banks, glass for the chip makers —
         and a flat grey would paint all six of them the same. The mood tints
         whatever the building is made of instead of replacing it. */
      shade: p.gainPct == null ? 0.96 : p.gainPct >= 0 ? 1 : 0.87,
      chill: p.gainPct != null && p.gainPct < 0,
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
