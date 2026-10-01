/**
 * A tap is a press that neither moved nor lingered. Measured on the screen,
 * not in the world: while the city is being dragged the world point under
 * the finger hardly changes, and a drag would read as a tap on wherever it
 * ended. Anything else is a drag and selects nothing.
 */
const TAP_MS = 500;
const TAP_PX = 10;

/**
 * Pointer handlers for a scene object that can be tapped. Each call owns its
 * own press record, so a press that starts on one object and ends on another
 * is not a tap on either.
 */
export function tapHandlers(onTap) {
  let press = null;
  return {
    onPointerDown: (e) => {
      const n = e.nativeEvent ?? e;
      press = { x: n.clientX, y: n.clientY, at: performance.now() };
    },
    onPointerUp: (e) => {
      const p = press;
      press = null;
      if (!p) return;
      const n = e.nativeEvent ?? e;
      if (performance.now() - p.at > TAP_MS) return;
      if (Math.hypot(n.clientX - p.x, n.clientY - p.y) > TAP_PX) return;
      /* After the pointer comes up the browser still dispatches a `click`
         at the same spot. If the tap has already swapped the screen, that
         click lands on whatever is now under the finger — a tap on a lot
         opened the board and, in the same breath, the ticket for the row
         beneath. Act on the next tick, once the click has gone by. */
      setTimeout(() => onTap(e), 0);
    },
  };
}
