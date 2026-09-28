import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useFlash } from '../engine/hooks';
import { useI18n } from '../i18n/I18nContext';
import { lcg, randomSeed, shuffle } from '../engine/rng';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SIZE = 4;
const COUNT = SIZE * SIZE;

/** Tap 1 to 16 in order. The clock is the score. */
export default function NumberRushGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();
  const [seed, setSeed] = useState(randomSeed);
  const tiles = useMemo(
    () => shuffle(Array.from({ length: COUNT }, (_, i) => i + 1), lcg(seed)),
    [seed]
  );

  const [next, setNext] = useState(1);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reward, setReward] = useState(null);
  const [flash, fire] = useFlash(200);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 100);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    startedAt.current = performance.now();
    setElapsed(0);
    setNext(1);
    setMisses(0);
    setReward(null);
    setRunning(true);
  };

  const finish = useCallback(
    (seconds, missed) => {
      setRunning(false);
      const score = Math.round(seconds * 10) / 10;
      // 15s is a strong run; every miss costs a little
      const quality = Math.max(0.15, Math.min(1, 15 / Math.max(5, seconds))) * Math.max(0.5, 1 - missed * 0.06);
      setReward(finishGame(meta.id, { score, base: 320, accuracy: quality, higherIsBetter: false }));
    },
    [finishGame, meta.id]
  );

  const tap = (value) => {
    if (!running) return;
    if (value !== next) {
      fire(false);
      setMisses((m) => m + 1);
      return;
    }
    fire(true);
    if (value === COUNT) {
      finish((performance.now() - startedAt.current) / 1000, misses);
      return;
    }
    setNext(value + 1);
  };

  const replay = () => {
    setSeed(randomSeed());
    start();
  };

  if (!running && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={elapsed < 18 ? '⚡' : elapsed < 30 ? '🔢' : '🐢'}
          title={t('common.finished')}
          lines={[
            { label: t('common.time'), value: `${(Math.round(elapsed * 10) / 10).toFixed(1)}s`, color: '#44e092' },
            { label: t('common.mistakes'), value: misses, color: misses ? '#ffb4aa' : '#44e092' },
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

  return (
    <GameShell
      title={loc(meta.name)}
      emoji={meta.emoji}
      onExit={onExit}
      hud={
        <span className="text-sm font-bold text-text-2 tabular-nums mx-3">
          {elapsed.toFixed(1)}s · ✗ {misses}
        </span>
      }
      footer={
        <div className="px-4 py-3 text-center text-sm text-text-2 tabular-nums">
          {running ? `→ ${next}` : ''}
        </div>
      }
    >
      <div className={`flex-1 min-h-0 flex items-center justify-center p-5 transition-colors ${flash}`}>
        {running ? (
          <div className="grid grid-cols-4 gap-2.5 w-full max-w-md aspect-square" dir="ltr">
            {tiles.map((value) => {
              const cleared = value < next;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => tap(value)}
                  className={`rounded-xl text-2xl font-bold tabular-nums transition-all active:scale-95 ${
                    cleared
                      ? 'bg-primary/15 text-primary/40'
                      : 'bg-surface-bright text-text hover:bg-surface-container'
                  }`}
                >
                  {cleared ? '' : value}
                </button>
              );
            })}
          </div>
        ) : (
          <Button size="lg" onClick={start}>
            {t('common.tapToStart')}
          </Button>
        )}
      </div>
    </GameShell>
  );
}
