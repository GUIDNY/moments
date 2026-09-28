import { formatCoins } from '../engine/economy';
import { useGame } from '../engine/GameContext';

/** Common chrome around every mini-game: exit, title, live score, wallet. */
export default function GameShell({ title, emoji, onExit, hud = null, children, footer = null }) {
  const { state } = useGame();
  return (
    <div className="fixed inset-0 bg-surface flex flex-col z-40">
      <header className="flex items-center gap-3 px-3 h-14 bg-surface-container border-b border-border/60 shrink-0">
        <button
          type="button"
          onClick={onExit}
          className="px-3 py-1.5 rounded-lg bg-surface-bright text-text-2 hover:text-text font-bold text-sm"
        >
          ← יציאה
        </button>
        <h1 className="font-bold text-text flex items-center gap-2 truncate">
          <span className="text-xl">{emoji}</span>
          <span className="truncate">{title}</span>
        </h1>
        <div className="flex-1" />
        {hud}
        <span className="flex items-center gap-1 text-gold font-bold tabular-nums text-sm">
          🪙 {formatCoins(state.coins)}
        </span>
      </header>

      <main className="relative flex-1 min-h-0 flex flex-col">{children}</main>

      {footer && (
        <footer className="shrink-0 bg-surface-container border-t border-border/60">{footer}</footer>
      )}
    </div>
  );
}
