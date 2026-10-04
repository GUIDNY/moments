/**
 * Experience and levels: the city's progression, earned by playing and
 * learning, never by returns. Missions, lessons, badges, days in a row, the
 * companies and sectors held, holding on, spreading out and not churning —
 * things a beginner can do, none of which is "pick a winner". A friend's
 * city compares on this, not on money.
 *
 * Tables, not formulas, so a designer can tune them.
 */
export const XP_FOR = {
  mission: 120,
  lesson: 40,
  badge: 80,
  streakDay: 25,
  holding: 30,     // per company held, up to 24
  sector: 60,      // per sector held
  heldDay: 2,      // per day each position has been held, up to 60 a position
  spread: 150,     // five or more holdings and none over 40%: a portfolio, not a bet
  calm: 120,       // three days in and under a trade a day on average: not churning
};

/** XP needed to *reach* each level: level 1 at 0, level 2 at 250, ... */
export const LEVEL_XP = [0, 250, 600, 1100, 1800, 2700, 3800, 5200, 7000, 9200, 12000];

const DAY = 86400000;

/**
 * `ctx` is what is on screen: `holdings`, `trades`, `positions` (priced)
 * and `totalUsd`. Anything missing simply earns nothing, so a shared city
 * with no trades still gets a level.
 */
export function xpFor(progress, ctx = {}) {
  if (!progress) return 0;
  const holdings = ctx.holdings ?? [];
  const trades = ctx.trades ?? [];
  const positions = ctx.positions ?? [];
  const now = ctx.now ?? Date.now();

  const sectors = new Set(holdings.map((h) => h.sector).filter(Boolean)).size;
  const heldDays = holdings.reduce((sum, h) => sum + Math.min(60, Math.max(0, Math.floor((now - (h.since ?? now)) / DAY))), 0);
  const biggest = positions.reduce((m, p) => (p.valueUsd != null && p.valueUsd > m ? p.valueUsd : m), 0);
  const spread = holdings.length >= 5 && ctx.totalUsd > 0 && biggest / ctx.totalUsd <= 0.4;
  const days = progress.days ?? 0;
  const calm = days >= 3 && holdings.length > 0 && trades.filter((t) => t.side === 'buy' || t.side === 'sell').length <= days;

  return (
    (progress.missions?.length ?? 0) * XP_FOR.mission +
    (progress.lessons?.length ?? 0) * XP_FOR.lesson +
    (progress.unlocked?.length ?? 0) * XP_FOR.badge +
    Math.min(30, progress.streak ?? 0) * XP_FOR.streakDay +
    Math.min(24, holdings.length) * XP_FOR.holding +
    sectors * XP_FOR.sector +
    heldDays * XP_FOR.heldDay +
    (spread ? XP_FOR.spread : 0) +
    (calm ? XP_FOR.calm : 0)
  );
}

/** Where `xp` sits: the level, how far into it, and how much to the next. */
export function levelFor(xp) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i + 1;
  const start = LEVEL_XP[level - 1];
  const next = LEVEL_XP[level] ?? null;
  return { level, xp, into: xp - start, need: next == null ? 0 : next - xp, span: next == null ? 0 : next - start, max: next == null };
}
