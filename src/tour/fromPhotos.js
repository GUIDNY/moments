import { CORRIDOR_W, WALL_T, makeWalker, reachable, standIn } from './generate';

/**
 * A surveyed home in, a walkable flat out.
 *
 * The sibling of `generate.js`, and the one that matters: `generate.js` builds
 * a plausible flat from a slider, this one builds *the* flat from what the
 * photographs actually showed. Every number here came off a photograph — how
 * big each room is, how high its ceiling, what colour its walls and floor,
 * where its windows sit, what furniture stands against which wall.
 *
 * The layout is still a spine, because a spine is always connected and we
 * cannot see from photographs how the rooms join up. What the photographs *can*
 * tell us is each room's size, and that is what a person feels when they walk
 * in: a cramped bathroom and a long living room read as themselves even if the
 * corridor they hang off is our invention rather than the builder's.
 *
 * Room area is preserved rather than width and depth separately. Stretching
 * every room to the corridor's width and giving back the difference in depth
 * keeps the rectangle clean, keeps the flat's total area honest, and keeps the
 * small rooms small.
 */

const DOOR_W = 0.85;
const ENTRY_W = 0.9;
const GRID = 0.1;

/** Things you stand on rather than walk around. */
const PASSABLE = new Set(['rug']);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const median = (xs, fallback) => {
  if (!xs.length) return fallback;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Rooms you walk through to get somewhere else, rather than stopping in. */
const isThrough = (kind) => kind === 'entry' || kind === 'hall';
/** The room the corridor opens into at the far end. */
const isOpenEnd = (kind) => kind === 'living' || kind === 'dining';

/** Footprint of a piece, from what it is and how long the survey said it was. */
const FOOTPRINT = {
  bed: (l) => [clamp(l, 0.9, 2.2), clamp(l * 0.8, 0.9, 2.1)],
  wardrobe: (l) => [clamp(l, 0.8, 2.6), 0.6],
  bedside: () => [0.44, 0.4],
  sofa: (l) => [clamp(l, 1.2, 3.2), 0.88],
  armchair: () => [0.78, 0.8],
  'coffee-table': (l) => [clamp(l, 0.6, 1.4), 0.6],
  'dining-table': (l) => [clamp(l, 0.9, 2.2), 0.95],
  tv: (l) => [clamp(l, 0.8, 1.8), 0.12],
  rug: (l) => [clamp(l, 1.2, 3.0), clamp(l * 0.7, 0.9, 2.2)],
  bookshelf: (l) => [clamp(l, 0.6, 2.4), 0.34],
  desk: (l) => [clamp(l, 0.9, 1.8), 0.6],
  counter: (l) => [clamp(l, 0.9, 3.4), 0.62],
  island: (l) => [clamp(l, 1.0, 2.4), 0.9],
  fridge: () => [0.7, 0.68],
  shower: () => [0.95, 0.95],
  bathtub: (l) => [clamp(l, 1.4, 1.8), 0.75],
  wc: () => [0.6, 0.68],
  vanity: (l) => [clamp(l, 0.5, 1.4), 0.52],
  plant: () => [0.42, 0.42],
};

/**
 * Put a piece against the wall the survey named.
 *
 * "Left" and "far" only mean anything relative to the door you came in by, and
 * the two kinds of room here are entered from different directions: a room off
 * the corridor is entered along x, while the room at the end of the flat — or
 * the single room of a flat with no corridor — is entered along z. `facing`
 * says which, and the wall names are read in that frame.
 *
 * Which way a piece runs matters more than it sounds. A sofa against the left
 * wall lies one way; the same sofa against the far wall lies across it.
 * Measuring its length against the wrong axis is how a two-metre sofa ends up
 * through the wall of a room that is wide enough one way and not the other.
 */
function place(piece, box, facing = 'x') {
  const [length, depth] = (FOOTPRINT[piece.kind] || ((l) => [clamp(l, 0.3, 2), 0.6]))(piece.lengthM);
  const { x, z, w, d } = box;
  const gap = 0.06;
  const wall = piece.wall || 'centre';

  // entering along x, the side walls run along x; entering along z, they run along z
  const alongX = facing === 'x'
    ? wall === 'left' || wall === 'right' || wall === 'centre'
    : wall === 'far' || wall === 'near' || wall === 'centre';
  const spanAlong = alongX ? w : d;
  const spanAcross = alongX ? d : w;

  // a piece longer than the room it was seen in came from a misjudged length;
  // trim it rather than drop it, and leave a person room to get past
  const L = Math.min(length, spanAlong - 0.4);
  const T = Math.min(depth, spanAcross - 0.4);
  if (L <= 0.2 || T <= 0.2) return null;

  // which edge of the room this wall is, in the room's own coordinates
  const EDGES = {
    x: { far: '+x', near: '-x', left: '-z', right: '+z' },
    z: { far: '+z', near: '-z', left: '+x', right: '-x' },
  };
  const edge = EDGES[facing][wall];

  let spot;
  switch (edge) {
    case '+x':
      spot = { x: x + w - T - gap, z: z + d / 2 - L / 2, w: T, d: L };
      break;
    case '-x':
      spot = { x: x + gap, z: z + d / 2 - L / 2, w: T, d: L };
      break;
    case '-z':
      spot = { x: x + w / 2 - L / 2, z: z + gap, w: L, d: T };
      break;
    case '+z':
      spot = { x: x + w / 2 - L / 2, z: z + d - T - gap, w: L, d: T };
      break;
    default:
      spot = alongX
        ? { x: x + w / 2 - L / 2, z: z + d / 2 - T / 2, w: L, d: T }
        : { x: x + w / 2 - T / 2, z: z + d / 2 - L / 2, w: T, d: L };
      break;
  }

  // and whatever the arithmetic said, it stays inside the room
  spot.x = clamp(spot.x, x, x + w - spot.w);
  spot.z = clamp(spot.z, z, z + d - spot.d);
  return spot.w > 0.15 && spot.d > 0.15 ? spot : null;
}

/**
 * A room hangs off the corridor on one side or the other, and a room on the
 * left meets you the other way round. Rotating its local layout by half a turn
 * puts its door where the corridor actually is, and keeps left and right the
 * right way round inside it — a mirror alone would swap them.
 */
const toWorld = (spot, room) =>
  room.flip
    ? {
        ...spot,
        x: room.x + (room.w - spot.x - spot.w),
        z: room.z + (room.d - spot.z - spot.d),
      }
    : { ...spot, x: room.x + spot.x, z: room.z + spot.z };

/**
 * The yaw that looks from one point towards another.
 *
 * The camera is set with `rotation.set(pitch, yaw, 0, 'YXZ')`, and a three.js
 * camera looks down its own -Z, so a yaw of θ points along (-sin θ, -cos θ).
 */
const aimAt = (from, to) => Math.atan2(-(to.x - from.x), -(to.z - from.z));

/** Eyes a few degrees below level, the way anyone looks around a room. */
const VIEW_PITCH = -0.13;

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.z < b.z + b.d && a.z + a.d > b.z;

/**
 * Slide a piece along its own wall until it stops blocking the doorway.
 *
 * Without this, a sofa the survey saw against the wall the door is in gets
 * placed squarely across that door, the reachability check quite rightly
 * refuses it, and the room loses its sofa — the one piece of furniture the
 * photograph was clearest about. Sliding keeps the piece on the wall it was
 * seen on and simply moves it up the wall, which is what anyone would do.
 */
function slideClear(spot, doorway, box) {
  if (!doorway || !overlaps(spot, doorway)) return spot;
  const alongX = spot.w >= spot.d;
  for (const dir of [1, -1]) {
    const moved = { ...spot };
    if (alongX) {
      moved.x = dir > 0 ? doorway.x + doorway.w + 0.05 : doorway.x - spot.w - 0.05;
      if (moved.x < box.x || moved.x + spot.w > box.x + box.w) continue;
    } else {
      moved.z = dir > 0 ? doorway.z + doorway.d + 0.05 : doorway.z - spot.d - 0.05;
      if (moved.z < box.z || moved.z + spot.d > box.z + box.d) continue;
    }
    if (!overlaps(moved, doorway)) return moved;
  }
  // nowhere on this wall clears the door; hand back the original and let the
  // reachability check have the final say, as it does for every other piece
  return spot;
}

export function planFromObservation(observation) {
  const byId = new Map(observation.rooms.map((r) => [r.id, r]));
  const ordered = observation.order.map((id) => byId.get(id)).filter(Boolean);
  if (!ordered.length) throw new Error('no rooms to build');

  const CEIL = clamp(median(ordered.map((r) => r.ceilingM), 2.6), 2.3, 3.4);

  const endRoom = [...ordered].reverse().find((r) => isOpenEnd(r.kind)) || ordered[ordered.length - 1];
  const stacked = ordered.filter((r) => r !== endRoom && !isThrough(r.kind));
  const roomW = clamp(median(stacked.map((r) => r.widthM), 3.2), 2.2, 4.6);

  /* How many rooms hang off the corridor decides what shape the flat is.
     Stacked end to end, a seven-room flat comes out twenty-six metres long — a
     corridor nobody has ever walked down — so from three rooms up they line
     both sides. Below that the opposite mistake waits: a studio given two
     columns and a corridor becomes a wide, shallow slot with nowhere to stand.
     A studio is just its room. */
  const sides = stacked.length >= 3 ? 2 : stacked.length >= 1 ? 1 : 0;
  const leftW = sides === 2 ? roomW : 0;
  const corridorW = sides === 0 ? 0 : CORRIDOR_W;
  const rightW = sides === 0 ? clamp(endRoom.widthM, 2.4, 9) : roomW;
  const CORR_X0 = leftW;
  const CORR_X1 = leftW + corridorW;
  const W = leftW + corridorW + rightW;

  const entryD = 0.4;
  const depthOf = (room, across) => clamp((room.widthM * room.depthM) / across, 1.8, 6.5);

  /* fill whichever column is currently shorter, so the two stay level */
  const columns = [
    ...(sides === 2 ? [{ side: 'left', z: entryD, rooms: [] }] : []),
    ...(sides >= 1 ? [{ side: 'right', z: entryD, rooms: [] }] : []),
  ];
  for (const room of stacked) {
    const col = columns.reduce((a, b) => (a.z <= b.z ? a : b));
    const depth = depthOf(room, roomW);
    col.rooms.push({ room, z0: col.z, depth });
    col.z += depth;
  }

  // the shorter column's last room takes up the slack, or the flat has a void
  const runTo = columns.length ? Math.max(...columns.map((c) => c.z)) : entryD;
  for (const col of columns) {
    const last = col.rooms[col.rooms.length - 1];
    if (last && col.z < runTo) last.depth += runTo - col.z;
  }

  // a room shallower than about two and a half metres is one you cannot stand
  // back in, so the far room keeps its depth even when that costs a little area
  const endD = clamp(Math.max(depthOf(endRoom, W), endRoom.depthM * 0.75), 2.4, 9);
  const D = Math.max(runTo, entryD) + endD;

  const walls = [];
  const seg = (x1, z1, x2, z2, o = {}) =>
    walls.push({
      x1, z1, x2, z2,
      y0: o.y0 ?? 0,
      h: o.h ?? CEIL,
      mat: o.mat ?? 'plaster',
      solid: o.solid ?? true,
      color: o.color,
    });

  /* shell */
  const entryX = sides === 0 ? W / 2 : (CORR_X0 + CORR_X1) / 2;
  const shellColor = endRoom.wallColor;
  seg(0, 0, entryX - ENTRY_W / 2, 0, { color: shellColor });
  seg(entryX + ENTRY_W / 2, 0, W, 0, { color: shellColor });
  seg(entryX - ENTRY_W / 2, 0, entryX + ENTRY_W / 2, 0, { y0: 2.1, h: CEIL - 2.1, color: shellColor });
  // the two long side walls are held back until the rooms have said where
  // their windows are — a bedroom without one is a cell, not a bedroom
  const sideOpenings = { left: [], right: [] };

  const rooms = [];

  for (const col of columns) {
    const left = col.side === 'left';
    const corridorEdge = left ? CORR_X0 : CORR_X1;
    const roomX = left ? 0 : CORR_X1;

    for (const { room, z0, depth } of col.rooms) {
      const z1 = z0 + depth;
      const doorZ = z0 + depth / 2;

      // the corridor wall, with this room's doorway cut into it
      seg(corridorEdge, z0, corridorEdge, doorZ - DOOR_W / 2, { color: room.wallColor });
      seg(corridorEdge, doorZ + DOOR_W / 2, corridorEdge, z1, { color: room.wallColor });
      seg(corridorEdge, doorZ - DOOR_W / 2, corridorEdge, doorZ + DOOR_W / 2, {
        y0: 2.1, h: CEIL - 2.1, color: room.wallColor,
      });
      // and the wall between this room and the next one down the column
      if (z1 < runTo - 0.01) {
        seg(roomX, z1, roomX + roomW, z1, { color: room.wallColor });
      }

      /* Where a person would stand to see the room, not where the door is.
         Straight in from the doorway you face the opposite wall across the
         room's *narrow* side, which in a bedroom is a metre of wall and the
         end of a bed. Standing to one side at the near end and looking down
         the diagonal is what an estate agent's camera does, and it is the only
         angle that puts a whole room in one frame. */
      const near = { x: roomX + (left ? roomW - 0.75 : 0.75), z: z0 + 0.75 };
      const farCorner = { x: roomX + (left ? 0.45 : roomW - 0.45), z: z1 - 0.5 };

      /* Its window goes in the outer wall, the only wall of a side room that
         faces the world. The survey says how wide it was and how high it sat;
         which wall of the room it was on cannot survive the rearranging, so it
         is centred on the run this room occupies. */
      const seen = (room.windows || [])[0];
      if (seen && depth > 1.3) {
        const openW = clamp(seen.widthM, 0.6, depth - 0.7);
        const mid = z0 + depth / 2;
        sideOpenings[left ? 'left' : 'right'].push({
          z0: mid - openW / 2,
          z1: mid + openW / 2,
          sill: clamp(seen.sillM, 0, 1.5),
          head: clamp(seen.headM, clamp(seen.sillM, 0, 1.5) + 0.6, CEIL - 0.05),
        });
      }

      rooms.push({
        id: room.id,
        type: room.kind,
        observed: room,
        flip: left,
        x: roomX, z: z0, w: roomW, d: depth,
        door: { x: corridorEdge, z: doorZ },
        view: { x: near.x, z: near.z, yaw: aimAt(near, farCorner), pitch: VIEW_PITCH },
        lookAt: farCorner,
      });
    }
  }

  /* the far end, open to the corridor across the full width */
  const endZ0 = Math.max(runTo, entryD);
  if (endZ0 > entryD + 0.01) {
    seg(0, endZ0, CORR_X0, endZ0, { color: endRoom.wallColor });
    seg(CORR_X1, endZ0, W, endZ0, { color: endRoom.wallColor });
  }
  const endNear = { x: W * 0.3, z: endZ0 + 0.7 };
  const endFar = { x: W * 0.62, z: endZ0 + endD - 0.5 };
  rooms.push({
    id: endRoom.id,
    type: endRoom.kind,
    observed: endRoom,
    flip: false,
    x: 0, z: endZ0, w: W, d: endD,
    door: { x: entryX, z: endZ0 },
    view: { x: endNear.x, z: endNear.z, yaw: aimAt(endNear, endFar), pitch: VIEW_PITCH },
    lookAt: endFar,
  });

  /* now the side walls can be built, in runs between their windows */
  const sideWall = (xConst, openings) => {
    let at = 0;
    for (const o of [...openings].sort((a, b) => a.z0 - b.z0)) {
      if (o.z0 > at + 0.01) seg(xConst, at, xConst, o.z0, { color: shellColor });
      if (o.sill > 0.02) seg(xConst, o.z0, xConst, o.z1, { h: o.sill, color: shellColor });
      if (o.head < CEIL - 0.02) {
        seg(xConst, o.z0, xConst, o.z1, { y0: o.head, h: CEIL - o.head, color: shellColor });
      }
      at = Math.max(at, o.z1);
    }
    if (at < D - 0.01) seg(xConst, at, xConst, D, { color: shellColor });
  };
  sideWall(0, sideOpenings.left);
  sideWall(W, sideOpenings.right);

  /* the window wall, cut where the far room said its windows were */
  const endWindows = (endRoom.windows || []).filter((w) => w.wall === 'far' || w.wall === 'centre');
  const winW = clamp(endWindows[0]?.widthM ?? W * 0.62, 0.8, W - 0.8);
  const sill = clamp(endWindows[0]?.sillM ?? 0.4, 0, 1.4);
  const head = clamp(endWindows[0]?.headM ?? CEIL - 0.3, sill + 0.6, CEIL);
  const winX0 = (W - winW) / 2;
  const winX1 = winX0 + winW;
  seg(0, D, winX0, D, { color: shellColor });
  seg(winX1, D, W, D, { color: shellColor });
  if (sill > 0.02) seg(winX0, D, winX1, D, { h: sill, color: shellColor });
  if (head < CEIL - 0.02) seg(winX0, D, winX1, D, { y0: head, h: CEIL - head, color: shellColor });

  /* furniture has to earn its place */
  const wallBoxes = walls
    .filter((s) => s.solid && s.y0 < 1.7)
    .map((s) => ({
      minX: Math.min(s.x1, s.x2) - WALL_T / 2,
      maxX: Math.max(s.x1, s.x2) + WALL_T / 2,
      minZ: Math.min(s.z1, s.z2) - WALL_T / 2,
      maxZ: Math.max(s.z1, s.z2) + WALL_T / 2,
    }));

  const spawn = { x: entryX, z: 0.8, yaw: Math.PI };
  const kept = [];

  const everyRoomReachable = (furniture) => {
    // a rug is something you walk on, not into — counting it as a solid would
    // wall off the middle of the very rooms it decorates
    const walk = makeWalker(W, D, wallBoxes, furniture.filter((f) => !PASSABLE.has(f.kind)));
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
  if (!state) throw new Error('surveyed shell is not connected');

  for (const room of rooms) {
    // the corridor empties into the far room, so its mouth stays clear
    const isEnd = room.w === W;
    const mouth = isEnd && sides > 0 ? 1.2 : 0;
    const local = { x: 0, z: mouth, w: room.w, d: room.d - mouth };
    if (local.d < 1.0 || local.w < 1.0) continue;

    /* Where you come in, in the room's own frame. A side room's door is in the
       middle of its -x edge; the only room of a flat with no corridor has the
       front door in its near wall. The corridor's mouth is already cleared. */
    const doorway = isEnd
      ? sides > 0
        ? null
        : { x: entryX - ENTRY_W / 2 - 0.2, z: 0, w: ENTRY_W + 0.4, d: 1.3 }
      : { x: 0, z: room.d / 2 - DOOR_W / 2 - 0.2, w: 0.9, d: DOOR_W + 0.4 };

    for (const piece of room.observed.furniture || []) {
      const raw = place(piece, local, isEnd ? 'z' : 'x');
      if (!raw) continue;
      const spot = slideClear(raw, doorway, local);
      if (!spot) continue;
      const solid = { ...toWorld(spot, room), kind: piece.kind, color: piece.color, room: room.id };
      const next = everyRoomReachable([...kept, solid]);
      if (next) {
        kept.push(solid);
        state = next;
      }
    }
  }

  rooms.forEach((room, i) => {
    room.view.x = state.spots[i].x;
    room.view.z = state.spots[i].z;
    // the spot moved to dodge the furniture, so the angle is re-taken from it
    if (room.lookAt) room.view.yaw = aimAt(room.view, room.lookAt);
  });

  return {
    W, D, H: CEIL,
    walls,
    solids: kept,
    rooms,
    corridor: { x0: CORR_X0, x1: CORR_X1 },
    window: { x0: winX0, x1: winX1, z: D, sill, head },
    openings: [
      { wall: 'far', a: winX0, b: winX1, at: D, sill, head },
      ...sideOpenings.left.map((o) => ({ wall: 'left', a: o.z0, b: o.z1, at: 0, sill: o.sill, head: o.head })),
      ...sideOpenings.right.map((o) => ({ wall: 'right', a: o.z0, b: o.z1, at: W, sill: o.sill, head: o.head })),
    ],
    fromPhotos: true,
    observation,
    entry: { x: entryX, z: 0 },
    spawn,
    area: Math.round(W * D),
    canStand: state.walk,
  };
}

export { GRID };
