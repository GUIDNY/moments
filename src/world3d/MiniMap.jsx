import { useEffect, useMemo, useRef } from 'react';
import { MAP_H, MAP_W, TERRAIN, getBuildings, getGrid } from '../world/map-data';
import { playerPos } from './playerPos';

/** Muted version of the ground palette — the minimap should read at a glance. */
const MINI_COLORS = {
  [TERRAIN.GRASS]: '#1d2b22',
  [TERRAIN.ROAD]: '#33415a',
  [TERRAIN.WATER]: '#16304b',
  [TERRAIN.BLOCKED]: '#1d2b22',
  [TERRAIN.PLAZA]: '#3c4a64',
};

/** Paint the tile grid once into a data URL we can use as a background. */
function gridImage(tilePx = 6) {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_W * tilePx;
  canvas.height = MAP_H * tilePx;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      ctx.fillStyle = MINI_COLORS[getGrid()[y][x]] ?? MINI_COLORS[TERRAIN.GRASS];
      ctx.fillRect(x * tilePx, y * tilePx, tilePx, tilePx);
    }
  }
  return canvas.toDataURL();
}

/**
 * A small round map. The whole town is letterboxed into the circle, buildings
 * are dots in their district colour, and the player marker is moved straight on
 * the DOM node from an animation frame — no state, no re-render while walking.
 */
export default function MiniMap({ onOpen, className = '' }) {
  const markerRef = useRef(null);
  const boxRef = useRef(null);
  const image = useMemo(() => (typeof document === 'undefined' ? null : gridImage()), []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const box = boxRef.current;
      const marker = markerRef.current;
      if (box && marker) {
        const { width, height } = box.getBoundingClientRect();
        if (width > 0) {
          const scale = Math.min(width / MAP_W, height / MAP_H);
          const offsetX = (width - MAP_W * scale) / 2;
          const offsetY = (height - MAP_H * scale) / 2;
          const x = offsetX + playerPos.x * scale;
          const y = offsetY + playerPos.z * scale;
          marker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // buildings never move, so their dots are positioned once in percentages
  const dots = useMemo(
    () =>
      getBuildings().map((b) => ({
        id: b.id,
        color: b.color,
        left: ((b.x + b.w / 2) / MAP_W) * 100,
        top: ((b.y + b.h / 2) / MAP_H) * 100,
      })),
    []
  );

  const Tag = onOpen ? 'button' : 'div';

  return (
    <Tag
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      aria-label="Map"
      className={`ui-layer relative shrink-0 rounded-full overflow-hidden border border-white/20
        bg-ink-900/70 backdrop-blur-md shadow-chip ${onOpen ? 'active:scale-95 transition-transform' : ''} ${className}`}
    >
      {/* the town, letterboxed inside the circle */}
      <span
        ref={boxRef}
        className="absolute inset-0 bg-no-repeat bg-center"
        style={{ backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'contain' }}
      >
        {dots.map((d) => (
          <span
            key={d.id}
            className="absolute w-[3px] h-[3px] rounded-[1px] -translate-x-1/2 -translate-y-1/2 opacity-80"
            style={{ left: `${d.left}%`, top: `${d.top}%`, background: d.color }}
          />
        ))}
        <span
          ref={markerRef}
          className="absolute top-0 left-0 w-2 h-2 rounded-full bg-brand ring-[1.5px] ring-white/90 shadow-[0_0_8px_rgba(255,107,26,0.9)]"
        />
      </span>
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
    </Tag>
  );
}
