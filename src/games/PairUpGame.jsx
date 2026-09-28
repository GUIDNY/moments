import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useTimers } from '../engine/hooks';
import { useI18n } from '../i18n/I18nContext';
import { lcg, randomSeed, shuffle } from '../engine/rng';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const PAIRS = 6;

const FACES = [
  { id: 'a', emoji: '🍉', color: '#ff6b5b' },
  { id: 'b', emoji: '🍋', color: '#f5c542' },
  { id: 'c', emoji: '🥝', color: '#44e092' },
  { id: 'd', emoji: '🫐', color: '#7aa2ff' },
  { id: 'e', emoji: '🍇', color: '#c1c1ff' },
  { id: 'f', emoji: '🍓', color: '#ff8fb1' },
  { id: 'g', emoji: '🍍', color: '#ffc46b' },
  { id: 'h', emoji: '🥥', color: '#c7a07a' },
];

function buildBoard(seed) {
  const rng = lcg(seed);
  const chosen = shuffle(FACES, rng).slice(0, PAIRS);
  return shuffle(
    chosen.flatMap((face) => [0, 1].map((half) => ({ ...face, key: `${face.id}-${half}` }))),
    rng
  );
}

/** Classic pairs. Fewer moves, more coins. */
export default function PairUpGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();
  const [seed, setSeed] = useState(randomSeed);
  const board = useMemo(() => buildBoard(seed), [seed]);
  const { after, clearAll } = useTimers();

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState(null);

  const done = matched.length === PAIRS;

  useEffect(() => {
    if (!done || reward) return;
    // a flawless game is PAIRS moves; every extra pair of flips costs you
    const efficiency = Math.max(0.2, Math.min(1, (PAIRS * 2.2) / Math.max(1, moves)));
    setReward(
      finishGame(meta.id, { score: moves, base: 300, accuracy: efficiency, higherIsBetter: false })
    );
  }, [done, reward, moves, finishGame, meta.id]);

  const flip = useCallback(
    (card) => {
      if (busy || done) return;
      if (matched.includes(card.id) || flipped.includes(card.key)) return;

      const next = [...flipped, card.key];
      setFlipped(next);
      if (next.length < 2) return;

      setMoves((m) => m + 1);
      setBusy(true);
      const [a, b] = next.map((k) => board.find((c) => c.key === k));
      if (a.id === b.id) {
        after(380, () => {
          setMatched((m) => [...m, a.id]);
          setFlipped([]);
          setBusy(false);
        });
      } else {
        after(900, () => {
          setFlipped([]);
          setBusy(false);
        });
      }
    },
    [busy, done, matched, flipped, board, after]
  );

  const replay = () => {
    clearAll();
    setSeed(randomSeed());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setBusy(false);
    setReward(null);
  };

  if (done && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={moves <= 9 ? '🧠' : moves <= 14 ? '🃏' : '🔍'}
          title={moves <= 9 ? t('common.perfect') : t('common.finished')}
          lines={[
            { label: t('common.moves'), value: moves, color: moves <= 12 ? '#44e092' : '#ffb4aa' },
            { label: t('common.best'), value: PAIRS },
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
          {t('common.moves')} {moves} · {matched.length}/{PAIRS}
        </span>
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex items-center">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto w-full">
          {board.map((card) => {
            const isMatched = matched.includes(card.id);
            const isOpen = isMatched || flipped.includes(card.key);
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => flip(card)}
                className={`aspect-[3/4] rounded-2xl border-2 text-4xl flex items-center justify-center transition-all ${
                  isOpen ? '' : 'bg-surface-bright border-border/60 active:scale-95'
                }`}
                style={
                  isOpen
                    ? {
                        background: `${card.color}22`,
                        borderColor: card.color,
                        opacity: isMatched ? 0.6 : 1,
                      }
                    : undefined
                }
                aria-label={isOpen ? card.emoji : 'card'}
              >
                {isOpen ? card.emoji : <span className="opacity-40 text-3xl">❓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
