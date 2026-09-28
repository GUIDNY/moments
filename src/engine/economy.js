/** Coins, XP and levels — the shared currency behind every mini-game. */

export const COIN = '🪙';

/** XP needed to *reach* each level. Level 1 starts at 0. */
export function xpForLevel(level) {
  return Math.round(60 * Math.pow(level - 1, 1.6));
}

export function levelFromXp(xp) {
  let level = 1;
  while (level < 50 && xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  return {
    level,
    into: xp - floor,
    needed: span,
    pct: Math.min(100, Math.round(((xp - floor) / span) * 100)),
    nextAt: ceil,
  };
}

export const LEVEL_TITLES = [
  [1, 'סקרן'],
  [3, 'מתלמד'],
  [5, 'סוחר יום'],
  [8, 'אנליסט'],
  [12, 'מנהל תיקים'],
  [16, 'זאב מהבורסה'],
  [22, 'אגדה של העיר'],
];

export function levelTitle(level) {
  let title = LEVEL_TITLES[0][1];
  for (const [min, name] of LEVEL_TITLES) if (level >= min) title = name;
  return title;
}

/**
 * Turn a raw mini-game result into a payout.
 * `accuracy` (0..1) scales the reward, a streak adds a bonus, and any owned
 * multiplier perk applies last.
 */
export function payout({ base, accuracy = 1, streakBonus = 0, multiplier = 1 }) {
  const raw = base * accuracy + streakBonus;
  return Math.max(0, Math.round(raw * multiplier));
}

/** XP is deliberately flatter than coins so levelling stays steady. */
export function xpFor(coins) {
  return Math.max(1, Math.round(coins * 0.6));
}

export const formatCoins = (n) => new Intl.NumberFormat('he-IL').format(Math.round(n));
