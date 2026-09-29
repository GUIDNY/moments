/**
 * A property description in, a walkable flat out.
 *
 * The layout is a spine: a corridor runs from the front door along one side,
 * the private rooms open off it one after another, and the living space takes
 * the far end across the full width. It is not the only way to lay out a flat,
 * but it always produces something connected and believable, which matters more
 * than novelty when an agent is generating a tour in thirty seconds.
 *
 * Everything the renderer draws and everything the walker collides with comes
 * out of here, so the two can never disagree.
 */

export const CORRIDOR_W = 1.3;
export const WALL_T = 0.1;
export const CEIL = 2.6;
const DOOR_W = 0.85;
const ENTRY_W = 0.9;

/** Standard areas in m², before the flat is scaled to its stated size. */
const AREA = { bath: 4.6, master: 13, bedroom: 10.5, kitchen: 8, livingMin: 17 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The default property, also what the studio starts from. */
export const DEFAULT_SPEC = {
  title: '',
  address: '',
  price: '',
  size: 78,
  floor: '',
  bedrooms: 2,
  bathrooms: 1,
  openKitchen: true,
  balcony: true,
  view: 'city',
  agent: { name: '', phone: '', agency: '' },
  photos: [],
};

export function normaliseSpec(raw = {}) {
  const spec = { ...DEFAULT_SPEC, ...raw, agent: { ...DEFAULT_SPEC.agent, ...(raw.agent || {}) } };
  spec.bedrooms = clamp(Math.round(spec.bedrooms) || 0, 0, 4);
  spec.bathrooms = clamp(Math.round(spec.bathrooms) || 1, 1, 3);
  spec.size = clamp(Number(spec.size) || 78, 28, 260);
  spec.photos = Array.isArray(spec.photos) ? spec.photos.slice(0, 8) : [];
  return spec;
}

/* ── the plan ─────────────────────────────────────────────────────────────── */

export function generatePlan(rawSpec) {
  const spec = normaliseSpec(rawSpec);

  // a width that gives the flat a believable aspect, then the living room takes
  // whatever depth is left — so the total area lands on the stated size
  const W = clamp(Math.sqrt(spec.size / 1.7), 4.0, 8.5);
  const roomW = W - CORRIDOR_W;

  // which rooms hang off the corridor, in the order you meet them
  const stacked = [];
  for (let i = 0; i < spec.bathrooms; i++) {
    stacked.push({ type: 'bath', area: AREA.bath, name: i === 0 ? 'bath' : 'bath2' });
  }
  if (!spec.openKitchen) stacked.push({ type: 'kitchen', area: AREA.kitchen, name: 'kitchen' });
  for (let i = 0; i < spec.bedrooms; i++) {
    stacked.push({
      type: 'bedroom',
      area: i === 0 ? AREA.master : AREA.bedroom,
      name: i === 0 ? 'master' : `bedroom${i + 1}`,
      master: i === 0,
    });
  }

  const entryD = 0.35;
  const depths = stacked.map((r) => clamp(r.area / roomW, 2.1, 5.4));
  const stackedD = depths.reduce((sum, d) => sum + d, 0);
  const livingD = clamp(spec.size / W - entryD - stackedD, 3.4, 9);
  const D = entryD + stackedD + livingD;

  const walls = [];
  const rooms = [];
  const seg = (x1, z1, x2, z2, o = {}) => {
    walls.push({
      x1,
      z1,
      x2,
      z2,
      y0: o.y0 ?? 0,
      h: o.h ?? CEIL,
      mat: o.mat ?? 'plaster',
      solid: o.solid ?? true,
    });
  };

  /* shell */
  const entryX = CORRIDOR_W / 2; // the front door sits in the corridor
  seg(0, 0, entryX - ENTRY_W / 2, 0);
  seg(entryX + ENTRY_W / 2, 0, W, 0);
  seg(entryX - ENTRY_W / 2, 0, entryX + ENTRY_W / 2, 0, { y0: 2.1, h: CEIL - 2.1 });
  seg(0, 0, 0, D);
  seg(W, 0, W, D);

  /* the window wall at the far end */
  const winX0 = 0.5;
  const winX1 = W - 0.5;
  seg(0, D, winX0, D);
  seg(winX1, D, W, D);
  seg(winX0, D, winX1, D, { h: 0.4 });
  seg(winX0, D, winX1, D, { y0: 2.3, h: CEIL - 2.3 });

  /* private rooms off the corridor */
  let z = entryD;
  stacked.forEach((room, i) => {
    const depth = depths[i];
    const z0 = z;
    const z1 = z + depth;
    const doorZ = z0 + depth / 2;

    // corridor wall, with a doorway
    seg(CORRIDOR_W, z0, CORRIDOR_W, doorZ - DOOR_W / 2);
    seg(CORRIDOR_W, doorZ + DOOR_W / 2, CORRIDOR_W, z1);
    seg(CORRIDOR_W, doorZ - DOOR_W / 2, CORRIDOR_W, doorZ + DOOR_W / 2, {
      y0: 2.1,
      h: CEIL - 2.1,
    });
    // wall between this room and the next
    seg(CORRIDOR_W, z1, W, z1);

    rooms.push({
      id: room.name,
      type: room.type,
      master: Boolean(room.master),
      x: CORRIDOR_W,
      z: z0,
      w: roomW,
      d: depth,
      door: { x: CORRIDOR_W, z: doorZ },
      view: { x: CORRIDOR_W + 0.8, z: doorZ, yaw: -Math.PI / 2 },
    });

    z = z1;
  });

  /* the living end, open to the corridor */
  const livingZ0 = z;
  rooms.push({
    id: 'living',
    type: 'living',
    openKitchen: spec.openKitchen,
    x: 0,
    z: livingZ0,
    w: W,
    d: livingD,
    door: { x: CORRIDOR_W / 2, z: livingZ0 },
    // stand just inside the room, off the corridor axis, looking down its length
    view: { x: W * 0.36, z: livingZ0 + 0.5, yaw: Math.PI },
  });

  /* walls are fixed; furniture has to earn its place */
  const wallBoxes = walls
    .filter((seg2) => seg2.solid && seg2.y0 < 1.7)
    .map((seg2) => ({
      minX: Math.min(seg2.x1, seg2.x2) - WALL_T / 2,
      maxX: Math.max(seg2.x1, seg2.x2) + WALL_T / 2,
      minZ: Math.min(seg2.z1, seg2.z2) - WALL_T / 2,
      maxZ: Math.max(seg2.z1, seg2.z2) + WALL_T / 2,
    }));

  const spawn = { x: entryX, z: 0.75, yaw: Math.PI };
  const kept = [];

  /**
   * Add a piece, then check you can still reach every room. If it walls
   * something off, it goes back in the van. This is why the generator cannot
   * produce a flat with a room you can see but never enter.
   */
  const everyRoomReachable = (furniture) => {
    const walk = makeWalker(W, D, wallBoxes, furniture);
    if (!walk(spawn.x, spawn.z)) return null;
    const seen = reachable(walk, W, D, spawn);
    const spots = [];
    for (const room of rooms) {
      const spot = standIn(seen, W, room, room.view);
      if (!spot) return null;
      spots.push(spot);
    }
    return { walk, spots };
  };

  let state = everyRoomReachable(kept);
  if (!state) {
    // an empty flat that does not connect means the shell itself is wrong
    throw new Error('generated shell is not connected');
  }

  for (const room of rooms) {
    const box = room.type === 'living'
      ? { x: 0, z: room.z, w: W, d: room.d }
      : { x: CORRIDOR_W, z: room.z, w: roomW, d: room.d };
    for (const piece of candidates(room, box)) {
      const next = everyRoomReachable([...kept, piece]);
      if (next) {
        kept.push({ ...piece, room: room.id });
        state = next;
      }
    }
  }

  rooms.forEach((room, i) => {
    room.view.x = state.spots[i].x;
    room.view.z = state.spots[i].z;
  });

  return {
    W,
    D,
    H: CEIL,
    walls,
    solids: kept,
    rooms,
    window: { x0: winX0, x1: winX1, z: D },
    balcony: spec.balcony,
    view: spec.view,
    spec,
    entry: { x: entryX, z: 0 },
    spawn,
    area: Math.round(W * D),
    canStand: state.walk,
  };
}

/* ── furniture ────────────────────────────────────────────────────────────── */

/**
 * Candidate pieces for a room, in the order we would like to keep them.
 * Nothing here is final: each one is only kept if the flat still walks.
 */
function candidates(room, box) {
  const { x, z, w, d } = box;
  const far = x + w;
  const out = [];

  if (room.type === 'bedroom') {
    const bedW = room.master ? 1.6 : 1.0;
    const bedL = room.master ? 2.0 : 1.9;
    out.push({ kind: 'bed', master: room.master, x: far - bedL - 0.06, z: z + d / 2 - bedW / 2, w: bedL, d: bedW });
    out.push({ kind: 'wardrobe', x: x + 0.12, z: z + d - 0.68, w: Math.min(1.6, w - 0.6), d: 0.6 });
    out.push({ kind: 'bedside', x: far - 0.5, z: z + d / 2 + bedW / 2 + 0.06, w: 0.42, d: 0.4 });
  } else if (room.type === 'bath') {
    out.push({ kind: 'shower', x: far - 1.0, z: z + 0.08, w: 0.95, d: 1.0 });
    out.push({ kind: 'wc', x: far - 0.68, z: z + d - 0.68, w: 0.6, d: 0.6 });
    out.push({ kind: 'vanity', x: x + 0.14, z: z + d - 0.66, w: Math.min(0.95, w - 0.9), d: 0.55 });
  } else if (room.type === 'kitchen') {
    out.push({ kind: 'counter', x: far - 0.64, z: z + 0.12, w: 0.62, d: Math.min(2.2, d - 0.3) });
    out.push({ kind: 'counter', x: x + 0.16, z: z + d - 0.7, w: Math.min(1.5, w - 1.0), d: 0.6 });
  } else if (room.type === 'living') {
    // the corridor empties into this room, so its mouth has to stay clear
    const clearZ = z + 1.3;
    const sofaLen = clamp(Math.min(1.9, d - 2.2), 1.0, 1.9);
    out.push({
      kind: 'sofa',
      x: x + 0.12,
      z: clamp(z + d - 2.3, clearZ, z + d - sofaLen - 0.25),
      w: 0.85,
      d: sofaLen,
    });
    if (room.openKitchen) {
      out.push({
        kind: 'kitchen-run',
        x: far - 0.64,
        z: z + 0.35,
        w: 0.62,
        d: clamp(Math.min(2.4, d - 1.8), 1.1, 2.4),
      });
    }
    if (w > 4.0) out.push({ kind: 'dining', x: x + w / 2 - 0.55, z: z + 0.6, w: 1.1, d: 1.0 });
    out.push({ kind: 'coffee', x: x + 1.2, z: clamp(z + d - 1.9, clearZ + 0.3, z + d - 0.9), w: 0.5, d: 0.5 });
  }

  return out.filter((f) => f.w > 0.3 && f.d > 0.3 && f.x >= x - 0.01 && f.x + f.w <= far + 0.01 && f.z >= z - 0.01 && f.z + f.d <= z + d + 0.01);
}

/* ── collision and reachability ───────────────────────────────────────────── */

const RADIUS = 0.25;
const GRID = 0.1;

export function makeWalker(W, D, wallBoxes, solids) {
  const boxes = [...wallBoxes, ...solids.map((s) => ({ minX: s.x, maxX: s.x + s.w, minZ: s.z, maxZ: s.z + s.d }))];
  return function canStand(px, pz, radius = RADIUS) {
    if (px < radius || pz < radius || px > W - radius || pz > D - radius) return false;
    for (const b of boxes) {
      if (px + radius > b.minX && px - radius < b.maxX && pz + radius > b.minZ && pz - radius < b.maxZ) {
        return false;
      }
    }
    return true;
  };
}

/** Every cell you can walk to from the front door, on a 10cm grid. */
export function reachable(canStand, W, D, from) {
  const cols = Math.ceil(W / GRID);
  const rows = Math.ceil(D / GRID);
  const seen = new Uint8Array(cols * rows);
  const sx = Math.round(from.x / GRID);
  const sz = Math.round(from.z / GRID);
  if (sx < 0 || sz < 0 || sx >= cols || sz >= rows) return seen;
  if (!canStand(sx * GRID, sz * GRID)) return seen;

  const queue = [sx + sz * cols];
  seen[queue[0]] = 1;
  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head];
    const cx = idx % cols;
    const cz = (idx - cx) / cols;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
      const n = nx + nz * cols;
      if (seen[n] || !canStand(nx * GRID, nz * GRID)) continue;
      seen[n] = 1;
      queue.push(n);
    }
  }
  seen.cols = cols;
  return seen;
}

/** The reachable cell inside a room that sits closest to where we would like to stand. */
export function standIn(seen, W, room, hint) {
  const cols = seen.cols;
  let best = null;
  let bestDist = Infinity;
  const x0 = Math.ceil((room.x + 0.3) / GRID);
  const x1 = Math.floor((room.x + room.w - 0.3) / GRID);
  const z0 = Math.ceil((room.z + 0.3) / GRID);
  const z1 = Math.floor((room.z + room.d - 0.3) / GRID);
  for (let cz = z0; cz <= z1; cz++) {
    for (let cx = x0; cx <= x1; cx++) {
      if (!seen[cx + cz * cols]) continue;
      const px = cx * GRID;
      const pz = cz * GRID;
      const dist = (px - hint.x) ** 2 + (pz - hint.z) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: px, z: pz };
      }
    }
  }
  return best;
}
