/**
 * How big a building a position gets, and how big a headquarters a portfolio
 * gets. Both are tables, not formulas: a designer changes a number here and
 * the whole city re-tiers, and a position that grows past a boundary visibly
 * steps up a class rather than creeping. Values are dollars.
 */

export const BUILDING_TIERS = [
  { tier: 1, min: 0,     height: 1.5, footprint: 2.0, label: { he: 'חנות', en: 'Shop' } },
  { tier: 2, min: 1000,  height: 2.6, footprint: 2.3, label: { he: 'בניין', en: 'Building' } },
  { tier: 3, min: 5000,  height: 3.8, footprint: 2.5, label: { he: 'בניין משרדים', en: 'Office block' } },
  { tier: 4, min: 20000, height: 5.2, footprint: 2.6, label: { he: 'מגדל', en: 'Tower' } },
  { tier: 5, min: 50000, height: 6.8, footprint: 2.7, label: { he: 'גורד שחקים', en: 'Skyscraper' } },
];

export function tierFor(valueUsd) {
  const v = Number.isFinite(valueUsd) ? valueUsd : 0;
  let best = BUILDING_TIERS[0];
  for (const t of BUILDING_TIERS) if (v >= t.min) best = t;
  return best;
}

/** The headquarters grows with the whole portfolio. Level 1 is the starting purse. */
export const HQ_LEVELS = [
  { level: 1, min: 0,       height: 3.6, label: { he: 'משרד', en: 'Office' } },
  { level: 2, min: 110000,  height: 4.6, label: { he: 'בניין', en: 'Building' } },
  { level: 3, min: 130000,  height: 5.6, label: { he: 'מגדל', en: 'Tower' } },
  { level: 4, min: 175000,  height: 6.8, label: { he: 'מטה', en: 'Headquarters' } },
  { level: 5, min: 250000,  height: 8.2, label: { he: 'ציון דרך', en: 'Landmark' } },
];

export function hqLevelFor(totalUsd) {
  const v = Number.isFinite(totalUsd) ? totalUsd : 0;
  let best = HQ_LEVELS[0];
  for (const l of HQ_LEVELS) if (v >= l.min) best = l;
  return best;
}

/** A city's level, for the profile chip: towers and value, one number. */
export function cityLevel(totalUsd, holdingsCount) {
  return Math.max(1, hqLevelFor(totalUsd).level + Math.floor((holdingsCount || 0) / 3));
}
