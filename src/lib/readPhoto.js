/**
 * Read a room off a photograph, in the browser, with no model and no network.
 *
 * A model can look at a photograph and say "this is a bedroom, about three and
 * a half metres across, with a wardrobe on the left". Arithmetic cannot. What
 * arithmetic *can* do is read every surface: what colour the walls are, what
 * colour the floor is and what it is made of, how bright the room is, and
 * whether there is a window and roughly how big. Those are the things a person
 * actually sees when they walk in, and they are all measurable.
 *
 * So the division of labour is: the canvas reads the surfaces, and the agent
 * says which room each photograph is and how big the flat is — two taps and a
 * number they already know from the listing. Between them there is enough to
 * build the place.
 *
 * Everything here runs on a 320px copy of the photograph. At that size the
 * whole analysis is a couple of milliseconds, and none of what we are looking
 * for lives in the fine detail.
 */

const WORK = 320;

/* Where each surface tends to be in a photograph taken standing up in a room.
   Not a law, but true often enough, and the bands overlap generously. */
const BANDS = {
  ceiling: [0.0, 0.16],
  wall: [0.24, 0.62],
  floor: [0.74, 1.0],
};

/* ── loading ──────────────────────────────────────────────────────────────── */

function loadPixels(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, WORK / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve({ data: ctx.getImageData(0, 0, w, h).data, w, h });
      } catch (err) {
        // a cross-origin image without CORS taints the canvas
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

/* ── colour ───────────────────────────────────────────────────────────────── */

const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function saturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function hueDeg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/**
 * Take the colour cast out.
 *
 * An interior photograph is almost never neutral: a tungsten bulb makes
 * everything orange, an overcast window makes everything blue, and a phone's
 * auto white balance only half corrects it. Painting a flat from the raw pixels
 * gives you a tangerine bedroom.
 *
 * Plain grey-world — assume the average of a scene is grey — is not enough; on
 * a strongly lit room it leaves a third of the cast behind. This is the
 * shades-of-grey estimator instead: the same idea under a Minkowski norm, which
 * weighs the brighter pixels more heavily, and those are the ones that actually
 * carry the illuminant. At p=6 it is close to white-patch without being at the
 * mercy of a single clipped highlight.
 */
const CAST_P = 6;
/* Below this the scene is near enough neutral that what we are measuring is
   the room's own colour, not the light in it — and correcting it would paint a
   cool grey bathroom beige. Above the second figure the cast is unmistakable
   and gets taken out almost entirely. */
const CAST_IGNORE = 1.12;
const CAST_FULL = 1.4;
const CAST_MAX = 0.92;

function illuminant(data) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = luma(data[i], data[i + 1], data[i + 2]);
    // blown-out and near-black pixels say nothing about the cast
    if (l < 18 || l > 248) continue;
    r += data[i] ** CAST_P;
    g += data[i + 1] ** CAST_P;
    b += data[i + 2] ** CAST_P;
    n++;
  }
  if (n < 50) return { r: 1, g: 1, b: 1 };
  const norm = (sum) => (sum / n) ** (1 / CAST_P);
  const cr = norm(r);
  const cg = norm(g);
  const cb = norm(b);
  const mean = (cr + cg + cb) / 3;

  /* How hard to correct depends on how sure we are there is anything to
     correct. Colour constancy is ill-posed — a warm photograph of a white room
     and a neutral photograph of a cream room are the same pixels — so the
     estimator cannot tell them apart and neither can we. What we can do is
     decline to act on weak evidence: a faint tint is far more likely to be the
     room than the light, and a strong one is far more likely to be the light. */
  const ratio = Math.max(cr, cg, cb) / Math.max(1, Math.min(cr, cg, cb));
  const strength =
    ratio <= CAST_IGNORE
      ? 0
      : Math.min(CAST_MAX, ((ratio - CAST_IGNORE) / (CAST_FULL - CAST_IGNORE)) * CAST_MAX);
  if (strength === 0) return { r: 1, g: 1, b: 1 };

  const soften = (c) => 1 + (mean / Math.max(1, c) - 1) * strength;
  return { r: soften(cr), g: soften(cg), b: soften(cb) };
}

