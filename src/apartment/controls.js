/**
 * Walking and looking live outside React: the joystick, the keyboard and the
 * drag-to-look layer all write here, and the render loop reads it. Nothing
 * re-renders while you move.
 */
export const move = { x: 0, z: 0 };
export const look = { yaw: Math.PI, pitch: 0 };
export const pose = { x: 3.35, z: 0.75 };

/** Queued teleport — the render loop picks it up and clears it. */
export const jump = { to: null };

export const setMove = (x, z) => {
  move.x = x;
  move.z = z;
};

export const addLook = (dYaw, dPitch) => {
  look.yaw -= dYaw;
  look.pitch = Math.max(-1.1, Math.min(1.1, look.pitch - dPitch));
};

export const goTo = (zone) => {
  jump.to = zone;
};

const KEYS = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
};

export function attachKeyboard() {
  const held = new Set();
  const apply = () => {
    let x = 0;
    let z = 0;
    for (const k of held) {
      const v = KEYS[k];
      if (!v) continue;
      x += v[0];
      z += v[1];
    }
    const len = Math.hypot(x, z);
    setMove(len > 1 ? x / len : x, len > 1 ? z / len : z);
  };
  const down = (e) => {
    if (!KEYS[e.key]) return;
    e.preventDefault();
    held.add(e.key);
    apply();
  };
  const up = (e) => {
    if (!KEYS[e.key]) return;
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
