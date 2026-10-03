import { BOARD } from './catalog';

/**
 * The city's news: headlines for every stock held and for the market, from
 * `api/news.js`. Asked once per set of holdings and again every ten minutes;
 * the board in the park cycles them and the news sheet lists them.
 */
export const NEWS_REFRESH_MS = 10 * 60 * 1000;

const byCatalog = Object.fromEntries(BOARD.map((b) => [b.symbol, b]));

/** The Hebrew search terms for the holdings that have a Hebrew name we chose. */
function termsFor(holdings) {
  return holdings
    .map((h) => {
      const he = byCatalog[h.symbol]?.name?.he ?? h.name?.he;
      // the name in quotes plus "share": "טבע" alone is nature, "אלביט" alone is a surname
      return he ? `"${he}" מניה|${h.symbol}` : null;
    })
    .filter(Boolean)
    .slice(0, 10);
}

export async function fetchNews(holdings, lang = 'he') {
  const symbols = holdings.map((h) => h.symbol).slice(0, 10);
  const params = new URLSearchParams();
  if (symbols.length) params.set('symbols', symbols.join(','));
  const terms = lang === 'he' ? termsFor(holdings) : [];
  if (terms.length) params.set('q', terms.join('\n'));
  params.set('lang', lang);
  try {
    const res = await fetch(`/api/news?${params.toString()}`);
    if (!res.ok) return { at: Date.now(), items: [] };
    const body = await res.json();
    return { at: body.at ?? Date.now(), items: Array.isArray(body.items) ? body.items : [] };
  } catch {
    return { at: Date.now(), items: [] };
  }
}

/** How long ago, in the city's two languages, for a list of headlines. */
export function ago(at, lang) {
  const m = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (lang === 'he') {
    if (m < 60) return `לפני ${m} דק׳`;
    const h = Math.round(m / 60);
    if (h < 48) return `לפני ${h} שע׳`;
    return `לפני ${Math.round(h / 24)} ימים`;
  }
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
