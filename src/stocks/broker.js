import { BOARD, BOARD_BY_SYMBOL, sectorFor } from './catalog.js';
import { searchSymbols } from './market.js';
import { parseHoldingsText } from './importer.js';

/**
 * A broker's export, read into the one shape the city understands.
 *
 *   raw file → parser (a table by its *header names*) → normaliser
 *   (PortfolioPosition) → validation (warnings, never guesses) → holdings
 *
 * Meitav Trade's "ייצוא לאקסל" is the first file this was written for, and
 * nothing here depends on where a column sits: every column is found by
 * its name, in Hebrew or English, with a list of the names each broker
 * uses. A file with no recognisable header falls back to the forgiving
 * line reader in `importer.js`, which is what the pasted and photographed
 * tables already go through.
 *
 * Positions are matched by symbol, never by name: GOOG and GOOGL are two
 * securities, and so are two companies with one word in common.
 */

/* ── column names ────────────────────────────────────────────────────────── */

const clean = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/["'״׳]/g, '')
    .replace(/[‎‏‪-‮]/g, '')
    .replace(/[^\p{L}\p{N}%]+/gu, ' ')
    .trim();

/* Each field, with every header it is known by. Order matters only when a
   header matches two fields: the first listed wins. */
const COLUMNS = [
  ['securityId', ['מספר נייר', 'מס נייר', 'מספר ני ע', 'מס ני ע', 'security id', 'security number', 'security no', 'isin', 'מספר']],
  ['symbol', ['סימול', 'סמל', 'symbol', 'ticker', 'סימבול']],
  ['name', ['שם נייר', 'שם הנייר', 'שם ני ע', 'נייר ערך', 'נייר', 'שם', 'name', 'security', 'security name', 'instrument', 'description', 'תיאור']],
  ['assetType', ['סוג נייר', 'סוג ני ע', 'סוג', 'סוג נכס', 'type', 'asset type', 'asset class']],
  ['quantity', ['כמות', 'יתרה', 'יתרת כמות', 'כמות יתרה', 'quantity', 'qty', 'units', 'shares', 'amount held']],
  ['marketPrice', ['שער אחרון', 'שער נוכחי', 'שער שוק', 'מחיר שוק', 'מחיר אחרון', 'שער', 'מחיר', 'last price', 'last', 'price', 'market price', 'current price']],
  ['marketValue', ['שווי שוק', 'שווי אחזקה', 'שווי נוכחי', 'שווי', 'סה כ שווי', 'market value', 'value', 'position value', 'holding value']],
  ['averagePrice', ['שער ממוצע', 'מחיר ממוצע', 'עלות ממוצעת', 'שער עלות', 'מחיר עלות', 'שער קנייה', 'מחיר קנייה', 'avg price', 'average price', 'avg cost', 'average cost', 'cost price', 'buy price']],
  ['costBasis', ['עלות כוללת', 'סה כ עלות', 'עלות', 'שווי עלות', 'cost basis', 'total cost', 'cost']],
  ['dailyChangePercent', ['שינוי יומי %', '% שינוי יומי', 'שינוי יומי באחוזים', 'אחוז שינוי יומי', 'שינוי %', '% שינוי', 'שינוי יומי', 'day change %', 'daily change %', 'change %', 'daily %']],
  ['dailyPnL', ['שינוי יומי בשקלים', 'שינוי יומי ₪', 'רווח יומי', 'הפסד רווח יומי', 'רווח הפסד יומי', 'daily p l', 'daily pnl', 'day change', 'daily change']],
  ['totalPnLPercent', ['אחוז רווח', '% רווח', 'רווח %', 'רווח הפסד %', '% רווח הפסד', 'תשואה %', 'תשואה', 'p l %', 'pnl %', 'return %', 'gain %']],
  ['totalPnL', ['רווח הפסד', 'רווח הפסד כולל', 'רווח', 'הפסד', 'p l', 'pnl', 'profit loss', 'profit', 'gain', 'unrealized p l', 'unrealised p l']],
  ['portfolioWeight', ['אחוז מהתיק', '% מהתיק', 'אחוז מתיק', 'משקל בתיק', 'משקל', 'weight', 'allocation', 'portfolio %', '% of portfolio']],
  ['currency', ['מטבע', 'currency', 'ccy']],
  ['exchange', ['בורסה', 'שוק', 'exchange', 'market']],
];

/** The field a header names, or null. Exact first, then a header that
    *starts with* the known name (Meitav appends units: "שווי (₪)"). */
function fieldFor(header) {
  const h = clean(header);
  if (!h) return null;
  for (const [field, names] of COLUMNS) if (names.some((n) => clean(n) === h)) return field;
  for (const [field, names] of COLUMNS) if (names.some((n) => h.startsWith(clean(n) + ' ') || h.endsWith(' ' + clean(n)))) return field;
  return null;
}

/* ── the table ───────────────────────────────────────────────────────────── */

const num = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[‎‏]/g, '').trim();
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s);
  const n = Number(s.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || s.replace(/[^\d]/g, '') === '') return null;
  return neg ? -n : n;
};
const str = (v) => (v == null ? '' : String(v).replace(/[‎‏]/g, '').trim());