/**
 * The colour a band of the photograph mostly is.
 *
 * Not the average — averaging a cream wall with a dark doorway gives you a
 * colour that is in neither. Pixels are bucketed coarsely, the fullest bucket
 * wins, and then the real pixels inside that bucket are averaged so the answer
 * is exact rather than quantised.
 */
function dominant(px, { skipBright = false, avoid = [], minSat = 0 } = {}) {
  const buckets = new Map();
  for (const p of px) {
    // only genuinely clipped pixels — a white wall sits around 240 and is the
    // answer we are looking for, not something to throw away
    if (skipBright && p.l > 249) continue;
    if (minSat && p.s < minSat) continue;
    if (avoid.some((a) => Math.abs(p.r - a.r) + Math.abs(p.g - a.g) + Math.abs(p.b - a.b) < 70)) continue;
    const key = (p.r >> 4) * 256 + (p.g >> 4) * 16 + (p.b >> 4);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { n: 0, r: 0, g: 0, b: 0 };
      buckets.set(key, bucket);
    }
    bucket.n++;
    bucket.r += p.r;
    bucket.g += p.g;
    bucket.b += p.b;
  }
  let best = null;
  for (const bucket of buckets.values()) if (!best || bucket.n > best.n) best = bucket;
  if (!best) return null;
  return { r: best.r / best.n, g: best.g / best.n, b: best.b / best.n, share: best.n / Math.max(1, px.length) };
}

/** Every pixel of a horizontal band, white-balanced, with its luma and saturation. */
function band(data, w, h, [from, to], gain) {
  const y0 = Math.floor(h * from);
  const y1 = Math.max(y0 + 1, Math.floor(h * to));
  const out = [];
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = Math.min(255, data[i] * gain.r);
      const g = Math.min(255, data[i + 1] * gain.g);
      const b = Math.min(255, data[i + 2] * gain.b);
      out.push({ x, y, r, g, b, l: luma(r, g, b), s: saturation(r, g, b) });
    }
  }
  return out;
}

/* ── the floor's material ─────────────────────────────────────────────────── */

/**
 * What the floor is made of, from the lines in it.
 *
 * Counting edges does not separate these: a noisy carpet and a tiled floor both
 * have plenty. What separates them is *structure*. Floorboards put a strong
 * seam right across the picture and nothing down it. Tiles put grout both ways
 * at once. Carpet and concrete have texture everywhere and no line anywhere.
 *
 * So the measurement is peaks in the row and column gradient profiles — a row
 * that is far above its neighbours is a seam running across the frame — and the
 * count of those in each direction is what decides. Hue and saturation only
 * break ties, because a warm floor with any colour in it is wood far more often
 * than not.
 */
