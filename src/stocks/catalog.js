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

/* Nine sectors, nine districts. The ids are stored on every holding, so an id
   is forever: `defence` became `industry` when industrials arrived and
   `store.js` renames it on load rather than anything here changing. */
export const SECTORS = [
  { id: 'tech', emoji: '💻', color: '#7db7ff', name: { he: 'טכנולוגיה', en: 'Technology' } },
  { id: 'banks', emoji: '🏦', color: '#f5c542', name: { he: 'פיננסים', en: 'Financials' } },
  { id: 'health', emoji: '💊', color: '#ffb4aa', name: { he: 'בריאות ופארמה', en: 'Healthcare' } },
  { id: 'energy', emoji: '⚡', color: '#ff9f45', name: { he: 'אנרגיה ותשתיות', en: 'Energy & utilities' } },
  { id: 'consumer', emoji: '🛍️', color: '#f78fb3', name: { he: 'צריכה ומסחר', en: 'Consumer' } },
  { id: 'industry', emoji: '🏭', color: '#8fb98f', name: { he: 'תעשייה וביטחון', en: 'Industrials & defence' } },
  { id: 'realestate', emoji: '🏢', color: '#c9b08f', name: { he: 'נדל״ן', en: 'Real estate' } },
  { id: 'comm', emoji: '📡', color: '#7fd3c8', name: { he: 'תקשורת ומדיה', en: 'Communication' } },
  { id: 'other', emoji: '🌍', color: '#c1c1ff', name: { he: 'מדדים וקרנות', en: 'Indices & ETFs' } },
];

/** Sector ids that were renamed; a holding saved under the old id is read as the new. */
export const SECTOR_ALIASES = { defence: 'industry' };

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

/** Tap-to-add. Short lists on purpose — a board you scroll is a list again.
 *  `domain` is where the company's own mark lives: `api/logo.js` fetches it and
 *  the tower wears it. A symbol without one gets its sector's sign instead. */
