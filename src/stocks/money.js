/**
 * The arithmetic of a portfolio, and the two places it goes wrong.
 *
 * **Minor units.** Tel Aviv quotes in agorot and London in pence — a hundredth
 * of a shekel and of a pound. The currency code says so (`ILA`, `GBp`) and
 * nothing else does, so a reader who takes the number at face value reports a
 * holding as a hundred times its worth. This is the single most dangerous line
 * in the whole app, because the result looks plausible: a ₪7,726 bank share
 * instead of ₪77.26.
 *
 * **Mixed currencies.** Holding Apple and Bank Hapoalim means a total that is
 * meaningless without a rate. Everything is converted into one display currency
 * and the rates are fetched like any other quote.
 */

/** Currencies quoted in a minor unit, with what they are really worth. */
const MINOR = {
  ILA: { major: 'ILS', per: 100 },
  ILS_AGOROT: { major: 'ILS', per: 100 },
  GBp: { major: 'GBP', per: 100 },
  ZAc: { major: 'ZAR', per: 100 },
};

/** A price and its currency, both in the major unit. */
export function toMajor(price, currency) {
  const minor = MINOR[currency];
  if (!minor || !Number.isFinite(price)) return { price, currency: currency || 'USD' };
  return { price: price / minor.per, currency: minor.major };
}

/** The symbol that quotes one currency in another. */
export const fxSymbol = (from, to) => `${from}${to}=X`;

/**
 * How much one unit of `from` is worth in `to`.
 * `rates` is keyed by fx symbol, as it comes back from the quote endpoint.
 */
export function rateBetween(from, to, rates) {
  if (from === to) return 1;
  const direct = rates[fxSymbol(from, to)];
  if (Number.isFinite(direct)) return direct;
  const inverse = rates[fxSymbol(to, from)];
  if (Number.isFinite(inverse) && inverse !== 0) return 1 / inverse;
  // via the dollar, which every pair we are likely to want goes through
  if (from !== 'USD' && to !== 'USD') {
    const fromUsd = rateBetween(from, 'USD', rates);
    const usdTo = rateBetween('USD', to, rates);
    if (fromUsd != null && usdTo != null) return fromUsd * usdTo;
  }
  return null;
}

/**
 * One holding, priced.
 *
 * `cost` is what was paid per share in the stock's own currency, in major
 * units — the trade price `store.js` settled, ₪77.46 and never 7746 — so it is
 * NOT put through `toMajor`. The live price is, because the quote arrives in
 * agorot. Converting the cost as well is how a position bought a minute ago
 * showed a 9,900% gain and earned the "doubled" badge.
 */
export function priceHolding(holding, quote, display, rates) {
  if (!quote || quote.error || !Number.isFinite(quote.price)) {
    return { symbol: holding.symbol, missing: true };
  }

  const now = toMajor(quote.price, quote.currency);
  const prev = toMajor(quote.prevClose ?? quote.price, quote.currency);
  const cost = Number.isFinite(holding.cost) ? holding.cost : null;

  const qty = Number(holding.qty) || 0;
  const rate = rateBetween(now.currency, display, rates);
  const toUsd = rateBetween(now.currency, 'USD', rates);

  const value = qty * now.price;
  const dayChange = qty * (now.price - prev.price);
  const gain = cost == null ? null : qty * (now.price - cost);
  const gainPct = cost == null || cost === 0 ? null : ((now.price - cost) / cost) * 100;
  const dayPct = prev.price === 0 ? 0 : ((now.price - prev.price) / prev.price) * 100;

  return {
    symbol: quote.symbol || holding.symbol,
    name: quote.name || holding.symbol,
    qty,
    price: now.price,
    prevClose: prev.price,
    cost,
    currency: now.currency,
    exchange: quote.exchange || '',
    value,
    dayChange,
    dayPct,
    gain,
    gainPct,
    // null when no rate is available; the UI leaves such a holding out of the
    // total rather than quietly adding shekels to dollars
    converted: rate == null ? null : value * rate,
    convertedDay: rate == null ? null : dayChange * rate,
    convertedGain: rate == null || gain == null ? null : gain * rate,
    rate,
    // and in dollars, whatever the display currency: the city's tiers and
    // the game's score are both in dollars
    valueUsd: toUsd == null ? null : value * toUsd,
    gainUsd: toUsd == null || gain == null ? null : gain * toUsd,
  };
}

/**
 * The whole portfolio, in the display currency — and in dollars, because the
 * game's purse is in dollars and the score has to add cash to holdings in
 * one unit. `rates` is optional; without it `valueUsd` is only right when
 * every holding already trades in dollars.
 */
export function summarise(positions, display, rates = {}) {
  let value = 0;
  let valueUsd = 0;
  let day = 0;
  let gain = 0;
  let cost = 0;
  let unconverted = 0;

  for (const p of positions) {
    if (p.missing) continue;
    if (p.converted == null) {
      unconverted++;
      continue;
    }
    value += p.converted;
    day += p.convertedDay ?? 0;
    if (p.convertedGain != null) {
      gain += p.convertedGain;
      cost += p.converted - p.convertedGain;
    }
    const toUsd = rateBetween(p.currency, 'USD', rates);
    if (toUsd != null) valueUsd += p.value * toUsd;
  }

  return {
    display,
    value,
    valueUsd,
    day,
    dayPct: value - day === 0 ? 0 : (day / (value - day)) * 100,
    gain,
    gainPct: cost === 0 ? null : (gain / cost) * 100,
    unconverted,
    counted: positions.filter((p) => !p.missing && p.converted != null).length,
  };
}

/**
 * What a trade of `qty` shares of this quote would cost or fetch, in dollars.
 * Null when the stock's currency has no dollar rate yet — a trade whose price
 * is a guess is not a trade this game will settle.
 */
export function tradeQuote(quote, qty, rates) {
  if (!quote || quote.error || !Number.isFinite(quote.price)) return null;
  const { price, currency } = toMajor(quote.price, quote.currency);
  const rate = rateBetween(currency, 'USD', rates);
  if (rate == null || !(price > 0)) return null;
  const n = Number(qty) || 0;
  const valueUsd = n * price * rate;
  return { price, currency, rate, qty: n, valueUsd, priceUsd: price * rate };
}

/** Readable money, in the currency's own habits. */
export function formatMoney(amount, currency, compact = false) {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: compact || Math.abs(amount) >= 1000 ? 0 : 2,
      notation: compact && Math.abs(amount) >= 1e6 ? 'compact' : 'standard',
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}

export const formatPct = (n) =>
  Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '—';