function floorMaterial(data, w, h, gain, colour) {
  const y0 = Math.floor(h * BANDS.floor[0]) + 1;
  const y1 = h - 1;
  if (y1 - y0 < 4 || w < 8) return 'wood';

  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return luma(data[i] * gain.r, data[i + 1] * gain.g, data[i + 2] * gain.b);
  };

  const rows = [];
  const cols = new Array(w - 2).fill(0);
  let noise = 0;
  let n = 0;

  for (let y = y0; y < y1; y++) {
    let rowSum = 0;
    for (let x = 1; x < w - 1; x++) {
      const dx = Math.abs(at(x + 1, y) - at(x - 1, y));
      const dy = Math.abs(at(x, y + 1) - at(x, y - 1));
      rowSum += dy;
      cols[x - 1] += dx;
      noise += dx + dy;
      n += 2;
    }
    rows.push(rowSum / (w - 2));
  }
  const height = y1 - y0;
  for (let i = 0; i < cols.length; i++) cols[i] /= height;
  noise /= Math.max(1, n);

  /**
   * How many entries stand clearly above the typical one — i.e. are real lines.
   *
   * The cut sits halfway between the median and the top of the range rather
   * than at some multiple of the spread: grout lines can be a tenth of all the
   * rows, which drags a spread-based threshold up past the very peaks it is
   * meant to find. And a series where a quarter of the entries clear the cut is
   * not a floor with lines in it, it is noise — so that answers zero.
   */
  const peaks = (series) => {
    const sorted = [...series].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    const hi = sorted[Math.floor(sorted.length * 0.95)];
    if (hi - mid < 2.5) return 0;
    const cut = mid + (hi - mid) * 0.5;
    let count = 0;
    let above = 0;
    let inPeak = false;
    for (const v of series) {
      if (v > cut) {
        above++;
        if (!inPeak) count++;
        inPeak = true;
      } else {
        inPeak = false;
      }
    }
    return above > series.length * 0.25 ? 0 : count;
  };

  const across = peaks(rows);
  const down = peaks(cols);
  const sat = saturation(colour.r, colour.g, colour.b);
  const hue = hueDeg(colour.r, colour.g, colour.b);
  const light = luma(colour.r, colour.g, colour.b);
  const warm = hue >= 8 && hue <= 55;

  // grout runs both ways
  if (across >= 2 && down >= 2) return light > 150 ? 'tile' : 'stone';
  // boards run one way
  if (across >= 2 && down <= 1) return warm || sat > 0.1 ? 'wood' : 'tile';
  // No lines at all, but texture everywhere: that is a carpet, and its colour
  // does not get a vote — plenty of carpet is the same beige as oak, and the
  // thing that tells them apart is that boards have seams and pile does not.
  if (noise > 7.5) return 'carpet';
  if (warm && sat > 0.16) return 'wood';
  return light > 120 ? 'tile' : 'concrete';
}

/* ── the window ───────────────────────────────────────────────────────────── */

/**
 * Find the window, if the photograph has one.
 *
 * A window in an interior photograph is the part that is blown out — the
 * camera exposes for the room, so the daylight outside clips to near white. So
 * we are not looking for a window, we are looking for a bright hole in a wall,
 * which is the same thing and much easier to find. Its bounding box, as a
 * fraction of the frame, is what gets carried through to the model.
 */
function findWindow(px, w, h, wallLuma) {
  // bright *relative to this room's wall*. An absolute threshold catches a
  // white ceiling in the same frame, and a pale wall pushes a fixed margin
  // past white so that nothing is ever bright enough.
  const cut = Math.min(249, Math.max(216, wallLuma + 20));

  /* The bright pixels are grouped into connected blobs and the biggest one
     wins. Taking the bounding box of *all* of them instead is what a first
     attempt does, and it fails on the commonest photograph there is: a room
     with a white ceiling in shot. The ceiling is bright, the window is bright,
     the box around both of them spans the whole picture, and the window is
     thrown away for being too wide. They are two things, and finding two
     things is what connected components are for. */
  if (!px.length) return null;
  const rows = Math.round(px.length / w);
  if (rows < 4) return null;

  const mask = new Uint8Array(px.length);
  let brightCount = 0;
  for (let i = 0; i < px.length; i++) {
    const p = px[i];
    if (p.l > cut && (p.s < 0.24 || hueDeg(p.r, p.g, p.b) > 165)) {
      mask[i] = 1;
      brightCount++;
    }
  }
  if (brightCount < px.length * 0.012) return null;

  const seen = new Uint8Array(px.length);
  let best = null;
  const queue = new Int32Array(px.length);

  for (let start = 0; start < px.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    let n = 0;
    let minX = w;
    let maxX = -1;
    let minY = rows;
    let maxY = -1;

    while (head < tail) {
      const idx = queue[head++];
      const cx = idx % w;
      const cy = (idx - cx) / w;
      n++;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;

      if (cx > 0 && mask[idx - 1] && !seen[idx - 1]) { seen[idx - 1] = 1; queue[tail++] = idx - 1; }
      if (cx < w - 1 && mask[idx + 1] && !seen[idx + 1]) { seen[idx + 1] = 1; queue[tail++] = idx + 1; }
      if (cy > 0 && mask[idx - w] && !seen[idx - w]) { seen[idx - w] = 1; queue[tail++] = idx - w; }
      if (cy < rows - 1 && mask[idx + w] && !seen[idx + w]) { seen[idx + w] = 1; queue[tail++] = idx + w; }
    }
    if (!best || n > best.n) best = { n, minX, maxX, minY, maxY };
  }
  if (!best) return null;

  // the blob's own y values are relative to the band, so put them back
  const bandTop = px[0].y;
  const top = bandTop + best.minY;
  const bottom = bandTop + best.maxY;

  const widthFrac = (best.maxX - best.minX + 1) / w;
  const heightFrac = (bottom - top + 1) / h;

  // a blob has to be reasonably solid, or it is a scattering of highlights
  const fill = best.n / Math.max(1, (best.maxX - best.minX + 1) * (best.maxY - best.minY + 1));
  if (fill < 0.4) return null;

  // a sliver is a reflection, and a wash over most of the frame is an
  // overexposed photograph rather than a window
  if (widthFrac < 0.08 || widthFrac > 0.88) return null;
  if (heightFrac < 0.08 || heightFrac > 0.9) return null;
  if (best.n > px.length * 0.5) return null;

  return {
    widthFrac,
    // measured from the floor, which is how a window is described
    sillFrac: 1 - (bottom + 1) / h,
    headFrac: 1 - top / h,
    share: best.n / px.length,
  };
}