/**
 * Find the header row: the row with the most recognisable column names,
 * at least two of them and one of them a name or symbol. Broker files
 * start with a title, the account and the date before the table.
 */
export function detectTable(rows) {
  let best = null;
  rows.slice(0, 40).forEach((row, at) => {
    const fields = (row || []).map(fieldFor);
    const hits = fields.filter(Boolean);
    const score = new Set(hits).size;
    if (score >= 2 && (fields.includes('name') || fields.includes('symbol')) && (!best || score > best.score)) best = { at, fields, score };
  });
  return best;
}

const CASH_ROW = /מזומן|מזומנים|יתרת מזומן|יתרה בשקלים|יתרה בדולר|cash|balance/i;
const TOTAL_ROW = /^(סה[״"']?כ|סהכ|total|סיכום)/i;
const ETF_WORDS = /קרן|סל|מדד|etf|fund|index|מחקה|נאמנות/i;
const BOND_WORDS = /אג[״"']?ח|bond|מק[״"']?מ|ממשלתי/i;

/**
 * A spreadsheet's rows (arrays, one per row, every sheet) into positions
 * and cash. `source` says which broker the file looked like — only what
 * the headers say, never a guess about the account.
 */
export function parseTable(rows, { sheetName = '' } = {}) {
  const table = detectTable(rows);
  if (!table) return null;
  const { at, fields } = table;
  const col = (field) => fields.indexOf(field);
  const get = (row, field) => (col(field) >= 0 ? row[col(field)] : undefined);
  const positions = [];
  const cash = [];
  for (let i = at + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    if (!row.some((c) => str(c) !== '')) continue;
    const name = str(get(row, 'name'));
    // Meitav puts a foreign stock's ticker in the "security number" column:
    // a number is a Tel Aviv security id, letters are a symbol
    const idCell = str(get(row, 'securityId'));
    const idIsSymbol = /^[A-Za-z][A-Za-z0-9.-]{0,11}$/.test(idCell);
    const symbol = (str(get(row, 'symbol')) || (idIsSymbol ? idCell : '')).toUpperCase();
    const securityId = idCell && !idIsSymbol ? idCell : null;
    const label = name || symbol;
    if (!label) continue;
    if (TOTAL_ROW.test(label)) continue;
    const quantity = num(get(row, 'quantity'));
    const marketValue = num(get(row, 'marketValue'));
    if (CASH_ROW.test(label) && !symbol) {
      const amount = marketValue ?? quantity ?? num(get(row, 'costBasis'));
      if (amount != null) cash.push({ currency: currencyOf(str(get(row, 'currency')), label) || 'ILS', amount });
      continue;
    }
    // a header repeated or a section title: a line that names a column and
    // carries no numbers. A security whose name happens to start with a
    // column word ("נייר ...") is a security.
    if (fieldFor(label) && quantity == null && marketValue == null) continue;
    const marketPrice = num(get(row, 'marketPrice'));
    const averagePrice = num(get(row, 'averagePrice'));
    const costBasis = num(get(row, 'costBasis'));
    positions.push({
      id: `${i}`,
      securityId,
      symbol: symbol || null,
      name: label,
      assetType: assetTypeOf(str(get(row, 'assetType')), label),
      currency: currencyOf(str(get(row, 'currency')), label, str(get(row, 'exchange'))),
      exchange: str(get(row, 'exchange')) || null,
      quantity,
      marketPrice,
      marketValue,
      averagePrice: averagePrice ?? (costBasis != null && quantity ? costBasis / quantity : null),
      costBasis: costBasis ?? (averagePrice != null && quantity ? averagePrice * quantity : null),
      dailyChangePercent: num(get(row, 'dailyChangePercent')),
      dailyPnL: num(get(row, 'dailyPnL')),
      totalPnL: num(get(row, 'totalPnL')),
      totalPnLPercent: num(get(row, 'totalPnLPercent')),
      portfolioWeight: num(get(row, 'portfolioWeight')),
    });
  }
  const headerText = (rows[at] || []).map(str).join(' ');
  const meitav = /מיטב|meitav/i.test(sheetName + ' ' + rows.slice(0, at).flat().map(str).join(' ')) || (/שם נייר/.test(headerText) && /מספר נייר|שער/.test(headerText));
  return { source: meitav ? 'meitav' : 'generic', headers: fields.filter(Boolean), positions, cash, headerRow: at };
}

function currencyOf(cell, label = '', exchange = '') {
  const c = clean(cell);
  if (/^(ils|nis|שקל|ש ח|₪|שח)$/.test(c) || /₪/.test(cell)) return 'ILS';
  if (/^(usd|דולר|\$)$/.test(c) || /\$/.test(cell)) return 'USD';
  if (/^(eur|אירו|€)$/.test(c)) return 'EUR';
  if (/^(gbp|gbx|פאונד|£)$/.test(c)) return 'GBP';
  if (/^[A-Z]{3}$/.test(cell)) return cell.toUpperCase();
  if (/דולר|usd|\$/i.test(label)) return 'USD';
  if (/nasdaq|nyse|us|ארה/i.test(exchange)) return 'USD';
  if (/ת א|tase|תל אביב/i.test(clean(exchange))) return 'ILS';
  return null; // decided later, from the symbol the row resolves to
}

function assetTypeOf(cell, label) {
  const c = clean(cell) + ' ' + clean(label);
  if (BOND_WORDS.test(c)) return 'bond';
  if (ETF_WORDS.test(c)) return 'etf';
  if (/אופציה|option|warrant|כתב אופציה/i.test(c)) return 'option';
  return 'stock';
}

/* ── from a file ─────────────────────────────────────────────────────────── */

/** Every sheet of a workbook as arrays of rows. */
export async function readWorkbook(file) {
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
  return book.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, blankrows: false, defval: null }) }));
}

