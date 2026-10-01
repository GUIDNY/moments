import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { rebuild } from '../world/map-data';
import { REFRESH_MS, market, onMarket, refresh } from './market';
import { priceHolding, summarise } from './money';
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

  /* the streets are relaid whenever the holdings change, never on a price tick */
  useEffect(() => {
    rebuild(state.holdings);
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

  const summary = useMemo(() => summarise(positions, state.display), [positions, state.display]);

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
      shareUrl: () => store.shareUrl(state),
      add,
      remove,
      update,
      setDisplay,
      refreshNow: () => refresh(symbols, state.display),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, positions, summary, tick, add, remove, update, setDisplay, symbols, progress, fresh, shared, dismissBadge]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used inside a CityProvider');
  return ctx;
}
