import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BUILDINGS, MAP_H, MAP_W, isWalkable } from '../world/map-data';
import VoxelPerson from './VoxelPerson';
import { labelTexture } from './textures';
import { input } from './controls';
import { setPlayerPos } from './playerPos';

const SPEED = 4.4; // tiles per second
const RADIUS = 0.3;
const MAX_STEP = 0.03; // seconds per collision sub-step
const CAM_OFFSET = [0, 11.5, 11.5];
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

/** Doorways are one tile wide, so each door carries the side it opens onto. */
const DOORS = BUILDINGS.map((b) => ({
  building: b,
  cx: b.door.x + 0.5,
  cz: b.door.y + 0.5,
  // -1 when the entrance faces north (towards smaller z), +1 when it faces south
  facing: b.door.y === b.y ? -1 : 1,
}));

/**
 * Drives the avatar from the shared input, slides along walls, steers into
 * doorways, follows with the camera and reports which venue is underfoot.
 */
export default function Player({ avatarSkin, label, startTile, onEnterDoor, onNearDoor, onMove }) {
  const { camera } = useThree();
  const pos = useRef({ x: startTile.x + 0.5, z: startTile.y + 0.5 });
  const motion = useRef({ moving: false, facing: 0 });
  const group = useRef();
  const enteredRef = useRef(false);
  const nearRef = useRef(null);
  const camReady = useRef(false);
  const nameTag = useMemo(() => labelTexture(label), [label]);

  useFrame((_, rawDelta) => {
    // a long frame is walked in small sub-steps: capping it outright would make
    // the avatar crawl on a slow device, skipping the cap would tunnel walls
    const delta = Math.min(0.25, rawDelta);

    let vx = input.x;
    let vz = input.z;
    const len = Math.hypot(vx, vz);
    if (len > 1) {
      vx /= len;
      vz /= len;
    }
    const isMoving = len > 0.08;
    motion.current.moving = isMoving;

    // nearest doorway, measured before moving so we can steer towards it
    let door = null;
    let doorDist = Infinity;
    for (const d of DOORS) {
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
        const step = SPEED * stepDelta;
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
      motion.current.facing = Math.atan2(-vx, -vz);
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
    camera.lookAt(pos.current.x, 0.9, pos.current.z - 1.2);
    camReady.current = true;

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
    <group ref={group} position={[pos.current.x, 0, pos.current.z]}>
      <VoxelPerson skin={avatarSkin} motion={motion} scale={1.15} />
      <sprite position={[0, 2.1, 0]} scale={[1.5, 0.375, 1]}>
        <spriteMaterial map={nameTag} transparent depthTest={false} />
      </sprite>
    </group>
  );
}
