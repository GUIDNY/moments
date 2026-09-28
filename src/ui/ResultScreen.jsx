import Button from './Button';
import { formatCoins } from '../engine/economy';

/** The payout screen every mini-game ends on. */
export default function ResultScreen({
  emoji = '🏁',
  title = 'סיימת!',
  lines = [],
  coins = 0,
  xp = 0,
  multiplier = 1,
  onReplay,
  onExit,
  replayLabel = 'עוד סיבוב',
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div className="text-center max-w-sm w-full animate-pop-in">
        <div className="text-7xl mb-3">{emoji}</div>
        <h2 className="text-3xl font-bold text-text mb-5">{title}</h2>

        {lines.length > 0 && (
          <div className="bg-surface-container border border-border/60 rounded-2xl divide-y divide-border/40 mb-5">
            {lines.map((line) => (
              <div key={line.label} className="flex justify-between items-center px-4 py-2.5">
                <span className="text-sm text-text-2">{line.label}</span>
                <span className="font-bold tabular-nums" style={{ color: line.color || '#dfe2ef' }}>
                  {line.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5 mb-6">
          <div className="text-4xl font-bold text-gold tabular-nums">🪙 +{formatCoins(coins)}</div>
          <div className="text-sm text-text-2 mt-1">
            +{xp} XP
            {multiplier > 1 && <span className="text-primary"> · בונוס פריט ×{multiplier}</span>}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onReplay} className="flex-1">
            {replayLabel}
          </Button>
          <Button variant="ghost" onClick={onExit} className="flex-1">
            חזרה לעיר
          </Button>
        </div>
      </div>
    </div>
  );
}
