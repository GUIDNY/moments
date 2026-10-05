import { BOARD, sectorFor } from './catalog.js';
import { searchSymbols } from './market.js';

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
    let cells = line.split(/\t|;|\s\|\s|,(?=\s)|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    // a line typed by hand has single spaces: "בנק הפועלים 120 7746". Split on
    // them, and glue the words back into one name so the numbers stand alone.
    if (cells.length < 2) {
      cells = [];
      for (const tok of line.split(/\s+/)) {
        const isNum = tok !== '' && Number.isFinite(Number(clip(tok).replace(/[\u200e\u200f]/g, '')));
        // a ticker stands alone: "אפל AAPL 5" is a name, a symbol and a number
        const isTicker = /^\^?[A-Z][A-Z0-9.-]{0,11}$/.test(tok);
        const prev = cells[cells.length - 1];
        if (!isNum && !isTicker && prev && !prev.isNum && !prev.isTicker) prev.c += ` ${tok}`;
        else cells.push({ c: tok, isNum, isTicker });
      }
      cells = cells.map((x) => x.c);
    }
    if (cells.length < 2) continue;
    const nums = [];
    const texts = [];
    cells.forEach((c, at) => {
      const cleaned = clip(c).replace(/^\((.*)\)$/, '-$1').replace(/[\u200e\u200f]/g, '');
      const n = Number(cleaned);
      if (cleaned !== '' && Number.isFinite(n)) nums.push({ n, raw: c, at });
      else texts.push({ c: c.replace(/[\u200e\u200f]/g, '').trim(), at });
    });
    if (!texts.length || !nums.length) continue;
    // a screenshot read right-to-left puts the name last and the columns
    // in reverse — value, last, cost, quantity. Then the numbers are reversed.
    const nameAt = Math.max(...texts.map((x) => x.at));
    if (nums.every((x) => x.at < nameAt)) nums.reverse();
    const usable = nums.filter((x) => !(Number.isInteger(x.n) && Math.abs(x.n) >= 10000 && !/[.]/.test(x.raw)));
    if (!usable.length || !(usable[0].n > 0)) continue;
    const words = texts.map((x) => x.c).filter(Boolean);
    const symbolHint = words.find((c) => /^\^?[A-Z][A-Z0-9.-]{0,11}$/.test(c)) || null;
    const name = [...words].filter((c) => c !== symbolHint).sort((a, b) => b.length - a.length)[0] || symbolHint;
    if (!name) continue;
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
