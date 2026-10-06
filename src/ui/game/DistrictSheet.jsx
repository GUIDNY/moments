import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BookOpen, LocateFixed, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { BOARD_BY_SYMBOL, SECTOR_BY_ID } from '../../stocks/catalog';
import { useCity } from '../../stocks/CityContext';
import { districtStats } from '../../stocks/districts';
import { formatMoney, formatPct } from '../../stocks/money';
import { moveColor } from '../../stocks/towers';
import { goHome } from '../../world3d/focus';

/** Three months of the district's value as one line. */
function Line({ series, colour }) {
  if (!series || series.length < 2) return null;
  const W = 320;
  const H = 64;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const x = (i) => (i / (series.length - 1)) * W;
  const y = (v) => H - 5 - ((v - lo) / span) * (H - 10);
  const d = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={colour} opacity="0.12" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Tile({ label, value, sub, tone }) {
  return (
    <div className="rounded-2xl bg-paper-50 border border-paper-100 px-2 py-2 min-w-0">
      <div className="text-[10px] font-black uppercase tracking-wide text-paper-muted leading-none truncate">{label}</div>
      <div dir="ltr" className="mt-1 text-[13.5px] font-black tabular-nums leading-none text-start whitespace-nowrap" style={tone ? { color: tone } : undefined}>{value}</div>
      {sub && <div className="mt-1 text-[10.5px] font-bold tabular-nums text-paper-muted leading-none truncate">{sub}</div>}
    </div>
  );
}

/**
 * The neighbourhood's card: what one sector's buildings add up to, how the
 * district did today, since the buildings were bought, and over three
 * months, and who stands in it. A side panel on desktop, a bottom sheet on
 * a phone — the same shell as a building's card. It explains; it never
 * says buy or sell.
 */
export default function DistrictSheet({ sector, onClose, onOpenStock, onLesson }) {
  const { t, loc } = useI18n();
  const { holdings, positions, quoteOf, totalUsd, rates } = useCity();
  const info = SECTOR_BY_ID[sector];
  const stats = useMemo(() => districtStats({ sector, holdings, positions, quoteOf, totalUsd, rates }), [sector, holdings, positions, quoteOf, totalUsd, rates]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!info) return null;
  const colour = info.color ?? '#c1c1ff';
  const nameOf = (r) => loc(r.name) || loc(BOARD_BY_SYMBOL[r.symbol]?.name) || r.position?.name || r.symbol;
  const name = loc(info.name);
  const sharePct = Math.round(stats.share * 100);
  const lineTone = moveColor(stats.periodPct);

  return (
    <motion.aside
      key={sector}
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      className="ui-layer absolute z-40 inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:end-4 md:top-[4.5rem] md:w-[340px]
        bg-white text-ink-900 rounded-t-[26px] md:rounded-3xl shadow-card-lg border border-paper-200
        px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-4 max-h-[64vh] md:max-h-[calc(100vh-9rem)] overflow-y-auto"
      role="dialog"
      aria-label={t('district.title', { name })}
      data-testid="district-sheet"
    >
      <div className="md:hidden flex justify-center pb-2">
        <span className="h-1.5 w-10 rounded-full bg-paper-200" />
      </div>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-xl" style={{ background: `${colour}33` }}>{info.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-black text-ink-900 leading-tight truncate">{t('district.title', { name })}</h2>
          <p className="text-[11.5px] text-paper-muted">{t('district.sub', { n: stats.count, pct: sharePct })}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('panel.close')} className="w-9 h-9 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 grid place-items-center"><X size={18} strokeWidth={2.4} aria-hidden="true" /></button>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('district.value')}</span>
        <span className="text-[22px] font-black tabular-nums">{formatMoney(stats.valueUsd, 'USD')}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Tile label={t('district.today')} value={formatPct(stats.dayPct)} sub={`${stats.dayUsd >= 0 ? '+' : ''}${formatMoney(stats.dayUsd, 'USD', true)}`} tone={moveColor(stats.dayPct)} />
        <Tile label={t('district.sinceBuy')} value={formatPct(stats.gainPct)} sub={stats.gainUsd != null ? `${stats.gainUsd >= 0 ? '+' : ''}${formatMoney(stats.gainUsd, 'USD', true)}` : null} tone={moveColor(stats.gainPct)} />
        <Tile label={t('district.quarter')} value={formatPct(stats.periodPct)} tone={lineTone} />
      </div>
      {stats.series && (
        <div className="mt-2">
          <Line series={stats.series} colour={lineTone} />
          <p className="text-[10.5px] text-paper-muted -mt-1">{t('district.lineNote')}</p>
        </div>
      )}

      {/* a sentence on the neighbourhood: concentration, the mover, or just how it reads */}
      <div className="mt-3 rounded-2xl bg-paper-50 border border-paper-100 p-3 text-[12.5px] leading-snug text-ink-900/85">
        {stats.share >= 0.4 ? (
          <p>{t('district.heavy', { name, pct: sharePct })}</p>
        ) : stats.mover && Math.abs(stats.mover.dayUsd) > 0 ? (
          <p>{t('district.mover', { name: nameOf(stats.mover), pct: formatPct(stats.mover.position.dayPct), dir: t(stats.mover.dayUsd >= 0 ? 'district.up' : 'district.down') })}</p>
        ) : (
          <p>{t('district.quiet', { name })}</p>
        )}
        {onLesson && stats.share >= 0.4 && (
          <button type="button" onClick={() => onLesson('concentration')} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-black text-brand-deep"><BookOpen size={13} aria-hidden="true" />{t('insight.learn')}</button>
        )}
      </div>

      <h3 className="mt-4 text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('district.buildings')}</h3>
      <ul className="mt-1 divide-y divide-paper-100">
        {stats.rows.map((r) => (
          <li key={r.symbol}>
            <button type="button" onClick={() => onOpenStock?.(r.symbol)} className="w-full flex items-center gap-3 py-2 text-start">
              <span className="w-9 h-9 shrink-0 rounded-xl grid place-items-center text-[10px] font-black text-ink-900" style={{ background: `${colour}33` }}>{r.symbol.replace(/\.(TA|L)$/, '').slice(0, 5)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-black truncate">{nameOf(r)}</span>
                <span className="block text-[11px] text-paper-muted tabular-nums">{t('district.weight', { pct: Math.round(r.weight * 100) })} · {formatMoney(r.position.valueUsd, 'USD', true)}</span>
              </span>
              <span className="text-[12.5px] font-black tabular-nums" style={{ color: moveColor(r.position.dayPct) }}>{formatPct(r.position.dayPct)}</span>
            </button>
          </li>
        ))}
        {stats.unpriced > 0 && <li className="py-2 text-[11.5px] text-paper-muted">{t('district.unpriced', { n: stats.unpriced })}</li>}
      </ul>

      <button type="button" onClick={() => { goHome(); onClose(); }} className="mt-3 w-full h-11 rounded-2xl bg-paper-50 border border-paper-200 text-ink-900 font-bold text-[13px] inline-flex items-center justify-center gap-2">
        <LocateFixed size={16} aria-hidden="true" />
        {t('district.back')}
      </button>
    </motion.aside>
  );
}
