import { TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, formatPct } from '../../stocks/money';
import { moveColor } from '../../stocks/towers';
import NumberTicker from './NumberTicker';

/**
 * The one number, top centre: what the whole city is worth. Under it, today,
 * and the level with its XP bar. Nothing else — the city is the hero, the
 * HUD only names it; the cash is a building now. On a phone it sits at the
 * end of the top row, the city's name chip at the start.
 */
export default function PortfolioHUD({ totalUsd, dayUsd, dayPct, level, onOpen }) {
  const { t } = useI18n();
  const tone = moveColor(dayPct);
  return (
    <div className="ui-layer pointer-events-none absolute inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top,0px))] md:top-3 z-30 flex justify-end md:justify-center px-3 md:px-4">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto rounded-2xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card px-3.5 py-2 text-ink-900 text-start active:scale-[0.99] transition-transform"
      >
        <span className="block text-[9.5px] font-black uppercase tracking-wide text-paper-muted leading-none">{t('hud.value')}</span>
        <span className="block mt-0.5 text-[21px] md:text-[24px] font-black tabular-nums leading-none">
          {totalUsd != null ? <NumberTicker value={totalUsd} format={(v) => formatMoney(v, 'USD', true)} /> : '…'}
        </span>
        {Number.isFinite(dayPct) && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-bold tabular-nums leading-none" style={{ color: tone }}>
            {dayPct >= 0 ? <TrendingUp size={12} strokeWidth={2.6} aria-hidden="true" /> : <TrendingDown size={12} strokeWidth={2.6} aria-hidden="true" />}
            <span>{t('hud.today')} {formatPct(dayPct)} · {dayUsd >= 0 ? '+' : ''}{formatMoney(dayUsd, 'USD', true)}</span>
          </span>
        )}
        {level && (
          <span className="mt-1.5 flex items-center gap-2">
            <span className="text-[10.5px] font-black text-brand-deep leading-none">{t('hud.level', { n: level.level })}</span>
            <span className="relative h-1.5 w-20 rounded-full bg-paper-200 overflow-hidden">
              <span className="absolute inset-y-0 start-0 rounded-full bg-brand" style={{ width: `${level.max ? 100 : Math.round((level.into / Math.max(1, level.span)) * 100)}%` }} />
            </span>
            <span className="text-[10px] font-bold text-paper-muted leading-none tabular-nums">{level.max ? t('hud.maxLevel') : t('hud.xpNext', { xp: level.need, n: level.level + 1 })}</span>
          </span>
        )}
      </button>
    </div>
  );
}
