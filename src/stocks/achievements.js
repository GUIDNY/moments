/**
 * The badges the city hands out.
 *
 * Every one of them is decided from what is already on screen — the holdings,
 * the prices, the streak — so there is nothing to track and nothing to cheat.
 * Each carries its own bilingual name and note, the way the catalogue does, so
 * adding one never means touching the dictionary.
 *
 * Two rules keep these honest. They are **earned, never lost**: a badge for a
 * green day stays won when the day turns red, because it did happen. And a
 * badge that depends on a price is only ever tested against prices that have
 * actually arrived — `ready` is false while the market is still loading, and
 * an empty skyline would otherwise unlock "you survived a bad day" on a
 * portfolio worth nothing.
 */

// the sector is a property of the holding, not of the quote: a position the
// market could not price still belongs to its district
const sectorsOf = (holdings) => new Set(holdings.map((h) => h.sector).filter(Boolean));
const currenciesOf = (positions) =>
  new Set(positions.filter((p) => !p.missing).map((p) => p.currency).filter(Boolean));
const best = (positions, pick) =>
  positions.reduce((m, p) => {
    const v = pick(p);
    return Number.isFinite(v) && (m == null || v > m) ? v : m;
  }, null);

export const ACHIEVEMENTS = [
  {
    id: 'first',
    emoji: '🏗️',
    name: { he: 'אבן פינה', en: 'Ground broken' },
    note: { he: 'המגדל הראשון בעיר', en: 'The first tower in the city' },
    test: ({ holdings }) => holdings.length >= 1,
  },
  {
    id: 'city',
    emoji: '🌇',
    name: { he: 'העיר הראשונה', en: 'First city' },
    note: { he: 'תיק אמיתי חובר לעיר', en: 'A real portfolio connected to the city' },
    test: ({ progress }) => Boolean(progress.connected),
  },
  {
    id: 'etf',
    emoji: '🧺',
    name: { he: 'משקיע בקרנות', en: 'ETF investor' },
    note: { he: 'קרן סל או מדד בתיק', en: 'An index fund in the portfolio' },
    test: ({ holdings }) => holdings.some((h) => h.sector === 'other'),
  },
  {
    id: 'street',
    emoji: '🏙️',
    name: { he: 'רחוב שלם', en: 'A whole street' },
    note: { he: 'חמישה מגדלים', en: 'Five towers standing' },
    test: ({ holdings }) => holdings.length >= 5,
  },
  {
    id: 'skyline',
    emoji: '🌆',
    name: { he: 'קו רקיע', en: 'Skyline' },
    note: { he: 'עשרה מגדלים', en: 'Ten towers standing' },
    test: ({ holdings }) => holdings.length >= 10,
  },
  {
    id: 'districts',
    emoji: '🗺️',
    name: { he: 'ארבעה רבעים', en: 'Four districts' },
    note: { he: 'פיזור על פני ארבעה ענפים', en: 'Holdings in four different sectors' },
    test: ({ holdings }) => sectorsOf(holdings).size >= 4,
  },
  {
    id: 'global',
    emoji: '🌍',
    name: { he: 'עיר נמל', en: 'Port city' },
    note: { he: 'אחזקות בשני מטבעות', en: 'Holdings in two currencies' },
    test: ({ positions, ready }) => ready && currenciesOf(positions).size >= 2,
  },
  {
    id: 'profit',
    emoji: '💰',
    name: { he: 'מעל המים', en: 'Above water' },
    note: { he: 'התיק כולו ברווח', en: 'The whole portfolio in profit' },
    test: ({ summary, ready }) => ready && summary.gainPct > 0,
  },
  {
    id: 'greenday',
    emoji: '📈',
    name: { he: 'יום ירוק', en: 'A green day' },
    note: { he: 'התיק עלה אחוז ביום אחד', en: 'The portfolio up a percent in a day' },
    test: ({ summary, ready }) => ready && summary.dayPct >= 1,
  },
  {
    id: 'redday',
    emoji: '🛟',
    name: { he: 'שרדתם', en: 'You stayed' },
    note: { he: 'הייתם כאן ביום של 2%- ולא ברחתם', en: 'Here for a 2% down day, and still here' },
    test: ({ summary, ready }) => ready && summary.dayPct <= -2,
  },
  {
    id: 'mover',
    emoji: '⚡',
    name: { he: 'יום סוער', en: 'Wild day' },
    note: { he: 'אחזקה זזה 5% ביום', en: 'A holding moved 5% in a day' },
    test: ({ positions, ready }) => ready && (best(positions, (p) => Math.abs(p.dayPct)) ?? 0) >= 5,
  },
  {
    id: 'double',
    emoji: '🚀',
    name: { he: 'הכפלה', en: 'Doubled' },
    note: { he: 'אחזקה שווה פי שניים ממה ששילמתם', en: 'A holding worth twice what you paid' },
    test: ({ positions, ready }) => ready && (best(positions, (p) => p.gainPct) ?? 0) >= 100,
  },
  {
    id: 'landmark',
    emoji: '🗼',
    name: { he: 'מגדל העיר', en: 'The landmark' },
    note: { he: 'אחזקה אחת היא חצי מהתיק', en: 'One holding is half the portfolio' },
    test: ({ positions, summary, ready }) =>
      ready &&
      summary.value > 0 &&
      positions.length > 1 &&
      (best(positions, (p) => p.converted) ?? 0) >= summary.value * 0.5,
  },
  {
    id: 'diversified',
    emoji: '🧩',
    name: { he: 'משקיע מפוזר', en: 'Diversified investor' },
    note: { he: 'חמש אחזקות בשלושה ענפים, אף אחת מעל 40%', en: 'Five holdings in three sectors, none over 40%' },
    test: ({ holdings, positions, ready, totalUsd }) =>
      ready &&
      holdings.length >= 5 &&
      sectorsOf(holdings).size >= 3 &&
      totalUsd > 0 &&
      (best(positions, (p) => p.valueUsd) ?? 0) <= totalUsd * 0.4,
  },
  {
    id: 'sectors5',
    emoji: '🏙️',
    name: { he: 'חמישה רבעים', en: 'Five sectors' },
    note: { he: 'אחזקות בחמישה ענפים שונים', en: 'Holdings in five different sectors' },
    test: ({ holdings }) => sectorsOf(holdings).size >= 5,
  },
  {
    id: 'builder',
    emoji: '🏗️',
    name: { he: 'בונה תיק', en: 'Portfolio builder' },
    note: { he: 'לפחות שמונה אחזקות ושני שלישים מהכסף מושקעים', en: 'Eight holdings and two thirds of the purse at work' },
    test: ({ holdings, summary, ready, totalUsd }) => ready && holdings.length >= 8 && totalUsd > 0 && summary.valueUsd / totalUsd >= 0.66,
  },
  {
    id: 'dividend',
    emoji: '🪙',
    name: { he: 'דיבידנד ראשון', en: 'First dividend' },
    note: { he: 'חברה שילמה לכם חלק מהרווחים', en: 'A company paid you a share of its profits' },
    test: ({ trades }) => (trades ?? []).some((t) => t.side === 'dividend'),
  },
  {
    id: 'longterm',
    emoji: '🕰️',
    name: { he: 'משקיע לטווח ארוך', en: 'Long-term holder' },
    note: { he: 'אחזקה שהחזקתם חודש שלם', en: 'A holding kept for a whole month' },
    test: ({ holdings, now = Date.now() }) => holdings.some((h) => h.since && now - h.since >= 30 * 86400000),
  },
  {
    id: 'streak3',
    emoji: '🔥',
    name: { he: 'שלושה ימים', en: 'Three in a row' },
    note: { he: 'ביקרתם בעיר שלושה ימים ברצף', en: 'Three days running in the city' },
    test: ({ progress }) => progress.streak >= 3,
  },
  {
    id: 'streak7',
    emoji: '🗓️',
    name: { he: 'שבוע שלם', en: 'A full week' },
    note: { he: 'שבעה ימים ברצף', en: 'Seven days running' },
    test: ({ progress }) => progress.streak >= 7,
  },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/**
 * Which badges the city would award right now.
 *
 * A badge whose test throws — a shape of position nobody foresaw — is simply
 * not awarded. Walking the city must not stop because a trophy miscounted.
 */
export function earned(ctx) {
  const out = [];
  for (const a of ACHIEVEMENTS) {
    try {
      if (a.test(ctx)) out.push(a.id);
    } catch {
      /* a badge is never worth an exception */
    }
  }
  return out;
}