/**
 * A broker file (Excel or CSV) into positions. The first sheet with a
 * recognisable table wins; a file with none goes through the line reader,
 * marked `generic`, so a plain "name quantity price" list still imports.
 */
export async function parseBrokerFile(file) {
  const isSheet = /\.xlsx?$/i.test(file.name) || /spreadsheet|excel/i.test(file.type || '');
  let sheets;
  if (isSheet) sheets = await readWorkbook(file);
  else {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((l) => l.split(/\t|;|,/).map((c) => c.trim()));
    sheets = [{ name: file.name, rows }];
  }
  for (const s of sheets) {
    const got = parseTable(s.rows, { sheetName: s.name });
    if (got && got.positions.length) return { ...got, sheet: s.name, fallback: false };
  }
  // no header row anywhere: read the lines the forgiving way
  const text = sheets.map((s) => s.rows.map((r) => r.map((c) => (c == null ? '' : c)).join('\t')).join('\n')).join('\n');
  const rows = parseHoldingsText(text);
  if (!rows.length) return null;
  return {
    source: 'generic',
    fallback: true,
    headers: [],
    cash: [],
    positions: rows.map((r, i) => ({ id: `${i}`, securityId: null, symbol: r.symbolHint, name: r.name, assetType: 'stock', currency: null, quantity: r.qty, marketPrice: null, marketValue: null, averagePrice: r.cost, costBasis: null, dailyChangePercent: null, dailyPnL: null, totalPnL: null, totalPnLPercent: null, portfolioWeight: null })),
  };
}

