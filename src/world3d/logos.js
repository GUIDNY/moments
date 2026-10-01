/**
 * Company marks, fetched once and remembered.
 *
 * `api/logo.js` hands back the best public favicon it can find for a domain,
 * same-origin, which is what lets a canvas read its pixels. From those pixels
 * this takes the one thing the renderer needs besides the picture: the brand
 * colour, so the building can wear it. A logo that never arrives resolves to
 * `null` and the tower keeps its sector sign — the city is never blocked on a
 * third party.
 */

const cache = new Map();

/**
 * The brand colour, read off the mark itself.
 *
 * Favicons are mostly one colour on white or on nothing, so this is a vote:
 * every opaque, non-grey, non-white pixel goes into a coarse hue bucket and the
 * fullest bucket wins. Averaging would land between a red and a blue on a
 * two-colour mark and paint a bank purple. A mark that is only black, white
 * and grey — Apple — gives back its dark tone rather than nothing, because a
 * grey fascia on a glass tower is still *that* tower's colour.
 */
function brandColour(img) {
  const size = 48;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  let data;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return null; // a tainted canvas: the image was not ours to read after all
  }

  const buckets = new Map();
  let dark = 0;
  let darkN = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (max > 235 && sat < 0.12) continue; // paper
    if (sat < 0.22 || max < 40) {
      if (max < 120) {
        dark += max;
        darkN++;
      }
      continue; // greys vote only for the dark fallback
    }
    // hue in 24 steps, with the pixel's own colour summed so the bucket's
    // average is a real colour from the mark rather than a wheel swatch
    let h;
    const d = max - min;
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    const key = Math.floor(h * 4);
    const bucket = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  let best = null;
  for (const bucket of buckets.values()) if (!best || bucket.n > best.n) best = bucket;
  const hex = (r, g, b) =>
    '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  if (best && best.n >= 12) return hex(best.r / best.n, best.g / best.n, best.b / best.n);
  if (darkN >= 12) {
    const v = Math.min(70, dark / darkN);
    return hex(v, v, v);
  }
  return null;
}

/**
 * Resolve a domain to `{ image, colour }`, or `null`. Repeated calls share one
 * request per domain, including the ones that failed — a dead domain is asked
 * once per page, not once per tower per rebuild.
 */
export function loadLogo(domain) {
  if (!domain || typeof document === 'undefined') return Promise.resolve(null);
  if (cache.has(domain)) return cache.get(domain);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve({ image: img, colour: brandColour(img) });
    img.onerror = () => resolve(null);
    // relative, like every other asset: the city runs from any folder
    img.src = `./api/logo?domain=${encodeURIComponent(domain)}`;
  });
  cache.set(domain, p);
  return p;
}
