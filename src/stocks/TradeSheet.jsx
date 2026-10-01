import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useCity } from './CityContext';
import { formatMoney, formatPct, tradeQuote } from './money';
import { feeFor } from './store';
import { moveColor } from './towers';

const CHIPS = [500, 1000, 5000, 10000];

/**
 * The order ticket. One number to type — shares — or one chip to tap for a
 * dollar amount, and everything else is worked out and shown before the
 * button: the price, the fee, the total, the cash left. A beginner should
 * never find out what a trade cost after it happened.
 */
export default function TradeSheet({ symbol, side, meta = {}, onClose }) {
  const { t, loc } = useI18n();
  const { cash, holdingOf, quoteOf, ensureQuote, rates, buyShares, sellShares, ready } = useCity();
  const [qty, setQty] = useState('');
  const [error, setError] = useState(null);
  const [, bump] = useState(0);

  // a stock you do not hold has no quote yet: ask for one
  useEffect(() => {
    let live = true;
    ensureQuote(symbol).then(() => live && bump((n) => n + 1));
    return () => {
      live = false;
    };
  }, [symbol, ensureQuote]);

  const quote = quoteOf(symbol);
  const held = holdingOf(symbol);
  const unit = useMemo(() => tradeQuote(quote, 1, rates), [quote, rates]);
  const n = Number(qty) || 0;
  const order = unit ? tradeQuote(quote, n, rates) : null;
  const fee = order && n > 0 ? feeFor(order.valueUsd) : 0;
  const total = order ? order.valueUsd + (side === 'buy' ? fee : -fee) : 0;
  const cashAfter = side === 'buy' ? cash - total : cash + total;
  const name = loc(meta.name) || quote?.name || symbol;

  let problem = null;
  if (!quote) problem = t('trade.noPrice');
  else if (!unit) problem = t('trade.noRate');
  else if (side === 'buy' && n > 0 && cashAfter < 0) problem = t('trade.noCash');
  else if (side === 'sell' && n > (held?.qty ?? 0) + 1e-9) problem = t('trade.tooMany');
  const valid = unit && n > 0 && !problem;

  const dayPct = quote && Number.isFinite(quote.price) && quote.prevClose ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : null;

  const go = () => {
    const err = side === 'buy' ? buyShares(symbol, n, meta) : sellShares(symbol, n);
    if (err) {
      setError(t(err === 'no-cash' ? 'trade.noCash' : err === 'too-many' ? 'trade.tooMany' : 'trade.noPrice'));
      return;
    }
    onClose(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/55 backdrop-blur-[2px]" onClick={() => onClose(false)}>
      <div
        className="w-full md:max-w-sm bg-paper rounded-t-[26px] md:rounded-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={side === 'buy' ? t('trade.buyTitle') : t('trade.sellTitle')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
              {side === 'buy' ? t('trade.buyTitle') : t('trade.sellTitle')}
            </div>
            <h2 className="text-[17px] font-black text-ink-900 truncate">{name}</h2>
            <p dir="ltr" className="text-[12px] text-paper-muted text-start">{symbol}</p>
          </div>
          {unit && (
            <div className="text-end shrink-0">
              <div className="text-[11px] font-bold text-paper-muted">{t('trade.price')}</div>
              <div className="text-[16px] font-black tabular-nums text-ink-900">{formatMoney(unit.price, unit.currency)}</div>
              {unit.currency !== 'USD' && (
                <div className="text-[11px] text-paper-muted tabular-nums">{t('trade.inUsd', { usd: formatMoney(unit.priceUsd, 'USD') })}</div>
              )}
              {dayPct != null && (
                <div className="text-[11.5px] font-bold tabular-nums" style={{ color: moveColor(dayPct) }}>{formatPct(dayPct)}</div>
              )}
            </div>
          )}
        </div>

        {side === 'sell' && held && (
          <p className="text-[12px] text-paper-muted mt-2">{t('trade.held', { n: held.qty.toLocaleString() })}</p>
        )}

        {/* the chips: a dollar amount turned into shares at the live price */}
        {unit && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto">
            {side === 'buy'
              ? CHIPS.map((usd) => {
                  const shares = Math.floor(usd / unit.priceUsd);
                  return (
                    <button
                      key={usd}
                      type="button"
                      disabled={shares < 1 || usd > cash}
                      onClick={() => setQty(String(shares))}
                      className="h-9 px-3 rounded-xl bg-paper-50 border border-paper-200 text-[12.5px] font-bold text-ink-900 disabled:opacity-40 shrink-0"
                    >
                      {formatMoney(usd, 'USD', true)}
                    </button>
                  );
                })
              : [0.25, 0.5, 1].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setQty(String(Math.max(1, Math.floor((held?.qty ?? 0) * part))))}
                    className="h-9 px-3 rounded-xl bg-paper-50 border border-paper-200 text-[12.5px] font-bold text-ink-900 shrink-0"
                  >
                    {part === 1 ? t('trade.max') : `${part * 100}%`}
                  </button>
                ))}
          </div>
        )}

        <label className="block mt-3">
          <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{t('trade.shares')}</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setError(null);
            }}
            className="w-full h-12 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 text-[16px] font-bold outline-none focus:border-brand focus:bg-paper transition-colors"
          />
        </label>

        {/* the whole ticket, before the button */}
        <dl className="mt-3 rounded-2xl bg-paper-50 border border-paper-200 divide-y divide-paper-200 text-[13px]">
          <div className="flex justify-between px-3 py-2">
            <dt className="text-paper-muted">{t('trade.total')}</dt>
            <dd className="font-black tabular-nums text-ink-900">
              {order && n > 0 ? formatMoney(Math.abs(total), 'USD') : '—'}
              {order && n > 0 && <span className="text-[11px] font-bold text-paper-muted"> · {t('trade.feeNote', { fee: formatMoney(fee, 'USD') })}</span>}
            </dd>
          </div>
          <div className="flex justify-between px-3 py-2">
            <dt className="text-paper-muted">{t('trade.cashAfter')}</dt>
            <dd className="font-black tabular-nums" style={{ color: cashAfter < 0 ? '#e2706f' : '#0b1220' }}>
              {formatMoney(n > 0 ? cashAfter : cash, 'USD')}
            </dd>
          </div>
        </dl>

        {(problem || error) && <p className="text-[12.5px] font-bold text-[#e2706f] mt-2">{error || problem}</p>}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={() => onClose(false)} className="flex-1 h-12 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[14px]">
            {t('common.close')}
          </button>
          <button
            type="button"
            disabled={!valid || !ready}
            onClick={go}
            className={`flex-[2] h-12 rounded-2xl text-white font-black text-[15px] shadow-fab disabled:opacity-40 ${side === 'buy' ? 'bg-brand' : 'bg-[#e2706f]'}`}
          >
            {side === 'buy' ? t('trade.confirmBuy', { n: n.toLocaleString() }) : t('trade.confirmSell', { n: n.toLocaleString() })}
          </button>
        </div>
      </div>
    </div>
  );
}
