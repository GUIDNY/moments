import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SECTOR_BY_ID } from './catalog';
import { useCity } from './CityContext';
import { formatMoney, formatPct } from './money';
import { moveColor } from './towers';

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
  const { positionOf, holdingOf, remove, update, display, isShared } = useCity();
  const position = positionOf(symbol);
  const holding = holdingOf(symbol);
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(String(holding?.qty ?? ''));
  const [cost, setCost] = useState(String(holding?.cost ?? ''));

  if (!holding) return null;
  const sector = SECTOR_BY_ID[holding.sector];
  const missing = !position || position.missing;

  const save = () => {
    update(symbol, { qty: Number(qty) || 0, cost: Number(cost) || null });
    setEditing(false);
  };

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
          </>
        )}

        {!isShared && (
          <>
            {editing ? (
              <div className="rounded-2xl border border-paper-200 p-3 space-y-3">
                <label className="block">
                  <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{t('picker.qty')}</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="any" value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 text-[15px] font-bold outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{t('picker.cost')}</span>
                  <input
                    type="number" inputMode="decimal" min="0" step="any" value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 text-[15px] font-bold outline-none focus:border-brand"
                  />
                </label>
                <button type="button" onClick={save} className="w-full h-11 rounded-2xl bg-brand text-white font-black text-[14px]">
                  {t('common.save')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px] active:scale-[0.99] transition-transform"
              >
                {t('holding.edit')}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                remove(symbol);
                onExit();
              }}
              className="w-full h-11 rounded-2xl border border-paper-200 text-[13px] font-bold text-[#e5484d] active:scale-[0.99] transition-transform"
            >
              {t('holding.sell')}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onExit}
          className="w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px] active:scale-[0.99] transition-transform"
        >
          {t('project.backToTown')}
        </button>
      </div>
    </div>
  );
}
