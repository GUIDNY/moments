import { useCallback, useEffect, useRef, useState } from 'react';
import { setStick } from './controls';

const RADIUS = 52;

/** Drag-anywhere-in-the-ring stick, the same shape the reference world uses. */
export default function Joystick() {
  const baseRef = useRef(null);
  const pointerRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = useCallback((clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    setStick(dx / RADIUS, dy / RADIUS);
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
      className="absolute bottom-8 left-6 w-32 h-32 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm touch-none select-none z-20"
      onMouseDown={(e) => {
        pointerRef.current = 'mouse';
        move(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        pointerRef.current = t.identifier;
        move(t.clientX, t.clientY);
      }}
      role="application"
      aria-label="ג׳ויסטיק תנועה"
    >
      <span
        className="absolute top-1/2 left-1/2 w-14 h-14 -mt-7 -ml-7 rounded-full bg-white/80 shadow-lg pointer-events-none"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
