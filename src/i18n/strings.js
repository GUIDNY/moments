/**
 * Two languages, one flat dictionary.
 *
 * Hebrew is the default here: the work is for Israeli businesses and most
 * visitors will arrive in Hebrew. English is a toggle, and everything in the
 * town — the signs over the doors, the case studies, the zone names — comes
 * from `portfolio/projects.js` through `loc()` rather than from this file, so
 * adding a project never means adding a translation key.
 */

export const LANGUAGES = {
  he: { name: 'עברית', dir: 'rtl' },
  en: { name: 'English', dir: 'ltr' },
};

export const DEFAULT_LANG = 'he';

export const STRINGS = {
  he: {
    'app.name': 'תיק העבודות',
    'app.tagline': 'תסתובבו ותיכנסו',

    'common.exit': '← יציאה',
    'common.back': 'חזרה',
    'common.close': 'סגירה',
    'common.enter': 'כניסה',

    'hud.hint': 'הזיזו את הג׳ויסטיק כדי ללכת',
    'hud.doorHint': 'עמדו בפתח כדי להיכנס',
    'hud.guide': 'מפת האזורים',
    'hud.seen': '{n} מתוך {total}',

    'directory.title': 'מה יש בעיר',
    'directory.sub': 'הקישו על פרויקט כדי להגיע אליו',
    'directory.services': 'עליי ויצירת קשר',
    'directory.empty': 'האזור הזה עוד מחכה לפרויקט',

    'welcome.title': 'ברוכים הבאים',
    'welcome.body':
      'כל בניין בעיר הוא פרויקט אמיתי. תסתובבו עם הג׳ויסטיק, תיכנסו לדלת שמעניינת אתכם, ותקראו מה נבנה שם ומה זה עשה.',
    'welcome.cta': 'יאללה',

    'project.result': 'מה זה עשה',
    'project.problem': 'מה היה לפני',
    'project.built': 'מה נבנה',
    'project.stack': 'עם מה',
    'project.live': 'לראות את זה חי',
    'project.backToTown': 'חזרה לעיר',
    'project.visited': 'כבר ביקרתם כאן',

    'about.title': 'עליי',
    'about.zones': 'האזורים בעיר',
    'about.count': '{n} פרויקטים',

    'contact.title': 'יצירת קשר',
    'contact.heading': 'יש לכם משהו שכדאי לאטמט?',
    'contact.sub': 'ספרו לי מה גוזל לכם הכי הרבה זמן ואני אגיד לכם אם אפשר לבנות את זה.',
    'contact.greeting': 'היי, ראיתי את תיק העבודות שלך',
    'contact.whatsapp': 'וואטסאפ',
    'contact.email': 'אימייל',
    'contact.site': 'האתר',
    'contact.empty': 'פרטי הקשר עוד לא מולאו. הם נמצאים בקובץ אחד: src/portfolio/projects.js, בתוך OWNER.',
  },

  en: {
    'app.name': 'The portfolio',
    'app.tagline': 'Walk around and step in',

    'common.exit': '← Exit',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.enter': 'Enter',

    'hud.hint': 'Use the joystick to walk',
    'hud.doorHint': 'Stand in the doorway to go in',
    'hud.guide': 'Map of the zones',
    'hud.seen': '{n} of {total}',

    'directory.title': "What's in town",
    'directory.sub': 'Tap a project to walk to it',
    'directory.services': 'About & contact',
    'directory.empty': 'This zone is still waiting for a project',

    'welcome.title': 'Welcome',
    'welcome.body':
      'Every building here is a real project. Walk around with the joystick, step into whichever door interests you, and read what was built and what it changed.',
    'welcome.cta': "Let's go",

    'project.result': 'What it changed',
    'project.problem': 'What it was like before',
    'project.built': 'What was built',
    'project.stack': 'Built with',
    'project.live': 'See it live',
    'project.backToTown': 'Back to town',
    'project.visited': 'You have been here',

    'about.title': 'About',
    'about.zones': 'The zones',
    'about.count': '{n} projects',

    'contact.title': 'Get in touch',
    'contact.heading': 'Got something worth automating?',
    'contact.sub': 'Tell me what eats the most of your time and I will tell you whether it can be built.',
    'contact.greeting': 'Hi, I saw your portfolio',
    'contact.whatsapp': 'WhatsApp',
    'contact.email': 'Email',
    'contact.site': 'Website',
    'contact.empty': 'Contact details are not filled in yet. They live in one file: src/portfolio/projects.js, under OWNER.',
  },
};
