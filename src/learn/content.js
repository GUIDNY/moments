/**
 * What the city teaches.
 *
 * Three kinds of thing, all bilingual beside their data the way the catalogue
 * is, so adding a lesson never means touching the dictionary:
 *
 * - LESSONS fire once each, on the moment they are about — the first buy,
 *   the first red day, the first sale. A lesson read when it applies to the
 *   number on your own screen is one you remember.
 * - MISSIONS are the guided path through the game, in order: each one is a
 *   thing to do and the reason it matters, and finishing it opens its lesson.
 * - GLOSSARY is the words, for when a lesson or a screen uses one.
 *
 * Nothing here is advice. It is how the machine works, told plainly.
 */

export const LESSONS = [
  {
    id: 'welcome',
    emoji: '🏙️',
    title: { he: 'ברוכים הבאים לעיר המניות', en: 'Welcome to Stock City' },
    body: {
      he: [
        'יש לך 100,000 דולר של כסף משחק. המחירים אמיתיים — אלה הבורסות של תל אביב וניו יורק, בהשהיה של רבע שעה.',
        'כל מניה שתקנה הופכת לבניין בעיר. ככל שהפוזיציה שווה יותר, הבניין גדול יותר — מחנות קטנה ועד מגדל; השלט מעל הגג אומר כמה המניה זזה היום, והבניין במרכז הוא התיק כולו.',
        'המטרה היא לא להתעשר. המטרה היא להבין איך זה עובד — ולראות את זה קורה מול העיניים.',
      ],
      en: [
        'You have $100,000 of play money. The prices are real — Tel Aviv and New York, delayed by a quarter of an hour.',
        'Every stock you buy becomes a building in the city. The more the position is worth, the bigger the building — from a small shop to a tower; the sign over its roof says how far the stock moved today, and the building in the middle is the whole portfolio.',
        'The goal is not to get rich. The goal is to understand how this works — and to watch it happen in front of you.',
      ],
    },
    tip: { he: 'התחל בשוק: קנה מניה ראשונה בכמה אלפי דולרים.', en: 'Start at the market: buy a first stock for a few thousand dollars.' },
  },
  {
    id: 'first-buy',
    emoji: '🧾',
    title: { he: 'מה בדיוק קנית?', en: 'What exactly did you buy?' },
    body: {
      he: [
        'מניה היא חלק קטן בבעלות על חברה. אם לחברה יש מיליארד מניות וקנית מאה, אתה הבעלים של עשירית המיליונית ממנה — כולל מהרווחים שלה.',
        'שילמת את מחיר השוק: המחיר שבו הקונה האחרון והמוכר האחרון הסכימו. המחיר הזה משתנה כל כמה שניות כשהמסחר פתוח.',
        'מה ששילמת למניה נקרא "מחיר העלות" (cost basis). כל רווח או הפסד מעכשיו נמדד מולו.',
      ],
      en: [
        'A share is a small piece of ownership in a company. If the company has a billion shares and you bought a hundred, you own a ten-millionth of it — profits included.',
        'You paid the market price: the price the last buyer and the last seller agreed on. It changes every few seconds while the market is open.',
        'What you paid per share is your "cost basis". Every gain or loss from now on is measured against it.',
      ],
    },
    tip: { he: 'הקישו על הבניין כדי לראות את מחיר העלות, המחיר הנוכחי וההפרש.', en: 'Tap the building to see your cost, the current price and the difference.' },
  },
  {
    id: 'fees',
    emoji: '💸',
    title: { he: 'העמלה', en: 'The fee' },
    body: {
      he: [
        'כל פעולה עולה כאן 0.1% (לפחות דולר אחד). בעולם האמיתי ברוקרים גובים עמלת קנייה ומכירה, ולפעמים גם דמי ניהול.',
        'זה נשמע קטן. על עשר פעולות בחודש זה 1% בשנה — יותר ממה שרוב הקרנות גובות. מי שסוחר הרבה משלם הרבה, בלי קשר אם הוא צודק.',
      ],
      en: [
        'Every trade here costs 0.1% (at least a dollar). In the real world brokers charge a fee to buy and to sell, and sometimes a management fee on top.',
        'It sounds small. Ten trades a month is 1% a year — more than most funds charge. Whoever trades a lot pays a lot, whether or not they were right.',
      ],
    },
    tip: { he: 'פחות פעולות, יותר כסף נשאר אצלך.', en: 'Fewer trades, more of the money stays yours.' },
  },
  {
    id: 'day-change',
    emoji: '📈',
    title: { he: 'מה זה "היום"', en: 'What "today" means' },
    body: {
      he: [
        'האחוז הירוק או האדום מעל כל בניין הוא השינוי מסגירת יום המסחר הקודם. הוא לא אומר כלום על אם אתה ברווח — רק על מה קרה היום.',
        'הרווח האמיתי שלך הוא מול מחיר העלות. מניה יכולה להיות אדומה היום ועדיין להיות הרווח הכי גדול בתיק.',
        'תנודה של אחוז ביום היא רגילה. חמישה אחוזים זה יום סוער. עשרה אחוזים — משהו קרה, ושווה לקרוא מה.',
      ],
      en: [
        'The green or red percentage over a building is the change since the previous day\'s close. It says nothing about whether you are in profit — only what happened today.',
        'Your real gain is against your cost basis. A stock can be red today and still be the biggest winner in the portfolio.',
        'A one-percent move in a day is ordinary. Five percent is a wild day. Ten — something happened, and it is worth reading what.',
      ],
    },
  },
  {
    id: 'diversify',
    emoji: '🗺️',
    title: { he: 'למה לא לשים הכול במקום אחד', en: 'Why not put it all in one place' },
    body: {
      he: [
        'שתי מניות מאותו ענף נוטות לזוז יחד: כשהבנקים יורדים, כל הבנקים יורדים. פיזור בין ענפים אומר שלא כל התיק מקבל את אותה מכה באותו יום.',
        'זה לא מבטיח רווח. זה מקטין את הסיכוי שיום רע אחד ימחק חלק גדול ממה שבנית.',
        'בעיר: שכונה שלמה בירוק ושכונה שלמה באדום באותו יום — ככה פיזור נראה.',
      ],
      en: [
        'Two stocks in the same sector tend to move together: when the banks fall, all the banks fall. Spreading across sectors means the whole portfolio does not take the same hit on the same day.',
        'It does not promise a profit. It lowers the odds that one bad day wipes out a large part of what you built.',
        'In the city: one district green and another red on the same day — that is what diversification looks like.',
      ],
    },
    tip: { he: 'משימה: אחזקות בארבעה ענפים שונים.', en: 'Mission: holdings in four different sectors.' },
  },
  {
    id: 'index',
    emoji: '🧺',
    title: { he: 'קרן מדד — לקנות את כל השוק', en: 'An index fund — buying the whole market' },
    body: {
      he: [
        'קרן סל על מדד (ETF) מחזיקה את כל המניות במדד, לפי משקלן. S&P 500 זה 500 החברות הגדולות בארה"ב; ת"א 35 — 35 הגדולות בישראל.',
        'במקום לנחש איזו חברה תצליח, אתה מחזיק את כולן. רוב המשקיעים המקצועיים לא מצליחים להכות את המדד לאורך זמן — וזה אחרי שהם גובים עמלות.',
        'בגלל זה קרן מדד היא נקודת ההתחלה שרוב הספרים ממליצים עליה, לא הסיום.',
      ],
      en: [
        'An index ETF holds every stock in an index, by weight. The S&P 500 is the 500 largest US companies; TA-35 is the 35 largest in Israel.',
        'Instead of guessing which company will do well, you own all of them. Most professional investors fail to beat the index over time — and that is after their fees.',
        'That is why an index fund is the starting point most books recommend, not the finish.',
      ],
    },
  },
  {
    id: 'sell',
    emoji: '🏷️',
    title: { he: 'רווח על הנייר ורווח ביד', en: 'Paper gains and real ones' },
    body: {
      he: [
        'עד שמכרת, הרווח היה "לא ממומש": מספר על המסך שמשתנה כל יום. ברגע המכירה הוא הפך לממומש — כסף בחשבון, וגם המספר שעליו משלמים מס במציאות.',
        'הפסד עובד אותו דבר. למכור בהפסד הופך הפסד על הנייר להפסד אמיתי; להחזיק לא מבטיח שהוא יחזור.',
        'שאלה טובה לפני כל מכירה: האם הייתי קונה את זה היום במחיר הזה? אם כן, למה למכור.',
      ],
      en: [
        'Until you sold, the gain was "unrealised": a number on a screen that changed every day. The moment you sold it became realised — money in the account, and in real life the number you pay tax on.',
        'A loss works the same way. Selling at a loss turns a paper loss into a real one; holding does not promise it will come back.',
        'A good question before any sale: would I buy this today at this price? If yes, why sell.',
      ],
    },
  },
  {
    id: 'currency',
    emoji: '💱',
    title: { he: 'קנית בשקלים עם דולרים', en: 'You bought shekels with dollars' },
    body: {
      he: [
        'המניה הזו נסחרת בשקלים, והכסף שלך בדולרים. המערכת המירה לפי השער של עכשיו — ומעכשיו יש לך עוד דבר שזז: השער.',
        'אם השקל יתחזק מול הדולר, האחזקה שלך תהיה שווה יותר דולרים גם אם המניה לא זזה. ולהפך.',
        'זה נקרא "חשיפה למטבע". משקיע ישראלי שקונה בניו יורק חשוף לדולר; כאן זה הפוך.',
      ],
      en: [
        'This stock trades in shekels and your money is in dollars. The system converted at today\'s rate — and from now on one more thing moves: the rate.',
        'If the shekel strengthens against the dollar, your holding is worth more dollars even if the stock did not move. And the reverse.',
        'This is called "currency exposure". An Israeli investor buying in New York is exposed to the dollar; here it is the other way round.',
      ],
    },
  },
  {
    id: 'concentration',
    emoji: '🗼',
    title: { he: 'בניין אחד הוא חצי מהעיר', en: 'One building is half the city' },
    body: {
      he: [
        'יותר מחצי מהתיק שלך באחזקה אחת. היום הטוב שלה הוא היום הטוב שלך — וגם היום הרע.',
        'זה לא אסור. אבל שווה לדעת: כשחברה אחת מכתיבה את התוצאה, זה לא תיק, זה הימור על חברה.',
      ],
      en: [
        'More than half your portfolio is in one holding. Its good day is your good day — and its bad day.',
        'That is not forbidden. But know it: when one company decides the result, it is not a portfolio, it is a bet on a company.',
      ],
    },
  },
  {
    id: 'red-day',
    emoji: '🛟',
    title: { he: 'יום אדום', en: 'A red day' },
    body: {
      he: [
        'התיק ירד היום יותר משני אחוזים. זה קורה בערך פעם בחודש בשוק רגיל, ויותר כשהשוק עצבני.',
        'הדבר שמשקיעים מתחילים עושים ביום כזה — למכור הכול — הוא בדיוק מה שהופך ירידה זמנית להפסד קבוע. השוק ירד ב-2008, ב-2020 ובעוד עשרות פעמים, ובכל פעם חזר.',
        'אין צורך לעשות כלום. זו המשימה.',
      ],
      en: [
        'The portfolio fell more than two percent today. This happens about once a month in a normal market, and more when the market is nervous.',
        'The thing beginners do on a day like this — sell everything — is exactly what turns a temporary drop into a permanent loss. The market fell in 2008, in 2020 and dozens of times besides, and came back every time.',
        'There is nothing to do. That is the mission.',
      ],
    },
  },
  {
    id: 'long-term',
    emoji: '🗓️',
    title: { he: 'זמן הוא המשאב', en: 'Time is the resource' },
    body: {
      he: [
        'שלושה ימים רצופים בעיר. בשלושה ימים השוק זז בגלל רעש; בשלוש שנים הוא זז בגלל רווחים של חברות.',
        'ריבית דריבית: 7% בשנה מכפילים את הכסף בעשר שנים, ופי ארבעה בעשרים. הדבר היחיד שצריך בשביל זה הוא לא לצאת.',
      ],
      en: [
        'Three days running in the city. Over three days the market moves on noise; over three years it moves on companies\' earnings.',
        'Compounding: 7% a year doubles the money in ten years and quadruples it in twenty. The only thing it needs is for you not to leave.',
      ],
    },
  },
];

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

