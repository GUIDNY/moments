import { useCallback, useMemo, useRef, useState } from 'react';
import { makeDeck } from '../data/patterns';
import { useGame } from '../engine/GameContext';
import { useCountdown, useFlash, useKeys } from '../engine/hooks';
import { randomSeed } from '../engine/rng';
import Button from '../ui/Button';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SECONDS = 45;
const DECK_SIZE = 60;

/** As many correct calls as you can fit into 45 seconds. */
export default function SpeedRunGame({ onExit, meta }) {
  const { finishGame, recordPattern, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const deck = useMemo(() => makeDeck(DECK_SIZE, seed), [seed]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);
  const [flash, fire] = useFlash(260);
  const scoreRef = useRef(0);
  const missRef = useRef(0);

  const end = useCallback(() => {
    setRunning(false);
    const hits = scoreRef.current;
    const total = hits + missRef.current;
    setReward(
      finishGame(meta.id, {
        score: hits,
        base: 26 * hits,
        accuracy: total === 0 ? 0 : Math.max(0.35, hits / total),
      })
    );
  }, [finishGame, meta.id]);

  const { left, reset } = useCountdown(SECONDS, { running, onEnd: end });

  const round = deck[idx % deck.length];

  const answer = useCallback(
    (dir) => {
      if (!running) return;
      const ok = dir === round.answer;
      fire(ok);
      recordPattern(round.patternId, ok);
      if (ok) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      } else {
        missRef.current += 1;
        setMisses(missRef.current);
      }
      setIdx((i) => i + 1);
    },
    [running, round, fire, recordPattern]
  );

  useKeys(
    (e) => {
      if (!running) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); answer('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); answer('down'); }
    },
    [running, answer]
  );

  const replay = () => {
    scoreRef.current = 0;
    missRef.current = 0;
    setSeed(randomSeed());
    setIdx(0);
    setScore(0);
    setMisses(0);
    setReward(null);
    reset(SECONDS);
    setRunning(true);
  };

  if (!running && reward) {
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={score >= 20 ? '⚡' : score >= 10 ? '🏃' : '🐢'}
          title={score >= 20 ? 'מהירות מפלצתית!' : score >= 10 ? 'קצב יפה' : 'אפשר מהר יותר'}
          lines={[
            { label: 'קריאות נכונות', value: score, color: '#44e092' },
            { label: 'טעויות', value: misses, color: '#ffb4aa' },
            { label: 'קצב', value: `${(score / SECONDS * 60).toFixed(1)} לדקה` },
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

  const pct = (left / SECONDS) * 100;
  const color = left > 20 ? '#44e092' : left > 8 ? '#f5c542' : '#ffb4aa';

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">✓ {score} · ✗ {misses}</span>}
      footer={
        <div className="px-4 py-4 flex gap-3">
          <Button variant="up" size="lg" className="flex-1" onClick={() => answer('up')}>▲ עלייה</Button>
          <Button variant="down" size="lg" className="flex-1" onClick={() => answer('down')}>▼ ירידה</Button>
        </div>
      }
    >
      <div className={`flex-1 min-h-0 flex flex-col transition-colors ${flash}`}>
        <div className="h-2 bg-surface-bright shrink-0">
          <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="text-center py-1.5 font-bold text-2xl tabular-nums shrink-0" style={{ color }}>
          {left}s
        </div>
        <div className="flex-1 min-h-0">
          <CandleChart key={`${round.key}-${idx}`} candles={round.questionCandles} />
        </div>
      </div>
    </GameShell>
  );
}
