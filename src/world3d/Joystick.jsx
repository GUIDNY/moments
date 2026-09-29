import { useCallback, useEffect, useRef, useState } from 'react';
import { setStick } from './controls';

// travel of the knob, in px. The ring is drawn a little larger than this.
const RADIUS = 44;

/** Drag-anywhere-in-the-ring stick, the same shape the reference world uses. */
export default function Joystick({ raised = false }) {
  const baseRef = useRef(null);
  const pointerRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = useCallback((clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // the ring is sized in CSS, so take the travel from the element itself —
    // that keeps phone and desktop feeling identical at different sizes
    const radius = Math.max(24, rect.width / 2 - 14) || RADIUS;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setKnob({ x: dx, y: dy });
    setStick(dx / radius, dy / radius);
  }, []);

  const release = useCallback(() => {
    pointerRef.current = null;
    setKnob({ x: 0, y: 0 });
    setStick(0, 0);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (pointerRef.current === null) return;
      const touch = e.touches ? [...e.touches].find((t) => t.identifier === pointerRef.current) : e;
      if (!touch) return;
      e.preventDefault();
      move(touch.clientX, touch.clientY);
    };
    const onUp = (e) => {
      if (pointerRef.current === null) return;
      if (e.changedTouches && ![...e.changedTouches].some((t) => t.identifier === pointerRef.current)) return;
      release();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [move, release]);

  useEffect(() => () => setStick(0, 0), []);

  return (
    <div
      ref={baseRef}
      className="ui-layer absolute w-[104px] h-[104px] md:w-32 md:h-32 rounded-full
        bg-white/[0.07] border border-white/20 backdrop-blur-sm touch-none select-none z-20
        start-[calc(1rem+env(safe-area-inset-left,0px))] md:start-6
        transition-[bottom] duration-300 ease-out"
      onMouseDown={(e) => {
        pointerRef.current = 'mouse';
        move(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        pointerRef.current = t.identifier;
        move(t.clientX, t.clientY);
      }}
      style={{
        bottom: raised
          ? 'calc(var(--dock, 0px) + 1rem + env(safe-area-inset-bottom, 0px))'
          : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
      }}
      role="application"
      aria-label="Move"
    >
      <span
        className="absolute top-1/2 left-1/2 w-11 h-11 md:w-14 md:h-14 -mt-[22px] -ms-[22px] md:-mt-7 md:-ms-7
          rounded-full bg-white/70 shadow-lg pointer-events-none"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
