import { useCallback, useMemo, useState } from 'react';
import { PATTERNS, makeDeck } from '../data/patterns';
import { useGame } from '../engine/GameContext';
import { useTimers } from '../engine/hooks';
import { randomSeed, shuffle } from '../engine/rng';
import Button from '../ui/Button';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 8;

/** Name the shape. Four options, no hints. */
export default function PatternQuizGame({ onExit, meta }) {
  const { finishGame, recordPattern, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const deck = useMemo(() => makeDeck(ROUNDS, seed), [seed]);
  const { after, clearAll } = useTimers();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('question'); // question | answer | done
  const [reward, setReward] = useState(null);

  const round = deck[idx];

  const choices = useMemo(() => {
    if (!round) return [];
    const wrong = shuffle(PATTERNS.filter((p) => p.id !== round.patternId))
      .slice(0, 3)
      .map((p) => p.name);
    return shuffle([round.name, ...wrong]);
  }, [round]);

  const finish = useCallback(
    (finalScore) => {
      setReward(
        finishGame(meta.id, {
          score: finalScore,
          base: 190,
          accuracy: finalScore / deck.length,
        })
      );
      setPhase('done');
    },
    [deck.length, finishGame, meta.id]
  );

  const choose = useCallback(
    (name) => {
      if (phase !== 'question') return;
      const ok = name === round.name;
      setPicked(name);
      setPhase('answer');
      recordPattern(round.patternId, ok);
      const nextScore = ok ? score + 1 : score;
      if (ok) setScore(nextScore);
      after(1900, () => {
        if (idx + 1 >= deck.length) {
          finish(nextScore);
          return;
        }
        setIdx((i) => i + 1);
        setPicked(null);
        setPhase('question');
      });
    },
    [phase, round, score, idx, deck.length, after, finish, recordPattern]
  );

  const replay = () => {
    clearAll();
    setSeed(randomSeed());
    setIdx(0);
    setScore(0);
    setPicked(null);
    setReward(null);
    setPhase('question');
  };

  if (phase === 'done') {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={pct >= 80 ? '🎓' : pct >= 50 ? '📖' : '🤔'}
          title={pct >= 80 ? 'אתה מכיר את התבניות!' : 'עוד סיבוב ותשלוט בזה'}
          lines={[
            { label: 'זיהויים נכונים', value: `${score}/${deck.length}` },
            { label: 'דיוק', value: `${pct}%`, color: pct >= 60 ? '#44e092' : '#ffb4aa' },
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
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">✓ {score} · {idx + 1}/{deck.length}</span>}
      footer={
        <div className="px-4 py-4">
          <p className="text-text-2 font-semibold mb-3 text-center">איזו תבנית נסגרה כאן?</p>
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
            {choices.map((name) => {
              let tone = 'ghost';
              if (phase === 'answer') {
                if (name === round.name) tone = 'up';
                else if (name === picked) tone = 'down';
              }
              return (
                <Button
                  key={name}
                  variant={tone}
                  size="sm"
                  className={`py-3 ${phase === 'answer' && name !== round.name && name !== picked ? 'opacity-40' : ''}`}
                  disabled={phase === 'answer'}
                  onClick={() => choose(name)}
                >
                  {name}
                </Button>
              );
            })}
          </div>
          {phase === 'answer' && (
            <p className="text-center text-sm mt-3 text-text-2 animate-pop-in">
              {picked === round.name ? '✅ ' : `❌ זו ${round.name} — `}
              {round.tip}
            </p>
          )}
        </div>
      }
    >
      <div className="flex-1 min-h-0">
        <CandleChart key={round.key} candles={round.questionCandles} />
      </div>
    </GameShell>
  );
}
