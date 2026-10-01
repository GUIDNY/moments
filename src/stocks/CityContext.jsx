import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { rebuild } from '../world/map-data';
import { REFRESH_MS, ensureQuote, market, onMarket, refresh } from './market';
import { priceHolding, summarise, tradeQuote } from './money';
import { LESSON_BY_ID, MISSIONS } from '../learn/content';
import { computeTowers } from './towers';
import { earned } from './achievements';
import * as progressStore from './progress';
import * as store from './store';

/**
 * Portfolio in, city out.
 *
 * One place owns the chain: the holdings, the prices they are worth, the
 * arithmetic that turns the two into positions, the skyline those positions
 * imply, and the streets laid out to hold it. Everything downstream reads the
 * finished article.
 */

const CityContext = createContext(null);

export function CityProvider({ children }) {
  // a shared link wins on first load: someone opening someone else's city
  // should see that city, not their own
  const [state, setState] = useState(() => store.stateFromLocation() || store.load());
  const [tick, setTick] = useState(0);
  const timer = useRef(null);

  const symbols = useMemo(() => state.holdings.map((h) => h.symbol), [state.holdings]);
  const symbolKey = symbols.join(',');

  /* The streets are relaid whenever the holdings change, never on a price
     tick — and relaid *during render*, not in an effect. A buy closes the
     board and mounts the city in the same commit, and the city's first
     render asks `getSpawn()` where to stand; an effect would answer after
     that render, with yesterday's map, and the first thing you saw of your
     first tower was the plaza with your back to it. `rebuild` is
     deterministic and touches nothing React owns, so it is safe here. */
  const laidOut = useRef(new Set(state.holdings.map((h) => h.symbol)));
  useMemo(() => {
    // what is new is decided against the last layout this context made, so
    // a reload builds the skyline standing and only a buy makes a tower rise
    const fresh = new Set(state.holdings.map((h) => h.symbol).filter((sym) => !laidOut.current.has(sym)));
    laidOut.current = new Set(state.holdings.map((h) => h.symbol));
    rebuild(state.holdings, fresh);
  }, [state.holdings]);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [state.holdings]);

  useEffect(() => {
    if (!store.stateFromLocation()) store.save(state);
  }, [state]);

  /* prices: once now, then on a timer, and again when the tab comes back —
     a phone that has been in a pocket for an hour should not show an hour-old
     skyline while it waits for the next interval */
  useEffect(() => {
    const poll = () => refresh(symbols, state.display);
    poll();
    clearInterval(timer.current);
    timer.current = setInterval(poll, REFRESH_MS);
    const onWake = () => document.visibilityState === 'visible' && poll();
    document.addEventListener('visibilitychange', onWake);
    return () => {
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [symbolKey, state.display]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onMarket(() => setTick((t) => t + 1)), []);

  /* `tick` looks unused and is the whole point: `market` is a plain object
     mutated outside React, so nothing about it can appear in a dependency
     list. The tick is what says it changed. */
  const positions = useMemo(
    () => state.holdings.map((h) => priceHolding(h, market.bySymbol[h.symbol], state.display, market.rates)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.holdings, state.display, tick]
  );

  // the rates are read through `tick` like the prices: mutated outside React
  const summary = useMemo(
    () => summarise(positions, state.display, market.rates),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions, state.display, tick]
  );

  useEffect(() => {
    computeTowers(positions, summary.value);
  }, [positions, summary.value]);

  /* ── the game layer ──────────────────────────────────────────────────────
     Badges, the visit streak and the records the city keeps. A shared link is
     somebody else's city, so it neither grants badges nor touches the streak:
     progress belongs to whoever is holding the phone. */
  const [progress, setProgress] = useState(() =>
    store.stateFromLocation() ? progressStore.load() : progressStore.visit(progressStore.load())
  );
  const [fresh, setFresh] = useState([]);   // badges unlocked this session, newest last
  const shared = Boolean(store.stateFromLocation());

  useEffect(() => {
    if (shared) return;
    progressStore.save(progress);
  }, [progress, shared]);

  useEffect(() => {
    if (shared) return;
    /* `ready` gates every badge that depends on a price, and it means every
       holding has been asked about — not merely that some price has arrived.
       Half a portfolio is a different portfolio: while the first tower was
       priced and the rest still loading, the city handed out a medal for a
       two-percent fall that one share had and the whole never did. A symbol
       the market cannot price still counts as asked, so one dead ticker does
       not switch the game off. */
    const ready =
      !market.loading &&
      summary.counted > 0 &&
      state.holdings.every((h) => market.bySymbol[h.symbol]);
    const kept = ready
      ? progressStore.record(progress, { dayPct: summary.dayPct, value: summary.value })
      : progress;
    const won = earned({ holdings: state.holdings, positions, summary, progress: kept, ready });
    const next = progressStore.unlock(kept, won);
    // both helpers hand back the same object when nothing changed, which is
    // what stops this effect feeding itself
    if (next === progress) return;
    const added = next.unlocked.filter((id) => !progress.unlocked.includes(id));
    if (added.length) setFresh((f) => [...f, ...added.filter((id) => !f.includes(id))]);
    setProgress(next);
  }, [state.holdings, positions, summary, shared, progress]);

  const dismissBadge = useCallback(
    (id) => setFresh((f) => f.filter((x) => x !== id)),
    []
  );

  /* ── the game ────────────────────────────────────────────────────────────
     Buying and selling settle in `store.js` against the live quote and its
     dollar rate; the context only prices the order and reports the result.
     `lastTrade` is what the UI toasts; `error` is what it explains. */
  const [lastTrade, setLastTrade] = useState(null);

  const buyShares = useCallback((symbol, qty, meta = {}) => {
    const q = tradeQuote(market.bySymbol[symbol], qty, market.rates);
    if (!q) return 'no-price';
    let result = null;
    setState((s) => {
      const next = store.buy(s, { symbol, qty: q.qty, price: q.price, currency: q.currency, rate: q.rate, sector: meta.sector, name: meta.name });
      result = next.error;
      return next.error ? s : next;
    });
    if (!result) setLastTrade({ side: 'buy', symbol, qty: q.qty, name: meta.name, at: Date.now() });
    return result;
  }, []);

  const sellShares = useCallback((symbol, qty) => {
    const q = tradeQuote(market.bySymbol[symbol], qty, market.rates);
    if (!q) return 'no-price';
    let result = null;
    setState((s) => {
      const next = store.sell(s, { symbol, qty: q.qty, price: q.price, currency: q.currency, rate: q.rate });
      result = next.error;
      return next.error ? s : next;
    });
    if (!result) setLastTrade({ side: 'sell', symbol, qty: q.qty, at: Date.now() });
    return result;
  }, []);

  const resetGame = useCallback(() => setState(store.reset()), []);

  /* `ready` again: the score is only a score once every holding is priced */
  const ready =
    !market.loading &&
    (state.holdings.length === 0 || summary.counted > 0) &&
    state.holdings.every((h) => market.bySymbol[h.symbol]);
  const totalUsd = ready ? summary.valueUsd + state.cash : null;

  // one point of history a day, once the day's number is real
  useEffect(() => {
    if (shared || totalUsd == null) return;
    setState((s) => store.snapshot(s, totalUsd, progressStore.today()));
  }, [totalUsd, shared]);

  /* Missions complete in order and each opens its lesson; lessons also fire
     on the moment they are about. Both are queued, one on screen at a time,
     and a lesson is read once — a mission whose lesson was already read only
     toasts. */
  const [queue, setQueue] = useState([]); // [{ kind: 'lesson', id } | { kind: 'mission', id }]
  useEffect(() => {
    if (shared) return;
    const ctx = { holdings: state.holdings, trades: state.trades, cash: state.cash, summary, positions, progress, ready };
    const doneNow = [];
    for (const m of MISSIONS) {
      if (progress.missions.includes(m.id)) continue;
      try {
        if (m.test(ctx)) doneNow.push(m.id);
      } catch {
        /* a mission is never worth an exception */
      }
      break; // in order: only the first open mission is live
    }

    const due = [];
    const biggest = positions.reduce((m, p) => (p.converted != null && p.converted > m ? p.converted : m), 0);
    const bySector = {};
    for (const h of state.holdings) bySector[h.sector] = (bySector[h.sector] || 0) + 1;
    const rules = {
      welcome: true,
      'first-buy': state.trades.some((t) => t.side === 'buy'),
      fees: state.trades.length >= 2,
      currency: state.trades.some((t) => t.currency && t.currency !== 'USD'),
      'day-change': ready && positions.some((p) => !p.missing && Math.abs(p.dayPct) >= 1),
      diversify: Object.values(bySector).some((n) => n >= 2),
      index: state.holdings.some((h) => ['SPY', 'QQQ', 'VOO', 'VTI', 'IVV', 'TA35.TA', 'TA125.TA'].includes(h.symbol)),
      sell: state.trades.some((t) => t.side === 'sell'),
      concentration: ready && state.holdings.length > 1 && summary.value > 0 && biggest >= summary.value * 0.5,
      'red-day': ready && summary.dayPct <= -2,
      'long-term': progress.streak >= 3 && state.holdings.length > 0,
    };
    for (const [id, on] of Object.entries(rules)) {
      if (on && LESSON_BY_ID[id] && !progress.lessons.includes(id)) due.push(id);
    }

    if (!doneNow.length && !due.length) return;
    setQueue((q) => {
      const items = [...q];
      for (const id of doneNow) if (!items.some((i) => i.kind === 'mission' && i.id === id)) items.push({ kind: 'mission', id });
      for (const id of due) if (!items.some((i) => i.kind === 'lesson' && i.id === id)) items.push({ kind: 'lesson', id });
      return items;
    });
    if (doneNow.length) setProgress((p) => progressStore.completeMissions(p, doneNow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.holdings, state.trades, state.cash, summary, progress.streak, progress.missions, progress.lessons, ready, shared]);

  const current = queue[0] ?? null;
  const dismissCurrent = useCallback(() => {
    setQueue((q) => {
      const [head, ...rest] = q;
      if (head?.kind === 'lesson') setProgress((p) => progressStore.seeLesson(p, head.id));
      return rest;
    });
  }, []);
  const readLesson = useCallback((id) => {
    setQueue((q) => (q.some((i) => i.kind === 'lesson' && i.id === id) ? q : [{ kind: 'lesson', id }, ...q]));
  }, []);

  const nextMission = MISSIONS.find((m) => !progress.missions.includes(m.id)) ?? null;

  const add = useCallback((entry) => {
    setState((s) => ({ ...s, holdings: store.addHolding(s.holdings, entry) }));
  }, []);
  const remove = useCallback((symbol) => {
    setState((s) => ({ ...s, holdings: store.removeHolding(s.holdings, symbol) }));
  }, []);
  const update = useCallback((symbol, patch) => {
    setState((s) => ({ ...s, holdings: store.updateHolding(s.holdings, symbol, patch) }));
  }, []);
  const setDisplay = useCallback((display) => setState((s) => ({ ...s, display })), []);

  const value = useMemo(
    () => ({
      holdings: state.holdings,
      display: state.display,
      positions,
      positionOf: (symbol) => positions.find((p) => p.symbol === symbol),
      holdingOf: (symbol) => state.holdings.find((h) => h.symbol === symbol),
      summary,
      loading: market.loading,
      error: market.error,
      updatedAt: market.at,
      delayed: market.delayed,
      isShared: shared,
      progress,
      freshBadges: fresh,
      dismissBadge,
      // the game
      cash: state.cash,
      trades: state.trades,
      history: state.history,
      started: state.started,
      totalUsd,
      ready,
      buyShares,
      sellShares,
      resetGame,
      lastTrade,
      quoteOf: (symbol) => market.bySymbol[symbol] ?? null,
      ensureQuote: (symbol) => ensureQuote(symbol, state.display),
      rates: market.rates,
      // the teaching
      current,
      dismissCurrent,
      readLesson,
      nextMission,
      shareUrl: () => store.shareUrl(state),
      add,
      remove,
      update,
      setDisplay,
      refreshNow: () => refresh(symbols, state.display),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, positions, summary, tick, add, remove, update, setDisplay, symbols, progress, fresh, shared, dismissBadge,
      totalUsd, ready, buyShares, sellShares, resetGame, lastTrade, current, dismissCurrent, readLesson, nextMission]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used inside a CityProvider');
  return ctx;
}
