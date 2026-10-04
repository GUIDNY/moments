/**
 * Short daily tasks, two a day, chosen by the date so everyone gets the
 * same pair and tomorrow brings another. Each is one thing to look at or
 * read, never a trade: the city rewards attention and learning, not
 * activity. `action` is what the app opens; doing it is what completes
 * the task, and a task is worth a little XP once a day.
 */
export const DAILY = [
  { id: 'spread', emoji: '🧩', title: { he: 'בדוק את פיזור הסקטורים שלך', en: 'Check your sector spread' }, action: 'health' },
  { id: 'biggest', emoji: '🏙️', title: { he: 'מצא איזה סקטור הוא הגדול ביותר בתיק', en: 'Find your largest sector' }, action: 'allocation' },
  { id: 'company', emoji: '📰', title: { he: 'קרא על אחת החברות שלך', en: 'Read about one of your companies' }, action: 'news' },
  { id: 'etf', emoji: '🧺', title: { he: 'למד מה זה ETF', en: 'Learn what an ETF is' }, action: 'lesson', lesson: 'index' },
  { id: 'pe', emoji: '📐', title: { he: 'למד מה זה מכפיל רווח (P/E)', en: 'Learn what a P/E ratio is' }, action: 'glossary' },
  { id: 'day', emoji: '📈', title: { he: 'הבן מה אומר השינוי היומי', en: 'Understand the day change' }, action: 'lesson', lesson: 'day-change' },
  { id: 'fees', emoji: '🧾', title: { he: 'למד כמה עולה פעולה', en: 'Learn what a trade costs' }, action: 'lesson', lesson: 'fees' },
  { id: 'risk', emoji: '🛟', title: { he: 'למד מה זה סיכון ריכוזיות', en: 'Learn what concentration risk is' }, action: 'lesson', lesson: 'concentration' },
  { id: 'portfolio', emoji: '💼', title: { he: 'בדוק את התיק שלך', en: 'Look over your portfolio' }, action: 'portfolio' },
  { id: 'glossary', emoji: '📖', title: { he: 'קרא מושג אחד במילון', en: 'Read one glossary term' }, action: 'glossary' },
];

/** Today's two, by the local date. */
export function dailyFor(day) {
  const seed = [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);
  const a = seed % DAILY.length;
  const b = (a + 1 + (seed >> 3) % (DAILY.length - 1)) % DAILY.length;
  return [DAILY[a], DAILY[b]];
}
