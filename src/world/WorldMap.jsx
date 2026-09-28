import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { avatarEmoji } from '../data/items';
import { useGame } from '../engine/GameContext';
import {
  BUILDINGS,
  BUILDING_BY_DOOR,
  DISTRICTS,
  MAP_H,
  MAP_W,
  PROPS,
  SPAWN,
  TERRAIN,
  TERRAIN_GRID,
  TILE,
  findPath,
  isWalkable,
} from './map-data';

const STEP_MS = 110;

const TERRAIN_CLASS = {
  [TERRAIN.GRASS]: 'bg-grass',
  [TERRAIN.ROAD]: 'bg-road',
  [TERRAIN.WATER]: 'bg-[#10233a]',
  [TERRAIN.BLOCKED]: 'bg-grass',
  [TERRAIN.PLAZA]: 'bg-[#2b3140]',
};

/* ── Static layers: built once, never re-rendered ───────────────────────── */

function TerrainLayer() {
  return useMemo(
    () => (
      <div className="absolute inset-0">
        {TERRAIN_GRID.map((row, y) =>
          row.map((t, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute ${TERRAIN_CLASS[t]}`}
              style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}
            >
              {t === TERRAIN.ROAD && (y === 11 || x === 16) && (
                <span className="absolute inset-0 flex items-center justify-center text-[#3a4150] text-xs">
                  ·
                </span>
              )}
            </div>
          ))
        )}
      </div>
    ),
    []
  );
}

function PropsLayer() {
  return useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none">
        {PROPS.map((p) => (
          <div
            key={`${p.x}-${p.y}`}
            className="absolute flex items-center justify-center text-2xl"
            style={{ left: p.x * TILE, top: p.y * TILE, width: TILE, height: TILE }}
          >
            {p.emoji}
          </div>
        ))}
      </div>
    ),
    []
  );
}

function DistrictLabels() {
  return useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none">
        {DISTRICTS.map((d) => (
          <div
            key={d.id}
            className="absolute -translate-x-1/2 whitespace-nowrap text-xs font-bold tracking-wide opacity-50"
            style={{ left: d.at.x * TILE, top: d.at.y * TILE, color: d.color }}
          >
            {d.name}
          </div>
        ))}
      </div>
    ),
    []
  );
}

function Building({ building, onClick, badge }) {
  const { x, y, w, h, door, emoji, name, color } = building;
  // the doorway sits on one row of the footprint; the sign goes on the other
  const doorOnTopRow = door.y === y;
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute group text-right"
      style={{ left: x * TILE, top: y * TILE, width: w * TILE, height: h * TILE }}
      aria-label={name}
    >
      <span
        className="absolute inset-0 rounded-t-xl border-2 border-b-0 transition-colors"
        style={{
          background: 'linear-gradient(180deg,#39415a 0%,#222836 60%,#1a1f2b 100%)',
          borderColor: `${color}88`,
        }}
      />
      <span
        className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg"
        style={{ background: color, opacity: 0.75 }}
      />
      <span
        className="absolute inset-x-0 flex justify-center text-3xl group-hover:scale-110 transition-transform"
        style={{ top: doorOnTopRow ? TILE + 2 : 6 }}
      >
        {emoji}
      </span>
      <span
        className="absolute -top-5 inset-x-0 text-center text-[11px] font-bold whitespace-nowrap"
        style={{ color }}
      >
        {name}
      </span>
      {badge && (
        <span className="absolute -top-4 -left-2 bg-gold text-surface text-[10px] font-black px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {/* doorway */}
      <span
        className="absolute rounded-t-md bg-[#0f131c] border-2 border-b-0"
        style={{
          left: (door.x - x) * TILE + TILE * 0.22,
          top: (door.y - y) * TILE + TILE * 0.3,
          width: TILE * 0.56,
          height: TILE * 0.7,
          borderColor: color,
        }}
      />
      <span
        className="absolute rounded-full animate-pulse-ring border-2"
        style={{
          left: (door.x - x) * TILE + TILE * 0.15,
          top: (door.y - y) * TILE + TILE * 0.15,
          width: TILE * 0.7,
          height: TILE * 0.7,
          borderColor: color,
        }}
      />
    </button>
  );
}

/* ── The world ──────────────────────────────────────────────────────────── */

export default function WorldMap({ onEnter, onOpenDirectory }) {
  const { state, rememberSpawn } = useGame();
  const viewportRef = useRef(null);
  const [pos, setPos] = useState(() => {
    const saved = state.spawn;
    return saved && isWalkable(saved.x, saved.y) ? saved : SPAWN;
  });
  const [facing, setFacing] = useState(1);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [target, setTarget] = useState(null);

  const pathRef = useRef([]);
  const timerRef = useRef(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const enteringRef = useRef(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stopWalking = useCallback(() => {
    pathRef.current = [];
    setTarget(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopWalking, [stopWalking]);

  /** Arriving on a doorway tile enters the building. */
  const arrive = useCallback(
    (tile, from) => {
      const building = BUILDING_BY_DOOR[`${tile.x},${tile.y}`];
      if (!building || enteringRef.current) return;
      enteringRef.current = true;
      stopWalking();
      // stand the player back in the street when they come out
      rememberSpawn(from && isWalkable(from.x, from.y) ? from : SPAWN);
      onEnter(building);
    },
    [onEnter, rememberSpawn, stopWalking]
  );

  const stepTo = useCallback(
    (nx, ny) => {
      if (!isWalkable(nx, ny)) return false;
      const from = posRef.current;
      if (nx !== from.x) setFacing(nx > from.x ? -1 : 1);
      setPos({ x: nx, y: ny });
      arrive({ x: nx, y: ny }, from);
      return true;
    },
    [arrive]
  );

  /* Walk along a queued path, one tile per tick. */
  const walkPath = useCallback(
    (path) => {
      stopWalking();
      if (!path || path.length === 0) return;
      pathRef.current = [...path];
      setTarget(path[path.length - 1]);
      const tick = () => {
        const next = pathRef.current.shift();
        if (!next) {
          setTarget(null);
          return;
        }
        stepTo(next.x, next.y);
        if (pathRef.current.length > 0 && !enteringRef.current) {
          timerRef.current = setTimeout(tick, STEP_MS);
        } else {
          setTarget(null);
        }
      };
      tick();
    },
    [stepTo, stopWalking]
  );

  const goTo = useCallback(
    (tile) => {
      const path = findPath(posRef.current, tile);
      if (!path) return;
      walkPath(path);
    },
    [walkPath]
  );

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      const map = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
        w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      stopWalking();
      stepTo(posRef.current.x + dir[0], posRef.current.y + dir[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepTo, stopWalking]);

  const worldW = MAP_W * TILE;
  const worldH = MAP_H * TILE;
  const camX = Math.min(0, Math.max(viewport.w - worldW, viewport.w / 2 - (pos.x + 0.5) * TILE));
  const camY = Math.min(0, Math.max(viewport.h - worldH, viewport.h / 2 - (pos.y + 0.5) * TILE));

  const nearby = BUILDINGS.find(
    (b) => Math.abs(b.door.x - pos.x) + Math.abs(b.door.y - pos.y) === 1
  );

  const visitedGames = state.games;

  return (
    <div ref={viewportRef} className="absolute inset-0 overflow-hidden bg-[#0a0d14] select-none">
      <div
        className="absolute will-change-transform"
        style={{
          left: 0,
          top: 0,
          width: worldW,
          height: worldH,
          transform: `translate3d(${camX}px, ${camY}px, 0)`,
          transition: `transform ${STEP_MS + 40}ms linear`,
        }}
      >
        <TerrainLayer />

        {/* click-to-walk surface */}
        <div
          className="absolute inset-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const tx = Math.floor((e.clientX - rect.left) / TILE);
            const ty = Math.floor((e.clientY - rect.top) / TILE);
            goTo({ x: tx, y: ty });
          }}
          role="presentation"
        />

        <PropsLayer />
        <DistrictLabels />

        {target && (
          <div
            className="absolute border-2 border-primary/70 rounded-md pointer-events-none animate-pulse"
            style={{ left: target.x * TILE + 4, top: target.y * TILE + 4, width: TILE - 8, height: TILE - 8 }}
          />
        )}

        {BUILDINGS.map((b) => (
          <Building
            key={b.id}
            building={b}
            badge={b.kind === 'game' && !visitedGames[b.target] ? 'חדש' : null}
            onClick={() => goTo(b.door)}
          />
        ))}

        {/* avatar */}
        <div
          className="absolute pointer-events-none z-20 flex flex-col items-center"
          style={{
            left: pos.x * TILE,
            top: pos.y * TILE - TILE * 0.35,
            width: TILE,
            height: TILE,
            transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
          }}
        >
          <span className="text-[10px] font-bold text-text bg-surface/80 px-1.5 rounded-full -mb-1 whitespace-nowrap">
            {state.name}
          </span>
          <span
            className="text-3xl animate-bob drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
            style={{ transform: `scaleX(${facing})` }}
          >
            {avatarEmoji(state.avatar)}
          </span>
        </div>
      </div>

      {/* hint over the doorway you're standing next to */}
      {nearby && (
        <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none px-4">
          <div className="bg-surface-container/95 border border-primary/40 rounded-xl px-4 py-2 text-sm font-bold text-text animate-pop-in">
            {nearby.emoji} {nearby.name} — היכנס דרך הדלת
          </div>
        </div>
      )}

      <TouchPad onStep={(dx, dy) => { stopWalking(); stepTo(pos.x + dx, pos.y + dy); }} />

      <button
        type="button"
        onClick={onOpenDirectory}
        className="absolute bottom-6 right-4 bg-surface-container/95 border border-border rounded-2xl px-4 py-3 font-bold text-text text-sm shadow-xl"
      >
        🗺️ מדריך העיר
      </button>
    </div>
  );
}

function TouchPad({ onStep }) {
  const btn =
    'w-12 h-12 rounded-xl bg-surface-container/90 border border-border text-text text-xl font-bold active:bg-primary active:text-surface flex items-center justify-center';
  return (
    <div className="absolute bottom-6 left-4 grid grid-cols-3 gap-1.5 md:hidden">
      <span />
      <button type="button" className={btn} onClick={() => onStep(0, -1)} aria-label="למעלה">▲</button>
      <span />
      <button type="button" className={btn} onClick={() => onStep(-1, 0)} aria-label="שמאלה">◀</button>
      <span />
      <button type="button" className={btn} onClick={() => onStep(1, 0)} aria-label="ימינה">▶</button>
      <span />
      <button type="button" className={btn} onClick={() => onStep(0, 1)} aria-label="למטה">▼</button>
      <span />
    </div>
  );
}
