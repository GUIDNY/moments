import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useCountdown } from '../engine/hooks';
import { useI18n } from '../i18n/I18nContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SECONDS = 30;
const CELLS = 9;
const LIVES = 3;

const KINDS = [
  { kind: 'mole', emoji: '🐹', points: 1, weight: 58 },
  { kind: 'bomb', emoji: '💣', points: 0, weight: 30 },
  { kind: 'gem', emoji: '💎', points: 3, weight: 12 },
];

function rollKind() {
  const total = KINDS.reduce((s, k) => s + k.weight, 0);
  let n = Math.random() * total;
  for (const k of KINDS) {
    n -= k.weight;
    if (n <= 0) return k;
  }
  return KINDS[0];
}

/** Tap the critters, spare the bombs. */
export default function MoleGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();

  const [active, setActive] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [hits, setHits] = useState(0);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);
  const [bump, setBump] = useState(null);

  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const spawnRef = useRef(null);
  const hideRef = useRef(null);
  const idRef = useRef(0);

  const end = useCallback(() => {
    setRunning(false);
    setActive(null);
    setReward(finishGame(meta.id, { score: scoreRef.current, base: 22 * scoreRef.current + 40 }));
  }, [finishGame, meta.id]);

  const { left, reset } = useCountdown(SECONDS, { running, onEnd: end });
  const leftRef = useRef(SECONDS);
  leftRef.current = left;

  useEffect(() => {
    if (!running) return undefined;
    let alive = true;

    const loop = () => {
      if (!alive) return;
      const elapsed = SECONDS - leftRef.current;
      const lifetime = Math.max(520, 1000 - elapsed * 14);
      const gap = Math.max(160, 480 - elapsed * 10);
      idRef.current += 1;
      const spawned = { cell: Math.floor(Math.random() * CELLS), ...rollKind(), id: idRef.current };
      setActive(spawned);
      hideRef.current = setTimeout(() => {
        setActive((cur) => (cur && cur.id === spawned.id ? null : cur));
      }, lifetime);
      spawnRef.current = setTimeout(loop, lifetime + gap);
    };

    spawnRef.current = setTimeout(loop, 450);
    return () => {
      alive = false;
      clearTimeout(spawnRef.current);
      clearTimeout(hideRef.current);
    };
  }, [running]);

  const tap = (cell) => {
    if (!running || !active || active.cell !== cell) return;
    if (active.kind === 'bomb') {
      const remaining = lives - 1;
      setLives(remaining);
      setBump({ cell, text: '−1 ❤️', bad: true });
      if (remaining <= 0) end();
    } else {
      scoreRef.current += active.points;
      hitsRef.current += 1;
      setScore(scoreRef.current);
      setHits(hitsRef.current);
      setBump({ cell, text: `+${active.points}`, bad: false });
    }
    setActive(null);
  };

  useEffect(() => {
    if (!bump) return undefined;
    const timer = setTimeout(() => setBump(null), 500);
    return () => clearTimeout(timer);
  }, [bump]);

  const replay = () => {
    scoreRef.current = 0;
    hitsRef.current = 0;
    setScore(0);
    setHits(0);
    setLives(LIVES);
    setActive(null);
    setReward(null);
    reset(SECONDS);
    setRunning(true);
  };

  if (!running && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={score >= 25 ? '🏆' : lives <= 0 ? '💣' : '🐹'}
          title={t('common.finished')}
          lines={[
            { label: t('common.points'), value: score, color: '#44e092' },
            { label: t('common.correct'), value: hits },
            { label: '❤️', value: '❤️'.repeat(Math.max(0, lives)) || '—' },
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
          {score} · {'❤️'.repeat(lives)}
        </span>
      }
      footer={<div className="px-4 py-3 text-center text-sm text-text-2">🐹 +1 · 💎 +3 · 💣 −❤️</div>}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 p-4">
        <div
          className="text-3xl font-bold tabular-nums"
          style={{ color: left > 10 ? '#44e092' : '#ffb4aa' }}
        >
          {left}s
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm aspect-square">
          {Array.from({ length: CELLS }, (_, cell) => (
            <button
              key={cell}
              type="button"
              onClick={() => tap(cell)}
              className="relative rounded-2xl bg-surface-container border border-border/60 flex items-center justify-center active:scale-95 transition-transform"
              aria-label={`hole ${cell + 1}`}
            >
              {active?.cell === cell && <span className="text-5xl animate-pop-in">{active.emoji}</span>}
              {bump?.cell === cell && (
                <span
                  className={`absolute text-lg font-bold animate-coin-fly ${
                    bump.bad ? 'text-secondary' : 'text-gold'
                  }`}
                >
                  {bump.text}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
