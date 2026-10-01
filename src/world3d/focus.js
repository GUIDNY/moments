/**
 * Where the camera should go next, published outside React the way the
 * player position used to be. A new tower sets it; the rig flies there and
 * clears it; a hand on the city clears it first.
 */
export const focus = { at: null, dist: null };

export function lookAt(x, z, dist = null) {
  focus.at = { x, z };
  focus.dist = dist;
}
