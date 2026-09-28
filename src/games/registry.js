import BullseyeGame from './BullseyeGame';
import CatchGame from './CatchGame';
import EchoGame from './EchoGame';
import LuckyStopGame from './LuckyStopGame';
import MoleGame from './MoleGame';
import NumberRushGame from './NumberRushGame';
import OddOneGame from './OddOneGame';
import PairUpGame from './PairUpGame';
import QuickMathsGame from './QuickMathsGame';
import ReactionGame from './ReactionGame';
import { TOTAL_GAMES } from '../engine/constants';

/** Every playable place in town. `id` matches a building's `target`. */
export const GAMES = [
  {
    id: 'pair-up',
    emoji: '🃏',
    district: 'mind',
    name: { en: 'Pair Up', he: 'זוגות' },
    tagline: { en: 'Match every pair in as few moves as you can', he: 'מצא את כל הזוגות בכמה שפחות מהלכים' },
    payout: { en: 'up to 300 coins', he: 'עד 300 מטבעות' },
    component: PairUpGame,
  },
  {
    id: 'echo',
    emoji: '🎵',
    district: 'mind',
    name: { en: 'Echo', he: 'הד' },
    tagline: { en: 'Repeat the sequence — it grows every round', he: 'חזור על הרצף — הוא גדל בכל סיבוב' },
    payout: { en: '45 coins per step', he: '45 מטבעות לכל שלב' },
    component: EchoGame,
  },
  {
    id: 'odd-one',
    emoji: '👁️',
    district: 'mind',
    name: { en: 'Odd One Out', he: 'השונה' },
    tagline: { en: 'Find the tile that is a shade off', he: 'מצא את המשבצת בגוון שונה' },
    payout: { en: '34 coins per round', he: '34 מטבעות לכל סיבוב' },
    component: OddOneGame,
  },
  {
    id: 'quick-maths',
    emoji: '🧮',
    district: 'mind',
    name: { en: 'Quick Maths', he: 'חשבון מהיר' },
    tagline: { en: 'Eight sums, ten seconds each', he: 'שמונה תרגילים, עשר שניות לכל אחד' },
    payout: { en: 'up to 220 coins', he: 'עד 220 מטבעות' },
    component: QuickMathsGame,
  },
  {
    id: 'reaction',
    emoji: '⚡',
    district: 'speed',
    name: { en: 'Reaction', he: 'רפלקס' },
    tagline: { en: 'Wait for green, then tap as fast as you can', he: 'חכה לירוק ולחץ מהר ככל האפשר' },
    payout: { en: 'up to 340 coins', he: 'עד 340 מטבעות' },
    component: ReactionGame,
  },
  {
    id: 'number-rush',
    emoji: '🔢',
    district: 'speed',
    name: { en: 'Number Rush', he: 'מרוץ המספרים' },
    tagline: { en: 'Tap 1 to 16 in order against the clock', he: 'לחץ 1 עד 16 לפי הסדר נגד השעון' },
    payout: { en: 'up to 320 coins', he: 'עד 320 מטבעות' },
    component: NumberRushGame,
  },
  {
    id: 'catch',
    emoji: '🧺',
    district: 'speed',
    name: { en: 'Catch', he: 'תופס' },
    tagline: { en: 'Slide the basket, catch the fruit, dodge the bombs', he: 'הזז את הסל, תפוס פירות, התחמק מפצצות' },
    payout: { en: '20 coins per point', he: '20 מטבעות לכל נקודה' },
    component: CatchGame,
  },
  {
    id: 'moles',
    emoji: '🐹',
    district: 'speed',
    name: { en: 'Mole Mayhem', he: 'חפרפרות' },
    tagline: { en: 'Tap the critters, spare the bombs', he: 'תפוס חפרפרות, התחמק מפצצות' },
    payout: { en: '22 coins per point', he: '22 מטבעות לכל נקודה' },
    component: MoleGame,
  },
  {
    id: 'bullseye',
    emoji: '🎯',
    district: 'square',
    name: { en: 'Bullseye', he: 'בול פגיעה' },
    tagline: { en: 'Stop the pulsing ring exactly on the outline', he: 'עצור את הטבעת בדיוק על הקו' },
    payout: { en: 'up to 360 coins', he: 'עד 360 מטבעות' },
    component: BullseyeGame,
  },
  {
    id: 'lucky-stop',
    emoji: '🎡',
    district: 'fun',
    name: { en: 'Lucky Stop', he: 'עצור בזמן' },
    tagline: { en: 'Stop the marker on the narrow, rich slice', he: 'עצור את הסמן על הפרוסה הצרה והיקרה' },
    payout: { en: 'up to 1,800 coins', he: 'עד 1,800 מטבעות' },
    component: LuckyStopGame,
  },
];

export const GAMES_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

if (GAMES.length !== TOTAL_GAMES) {
  // keeps the "played everything" achievement honest if a game is ever added
  console.warn(`TOTAL_GAMES is ${TOTAL_GAMES} but the registry has ${GAMES.length}`);
}