export const BOARD = [
  /* ── Israel ──────────────────────────────────────────────────────────── */
  { symbol: 'POLI.TA', sector: 'banks', domain: 'bankhapoalim.co.il', name: { he: 'בנק הפועלים', en: 'Bank Hapoalim' }, market: 'il' },
  { symbol: 'LUMI.TA', sector: 'banks', domain: 'leumi.co.il', name: { he: 'בנק לאומי', en: 'Bank Leumi' }, market: 'il' },
  { symbol: 'MZTF.TA', sector: 'banks', domain: 'mizrahi-tefahot.co.il', name: { he: 'מזרחי טפחות', en: 'Mizrahi Tefahot' }, market: 'il' },
  { symbol: 'ESLT.TA', sector: 'industry', domain: 'elbitsystems.com', name: { he: 'אלביט מערכות', en: 'Elbit Systems' }, market: 'il' },
  { symbol: 'NICE.TA', sector: 'tech', domain: 'nice.com', name: { he: 'נייס', en: 'NICE' }, market: 'il' },
  { symbol: 'TEVA.TA', sector: 'health', domain: 'tevapharm.com', name: { he: 'טבע', en: 'Teva' }, market: 'il' },
  { symbol: 'ICL.TA', sector: 'energy', domain: 'icl-group.com', name: { he: 'כיל', en: 'ICL Group' }, market: 'il' },
  { symbol: 'TA35.TA', sector: 'other', domain: 'tase.co.il', name: { he: 'מדד ת״א 35', en: 'TA-35 index' }, market: 'il' },
  { symbol: 'SAE.TA', sector: 'consumer', domain: 'shufersal.co.il', name: { he: 'שופרסל', en: 'Shufersal' }, market: 'il' },
  { symbol: 'STRS.TA', sector: 'consumer', domain: 'strauss-group.com', name: { he: 'שטראוס', en: 'Strauss' }, market: 'il' },
  { symbol: 'AZRG.TA', sector: 'realestate', domain: 'azrieli.com', name: { he: 'עזריאלי', en: 'Azrieli' }, market: 'il' },
  { symbol: 'MLSR.TA', sector: 'realestate', domain: 'melisron.co.il', name: { he: 'מליסרון', en: 'Melisron' }, market: 'il' },
  { symbol: 'BEZQ.TA', sector: 'comm', domain: 'bezeq.co.il', name: { he: 'בזק', en: 'Bezeq' }, market: 'il' },
  { symbol: 'CEL.TA', sector: 'comm', domain: 'cellcom.co.il', name: { he: 'סלקום', en: 'Cellcom' }, market: 'il' },

  /* ── United States ───────────────────────────────────────────────────── */
  { symbol: 'AAPL', sector: 'tech', domain: 'apple.com', name: { he: 'אפל', en: 'Apple' }, market: 'us' },
  { symbol: 'MSFT', sector: 'tech', domain: 'microsoft.com', name: { he: 'מיקרוסופט', en: 'Microsoft' }, market: 'us' },
  { symbol: 'NVDA', sector: 'tech', domain: 'nvidia.com', name: { he: 'אנבידיה', en: 'NVIDIA' }, market: 'us' },
  { symbol: 'GOOGL', sector: 'comm', domain: 'google.com', name: { he: 'גוגל', en: 'Alphabet' }, market: 'us' },
  { symbol: 'AMZN', sector: 'consumer', domain: 'amazon.com', name: { he: 'אמזון', en: 'Amazon' }, market: 'us' },
  { symbol: 'META', sector: 'comm', domain: 'meta.com', name: { he: 'מטא', en: 'Meta' }, market: 'us' },
  { symbol: 'TSLA', sector: 'tech', domain: 'tesla.com', name: { he: 'טסלה', en: 'Tesla' }, market: 'us' },
  { symbol: 'JPM', sector: 'banks', domain: 'jpmorganchase.com', name: { he: 'ג׳יי פי מורגן', en: 'JPMorgan' }, market: 'us' },
  { symbol: 'LMT', sector: 'industry', domain: 'lockheedmartin.com', name: { he: 'לוקהיד מרטין', en: 'Lockheed Martin' }, market: 'us' },
  { symbol: 'PFE', sector: 'health', domain: 'pfizer.com', name: { he: 'פייזר', en: 'Pfizer' }, market: 'us' },
  { symbol: 'XOM', sector: 'energy', domain: 'exxonmobil.com', name: { he: 'אקסון', en: 'Exxon Mobil' }, market: 'us' },
  { symbol: 'WMT', sector: 'consumer', domain: 'walmart.com', name: { he: 'וולמארט', en: 'Walmart' }, market: 'us' },
  { symbol: 'COST', sector: 'consumer', domain: 'costco.com', name: { he: 'קוסטקו', en: 'Costco' }, market: 'us' },
  { symbol: 'NKE', sector: 'consumer', domain: 'nike.com', name: { he: 'נייקי', en: 'Nike' }, market: 'us' },
  { symbol: 'MCD', sector: 'consumer', domain: 'mcdonalds.com', name: { he: 'מקדונלד׳ס', en: "McDonald's" }, market: 'us' },
  { symbol: 'KO', sector: 'consumer', domain: 'coca-colacompany.com', name: { he: 'קוקה קולה', en: 'Coca-Cola' }, market: 'us' },
  { symbol: 'CAT', sector: 'industry', domain: 'caterpillar.com', name: { he: 'קטרפילר', en: 'Caterpillar' }, market: 'us' },
  { symbol: 'BA', sector: 'industry', domain: 'boeing.com', name: { he: 'בואינג', en: 'Boeing' }, market: 'us' },
  { symbol: 'GE', sector: 'industry', domain: 'ge.com', name: { he: 'ג׳נרל אלקטריק', en: 'GE Aerospace' }, market: 'us' },
  { symbol: 'O', sector: 'realestate', domain: 'realtyincome.com', name: { he: 'ריאלטי אינקם', en: 'Realty Income' }, market: 'us' },
  { symbol: 'PLD', sector: 'realestate', domain: 'prologis.com', name: { he: 'פרולוג׳יס', en: 'Prologis' }, market: 'us' },
  { symbol: 'NFLX', sector: 'comm', domain: 'netflix.com', name: { he: 'נטפליקס', en: 'Netflix' }, market: 'us' },
  { symbol: 'DIS', sector: 'comm', domain: 'disney.com', name: { he: 'דיסני', en: 'Disney' }, market: 'us' },
  { symbol: 'SPY', sector: 'other', domain: 'ssga.com', name: { he: 'מדד S&P 500', en: 'S&P 500' }, market: 'us' },
  { symbol: 'QQQ', sector: 'other', domain: 'invesco.com', name: { he: 'נאסד״ק 100', en: 'Nasdaq 100' }, market: 'us' },
  { symbol: 'BTC-USD', sector: 'other', domain: 'bitcoin.org', name: { he: 'ביטקוין', en: 'Bitcoin' }, market: 'crypto' },
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
  if (hint.sector) return hint.sector;
  if (hint.kind === 'REIT') return 'realestate';
  if (hint.kind === 'ETF' || hint.kind === 'INDEX' || hint.kind === 'MUTUALFUND') return 'other';
  if (hint.kind === 'CRYPTOCURRENCY') return 'other';
  return 'tech';
}
