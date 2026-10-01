/**
 * Company logos, proxied — and chosen.
 *
 * There is no free logo API left that does not want a key, but every company
 * publishes its own mark as a favicon, and two public caches serve those for
 * any domain with no key at all. Neither is good for everything: one hands
 * back a 16-pixel smudge for Lockheed and a crisp 256 for Elbit, the other the
 * reverse. So this asks both, reads the dimensions out of the bytes and sends
 * on the larger — the browser decodes PNG, JPEG and ICO alike, so the format
 * is not ours to care about.
 *
 * Same-origin for the page, which is the other half of the point: a canvas
 * can only read the pixels of an image it was allowed to read, and a cross-
 * origin favicon is a texture you can show but never sample for its colour.
 */

const TIMEOUT_MS = 6000;
const DOMAIN = /^(?=.{3,80}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;

const sources = (domain) => [
  `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`,
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
];

/** Pixel width of a PNG, JPEG or ICO from its header; 0 when unreadable. */
function width(bytes) {
  if (bytes.length < 24) return 0;
  // PNG: IHDR width is the first field after the 8-byte signature + 8-byte chunk header
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  }
  // ICO: a directory of images; a width byte of 0 means 256
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) {
    const count = bytes[4] | (bytes[5] << 8);
    let best = 0;
    for (let i = 0; i < count && 6 + i * 16 < bytes.length; i++) {
      const w = bytes[6 + i * 16] || 256;
      best = Math.max(best, w);
    }
    return best;
  }
  // JPEG: walk the markers to the first start-of-frame
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return 0;
      const marker = bytes[i + 1];
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return (bytes[i + 7] << 8) | bytes[i + 8];
      }
      i += 2 + len;
    }
  }
  return 0;
}

async function fetchOne(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const w = width(bytes);
    // a 16-pixel mark is a placeholder, not a logo: the page does better
    // with its own sector sign than with a smear stretched over a roof
    if (w < 32) return null;
    return { bytes, type, w };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const domain = String(req.query?.domain || '').trim().toLowerCase();
  if (!DOMAIN.test(domain)) return res.status(400).json({ error: 'bad-domain' });

  const candidates = (await Promise.all(sources(domain).map(fetchOne))).filter(Boolean);
  if (!candidates.length) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(404).json({ error: 'no-logo' });
  }
  const best = candidates.reduce((a, b) => (b.w > a.w ? b : a));

  res.setHeader('Content-Type', best.type.split(';')[0]);
  // a logo changes about once a decade; a day at the edge is still cautious
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800, max-age=86400');
  res.setHeader('X-Logo-Width', String(best.w));
  res.statusCode = 200;
  res.end(Buffer.from(best.bytes));
}
