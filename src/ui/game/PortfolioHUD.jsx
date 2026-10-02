import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, formatPct } from '../../stocks/money';
import { moveColor } from '../../stocks/towers';

/**
 * The one number, top centre: what the whole city is worth. Under it, today.
 * Beside it, small, cash and invested. Nothing else — the city is the hero,
 * the HUD only names it. On a phone it sits at the end of the top row, the
 * city's name chip at the start: centred, the two met in the middle.
 */
export default function PortfolioHUD({ totalUsd, dayUsd, dayPct, cash, investedUsd, onOpen }) {
  const { t } = useI18n();
  const tone = moveColor(dayPct);
  return (
    <div className="ui-layer pointer-events-none absolute inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top,0px))] md:top-3 z-30 flex justify-end md:justify-center px-3 md:px-4">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card px-4 py-2 text-ink-900 active:scale-[0.99] transition-transform"
      >
        <span className="text-center">
          <span className="block text-[9.5px] font-black uppercase tracking-wide text-paper-muted leading-none mb-1">{t('hud.value')}</span>
          <span className="block text-[22px] md:text-[26px] font-black tabular-nums leading-none">
            {totalUsd != null ? formatMoney(totalUsd, 'USD', true) : '…'}
          </span>
          {Number.isFinite(dayPct) && (
            <span className="block mt-1 text-[12px] font-bold tabular-nums leading-none" style={{ color: tone }}>
              {dayUsd >= 0 ? '+' : ''}{formatMoney(dayUsd, 'USD', true)} · {formatPct(dayPct)} {t('hud.today')}
            </span>
          )}
        </span>
        <span className="hidden sm:block w-px h-8 bg-paper-200" />
        <span className="hidden sm:grid grid-cols-2 gap-x-4 text-start">
          <span className="text-[10px] font-bold text-paper-muted leading-tight">{t('hud.cash')}</span>
          <span className="text-[10px] font-bold text-paper-muted leading-tight">{t('hud.invested')}</span>
          <span className="text-[13px] font-black tabular-nums leading-tight">{formatMoney(cash, 'USD', true)}</span>
          <span className="text-[13px] font-black tabular-nums leading-tight">{formatMoney(investedUsd, 'USD', true)}</span>
        </span>
      </button>
    </div>
  );
}