/* ── resolving ───────────────────────────────────────────────────────────── */

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/בע["״']?מ|ltd\.?|inc\.?|corp\.?|plc|בעמ/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();

function fromCatalog(name, symbol) {
  if (symbol && BOARD_BY_SYMBOL[symbol]) return BOARD_BY_SYMBOL[symbol];
  if (symbol && BOARD_BY_SYMBOL[`${symbol}.TA`]) return BOARD_BY_SYMBOL[`${symbol}.TA`];
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

/**
 * Each position with a symbol the market knows, or marked `missing` for
 * the user to fix. The catalogue first (by symbol, then by name), then a
 * symbol the file gave, then search by name. A Tel Aviv security number
 * in the file means a `.TA` symbol when search finds one.
 */
export async function resolvePositions(positions) {
  return Promise.all(
    positions.map(async (p) => {
      const hit = fromCatalog(p.name, p.symbol);
      if (hit) return { ...p, symbol: hit.symbol, sector: hit.sector, display: hit.name, status: 'ok', currency: p.currency ?? (hit.market === 'il' ? 'ILS' : 'USD') };
      if (p.symbol && /^[A-Z][A-Z0-9.-]{0,11}$/.test(p.symbol)) {
        const sym = p.securityId && !/\./.test(p.symbol) && /^\d{5,8}$/.test(p.securityId) ? `${p.symbol}.TA` : p.symbol;
        return { ...p, symbol: sym, sector: sectorFor(sym, { kind: p.assetType === 'etf' ? 'ETF' : undefined }), display: { he: p.name, en: p.name }, status: 'guess', currency: p.currency ?? (/\.TA$/.test(sym) ? 'ILS' : 'USD') };
      }
      const found = (await searchSymbols(p.name)).find((r) => !p.securityId || /\.TA$/.test(r.symbol)) ?? (await searchSymbols(p.name))[0];
      if (found) return { ...p, symbol: found.symbol, sector: sectorFor(found.symbol, found), display: { he: p.name, en: found.name || p.name }, status: 'guess', currency: p.currency ?? (/\.TA$/.test(found.symbol) ? 'ILS' : 'USD') };
      return { ...p, symbol: '', sector: p.assetType === 'etf' ? 'other' : 'tech', display: { he: p.name, en: p.name }, status: 'missing' };
    })
  );
}

/* ── validation ──────────────────────────────────────────────────────────── */

/**
 * What is wrong with a position, as codes the UI puts into words. Nothing
 * is fixed silently: a missing quantity is a warning, not a zero.
 */
export function validatePosition(p, livePrice = null) {
  const warnings = [];
  if (!p.symbol) warnings.push('unknown');
  if (!(p.quantity > 0)) warnings.push('qty');
  if (p.averagePrice != null && livePrice != null && (p.averagePrice > livePrice * 3 || p.averagePrice < livePrice / 3)) warnings.push('cost');
  if (p.assetType === 'bond' || p.assetType === 'option') warnings.push('type');
  return warnings;
}

/**
 * The holdings `store.js` keeps, from resolved positions. Tel Aviv prices
 * in a Meitav file are in agorot, like the quotes; the cost is divided by
 * a hundred when `agorot` is on — the unit is decided here, where it is
 * written, and nowhere else.
 */
export function toHoldings(positions, { agorot = true } = {}) {
  return positions
    .filter((p) => p.symbol && p.quantity > 0 && !p.removed)
    .map((p) => ({
      symbol: p.symbol.toUpperCase(),
      qty: p.quantity,
      cost: p.averagePrice != null && p.averagePrice > 0 ? (agorot && /\.TA$/i.test(p.symbol) ? p.averagePrice / 100 : p.averagePrice) : null,
      sector: p.sector,
      name: p.display ?? { he: p.name, en: p.name },
    }));
}

/* ── reimport ────────────────────────────────────────────────────────────── */

/**
 * What changes between the holdings the city has and the ones a new file
 * brings, by symbol: added, removed, increased, decreased, unchanged. The
 * city reads the same diff off its plan (a site, a pop, a ghost); this is
 * for telling the user before they say yes.
 */
export function diffHoldings(before = [], after = []) {
  const was = new Map(before.map((h) => [h.symbol, h]));
  const now = new Map(after.map((h) => [h.symbol, h]));
  const out = { added: [], removed: [], increased: [], decreased: [], unchanged: [] };
  for (const [symbol, h] of now) {
    const prev = was.get(symbol);
    if (!prev) out.added.push({ symbol, qty: h.qty });
    else if (h.qty > prev.qty + 1e-9) out.increased.push({ symbol, from: prev.qty, to: h.qty });
    else if (h.qty < prev.qty - 1e-9) out.decreased.push({ symbol, from: prev.qty, to: h.qty });
    else out.unchanged.push({ symbol, qty: h.qty });
  }
  for (const [symbol, h] of was) if (!now.has(symbol)) out.removed.push({ symbol, qty: h.qty });
  return out;
}
