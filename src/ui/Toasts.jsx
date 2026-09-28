import { useGame } from '../engine/GameContext';

export default function Toasts() {
  const { toasts, dismissToast } = useGame();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto animate-pop-in bg-surface-container border border-primary/40 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm w-full text-right"
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="flex-1">
            <span className="block font-bold text-text text-sm">{t.title}</span>
            {t.sub && <span className="block text-xs text-text-2">{t.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
