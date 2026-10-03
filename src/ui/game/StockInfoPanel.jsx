import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, ExternalLink, Minus, Newspaper, Plus, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { SECTOR_BY_ID } from '../../stocks/catalog';
import { useCity } from '../../stocks/CityContext';
import { formatMoney, formatPct, toMajor } from '../../stocks/money';
import { moveColor } from '../../stocks/towers';
import TradeSheet from '../../stocks/TradeSheet';
import { shareOf, tierFor } from '../../city/tiers';

/** Three months of closes as one line, the cost basis dashed across it. */
function Sparkline({ closes, cost, colour }) {
  if (!closes || closes.length < 2) return null;
  const W = 320;
  const H = 64;
  const all = cost != null ? [...closes, cost] : closes;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const x = (i) => (i / (closes.length - 1)) * W;
  const y = (v) => H - 5 - ((v - lo) / span) * (H - 10);
  const d = closes.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={colour} opacity="0.12" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
      {cost != null && <line x1="0" x2={W} y1={y(cost)} y2={y(cost)} stroke="#6b7a90" strokeWidth="1" strokeDasharray="4 3" />}
    </svg>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-paper-100 last:border-0">
      <dt className="text-[12px] font-bold text-paper-muted">{label}</dt>
      <dd className="text-[14px] font-black tabular-nums text-end" style={tone ? { color: tone } : undefined}>{value}</dd>
    </div>
  );
}

/**
 * The building's card: a side panel on desktop, a bottom sheet on a phone.
 * The numbers people tap a building for, a small chart, buy and sell. It is
 * read-only when visiting somebody else's city.
 */
export default function StockInfoPanel({ symbol, onClose, readOnly = false, onNews, onPortfolio }) {
  const { t, loc } = useI18n();
  const { positionOf, holdingOf, quoteOf, totalUsd } = useCity();
  const [trade, setTrade] = useState(null);
  const position = positionOf(symbol);
  const holding = holdingOf(symbol);
  const quote = quoteOf(symbol);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!holding) return null;
  const sector = SECTOR_BY_ID[holding.sector];
  const missing = !position || position.missing;
  const name = loc(holding.name) || position?.name || symbol;
  const share = shareOf(position?.valueUsd, totalUsd);
  const tier = tierFor(share);
  const closes = quote?.closes?.map((v) => toMajor(v, quote.currency).price) ?? null;
  const dayTone = moveColor(position?.dayPct);

  return (
    <>
      <motion.aside
        key={symbol}
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="ui-layer absolute z-40 inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:end-4 md:top-[4.5rem] md:w-[340px]
          bg-white text-ink-900 rounded-t-[26px] md:rounded-3xl shadow-card-lg border border-paper-200
          px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-4 max-h-[78vh] md:max-h-[calc(100vh-9rem)] overflow-y-auto"
        role="dialog"
        aria-label={name}
      >
        <div className="md:hidden flex justify-center pb-2">
          <span className="h-1.5 w-10 rounded-full bg-paper-200" />
        </div>
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-[11px] font-black text-ink-900" style={{ background: `${sector?.color ?? '#c1c1ff'}33` }}>
            {symbol.replace(/\.(TA|L)$/, '').slice(0, 5)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-black text-ink-900 leading-tight truncate">{name}</h2>
            <p dir="ltr" className="text-[11.5px] text-paper-muted text-start">{symbol} · {sector ? loc(sector.name) : ''}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('panel.close')} className="w-9 h-9 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 grid place-items-center"><X size={18} strokeWidth={2.4} aria-hidden="true" /></button>
        </div>

        {missing ? (
          <p className="mt-4 text-[13px] font-bold text-brand-deep bg-brand/10 rounded-2xl p-3">{t('holding.noPrice')}</p>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[26px] font-black tabular-nums text-ink-900 leading-none">{formatMoney(position.price, position.currency)}</span>
              <span className="text-[13px] font-black tabular-nums" style={{ color: dayTone }}>{formatPct(position.dayPct)} {t('hud.today')}</span>
            </div>
            {closes && (
              <div className="mt-2 -mx-1">
                <Sparkline closes={closes} cost={position.cost} colour={moveColor(closes[closes.length - 1] - closes[0])} />
              </div>
            )}
            <dl className="mt-1">
              <Row label={t('panel.position')} value={formatMoney(position.valueUsd ?? position.value, position.valueUsd != null ? 'USD' : position.currency)} />
              <Row label={t('panel.allocation')} value={`${(share * 100).toFixed(1)}%`} />
              {position.gain != null && (
                <Row
                  label={t('panel.pl')}
                  value={`${position.gainUsd != null ? formatMoney(position.gainUsd, 'USD') : formatMoney(position.gain, position.currency)} · ${formatPct(position.gainPct)}`}
                  tone={moveColor(position.gainPct)}
                />
              )}
              <Row label={t('panel.shares')} value={position.qty.toLocaleString()} />
              {position.cost != null && <Row label={t('panel.avg')} value={formatMoney(position.cost, position.currency)} />}
              <Row label={t('panel.tier')} value={`${loc(tier.label)} · ${tier.tier}/5`} />
            </dl>
          </>
        )}

        {!readOnly && !missing && (
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setTrade('buy')} className="flex-1 h-11 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-1.5">
              <Plus size={17} strokeWidth={2.6} aria-hidden="true" />
              {t('holding.buyMore')}
            </button>
            <button type="button" onClick={() => setTrade('sell')} className="flex-1 h-11 rounded-2xl border-2 border-[#e2706f] text-[#e2706f] font-black text-[14px] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-1.5">
              <Minus size={17} strokeWidth={2.6} aria-hidden="true" />
              {t('holding.sellSome')}
            </button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <button type="button" onClick={() => onNews?.(symbol)} className="h-10 rounded-2xl bg-paper-50 border border-paper-200 text-ink-900 font-bold text-[11.5px] inline-flex items-center justify-center gap-1">
            <Newspaper size={14} aria-hidden="true" />{t('panel.news')}
          </button>
          <a href={`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`} target="_blank" rel="noopener noreferrer" className="h-10 rounded-2xl bg-paper-50 border border-paper-200 text-ink-900 font-bold text-[11.5px] inline-flex items-center justify-center gap-1">
            <ExternalLink size={14} aria-hidden="true" />{t('panel.view')}
          </a>
          <button type="button" onClick={() => onPortfolio?.()} className="h-10 rounded-2xl bg-paper-50 border border-paper-200 text-ink-900 font-bold text-[11.5px] inline-flex items-center justify-center gap-1">
            <Briefcase size={14} aria-hidden="true" />{t('panel.portfolio')}
          </button>
        </div>
      </motion.aside>

      {trade && (
        <TradeSheet
          symbol={symbol}
          side={trade}
          meta={{ sector: holding.sector, name: holding.name }}
          onClose={(done) => {
            setTrade(null);
            if (done && trade === 'sell' && !holdingOf(symbol)) onClose();
          }}
        />
      )}
    </>
  );
}
