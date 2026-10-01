import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MAP_H, MAP_W, getBuildings, getVersion, isWalkable } from '../world/map-data';
import VoxelPerson from './VoxelPerson';
import { labelTexture } from './textures';
import { input, nav, setPath } from './controls';
import { setPlayerPos } from './playerPos';

const SPEED = 4.4; // tiles per second
const RADIUS = 0.3;
const MAX_STEP = 0.03; // seconds per collision sub-step
/* Higher and further back than before, and looking down more steeply: a
   diorama is seen from above, and at this distance a street is a street
   rather than three buildings and a kerb. */
const CAM_OFFSET = [0, 21, 17];
const PROMPT_RANGE = 1.7;
const ENTER_RANGE = 0.5;
const MAGNET_RANGE = 1.5;

/** True when a circle of `RADIUS` around (x, z) clears every blocked tile. */
function canStand(x, z) {
  for (const [ox, oz] of [
    [-RADIUS, -RADIUS],
    [RADIUS, -RADIUS],
    [-RADIUS, RADIUS],
    [RADIUS, RADIUS],
  ]) {
    if (!isWalkable(Math.floor(x + ox), Math.floor(z + oz))) return false;
  }
  return true;
}

/**
 * Drives the avatar from the shared input, slides along walls, steers into
 * doorways, follows with the camera and reports which venue is underfoot.
 */
