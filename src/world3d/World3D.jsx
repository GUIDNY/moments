import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import CameraRig from './CameraRig';
import { lookAt } from './focus';
import MiniMap from './MiniMap';
import Npcs from './Npcs';
import { Ground, PlazaScreen, Props, River, Shops, Surrounds, Waterfront } from './Scenery';
import Streets from './Streets';
import { getBuildings } from '../world/map-data';
import { useCity } from '../stocks/CityContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, formatPct } from '../stocks/money';
import { moveColor } from '../stocks/towers';

const REACTIONS = ['👍', '🔥', '😂', '🤑', '👋'];

/** One size, one radius, one surface for every floating control. */
const RAIL_BUTTON =
  'ui-layer w-11 h-11 rounded-full grid place-items-center text-lg ' +
  'bg-white/92 backdrop-blur-md border border-paper-200 text-ink-900 shadow-card ' +
  'active:scale-90 transition-transform';

/**
 * A phone held upright sees a narrow slice of the world. Widening the
 * vertical angle as the viewport gets taller keeps the same width of street
 * in frame — without it a portrait screen shows one tower and a kerb, and
 * the city reads as crowded for no reason but the aspect ratio.
 */
function AdaptiveFov() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    camera.fov = Math.min(60, Math.max(38, 38 + (1.4 - aspect) * 22));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

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

/**
 * The city, in three dimensions, seen by its builder. There is no avatar: you
 * look down on the whole thing, drag it under your thumb, tap a vacant lot to
 * build and tap a tower to go in. DOM chrome floats over the canvas.
 */
export default function World3D({ onEnter, onOpenDirectory, onBuild }) {
  const { summary, holdings, totalUsd } = useCity();
  const { t } = useI18n();
  const compact = useIsCompact();
  const [reaction, setReaction] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const near = null;

  /* A new tower is the event of the game: the camera flies to it and the
     building goes up in front of you. The map flags a tower `fresh` when its
     symbol was not in the previous layout, and that flag — not this
     component's memory — is what says there is something to fly to: a buy
     closes the board and mounts the city anew, so anything remembered here
     was forgotten with it. The flag is cleared once flown to, so coming back
     from the tower's own screen does not fly there again. */
  useEffect(() => {
    const b = getBuildings().find((x) => x.fresh);
    if (!b) return;
    b.fresh = false;
    lookAt(b.x + b.w / 2, b.y + b.h / 2 + 1, compact ? 24 : 20);
  }, [holdings, compact]);

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

  const dockOffset = {
    bottom: near
      ? 'calc(var(--dock, 0px) + 1rem + env(safe-area-inset-bottom, 0px))'
      : 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
  };

  return (
    <div ref={rootRef} className="absolute inset-0 bg-[#e9eef2] overflow-hidden touch-none">
      <Canvas
        shadows="soft"
        dpr={[1, compact ? 1.5 : 1.75]}
        camera={{ fov: 38, near: 0.1, far: 160, position: [16.5, 21, 30] }}
        gl={{ antialias: true }}
      >
        <AdaptiveFov />
        <color attach="background" args={['#e9eef2']} />
        <fog attach="fog" args={['#e9eef2', 48, 84]} />

        {/* A model on a table in daylight: a lot of flat fill so nothing is
            ever in the dark, and one soft sun for the shadows that give the
            buildings their edges. */}
        <ambientLight intensity={0.78} color="#ffffff" />
        <hemisphereLight args={['#ffffff', '#cfd6d0', 0.95]} />
        <directionalLight
          position={[20, 26, 16]}
          intensity={1.25}
          color="#fffaf2"
          castShadow
          shadow-mapSize={compact ? [2048, 2048] : [4096, 4096]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-far={80}
          shadow-bias={-0.0008}
        />

        <CameraRig compact={compact} />
        <Suspense fallback={null}>
          <Ground />
          <Surrounds />
          <River />
          <Streets onBuild={onBuild} />
          <Waterfront />
          <Shops compact={compact} onEnter={handleEnter} />
          <Props />
          <PlazaScreen
            title={t('app.name')}
            tagline={totalUsd != null ? formatMoney(totalUsd, 'USD', true) : t('app.tagline')}
            coins={holdings.length ? `${formatPct(summary.dayPct)} ${t('city.today')}` : ''}
            accent={holdings.length ? moveColor(summary.dayPct) : '#6b7a90'}
            compact={compact}
          />
          <Npcs />
        </Suspense>

        {/* Ambient occlusion is most of what separates a rendered model from
            a drawn one: the dark seam where a building meets its pavement, the
            shade between two towers, the underside of an awning. One pass of
            it, and anti-aliasing on top so the voxel edges stay crisp at any
            pixel ratio. Half resolution keeps a phone at sixty frames. */}
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={1.6} intensity={2.4} distanceFalloff={1} halfRes quality="performance" />
          <SMAA />
        </EffectComposer>
      </Canvas>

      {/* minimap, tucked under the header on the reading side */}
      <div className="absolute z-20 start-3 top-[calc(3.75rem+env(safe-area-inset-top,0px))] md:start-4 md:top-[5.25rem]">
        <MiniMap onOpen={onOpenDirectory} className="w-[62px] h-[62px] md:w-20 md:h-20" />
      </div>

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

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-ink-900/35 pointer-events-none hidden md:block whitespace-nowrap">
        {t('build.hint')}
      </p>
    </div>
  );
}
