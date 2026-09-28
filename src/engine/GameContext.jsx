import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID } from '../data/achievements';
import { ITEMS_BY_ID, perkMultiplier } from '../data/items';
import { levelFromXp, levelProgress, payout, xpFor } from './economy';
import { INITIAL_STATE, loadState, resetState, saveState, todayKey } from './storage';
import {
  DAILY_BONUS_BASE,
  DAILY_BONUS_MAX,
  DAILY_BONUS_STREAK_STEP,
  TOTAL_GAMES,
} from './constants';

const GameContext = createContext(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

let toastId = 0;

export function GameProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef([]);

  useEffect(() => saveState(state), [state]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    },
    []
  );

  const pushToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, ...toast }]);
    const timer = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    timersRef.current.push(timer);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const level = levelFromXp(state.xp);
  const multiplier = perkMultiplier(state.equippedPerk);

  /* ── Achievements: recomputed whenever the save state moves ───────────── */
  useEffect(() => {
    const ctx = { level: levelFromXp(state.xp), gameCount: TOTAL_GAMES };
    const newly = ACHIEVEMENTS.filter(
      (a) => !state.unlockedAchievements.includes(a.id) && a.test(state, ctx)
    );
    if (newly.length === 0) return;
    const reward = newly.reduce((sum, a) => sum + a.reward, 0);
    setState((s) => ({
      ...s,
      coins: s.coins + reward,
      totalCoinsEarned: s.totalCoinsEarned + reward,
      unlockedAchievements: [...s.unlockedAchievements, ...newly.map((a) => a.id)],
    }));
    newly.forEach((a) =>
      pushToast({ emoji: a.emoji, title: `הישג נפתח: ${a.name}`, sub: `+${a.reward} מטבעות` })
    );
  }, [state, pushToast]);

  /* ── Actions ──────────────────────────────────────────────────────────── */

  /**
   * Record the end of a mini-game run.
   * `base`/`accuracy`/`streakBonus` feed the shared payout formula, so every
   * game rewards on the same scale. Returns the coins actually paid.
   */
  const finishGame = useCallback(
    (gameId, { score = 0, base, accuracy = 1, streakBonus = 0, higherIsBetter = true } = {}) => {
      const coins = payout({ base, accuracy, streakBonus, multiplier });
      const xp = xpFor(coins);
      setState((s) => {
        const prev = s.games[gameId] ?? { plays: 0, best: higherIsBetter ? 0 : Infinity, coins: 0 };
        const best = higherIsBetter ? Math.max(prev.best, score) : Math.min(prev.best, score);
        return {
          ...s,
          coins: s.coins + coins,
          xp: s.xp + xp,
          totalCoinsEarned: s.totalCoinsEarned + coins,
          totalPlays: s.totalPlays + 1,
          games: {
            ...s.games,
            [gameId]: {
              plays: prev.plays + 1,
              best,
              lastScore: score,
              coins: prev.coins + coins,
            },
          },
        };
      });
      return { coins, xp };
    },
    [multiplier]
  );

  /** Track which patterns the player actually knows. */
  const recordPattern = useCallback((patternId, correct) => {
    if (!patternId) return;
    setState((s) => {
      const prev = s.patternSeen[patternId] ?? { right: 0, wrong: 0 };
      return {
        ...s,
        patternSeen: {
          ...s.patternSeen,
          [patternId]: {
            right: prev.right + (correct ? 1 : 0),
            wrong: prev.wrong + (correct ? 0 : 1),
          },
        },
      };
    });
  }, []);

  const addCoins = useCallback(
    (amount, { xp = 0 } = {}) => {
      setState((s) => ({
        ...s,
        coins: Math.max(0, s.coins + amount),
        xp: s.xp + xp,
        totalCoinsEarned: s.totalCoinsEarned + Math.max(0, amount),
      }));
    },
    []
  );

  const buyItem = useCallback((itemId) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return { ok: false, reason: 'unknown' };
    let result = { ok: false, reason: 'coins' };
    setState((s) => {
      if (s.ownedItems.includes(itemId)) {
        result = { ok: false, reason: 'owned' };
        return s;
      }
      if (s.coins < item.price) {
        result = { ok: false, reason: 'coins' };
        return s;
      }
      result = { ok: true };
      return {
        ...s,
        coins: s.coins - item.price,
        ownedItems: [...s.ownedItems, itemId],
        avatar: item.kind === 'avatar' ? itemId : s.avatar,
        equippedPerk: item.kind === 'perk' ? itemId : s.equippedPerk,
      };
    });
    return result;
  }, []);

  const equipItem = useCallback((itemId) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return;
    setState((s) => {
      if (!s.ownedItems.includes(itemId)) return s;
      if (item.kind === 'avatar') return { ...s, avatar: itemId };
      return { ...s, equippedPerk: s.equippedPerk === itemId ? null : itemId };
    });
  }, []);

  const dailyBonus = useMemo(() => {
    const today = todayKey();
    const available = state.lastDailyBonus !== today;
    const nextStreak = (() => {
      if (!state.lastDailyBonus) return 1;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      return state.lastDailyBonus === yesterday ? state.dailyStreak + 1 : 1;
    })();
    const amount = Math.min(
      DAILY_BONUS_MAX,
      DAILY_BONUS_BASE + (nextStreak - 1) * DAILY_BONUS_STREAK_STEP
    );
    return { available, amount, nextStreak };
  }, [state.lastDailyBonus, state.dailyStreak]);

  const claimDailyBonus = useCallback(() => {
    if (!dailyBonus.available) return null;
    const { amount, nextStreak } = dailyBonus;
    setState((s) => ({
      ...s,
      coins: s.coins + amount,
      totalCoinsEarned: s.totalCoinsEarned + amount,
      dailyStreak: nextStreak,
      lastDailyBonus: todayKey(),
    }));
    pushToast({ emoji: '🎁', title: 'בונוס יומי', sub: `+${amount} מטבעות · רצף ${nextStreak} ימים` });
    return amount;
  }, [dailyBonus, pushToast]);

  const setName = useCallback((name) => {
    setState((s) => ({ ...s, name: name.slice(0, 16) || 'שחקן' }));
  }, []);

  const rememberSpawn = useCallback((spawn) => {
    setState((s) => (s.spawn?.x === spawn.x && s.spawn?.y === spawn.y ? s : { ...s, spawn }));
  }, []);

  const hardReset = useCallback(() => {
    resetState();
    setState({ ...INITIAL_STATE });
    pushToast({ emoji: '🧹', title: 'התחלנו מחדש', sub: 'הארנק והקדמה אופסו' });
  }, [pushToast]);

  const value = useMemo(
    () => ({
      state,
      level,
      levelInfo: levelProgress(state.xp),
      multiplier,
      toasts,
      pushToast,
      dismissToast,
      finishGame,
      recordPattern,
      addCoins,
      buyItem,
      equipItem,
      dailyBonus,
      claimDailyBonus,
      setName,
      rememberSpawn,
      hardReset,
      achievements: ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: state.unlockedAchievements.includes(a.id),
      })),
      achievementsById: ACHIEVEMENTS_BY_ID,
    }),
    [
      state,
      level,
      multiplier,
      toasts,
      pushToast,
      dismissToast,
      finishGame,
      recordPattern,
      addCoins,
      buyItem,
      equipItem,
      dailyBonus,
      claimDailyBonus,
      setName,
      rememberSpawn,
      hardReset,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
