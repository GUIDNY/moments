import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { healthOf } from '../../stocks/health';
import { formatMoney } from '../../stocks/money';
import Sheet from '../Sheet';

/** The score's colour: a hue, never red/green alarm. */
const tone = (score) => (score >= 70 ? '#4caf7d' : score >= 40 ? '#f5c542' : '#f59a52');

/**
 * One small chip under the HUD: "diversification 72/100". A tap opens the
 * sheet that says what the number is made of, in the portfolio's own
 * numbers, with no advice attached.
 */
export function HealthChip({ onOpen }) {
  const { t } = useI18n();
  const { holdings, positions, cash } = useCity();
  const health = useMemo(() => healthOf({ holdings, positions, cash }), [holdings, positions, cash]);
  if (!health) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="ui-layer pointer-events-auto inline-flex items-center gap-1.5 h-8 ps-2 pe-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card text-[11px] font-black text-ink-900 active:scale-95 transition-transform"
      aria-label={t('health.score', { n: health.score })}
    >
      <span className="w-4 h-4 rounded-full grid place-items-center" style={{ background: `${tone(health.score)}33`, color: tone(health.score) }}>
        <PieChart size={11} strokeWidth={2.8} aria-hidden="true" />
      </span>
      {t('health.title')}
      <span className="tabular-nums" style={{ color: tone(health.score) }}>{health.score}/100</span>
    </button>
  );
}

function Bar({ label, value, max }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-[12px] font-bold text-paper-muted">{label}</span>
      <span className="relative flex-1 h-2 rounded-full bg-paper-200 overflow-hidden">
        <span className="absolute inset-y-0 start-0 rounded-full bg-brand" style={{ width: `${(value / max) * 100}%` }} />
      </span>
      <span className="w-12 text-end text-[12px] font-black tabular-nums text-ink-900">{value}/{max}</span>
    </div>
  );
}

export function HealthSheet({ open, onClose, onLesson }) {
  const { t, loc } = useI18n();
  const { holdings, positions, cash } = useCity();
  const health = useMemo(() => healthOf({ holdings, positions, cash }), [holdings, positions, cash]);
  if (!open || !health) return null;
  const n = health.note;
  const sentence =
    n.key === 'health.concentrated' ? t(n.key, { sector: n.sector, pct: n.pct })
    : n.key === 'health.spread' ? t(n.key, { n: n.n, pct: n.pct })
    : n.key === 'health.cashHeavy' ? t(n.key, { pct: n.pct })
    : t(n.key);
  return (
    <Sheet open onClose={onClose} title={t('health.sheetTitle')} tone="paper">
      <div className="flex items-center gap-4">
        <span className="relative w-20 h-20 shrink-0 rounded-full grid place-items-center" style={{ background: `conic-gradient(${tone(health.score)} ${health.score * 3.6}deg, #e8ecf1 0)` }}>
          <span className="w-14 h-14 rounded-full bg-white grid place-items-center text-[18px] font-black tabular-nums text-ink-900">{health.score}</span>
        </span>
        <p className="text-[14px] font-bold text-ink-900 leading-snug">{sentence}</p>
      </div>
      <div className="mt-4 space-y-2">
        <Bar label={t('health.holdings')} value={health.parts.holdings} max={40} />
        <Bar label={t('health.sectors')} value={health.parts.sectors} max={30} />
        <Bar label={t('health.biggest')} value={health.parts.concentration} max={30} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
        <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
          <dt className="text-[10.5px] font-bold text-paper-muted">{t('health.biggest')}</dt>
          <dd className="font-black text-ink-900 truncate">{loc(health.biggest.name) || health.biggest.symbol} · {Math.round(health.biggest.pct * 100)}%</dd>
        </div>
        <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
          <dt className="text-[10.5px] font-bold text-paper-muted">{t('health.topSector')}</dt>
          <dd className="font-black text-ink-900 truncate">{loc(health.topSector.name)} · {Math.round(health.topSector.pct * 100)}%</dd>
        </div>
        <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
          <dt className="text-[10.5px] font-bold text-paper-muted">{t('health.holdings')} · {t('health.sectors')}</dt>
          <dd className="font-black text-ink-900 tabular-nums">{health.count} · {health.sectors}</dd>
        </div>
        <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
          <dt className="text-[10.5px] font-bold text-paper-muted">{t('hud.cash')}</dt>
          <dd className="font-black text-ink-900 tabular-nums">{formatMoney(cash, 'USD', true)} · {Math.round(health.cashPct * 100)}%</dd>
        </div>
      </dl>
      <p className="text-[12px] text-paper-muted leading-snug mt-4">{t('health.explain')}</p>
      {onLesson && (
        <button type="button" onClick={() => { onClose(); onLesson('concentration'); }} className="mt-3 w-full h-11 rounded-2xl bg-brand/12 text-brand-deep font-black text-[13px]">
          {t('insight.learn')}
        </button>
      )}
    </Sheet>
  );
}
