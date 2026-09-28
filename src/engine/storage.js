const KEY = 'candle_city_v1';

export const INITIAL_STATE = {
  version: 1,
  name: 'שחקן',
  coins: 50,
  xp: 0,
  avatar: 'trader',
  ownedItems: ['trader'],
  equippedPerk: null,
  lastDailyBonus: null,
  dailyStreak: 0,
  totalCoinsEarned: 50,
  totalPlays: 0,
  unlockedAchievements: [],
  games: {}, // gameId -> { plays, best, lastScore, coins }
  patternSeen: {}, // patternId -> { right, wrong }
  spawn: null, // last position in the world
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...INITIAL_STATE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...INITIAL_STATE };
    return {
      ...INITIAL_STATE,
      ...parsed,
      games: { ...parsed.games },
      patternSeen: { ...parsed.patternSeen },
      ownedItems: Array.isArray(parsed.ownedItems) ? parsed.ownedItems : [...INITIAL_STATE.ownedItems],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
    };
  } catch {
    return { ...INITIAL_STATE };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage can be full or blocked — the game still works for this session */
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const todayKey = () => new Date().toISOString().slice(0, 10);
