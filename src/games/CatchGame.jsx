import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SECONDS = 40;
const LIVES = 3;
const BASKET_W = 0.16; // fraction of the play area
const CATCH_LINE = 0.86; // where the basket sits, top to bottom

const DROPS = [
  { emoji: '🍎', points: 1, weight: 46 },
  { emoji: '🍌', points: 1, weight: 26 },
  { emoji: '⭐', points: 3, weight: 12 },
  { emoji: '💣', points: -1, weight: 16 },
];

function rollDrop() {
  const total = DROPS.reduce((s, d) => s + d.weight, 0);
  let n = Math.random() * total;
  for (const d of DROPS) {
    n -= d.weight;
    if (n <= 0) return d;
  }
  return DROPS[0];
}

/** Slide the basket, catch the good stuff, dodge the bombs. */
export default function CatchGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();
  const areaRef = useRef(null);

  const [items, setItems] = useState([]);
  const [basket, setBasket] = useState(0.5);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [left, setLeft] = useState(SECONDS);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);

  const basketRef = useRef(0.5);
  const itemsRef = useRef([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const runningRef = useRef(true);
  const keysRef = useRef({ left: false, right: false });
  const idRef = useRef(0);
  const spawnAcc = useRef(0);
  const rafRef = useRef(0);
  const lastTs = useRef(0);

  const end = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    setRunning(false);
    setReward(finishGame(meta.id, { score: scoreRef.current, base: 20 * scoreRef.current + 40 }));
  }, [finishGame, meta.id]);

  /* clock */
  useEffect(() => {
    if (!running) return undefined;
    if (left <= 0) {
      end();
      return undefined;
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, running, end]);

  /* keyboard */
  useEffect(() => {
    const set = (e, down) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = down;
      else if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = down;
      else return;
      e.preventDefault();
    };
    const down = (e) => set(e, true);
    const up = (e) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /* game loop */
  useEffect(() => {
    if (!running) return undefined;

    const frame = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const delta = Math.min(0.06, (ts - lastTs.current) / 1000);
      lastTs.current = ts;

      // basket
      const dir = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0);
      if (dir !== 0) {
        basketRef.current = Math.max(
          BASKET_W / 2,
          Math.min(1 - BASKET_W / 2, basketRef.current + dir * 1.2 * delta)
        );
      }

      // spawn, faster as the round goes on
      const elapsed = SECONDS - left;
      spawnAcc.current += delta;
      const every = Math.max(0.32, 0.85 - elapsed * 0.011);
      if (spawnAcc.current >= every) {
        spawnAcc.current = 0;
        idRef.current += 1;
        itemsRef.current.push({
          id: idRef.current,
          x: 0.08 + Math.random() * 0.84,
          y: -0.06,
          speed: 0.34 + Math.random() * 0.2 + elapsed * 0.006,
          ...rollDrop(),
        });
      }

      // fall and collide
      const keep = [];
      for (const item of itemsRef.current) {
        item.y += item.speed * delta;
        if (item.y >= CATCH_LINE && item.y <= CATCH_LINE + 0.1) {
          if (Math.abs(item.x - basketRef.current) < BASKET_W / 2 + 0.05) {
            if (item.points < 0) {
              livesRef.current -= 1;
              setLives(livesRef.current);
              if (livesRef.current <= 0) end();
            } else {
              scoreRef.current += item.points;
              setScore(scoreRef.current);
            }
            continue; // caught: remove it
          }
        }
        if (item.y < 1.1) keep.push(item);
      }
      itemsRef.current = keep;

      setItems([...keep]);
      setBasket(basketRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTs.current = 0;
    };
  }, [running, left, end]);

  const pointTo = (clientX) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    basketRef.current = Math.max(
      BASKET_W / 2,
      Math.min(1 - BASKET_W / 2, (clientX - rect.left) / rect.width)
    );
  };

  const replay = () => {
    itemsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = LIVES;
    basketRef.current = 0.5;
    runningRef.current = true;
    setItems([]);
    setScore(0);
    setLives(LIVES);
    setBasket(0.5);
    setLeft(SECONDS);
    setReward(null);
    setRunning(true);
  };

  if (!running && reward) {
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={score >= 30 ? '🧺' : lives <= 0 ? '💣' : '🍎'}
          title={t('common.finished')}
          lines={[
            { label: t('common.points'), value: score, color: '#44e092' },
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
          {score} · {'❤️'.repeat(lives)} · {left}s
        </span>
      }
      footer={<div className="px-4 py-3 text-center text-sm text-text-2">🍎 +1 · ⭐ +3 · 💣 −❤️</div>}
    >
      <div
        ref={areaRef}
        className="flex-1 min-h-0 relative overflow-hidden bg-gradient-to-b from-[#16203a] to-[#0f131c] touch-none cursor-pointer"
        onPointerDown={(e) => pointTo(e.clientX)}
        onPointerMove={(e) => e.buttons && pointTo(e.clientX)}
      >
        {items.map((item) => (
          <span
            key={item.id}
            className="absolute text-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
          >
            {item.emoji}
          </span>
        ))}

        <span
          className="absolute text-4xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${basket * 100}%`, top: `${CATCH_LINE * 100}%` }}
        >
          🧺
        </span>
      </div>
    </GameShell>
  );
}
