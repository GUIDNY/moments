import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TOTAL_PROJECTS } from './projects';

/**
 * What the town remembers between visits.
 *
 * A portfolio has no wallet, no levels and nothing to buy — this replaced an
 * economy, and almost all of it went. What is genuinely worth keeping is small:
 * which projects someone has already opened, so the town can dim the doors they
 * have been through and show how much is left; and where they were standing, so
 * coming out of a case study puts them back on the same street rather than at
 * the spawn point.
 */

const KEY = 'portfolio.visits';
const VisitContext = createContext(null);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      visited: Array.isArray(raw.visited) ? raw.visited : [],
      spawn: raw.spawn && typeof raw.spawn.x === 'number' ? raw.spawn : null,
    };
  } catch {
    return { visited: [], spawn: null };
  }
}

export function VisitProvider({ children }) {
  const [state, setState] = useState(load);
  const [toasts, setToasts] = useState([]);
  const nextToast = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode — the town simply forgets */
    }
  }, [state]);

  const markVisited = useCallback((id) => {
    setState((s) => (s.visited.includes(id) ? s : { ...s, visited: [...s.visited, id] }));
  }, []);

  /* The player moves every frame; the position is only worth storing when the
     tile changes, or this writes to localStorage sixty times a second. */
  const lastTile = useRef('');
  const rememberSpawn = useCallback((x, y) => {
    const tile = `${x},${y}`;
    if (tile === lastTile.current) return;
    lastTile.current = tile;
    setState((s) => ({ ...s, spawn: { x, y } }));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = ++nextToast.current;
    setToasts((list) => [...list, { ...toast, id }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      visited: state.visited,
      hasVisited: (id) => state.visited.includes(id),
      seenCount: state.visited.length,
      total: TOTAL_PROJECTS,
      spawn: state.spawn,
      markVisited,
      rememberSpawn,
      toasts,
      pushToast,
      dismissToast,
    }),
    [state, toasts, markVisited, rememberSpawn, pushToast, dismissToast]
  );

  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error('useVisit must be used inside a VisitProvider');
  return ctx;
}