/** Symbols the game counts as "the whole market". */
const INDEX_LIKE = new Set(['SPY', 'QQQ', 'VOO', 'VTI', 'IVV', 'TA35.TA', 'TA125.TA']);

export const MISSIONS = [
  {
    id: 'first-buy',
    emoji: '🏗️',
    title: { he: 'קנה את המניה הראשונה שלך', en: 'Buy your first stock' },
    why: { he: 'כמה אלפי דולרים מספיקים. הבניין הראשון בעיר.', en: 'A few thousand dollars is plenty. The first building in the city.' },
    lesson: 'first-buy',
    test: ({ holdings }) => holdings.length >= 1,
  },
  {
    id: 'two-sectors',
    emoji: '🏘️',
    title: { he: 'קנה בענף שני', en: 'Buy in a second sector' },
    why: { he: 'בנק וחברת טכנולוגיה לא יורדים באותו יום מאותה סיבה.', en: 'A bank and a tech company do not fall on the same day for the same reason.' },
    lesson: 'diversify',
    test: ({ holdings }) => new Set(holdings.map((h) => h.sector)).size >= 2,
  },
  {
    id: 'index',
    emoji: '🧺',
    title: { he: 'קנה קרן מדד', en: 'Buy an index fund' },
    why: { he: 'S&P 500, נאסד"ק 100 או ת"א 35: כל השוק בפעולה אחת.', en: 'S&P 500, Nasdaq 100 or TA-35: the whole market in one trade.' },
    lesson: 'index',
    test: ({ holdings }) => holdings.some((h) => INDEX_LIKE.has(h.symbol)),
  },
  {
    id: 'diversify',
    emoji: '🗺️',
    title: { he: 'חמש אחזקות בארבעה ענפים', en: 'Five holdings across four sectors' },
    why: { he: 'תיק, לא הימור.', en: 'A portfolio, not a bet.' },
    lesson: 'concentration',
    test: ({ holdings }) => holdings.length >= 5 && new Set(holdings.map((h) => h.sector)).size >= 4,
  },
  {
    id: 'keep-cash',
    emoji: '🏦',
    title: { he: 'השקע לפחות 60% והשאר 10% במזומן', en: 'Invest at least 60% and keep 10% in cash' },
    why: { he: 'כסף בצד הוא מה שמאפשר לקנות ביום אדום במקום למכור בו.', en: 'Cash on the side is what lets you buy on a red day instead of selling on it.' },
    lesson: 'fees',
    test: ({ summary, cash, ready }) => {
      if (!ready) return false;
      const total = summary.valueUsd + cash;
      return total > 0 && summary.valueUsd / total >= 0.6 && cash / total >= 0.1;
    },
  },
  {
    id: 'sell',
    emoji: '🏷️',
    title: { he: 'מכור חלק מאחזקה', en: 'Sell part of a holding' },
    why: { he: 'כדי להרגיש את ההבדל בין רווח על הנייר לרווח ביד.', en: 'To feel the difference between a paper gain and a real one.' },
    lesson: 'sell',
    test: ({ trades }) => trades.some((t) => t.side === 'sell'),
  },
  {
    id: 'patience',
    emoji: '🗓️',
    title: { he: 'שלושה ימים ברצף בעיר', en: 'Three days running in the city' },
    why: { he: 'השוק מתגמל את מי שנשאר, לא את מי שבודק.', en: 'The market rewards whoever stays, not whoever checks.' },
    lesson: 'long-term',
    test: ({ progress, holdings }) => holdings.length > 0 && progress.streak >= 3,
  },
  {
    id: 'grow',
    emoji: '🏆',
    title: { he: 'הגע ל-102,000 דולר', en: 'Reach $102,000' },
    why: { he: 'שני אחוזים. נשמע מעט — זה חצי שנה של ריבית בבנק.', en: 'Two percent. Sounds small — it is half a year of bank interest.' },
    lesson: 'day-change',
    test: ({ summary, cash, ready }) => ready && summary.valueUsd + cash >= 102000,
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));

