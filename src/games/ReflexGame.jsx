import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 5;
const EARLY_PENALTY = 900; // ms added for jumping the gun

/** The tape goes quiet, then the signal fires. How fast is your finger? */
export default function ReflexGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const [phase, setPhase] = useState('idle'); // idle | waiting | signal | scored | done
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [last, setLast] = useState(null);
  const [reward, setReward] = useState(null);
  const [signalKind, setSignalKind] = useState('buy');

  const startedAt = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const arm = useCallback(() => {
    setPhase('waiting');
    setLast(null);
    setSignalKind(Math.random() > 0.5 ? 'buy' : 'sell');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startedAt.current = performance.now();
      setPhase('signal');
    }, 1200 + Math.random() * 2600);
  }, []);

  const finish = useCallback(
    (all) => {
      const avg = Math.round(all.reduce((s, t) => s + t, 0) / all.length);
      // 200ms is world class, 800ms is slow
      const quality = Math.max(0.1, Math.min(1, (900 - avg) / 650));
      setReward(finishGame(meta.id, { score: avg, base: 320, accuracy: quality, higherIsBetter: false }));
      setPhase('done');
    },
    [finishGame, meta.id]
  );

  const press = () => {
    if (phase === 'idle' || phase === 'scored') {
      arm();
      return;
    }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      const penalised = EARLY_PENALTY;
      const all = [...times, penalised];
      setTimes(all);
      setLast({ ms: penalised, early: true });
      setRound((r) => r + 1);
      if (round + 1 >= ROUNDS) finish(all);
      else setPhase('scored');
      return;
    }
    if (phase === 'signal') {
      const ms = Math.round(performance.now() - startedAt.current);
      const all = [...times, ms];
      setTimes(all);
      setLast({ ms, early: false });
      setRound((r) => r + 1);
      if (round + 1 >= ROUNDS) finish(all);
      else setPhase('scored');
    }
  };

  const replay = () => {
    setTimes([]);
    setRound(0);
    setLast(null);
    setReward(null);
    setPhase('idle');
  };

  if (phase === 'done' && reward) {
    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
    const best = Math.min(...times);
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={avg < 300 ? '⚡' : avg < 500 ? '🎯' : '🐌'}
          title={avg < 300 ? 'אצבע של סוחר!' : avg < 500 ? 'תגובה טובה' : 'אפשר לחדד'}
          lines={[
            { label: 'זמן תגובה ממוצע', value: `${avg} ms`, color: avg < 400 ? '#44e092' : '#ffb4aa' },
            { label: 'הכי מהיר', value: `${best} ms` },
            { label: 'סיבובים', value: ROUNDS },
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
    idle: { bg: 'bg-surface-container', title: 'מוכן?', sub: 'לחץ כדי להתחיל. כשהמסך משתנה — לחץ מהר.' },
    waiting: { bg: 'bg-surface-bright', title: 'חכה לאות…', sub: 'אל תלחץ לפני שהאות מופיע' },
    signal: {
      bg: signalKind === 'buy' ? 'bg-primary' : 'bg-secondary',
      title: signalKind === 'buy' ? 'קנה! 📈' : 'מכור! 📉',
      sub: 'עכשיו!',
    },
    scored: {
      bg: last?.early ? 'bg-secondary/25' : 'bg-surface-container',
      title: last?.early ? 'מוקדם מדי! ⛔' : `${last?.ms} ms`,
      sub: last?.early ? `נרשם קנס של ${EARLY_PENALTY} ms` : 'לחץ לסיבוב הבא',
    },
  }[phase];

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">{round}/{ROUNDS}</span>}
      footer={
        <div className="px-4 py-3 flex justify-center gap-2 text-xs text-text-3">
          {times.map((t, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-surface-bright tabular-nums">
              {t} ms
            </span>
          ))}
        </div>
      }
    >
      <button
        type="button"
        onClick={press}
        className={`flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 transition-colors ${screen.bg}`}
      >
        <span className={`text-5xl font-black ${phase === 'signal' ? 'text-surface' : 'text-text'}`}>
          {screen.title}
        </span>
        <span className={`text-sm ${phase === 'signal' ? 'text-surface/80' : 'text-text-2'}`}>
          {screen.sub}
        </span>
      </button>
    </GameShell>
  );
}
