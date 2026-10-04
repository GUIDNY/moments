import { fxSymbol, toMajor } from './money.js';

/**
 * Live prices, published outside React.
 *
 * The towers change height every frame as prices ease towards their new value,
 * and a React state update per tick would re-render the whole city sixty times
 * a second. So the latest numbers live in a plain object that `useFrame` reads
 * directly — the same trick `playerPos.js` uses for the player, for the same
 * reason. Components that need to *re-render* on an update subscribe instead.
 */

export const market = {
  /** symbol -> quote */
  bySymbol: {},
  /** fx symbol -> rate, in the shape `rateBetween` wants */
  rates: {},
  at: 0,
  loading: false,
  error: null,
  delayed: true,
};

const listeners = new Set();
export function onMarket(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const announce = () => listeners.forEach((fn) => fn(market));

/**
 * Currencies we may need a rate for, once the quotes say what they are: into
 * the display currency for the screen, and always into dollars, because the
 * game's purse is in dollars and a shekel stock cannot be bought without
 * knowing what a shekel costs.
 */
function neededRates(quotes, display) {
  const wanted = new Set();
  for (const q of Object.values(quotes)) {
    if (!q || q.error) continue;
    const { currency } = toMajor(q.price, q.currency);
    if (!currency) continue;
    if (currency !== display) wanted.add(fxSymbol(currency, display));
    if (currency !== 'USD') wanted.add(fxSymbol(currency, 'USD'));
  }
  if (display !== 'USD') wanted.add(fxSymbol('USD', display));
  return [...wanted];
}

/**
 * One symbol's quote, fetched on demand — for a stock you are about to buy
 * and do not yet hold, which the portfolio poll knows nothing about. It lands
 * in the same table as everything else and is announced the same way.
 */
const pending = new Map();
export function ensureQuote(symbol, display = 'USD') {
  if (!symbol) return Promise.resolve(null);
  const have = market.bySymbol[symbol];
  if (have && !have.error) return Promise.resolve(have);
  if (pending.has(symbol)) return pending.get(symbol);
  const p = (async () => {
    try {
      const quotes = await fetchQuotes([symbol]);
      market.bySymbol = { ...market.bySymbol, ...quotes };
      const rateSymbols = neededRates(quotes, display).filter((r) => !Number.isFinite(market.rates[r]));
      if (rateSymbols.length) {
        const fx = await fetchQuotes(rateSymbols);
        for (const [sym, q] of Object.entries(fx)) {
          if (!q.error && Number.isFinite(q.price)) market.rates[sym] = q.price;
        }
      }
      announce();
      return market.bySymbol[symbol] ?? null;
    } catch {
      return null;
    } finally {
      pending.delete(symbol);
    }
  })();
  pending.set(symbol, p);
  return p;
}

async function fetchQuotes(symbols) {
  if (!symbols.length) return {};
  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
  if (!res.ok) throw new Error(`http-${res.status}`);
  const body = await res.json();
  market.delayed = body.delayed !== false;
  const out = {};
  for (const q of body.quotes || []) out[q.symbol] = q;
  return out;
}

/**
 * Refresh every symbol, then whatever exchange rates those turned out to need.
 *
 * Two round trips rather than one, because which rates matter is not knowable
 * until the quotes come back and say what currency each stock trades in.
 */
export async function refresh(symbols, display) {
  if (!symbols.length) {
    market.bySymbol = {};
    market.at = Date.now();
    announce();
    return;
  }
  market.loading = true;
  announce();
  try {
    const quotes = await fetchQuotes(symbols);
    // keep the last good price for anything that failed this time round, so a
    // blip empties a tower rather than the whole skyline
    market.bySymbol = { ...market.bySymbol, ...quotes };

    const rateSymbols = neededRates(market.bySymbol, display);
    if (rateSymbols.length) {
      const fx = await fetchQuotes(rateSymbols);
      for (const [sym, q] of Object.entries(fx)) {
        if (!q.error && Number.isFinite(q.price)) market.rates[sym] = q.price;
      }
    }
    market.at = Date.now();
    market.error = null;
  } catch (err) {
    market.error = err.message || 'failed';
  } finally {
    market.loading = false;
    announce();
  }
}

/** How often to ask again. Quiet markets do not need a poll every few seconds. */
export const REFRESH_MS = 60000;

export async function searchSymbols(query) {
  const q = query.trim();
  if (q.length < 1) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()).results || [];
  } catch {
    return [];
  }
}
