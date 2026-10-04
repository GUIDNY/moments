import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
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

/* The indices the market screen opens with: the two markets the board
   trades on, the big US ones, and bitcoin. Not a terminal: a glance. */
const INDICES = ['TA35.TA', 'SPY', 'QQQ', 'BTC-USD'];

function Row({ symbol, name, detail, held, onPick, quote, watched, onWatch, t }) {
  const q = quote && !quote.error && Number.isFinite(quote.price) ? toMajor(quote.price, quote.currency) : null;
  const dayPct = q && quote.prevClose ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : null;
  return (
    <div className={`w-full flex items-center gap-1 rounded-2xl ${held ? 'bg-brand/10' : ''}`}>
    {onWatch && (
      <button type="button" onClick={onWatch} aria-label={watched ? t('watch.remove') : t('watch.add')} aria-pressed={watched} className={`w-10 h-11 shrink-0 grid place-items-center rounded-xl ${watched ? 'text-[#b8860b]' : 'text-paper-300 hover:text-paper-muted'}`}>
        <Star size={18} fill={watched ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    )}
    <button
      type="button"
      onClick={onPick}
      className={`flex-1 min-w-0 flex items-center gap-3 p-2.5 rounded-2xl text-start transition-colors ${
        held ? '' : 'hover:bg-paper-50 active:bg-paper-100'
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
    </div>
  );
}

/** One index as a small tile: name, price, the day. */
function IndexTile({ symbol, quote, loc }) {
  const b = BOARD.find((x) => x.symbol === symbol);
  const q = quote && !quote.error && Number.isFinite(quote.price) ? toMajor(quote.price, quote.currency) : null;
  const dayPct = q && quote.prevClose ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : null;
  return (
    <div className="min-w-[8.5rem] rounded-2xl bg-white border border-paper-200 shadow-card px-3 py-2">
      <div className="text-[11px] font-black text-paper-muted truncate">{b ? loc(b.name) : symbol}</div>
      <div className="text-[14px] font-black tabular-nums text-ink-900">{q ? formatMoney(q.price, q.currency, true) : '…'}</div>
      {dayPct != null && <div className="text-[11.5px] font-bold tabular-nums" style={{ color: moveColor(dayPct) }}>{formatPct(dayPct)}</div>}
    </div>
  );
}

export default function PickerScreen({ onExit }) {
  const { t, loc } = useI18n();
  const { holdings, quoteOf, ensureQuote, watchlist, toggleWatch, marketOpen, positions } = useCity();
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
  const watched = useMemo(() => new Set(watchlist), [watchlist]);
  const movers = useMemo(
    () => positions.filter((p) => !p.missing && Number.isFinite(p.dayPct)).sort((a, b) => Math.abs(b.dayPct) - Math.abs(a.dayPct)).slice(0, 3),
    [positions]
  );
  useEffect(() => {
    let live = true;
    Promise.all([...INDICES, ...watchlist].map((sym) => ensureQuote(sym))).then(() => live && bump((n) => n + 1));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join(',')]);

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
            {t('market.title')}
          </span>
          <span className="w-[4.5rem] shrink-0 inline-flex items-center justify-end gap-1 text-[10.5px] font-bold text-paper-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-[#4caf7d]' : 'bg-paper-300'}`} aria-hidden="true" />
            {marketOpen ? t('market.open') : t('market.closed')}
          </span>
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

      <div className="mx-auto max-w-2xl px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-28">
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
                    watched={watched.has(r.symbol)}
                    onWatch={() => toggleWatch(r.symbol)}
                    t={t}
                    onPick={() => setPick({ symbol: r.symbol, name: { he: r.name, en: r.name }, sector: sectorFor(r.symbol, r) })}
                  />
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1.5">{t('market.indices')}</h3>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
              {INDICES.map((sym) => (
                <IndexTile key={sym} symbol={sym} quote={quoteOf(sym)} loc={loc} />
              ))}
            </div>
            {movers.length > 0 && (
              <>
                <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mt-4 mb-1">{t('market.movers')}</h3>
                <ul className="rounded-2xl bg-white border border-paper-200 shadow-card divide-y divide-paper-100">
                  {movers.map((p) => {
                    const h = holdings.find((x) => x.symbol === p.symbol);
                    return (
                      <li key={p.symbol} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                        <span className="font-black text-ink-900 flex-1 truncate">{loc(h?.name) || loc(BOARD.find((b) => b.symbol === p.symbol)?.name) || p.name}</span>
                        <span className="font-bold tabular-nums" style={{ color: moveColor(p.dayPct) }}>{formatPct(p.dayPct)}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mt-4 mb-1">{t('market.watch')}</h3>
            {watchlist.length === 0 ? (
              <p className="text-[12.5px] text-paper-muted px-1 pb-2">{t('market.watchEmpty')}</p>
            ) : (
              <ul className="mb-2">
                {watchlist.map((sym) => {
                  const b = BOARD.find((x) => x.symbol === sym);
                  return (
                    <Row key={sym} symbol={sym} name={b ? loc(b.name) : quoteOf(sym)?.name || sym} detail={`${sym}${b ? ` · ${loc(SECTOR_BY_ID[b.sector].name)}` : ''}`} held={held.has(sym)} quote={quoteOf(sym)} watched onWatch={() => toggleWatch(sym)} t={t}
                      onPick={() => setPick({ symbol: sym, name: b ? b.name : { he: quoteOf(sym)?.name || sym, en: quoteOf(sym)?.name || sym }, sector: b ? b.sector : sectorFor(sym) })} />
                  );
                })}
              </ul>
            )}
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mt-3 mb-1.5">{t('market.board')}</h3>
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
                  watched={watched.has(b.symbol)}
                  onWatch={() => toggleWatch(b.symbol)}
                  t={t}
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
