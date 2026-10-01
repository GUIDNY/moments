/**
 * Two languages, one flat dictionary. Hebrew is the default — the markets this
 * is aimed at are Tel Aviv first — and company names come from the catalogue
 * through `loc()` rather than from here.
 */

export const LANGUAGES = {
  he: { name: 'עברית', dir: 'rtl' },
  en: { name: 'English', dir: 'ltr' },
};

export const DEFAULT_LANG = 'he';

export const STRINGS = {
  he: {
    'app.name': 'עיר המניות',
    'app.tagline': 'התיק שלכם, כעיר',

    'common.exit': '← יציאה',
    'common.back': 'חזרה',
    'common.close': 'ביטול',
    'common.enter': 'כניסה',
    'common.save': 'שמירה',

    'hud.hint': 'הזיזו את הג׳ויסטיק כדי ללכת',
    'hud.doorHint': 'עמדו בפתח כדי להיכנס',
    'hud.guide': 'התיק שלי',
    'hud.add': 'הוספת מניה',
    'hud.empty': 'העיר ריקה',

    'city.value': 'שווי התיק',
    'city.today': 'היום',
    'city.gain': 'רווח כולל',
    'city.delayed': 'המחירים מתעדכנים בהשהיה של כ-15 דקות ואינם מיועדים למסחר.',
    'city.updated': 'עודכן {time}',
    'city.offline': 'לא הצלחתי להביא מחירים כרגע.',
    'city.unconverted': '{n} אחזקות לא נכללות בסכום — אין שער המרה.',

    'directory.title': 'התיק שלי',
    'directory.sub': 'הקישו על אחזקה כדי להגיע למגדל שלה',
    'directory.empty': 'עוד לא הוספתם מניות',
    'directory.add': 'הוספת מניה',
    'directory.share': 'שיתוף התיק',
    'directory.copied': 'הקישור הועתק',
    'directory.shared': 'אתם צופים בתיק משותף. שינויים לא יישמרו.',

    'badges.title': 'הישגים',
    'badges.sub': '{n} מתוך {total}',
    'badges.locked': 'עדיין לא',
    'badges.streak': '{n} ימים ברצף',
    'badges.streakOne': 'יום ראשון בעיר',
    'badges.best': 'שיא: {n} ימים',
    'badges.bestDay': 'היום הטוב ביותר',
    'badges.worstDay': 'היום הקשה ביותר',
    'badges.peak': 'שיא שווי',
    'achv.unlocked': 'הישג חדש: {name}',

    'picker.title': 'הוספת מניה',
    'picker.search': 'חיפוש חברה או סמל…',
    'picker.searching': 'מחפש…',
    'picker.results': 'תוצאות',
    'picker.nothing': 'לא נמצא. נסו את הסמל באנגלית.',
    'picker.qty': 'כמה מניות',
    'picker.cost': 'מחיר קנייה למניה (לא חובה)',
    'picker.costHint': 'באותן יחידות שהבורסה מציגה. בתל אביב זה באגורות.',
    'picker.addIt': 'בנו את המגדל',
    'picker.note': 'הנתונים לצורך תצוגה בלבד, לא ייעוץ ולא המלצה.',

    'holding.value': 'שווי האחזקה',
    'holding.today': 'היום',
    'holding.price': 'מחיר',
    'holding.qty': 'כמות',
    'holding.cost': 'מחיר קנייה',
    'holding.gain': 'רווח/הפסד',
    'holding.inDisplay': 'בשווי ב-{c}',
    'holding.noPrice': 'אין כרגע מחיר לסמל הזה. ייתכן שהוא שגוי או שהשוק סגור.',
    'holding.edit': 'עריכת כמות ומחיר',
    'holding.sell': 'הסרה מהתיק',

    'project.backToTown': 'חזרה לעיר',

    'welcome.title': 'ברוכים הבאים לעיר שלכם',
    'welcome.body':
      'כל מניה בתיק היא מגדל. הגובה הוא השווי שלה, הגג ירוק כשהיא עולה ואדום כשהיא יורדת, והבניין מבריק כשאתם ברווח ומתעמעם כשלא. הוסיפו מניה והמגדל הראשון יעלה.',
    'welcome.cta': 'בואו נתחיל',
  },

  en: {
    'app.name': 'Stock City',
    'app.tagline': 'Your portfolio, as a city',

    'common.exit': '← Exit',
    'common.back': 'Back',
    'common.close': 'Cancel',
    'common.enter': 'Enter',
    'common.save': 'Save',

    'hud.hint': 'Use the joystick to walk',
    'hud.doorHint': 'Stand in the doorway to go in',
    'hud.guide': 'My portfolio',
    'hud.add': 'Add a stock',
    'hud.empty': 'The city is empty',

    'city.value': 'Portfolio value',
    'city.today': 'Today',
    'city.gain': 'Total gain',
    'city.delayed': 'Prices are delayed by about 15 minutes and are not for trading.',
    'city.updated': 'Updated {time}',
    'city.offline': 'Could not fetch prices just now.',
    'city.unconverted': '{n} holdings are left out of the total — no exchange rate.',

    'directory.title': 'My portfolio',
    'directory.sub': 'Tap a holding to walk to its tower',
    'directory.empty': 'No stocks added yet',
    'directory.add': 'Add a stock',
    'directory.share': 'Share this portfolio',
    'directory.copied': 'Link copied',
    'directory.shared': 'You are viewing a shared portfolio. Changes will not be saved.',

    'badges.title': 'Achievements',
    'badges.sub': '{n} of {total}',
    'badges.locked': 'Not yet',
    'badges.streak': '{n} days running',
    'badges.streakOne': 'First day in the city',
    'badges.best': 'Best: {n} days',
    'badges.bestDay': 'Best day',
    'badges.worstDay': 'Hardest day',
    'badges.peak': 'Peak value',
    'achv.unlocked': 'New badge: {name}',

    'picker.title': 'Add a stock',
    'picker.search': 'Search a company or symbol…',
    'picker.searching': 'Searching…',
    'picker.results': 'Results',
    'picker.nothing': 'Nothing found. Try the symbol instead.',
    'picker.qty': 'How many shares',
    'picker.cost': 'Price paid per share (optional)',
    'picker.costHint': 'In the units the exchange shows. Tel Aviv quotes in agorot.',
    'picker.addIt': 'Put up the tower',
    'picker.note': 'For display only — not advice and not a recommendation.',

    'holding.value': 'Position value',
    'holding.today': 'today',
    'holding.price': 'Price',
    'holding.qty': 'Shares',
    'holding.cost': 'Paid',
    'holding.gain': 'Gain / loss',
    'holding.inDisplay': 'Worth in {c}',
    'holding.noPrice': 'No price for that symbol right now. It may be wrong, or the market may be closed.',
    'holding.edit': 'Edit shares and price',
    'holding.sell': 'Remove from portfolio',

    'project.backToTown': 'Back to the city',

    'welcome.title': 'Welcome to your city',
    'welcome.body':
      'Every stock you hold is a tower. Its height is what the position is worth, its roof is green when the stock is up and red when it is down, and the building gleams when you are in profit and dims when you are not. Add a stock and the first tower goes up.',
    'welcome.cta': "Let's go",
  },
};
