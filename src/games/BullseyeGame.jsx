import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 5;
const MIN_R = 0.18;
const MAX_R = 1;

/** A ring pulses; stop it while it matches the outline. Pure timing. */
export default function BullseyeGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();

  const [radius, setRadius] = useState(MIN_R);
  const [target, setTarget] = useState(0.6);
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState([]);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);
  const [lastHit, setLastHit] = useState(null);

  const rRef = useRef(MIN_R);
  const dirRef = useRef(1);
  const rafRef = useRef(0);
  const lastTs = useRef(0);

  const speed = 0.55 + round * 0.14; // radius units per second

  useEffect(() => {
    if (!running) return undefined;
    const frame = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const delta = Math.min(0.05, (ts - lastTs.current) / 1000);
      lastTs.current = ts;
      let next = rRef.current + dirRef.current * speed * delta;
      if (next >= MAX_R) {
        next = MAX_R;
        dirRef.current = -1;
      } else if (next <= MIN_R) {
        next = MIN_R;
        dirRef.current = 1;
      }
      rRef.current = next;
      setRadius(next);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTs.current = 0;
    };
  }, [running, speed]);

  const finish = useCallback(
    (all) => {
      setRunning(false);
      const avgError = all.reduce((s, v) => s + v, 0) / all.length;
      const score = Math.round(avgError * 1000);
      // within 3% of the ring is a bullseye; 25% off is a miss
      const quality = Math.max(0.1, Math.min(1, (0.25 - avgError) / 0.22));
      setReward(finishGame(meta.id, { score, base: 360, accuracy: quality, higherIsBetter: false }));
    },
    [finishGame, meta.id]
  );

  const stop = () => {
    if (!running) return;
    const error = Math.abs(rRef.current - target);
    const all = [...errors, error];
    setErrors(all);
    setLastHit(error);
    if (all.length >= ROUNDS) {
      finish(all);
      return;
    }
    setRound((r) => r + 1);
    setTarget(0.35 + Math.random() * 0.5);
    rRef.current = MIN_R;
    dirRef.current = 1;
    setRadius(MIN_R);
  };

  const replay = () => {
    setErrors([]);
    setRound(0);
    setLastHit(null);
    setReward(null);
    setTarget(0.6);
    rRef.current = MIN_R;
    dirRef.current = 1;
    setRadius(MIN_R);
    setRunning(true);
  };

  if (!running && reward) {
    const avg = errors.reduce((s, v) => s + v, 0) / errors.length;
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={avg < 0.05 ? '🎯' : avg < 0.12 ? '🏹' : '🙂'}
          title={avg < 0.05 ? t('common.perfect') : t('common.finished')}
          lines={[
            {
              label: t('common.accuracy'),
              value: `${Math.max(0, Math.round((1 - avg) * 100))}%`,
              color: avg < 0.12 ? '#44e092' : '#ffb4aa',
            },
            { label: t('common.round'), value: ROUNDS },
          ]}
          coins={reward.coins}
          xp={reward.xp}
          multiplier={multiplier}
          onReplay={replay}
          onExit={onExit}
        />
      </GameShell>
    );
  }

  const SIZE = 260;
  const px = (r) => (r * SIZE) / 2;

  return (
    <GameShell
      title={loc(meta.name)}
      emoji={meta.emoji}
      onExit={onExit}
      hud={
        <span className="text-sm font-bold text-text-2 tabular-nums mx-3">
          {round + 1}/{ROUNDS}
        </span>
      }
      footer={
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={stop}
            className="w-full py-4 rounded-xl bg-gold text-surface font-bold text-lg active:scale-[0.99] transition-transform"
          >
            STOP
          </button>
        </div>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          {/* the outline you are aiming for */}
          <span
            className="absolute rounded-full border-2 border-dashed border-tertiary"
            style={{
              width: px(target) * 2,
              height: px(target) * 2,
              left: SIZE / 2 - px(target),
              top: SIZE / 2 - px(target),
            }}
          />
          {/* the pulsing ring */}
          <span
            className="absolute rounded-full border-4"
            style={{
              width: px(radius) * 2,
              height: px(radius) * 2,
              left: SIZE / 2 - px(radius),
              top: SIZE / 2 - px(radius),
              borderColor: Math.abs(radius - target) < 0.04 ? '#44e092' : '#f5c542',
              background: Math.abs(radius - target) < 0.04 ? '#44e09222' : 'transparent',
            }}
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
            🎯
          </span>
        </div>

        <div className="flex gap-2">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span
              key={i}
              className={`w-8 h-2 rounded-full ${
                errors[i] == null
                  ? 'bg-surface-bright'
                  : errors[i] < 0.06
                    ? 'bg-primary'
                    : errors[i] < 0.15
                      ? 'bg-gold'
                      : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {lastHit != null && running && (
          <div className="text-lg font-bold text-text-2 animate-pop-in tabular-nums">
            {Math.max(0, Math.round((1 - lastHit) * 100))}%
          </div>
        )}
      </div>
    </GameShell>
  );
}
