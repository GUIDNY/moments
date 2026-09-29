import { useEffect } from 'react';

/**
 * A bottom sheet on phones, a centred dialog from `md` up — so the desktop
 * layout stays exactly as it was while mobile gets the native-feeling panel.
 *
 * `tone`:
 *   'paper' — white card, for content the player reads and acts on
 *   'ink'   — dark card, for chrome that should stay part of the game layer
 */
export default function Sheet({
  open,
  onClose,
  children,
  labelledBy,
  tone = 'paper',
  dismissable = true,
}) {
  useEffect(() => {
    if (!open || !dismissable) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissable]);

  if (!open) return null;

  const surface =
    tone === 'paper'
      ? 'bg-paper text-ink-900 border-paper-200'
      : 'bg-ink-800/95 text-text border-ink-line backdrop-blur-xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/55 backdrop-blur-[2px]"
      onClick={dismissable ? onClose : undefined}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`ui-layer w-full md:max-w-md border shadow-sheet animate-sheet-up md:animate-pop-in
          rounded-t-[26px] md:rounded-3xl
          max-h-[82vh] md:max-h-[85vh] overflow-y-auto overscroll-contain
          pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${surface}`}
      >
        {/* drag handle — mobile only, purely an affordance */}
        <div className="md:hidden sticky top-0 pt-2.5 pb-1 flex justify-center">
          <span
            className={`h-1.5 w-10 rounded-full ${
              tone === 'paper' ? 'bg-paper-200' : 'bg-white/25'
            }`}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
