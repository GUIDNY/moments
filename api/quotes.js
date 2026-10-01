/**
 * Prices, proxied.
 *
 * The browser cannot fetch them itself: the upstream sends no
 * `access-control-allow-origin`, so a direct call from the page is blocked
 * before it starts. This exists for that reason alone — it holds no key, keeps
 * no secret and makes no decision. The whole product is otherwise static.
 *
 * One symbol per upstream call (the batch endpoint is closed to the public),
 * fetched in parallel and cached at the edge, so a city of twenty holdings is
 * one round trip from the page and at most twenty cheap ones from here.
 */

const UPSTREAM = 'https://query1.finance.yahoo.com/v8/finance/chart';
const MAX_SYMBOLS = 30;
const TIMEOUT_MS = 8000;

/* Symbols are pasted, shared in links and typed, so they are checked rather
   than trusted: letters, digits and the few separators real tickers use
   (BRK-B, POLI.TA, BTC-USD, ^GSPC). Anything else never reaches the upstream. */
const SYMBOL = /^\^?[A-Za-z0-9][A-Za-z0-9.\-=]{0,14}$/;

async function quoteOne(symbol) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${UPSTREAM}/${encodeURIComponent(symbol)}?interval=1d&range=3mo`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      }
    );
    if (!res.ok) return { symbol, error: `http-${res.status}` };
    const result = (await res.json())?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      return { symbol, error: 'no-data' };
    }
    /* Three months of daily closes, for the sparkline and for teaching: a
       price is a number, a line is a story. Nulls are days the exchange was
       shut; they are dropped rather than drawn as zero. */
    const closes = (result.indicators?.quote?.[0]?.close || [])
      .filter((v) => typeof v === 'number')
      .slice(-66);
    return {
      closes,
      high52: meta.fiftyTwoWeekHigh ?? null,
      low52: meta.fiftyTwoWeekLow ?? null,
      symbol: meta.symbol || symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
      changePct: meta.regularMarketChangePercent ?? null,
      currency: meta.currency || 'USD',
      exchange: meta.fullExchangeName || meta.exchangeName || '',
      marketState: meta.marketState || null,
      at: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
    };
  } catch (err) {
    return { symbol, error: err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const raw = String(req.query?.symbols || '');
  const symbols = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
    .filter((s) => SYMBOL.test(s))
    .slice(0, MAX_SYMBOLS);

  if (!symbols.length) return res.status(400).json({ error: 'no-symbols' });

  const quotes = await Promise.all(symbols.map(quoteOne));

  // A quote is worth re-using for a minute; the upstream is free and unofficial,
  // and hammering it per visitor is the fastest way to lose it. `stale-while-
  // revalidate` means a visitor during a refresh gets the slightly old number
  // rather than a spinner.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=240');
  return res.status(200).json({
    at: Date.now(),
    // the upstream is delayed and unofficial; the UI says so, and says it from here
    delayed: true,
    quotes,
  });
}
