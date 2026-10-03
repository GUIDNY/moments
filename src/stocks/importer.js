import { BOARD, sectorFor } from './catalog';
import { searchSymbols } from './market';

/**
 * A real portfolio, pasted in from a broker's holdings table — Meitav Trade
 * or any other. Brokers have no API a browser can call, but every one of
 * them shows a table, and a table can be selected, copied and pasted.
 *
 * Reading it is forgiving on purpose: a line is a holding if it has a name
 * and a number. Columns are not assumed; the first usable number is the
 * quantity, the second the cost price, and six-plus-digit integers are
 * Tel Aviv security numbers (or the value column), never a quantity.
 */
const clip = (c) => c.replace(/[₪$€£,%\s]/g, '');

export function parseHoldingsText(text) {
  const rows = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = line.split(/\t|;|\s\|\s|,(?=\s)|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const nums = [];
    const texts = [];
    for (const c of cells) {
      const cleaned = clip(c).replace(/^\((.*)\)$/, '-$1');
      const n = Number(cleaned);
      if (cleaned !== '' && Number.isFinite(n)) nums.push({ n, raw: c });
      else texts.push(c);
    }
    if (!texts.length || !nums.length) continue;
    const usable = nums.filter((x) => !(Number.isInteger(x.n) && Math.abs(x.n) >= 10000 && !/[.]/.test(x.raw)));
    if (!usable.length || !(usable[0].n > 0)) continue;
    const symbolHint = texts.find((c) => /^\^?[A-Z][A-Z0-9.-]{0,11}$/.test(c)) || null;
    const name = [...texts].filter((c) => c !== symbolHint).sort((a, b) => b.length - a.length)[0] || symbolHint;
    rows.push({ name, symbolHint, qty: usable[0].n, cost: usable[1]?.n > 0 ? usable[1].n : null });
  }
  return rows;
}

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/בע["״']?מ|ltd\.?|inc\.?|corp\.?|plc/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();

/** The catalogue entry whose name is this one, or contains it, or is contained by it. */
function fromCatalog(name) {
  const n = norm(name);
  if (n.length < 3) return null;
  let best = null;
  for (const b of BOARD) {
    for (const v of [b.name.he, b.name.en, b.symbol.replace(/\.(TA|L)$/, '')]) {
      const m = norm(v);
      if (!m) continue;
      if (m === n) return b;
      if ((m.includes(n) || n.includes(m)) && m.length >= 3 && (!best || m.length > norm(best.name.he).length)) best = b;
    }
  }
  return best;
}

/** Rows with a symbol each: the catalogue first, then a typed symbol, then
    search. `status` says how sure the city is. */
export async function resolveRows(rows) {
  return Promise.all(
    rows.map(async (r) => {
      const hit = fromCatalog(r.name) || (r.symbolHint && fromCatalog(r.symbolHint));
      if (hit) return { ...r, symbol: hit.symbol, sector: hit.sector, name: hit.name, status: 'ok' };
      if (r.symbolHint) return { ...r, symbol: r.symbolHint.toUpperCase(), sector: sectorFor(r.symbolHint), name: { he: r.name, en: r.name }, status: 'guess' };
      const found = (await searchSymbols(r.name))[0];
      if (found) return { ...r, symbol: found.symbol, sector: sectorFor(found.symbol, found), name: { he: r.name, en: found.name || r.name }, status: 'guess' };
      return { ...r, symbol: '', sector: 'other', name: { he: r.name, en: r.name }, status: 'missing' };
    })
  );
}

/** The holdings to store: cost in the stock's own major units, so a Tel
    Aviv price pasted in agorot is divided by a hundred when asked. */
export function toHoldings(rows, { agorot = true } = {}) {
  return rows
    .filter((r) => r.symbol && r.qty > 0)
    .map((r) => ({
      symbol: r.symbol.toUpperCase(),
      qty: r.qty,
      cost: r.cost != null ? (agorot && /\.TA$/i.test(r.symbol) ? r.cost / 100 : r.cost) : null,
      sector: r.sector,
      name: r.name,
    }));
}