export const GLOSSARY = [
  { term: { he: 'מניה', en: 'Share' }, def: { he: 'חלק בבעלות על חברה. מקנה חלק ברווחים (דיבידנד) ובהצבעות.', en: 'A piece of ownership in a company, with a share of its profits (dividends) and votes.' } },
  { term: { he: 'מחיר שוק', en: 'Market price' }, def: { he: 'המחיר האחרון שבו קונה ומוכר הסכימו. משתנה כל הזמן כשהבורסה פתוחה.', en: 'The last price a buyer and a seller agreed on. Changes constantly while the exchange is open.' } },
  { term: { he: 'מחיר עלות', en: 'Cost basis' }, def: { he: 'מה ששילמת למניה בממוצע. הרווח וההפסד נמדדים מולו.', en: 'What you paid per share, on average. Gains and losses are measured against it.' } },
  { term: { he: 'רווח לא ממומש', en: 'Unrealised gain' }, def: { he: 'ההפרש בין השווי היום לעלות — על הנייר, כל עוד לא מכרת.', en: 'The difference between today\'s value and your cost — on paper, as long as you have not sold.' } },
  { term: { he: 'רווח ממומש', en: 'Realised gain' }, def: { he: 'הרווח (או ההפסד) שננעל ברגע המכירה. עליו משלמים מס.', en: 'The gain (or loss) locked in at the moment of sale. The one you pay tax on.' } },
  { term: { he: 'שינוי יומי', en: 'Day change' }, def: { he: 'כמה המחיר זז מסגירת היום הקודם. לא אומר כלום על הרווח שלך.', en: 'How far the price moved since the previous close. Says nothing about your gain.' } },
  { term: { he: 'פיזור', en: 'Diversification' }, def: { he: 'אחזקות בחברות וענפים שונים, כדי שיום רע של אחד לא יהיה יום רע של כולם.', en: 'Holdings across different companies and sectors, so one\'s bad day is not everyone\'s.' } },
  { term: { he: 'ענף (סקטור)', en: 'Sector' }, def: { he: 'קבוצת חברות באותו תחום: בנקים, טכנולוגיה, אנרגיה. נוטות לזוז יחד.', en: 'A group of companies in the same business: banks, tech, energy. They tend to move together.' } },
  { term: { he: 'מדד', en: 'Index' }, def: { he: 'סל של מניות שמייצג שוק: S&P 500, ת"א 35. "השוק עלה" = המדד עלה.', en: 'A basket of stocks that stands for a market: S&P 500, TA-35. "The market rose" means the index rose.' } },
  { term: { he: 'קרן סל (ETF)', en: 'ETF' }, def: { he: 'נייר שנסחר כמו מניה ומחזיק סל שלם, בדרך כלל מדד. דרך זולה לקנות את כל השוק.', en: 'A security that trades like a share and holds a whole basket, usually an index. A cheap way to buy the whole market.' } },
  { term: { he: 'שווי שוק', en: 'Market cap' }, def: { he: 'מחיר המניה כפול מספר המניות: מה שהשוק חושב שהחברה כולה שווה.', en: 'Share price times number of shares: what the market thinks the whole company is worth.' } },
  { term: { he: 'דיבידנד', en: 'Dividend' }, def: { he: 'חלק מהרווחים שחברה מחלקת לבעלי המניות במזומן, בדרך כלל כל רבעון.', en: 'Part of the profits a company pays its shareholders in cash, usually quarterly.' } },
  { term: { he: 'תנודתיות', en: 'Volatility' }, def: { he: 'כמה המחיר קופץ. מניה תנודתית יכולה לזוז 5% ביום; מדד רחב בדרך כלל פחות מאחוז.', en: 'How much the price jumps. A volatile stock can move 5% a day; a broad index usually under one.' } },
  { term: { he: 'עמלה', en: 'Commission' }, def: { he: 'מה שהברוקר גובה על כל פעולה. כאן 0.1%, מינימום דולר.', en: 'What the broker charges per trade. Here 0.1%, a dollar at least.' } },
  { term: { he: 'שוק שורי / דובי', en: 'Bull / bear market' }, def: { he: 'שורי: עליות ממושכות. דובי: ירידה של 20% או יותר מהשיא.', en: 'Bull: a sustained rise. Bear: a fall of 20% or more from the peak.' } },
  { term: { he: 'טווח 52 שבועות', en: '52-week range' }, def: { he: 'המחיר הנמוך והגבוה ביותר בשנה האחרונה. אומר איפה המחיר של היום עומד ביחס לשנה.', en: 'The lowest and highest price in the past year. Shows where today\'s price sits against the year.' } },
  { term: { he: 'ריבית דריבית', en: 'Compounding' }, def: { he: 'רווח שמרוויח רווח. 7% בשנה מכפילים כסף בעשור בלי להוסיף שקל.', en: 'Gains that earn gains. 7% a year doubles money in a decade without adding a cent.' } },
  { term: { he: 'חשיפה למטבע', en: 'Currency exposure' }, def: { he: 'כשהאחזקה במטבע אחר, השער זז בנוסף למניה. דולר-שקל משנה את השווי גם כשהמניה לא זזה.', en: 'When a holding is in another currency, the rate moves as well as the stock. Dollar-shekel changes the value even when the stock does not move.' } },
];
