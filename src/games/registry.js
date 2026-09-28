import BullVsBearGame from './BullVsBearGame';
import ChartReadingGame from './ChartReadingGame';
import MemoryGame from './MemoryGame';
import PatternQuizGame from './PatternQuizGame';
import PercentGame from './PercentGame';
import ReflexGame from './ReflexGame';
import SpeedRunGame from './SpeedRunGame';
import SurvivalGame from './SurvivalGame';
import TradingFloorGame from './TradingFloorGame';
import WheelGame from './WheelGame';
import { TOTAL_GAMES } from '../engine/constants';

/** Every playable place in the city. `id` matches a building's `target`. */
export const GAMES = [
  {
    id: 'chart-reading',
    name: 'מגדל הגרפים',
    emoji: '📈',
    district: 'study',
    tagline: 'זהה את התבנית ונחש לאן המחיר הולך',
    howTo: '8 גרפים. בכל אחד יש תבנית נרות — בחר עלייה או ירידה, ותראה מה קרה באמת.',
    payout: 'עד 180 מטבעות + בונוס רצף',
    component: ChartReadingGame,
  },
  {
    id: 'pattern-quiz',
    name: 'מכון התבניות',
    emoji: '🔍',
    district: 'study',
    tagline: 'תן שם לתבנית מתוך ארבע אפשרויות',
    howTo: '8 גרפים, ארבע אפשרויות לכל אחד. בלי רמזים.',
    payout: 'עד 190 מטבעות',
    component: PatternQuizGame,
  },
  {
    id: 'memory',
    name: 'בית הזיכרון',
    emoji: '🃏',
    district: 'study',
    tagline: 'התאם זוגות של אותה תבנית',
    howTo: 'שני קלפים של אותה תבנית מצוירים ממחירים שונים. פחות מהלכים = יותר מטבעות.',
    payout: 'עד 300 מטבעות',
    component: MemoryGame,
  },
  {
    id: 'percent',
    name: 'אולם האחוזים',
    emoji: '🧮',
    district: 'study',
    tagline: 'חשבון אחוזים מהיר בראש',
    howTo: '8 שאלות, 12 שניות לכל אחת.',
    payout: 'עד 200 מטבעות',
    component: PercentGame,
  },
  {
    id: 'speed-run',
    name: 'מסלול המהירות',
    emoji: '⚡',
    district: 'speed',
    tagline: 'כמה קריאות נכונות ב-45 שניות',
    howTo: 'גרף אחרי גרף בלי הפסקה. 26 מטבעות לכל קריאה נכונה.',
    payout: '26 מטבעות לכל פגיעה',
    component: SpeedRunGame,
  },
  {
    id: 'reflex',
    name: 'מכון הרפלקס',
    emoji: '🎯',
    district: 'speed',
    tagline: 'כמה מהר אתה מגיב לאות',
    howTo: 'חמישה סיבובים. חכה לאות ולחץ — לחיצה מוקדמת עולה לך ביוקר.',
    payout: 'עד 320 מטבעות',
    component: ReflexGame,
  },
  {
    id: 'survival',
    name: 'מגדל ההישרדות',
    emoji: '💀',
    district: 'speed',
    tagline: 'טעות אחת והכול נגמר',
    howTo: 'ענה נכון שוב ושוב. הרצף שווה 30 מטבעות לכל שלב, ובונוס גדול מ-10 ומעלה.',
    payout: '30 מטבעות לכל שלב ברצף',
    component: SurvivalGame,
  },
  {
    id: 'bull-vs-bear',
    name: 'זירת השור והדוב',
    emoji: '🐂',
    district: 'speed',
    tagline: 'תפוס שוורים, התחמק מדובים',
    howTo: '30 שניות, שלושה לבבות. 🐂 נקודה, 💎 שלוש, 🐻 עולה לב.',
    payout: '22 מטבעות לכל נקודה',
    component: BullVsBearGame,
  },
  {
    id: 'trading-floor',
    name: 'חדר המסחר',
    emoji: '🏛️',
    district: 'finance',
    tagline: 'סשן מסחר חי — קנה נמוך, מכור גבוה',
    howTo: '₪1,000 התחלתיים ו-45 נרות. התשואה שלך קובעת את התשלום.',
    payout: '60 + 22 מטבעות לכל אחוז רווח',
    component: TradingFloorGame,
  },
  {
    id: 'wheel',
    name: 'גלגל המזל',
    emoji: '🎡',
    district: 'fun',
    tagline: 'עצור את הסמן על הפרוסה היקרה',
    howTo: 'שלוש עצירות, והסמן מאיץ בכל אחת. אמצע הפס שווה 600.',
    payout: 'עד 1,800 מטבעות',
    component: WheelGame,
  },
];

export const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

if (GAMES.length !== TOTAL_GAMES) {
  // keeps the "played every game" achievement honest if a game is ever added
  console.warn(`TOTAL_GAMES is ${TOTAL_GAMES} but the registry has ${GAMES.length}`);
}
