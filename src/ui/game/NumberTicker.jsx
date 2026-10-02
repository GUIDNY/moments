import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';

/**
 * A number that rolls to its new value instead of jumping — the scoreboard's
 * small pleasure. The first value is shown at once; only changes animate, so
 * a reload never counts up from zero. `format` turns the in-between numbers
 * into text.
 */
export default function NumberTicker({ value, format, className, style }) {
  const mv = useMotionValue(value ?? 0);
  const [shown, setShown] = useState(value ?? 0);
  const first = useRef(true);
  useEffect(() => {
    if (value == null) return undefined;
    if (first.current) {
      first.current = false;
      mv.set(value);
      setShown(value);
      return undefined;
    }
    const ctrl = animate(mv, value, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(v) });
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span className={className} style={style}>
      {format(shown)}
    </span>
  );
}
