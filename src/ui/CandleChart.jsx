import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const UP = '#44e092';
const DOWN = '#ff6b5b';
const GRID = '#1c1f29';
const AXIS = '#869488';

/** Measure the element and keep {w,h} in state — the chart draws in real pixels. */
function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * A dependency-free candlestick chart.
 * When `isRevealing` flips on, the reveal candles are drawn one by one and
 * `onRevealComplete` fires once the last one lands.
 */
export default function CandleChart({
  candles = [],
  revealCandles = [],
  isRevealing = false,
  onRevealComplete,
  stepMs = 280,
  overlayLine = null,
  className = '',
}) {
  const wrapRef = useRef(null);
  const { w, h } = useSize(wrapRef);
  const [shown, setShown] = useState(0);
  const timersRef = useRef([]);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    setShown(0);
  }, [candles]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (!isRevealing) return undefined;

    if (revealCandles.length === 0) {
      const t = setTimeout(() => aliveRef.current && onRevealComplete?.(), 250);
      timersRef.current.push(t);
      return () => clearTimeout(t);
    }

    revealCandles.forEach((_, i) => {
      const t = setTimeout(() => {
        if (!aliveRef.current) return;
        setShown(i + 1);
        if (i === revealCandles.length - 1) {
          const done = setTimeout(() => aliveRef.current && onRevealComplete?.(), 420);
          timersRef.current.push(done);
        }
      }, i * stepMs);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing, revealCandles]);

  const visible = [...candles, ...revealCandles.slice(0, shown)];
  const slots = candles.length + revealCandles.length;

  if (!w || !h || visible.length === 0) {
    return <div ref={wrapRef} className={`w-full h-full ${className}`} />;
  }

  const padRight = 52;
  const padBottom = 14;
  const padTop = 12;
  const plotW = Math.max(10, w - padRight);
  const plotH = Math.max(10, h - padBottom - padTop);

  let min = Infinity;
  let max = -Infinity;
  for (const c of visible) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  if (overlayLine != null) {
    min = Math.min(min, overlayLine);
    max = Math.max(max, overlayLine);
  }
  const span = max - min || 1;
  min -= span * 0.08;
  max += span * 0.08;

  const y = (price) => padTop + plotH - ((price - min) / (max - min)) * plotH;
  const slotW = plotW / Math.max(1, slots);
  const bodyW = Math.max(2, Math.min(18, slotW * 0.62));
  const x = (i) => i * slotW + slotW / 2;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => min + ((max - min) / gridLines) * i);

  return (
    <div ref={wrapRef} className={`w-full h-full ${className}`}>
      <svg width={w} height={h} role="img" aria-label="גרף נרות">
        {ticks.map((price) => (
          <g key={price}>
            <line x1={0} x2={plotW} y1={y(price)} y2={y(price)} stroke={GRID} strokeWidth="1" />
            <text
              x={plotW + 8}
              y={y(price) + 4}
              fill={AXIS}
              fontSize="11"
              fontFamily="ui-monospace, monospace"
            >
              {price.toFixed(price > 200 ? 0 : 1)}
            </text>
          </g>
        ))}

        {overlayLine != null && (
          <line
            x1={0}
            x2={plotW}
            y1={y(overlayLine)}
            y2={y(overlayLine)}
            stroke="#c1c1ff"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}

        {visible.map((c, i) => {
          const up = c.close >= c.open;
          const color = up ? UP : DOWN;
          const top = y(Math.max(c.open, c.close));
          const bottom = y(Math.min(c.open, c.close));
          const isNew = i >= candles.length;
          return (
            <g key={`${c.time}-${i}`} opacity={isNew ? 0.95 : 1}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={y(c.high)}
                y2={y(c.low)}
                stroke={color}
                strokeWidth={Math.max(1, bodyW * 0.16)}
              />
              <rect
                x={x(i) - bodyW / 2}
                y={top}
                width={bodyW}
                height={Math.max(1.5, bottom - top)}
                fill={color}
                rx={Math.min(2, bodyW * 0.2)}
              />
            </g>
          );
        })}

        {shown > 0 && (
          <line
            x1={x(candles.length) - slotW / 2}
            x2={x(candles.length) - slotW / 2}
            y1={padTop}
            y2={padTop + plotH}
            stroke="#3c4a40"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        )}
      </svg>
    </div>
  );
}
