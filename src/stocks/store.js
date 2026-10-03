/**
 * The portfolio itself: a list of holdings, kept in this browser.
 *
 * No accounts and no server. A portfolio is about as private as data gets, and
 * the honest way to hold something private in a static app is not to hold it —
 * it lives in localStorage, and the only copy that ever leaves is the one the
 * owner deliberately puts in a share link.
 */

const KEY = 'stockcity.portfolio';

export const DEFAULT_DISPLAY = 'USD';

/* ── the game ─────────────────────────────────────────────────────────────
   Everyone starts with the same hundred thousand dollars of play money and
   buys real stocks at real (delayed) prices. The cash is kept in dollars
   whatever the display currency, because a game needs one scoreboard: the
   question "am I up or down" has to have one answer. */
export const BASE = 'USD';
export const STARTING_CASH = 100000;
/* A tenth of a percent a trade, a dollar at least: small enough never to
   matter to the score, present enough to teach that trading is not free. */
export const FEE_RATE = 0.001;
export const FEE_MIN = 1;
export const feeFor = (valueUsd) => Math.max(FEE_MIN, Math.round(valueUsd * FEE_RATE * 100) / 100);

const clean = (h) => ({
  symbol: String(h.symbol || '').toUpperCase().slice(0, 16),
  qty: Math.max(0, Number(h.qty) || 0),
  cost: Number.isFinite(Number(h.cost)) && Number(h.cost) > 0 ? Number(h.cost) : null,
  sector: h.sector || 'tech',
  name: h.name || null,
});

export const fresh = () => ({
  holdings: [],
  display: DEFAULT_DISPLAY,
  cash: STARTING_CASH,
  trades: [],
  history: [],
  started: Date.now(),
});

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const state = {
      ...fresh(),
      holdings: Array.isArray(raw.holdings) ? raw.holdings.map(clean).filter((h) => h.symbol) : [],
      display: raw.display || DEFAULT_DISPLAY,
      // a portfolio saved before the game existed starts with the full purse:
      // its holdings were typed in, not bought, and owe the bank nothing
      cash: Number.isFinite(raw.cash) ? raw.cash : STARTING_CASH,
      trades: Array.isArray(raw.trades) ? raw.trades : [],
      history: Array.isArray(raw.history) ? raw.history : [],
      started: Number.isFinite(raw.started) ? raw.started : Date.now(),
    };
    return state;
  } catch {
    return fresh();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode — the city is still walkable, it just forgets */
  }
}

export const MAX_HOLDINGS = 24;

export function addHolding(holdings, entry) {
  const next = clean(entry);
  if (!next.symbol) return holdings;
  const at = holdings.findIndex((h) => h.symbol === next.symbol);
  // adding something already held tops it up rather than making a second tower
  if (at >= 0) {
    const merged = [...holdings];
    const prev = merged[at];
    const qty = prev.qty + next.qty;
    merged[at] = {
      ...prev,
      qty,
      // a weighted average is the only cost basis that survives a second buy
      cost:
        prev.cost != null && next.cost != null && qty > 0
          ? (prev.cost * prev.qty + next.cost * next.qty) / qty
          : next.cost ?? prev.cost,
    };
    return merged;
  }
  if (holdings.length >= MAX_HOLDINGS) return holdings;
  return [...holdings, next];
}

export const removeHolding = (holdings, symbol) => holdings.filter((h) => h.symbol !== symbol);

/** A whole portfolio at once, from an import: each row a holding, same symbol
    merged, the cost in the stock's own major units as everywhere else. */
export function importHoldings(rows) {
  let holdings = [];
  for (const r of rows) holdings = addHolding(holdings, r);
  return holdings;
}

/* ── trading ──────────────────────────────────────────────────────────────
   A trade is priced by the caller — the live price in the stock's own
   currency and its dollar rate — and settled here. These are pure: state
   in, state out, or an `error` code the UI can put into words. */

/**
 * Buy `qty` shares at `price` (in the stock's currency, major units) with
 * `rate` dollars per unit of that currency. The holding's cost basis is a
 * weighted average in the stock's own currency, as `addHolding` keeps it.
 */
