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

function isOpen(meta) {
  if (meta.marketState) return meta.marketState === 'REGULAR';
  const reg = meta.currentTradingPeriod?.regular;
  if (!reg || typeof reg.start !== 'number' || typeof reg.end !== 'number') return null;
  const now = Date.now() / 1000;
  return now >= reg.start && now < reg.end;
}

async function quoteOne(symbol) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${UPSTREAM}/${encodeURIComponent(symbol)}?interval=1d&range=3mo&events=div`,
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
    const series = result.indicators?.quote?.[0]?.close || [];
    const stamps = result.timestamp || [];
    const closes = series.filter((v) => typeof v === 'number').slice(-66);
    /* Yesterday's close is the last bar before the session the quote belongs
       to. `chartPreviousClose` is NOT that: it is the close before the range
       began, three months ago, and reading it as yesterday turned a flat day
       into a +12% one on every roof in the city. */
    const DAY = 86400;
    const session = Math.floor((meta.regularMarketTime || 0) / DAY);
    let prevClose = meta.regularMarketPreviousClose ?? meta.previousClose ?? null;
    if (prevClose == null) {
      let i = series.length - 1;
      while (i >= 0 && (typeof series[i] !== 'number' || Math.floor((stamps[i] || 0) / DAY) >= session)) i--;
      prevClose = i >= 0 ? series[i] : meta.regularMarketPrice;
    }
    /* Dividends paid in the range, oldest first: the ex-date and the amount a
       share got, in the quote's own currency (agorot for Tel Aviv, like the
       price). The game pays them into the purse for shares held on the day. */
    const dividends = Object.values(result.events?.dividends || {})
      .filter((d) => typeof d.amount === 'number' && typeof d.date === 'number')
      .map((d) => ({ at: d.date * 1000, amount: d.amount }))
      .sort((a, b) => a.at - b.at)
      .slice(-8);
    return {
      closes,
      dividends,
      high52: meta.fiftyTwoWeekHigh ?? null,
      low52: meta.fiftyTwoWeekLow ?? null,
      symbol: meta.symbol || symbol,
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice,
      prevClose,
      changePct: meta.regularMarketChangePercent ?? null,
      currency: meta.currency || 'USD',
      exchange: meta.fullExchangeName || meta.exchangeName || '',
      marketState: meta.marketState || null,
      /* open or closed, decided here from the exchange's own session times
         for today — the chart endpoint does not always say `marketState` */
      open: isOpen(meta),
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