export default function Player({ avatarSkin, label, startTile, onEnterDoor, onNearDoor, onMove }) {
  const { camera } = useThree();
  const pos = useRef({ x: startTile.x + 0.5, z: startTile.y + 0.5 });

  /* The city is relaid whenever a holding is added or sold, and the tile the
     avatar is standing on can become the inside of a new tower. A changed
     start tile therefore moves them, rather than only placing them once. */
  const placedAt = useRef(startTile);
  if (placedAt.current !== startTile) {
    placedAt.current = startTile;
    pos.current.x = startTile.x + 0.5;
    pos.current.z = startTile.y + 0.5;
    setPath(null); // the route was through streets that may no longer exist
  }
  const motion = useRef({ moving: false, facing: 0 });
  const group = useRef();
  const ring = useRef();
  const enteredRef = useRef(false);
  const nearRef = useRef(null);
  const camReady = useRef(false);
  const nameTag = useMemo(() => labelTexture(label), [label]);

  /* Doorways are one tile wide, so each door carries the side it opens onto.
     The city is rebuilt whenever the portfolio changes, so this is recomputed
     against the live map rather than frozen when the module loaded. */
  const doors = useMemo(
    () =>
      getBuildings().map((b) => ({
        building: b,
        cx: b.door.x + 0.5,
        cz: b.door.y + 0.5,
        // -1 when the entrance faces north (towards smaller z), +1 when south
        facing: b.door.y === b.y ? -1 : 1,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getVersion()]
  );

  useFrame((_, rawDelta) => {
    // a long frame is walked in small sub-steps: capping it outright would make
    // the avatar crawl on a slow device, skipping the cap would tunnel walls
    const delta = Math.min(0.25, rawDelta);

    let vx = input.x;
    let vz = input.z;
    let len = Math.hypot(vx, vz);
    if (len > 1) {
      vx /= len;
      vz /= len;
    }

    /* Tap-to-walk: with the stick idle, the avatar follows the route a tile
       at a time, aiming at each tile's centre. Touching the stick drops the
       route — a thumb always wins over a tap you made a moment ago. */
    if (len > 0.08 && nav.path) setPath(null);
    const routed = len <= 0.08 && Boolean(nav.path);
    if (routed) len = 1;
    const isMoving = len > 0.08;
    motion.current.moving = isMoving;

    // nearest doorway, measured before moving so we can steer towards it
    let door = null;
    let doorDist = Infinity;
    for (const d of doors) {
      const dist = Math.hypot(pos.current.x - d.cx, pos.current.z - d.cz);
      if (dist < doorDist) {
        doorDist = dist;
        door = d;
      }
    }

    if (isMoving) {
      const steps = Math.max(1, Math.ceil(delta / MAX_STEP));
      const stepDelta = delta / steps;
      // walking towards an entrance lines you up with it: the opening is a single
      // tile and the body is nearly as wide, so without this you scrape the wall
      // you walk *into* a doorway against the way it faces
      const heading = door && Math.sign(vz) === -door.facing && doorDist < MAGNET_RANGE;

      for (let i = 0; i < steps; i++) {
        let step = SPEED * stepDelta;
        /* A routed walk is steered per sub-step, not per frame, and never
           past the waypoint. On a slow device a frame is a quarter of a
           second — more than a whole tile — and a direction fixed for the
           frame overshot the tile's centre, turned round, overshot it again,
           and the avatar stood vibrating on the spot. */
        if (routed) {
          const next = nav.path?.[0];
          if (!next) break;
          const dx = next.x + 0.5 - pos.current.x;
          const dz = next.y + 0.5 - pos.current.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.02) {
            nav.path.shift();
            if (!nav.path.length) {
              setPath(null);
              break;
            }
            continue;
          }
          vx = dx / dist;
          vz = dz / dist;
          step = Math.min(step, dist);
        }
        const nx = pos.current.x + vx * step;
        const nz = pos.current.z + vz * step;
        // resolve each axis on its own so walls slide instead of sticking
        if (canStand(nx, pos.current.z)) pos.current.x = nx;
        if (canStand(pos.current.x, nz)) pos.current.z = nz;

        if (heading) {
          const off = door.cx - pos.current.x;
          if (Math.abs(off) > 0.01) {
            const pull = Math.sign(off) * Math.min(Math.abs(off), SPEED * stepDelta);
            if (canStand(pos.current.x + pull, pos.current.z)) pos.current.x += pull;
          }
        }
      }

      pos.current.x = Math.max(RADIUS, Math.min(MAP_W - RADIUS, pos.current.x));
      pos.current.z = Math.max(RADIUS, Math.min(MAP_H - RADIUS, pos.current.z));
      if (vx || vz) motion.current.facing = Math.atan2(-vx, -vz);
      // a routed walk that just ended leaves nothing to animate next frame
      if (routed && !nav.path) motion.current.moving = false;
    }

    if (group.current) {
      group.current.position.x = pos.current.x;
      group.current.position.z = pos.current.z;
    }

    // camera trails the player, snapping into place on the first frame
    const k = camReady.current ? Math.min(1, delta * 6) : 1;
    camera.position.x += (pos.current.x + CAM_OFFSET[0] - camera.position.x) * k;
    camera.position.y += (CAM_OFFSET[1] - camera.position.y) * k;
    camera.position.z += (pos.current.z + CAM_OFFSET[2] - camera.position.z) * k;
    camera.lookAt(pos.current.x, 0.9, pos.current.z - 2.2);
    camReady.current = true;

    // the destination marker sits on the tapped tile until you arrive
    if (ring.current) {
      const t = nav.target;
      ring.current.visible = Boolean(t);
      if (t) {
        ring.current.position.set(t.x + 0.5, 0.06, t.y + 0.5);
        const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;
        ring.current.scale.set(pulse, pulse, 1);
      }
    }

    // published for the minimap and the district label, and handy from the console
    setPlayerPos(pos.current.x, pos.current.z);
    if (typeof window !== 'undefined') window.__pos = { ...pos.current };

    const afterDist = door ? Math.hypot(pos.current.x - door.cx, pos.current.z - door.cz) : Infinity;

    if (door && afterDist < ENTER_RANGE && !enteredRef.current) {
      enteredRef.current = true;
      // step back out into the street when the player returns
      const b = door.building;
      onMove?.({ x: b.door.x, y: b.door.y + (door.facing === -1 ? -1 : 1) });
      onEnterDoor(b);
      return;
    }

    const nearId = door && afterDist < PROMPT_RANGE ? door.building.id : null;
    if (nearId !== nearRef.current) {
      nearRef.current = nearId;
      onNearDoor?.(nearId ? door.building : null);
    }
  });

  return (
    <>
      <group ref={group} position={[pos.current.x, 0, pos.current.z]}>
        <VoxelPerson skin={avatarSkin} motion={motion} scale={1.15} />
        <sprite position={[0, 2.1, 0]} scale={[1.5, 0.375, 1]}>
          <spriteMaterial map={nameTag} transparent depthTest={false} />
        </sprite>
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.42, 28]} />
        <meshBasicMaterial color="#ff6b1a" transparent opacity={0.85} />
      </mesh>
    </>
  );
}
