import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { skinFor } from './skins';
import { attachKeyboard } from './controls';
import Joystick from './Joystick';
import Npcs from './Npcs';
import Player from './Player';
import { Ground, PlazaScreen, Props, River, Shops } from './Scenery';
import { SPAWN, isWalkable } from '../world/map-data';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { formatCoins } from '../engine/economy';

const REACTIONS = ['👍', '🔥', '😂', '🤑', '👋'];

/** The city, in three dimensions. DOM chrome sits on top of the canvas. */
export default function World3D({ onEnter, onOpenDirectory }) {
  const { state, rememberSpawn } = useGame();
  const { t, loc } = useI18n();
  const [near, setNear] = useState(null);
  const [reaction, setReaction] = useState(null);

  const startTile = useMemo(() => {
    const saved = state.spawn;
    return saved && isWalkable(saved.x, saved.y) ? saved : SPAWN;
    // only on mount: the player keeps walking from wherever they came out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => attachKeyboard(), []);

  useEffect(() => {
    if (!reaction) return undefined;
    const t = setTimeout(() => setReaction(null), 1600);
    return () => clearTimeout(t);
  }, [reaction]);

  const handleEnter = useCallback((building) => onEnter(building), [onEnter]);

  return (
    <div className="absolute inset-0 bg-[#0a0d14] overflow-hidden touch-none">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 42, near: 0.1, far: 140, position: [16.5, 11.5, 26] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0d1522']} />
        <fog attach="fog" args={['#0d1522', 34, 58]} />

        <hemisphereLight args={['#dceaff', '#2c4738', 1.55]} />
        <directionalLight
          position={[18, 22, 14]}
          intensity={1.35}
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
          <Shops />
          <Props />
          <PlazaScreen title={t('app.name')} tagline={t('app.tagline')} coins={`${formatCoins(state.coins)} ${t('common.coins')}`} />
          <Npcs />
          <Player
            avatarSkin={skinFor(state.avatar)}
            label={state.name}
            startTile={startTile}
            onEnterDoor={handleEnter}
            onNearDoor={setNear}
            onMove={rememberSpawn}
          />
        </Suspense>
      </Canvas>

      <Joystick />

      {near && (
        <div className="absolute bottom-32 inset-x-0 flex justify-center pointer-events-none px-4">
          <div className="bg-surface-container/95 border rounded-2xl px-5 py-3 animate-pop-in shadow-xl text-center"
               style={{ borderColor: `${near.color}88` }}>
            <div className="text-sm font-bold text-text">
              {near.emoji} {loc(near.name)}
            </div>
            <div className="text-xs text-text-2 mt-0.5">{t('hud.doorHint')}</div>
          </div>
        </div>
      )}

      {reaction && (
        <div className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none">
          <span className="text-6xl animate-coin-fly">{reaction}</span>
        </div>
      )}

      <div className="absolute bottom-8 right-5 flex flex-col items-end gap-2 z-20">
        <div className="flex gap-1.5">
          {REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReaction(r)}
              className="w-10 h-10 rounded-full bg-surface-container/90 border border-border/60 text-lg active:scale-90 transition-transform"
              aria-label={`תגובה ${r}`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenDirectory}
          className="bg-surface-container/95 border border-border rounded-2xl px-4 py-3 font-bold text-text text-sm shadow-xl"
        >
          {t('directory.title')}
        </button>
      </div>

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-text-3 pointer-events-none hidden md:block">
        {t('hud.hint')}
      </p>
    </div>
  );
}
