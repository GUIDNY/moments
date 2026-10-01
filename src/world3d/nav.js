import { findPath } from '../world/map-data';
import { setPath } from './controls';
import { playerPos } from './playerPos';

/** Route the avatar to a tile from wherever it is standing now. */
export function walkTo(tile) {
  const path = findPath({ x: playerPos.x, y: playerPos.z }, tile);
  setPath(path);
  return Boolean(path);
}

/* A tap is a press that neither moved nor lingered. Anything else is the
   start of a drag or a long press and must not send the avatar anywhere. */
const TAP_MS = 450;
const TAP_DRIFT = 0.6; // world units

/**
 * Pointer handlers for a scene object that can be tapped to walk somewhere.
 * `where(event)` turns the hit into a tile. Each call owns its own press
 * record, so a press that starts on one object and ends on another is not a
 * tap on either.
 */
export function tapHandlers(where) {
  let press = null;
  return {
    onPointerDown: (e) => {
      press = { x: e.point.x, z: e.point.z, at: performance.now() };
    },
    onPointerUp: (e) => {
      const p = press;
      press = null;
      if (!p) return;
      if (performance.now() - p.at > TAP_MS) return;
      if (Math.hypot(e.point.x - p.x, e.point.z - p.z) > TAP_DRIFT) return;
      const tile = where(e);
      if (tile) walkTo(tile);
    },
  };
}
