/**
 * Where the camera should go next, published outside React the way the
 * player position used to be. A new tower sets it; the rig flies there and
 * clears it; a hand on the city clears it first.
 */
export const focus = { at: null, dist: null, zoomTo: null };

export function lookAt(x, z, dist = null) {
  focus.at = { x, z };
  focus.dist = dist;
  focus.zoomTo = null;
}

/**
 * Fly to a place and frame `span` world units of it: the zoom that fits a
 * district on the shorter side of the screen, whichever way the screen is
 * held. The camera clamps it to its own limits.
 */
export function frame(x, z, span, viewport = { w: window.innerWidth, h: window.innerHeight }) {
  focus.at = { x, z };
  focus.dist = null;
  // an isometric square of `span` units is about 1.5 span wide on the screen
  focus.zoomTo = (Math.min(viewport.w, viewport.h) * 0.82) / (span * 1.5);
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
