import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { BOARD, MARKETS, SECTOR_BY_ID, sectorFor } from './catalog';
import { useCity } from './CityContext';
import { searchSymbols } from './market';
import { formatMoney, formatPct } from './money';
import { moveColor } from './towers';

/**
 * The board you build a city from.
 *
 * Typing a ticker is something only a person who already knows tickers does, so
 * the board leads: tap a company, say how many shares, and a tower goes up.
 * Search is there for everything the board does not carry, which is most of the
 * market — it just is not what anyone reaches for first.
 */

function Row({ symbol, name, detail, held, onPick, position }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-start transition-colors ${
        held ? 'bg-brand/10' : 'hover:bg-paper-50 active:bg-paper-100'
      }`}
    >
      <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-[11px] font-black text-ink-900">
        {symbol.replace(/\.(TA|L)$/, '').slice(0, 5)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-black text-ink-900 truncate">{name}</span>
        <span dir="ltr" className="block text-[11.5px] text-paper-muted truncate text-start">
          {detail}
        </span>
      </span>
      {position && !position.missing ? (
        <span className="shrink-0 text-end">
          <span className="block text-[12.5px] font-black tabular-nums text-ink-900">
            {formatMoney(position.price, position.currency)}
          </span>
          <span
            className="block text-[11.5px] font-bold tabular-nums"
            style={{ color: moveColor(position.dayPct) }}
          >
            {formatPct(position.dayPct)}
          </span>
        </span>
      ) : (
        <span className="shrink-0 text-[18px] text-brand font-black">{held ? '✓' : '+'}</span>
      )}
    </button>
  );
}

/** Shares and, optionally, what they cost — two numbers and out. */
function QuantitySheet({ pick, onAdd, onCancel, T }) {
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  const n = Number(qty);
  const valid = Number.isFinite(n) && n > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/55 backdrop-blur-[2px]">
      <div className="w-full md:max-w-sm bg-paper rounded-t-[26px] md:rounded-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-4 animate-sheet-up">
        <h2 className="text-[17px] font-black text-ink-900">{pick.name}</h2>
        <p dir="ltr" className="text-[12px] text-paper-muted mb-4 text-start">{pick.symbol}</p>

        <label className="block mb-3">
          <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{T.qty}</span>
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full h-12 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900
              text-[16px] font-bold outline-none focus:border-brand focus:bg-paper transition-colors"
          />
        </label>

        <label className="block mb-4">
          <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{T.cost}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full h-12 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900
              text-[16px] font-bold outline-none focus:border-brand focus:bg-paper transition-colors"
          />
          <span className="block text-[11px] text-paper-muted mt-1 leading-snug">{T.costHint}</span>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[14px]"
          >
            {T.cancel}
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onAdd({ qty: n, cost: Number(cost) || null })}
            className="flex-[2] h-12 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab disabled:opacity-40"
          >
            {T.addIt}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PickerScreen({ onExit }) {
  const { t, loc, lang } = useI18n();
  const { holdings, add, positionOf } = useCity();
  const [market, setMarketFilter] = useState('il');
  const [query, setQuery] = useState('');
  const [found, setFound] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pick, setPick] = useState(null);

  const held = useMemo(() => new Set(holdings.map((h) => h.symbol)), [holdings]);

  /* search runs a beat after the typing stops, so a six-letter company name is
     one request rather than six */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFound([]);
      return undefined;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      setFound(await searchSymbols(q));
      setSearching(false);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  const board = BOARD.filter((b) => b.market === market);
  const T = {
    qty: t('picker.qty'),
    cost: t('picker.cost'),
    costHint: t('picker.costHint'),
    cancel: t('common.close'),
    addIt: t('picker.addIt'),
  };

  const commit = ({ qty, cost }) => {
    add({
      symbol: pick.symbol,
      qty,
      cost,
      sector: pick.sector || sectorFor(pick.symbol, pick),
      name: pick.nameEntry || { he: pick.name, en: pick.name },
    });
    setPick(null);
  };

  return (
    <div className="fixed inset-0 bg-paper overflow-y-auto">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-md border-b border-paper-200">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-3.5 rounded-xl bg-paper-50 border border-paper-200 text-[13px] font-bold text-ink-900 active:scale-95 transition-transform"
          >
            {t('common.back')}
          </button>
          <span className="flex-1 text-[13px] font-black text-ink-900 text-center">
            {t('picker.title')}
          </span>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('picker.search')}
            className="w-full h-11 px-3.5 rounded-xl bg-paper-50 border border-paper-200 text-ink-900
              text-[14px] outline-none focus:border-brand focus:bg-paper transition-colors"
          />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {query.trim().length >= 2 ? (
          <>
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1.5">
              {searching ? t('picker.searching') : t('picker.results')}
            </h3>
            {found.length === 0 && !searching ? (
              <p className="text-[13px] text-paper-muted px-2.5 py-3">{t('picker.nothing')}</p>
            ) : (
              <ul>
                {found.map((r) => (
                  <Row
                    key={r.symbol}
                    symbol={r.symbol}
                    name={r.name}
                    detail={`${r.symbol} · ${r.exchange}`}
                    held={held.has(r.symbol)}
                    position={positionOf(r.symbol)}
                    onPick={() => setPick({ symbol: r.symbol, name: r.name, kind: r.kind })}
                  />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-1.5 mb-3">
              {MARKETS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMarketFilter(m.id)}
                  className={`h-9 px-3.5 rounded-xl text-[13px] font-bold border transition-colors ${
                    market === m.id
                      ? 'bg-brand text-white border-brand'
                      : 'bg-paper-50 text-ink-900/70 border-paper-200'
                  }`}
                >
                  {m.flag} {loc(m.name)}
                </button>
              ))}
            </div>

            <ul>
              {board.map((b) => (
                <Row
                  key={b.symbol}
                  symbol={b.symbol}
                  name={loc(b.name)}
                  detail={`${b.symbol} · ${loc(SECTOR_BY_ID[b.sector].name)}`}
                  held={held.has(b.symbol)}
                  position={positionOf(b.symbol)}
                  onPick={() =>
                    setPick({
                      symbol: b.symbol,
                      name: loc(b.name),
                      nameEntry: b.name,
                      sector: b.sector,
                    })
                  }
                />
              ))}
            </ul>
          </>
        )}

        <p className="text-[11px] text-paper-muted leading-snug mt-4">{t('picker.note')}</p>
      </div>

      {pick && (
        <QuantitySheet
          pick={pick}
          T={T}
          onAdd={commit}
          onCancel={() => setPick(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
