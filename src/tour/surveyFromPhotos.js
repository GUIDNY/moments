import { readPhoto } from '../lib/readPhoto';
import { shade } from './surfaces';

/**
 * Build a survey out of photographs and a handful of taps.
 *
 * `api/analyse.js` does this with a model and costs a few agorot a property.
 * This does it for nothing, by splitting the job along the line where the two
 * halves are actually easy: a canvas can measure every surface in a photograph
 * but cannot say what it is looking at, and an agent can say what they are
 * looking at instantly but would never sit and type colour codes.
 *
 * So the photographs decide what the flat *looks* like — the colour of each
 * room's walls, its floor and what that floor is made of, how bright it is,
 * whether it has a window and how big — and the agent supplies the two things
 * no arithmetic can recover from a picture: which room each photograph is, and
 * how many square metres the whole place is. That is two taps a photograph and
 * one number they already have on the listing.
 *
 * What it cannot do is see the furniture. Each room is furnished from a kit
 * instead, in the colours its own photograph actually had, so a living room
 * whose photograph is dominated by a green sofa gets a green sofa. It is the
 * one part of the result that is a reasonable guess rather than a measurement,
 * and the wording in the UI says so.
 */

/* Relative floor area, used to share out the total the agent gave us. These are
   the proportions of an ordinary flat, not of any particular one. */
const WEIGHT = {
  entry: 0.5, hall: 0.6, wc: 0.5, bathroom: 1.0, utility: 0.7,
  kitchen: 1.6, study: 1.8, dining: 2.0, bedroom: 2.4, balcony: 1.0, living: 3.6,
};

/* How a room of each kind is furnished when we cannot see inside it. `soft`
   takes the photograph's own accent colour; `wood` follows its floor. */
const KIT = {
  bedroom: [
    { kind: 'bed', wall: 'far', lengthM: 1.9, tone: 'soft' },
    { kind: 'wardrobe', wall: 'left', lengthM: 1.8, tone: 'wood' },
    { kind: 'bedside', wall: 'right', lengthM: 0.44, tone: 'wood' },
  ],
  living: [
    { kind: 'sofa', wall: 'left', lengthM: 2.2, tone: 'soft' },
    { kind: 'tv', wall: 'right', lengthM: 1.2, tone: 'dark' },
    { kind: 'coffee-table', wall: 'centre', lengthM: 1.0, tone: 'wood' },
    { kind: 'rug', wall: 'centre', lengthM: 2.4, tone: 'softer' },
    { kind: 'plant', wall: 'near', lengthM: 0.4, tone: 'plant' },
  ],
  dining: [
    { kind: 'dining-table', wall: 'centre', lengthM: 1.6, tone: 'wood' },
    { kind: 'bookshelf', wall: 'far', lengthM: 1.4, tone: 'wood' },
  ],
  kitchen: [
    { kind: 'counter', wall: 'far', lengthM: 2.4, tone: 'pale' },
    { kind: 'fridge', wall: 'left', lengthM: 0.7, tone: 'metal' },
  ],
  bathroom: [
    { kind: 'shower', wall: 'far', lengthM: 0.95, tone: 'pale' },
    { kind: 'wc', wall: 'right', lengthM: 0.6, tone: 'pale' },
    { kind: 'vanity', wall: 'left', lengthM: 0.85, tone: 'wood' },
  ],
  wc: [
    { kind: 'wc', wall: 'far', lengthM: 0.6, tone: 'pale' },
    { kind: 'vanity', wall: 'left', lengthM: 0.5, tone: 'wood' },
  ],
  study: [
    { kind: 'desk', wall: 'far', lengthM: 1.3, tone: 'wood' },
    { kind: 'bookshelf', wall: 'left', lengthM: 1.4, tone: 'wood' },
  ],
  utility: [{ kind: 'counter', wall: 'far', lengthM: 1.2, tone: 'pale' }],
  balcony: [{ kind: 'plant', wall: 'far', lengthM: 0.4, tone: 'plant' }],
  entry: [],
  hall: [],
};

const NAMES = {
  entry: { he: 'כניסה', en: 'Entrance' },
  hall: { he: 'מסדרון', en: 'Hall' },
  living: { he: 'סלון', en: 'Living room' },
  kitchen: { he: 'מטבח', en: 'Kitchen' },
  dining: { he: 'פינת אוכל', en: 'Dining' },
  bedroom: { he: 'חדר שינה', en: 'Bedroom' },
  bathroom: { he: 'אמבטיה', en: 'Bathroom' },
  wc: { he: 'שירותים', en: 'WC' },
  balcony: { he: 'מרפסת', en: 'Balcony' },
  study: { he: 'חדר עבודה', en: 'Study' },
  utility: { he: 'מחסן', en: 'Utility' },
};

/* The order you meet rooms walking in from the front door. */
const ORDER = ['entry', 'hall', 'wc', 'bathroom', 'utility', 'study', 'bedroom', 'kitchen', 'dining', 'balcony', 'living'];

