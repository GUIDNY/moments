import { avatarEmoji } from '../data/items';
import { formatCoins, levelTitle } from '../engine/economy';
import { useGame } from '../engine/GameContext';

/** The permanent bar over the city: who you are, what you're worth. */
export default function CityHud({ onOpenProfile }) {
  const { state, levelInfo, dailyBonus } = useGame();

  return (
    <header className="absolute top-0 inset-x-0 z-30 p-3 pointer-events-none">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onOpenProfile}
          className="pointer-events-auto flex items-center gap-2.5 bg-surface-container/95 backdrop-blur border border-border/60 rounded-2xl px-3 py-2 shadow-lg"
        >
          <span className="text-2xl">{avatarEmoji(state.avatar)}</span>
          <span className="text-right">
            <span className="block text-xs font-bold text-text leading-tight">{state.name}</span>
            <span className="block text-[10px] text-primary leading-tight">
              רמה {levelInfo.level} · {levelTitle(levelInfo.level)}
            </span>
            <span className="block w-20 h-1 bg-surface-bright rounded-full mt-1 overflow-hidden">
              <span className="block h-full bg-primary" style={{ width: `${levelInfo.pct}%` }} />
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {dailyBonus.available && (
          <span className="pointer-events-none bg-gold/20 border border-gold/50 text-gold rounded-2xl px-3 py-2 text-xs font-bold animate-bob">
            🎁 בונוס בבנק
          </span>
        )}

        <span className="bg-surface-container/95 backdrop-blur border border-gold/40 rounded-2xl px-4 py-2.5 font-bold text-gold tabular-nums shadow-lg">
          🪙 {formatCoins(state.coins)}
        </span>
      </div>
    </header>
  );
}
