/**
 * Where the camera should go next, published outside React the way the
 * player position used to be. A new tower sets it; the rig flies there and
 * clears it; a hand on the city clears it first.
 */
export const focus = { at: null, dist: null, zoomTo: null };

export function lookAt(x, z, dist = null) {
  focus.at = { x, z };
  focus.dist = dist;
}

/** A zoom request from the chrome: a magnification, so 1.25 is closer and 0.8 further. */
export const zoom = { by: null, home: false };
export function zoomBy(factor) {
  zoom.by = (zoom.by ?? 1) * factor;
}
/** The "home" button: back to the middle of the board at the starting zoom. */
export function goHome() {
  zoom.home = true;
}
