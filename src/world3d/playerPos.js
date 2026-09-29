/**
 * Where the player is, shared outside React — the same trick `controls.js` uses
 * for input. The render loop writes it every frame; the minimap and the header
 * read it on their own schedule, so neither one re-renders the app while you
 * walk.
 */
export const playerPos = { x: 16.5, z: 14.5 };

export function setPlayerPos(x, z) {
  playerPos.x = x;
  playerPos.z = z;
}