export const ROOM_KINDS = ORDER;
export const roomName = (kind, lang) => NAMES[kind]?.[lang] || kind;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Average a set of hex colours, so two photographs of one room agree. */
function blend(colors) {
  const parts = colors.filter(Boolean).map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  if (!parts.length) return '#dcd8d0';
  const n = parts.length;
  const avg = [0, 1, 2].map((i) => Math.round(parts.reduce((a, p) => a + p[i], 0) / n));
  return '#' + avg.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** The commonest material among the photographs of one room. */
function commonest(values, fallback) {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  let best = fallback;
  let most = 0;
  for (const [v, c] of counts) if (c > most) [best, most] = [v, c];
  return best;
}

function furnish(kind, room, index) {
  return (KIT[kind] || []).map((piece) => {
    let color;
    switch (piece.tone) {
      case 'soft': color = room.accentColor; break;
      case 'softer': color = shade(room.accentColor, 0.25); break;
      case 'wood': color = shade(room.floorColor, -0.18); break;
      case 'pale': color = shade(room.wallColor, 0.12); break;
      case 'metal': color = '#b6bcc2'; break;
      case 'dark': color = '#14171c'; break;
      case 'plant': color = '#4a7f4a'; break;
      default: color = room.wallColor;
    }
    // `shade` answers in rgb(); the survey format wants hex
    return { ...piece, color: toHex(color), lengthM: piece.lengthM * (index === 0 ? 1.08 : 1) };
  });
}

function toHex(c) {
  if (typeof c === 'string' && c.startsWith('#')) return c;
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(String(c));
  if (!m) return '#8a8a8a';
  return '#' + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('');
}

/**
 * `photos` is [{ url, kind }] as tagged by the agent; `totalArea` is the flat's
 * size in m². Resolves to the same observation shape `api/analyse.js` returns,
 * so everything downstream is unchanged.
 */
export async function surveyFromPhotos(photos, totalArea, lang = 'he') {
  const tagged = photos.filter((p) => p.kind && p.url);
  if (!tagged.length) throw new Error('no-tagged-photos');

  const readings = await Promise.all(tagged.map((p) => readPhoto(p.url).catch(() => null)));

  /* photographs of the same kind are the same room, except bedrooms — a flat
     has several, and each photograph of one is usually a different one */
  const groups = new Map();
  let bedrooms = 0;
  tagged.forEach((photo, i) => {
    const key = photo.kind === 'bedroom' ? `bedroom${++bedrooms}` : photo.kind;
    let group = groups.get(key);
    if (!group) {
      group = { id: key, kind: photo.kind, readings: [], photos: [] };
      groups.set(key, group);
    }
    if (readings[i]) group.readings.push(readings[i]);
    group.photos.push(i);
  });

  const rooms = [...groups.values()];
  const totalWeight = rooms.reduce((a, r) => a + (WEIGHT[r.kind] ?? 1.5), 0);
  const area = clamp(Number(totalArea) || 0, 18, 400);

  const built = rooms.map((group, index) => {
    const r = group.readings;
    const wallColor = blend(r.map((x) => x.wallColor));
    const floorColor = blend(r.map((x) => x.floorColor));
    const accentColor = blend(r.map((x) => x.accentColor));
    const floorKind = commonest(r.map((x) => x.floorKind), 'wood');

    const share = (WEIGHT[group.kind] ?? 1.5) / totalWeight;
    const roomArea = clamp(area * share, 1.8, 60);
    // a believable aspect: rooms are wider than they are deep only rarely
    const widthM = clamp(Math.sqrt(roomArea / 1.25), 1.2, 6.5);
    const depthM = clamp(roomArea / widthM, 1.2, 9);

    const room = { wallColor, floorColor, accentColor };

    /* the window, at the size it took up in the photograph */
    const seen = r.find((x) => x.window)?.window;
    const windows = seen
      ? [{
          wall: 'far',
          widthM: clamp(seen.widthFrac * widthM * 1.25, 0.6, widthM - 0.5),
          sillM: clamp(seen.sillFrac * 2.6, 0, 1.4),
          headM: clamp(seen.headFrac * 2.6, 1.2, 2.55),
        }]
      : [];

    return {
      id: group.id,
      kind: group.kind,
      nameHe: NAMES[group.kind]?.he || group.kind,
      nameEn: NAMES[group.kind]?.en || group.kind,
      widthM,
      depthM,
      ceilingM: 2.65,
      wallColor,
      floor: { kind: floorKind, color: floorColor },
      windows,
      furniture: furnish(group.kind, room, index),
      fromPhotos: group.photos,
    };
  });

  const order = [...built]
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.kind);
      const bi = ORDER.indexOf(b.kind);
      return ai === bi ? a.id.localeCompare(b.id) : ai - bi;
    })
    .map((r) => r.id);

  const names = built.map((r) => (lang === 'he' ? r.nameHe : r.nameEn));
  return {
    readable: true,
    source: 'browser',
    summaryHe: `${built.length} חללים: ${names.join(', ')}`,
    summaryEn: `${built.length} spaces: ${names.join(', ')}`,
    order,
    rooms: built,
  };
}
