import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { BOARD, MARKETS, SECTOR_BY_ID, sectorFor } from './catalog';
import { useCity } from './CityContext';
import { searchSymbols } from './market';
import { formatMoney, formatPct, toMajor } from './money';
import { moveColor } from './towers';
import TradeSheet from './TradeSheet';

/**
 * The board you build a city from.
 *
 * Typing a ticker is something only a person who already knows tickers does, so
 * the board leads: tap a company, say how many shares, and a tower goes up.
 * Search is there for everything the board does not carry, which is most of the
 * market — it just is not what anyone reaches for first.
 */

function Row({ symbol, name, detail, held, onPick, quote }) {
  const q = quote && !quote.error && Number.isFinite(quote.price) ? toMajor(quote.price, quote.currency) : null;
  const dayPct = q && quote.prevClose ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : null;
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
      {q ? (
        <span className="shrink-0 text-end">
          <span className="block text-[12.5px] font-black tabular-nums text-ink-900">
            {formatMoney(q.price, q.currency)}
          </span>
          {dayPct != null && (
            <span className="block text-[11.5px] font-bold tabular-nums" style={{ color: moveColor(dayPct) }}>
              {formatPct(dayPct)}
            </span>
          )}
        </span>
      ) : (
        <span className="shrink-0 text-[18px] text-brand font-black">{held ? '✓' : '+'}</span>
      )}
    </button>
  );
}

export default function PickerScreen({ onExit }) {
  const { t, loc } = useI18n();
  const { holdings, quoteOf, ensureQuote } = useCity();
  const [, bump] = useState(0);
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

  /* the board shows a live price beside every name, held or not — a board
     with prices is a market; one without is a list of company names */
  useEffect(() => {
    let live = true;
    Promise.all(board.map((b) => ensureQuote(b.symbol))).then(() => live && bump((n) => n + 1));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);
  useEffect(() => {
    let live = true;
    Promise.all(found.map((r) => ensureQuote(r.symbol))).then(() => live && bump((n) => n + 1));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found]);

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
                    quote={quoteOf(r.symbol)}
                    onPick={() => setPick({ symbol: r.symbol, name: { he: r.name, en: r.name }, sector: sectorFor(r.symbol, r) })}
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
                  quote={quoteOf(b.symbol)}
                  onPick={() => setPick({ symbol: b.symbol, name: b.name, sector: b.sector })}
                />
              ))}
            </ul>
          </>
        )}

        <p className="text-[11px] text-paper-muted leading-snug mt-4">{t('picker.note')}</p>
      </div>

      {pick && (
        <TradeSheet
          symbol={pick.symbol}
          side="buy"
          meta={{ sector: pick.sector, name: pick.name }}
          onClose={(bought) => {
            setPick(null);
            if (bought) onExit();
          }}
        />
      )}
    </div>
  );
}
