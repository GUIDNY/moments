import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 5;
const EARLY_PENALTY = 900; // ms added for jumping the gun

/** Wait for green, then tap. Five rounds, averaged. */
export default function ReactionGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();

  const [phase, setPhase] = useState('idle'); // idle | waiting | go | scored | done
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [last, setLast] = useState(null);
  const [reward, setReward] = useState(null);

  const startedAt = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const arm = useCallback(() => {
    setPhase('waiting');
    setLast(null);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => {
        startedAt.current = performance.now();
        setPhase('go');
      },
      1200 + Math.random() * 2600
    );
  }, []);

  const record = useCallback(
    (ms, early) => {
      const all = [...times, ms];
      setTimes(all);
      setLast({ ms, early });
      setRound((r) => r + 1);
      if (round + 1 >= ROUNDS) {
        const avg = Math.round(all.reduce((s, v) => s + v, 0) / all.length);
        // 200ms is world class, 900ms is asleep
        const quality = Math.max(0.1, Math.min(1, (900 - avg) / 650));
        setReward(
          finishGame(meta.id, { score: avg, base: 340, accuracy: quality, higherIsBetter: false })
        );
        setPhase('done');
      } else {
        setPhase('scored');
      }
    },
    [times, round, finishGame, meta.id]
  );

  const press = () => {
    if (phase === 'idle' || phase === 'scored') {
      arm();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      record(EARLY_PENALTY, true);
      return;
    }
    if (phase === 'go') record(Math.round(performance.now() - startedAt.current), false);
  };

  const replay = () => {
    setTimes([]);
    setRound(0);
    setLast(null);
    setReward(null);
    setPhase('idle');
  };

  if (phase === 'done' && reward) {
    const avg = Math.round(times.reduce((s, v) => s + v, 0) / times.length);
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={avg < 300 ? '⚡' : avg < 500 ? '🎯' : '🐌'}
          title={t('common.finished')}
          lines={[
            { label: t('common.score'), value: `${avg} ms`, color: avg < 400 ? '#44e092' : '#ffb4aa' },
            { label: t('common.best'), value: `${Math.min(...times)} ms` },
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

  const screen = {
    idle: { bg: 'bg-surface-container', big: '👋', sub: t('common.tapToStart') },
    waiting: { bg: 'bg-secondary/25', big: '🔴', sub: '…' },
    go: { bg: 'bg-primary', big: '🟢', sub: '!' },
    scored: {
      bg: last?.early ? 'bg-secondary/25' : 'bg-surface-container',
      big: last?.early ? '⛔' : `${last?.ms}`,
      sub: last?.early ? `+${EARLY_PENALTY} ms` : 'ms',
    },
  }[phase];

  return (
    <GameShell
      title={loc(meta.name)}
      emoji={meta.emoji}
      onExit={onExit}
      hud={
        <span className="text-sm font-bold text-text-2 tabular-nums mx-3">
          {round}/{ROUNDS}
        </span>
      }
      footer={
        <div className="px-4 py-3 flex justify-center gap-2 text-xs text-text-3">
          {times.map((v, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-surface-bright tabular-nums">
              {v} ms
            </span>
          ))}
        </div>
      }
    >
      <button
        type="button"
        onClick={press}
        className={`flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-2 transition-colors ${screen.bg}`}
      >
        <span className={`text-7xl font-black tabular-nums ${phase === 'go' ? 'text-surface' : 'text-text'}`}>
          {screen.big}
        </span>
        <span className={`text-sm ${phase === 'go' ? 'text-surface/80' : 'text-text-2'}`}>
          {screen.sub}
        </span>
      </button>
    </GameShell>
  );
}
