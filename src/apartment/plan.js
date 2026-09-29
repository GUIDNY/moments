/**
 * The flat, in metres. One module holds the plan so the geometry you see and
 * the collision you feel can never drift apart.
 *
 *   x runs 0 → 4.2 (left → right as you come in)
 *   z runs 0 → 7.6 (entrance → balcony)
 *
 * Laid out from the five photos: entrance hall with the shower room off it, an
 * L-shaped kitchen facing the bunk alcove, then the living end with the timber
 * TV wall, the round table and the window onto the mountains.
 */

export const ROOM = { w: 4.2, d: 7.6, h: 2.5 };
export const WALL_T = 0.1;

/** A wall run. `y0`/`h` let a segment sit above a door or below a window. */
const seg = (x1, z1, x2, z2, opts = {}) => ({
  x1,
  z1,
  x2,
  z2,
  y0: opts.y0 ?? 0,
  h: opts.h ?? ROOM.h,
  mat: opts.mat ?? 'plaster',
  solid: opts.solid ?? true,
});

export const WALLS = [
  // ── shell ───────────────────────────────────────────────────────────────
  // south wall, split around the front door (x 2.9 → 3.8)
  seg(0, 0, 2.9, 0),
  seg(3.8, 0, ROOM.w, 0),
  seg(2.9, 0, 3.8, 0, { y0: 2.05, h: 0.45 }), // over the door

  // west wall: plaster up to the living end, then the timber feature wall
  seg(0, 0, 0, 4.7),
  seg(0, 4.7, 0, ROOM.d, { mat: 'wood' }),

  // east wall
  seg(ROOM.w, 0, ROOM.w, ROOM.d),

  // north wall — window opening from x 0.45 to 3.4
  seg(0, ROOM.d, 0.45, ROOM.d),
  seg(3.4, ROOM.d, ROOM.w, ROOM.d),
  seg(0.45, ROOM.d, 3.4, ROOM.d, { h: 0.35 }), // sill
  seg(0.45, ROOM.d, 3.4, ROOM.d, { y0: 2.25, h: 0.25 }), // header

  // ── shower room, off the hall ───────────────────────────────────────────
  seg(1.9, 0, 1.9, 1.15, { mat: 'tile' }), // east wall, up to the door
  seg(1.9, 2.1, 1.9, 2.3, { mat: 'tile' }),
  seg(1.9, 1.15, 1.9, 2.1, { y0: 2.05, h: 0.45, mat: 'tile' }), // over the door
  seg(0, 2.3, 1.9, 2.3, { mat: 'tile' }), // north wall of the bathroom

  // ── bunk alcove divider ─────────────────────────────────────────────────
  seg(1.55, 2.3, 1.55, 3.0, { mat: 'plaster' }),
];

/** Fixed things you cannot walk through, as axis-aligned boxes. */
export const SOLIDS = [
  // kitchen: an L of units along the east wall and across
  { x: 3.55, z: 2.35, w: 0.65, d: 1.75, label: 'kitchen-run' },
  { x: 2.35, z: 3.45, w: 1.2, d: 0.65, label: 'kitchen-return' },

  // bunk beds in the alcove
  { x: 0, z: 2.55, w: 1.45, d: 2.05, label: 'bunks' },

  // living
  { x: 3.35, z: 5.5, w: 0.85, d: 1.75, label: 'sofa' },
  { x: 0.9, z: 5.15, w: 0.95, d: 0.95, label: 'table' },
  { x: 2.7, z: 6.2, w: 0.45, d: 0.45, label: 'coffee-table' },

  // bathroom
  { x: 0.05, z: 1.85, w: 1.0, d: 0.4, label: 'vanity' },
  { x: 0, z: 0, w: 1.0, d: 1.2, label: 'shower' },
];

/** Where the quick-jump buttons drop you, and which way you face. */
export const ZONES = [
  { id: 'entry', emoji: '🚪', x: 3.35, z: 0.75, yaw: Math.PI },
  { id: 'kitchen', emoji: '🍳', x: 2.25, z: 2.5, yaw: -2.31 },
  { id: 'bunks', emoji: '🛏️', x: 2.6, z: 2.75, yaw: 1.99 },
  { id: 'bathroom', emoji: '🚿', x: 1.55, z: 1.75, yaw: 2.3 },
  { id: 'living', emoji: '🛋️', x: 2.15, z: 4.55, yaw: Math.PI - 0.42 },
  { id: 'window', emoji: '🏔️', x: 2.4, z: 6.6, yaw: Math.PI },
];

export const SPAWN = ZONES[0];

/* ── collision ────────────────────────────────────────────────────────────── */

const WALL_BOXES = WALLS.filter((w) => w.solid && w.y0 < 1.7).map((w) => {
  const minX = Math.min(w.x1, w.x2) - WALL_T / 2;
  const maxX = Math.max(w.x1, w.x2) + WALL_T / 2;
  const minZ = Math.min(w.z1, w.z2) - WALL_T / 2;
  const maxZ = Math.max(w.z1, w.z2) + WALL_T / 2;
  return { minX, maxX, minZ, maxZ };
});

const SOLID_BOXES = SOLIDS.map((s) => ({
  minX: s.x,
  maxX: s.x + s.w,
  minZ: s.z,
  maxZ: s.z + s.d,
}));

const BOXES = [...WALL_BOXES, ...SOLID_BOXES];

/** Can a person of this radius stand with their feet at (x, z)? */
export function canStand(x, z, radius = 0.26) {
  if (x < radius || z < radius || x > ROOM.w - radius || z > ROOM.d - radius) return false;
  for (const b of BOXES) {
    if (
      x + radius > b.minX &&
      x - radius < b.maxX &&
      z + radius > b.minZ &&
      z - radius < b.maxZ
    ) {
      return false;
    }
  }
  return true;
}
