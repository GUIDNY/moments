import { lcg, shuffle } from '../engine/rng';
import { DAY, T0, genTrend, mk } from '../engine/market';

/**
 * Candlestick patterns. Every pattern builds itself from a seed, so the same
 * pattern can be drawn an unlimited number of times with different prices,
 * volatility and trend length — the player learns the shape, not the picture.
 */

const startPrice = (rng) => 40 + Math.round(rng() * 160);

function build(seed, { trendBias, trendVol = 2.0, trendLen = [10, 14], shape, revealBias, revealLen = 5 }) {
  const rng = lcg(seed);
  const len = trendLen[0] + Math.floor(rng() * (trendLen[1] - trendLen[0] + 1));
  const scale = 0.6 + rng() * 0.9;
  const ctx = genTrend(T0, startPrice(rng), len, trendBias * scale, trendVol * scale, seed + 7);
  const p = ctx.price;
  const t = ctx.next;
  const unit = Math.max(0.8, p * 0.02);
  const planted = shape({ p, t, unit, rng });
  const last = planted[planted.length - 1];
  const reveal = genTrend(
    last.time + DAY,
    last.close,
    revealLen,
    revealBias * unit * 0.6,
    unit * 0.9,
    seed + 13
  ).candles;
  return { question: [...ctx.candles, ...planted], reveal };
}

