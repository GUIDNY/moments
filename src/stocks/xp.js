/**
 * Experience and levels: the city's progression, earned by playing and
 * learning, never by returns. Missions, lessons, badges, days in a row and
 * the number of companies held — things a beginner can do, none of which is
 * "pick a winner". A friend's city compares on this, not on money.
 *
 * Tables, not formulas, so a designer can tune them.
 */
export const XP_FOR = { mission: 120, lesson: 40, badge: 80, streakDay: 25, holding: 30 };

/** XP needed to *reach* each level: level 1 at 0, level 2 at 200, ... */
export const LEVEL_XP = [0, 200, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500];

export function xpFor(progress, holdingsCount = 0) {
  if (!progress) return 0;
  return (
    (progress.missions?.length ?? 0) * XP_FOR.mission +
    (progress.lessons?.length ?? 0) * XP_FOR.lesson +
    (progress.unlocked?.length ?? 0) * XP_FOR.badge +
    Math.min(30, progress.streak ?? 0) * XP_FOR.streakDay +
    Math.min(24, holdingsCount) * XP_FOR.holding
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
