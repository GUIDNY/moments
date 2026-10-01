import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SECTOR_BY_ID } from './catalog';
import { useCity } from './CityContext';
import { formatMoney, formatPct, toMajor } from './money';
import { moveColor } from './towers';
import TradeSheet from './TradeSheet';

/**
 * Three months of closes as one line, with the cost basis drawn across it
 * when there is one: the single picture that says whether you bought high
 * or low. No axes — the shape is the point, the numbers are beside it.
 */
function Sparkline({ closes, cost, colour }) {
  if (!closes || closes.length < 2) return null;
  const W = 320;
  const H = 72;
  const all = cost != null ? [...closes, cost] : closes;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = hi - lo || 1;
  const x = (i) => (i / (closes.length - 1)) * W;
  const y = (v) => H - 6 - ((v - lo) / span) * (H - 12);
  const d = closes.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[72px]" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={colour} opacity="0.12" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
      {cost != null && (
        <line x1="0" x2={W} y1={y(cost)} y2={y(cost)} stroke="#6b7a90" strokeWidth="1" strokeDasharray="4 3" />
      )}
    </svg>
  );
}

/** Where today's price sits between the year's low and high. */
function RangeBar({ low, high, price }) {
  if (!(high > low) || !Number.isFinite(price)) return null;
  const at = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return (
    <div className="mt-1">
      <div className="relative h-2 rounded-full bg-paper-200">
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-brand ring-2 ring-white" style={{ left: `${at}%` }} />
      </div>
    </div>
  );
}

/** One figure, with its own colour when it has a sign. */
function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-paper-50 border border-paper-200 p-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{label}</div>
      <div
        className="text-[16px] font-black tabular-nums mt-0.5"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/** What you get for walking into a tower. */
export default function HoldingScreen({ symbol, onExit }) {
  const { t, loc } = useI18n();
  const { positionOf, holdingOf, quoteOf, display, isShared } = useCity();
  const position = positionOf(symbol);
  const holding = holdingOf(symbol);
  const quote = quoteOf(symbol);
  const [trade, setTrade] = useState(null); // 'buy' | 'sell' | null

  if (!holding) return null;
  const sector = SECTOR_BY_ID[holding.sector];
  const missing = !position || position.missing;
  // the closes and the year's range arrive in the stock's quoted unit
  const closes = quote?.closes?.map((v) => toMajor(v, quote.currency).price) ?? null;
  const low52 = quote?.low52 != null ? toMajor(quote.low52, quote.currency).price : null;
  const high52 = quote?.high52 != null ? toMajor(quote.high52, quote.currency).price : null;

  return (
    <div className="fixed inset-0 bg-paper overflow-y-auto">
      <header
        className="sticky top-0 z-10 backdrop-blur-md border-b border-paper-200"
        style={{ background: `${sector?.color ?? '#c1c1ff'}14` }}
      >
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-3.5 rounded-xl bg-paper border border-paper-200 text-[13px] font-bold text-ink-900 active:scale-95 transition-transform"
          >
            {t('common.back')}
          </button>
          <span dir="ltr" className="flex-1 min-w-0 text-[13px] font-black text-ink-900 truncate text-center">
            {symbol}
          </span>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-4">
        <div>
          <h1 className="text-[22px] font-black text-ink-900 leading-tight">
            {loc(holding.name) || position?.name || symbol}
          </h1>
          <p className="text-[12.5px] text-paper-muted mt-0.5">
            {sector ? `${sector.emoji} ${loc(sector.name)}` : ''}
            {position?.exchange ? ` · ${position.exchange}` : ''}
          </p>
        </div>

        {missing ? (
          <div className="rounded-2xl bg-brand/10 p-4">
            <p className="text-[13px] font-bold text-brand-deep leading-snug">{t('holding.noPrice')}</p>
          </div>
        ) : (
          <>
            {/* the two numbers people actually came for */}
            <div className="rounded-2xl border border-paper-200 bg-paper-50 p-4">
              <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
                {t('holding.value')}
              </div>
              <div className="text-[26px] font-black text-ink-900 tabular-nums leading-tight">
                {formatMoney(position.value, position.currency)}
              </div>
              <div
                className="text-[14px] font-black tabular-nums mt-1"
                style={{ color: moveColor(position.dayPct) }}
              >
                {formatPct(position.dayPct)} · {formatMoney(position.dayChange, position.currency)}{' '}
                <span className="text-paper-muted font-bold">{t('holding.today')}</span>
              </div>
            </div>

            {/* the story: three months of price, with what you paid drawn across it */}
            {closes && (
              <div className="rounded-2xl border border-paper-200 bg-paper-50 p-3">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wide text-paper-muted">
                  <span>{t('holding.chart')}</span>
                  {position.cost != null && <span>— — {t('holding.cost')}</span>}
                </div>
                <Sparkline closes={closes} cost={position.cost} colour={moveColor(closes[closes.length - 1] - closes[0])} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Stat label={t('holding.price')} value={formatMoney(position.price, position.currency)} />
              <Stat label={t('holding.qty')} value={position.qty.toLocaleString()} />
              {position.cost != null && (
                <Stat label={t('holding.cost')} value={formatMoney(position.cost, position.currency)} />
              )}
              {position.gain != null && (
                <Stat
                  label={t('holding.gain')}
                  value={`${formatMoney(position.gain, position.currency)} (${formatPct(position.gainPct)})`}
                  tone={moveColor(position.gainPct)}
                />
              )}
              {position.converted != null && position.currency !== display && (
                <Stat label={t('holding.inDisplay', { c: display })} value={formatMoney(position.converted, display)} />
              )}
            </div>

            {/* what the numbers mean, right under them */}
            <div className="rounded-2xl bg-paper-50 border border-paper-200 p-3 space-y-2 text-[12.5px] text-ink-900/75 leading-snug">
              {position.gain != null && <p>💡 {t('holding.explainGain')}</p>}
              <p>📅 {t('holding.explainDay')}</p>
              {low52 != null && high52 != null && (
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-wide text-paper-muted">
                    <span>{t('holding.range52')}</span>
                    <span className="tabular-nums">{formatMoney(low52, position.currency)} – {formatMoney(high52, position.currency)}</span>
                  </div>
                  <RangeBar low={low52} high={high52} price={position.price} />
                  <p className="mt-1">{t('holding.explainRange')}</p>
                </div>
              )}
            </div>
          </>
        )}

        {!isShared && !missing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTrade('buy')}
              className="flex-1 h-12 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab active:scale-[0.99] transition-transform"
            >
              {t('holding.buyMore')}
            </button>
            <button
              type="button"
              onClick={() => setTrade('sell')}
              className="flex-1 h-12 rounded-2xl border-2 border-[#e2706f] text-[#e2706f] font-black text-[14px] active:scale-[0.99] transition-transform"
            >
              {t('holding.sellSome')}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onExit}
          className="w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px] active:scale-[0.99] transition-transform"
        >
          {t('project.backToTown')}
        </button>
      </div>

      {trade && (
        <TradeSheet
          symbol={symbol}
          side={trade}
          meta={{ sector: holding.sector, name: holding.name }}
          onClose={(done) => {
            setTrade(null);
            // selling the last share leaves nothing to look at
            if (done && trade === 'sell' && !holdingOf(symbol)) onExit();
          }}
        />
      )}
    </div>
  );
}
