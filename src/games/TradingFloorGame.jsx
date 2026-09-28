import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { T0, genTrend } from '../engine/market';
import { lcg, r2, randomSeed } from '../engine/rng';
import Button from '../ui/Button';
import CandleChart from '../ui/CandleChart';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const HISTORY = 18;
const SESSION = 45; // candles you get to trade
const TICK_MS = 620;
const START_CASH = 1000;

/**
 * A live session: the tape prints one candle at a time and you flip between
 * cash and shares. Your return over the session is the score.
 */
export default function TradingFloorGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const [seed, setSeed] = useState(randomSeed);

  const series = useMemo(() => {
    const rng = lcg(seed);
    const drift = (rng() - 0.45) * 0.6;
    return genTrend(T0, 60 + Math.round(rng() * 120), HISTORY + SESSION, drift, 2.6, seed + 3).candles;
  }, [seed]);

  const [tick, setTick] = useState(0);
  const [cash, setCash] = useState(START_CASH);
  const [shares, setShares] = useState(0);
  const [trades, setTrades] = useState(0);
  const [running, setRunning] = useState(true);
  const [reward, setReward] = useState(null);
  const [result, setResult] = useState(null);

  const stateRef = useRef({ cash: START_CASH, shares: 0 });
  stateRef.current = { cash, shares };

  const visible = series.slice(0, HISTORY + tick + 1);
  const price = visible[visible.length - 1].close;
  const equity = r2(cash + shares * price);
  const pnlPct = r2(((equity - START_CASH) / START_CASH) * 100);

  const finish = useCallback(
    (finalPrice) => {
      setRunning(false);
      const { cash: c, shares: s } = stateRef.current;
      const finalEquity = c + s * finalPrice;
      const pct = ((finalEquity - START_CASH) / START_CASH) * 100;
      const rounded = Math.round(pct);
      setResult({ equity: r2(finalEquity), pct: rounded });
      setReward(
        finishGame(meta.id, {
          score: rounded,
          base: 60 + Math.max(0, rounded) * 22,
        })
      );
    },
    [finishGame, meta.id]
  );

  useEffect(() => {
    if (!running) return undefined;
    if (tick >= SESSION) {
      finish(series[series.length - 1].close);
      return undefined;
    }
    const t = setTimeout(() => setTick((v) => v + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [tick, running, series, finish]);

  const buy = () => {
    if (!running || cash < price) return;
    const qty = Math.floor(cash / price);
    setShares((s) => s + qty);
    setCash((c) => r2(c - qty * price));
    setTrades((t) => t + 1);
  };

  const sell = () => {
    if (!running || shares === 0) return;
    setCash((c) => r2(c + shares * price));
    setShares(0);
    setTrades((t) => t + 1);
  };

  const replay = () => {
    setSeed(randomSeed());
    setTick(0);
    setCash(START_CASH);
    setShares(0);
    setTrades(0);
    setResult(null);
    setReward(null);
    setRunning(true);
  };

  if (!running && reward) {
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={result.pct >= 20 ? '🤑' : result.pct > 0 ? '📈' : '📉'}
          title={result.pct >= 20 ? 'סגרת בגדול!' : result.pct > 0 ? 'סיימת בירוק' : 'סיימת באדום'}
          lines={[
            { label: 'הון בסיום', value: `₪${result.equity.toLocaleString('he-IL')}` },
            {
              label: 'תשואה',
              value: `${result.pct > 0 ? '+' : ''}${result.pct}%`,
              color: result.pct >= 0 ? '#44e092' : '#ffb4aa',
            },
            { label: 'עסקאות', value: trades },
          ]}
          coins={reward.coins}
          xp={reward.xp}
          multiplier={multiplier}
          onReplay={replay}
          onExit={onExit}
          replayLabel="סשן חדש"
        />
      </GameShell>
    );
  }

  const invested = shares > 0;

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">{tick}/{SESSION}</span>}
      footer={
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div>
              <div className="text-[11px] text-text-3">מזומן</div>
              <div className="font-bold tabular-nums text-text">₪{cash.toLocaleString('he-IL')}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-3">מניות</div>
              <div className="font-bold tabular-nums text-text">{shares}</div>
            </div>
            <div>
              <div className="text-[11px] text-text-3">שווי תיק</div>
              <div
                className="font-bold tabular-nums"
                style={{ color: pnlPct >= 0 ? '#44e092' : '#ffb4aa' }}
              >
                {pnlPct > 0 ? '+' : ''}
                {pnlPct}%
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="up" size="lg" className="flex-1" disabled={invested || cash < price} onClick={buy}>
              קנה הכל
            </Button>
            <Button variant="down" size="lg" className="flex-1" disabled={!invested} onClick={sell}>
              מכור הכל
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-surface-container/60 shrink-0">
          <span className="text-xs text-text-3">CNDL · סשן חי</span>
          <span className="font-bold tabular-nums text-text">₪{price.toFixed(2)}</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              invested ? 'bg-primary/20 text-primary' : 'bg-surface-bright text-text-3'
            }`}
          >
            {invested ? 'בפוזיציה' : 'במזומן'}
          </span>
        </div>
        <div className="h-1 bg-surface-bright shrink-0">
          <div className="h-full bg-tertiary transition-all" style={{ width: `${(tick / SESSION) * 100}%` }} />
        </div>
        <div className="flex-1 min-h-0">
          <CandleChart candles={visible} />
        </div>
      </div>
    </GameShell>
  );
}