export const PATTERNS = [
  {
    id: 'hammer',
    name: 'פטיש',
    en: 'Hammer',
    answer: 'up',
    difficulty: 'easy',
    tip: 'צל תחתון ארוך אחרי ירידה — הקונים בלעו את המכירה.',
    checklist: ['גוף קטן בחלק העליון של הנר', 'צל תחתון פי 2 לפחות מהגוף', 'מופיע בסוף מגמת ירידה'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 2.4,
        shape: ({ p, t, unit }) => [mk(t, p, p + unit * 0.35, unit * 0.4, unit * 2.8)],
      }),
  },
  {
    id: 'shooting-star',
    name: 'כוכב נופל',
    en: 'Shooting Star',
    answer: 'down',
    difficulty: 'easy',
    tip: 'צל עליון ארוך אחרי עלייה — המוכרים החזירו את המחיר למטה.',
    checklist: ['גוף קטן בחלק התחתון של הנר', 'צל עליון ארוך', 'מופיע בסוף מגמת עלייה'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -2.4,
        shape: ({ p, t, unit }) => [mk(t, p, p - unit * 0.35, unit * 2.8, unit * 0.4)],
      }),
  },
  {
    id: 'bullish-engulfing',
    name: 'בליעה שורית',
    en: 'Bullish Engulfing',
    answer: 'up',
    difficulty: 'easy',
    tip: 'נר ירוק שבולע לגמרי את האדום שלפניו.',
    checklist: ['נר אדום קטן', 'נר ירוק שעוטף אותו מלמעלה ומלמטה', 'אחרי ירידה'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 2.2,
        shape: ({ p, t, unit }) => [
          mk(t, p, p - unit * 0.7, unit * 0.2, unit * 0.2),
          mk(t + DAY, p - unit * 0.8, p + unit * 1.4, unit * 0.3, unit * 0.3),
        ],
      }),
  },
  {
    id: 'bearish-engulfing',
    name: 'בליעה דובית',
    en: 'Bearish Engulfing',
    answer: 'down',
    difficulty: 'easy',
    tip: 'נר אדום שבולע לגמרי את הירוק שלפניו.',
    checklist: ['נר ירוק קטן', 'נר אדום שעוטף אותו', 'אחרי עלייה'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -2.2,
        shape: ({ p, t, unit }) => [
          mk(t, p, p + unit * 0.7, unit * 0.2, unit * 0.2),
          mk(t + DAY, p + unit * 0.8, p - unit * 1.4, unit * 0.3, unit * 0.3),
        ],
      }),
  },
  {
    id: 'morning-star',
    name: 'כוכב הבוקר',
    en: 'Morning Star',
    answer: 'up',
    difficulty: 'medium',
    tip: 'שלושה נרות: ירידה חדה, היסוס, ואז התאוששות.',
    checklist: ['נר אדום גדול', 'נר קטן/דוג׳י בתחתית', 'נר ירוק שמחזיר את הירידה'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 2.0,
        shape: ({ p, t, unit }) => [
          mk(t, p, p - unit * 1.8, unit * 0.2, unit * 0.2),
          mk(t + DAY, p - unit * 2.0, p - unit * 2.05, unit * 0.8, unit * 0.8),
          mk(t + 2 * DAY, p - unit * 1.9, p - unit * 0.3, unit * 0.2, unit * 0.2),
        ],
      }),
  },
  {
    id: 'evening-star',
    name: 'כוכב הערב',
    en: 'Evening Star',
    answer: 'down',
    difficulty: 'medium',
    tip: 'שלושה נרות: עלייה חדה, היסוס בפסגה, ואז מפולת.',
    checklist: ['נר ירוק גדול', 'נר קטן בפסגה', 'נר אדום שמוחק את העלייה'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -2.0,
        shape: ({ p, t, unit }) => [
          mk(t, p, p + unit * 1.8, unit * 0.2, unit * 0.2),
          mk(t + DAY, p + unit * 2.0, p + unit * 2.05, unit * 0.8, unit * 0.8),
          mk(t + 2 * DAY, p + unit * 1.9, p + unit * 0.3, unit * 0.2, unit * 0.2),
        ],
      }),
  },
  {
    id: 'doji',
    name: 'דוג׳י',
    en: 'Doji',
    answer: 'up',
    difficulty: 'hard',
    tip: 'פתיחה וסגירה כמעט זהות — היסוס. אחרי ירידה ארוכה זה לרוב סימן היפוך.',
    checklist: ['גוף כמעט חסר', 'צללים לשני הכיוונים', 'ההקשר קובע את הכיוון'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.45,
        revealBias: 1.8,
        shape: ({ p, t, unit }) => [mk(t, p, p + unit * 0.04, unit * 1.4, unit * 1.4)],
      }),
  },
  {
    id: 'three-white',
    name: 'שלושה חיילים לבנים',
    en: 'Three White Soldiers',
    answer: 'up',
    difficulty: 'medium',
    tip: 'שלושה נרות ירוקים רצופים — מומנטום קונים ברור.',
    checklist: ['שלושה גופים ירוקים', 'כל נר סוגר גבוה מקודמו', 'צללים קצרים'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.25,
        revealBias: 2.0,
        shape: ({ p, t, unit }) => [
          mk(t, p, p + unit * 1.3, unit * 0.15, unit * 0.15),
          mk(t + DAY, p + unit * 1.0, p + unit * 2.4, unit * 0.15, unit * 0.15),
          mk(t + 2 * DAY, p + unit * 2.1, p + unit * 3.5, unit * 0.15, unit * 0.15),
        ],
      }),
  },
  {
    id: 'three-crows',
    name: 'שלושה עורבים שחורים',
    en: 'Three Black Crows',
    answer: 'down',
    difficulty: 'medium',
    tip: 'שלושה נרות אדומים רצופים — המוכרים בשליטה.',
    checklist: ['שלושה גופים אדומים', 'כל נר סוגר נמוך מקודמו', 'צללים קצרים'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.25,
        revealBias: -2.0,
        shape: ({ p, t, unit }) => [
          mk(t, p, p - unit * 1.3, unit * 0.15, unit * 0.15),
          mk(t + DAY, p - unit * 1.0, p - unit * 2.4, unit * 0.15, unit * 0.15),
          mk(t + 2 * DAY, p - unit * 2.1, p - unit * 3.5, unit * 0.15, unit * 0.15),
        ],
      }),
  },
  {
    id: 'inverted-hammer',
    name: 'פטיש הפוך',
    en: 'Inverted Hammer',
    answer: 'up',
    difficulty: 'hard',
    tip: 'צל עליון ארוך בתחתית — ניסיון ראשון של הקונים לדחוף למעלה.',
    checklist: ['גוף קטן בתחתית הנר', 'צל עליון ארוך', 'מופיע בסוף ירידה'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 2.0,
        shape: ({ p, t, unit }) => [mk(t, p, p + unit * 0.3, unit * 2.6, unit * 0.35)],
      }),
  },
  {
    id: 'hanging-man',
    name: 'איש תלוי',
    en: 'Hanging Man',
    answer: 'down',
    difficulty: 'hard',
    tip: 'נראה כמו פטיש — אבל בפסגה. אזהרה לפני ירידה.',
    checklist: ['גוף קטן למעלה', 'צל תחתון ארוך', 'מופיע בסוף עלייה'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -2.0,
        shape: ({ p, t, unit }) => [mk(t, p, p + unit * 0.3, unit * 0.35, unit * 2.6)],
      }),
  },
  {
    id: 'piercing-line',
    name: 'קו חודר',
    en: 'Piercing Line',
    answer: 'up',
    difficulty: 'hard',
    tip: 'נר ירוק שנפתח בגאפ למטה וסוגר מעל אמצע האדום הקודם.',
    checklist: ['נר אדום גדול', 'פתיחה בגאפ מתחתיו', 'סגירה מעל אמצע הנר האדום'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 1.8,
        shape: ({ p, t, unit }) => [
          mk(t, p, p - unit * 1.8, unit * 0.2, unit * 0.2),
          mk(t + DAY, p - unit * 2.3, p - unit * 0.7, unit * 0.25, unit * 0.25),
        ],
      }),
  },
  {
    id: 'dark-cloud',
    name: 'ענן כהה',
    en: 'Dark Cloud Cover',
    answer: 'down',
    difficulty: 'hard',
    tip: 'נר אדום שנפתח בגאפ למעלה וסוגר מתחת לאמצע הירוק הקודם.',
    checklist: ['נר ירוק גדול', 'פתיחה בגאפ מעליו', 'סגירה מתחת לאמצע הנר הירוק'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -1.8,
        shape: ({ p, t, unit }) => [
          mk(t, p, p + unit * 1.8, unit * 0.2, unit * 0.2),
          mk(t + DAY, p + unit * 2.3, p + unit * 0.7, unit * 0.25, unit * 0.25),
        ],
      }),
  },
  {
    id: 'marubozu-bull',
    name: 'מרובוזו שורי',
    en: 'Bullish Marubozu',
    answer: 'up',
    difficulty: 'easy',
    tip: 'נר ירוק ענק בלי צללים — קנייה מהפתיחה ועד הסגירה.',
    checklist: ['גוף ירוק גדול', 'כמעט בלי צללים', 'שבירה של הדשדוש'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.1,
        trendVol: 1.4,
        revealBias: 2.2,
        shape: ({ p, t, unit }) => [mk(t, p, p + unit * 3.2, unit * 0.05, unit * 0.05)],
      }),
  },
  {
    id: 'marubozu-bear',
    name: 'מרובוזו דובי',
    en: 'Bearish Marubozu',
    answer: 'down',
    difficulty: 'easy',
    tip: 'נר אדום ענק בלי צללים — מכירה רצופה לאורך כל היום.',
    checklist: ['גוף אדום גדול', 'כמעט בלי צללים', 'שבירה של הדשדוש'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.1,
        trendVol: 1.4,
        revealBias: -2.2,
        shape: ({ p, t, unit }) => [mk(t, p, p - unit * 3.2, unit * 0.05, unit * 0.05)],
      }),
  },
  {
    id: 'tweezer-bottom',
    name: 'מלקחיים תחתונים',
    en: 'Tweezer Bottom',
    answer: 'up',
    difficulty: 'medium',
    tip: 'שני נרות שנוגעים באותו שפל — רצפה שמחזיקה.',
    checklist: ['שני שפלים זהים', 'אחרי ירידה', 'הנר השני ירוק'],
    build: (seed) =>
      build(seed, {
        trendBias: -0.5,
        revealBias: 1.9,
        shape: ({ p, t, unit }) => [
          mk(t, p, p - unit * 0.6, unit * 0.2, unit * 1.6),
          mk(t + DAY, p - unit * 0.6, p + unit * 0.5, unit * 0.2, unit * 1.0),
        ],
      }),
  },
  {
    id: 'tweezer-top',
    name: 'מלקחיים עליונים',
    en: 'Tweezer Top',
    answer: 'down',
    difficulty: 'medium',
    tip: 'שני נרות שנוגעים באותה פסגה — תקרה שלא נשברת.',
    checklist: ['שתי פסגות זהות', 'אחרי עלייה', 'הנר השני אדום'],
    build: (seed) =>
      build(seed, {
        trendBias: 0.5,
        revealBias: -1.9,
        shape: ({ p, t, unit }) => [
          mk(t, p, p + unit * 0.6, unit * 1.6, unit * 0.2),
          mk(t + DAY, p + unit * 0.6, p - unit * 0.5, unit * 1.0, unit * 0.2),
        ],
      }),
  },
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));

export const DIFFICULTY_LABEL = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };
export const DIFFICULTY_COLOR = { easy: '#44e092', medium: '#f5c542', hard: '#ffb4aa' };

/** Build one playable round out of a pattern. */
export function makeRound(pattern, seed) {
  const { question, reveal } = pattern.build(seed);
  return {
    key: `${pattern.id}-${seed}`,
    patternId: pattern.id,
    name: pattern.name,
    en: pattern.en,
    answer: pattern.answer,
    difficulty: pattern.difficulty,
    tip: pattern.tip,
    checklist: pattern.checklist,
    questionCandles: question,
    revealCandles: reveal,
  };
}

/** A shuffled deck of `count` rounds, optionally restricted by difficulty. */
export function makeDeck(count, baseSeed, { difficulties } = {}) {
  const rng = lcg(baseSeed);
  const pool = difficulties ? PATTERNS.filter((p) => difficulties.includes(p.difficulty)) : PATTERNS;
  const deck = [];
  let bag = [];
  for (let i = 0; i < count; i++) {
    if (bag.length === 0) bag = shuffle(pool, rng);
    deck.push(makeRound(bag.pop(), Math.floor(rng() * 1e9)));
  }
  return deck;
}
