import { useCallback, useEffect, useRef, useState } from 'react';
import { setMove } from './controls';

/** Drag ring for walking. Self-contained — it shares nothing with the game. */
export default function Stick() {
  const baseRef = useRef(null);
  const pointerRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const apply = useCallback((clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const radius = Math.max(22, r.width / 2 - 14);
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setKnob({ x: dx, y: dy });
    setMove(dx / radius, dy / radius);
  }, []);

  const release = useCallback(() => {
    pointerRef.current = null;
    setKnob({ x: 0, y: 0 });
    setMove(0, 0);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (pointerRef.current === null) return;
      const t = e.touches ? [...e.touches].find((x) => x.identifier === pointerRef.current) : e;
      if (!t) return;
      e.preventDefault();
      apply(t.clientX, t.clientY);
    };
    const onUp = (e) => {
      if (pointerRef.current === null) return;
      if (e.changedTouches && ![...e.changedTouches].some((x) => x.identifier === pointerRef.current)) return;
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
  }, [apply, release]);

  useEffect(() => () => setMove(0, 0), []);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Walk"
      className="ui-layer absolute z-30 w-[112px] h-[112px] md:w-32 md:h-32 rounded-full
        bg-white/[0.08] border border-white/25 backdrop-blur-sm touch-none select-none
        start-[calc(1rem+env(safe-area-inset-left,0px))]
        bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8"
      onMouseDown={(e) => {
        e.stopPropagation();
        pointerRef.current = 'mouse';
        apply(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        const t = e.changedTouches[0];
        pointerRef.current = t.identifier;
        apply(t.clientX, t.clientY);
      }}
    >
      <span
        className="absolute top-1/2 left-1/2 w-12 h-12 -mt-6 -ms-6 rounded-full bg-white/75 shadow-lg pointer-events-none"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
