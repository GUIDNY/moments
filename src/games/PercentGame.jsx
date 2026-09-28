import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useTimers } from '../engine/hooks';
import { lcg, randomSeed, shuffle } from '../engine/rng';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const ROUNDS = 8;
const SECONDS = 12;

const round1 = (n) => Math.round(n * 10) / 10;

function makeQuestions(seed) {
  const rng = lcg(seed);
  const out = [];
  const kinds = ['after', 'change', 'recover'];
  for (let i = 0; i < ROUNDS; i++) {
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const price = 20 + Math.round(rng() * 380);
    const pct = [5, 10, 15, 20, 25, 30, 40, 50][Math.floor(rng() * 8)];
    const up = rng() > 0.5;

    if (kind === 'after') {
      const answer = round1(price * (1 + (up ? pct : -pct) / 100));
      out.push({
        q: `מניה ב-₪${price} ${up ? 'עלתה' : 'ירדה'} ב-${pct}%. מה המחיר עכשיו?`,
        answer,
        format: (v) => `₪${v}`,
        distractors: [
          round1(price * (1 + (up ? -pct : pct) / 100)),
          round1(price + (up ? pct : -pct)),
          round1(price * (1 + (up ? pct * 2 : -pct * 2) / 100)),
        ],
      });
    } else if (kind === 'change') {
      const to = round1(price * (1 + (up ? pct : -pct) / 100));
      out.push({
        q: `מניה עברה מ-₪${price} ל-₪${to}. כמה זה באחוזים?`,
        answer: up ? pct : -pct,
        format: (v) => `${v > 0 ? '+' : ''}${v}%`,
        distractors: [up ? -pct : pct, up ? pct + 5 : -pct - 5, up ? Math.round(pct / 2) : -Math.round(pct / 2)],
      });
    } else {
      const drop = [10, 20, 25, 50][Math.floor(rng() * 4)];
      const need = round1((100 / (100 - drop) - 1) * 100);
      out.push({
        q: `מניה ירדה ב-${drop}%. כמה אחוז היא צריכה לעלות כדי לחזור למחיר המקורי?`,
        answer: need,
        format: (v) => `${v}%`,
        distractors: [drop, round1(drop * 1.5), round1(drop / 2)],
      });
    }
  }
  return out.map((q) => ({
    ...q,
    choices: shuffle([...new Set([q.answer, ...q.distractors])].slice(0, 4), rng),
  }));
}

/** Percentage drills — the maths every trader does in their head. */
export default function PercentGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const questions = useMemo(() => makeQuestions(seed), [seed]);
  const { after, clearAll } = useTimers();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [phase, setPhase] = useState('question'); // question | answer | done
  const [reward, setReward] = useState(null);

  const q = questions[idx];

  const finish = useCallback(
    (finalScore) => {
      setReward(finishGame(meta.id, { score: finalScore, base: 200, accuracy: finalScore / ROUNDS }));
      setPhase('done');
    },
    [finishGame, meta.id]
  );

  const advance = useCallback(
    (nextScore) => {
      after(1500, () => {
        if (idx + 1 >= questions.length) {
          finish(nextScore);
          return;
        }
        setIdx((i) => i + 1);
        setPicked(null);
        setLeft(SECONDS);
        setPhase('question');
      });
    },
    [after, idx, questions.length, finish]
  );

  const choose = useCallback(
    (value) => {
      if (phase !== 'question') return;
      const ok = value === q.answer;
      setPicked(value);
      setPhase('answer');
      const nextScore = ok ? score + 1 : score;
      if (ok) setScore(nextScore);
      advance(nextScore);
    },
    [phase, q, score, advance]
  );

  useEffect(() => {
    if (phase !== 'question') return undefined;
    if (left <= 0) {
      setPicked(null);
      setPhase('answer');
      advance(score);
      return undefined;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
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
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={score >= 7 ? '🧠' : score >= 4 ? '🧮' : '😅'}
          title={score >= 7 ? 'מחשבון אנושי!' : 'עוד סיבוב?'}
          lines={[
            { label: 'תשובות נכונות', value: `${score}/${ROUNDS}` },
            { label: 'דיוק', value: `${Math.round((score / ROUNDS) * 100)}%` },
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
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">✓ {score} · {idx + 1}/{ROUNDS}</span>}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-2 bg-surface-bright shrink-0">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(left / SECONDS) * 100}%`, background: left > 4 ? '#44e092' : '#ffb4aa' }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="text-4xl">🧮</div>
          <p className="text-xl font-bold text-text max-w-md leading-relaxed">{q.q}</p>

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
                  className={`py-4 tabular-nums ${
                    phase === 'answer' && value !== q.answer && value !== picked ? 'opacity-40' : ''
                  }`}
                  disabled={phase === 'answer'}
                  onClick={() => choose(value)}
                >
                  {q.format(value)}
                </Button>
              );
            })}
          </div>

          {phase === 'answer' && (
            <p className="text-sm text-text-2 animate-pop-in">
              {picked === q.answer
                ? '✅ נכון!'
                : `❌ התשובה: ${q.format(q.answer)}${picked === null ? ' (נגמר הזמן)' : ''}`}
            </p>
          )}
        </div>
      </div>
    </GameShell>
  );
}
