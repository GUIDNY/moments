import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { skinFor } from './skins';
import { attachKeyboard } from './controls';
import Joystick from './Joystick';
import MiniMap from './MiniMap';
import Npcs from './Npcs';
import Player from './Player';
import { Ground, PlazaScreen, Props, River, Shops } from './Scenery';
import { getSpawn } from '../world/map-data';
import { useCity } from '../stocks/CityContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, formatPct } from '../stocks/money';
import { moveColor } from '../stocks/towers';

const REACTIONS = ['👍', '🔥', '😂', '🤑', '👋'];

/** One size, one radius, one surface for every floating control. */
const RAIL_BUTTON =
  'ui-layer w-11 h-11 rounded-full grid place-items-center text-lg ' +
  'bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip ' +
  'active:scale-90 transition-transform';

/** Phones get smaller in-world signage and a bottom sheet instead of a panel. */
function useIsCompact() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}

/** The town, in three dimensions. DOM chrome floats over the canvas. */
export default function World3D({ onEnter, onOpenDirectory }) {
  const { positionOf, summary, display, holdings } = useCity();
  const { t, loc } = useI18n();
  const compact = useIsCompact();
  const [near, setNear] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const rootRef = useRef(null);
  const cardRef = useRef(null);

  // recomputed whenever the city is relaid: a remembered tile can end up inside
  // a tower that did not exist a moment ago
  const startTile = useMemo(() => getSpawn(), [holdings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => attachKeyboard(), []);

  useEffect(() => {
    if (!reaction) return undefined;
    const timer = setTimeout(() => setReaction(null), 1600);
    return () => clearTimeout(timer);
  }, [reaction]);

  /**
   * Publish the venue sheet's height as `--dock` so the joystick and the rail
   * lift by exactly as much as the sheet takes — no guessed offsets.
   */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const card = cardRef.current;
    if (!card) {
      root.style.setProperty('--dock', '0px');
      return undefined;
    }
    const measure = () => root.style.setProperty('--dock', `${card.offsetHeight}px`);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, [near]);

  const handleEnter = useCallback((building) => onEnter(building), [onEnter]);

  const nearPosition = near ? positionOf(near.symbol) : null;
  const dockOffset = {
    bottom: near
      ? 'calc(var(--dock, 0px) + 1rem + env(safe-area-inset-bottom, 0px))'
      : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
  };

  return (
    <div ref={rootRef} className="absolute inset-0 bg-[#0a0d14] overflow-hidden touch-none">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 46, near: 0.1, far: 140, position: [16.5, 13, 26] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#101a2b']} />
        <fog attach="fog" args={['#101a2b', 34, 58]} />

        {/* warmer key light, cool bounce — the town reads lit rather than grey */}
        <ambientLight intensity={0.22} color="#ffd9b0" />
        <hemisphereLight args={['#ffeede', '#31424f', 1.25]} />
        <directionalLight
          position={[18, 22, 14]}
          intensity={1.5}
          color="#fff2e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-far={70}
        />

        <Suspense fallback={null}>
          <Ground />
          <River />
          <Shops compact={compact} />
          <Props />
          <PlazaScreen
            title={t('app.name')}
            tagline={holdings.length ? formatMoney(summary.value, display, true) : t('app.tagline')}
            coins={holdings.length ? `${formatPct(summary.dayPct)} ${t('city.today')}` : ''}
            compact={compact}
          />
          <Npcs />
          <Player
            avatarSkin={skinFor('default')}
            label={t('app.name')}
            startTile={startTile}
            onEnterDoor={handleEnter}
            onNearDoor={setNear}
          />
        </Suspense>
      </Canvas>

      {/* minimap, tucked under the header on the reading side */}
      <div className="absolute z-20 start-3 top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:start-4 md:top-[5.25rem]">
        <MiniMap onOpen={onOpenDirectory} className="w-[62px] h-[62px] md:w-20 md:h-20" />
      </div>

      <Joystick raised={Boolean(near)} />

      {/* reactions float up from the middle of the screen */}
      {reaction && (
        <div className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none">
          <span className="text-6xl animate-coin-fly">{reaction}</span>
        </div>
      )}

      {/* one rail: reactions, then the primary call to action */}
      <div
        className="absolute z-20 end-3 md:end-5 flex flex-col items-end gap-2 transition-[bottom] duration-300 ease-out"
        style={dockOffset}
      >
        {emojiOpen && (
          <div className="flex flex-col gap-1.5 animate-pop-in">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReaction(r);
                  setEmojiOpen(false);
                }}
                className={RAIL_BUTTON}
                aria-label={r}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className={`${RAIL_BUTTON} ${emojiOpen ? 'ring-2 ring-brand/70' : ''}`}
          aria-label="Reactions"
          aria-expanded={emojiOpen}
        >
          {emojiOpen ? '✕' : '😀'}
        </button>

        <button
          type="button"
          onClick={onOpenDirectory}
          aria-label={t('directory.title')}
          className="ui-layer h-12 ps-3.5 pe-4 rounded-full flex items-center gap-2
            bg-brand text-white font-bold text-sm shadow-fab
            active:scale-95 transition-transform"
        >
          <span className="text-lg leading-none">🗺️</span>
          <span className="hidden xs:inline">{t('hud.guide')}</span>
        </button>
      </div>

      {/* the venue you are standing at — a sheet on phones, a card on desktop */}
      {near && (
        <div
          ref={cardRef}
          className="ui-layer absolute z-30 inset-x-0 bottom-0 md:inset-x-auto md:bottom-6 md:start-1/2 md:-translate-x-1/2 md:w-[420px]
            bg-paper text-ink-900 rounded-t-[26px] md:rounded-3xl shadow-sheet
            px-4 pt-2 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] md:pb-4
            animate-sheet-up md:animate-pop-in"
        >
          <div className="md:hidden flex justify-center pb-2">
            <span className="h-1.5 w-10 rounded-full bg-paper-200" />
          </div>

          <div className="flex items-center gap-3">
            <span
              className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-2xl"
              style={{ background: `${near.color}22` }}
            >
              {near.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: near.color }}
                />
                <h2 className="text-[15px] font-black truncate">{loc(near.name)}</h2>
              </div>
              {/* the two numbers that say whether this tower is worth entering */}
              <p className="text-[12px] text-paper-muted truncate">
                {nearPosition && !nearPosition.missing
                  ? `${nearPosition.qty.toLocaleString()} × ${formatMoney(nearPosition.price, nearPosition.currency)}`
                  : t('hud.doorHint')}
              </p>
              {nearPosition && !nearPosition.missing && (
                <p className="text-[13px] font-black mt-0.5 truncate tabular-nums">
                  {formatMoney(nearPosition.value, nearPosition.currency, true)}{' '}
                  <span style={{ color: moveColor(nearPosition.dayPct) }}>
                    {formatPct(nearPosition.dayPct)}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleEnter(near)}
              className="shrink-0 h-11 px-5 rounded-2xl bg-brand text-white font-bold text-sm
                shadow-fab active:scale-95 transition-transform"
            >
              {t('common.enter')}
            </button>
          </div>
        </div>
      )}

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/30 pointer-events-none hidden md:block">
        {t('hud.hint')}
      </p>
    </div>
  );
}
