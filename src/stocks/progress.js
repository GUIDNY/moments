/**
 * What the city remembers about you between visits.
 *
 * The portfolio is the product; this is the part that makes it a game. It is
 * deliberately tiny and deliberately local: a list of unlocked achievement ids,
 * the run of consecutive days you have shown up, and the best and worst days
 * the city has seen you through. Nothing here leaves the browser, and a shared
 * link carries none of it — somebody else's city must never hand you their
 * streak, nor take yours away.
 */

const KEY = 'stockcity.progress';

const EMPTY = {
  unlocked: [],      // achievement ids, in the order they were earned
  streak: 0,         // consecutive days the city has been opened
  best: 0,           // longest such run
  lastDay: null,     // the last day counted, as YYYY-MM-DD
  days: 0,           // distinct days in total
  bestDayPct: null,  // the best single day the portfolio has had while open
  worstDayPct: null,
  peak: 0,           // the highest the portfolio has ever been worth
  lessons: [],       // lesson ids read, in the order they were read
  missions: [],      // mission ids completed, in order
  daily: { day: null, done: [] }, // today's short tasks done
  dailyDone: 0,      // how many daily tasks ever, for XP
  connected: false,  // a real portfolio was connected once
};

/** Local midnight, not UTC: a streak is about the user's day, not the server's. */
export function today(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

const dayBefore = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const prev = new Date(y, m - 1, d - 1);
  return today(prev);
};

/** Saved progress (localStorage, or the account) read back into shape. */
export function fromRaw(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  return {
    ...EMPTY,
    ...raw,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((id) => typeof id === 'string') : [],
    lessons: Array.isArray(raw.lessons) ? raw.lessons.filter((id) => typeof id === 'string') : [],
    missions: Array.isArray(raw.missions) ? raw.missions.filter((id) => typeof id === 'string') : [],
  };
}

export function load() {
  try {
    return fromRaw(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    return { ...EMPTY };
  }
}

export function save(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* private mode — the city is still walkable, it just forgets */
  }
}

/**
 * Count today's visit.
 *
 * Yesterday continues the run, the same day again changes nothing, and any
 * longer gap starts over at one. Opening the app twice in a minute must not
 * read as two days, which is why this is keyed on the date and not on a count.
 */
export function visit(progress, day = today()) {
  if (progress.lastDay === day) return progress;
  const streak = progress.lastDay === dayBefore(day) ? progress.streak + 1 : 1;
  return {
    ...progress,
    streak,
    best: Math.max(progress.best, streak),
    days: progress.days + 1,
    lastDay: day,
  };
}

/** The records the city keeps on your behalf. */
export function record(progress, { dayPct, value }) {
  let next = progress;
  if (Number.isFinite(dayPct)) {
    if (next.bestDayPct == null || dayPct > next.bestDayPct) next = { ...next, bestDayPct: dayPct };
    if (next.worstDayPct == null || dayPct < next.worstDayPct) next = { ...next, worstDayPct: dayPct };
  }
  if (Number.isFinite(value) && value > (next.peak || 0)) next = { ...next, peak: value };
  return next;
}

export const has = (progress, id) => progress.unlocked.includes(id);

/** Adds the ids that are not already there, keeping the order they arrived in. */
export function unlock(progress, ids) {
  const fresh = ids.filter((id) => !progress.unlocked.includes(id));
  return fresh.length ? { ...progress, unlocked: [...progress.unlocked, ...fresh] } : progress;
}

/** A lesson read stays read; a mission done stays done. Same object when nothing is new. */
export const seeLesson = (progress, id) =>
  progress.lessons.includes(id) ? progress : { ...progress, lessons: [...progress.lessons, id] };

/** A daily task done today; the same task twice in a day counts once. */
export function doDaily(progress, id, day = today()) {
  const cur = progress.daily?.day === day ? progress.daily : { day, done: [] };
  if (cur.done.includes(id)) return progress;
  return { ...progress, daily: { day, done: [...cur.done, id] }, dailyDone: (progress.dailyDone ?? 0) + 1 };
}

export const connectedOnce = (progress) => (progress.connected ? progress : { ...progress, connected: true });

export function completeMissions(progress, ids) {
  const fresh = ids.filter((id) => !progress.missions.includes(id));
  return fresh.length ? { ...progress, missions: [...progress.missions, ...fresh] } : progress;
}
