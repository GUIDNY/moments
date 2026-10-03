/**
 * The city's news, proxied — the feeds send no CORS headers, and the board in
 * the park needs them in the browser.
 *
 * Two keyless engines, by what each is good at: Yahoo Finance's RSS per ticker
 * (English, knows every symbol the quotes do, Tel Aviv included) and Google
 * News' RSS search for a company's Hebrew name and for the market in general
 * (Hebrew, the papers people here read). Nothing here holds a key.
 *
 * `symbols` are validated like the quotes; `q` terms are plain text, capped.
 */
const SYMBOL = /^\^?[A-Za-z0-9][A-Za-z0-9.\-=]{0,14}$/;
const YAHOO = 'https://feeds.finance.yahoo.com/rss/2.0/headline';
const GOOGLE = 'https://news.google.com/rss/search';
const TIMEOUT_MS = 8000;
const MAX_SYMBOLS = 10;
const MAX_TERMS = 10;
const TTL_MS = 10 * 60 * 1000;

/* a small memory cache: the board asks every ten minutes and every visitor
   would otherwise ask the same feeds */
const cache = new Map();

const decode = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

const tag = (xml, name) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(xml);
  return m ? decode(m[1]) : '';
};

/** RSS → items. Enough of the format for two well-behaved feeds. */
function parseRss(xml, extra) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 20) {
    const x = m[1];
    let title = tag(x, 'title');
    let source = tag(x, 'source');
    // Google puts the paper after a dash in the title, with or without a <source>
    const dash = title.lastIndexOf(' - ');
    if (dash > 10 && (!source || title.slice(dash + 3).trim() === source)) {
      source = source || title.slice(dash + 3).trim();
      title = title.slice(0, dash).trim();
    }
    if (!source) source = extra.lang === 'en' && !extra.google ? 'Yahoo Finance' : '';
    const link = tag(x, 'link') || (/<guid[^>]*>(https?:[^<]+)<\/guid>/.exec(x)?.[1] ?? '');
    const at = Date.parse(tag(x, 'pubDate')) || Date.now();
    if (title && link) items.push({ title, link, source, at, ...extra });
  }
  return items;
}

async function fetchText(url, signal) {
  const res = await fetch(url, { signal, headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, text/xml, */*' } });
  if (!res.ok) throw new Error(`http-${res.status}`);
  return res.text();
}

const yahoo = (symbol, signal) =>
  fetchText(`${YAHOO}?s=${encodeURIComponent(symbol)}&region=US&lang=en-US`, signal)
    .then((xml) => parseRss(xml, { symbol, lang: 'en' }))
    .catch(() => []);

const google = (q, lang, symbol, signal) => {
  const loc = lang === 'he' ? 'hl=he&gl=IL&ceid=IL:he' : 'hl=en-US&gl=US&ceid=US:en';
  return fetchText(`${GOOGLE}?q=${encodeURIComponent(q)}&${loc}`, signal)
    .then((xml) => parseRss(xml, { symbol, lang, google: true }).map(({ google: _g, ...i }) => i))
    .catch(() => []);
};

export default async function handler(req, res) {
  const symbols = [...new Set(String(req.query?.symbols || '').split(',').map((s) => s.trim()).filter(Boolean))]
    .filter((s) => SYMBOL.test(s))
    .slice(0, MAX_SYMBOLS);
  // "term|SYMBOL" pairs: the Hebrew name to search for and the symbol to file it under
  const terms = String(req.query?.q || '')
    .split('\n')
    .map((s) => s.replace(/[\u0000-\u001f]/g, '').trim())
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map((pair) => {
      const [term, symbol] = pair.split('|');
      return { term: term.trim().slice(0, 40), symbol: symbol && SYMBOL.test(symbol.trim()) ? symbol.trim() : null };
    })
    .filter((p) => p.term.length >= 2);
  const lang = req.query?.lang === 'en' ? 'en' : 'he';
  const market = req.query?.market !== '0';

  const key = JSON.stringify({ symbols, terms, lang, market });
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(hit.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const jobs = [
      ...symbols.map((s) => yahoo(s, controller.signal)),
      ...terms.map((p) => google(p.term, lang, p.symbol, controller.signal)),
    ];
    if (market) {
      jobs.push(yahoo('^GSPC', controller.signal).then((items) => items.map((i) => ({ ...i, symbol: null, kind: 'market' }))));
      jobs.push(google(lang === 'he' ? 'הבורסה שוק ההון' : 'stock market today', lang, null, controller.signal).then((items) => items.map((i) => ({ ...i, kind: 'market' }))));
    }
    const all = (await Promise.all(jobs)).flat();
    // one headline once, newest first, the stocks' items marked as such
    const seen = new Set();
    const items = all
      .map((i) => ({ ...i, kind: i.kind || 'stock', id: `${i.at}-${i.title.slice(0, 40)}` }))
      .filter((i) => {
        const k = i.title.toLowerCase().slice(0, 60);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, 60);
    const body = { at: Date.now(), items };
    cache.set(key, { at: Date.now(), body });
    if (cache.size > 200) cache.delete(cache.keys().next().value);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(body);
  } catch {
    return res.status(502).json({ error: 'upstream', items: [] });
  } finally {
    clearTimeout(timer);
  }
}
