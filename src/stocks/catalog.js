/**
 * The board you pick from.
 *
 * Typing tickers is a thing only someone who already knows tickers will do.
 * Most people know the *company* — bank Hapoalim, Apple, Teva — so the picker
 * leads with a board of things to tap and keeps search for everything else.
 *
 * The sectors are also the districts of the city, which is why a stock found by
 * search and not on this board still gets one: a tower has to stand somewhere.
 */

export const SECTORS = [
  { id: 'tech', emoji: '💻', color: '#7db7ff', name: { he: 'טכנולוגיה', en: 'Technology' } },
  { id: 'banks', emoji: '🏦', color: '#f5c542', name: { he: 'בנקים וביטוח', en: 'Banks & insurance' } },
  { id: 'defence', emoji: '🛡️', color: '#8fb98f', name: { he: 'ביטחון ותעופה', en: 'Defence & aerospace' } },
  { id: 'health', emoji: '💊', color: '#ffb4aa', name: { he: 'בריאות ופארמה', en: 'Health & pharma' } },
  { id: 'energy', emoji: '⚡', color: '#ff9f45', name: { he: 'אנרגיה ותשתיות', en: 'Energy & utilities' } },
  { id: 'other', emoji: '🌍', color: '#c1c1ff', name: { he: 'מדדים ואחר', en: 'Indices & other' } },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

/** Tap-to-add. Short lists on purpose — a board you scroll is a list again. */
export const BOARD = [
  /* ── Israel ──────────────────────────────────────────────────────────── */
  { symbol: 'POLI.TA', sector: 'banks', name: { he: 'בנק הפועלים', en: 'Bank Hapoalim' }, market: 'il' },
  { symbol: 'LUMI.TA', sector: 'banks', name: { he: 'בנק לאומי', en: 'Bank Leumi' }, market: 'il' },
  { symbol: 'MZTF.TA', sector: 'banks', name: { he: 'מזרחי טפחות', en: 'Mizrahi Tefahot' }, market: 'il' },
  { symbol: 'ESLT.TA', sector: 'defence', name: { he: 'אלביט מערכות', en: 'Elbit Systems' }, market: 'il' },
  { symbol: 'NICE.TA', sector: 'tech', name: { he: 'נייס', en: 'NICE' }, market: 'il' },
  { symbol: 'TEVA.TA', sector: 'health', name: { he: 'טבע', en: 'Teva' }, market: 'il' },
  { symbol: 'ICL.TA', sector: 'energy', name: { he: 'כיל', en: 'ICL Group' }, market: 'il' },
  { symbol: 'TA35.TA', sector: 'other', name: { he: 'מדד ת״א 35', en: 'TA-35 index' }, market: 'il' },

  /* ── United States ───────────────────────────────────────────────────── */
  { symbol: 'AAPL', sector: 'tech', name: { he: 'אפל', en: 'Apple' }, market: 'us' },
  { symbol: 'MSFT', sector: 'tech', name: { he: 'מיקרוסופט', en: 'Microsoft' }, market: 'us' },
  { symbol: 'NVDA', sector: 'tech', name: { he: 'אנבידיה', en: 'NVIDIA' }, market: 'us' },
  { symbol: 'GOOGL', sector: 'tech', name: { he: 'גוגל', en: 'Alphabet' }, market: 'us' },
  { symbol: 'AMZN', sector: 'tech', name: { he: 'אמזון', en: 'Amazon' }, market: 'us' },
  { symbol: 'META', sector: 'tech', name: { he: 'מטא', en: 'Meta' }, market: 'us' },
  { symbol: 'TSLA', sector: 'tech', name: { he: 'טסלה', en: 'Tesla' }, market: 'us' },
  { symbol: 'JPM', sector: 'banks', name: { he: 'ג׳יי פי מורגן', en: 'JPMorgan' }, market: 'us' },
  { symbol: 'LMT', sector: 'defence', name: { he: 'לוקהיד מרטין', en: 'Lockheed Martin' }, market: 'us' },
  { symbol: 'PFE', sector: 'health', name: { he: 'פייזר', en: 'Pfizer' }, market: 'us' },
  { symbol: 'XOM', sector: 'energy', name: { he: 'אקסון', en: 'Exxon Mobil' }, market: 'us' },
  { symbol: 'SPY', sector: 'other', name: { he: 'מדד S&P 500', en: 'S&P 500' }, market: 'us' },
  { symbol: 'QQQ', sector: 'other', name: { he: 'נאסד״ק 100', en: 'Nasdaq 100' }, market: 'us' },
  { symbol: 'BTC-USD', sector: 'other', name: { he: 'ביטקוין', en: 'Bitcoin' }, market: 'crypto' },
];

export const BOARD_BY_SYMBOL = Object.fromEntries(BOARD.map((b) => [b.symbol, b]));

export const MARKETS = [
  { id: 'il', flag: '🇮🇱', name: { he: 'תל אביב', en: 'Tel Aviv' } },
  { id: 'us', flag: '🇺🇸', name: { he: 'ארה״ב', en: 'United States' } },
  { id: 'crypto', flag: '₿', name: { he: 'קריפטו', en: 'Crypto' } },
];

/**
 * Which district a symbol belongs in.
 *
 * Known symbols carry their sector. For anything found by search we have only
 * the exchange and the kind, which is thin — but a guess that puts a fund with
 * the indices is better than a city where every searched stock piles into one
 * street.
 */
export function sectorFor(symbol, hint = {}) {
  const known = BOARD_BY_SYMBOL[symbol];
  if (known) return known.sector;
  if (hint.kind === 'ETF' || hint.kind === 'INDEX' || hint.kind === 'MUTUALFUND') return 'other';
  if (hint.kind === 'CRYPTOCURRENCY') return 'other';
  return 'tech';
}
