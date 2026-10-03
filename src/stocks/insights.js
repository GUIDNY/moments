import { SECTOR_BY_ID } from './catalog';

/**
 * What the city has to say about the portfolio — concepts, never advice.
 * Each rule reads the finished numbers and returns one short card, or
 * nothing. The card points at a lesson; it never says buy or sell.
 */
export function insightsFor({ positions, summary, cash, holdings }) {
  const out = [];
  const invested = summary?.valueUsd ?? 0;
  const total = invested + (cash ?? 0);
  if (!holdings?.length) return out;

  // one sector most of the city
  const bySector = {};
  for (const h of holdings) {
    const p = positions.find((x) => x.symbol === h.symbol);
    if (p && !p.missing && p.valueUsd) bySector[h.sector] = (bySector[h.sector] || 0) + p.valueUsd;
  }
  const top = Object.entries(bySector).sort((a, b) => b[1] - a[1])[0];
  if (top && invested > 0 && holdings.length > 1 && top[1] / invested >= 0.6) {
    out.push({ id: `sector-${top[0]}`, kind: 'sector', sector: SECTOR_BY_ID[top[0]], pct: Math.round((top[1] / invested) * 100), lesson: 'concentration' });
  }
  // one company only
  if (holdings.length === 1) out.push({ id: 'single', kind: 'single', lesson: 'concentration' });
  // idle cash
  if (total > 0 && cash / total >= 0.3 && holdings.length >= 1) out.push({ id: 'cash', kind: 'cash', pct: Math.round((cash / total) * 100), lesson: null });
  return out;
}
