import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useFlash } from '../engine/hooks';
import { useI18n } from '../i18n/I18nContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SECONDS = 45;
const LIVES = 3;

/** Grid size and colour gap per round — it gets bigger and subtler. */
function roundSetup(round) {
  const size = Math.min(6, 2 + Math.floor(round / 2));
  const gap = Math.max(5, 46 - round * 3.2);
  const hue = Math.floor(Math.random() * 360);
  const light = 52;
  return {
    size,
    base: `hsl(${hue} 65% ${light}%)`,
    odd: `hsl(${hue} 65% ${light + gap}%)`,
    index: Math.floor(Math.random() * size * size),
  };
}

/** Spot the tile that is a shade off. */
export default function OddOneGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();

  const [round, setRound] = useState(0);
  const [setup, setSetup] = useState(() => roundSetup(0));
  const [lives, setLives] = useState(LIVES);
  const [left, setLeft] = useState(SECONDS);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);
  const [flash, fire] = useFlash(260);

  const end = useCallback(
    (finalRound) => {
      setRunning(false);
      setReward(finishGame(meta.id, { score: finalRound, base: 34 * finalRound + 30 }));
    },
    [finishGame, meta.id]
  );

  useEffect(() => {
    if (!running) return undefined;
    if (left <= 0) {
      end(round);
      return undefined;
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, running, round, end]);

  const tap = (index) => {
    if (!running) return;
    if (index === setup.index) {
      fire(true);
      const next = round + 1;
      setRound(next);
      setSetup(roundSetup(next));
      setLeft((s) => Math.min(SECONDS, s + 2)); // a correct find buys you time
      return;
    }
    fire(false);
    const remaining = lives - 1;
    setLives(remaining);
    if (remaining <= 0) end(round);
  };

  const replay = () => {
    setRound(0);
    setSetup(roundSetup(0));
    setLives(LIVES);
    setLeft(SECONDS);
    setReward(null);
    setRunning(true);
  };

  if (!running && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={round >= 18 ? '🦅' : round >= 10 ? '👁️' : '🔍'}
          title={t('common.finished')}
          lines={[
            { label: t('common.round'), value: round, color: '#44e092' },
            { label: t('common.time'), value: `${SECONDS - left}s` },
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
          {round} · {'❤️'.repeat(lives)}
        </span>
      }
    >
      <div className={`flex-1 min-h-0 flex flex-col transition-colors ${flash}`}>
        <div className="h-2 bg-surface-bright shrink-0">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(left / SECONDS) * 100}%`, background: left > 10 ? '#44e092' : '#ffb4aa' }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-5">
          <div
            className="grid gap-2 w-full max-w-md aspect-square"
            style={{ gridTemplateColumns: `repeat(${setup.size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: setup.size * setup.size }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => tap(i)}
                className="rounded-xl active:scale-95 transition-transform"
                style={{ background: i === setup.index ? setup.odd : setup.base }}
                aria-label={`tile ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
