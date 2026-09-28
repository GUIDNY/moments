import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const SPINS = 3;

/** Narrow slices pay more — pure timing, no luck to hide behind. */
const SEGMENTS = [
  { value: 10, weight: 3, color: '#3c4a40' },
  { value: 60, weight: 2, color: '#44e092' },
  { value: 200, weight: 1.2, color: '#c1c1ff' },
  { value: 600, weight: 0.7, color: '#f5c542' },
  { value: 200, weight: 1.2, color: '#c1c1ff' },
  { value: 60, weight: 2, color: '#44e092' },
  { value: 10, weight: 3, color: '#3c4a40' },
];

const TOTAL_WEIGHT = SEGMENTS.reduce((s, x) => s + x.weight, 0);
const BOUNDS = (() => {
  let acc = 0;
  return SEGMENTS.map((s) => {
    const from = acc / TOTAL_WEIGHT;
    acc += s.weight;
    return { ...s, from, to: acc / TOTAL_WEIGHT };
  });
})();

const segmentAt = (t) => BOUNDS.find((s) => t >= s.from && t < s.to) ?? BOUNDS[BOUNDS.length - 1];

export default function WheelGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const [spin, setSpin] = useState(0);
  const [marker, setMarker] = useState(0);
  const [running, setRunning] = useState(true);
  const [results, setResults] = useState([]);
  const [reward, setReward] = useState(null);
  const [lastHit, setLastHit] = useState(null);

  const rafRef = useRef(0);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const lastTsRef = useRef(0);

  const speed = 0.55 + spin * 0.22; // fraction of the track per second

  useEffect(() => {
    if (!running) return undefined;
    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;
      let next = posRef.current + dirRef.current * speed * dt;
      if (next >= 1) {
        next = 1;
        dirRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
      }
      posRef.current = next;
      setMarker(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [running, speed]);

  const finish = useCallback(
    (all) => {
      const total = all.reduce((s, v) => s + v, 0);
      setReward(finishGame(meta.id, { score: total, base: total }));
      setRunning(false);
    },
    [finishGame, meta.id]
  );

  const stop = () => {
    if (!running) return;
    const hit = segmentAt(posRef.current);
    const all = [...results, hit.value];
    setResults(all);
    setLastHit(hit);
    if (all.length >= SPINS) {
      finish(all);
      return;
    }
    setSpin((s) => s + 1);
  };

  const replay = () => {
    setSpin(0);
    setResults([]);
    setLastHit(null);
    setReward(null);
    posRef.current = 0;
    dirRef.current = 1;
    setMarker(0);
    setRunning(true);
  };

  if (!running && reward) {
    const total = results.reduce((s, v) => s + v, 0);
    return (
      <GameShell title={meta.name} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={total >= 900 ? '🎉' : total >= 300 ? '🎡' : '🙂'}
          title={total >= 900 ? 'עצירה מושלמת!' : 'סיימת שלוש עצירות'}
          lines={[
            { label: 'עצירות', value: results.join(' · ') },
            { label: 'סך הכול', value: total, color: '#f5c542' },
          ]}
          coins={reward.coins}
          xp={reward.xp}
          multiplier={multiplier}
          onReplay={replay}
          onExit={onExit}
          replayLabel="עוד שלוש"
        />
      </GameShell>
    );
  }

  return (
    <GameShell
      title={meta.name}
      emoji={meta.emoji}
      onExit={onExit}
      hud={<span className="text-sm font-bold text-text-2 tabular-nums ml-3">עצירה {spin + 1}/{SPINS}</span>}
      footer={
        <div className="px-4 py-4">
          <Button size="lg" variant="gold" className="w-full" onClick={stop}>
            עצור! 🛑
          </Button>
        </div>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8 p-6">
        <p className="text-text-2 text-center max-w-sm">
          הפס רץ הלוך ושוב ומאיץ בכל עצירה. הפרוסה הצרה באמצע שווה הכי הרבה.
        </p>

        <div className="w-full max-w-lg">
          <div className="relative h-20 rounded-2xl overflow-hidden border border-border/60 flex">
            {BOUNDS.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-center font-bold text-surface text-sm"
                style={{ flexGrow: s.weight, background: s.color }}
              >
                {s.value}
              </div>
            ))}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              style={{ left: `calc(${marker * 100}% - 3px)` }}
            />
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: SPINS }, (_, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-lg text-sm font-bold tabular-nums ${
                  results[i] != null ? 'bg-gold/20 text-gold' : 'bg-surface-bright text-text-3'
                }`}
              >
                {results[i] ?? '—'}
              </span>
            ))}
          </div>
        </div>

        {lastHit && running && (
          <div className="text-2xl font-bold animate-pop-in" style={{ color: lastHit.color }}>
            +{lastHit.value} 🪙
          </div>
        )}
      </div>
    </GameShell>
  );
}
