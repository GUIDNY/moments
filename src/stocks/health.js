import { SECTOR_BY_ID } from './catalog';

/**
 * How spread out the portfolio is, as one number a beginner can read and
 * a sentence that says why. Three parts, each a table, none of them a
 * recommendation:
 *
 *   securities  — up to 40 points at ten or more
 *   sectors     — up to 30 points at five or more
 *   largest     — 30 points when the biggest holding is 10% or less of
 *                 what is invested, falling to 0 at 60%
 *
 * Cash is left out of the weights — a half-cash portfolio of one stock is
 * still one stock — and mentioned in the sentence when it is a third or
 * more of the whole.
 */
export function healthOf({ holdings = [], positions = [], cash = 0 }) {
  const priced = holdings
    .map((h) => ({ h, p: positions.find((x) => x.symbol === h.symbol) }))
    .filter(({ p }) => p && !p.missing && p.valueUsd > 0);
  const invested = priced.reduce((s, { p }) => s + p.valueUsd, 0);
  if (!priced.length || invested <= 0) return null;

  const bySector = {};
  for (const { h, p } of priced) bySector[h.sector] = (bySector[h.sector] || 0) + p.valueUsd;
  const sectors = Object.keys(bySector).length;
  const [topSector, topSectorUsd] = Object.entries(bySector).sort((a, b) => b[1] - a[1])[0];
  const biggest = priced.reduce((m, { h, p }) => (p.valueUsd > m.usd ? { symbol: h.symbol, name: h.name, usd: p.valueUsd } : m), { usd: 0 });
  const biggestPct = biggest.usd / invested;
  const topSectorPct = topSectorUsd / invested;
  const cashPct = cash / (invested + cash);

  const holdingsScore = Math.min(40, Math.round((Math.min(10, priced.length) / 10) * 40));
  const sectorScore = Math.min(30, Math.round((Math.min(5, sectors) / 5) * 30));
  const concentration = Math.round(30 * Math.max(0, Math.min(1, (0.6 - biggestPct) / 0.5)));
  const score = holdingsScore + sectorScore + concentration;

  let note;
  if (priced.length === 1) note = { key: 'health.single' };
  else if (topSectorPct >= 0.5 && sectors > 1) note = { key: 'health.concentrated', sector: SECTOR_BY_ID[topSector]?.name, pct: Math.round(topSectorPct * 100) };
  else if (cashPct >= 0.34) note = { key: 'health.cashHeavy', pct: Math.round(cashPct * 100) };
  else note = { key: 'health.spread', n: sectors, pct: Math.round(biggestPct * 100) };

  return {
    score,
    parts: { holdings: holdingsScore, sectors: sectorScore, concentration },
    count: priced.length,
    sectors,
    biggest: { ...biggest, pct: biggestPct },
    topSector: { id: topSector, name: SECTOR_BY_ID[topSector]?.name, pct: topSectorPct },
    cashPct,
    note,
  };
}