/* ── the whole reading ────────────────────────────────────────────────────── */

/**
 * Everything one photograph can tell us on its own.
 * Resolves to null if the image cannot be read at all.
 */
export async function readPhoto(src) {
  let pixels;
  try {
    pixels = await loadPixels(src);
  } catch {
    return null;
  }
  const { data, w, h } = pixels;
  const gain = illuminant(data);

  const ceilingPx = band(data, w, h, BANDS.ceiling, gain);
  const wallPx = band(data, w, h, BANDS.wall, gain);
  const floorPx = band(data, w, h, BANDS.floor, gain);

  const wall = dominant(wallPx, { skipBright: true }) || { r: 232, g: 228, b: 220 };
  const floor = dominant(floorPx, { skipBright: true }) || { r: 150, g: 115, b: 75 };
  const ceiling = dominant(ceilingPx, { skipBright: true }) || {
    r: Math.min(255, wall.r * 1.08),
    g: Math.min(255, wall.g * 1.08),
    b: Math.min(255, wall.b * 1.08),
  };

  /* the strongest colour in the room that is neither its walls nor its floor —
     in practice the sofa, the bedspread, the cupboard doors */
  const accent =
    dominant(wallPx.concat(floorPx), { skipBright: true, avoid: [wall, floor], minSat: 0.22 }) ||
    dominant(wallPx, { skipBright: true, avoid: [wall], minSat: 0.12 }) ||
    { r: 120, g: 128, b: 140 };

  const brightness = wallPx.reduce((a, p) => a + p.l, 0) / Math.max(1, wallPx.length) / 255;
  // a window may reach above the wall band but never as far as the ceiling
  const openingPx = band(data, w, h, [0.12, 0.72], gain);
  const wallLuma = luma(wall.r, wall.g, wall.b);

  return {
    wallColor: hex(wall.r, wall.g, wall.b),
    floorColor: hex(floor.r, floor.g, floor.b),
    ceilingColor: hex(ceiling.r, ceiling.g, ceiling.b),
    accentColor: hex(accent.r, accent.g, accent.b),
    floorKind: floorMaterial(data, w, h, gain, floor),
    window: findWindow(openingPx, w, h, wallLuma),
    brightness,
  };
}

export const _internals = { illuminant, dominant, floorMaterial, findWindow, hex, hueDeg, saturation, luma };
