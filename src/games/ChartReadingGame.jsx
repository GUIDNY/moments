import { useCallback, useMemo, useState } from 'react';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, makeDeck } from '../data/patterns';
import { useFlash, useKeys } from '../engine/hooks';
import { useGame } from '../engine/GameContext';
import { randomSeed } from '../engine/rng';
import Button from '../ui/Button';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 8;

/** The heart of the city: read the pattern, call the next move, watch it play out. */
export default function ChartReadingGame({ onExit, meta }) {
  const { finishGame, recordPattern, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const deck = useMemo(() => makeDeck(ROUNDS, seed), [seed]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('playing'); // playing | revealing | result | done
  const [correct, setCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [reward, setReward] = useState(null);
  const [flash, fire] = useFlash();

  const round = deck[idx];

  const answer = useCallback(
    (dir) => {
      if (phase !== 'playing') return;
      const ok = dir === round.answer;
      setCorrect(ok);
      fire(ok);
      recordPattern(round.patternId, ok);
      if (ok) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
      }
      setPhase('revealing');
    },
    [phase, round, fire, recordPattern]
  );

  const next = useCallback(() => {
    if (idx + 1 >= deck.length) {
      const accuracy = score / deck.length;
      setReward(
        finishGame(meta.id, {
          score,
          base: 180,
          accuracy,
          streakBonus: bestStreak * 10,
        })
      );
      setPhase('done');
      return;
    }
    setIdx((i) => i + 1);
    setCorrect(null);
    setPhase('playing');
  }, [idx, deck.length, score, bestStreak, finishGame, meta.id]);

  useKeys(
    (e) => {
      if (phase === 'playing') {
        if (e.key === 'ArrowUp') { e.preventDefault(); answer('up'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); answer('down'); }
      } else if (phase === 'result' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    },
    [phase, answer, next]
  );

  const replay = () => {
    setSeed(randomSeed());
    setIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(null);
    setReward(null);
    setPhase('playing');
  };

  if (phase === 'done') {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={pct >= 80 ? '🏆' : pct >= 50 ? '📈' : '📉'}
          title={pct >= 80 ? 'קריאה מצוינת!' : pct >= 50 ? 'לא רע בכלל' : 'צריך עוד תרגול'}
          lines={[
            { label: 'תשובות נכונות', value: `${score}/${deck.length}` },
            { label: 'דיוק', value: `${pct}%`, color: pct >= 60 ? '#44e092' : '#ffb4aa' },
            { label: 'רצף הכי ארוך', value: bestStreak },
          ]}
          coins={reward?.coins ?? 0}
          xp={reward?.xp ?? 0}
          multiplier={multiplier}
          onReplay={replay}
          onExit={onExit}
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={
        <span className="text-sm font-bold text-text-2 tabular-nums ml-3">
          ✓ {score} · 🔥 {streak} · {idx + 1}/{deck.length}
        </span>
      }
      footer={
        <div className="px-4 py-4 text-center">
          <p className="text-text-2 font-semibold mb-3">לאן המחיר הולך עכשיו?</p>
          <div className="flex gap-3 justify-center">
            <Button variant="up" size="lg" className="flex-1 max-w-[180px]" disabled={phase !== 'playing'} onClick={() => answer('up')}>
              ▲ עלייה
            </Button>
            <Button variant="down" size="lg" className="flex-1 max-w-[180px]" disabled={phase !== 'playing'} onClick={() => answer('down')}>
              ▼ ירידה
            </Button>
          </div>
          <p className="text-text-3 text-xs mt-3 hidden md:block">מקשי ↑ ↓ עובדים גם</p>
        </div>
      }
    >
      <div className={`flex-1 min-h-0 flex flex-col transition-colors ${flash}`}>
        <div className="h-1 bg-surface-bright shrink-0">
          <div className="h-full bg-primary transition-all" style={{ width: `${(idx / deck.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between px-4 py-2 bg-surface-container/60 text-xs shrink-0">
          <span className="text-text-3">סיבוב {idx + 1}</span>
          <span className="font-bold" style={{ color: DIFFICULTY_COLOR[round.difficulty] }}>
            {DIFFICULTY_LABEL[round.difficulty]}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <CandleChart
            key={round.key}
            candles={round.questionCandles}
            revealCandles={round.revealCandles}
            isRevealing={phase === 'revealing'}
            onRevealComplete={() => setPhase('result')}
          />
        </div>
      </div>

      {phase === 'result' && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-10">
          <div className="bg-surface-container border border-border/70 rounded-2xl p-6 w-full max-w-sm text-center animate-pop-in">
            <div className="text-5xl mb-2">{correct ? '✅' : '❌'}</div>
            <h3 className={`text-xl font-bold mb-1 ${correct ? 'text-primary' : 'text-secondary'}`}>
              {correct ? 'קריאה נכונה!' : 'לא הפעם'}
            </h3>
            <p className="text-text font-bold mb-1">{round.name}</p>
            <p className="text-xs text-text-3 mb-3">{round.en}</p>
            <p className="text-sm text-text-2 bg-surface rounded-xl p-3 mb-4">{round.tip}</p>
            <ul className="text-xs text-text-3 text-right space-y-1 mb-5">
              {round.checklist.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
            <Button className="w-full" onClick={next}>
              {idx + 1 >= deck.length ? 'לסיכום ←' : 'הסיבוב הבא ←'}
            </Button>
          </div>
        </div>
      )}
    </GameShell>
  );
}
