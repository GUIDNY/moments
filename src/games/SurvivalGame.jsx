import { useCallback, useMemo, useState } from 'react';
import { makeDeck } from '../data/patterns';
import { useGame } from '../engine/GameContext';
import { useFlash, useKeys } from '../engine/hooks';
import { randomSeed } from '../engine/rng';
import Button from '../ui/Button';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const DECK_SIZE = 80;

/** One wrong call and the run is over. Coins scale with the streak. */
export default function SurvivalGame({ onExit, meta }) {
  const { finishGame, recordPattern, multiplier, state } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const deck = useMemo(() => makeDeck(DECK_SIZE, seed), [seed]);

  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState('playing'); // playing | revealing | dead
  const [reward, setReward] = useState(null);
  const [flash, fire] = useFlash(500);

  const round = deck[idx % deck.length];
  const best = state.games[meta.id]?.best ?? 0;

  const answer = useCallback(
    (dir) => {
      if (phase !== 'playing') return;
      const ok = dir === round.answer;
      fire(ok);
      recordPattern(round.patternId, ok);
      setPhase('revealing');
      if (ok) setStreak((s) => s + 1);
      else {
        setReward(finishGame(meta.id, { score: streak, base: 30 * streak + (streak >= 10 ? 250 : 0) }));
      }
    },
    [phase, round, streak, fire, recordPattern, finishGame, meta.id]
  );

  const afterReveal = useCallback(() => {
    if (reward) {
      setPhase('dead');
      return;
    }
    setIdx((i) => i + 1);
    setPhase('playing');
  }, [reward]);

  useKeys(
    (e) => {
      if (phase !== 'playing') return;
      if (e.key === 'ArrowUp') { e.preventDefault(); answer('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); answer('down'); }
    },
    [phase, answer]
  );

  const replay = () => {
    setSeed(randomSeed());
    setIdx(0);
    setStreak(0);
    setReward(null);
    setPhase('playing');
  };

  if (phase === 'dead' && reward) {
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={streak > best ? '👑' : '💀'}
          title={streak > best ? 'שיא אישי חדש!' : 'נפלת'}
          lines={[
            { label: 'רצף', value: streak, color: '#44e092' },
            { label: 'שיא אישי', value: Math.max(best, streak) },
            { label: 'נפסלת על', value: round.name, color: '#ffb4aa' },
          ]}
          coins={reward.coins}
          xp={reward.xp}
          multiplier={multiplier}
          onReplay={replay}
          onExit={onExit}
          replayLabel="עוד ניסיון"
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">🔥 {streak} · שיא {best}</span>}
      footer={
        <div className="px-4 py-4">
          <p className="text-center text-secondary font-bold text-sm mb-3">💀 טעות אחת והריצה נגמרת</p>
          <div className="flex gap-3">
            <Button variant="up" size="lg" className="flex-1" disabled={phase !== 'playing'} onClick={() => answer('up')}>▲ עלייה</Button>
            <Button variant="down" size="lg" className="flex-1" disabled={phase !== 'playing'} onClick={() => answer('down')}>▼ ירידה</Button>
          </div>
        </div>
      }
    >
      <div className={`flex-1 min-h-0 flex flex-col transition-colors ${flash}`}>
        <div className="text-center py-2 shrink-0">
          <div className="text-xs text-text-3">רצף נוכחי</div>
          <div className="text-4xl font-bold text-primary tabular-nums">{streak}</div>
        </div>
        <div className="flex-1 min-h-0">
          <CandleChart
            key={`${round.key}-${idx}`}
            candles={round.questionCandles}
            revealCandles={round.revealCandles}
            isRevealing={phase === 'revealing'}
            onRevealComplete={afterReveal}
            stepMs={200}
          />
        </div>
      </div>
    </GameShell>
  );
}