export function buy(state, { symbol, qty, price, currency, rate, sector, name }) {
  if (!(qty > 0) || !(price > 0) || !(rate > 0)) return { ...state, error: 'bad-order' };
  const valueUsd = qty * price * rate;
  const fee = feeFor(valueUsd);
  const total = valueUsd + fee;
  if (total > state.cash + 1e-9) return { ...state, error: 'no-cash' };
  const holdings = addHolding(state.holdings, { symbol, qty, cost: price, sector, name });
  if (holdings === state.holdings) return { ...state, error: 'no-room' };
  const trade = { t: Date.now(), side: 'buy', symbol, qty, price, currency, rate, valueUsd, fee };
  return { ...state, holdings, cash: state.cash - total, trades: [...state.trades, trade], error: null };
}

/**
 * Sell `qty` shares. The proceeds go to cash less the fee, and the trade
 * records the gain or loss *realised* against the average cost — the number
 * a beginner most needs to see written down, because until the sale the
 * gain was only ever a figure on a screen.
 */
export function sell(state, { symbol, qty, price, currency, rate }) {
  const held = state.holdings.find((h) => h.symbol === symbol);
  if (!held) return { ...state, error: 'not-held' };
  if (!(qty > 0) || qty > held.qty + 1e-9) return { ...state, error: 'too-many' };
  if (!(price > 0) || !(rate > 0)) return { ...state, error: 'bad-order' };
  const valueUsd = qty * price * rate;
  const fee = feeFor(valueUsd);
  const realised = held.cost != null ? (price - held.cost) * qty * rate : null;
  const left = held.qty - qty;
  const holdings = left > 1e-9 ? updateHolding(state.holdings, symbol, { qty: left }) : removeHolding(state.holdings, symbol);
  const trade = { t: Date.now(), side: 'sell', symbol, qty, price, currency, rate, valueUsd, fee, realised };
  return { ...state, holdings, cash: state.cash + valueUsd - fee, trades: [...state.trades, trade], error: null };
}

/**
 * One point of the portfolio's history per local day: the whole thing in
 * dollars, and how much of it was cash. The first point is the day the game
 * began at the starting purse, so the line always has somewhere to start.
 */
export function snapshot(state, totalUsd, day) {
  if (!Number.isFinite(totalUsd)) return state;
  const history = state.history.length ? state.history : [{ day: 'start', total: STARTING_CASH, cash: STARTING_CASH }];
  const last = history[history.length - 1];
  const point = { day, total: Math.round(totalUsd * 100) / 100, cash: Math.round(state.cash * 100) / 100 };
  const next = last.day === day ? [...history.slice(0, -1), point] : [...history, point];
  if (last.day === day && last.total === point.total && last.cash === point.cash) return state;
  return { ...state, history: next.slice(-400) };
}

/** Start again: the same purse, an empty city. The lessons learned stay learned. */
export const reset = () => fresh();

export function updateHolding(holdings, symbol, patch) {
  return holdings.map((h) => (h.symbol === symbol ? clean({ ...h, ...patch }) : h));
}

/* ── sharing ──────────────────────────────────────────────────────────────── */

/** Only what is needed to rebuild the city, in the shortest form. */
const pack = (state) => ({
  d: state.display,
  c: Math.round(state.cash * 100) / 100,
  s: state.started,
  h: state.holdings.map((h) => [h.symbol, h.qty, h.cost ?? 0, h.sector]),
});

const unpack = (raw) => ({
  ...fresh(),
  display: raw.d || DEFAULT_DISPLAY,
  cash: Number.isFinite(raw.c) ? raw.c : STARTING_CASH,
  started: Number.isFinite(raw.s) ? raw.s : Date.now(),
  holdings: (raw.h || []).map(([symbol, qty, cost, sector]) =>
    clean({ symbol, qty, cost: cost || null, sector })
  ),
});

export function encodeState(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(pack(state)));
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeState(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return unpack(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function stateFromLocation() {
  try {
    const p = new URLSearchParams(window.location.search).get('p');
    return p ? decodeState(p) : null;
  } catch {
    return null;
  }
}

export function shareUrl(state) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?p=${encodeState(state)}`;
}
