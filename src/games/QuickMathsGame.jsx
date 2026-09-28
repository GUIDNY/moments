import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useTimers } from '../engine/hooks';
import { useI18n } from '../i18n/I18nContext';
import { lcg, randomSeed, shuffle } from '../engine/rng';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 8;
const SECONDS = 10;

function makeQuestions(seed) {
  const rng = lcg(seed);
  const out = [];
  for (let i = 0; i < ROUNDS; i++) {
    const hard = i >= ROUNDS / 2;
    const kind = ['+', '−', '×'][Math.floor(rng() * 3)];
    const a = hard ? 12 + Math.floor(rng() * 60) : 4 + Math.floor(rng() * 20);
    const b = kind === '×' ? 2 + Math.floor(rng() * (hard ? 9 : 5)) : 3 + Math.floor(rng() * 30);
    const answer = kind === '+' ? a + b : kind === '−' ? a - b : a * b;
    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.12));
    const distractors = [answer + spread, answer - spread, answer + spread * 2, answer - 1];
    out.push({
      q: `${a} ${kind} ${b}`,
      answer,
      choices: shuffle([...new Set([answer, ...distractors])].slice(0, 4), rng),
    });
  }
  return out;
}

/** Plain arithmetic against the clock. */
export default function QuickMathsGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();
  const [seed, setSeed] = useState(randomSeed);
  const questions = useMemo(() => makeQuestions(seed), [seed]);
  const { after, clearAll } = useTimers();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [phase, setPhase] = useState('question');
  const [reward, setReward] = useState(null);

  const q = questions[idx];

  const advance = useCallback(
    (nextScore) => {
      after(1100, () => {
        if (idx + 1 >= questions.length) {
          setReward(
            finishGame(meta.id, { score: nextScore, base: 220, accuracy: nextScore / ROUNDS })
          );
          setPhase('done');
          return;
        }
        setIdx((i) => i + 1);
        setPicked(null);
        setLeft(SECONDS);
        setPhase('question');
      });
    },
    [after, idx, questions.length, finishGame, meta.id]
  );

  const choose = (value) => {
    if (phase !== 'question') return;
    setPicked(value);
    setPhase('answer');
    const nextScore = value === q.answer ? score + 1 : score;
    if (value === q.answer) setScore(nextScore);
    advance(nextScore);
  };

  useEffect(() => {
    if (phase !== 'question') return undefined;
    if (left <= 0) {
      setPicked(null);
      setPhase('answer');
      advance(score);
      return undefined;
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, phase, advance, score]);

  const replay = () => {
    clearAll();
    setSeed(randomSeed());
    setIdx(0);
    setScore(0);
    setPicked(null);
    setLeft(SECONDS);
    setReward(null);
    setPhase('question');
  };

  if (phase === 'done' && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={score >= 7 ? '🧠' : score >= 4 ? '🧮' : '😅'}
          title={score === ROUNDS ? t('common.perfect') : t('common.finished')}
          lines={[
            { label: t('common.correct'), value: `${score}/${ROUNDS}` },
            { label: t('common.accuracy'), value: `${Math.round((score / ROUNDS) * 100)}%` },
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
          ✓ {score} · {idx + 1}/{ROUNDS}
        </span>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-2 bg-surface-bright shrink-0">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(left / SECONDS) * 100}%`, background: left > 3 ? '#44e092' : '#ffb4aa' }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 text-center">
          <p className="text-5xl font-bold text-text tabular-nums" dir="ltr">
            {q.q}
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {q.choices.map((value) => {
              let tone = 'ghost';
              if (phase === 'answer') {
                if (value === q.answer) tone = 'up';
                else if (value === picked) tone = 'down';
              }
              return (
                <Button
                  key={value}
                  variant={tone}
                  className={`py-5 text-xl tabular-nums ${
                    phase === 'answer' && value !== q.answer && value !== picked ? 'opacity-40' : ''
                  }`}
                  disabled={phase === 'answer'}
                  onClick={() => choose(value)}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
