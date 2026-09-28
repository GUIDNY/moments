import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATTERNS, makeRound } from '../data/patterns';
import { useGame } from '../engine/GameContext';
import { useTimers } from '../engine/hooks';
import { lcg, randomSeed, shuffle } from '../engine/rng';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const PAIRS = 6;

/**
 * Memory with a twist: the two cards of a pair show the *same pattern drawn
 * from different data*, so you have to match the shape, not the picture.
 */
function buildBoard(seed) {
  const rng = lcg(seed);
  const chosen = shuffle(PATTERNS, rng).slice(0, PAIRS);
  const cards = chosen.flatMap((pattern, i) =>
    [0, 1].map((half) => {
      const round = makeRound(pattern, Math.floor(rng() * 1e9));
      return {
        id: `${pattern.id}-${half}`,
        pairId: pattern.id,
        name: pattern.name,
        candles: round.questionCandles.slice(-9),
        color: i,
      };
    })
  );
  return shuffle(cards, rng);
}

export default function MemoryGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const board = useMemo(() => buildBoard(seed), [seed]);
  const { after, clearAll } = useTimers();

  const [flipped, setFlipped] = useState([]); // card ids currently face-up
  const [matched, setMatched] = useState([]); // pairIds solved
  const [moves, setMoves] = useState(0);
  const [reward, setReward] = useState(null);
  const [busy, setBusy] = useState(false);

  const done = matched.length === PAIRS;

  useEffect(() => {
    if (!done || reward) return;
    // a perfect game is PAIRS moves; every extra pair of flips costs you
    const efficiency = Math.max(0.2, Math.min(1, (PAIRS * 2.2) / Math.max(1, moves)));
    setReward(finishGame(meta.id, { score: moves, base: 300, accuracy: efficiency, higherIsBetter: false }));
  }, [done, reward, moves, finishGame, meta.id]);

  const flip = useCallback(
    (card) => {
      if (busy || done) return;
      if (matched.includes(card.pairId) || flipped.includes(card.id)) return;

      const next = [...flipped, card.id];
      setFlipped(next);
      if (next.length < 2) return;

      setMoves((m) => m + 1);
      setBusy(true);
      const [aId, bId] = next;
      const a = board.find((c) => c.id === aId);
      const b = board.find((c) => c.id === bId);
      if (a.pairId === b.pairId) {
        after(420, () => {
          setMatched((m) => [...m, a.pairId]);
          setFlipped([]);
          setBusy(false);
        });
      } else {
        after(1000, () => {
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
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={moves <= 9 ? '🧠' : moves <= 14 ? '🃏' : '🔍'}
          title={moves <= 9 ? 'זיכרון של פיל!' : 'מצאת את כל הזוגות'}
          lines={[
            { label: 'מהלכים', value: moves, color: moves <= 12 ? '#44e092' : '#ffb4aa' },
            { label: 'זוגות', value: PAIRS },
            { label: 'מינימום אפשרי', value: PAIRS },
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
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">מהלכים {moves} · {matched.length}/{PAIRS}</span>}
      footer={
        <div className="px-4 py-3 text-center text-sm text-text-2">
          שני קלפים של אותה תבנית מצוירים ממחירים שונים — חפש את הצורה
        </div>
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto">
          {board.map((card) => {
            const isMatched = matched.includes(card.pairId);
            const isOpen = isMatched || flipped.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flip(card)}
                className={`aspect-[3/4] rounded-xl border transition-all overflow-hidden ${
                  isMatched
                    ? 'border-primary bg-primary/10 opacity-70'
                    : isOpen
                      ? 'border-tertiary bg-surface-container'
                      : 'border-border/60 bg-surface-bright hover:border-primary/50 active:scale-95'
                }`}
                aria-label={isOpen ? card.name : 'קלף הפוך'}
              >
                {isOpen ? (
                  <span className="flex flex-col h-full">
                    <span className="flex-1 min-h-0">
                      <CandleChart candles={card.candles} />
                    </span>
                    <span className="text-[10px] font-bold text-text-2 pb-1 px-1 truncate block">
                      {isMatched ? card.name : ''}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center h-full text-3xl opacity-60">🕯️</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
