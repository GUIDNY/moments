/**
 * A district, as numbers: what one sector's buildings add up to. Read from
 * the finished positions and the quotes, never from the plan, so it is the
 * same arithmetic the HUD and the portfolio use — only narrowed to one
 * neighbourhood.
 *
 * The three-month line is the district's dollar value day by day: each
 * position's closes × quantity × its dollar rate, summed. A position whose
 * quote has no series is held flat at today's value, so a line is never
 * missing a building that stands in the district.
 */
import { rateBetween, toMajor } from './money';

const round2 = (n) => Math.round(n * 100) / 100;

export function districtStats({ sector, holdings, positions, quoteOf, totalUsd, rates }) {
  const mine = holdings.filter((h) => h.sector === sector);
  const priced = mine
    .map((h) => ({ holding: h, position: positions.find((p) => p.symbol === h.symbol) }))
    .filter(({ position }) => position && !position.missing && position.valueUsd != null);
  const valueUsd = priced.reduce((a, { position }) => a + position.valueUsd, 0);
  const dayUsd = priced.reduce((a, { position }) => a + (position.convertedDay != null && position.value ? (position.dayChange / position.value) * position.valueUsd : 0), 0);
  const gainUsd = priced.reduce((a, { position }) => a + (position.gainUsd ?? 0), 0);
  const costed = priced.filter(({ position }) => position.gainUsd != null);
  const investedUsd = costed.reduce((a, { position }) => a + position.valueUsd - position.gainUsd, 0);
  const rows = priced
    .map(({ holding, position }) => ({
      symbol: holding.symbol,
      name: holding.name,
      position,
      weight: valueUsd > 0 ? position.valueUsd / valueUsd : 0,
      dayUsd: position.value ? (position.dayChange / position.value) * position.valueUsd : 0,
    }))
    .sort((a, b) => b.position.valueUsd - a.position.valueUsd);
  const mover = rows.length ? rows.reduce((m, r) => (Math.abs(r.dayUsd) > Math.abs(m.dayUsd) ? r : m), rows[0]) : null;

  // three months, day by day, in dollars
  let series = null;
  const lines = priced.map(({ holding, position }) => {
    const q = quoteOf(holding.symbol);
    const toUsd = q ? rateBetween(toMajor(q.price, q.currency).currency, 'USD', rates) : null;
    if (!q?.closes || q.closes.length < 2 || toUsd == null) return { flat: position.valueUsd };
    return { closes: q.closes.map((c) => toMajor(c, q.currency).price * position.qty * toUsd) };
  });
  const withSeries = lines.filter((l) => l.closes);
  if (withSeries.length) {
    const n = Math.min(...withSeries.map((l) => l.closes.length));
    series = Array.from({ length: n }, (_, i) => lines.reduce((a, l) => a + (l.closes ? l.closes[l.closes.length - n + i] : l.flat), 0));
  }
  const periodPct = series && series[0] > 0 ? ((series[series.length - 1] - series[0]) / series[0]) * 100 : null;

  return {
    sector,
    count: mine.length,
    unpriced: mine.length - priced.length,
    valueUsd: round2(valueUsd),
    share: totalUsd > 0 ? valueUsd / totalUsd : 0,
    dayUsd: round2(dayUsd),
    dayPct: valueUsd - dayUsd > 0 ? (dayUsd / (valueUsd - dayUsd)) * 100 : null,
    gainUsd: costed.length ? round2(gainUsd) : null,
    gainPct: investedUsd > 0 ? (gainUsd / investedUsd) * 100 : null,
    series,
    periodPct,
    rows,
    mover,
    top: rows[0] ?? null,
  };
}
