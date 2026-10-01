/**
 * Symbol search, proxied — same reason as `quotes.js`: no CORS upstream.
 *
 * Filtered down to the things this city can actually build a tower out of:
 * shares, funds and currencies. Futures and options come back from the upstream
 * for almost any query and are noise in a picker aimed at someone looking up
 * "apple" or "hapoalim".
 */

const UPSTREAM = 'https://query1.finance.yahoo.com/v1/finance/search';
const KINDS = new Set(['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX', 'CRYPTOCURRENCY']);
const TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim().slice(0, 40);
  if (q.length < 1) return res.status(400).json({ error: 'no-query' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${UPSTREAM}?q=${encodeURIComponent(q)}&quotesCount=14&newsCount=0&listsCount=0`;
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!upstream.ok) return res.status(502).json({ error: `http-${upstream.status}` });

    const results = ((await upstream.json())?.quotes || [])
      .filter((x) => x.symbol && KINDS.has(x.quoteType))
      .map((x) => ({
        symbol: x.symbol,
        name: x.shortname || x.longname || x.symbol,
        exchange: x.exchDisp || x.exchange || '',
        kind: x.quoteType,
      }))
      .slice(0, 10);

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(err.name === 'AbortError' ? 504 : 502).json({ error: 'upstream' });
  } finally {
    clearTimeout(timer);
  }
}
