import { TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, formatPct } from '../../stocks/money';
import { STARTING_CASH } from '../../stocks/store';
import { moveColor } from '../../stocks/towers';
import NumberTicker from './NumberTicker';

/**
 * The scoreboard, top centre: what the whole city is worth, today's move in
 * money and in percent, the return since the game began, the cash still in
 * the purse, and the level with its XP bar. One white card, the market's
 * state as a small dot in its corner. The city is the hero; the HUD names
 * it in the numbers a reader wants in the first three seconds and no more.
 * On a phone it sits at the end of the top row, the city's name chip at
 * the start.
 */
function Stat({ label, value, tone }) {
  return (
    <span className="min-w-0">
      <span className="block text-[9px] font-black uppercase tracking-wide text-paper-muted leading-none">{label}</span>
      <span className="block mt-0.5 text-[12px] font-black tabular-nums leading-none truncate" style={tone ? { color: tone } : undefined}>{value}</span>
    </span>
  );
}

export default function PortfolioHUD({ totalUsd, cash, dayUsd, dayPct, gainPct = null, baseUsd = STARTING_CASH, level, open = true, onOpen, hideAmounts = false }) {
  const { t } = useI18n();
  const tone = moveColor(dayPct);
  // the return: against cost when the holdings carry one, else since the
  // line began — the purse for a played game, the first total for an import
  const ret = gainPct != null ? gainPct : totalUsd != null && baseUsd > 0 ? ((totalUsd - baseUsd) / baseUsd) * 100 : null;
  // somebody else's city, shared "city only": shares and the day, no money
  const money = (v, compact) => (hideAmounts ? '•••' : formatMoney(v, 'USD', compact));
  return (
    <div className="ui-layer pointer-events-none absolute inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top,0px))] md:top-3 z-30 flex justify-end md:justify-center px-3 md:px-4">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto w-[232px] md:w-[300px] rounded-[20px] bg-white/95 backdrop-blur-md border border-paper-200 shadow-card px-3.5 pt-2.5 pb-2.5 text-ink-900 text-start active:scale-[0.99] transition-transform"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-[9.5px] font-black uppercase tracking-wide text-paper-muted leading-none">{t('hud.value')}</span>
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-paper-muted leading-none" title={open ? t('hud.open') : t('hud.closed')}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-[#4caf7d]' : 'bg-paper-300'}`} aria-hidden="true" />
            {open ? t('hud.open') : t('hud.closed')}
          </span>
        </span>
        <span className="flex items-baseline justify-between gap-2 mt-1">
          <span className="text-[22px] md:text-[26px] font-black tabular-nums leading-none">
            {hideAmounts ? '•••' : totalUsd != null ? <NumberTicker value={totalUsd} format={(v) => formatMoney(v, 'USD', true)} /> : '…'}
          </span>
          {Number.isFinite(dayPct) && (
            <span className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[11px] font-black tabular-nums leading-none" style={{ color: tone, background: `${tone}1f` }}>
              {dayPct >= 0 ? <TrendingUp size={11} strokeWidth={2.8} aria-hidden="true" /> : <TrendingDown size={11} strokeWidth={2.8} aria-hidden="true" />}
              {formatPct(dayPct)}
            </span>
          )}
        </span>
        {Number.isFinite(dayPct) && (
          <span className="block mt-1 text-[10.5px] font-bold tabular-nums leading-none text-paper-muted">
            {t('hud.today')} <span style={{ color: tone }}>{hideAmounts ? '' : dayUsd >= 0 ? '+' : ''}{money(dayUsd, true)}</span>
          </span>
        )}
        <span className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-paper-100">
          <Stat label={t('hud.return')} value={hideAmounts ? '•••' : ret != null ? formatPct(ret) : '—'} tone={ret != null && !hideAmounts ? moveColor(ret) : undefined} />
          <Stat label={t('hud.cash')} value={cash != null ? money(cash, true) : '—'} />
          {level && (
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-wide text-brand-deep leading-none">{t('hud.level', { n: level.level })}</span>
              <span className="mt-1 block relative h-1.5 w-full rounded-full bg-paper-200 overflow-hidden" title={level.max ? t('hud.maxLevel') : t('hud.xpNext', { xp: level.need, n: level.level + 1 })}>
                <span className="absolute inset-y-0 start-0 rounded-full bg-brand" style={{ width: `${level.max ? 100 : Math.round((level.into / Math.max(1, level.span)) * 100)}%` }} />
              </span>
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
