import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';

export default function Toasts() {
  const { toasts, dismissToast } = useGame();
  const { t, loc } = useI18n();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="pointer-events-auto animate-pop-in bg-surface-container border border-primary/40 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm w-full text-right"
        >
          <span className="text-2xl">{toast.emoji}</span>
          <span className="flex-1">
            <span className="block font-bold text-text text-sm">
              {toast.titleKey ? t(toast.titleKey, toast.titleParams) : loc(toast.title)}
            </span>
            {(toast.subKey || toast.sub) && (
              <span className="block text-xs text-text-2">
                {toast.subKey ? t(toast.subKey, toast.subParams) : loc(toast.sub)}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
