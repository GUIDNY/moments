/**
 * How big a building a position gets, and how big a headquarters a portfolio
 * gets. Both are tables, not formulas: a designer changes a number here and
 * the whole city re-tiers, and a position that grows past a boundary visibly
 * steps up a class rather than creeping. Values are dollars.
 */

/* A building's size is the position's share of the whole portfolio — cash
   included, so one $5,000 stock in a $100,000 purse is a shop, not a tower.
   `min` is that share, 0–1. The portfolio is the city: a 40% position is
   the building you see first. */
export const BUILDING_TIERS = [
  { tier: 1, min: 0,     height: 1.5, footprint: 2.0, label: { he: 'חנות', en: 'Shop' } },
  { tier: 2, min: 0.025, height: 2.6, footprint: 2.3, label: { he: 'בניין', en: 'Building' } },
  { tier: 3, min: 0.07,  height: 3.8, footprint: 2.5, label: { he: 'בניין משרדים', en: 'Office block' } },
  { tier: 4, min: 0.15,  height: 5.2, footprint: 2.6, label: { he: 'מגדל', en: 'Tower' } },
  { tier: 5, min: 0.30,  height: 6.8, footprint: 2.7, label: { he: 'גורד שחקים', en: 'Skyscraper' } },
];

export function tierFor(share) {
  const v = Number.isFinite(share) ? share : 0;
  let best = BUILDING_TIERS[0];
  for (const t of BUILDING_TIERS) if (v >= t.min) best = t;
  return best;
}

/** A position's share of everything — holdings and cash. */
export function shareOf(valueUsd, totalUsd) {
  if (!Number.isFinite(valueUsd) || !Number.isFinite(totalUsd) || totalUsd <= 0) return 0;
  return Math.max(0, Math.min(1, valueUsd / totalUsd));
}

/** The headquarters grows with the whole portfolio, *relative to where it
    began*: `min` is a multiple of the baseline — the $100,000 purse for a
    played game, the first real total for a connected portfolio. A ₪50,000
    portfolio and a $5M one start at the same office and grow the same way. */
export const HQ_LEVELS = [
  { level: 1, min: 0,    height: 3.6, label: { he: 'משרד', en: 'Office' } },
  { level: 2, min: 1.1,  height: 4.6, label: { he: 'בניין', en: 'Building' } },
  { level: 3, min: 1.3,  height: 5.6, label: { he: 'מגדל', en: 'Tower' } },
  { level: 4, min: 1.75, height: 6.8, label: { he: 'מטה', en: 'Headquarters' } },
  { level: 5, min: 2.5,  height: 8.2, label: { he: 'ציון דרך', en: 'Landmark' } },
];

export function hqLevelFor(totalUsd, baseUsd = 100000) {
  const v = Number.isFinite(totalUsd) && baseUsd > 0 ? totalUsd / baseUsd : 0;
  let best = HQ_LEVELS[0];
  for (const l of HQ_LEVELS) if (v >= l.min) best = l;
  return best;
}


