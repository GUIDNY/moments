/**
 * The portfolio itself: a list of holdings, kept in this browser.
 *
 * No accounts and no server. A portfolio is about as private as data gets, and
 * the honest way to hold something private in a static app is not to hold it —
 * it lives in localStorage, and the only copy that ever leaves is the one the
 * owner deliberately puts in a share link.
 */

const KEY = 'stockcity.portfolio';

export const DEFAULT_DISPLAY = 'ILS';

const clean = (h) => ({
  symbol: String(h.symbol || '').toUpperCase().slice(0, 16),
  qty: Math.max(0, Number(h.qty) || 0),
  cost: Number.isFinite(Number(h.cost)) && Number(h.cost) > 0 ? Number(h.cost) : null,
  sector: h.sector || 'tech',
  name: h.name || null,
});

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      holdings: Array.isArray(raw.holdings) ? raw.holdings.map(clean).filter((h) => h.symbol) : [],
      display: raw.display || DEFAULT_DISPLAY,
    };
  } catch {
    return { holdings: [], display: DEFAULT_DISPLAY };
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

export function updateHolding(holdings, symbol, patch) {
  return holdings.map((h) => (h.symbol === symbol ? clean({ ...h, ...patch }) : h));
}

/* ── sharing ──────────────────────────────────────────────────────────────── */

/** Only what is needed to rebuild the city, in the shortest form. */
const pack = (state) => ({
  d: state.display,
  h: state.holdings.map((h) => [h.symbol, h.qty, h.cost ?? 0, h.sector]),
});

const unpack = (raw) => ({
  display: raw.d || DEFAULT_DISPLAY,
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
