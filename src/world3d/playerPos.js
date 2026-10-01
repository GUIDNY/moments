/**
 * The point the camera is looking at, shared outside React. The rig writes it
 * every frame; the minimap, the district chip and the signs that fade with
 * distance read it on their own schedule, so none of them re-renders the app
 * while you drag. It kept the walker's name because everything downstream
 * already called it that.
 */
export const playerPos = { x: 16.5, z: 14.5 };

export function setPlayerPos(x, z) {
  playerPos.x = x;
  playerPos.z = z;
  // handy from the console, and what the browser tests read
  if (typeof window !== 'undefined') window.__pos = playerPos;
}
