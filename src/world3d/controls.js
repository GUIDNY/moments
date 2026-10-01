/**
 * Movement input lives outside React: the joystick and the keyboard write into
 * this object and the render loop reads it, so dragging never re-renders the app.
 */
export const input = { x: 0, z: 0 };

export function setStick(x, z) {
  input.x = x;
  input.z = z;
}

const KEY_VECTORS = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
};

/** Attaches key handlers and returns a disposer. Keys and stick are summed. */
export function attachKeyboard() {
  const held = new Set();

  const apply = () => {
    let x = 0;
    let z = 0;
    for (const key of held) {
      const v = KEY_VECTORS[key];
      if (!v) continue;
      x += v[0];
      z += v[1];
    }
    const len = Math.hypot(x, z);
    input.x = len > 1 ? x / len : x;
    input.z = len > 1 ? z / len : z;
  };

  const down = (e) => {
    if (!KEY_VECTORS[e.key]) return;
    e.preventDefault();
    held.add(e.key);
    apply();
  };
  const up = (e) => {
    if (!KEY_VECTORS[e.key]) return;
    held.delete(e.key);
    apply();
  };
  const blur = () => {
    held.clear();
    apply();
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
    blur();
  };
}

/* ── tap to walk ──────────────────────────────────────────────────────────
   A phone has no arrow keys and a thumb on a joystick is a thing you do in a
   game, not in a portfolio. Tapping where you want to go is what everyone
   already knows. The route lives here, beside the stick, for the same
   reason the stick does: the render loop reads it every frame and nothing
   about walking should re-render the app. */
export const nav = { path: null, target: null };
// handy from the console, and what the phone test reads
if (typeof window !== 'undefined') window.__nav = nav;

/** `path` is the tiles still to visit, in order; empty or null clears it. */
export function setPath(path) {
  nav.path = path && path.length ? path : null;
  nav.target = nav.path ? nav.path[nav.path.length - 1] : null;
}

export const clearPath = () => setPath(null);
