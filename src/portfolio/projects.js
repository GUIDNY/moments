/**
 * THE ONE FILE TO EDIT.
 *
 * Everything else is machinery. The town's districts, the buildings in them,
 * the signs over the doors, the directory, the case studies and the counter in
 * the header are all read from here — so adding a project means adding an entry
 * to a list, never touching the map.
 *
 * ► The projects below are PLACEHOLDERS, written to show the shape. Replace
 *   them with real work. Anything you leave out simply does not render.
 *
 * Every zone has room for four projects. A fifth is ignored rather than drawn
 * somewhere silly; add a zone instead.
 */

/* ── the districts of the town ────────────────────────────────────────────── */

export const ZONES = [
  {
    id: 'automation',
    emoji: '⚙️',
    color: '#44e092',
    name: { he: 'אוטומציות', en: 'Automation' },
    blurb: {
      he: 'תהליכים שרצים לבד. מה שהיה עבודה ידנית של שעות קורה עכשיו בלי שאף אחד נוגע.',
      en: 'Processes that run themselves. Hours of manual work that now happen with nobody touching them.',
    },
  },
  {
    id: 'web',
    emoji: '🌐',
    color: '#7db7ff',
    name: { he: 'בניית אתרים', en: 'Websites' },
    blurb: {
      he: 'אתרים ודפי נחיתה שנבנים מהר, נטענים מהר, ומביאים פניות.',
      en: 'Sites and landing pages that go up fast, load fast, and bring enquiries.',
    },
  },
  {
    id: 'bots',
    emoji: '💬',
    color: '#25d366',
    name: { he: 'בוטים לוואטסאפ', en: 'WhatsApp bots' },
    blurb: {
      he: 'בוטים שעונים ללקוחות, קובעים תורים וסוגרים עסקאות — בלי להעסיק אף אחד במשמרת לילה.',
      en: 'Bots that answer customers, book appointments and close deals — with nobody on a night shift.',
    },
  },
  {
    id: 'apps',
    emoji: '📱',
    color: '#ffb4aa',
    name: { he: 'אפליקציות', en: 'Apps' },
    blurb: {
      he: 'אפליקציות לנייד ולדפדפן, מהרעיון ועד החנות.',
      en: 'Mobile and browser apps, from the idea to the store.',
    },
  },
  {
    id: 'business',
    emoji: '📊',
    color: '#f5c542',
    name: { he: 'ניהול עסק', en: 'Business systems' },
    blurb: {
      he: 'מערכות שמראות לבעל העסק מה באמת קורה אצלו — לקוחות, כסף, מלאי, במקום אחד.',
      en: 'Systems that show an owner what is actually going on — customers, money, stock, in one place.',
    },
  },
  {
    id: 'studio',
    emoji: '👋',
    color: '#c1c1ff',
    name: { he: 'עליי ויצירת קשר', en: 'About & contact' },
    blurb: {
      he: 'מי אני, איך אני עובד, ואיך מדברים איתי.',
      en: 'Who I am, how I work, and how to reach me.',
    },
  },
];

/* ── who this is ──────────────────────────────────────────────────────────── */

export const OWNER = {
  name: { he: 'גיא', en: 'Guy' },          // ← your name
  role: {
    he: 'בונה אוטומציות, אתרים ומערכות לעסקים',
    en: 'I build automations, sites and systems for businesses',
  },
  intro: {
    he: 'אני בונה דברים שעובדים לבד. רוב מה שיש כאן התחיל מבעל עסק שאמר לי "אני מבזבז על זה שלוש שעות ביום" — ונגמר בזה שזה קורה בלי שהוא נוגע.',
    en: 'I build things that run by themselves. Most of what is here started with an owner telling me "this eats three hours of my day" — and ended with it happening untouched.',
  },
  // ← your real details. Anything left empty is simply not shown.
  whatsapp: '',       // e.g. '0501234567'
  email: '',          // e.g. 'you@example.com'
  site: '',           // e.g. 'https://example.com'
  linkedin: '',
};

/* ── the work ─────────────────────────────────────────────────────────────── */

/**
 * A project needs `id`, `zone`, `emoji` and `name`. Everything else is
 * optional: leave a field out and its section disappears from the case study.
 *
 * `result` is the part visitors read first, so make it a number if you can.
 */
export const PROJECTS = [
  /* ── אוטומציות ─────────────────────────────────────────────────────────── */
  {
    id: 'auto-leads', zone: 'automation', emoji: '🎯',
    name: { he: 'ניתוב לידים אוטומטי', en: 'Automatic lead routing' },
    client: { he: 'סוכנות נדל״ן', en: 'An estate agency' },
    problem: {
      he: 'לידים הגיעו מפייסבוק, מהאתר ומוואטסאפ לשלושה מקומות שונים. חצי מהם נענו אחרי יומיים, ורבע לא נענו בכלל.',
      en: 'Leads arrived from Facebook, the site and WhatsApp into three different places. Half were answered after two days and a quarter never at all.',
    },
    built: {
      he: 'צינור אחד שאוסף מכל המקורות, מזהה כפילויות, מנקד לפי תקציב ואזור, ושולח לסוכן הנכון תוך דקה — עם תזכורת אם לא נגע בליד תוך שעה.',
      en: 'One pipeline that collects every source, spots duplicates, scores by budget and area, and routes to the right agent within a minute — with a nudge if the lead is untouched after an hour.',
    },
    stack: ['Make', 'Google Sheets', 'WhatsApp API', 'Webhooks'],
    result: { he: 'זמן תגובה ממוצע: מיומיים ל-4 דקות', en: 'Average response: two days to four minutes' },
  },
  {
    id: 'auto-invoice', zone: 'automation', emoji: '🧾',
    name: { he: 'חשבוניות וגבייה', en: 'Invoicing and collection' },
    client: { he: 'סטודיו עיצוב', en: 'A design studio' },
    problem: {
      he: 'הוצאת חשבוניות ורדיפה אחרי תשלומים לקחה יום עבודה שלם בכל סוף חודש.',
      en: 'Issuing invoices and chasing payments took a full day at the end of every month.',
    },
    built: {
      he: 'המערכת מוציאה חשבונית מהשעות שנרשמו, שולחת אותה, ואם לא שולמה — שולחת תזכורת מנומסת בימים 7, 14 ו-30 ומסמנת בלוח מי באיחור.',
      en: 'It issues the invoice from the logged hours, sends it, and if it goes unpaid nudges politely on days 7, 14 and 30 while flagging who is late on a board.',
    },
    stack: ['n8n', 'Green Invoice API', 'Slack'],
    result: { he: 'יום עבודה בחודש חזר. איחורי תשלום ירדו ב-60%', en: 'A day a month back. Late payments down 60%' },
  },
  {
    id: 'auto-reports', zone: 'automation', emoji: '📨',
    name: { he: 'דוח בוקר אוטומטי', en: 'The morning report' },
    client: { he: 'רשת חנויות', en: 'A retail chain' },
    problem: {
      he: 'המנכ״ל ביקש מספרים כל בוקר ומישהו הרכיב אותם ידנית מארבע מערכות.',
      en: 'The owner wanted numbers every morning and somebody assembled them by hand from four systems.',
    },
    built: {
      he: 'הודעת וואטסאפ אחת ב-7:00 עם מכירות אתמול, השוואה לשבוע שעבר, מלאי שנגמר ושלושת המוצרים החמים.',
      en: 'One WhatsApp message at 07:00 with yesterday’s sales, last week’s comparison, what has run out and the three best sellers.',
    },
    stack: ['Python', 'Cron', 'WhatsApp API'],
    result: { he: 'שעתיים ביום של מישהו', en: "Two hours of somebody's day" },
  },

  /* ── בניית אתרים ───────────────────────────────────────────────────────── */
  {
    id: 'web-clinic', zone: 'web', emoji: '🏥',
    name: { he: 'אתר לקליניקה', en: 'A clinic site' },
    client: { he: 'קליניקת שיניים', en: 'A dental clinic' },
    problem: {
      he: 'האתר הישן נטען 9 שניות בנייד, ורוב הגולשים עזבו לפני שראו אותו.',
      en: 'The old site took nine seconds to load on a phone, and most visitors left before seeing it.',
    },
    built: {
      he: 'אתר חדש שנטען בפחות משנייה, עם קביעת תור שמתחברת ליומן של הקליניקה ישירות.',
      en: 'A new site under a second, with booking wired straight into the clinic’s own calendar.',
    },
    stack: ['React', 'Vite', 'Tailwind', 'Vercel'],
    result: { he: 'פניות מהאתר: פי 3', en: 'Enquiries from the site: three times as many' },
  },
  {
    id: 'web-landing', zone: 'web', emoji: '🚀',
    name: { he: 'דף נחיתה לקמפיין', en: 'A campaign landing page' },
    client: { he: 'סטארטאפ', en: 'A startup' },
    problem: { he: 'קמפיין נפתח בעוד ארבעה ימים ולא היה לאן לשלוח אנשים.', en: 'A campaign opened in four days with nowhere to send people.' },
    built: {
      he: 'דף נחיתה, טופס, חיבור לפיקסל ולדשבורד — עלה לאוויר ביומיים.',
      en: 'Landing page, form, pixel and dashboard — live in two days.',
    },
    stack: ['Astro', 'Tailwind', 'Supabase'],
    result: { he: '23% המרה', en: '23% conversion' },
  },
  {
    id: 'web-shop', zone: 'web', emoji: '🛒',
    name: { he: 'חנות אונליין', en: 'An online shop' },
    client: { he: 'מאפייה שכונתית', en: 'A neighbourhood bakery' },
    problem: { he: 'הזמנות התקבלו בוואטסאפ ונרשמו על פתקים.', en: 'Orders came in on WhatsApp and were written on paper.' },
    built: {
      he: 'חנות עם הזמנה מראש לפי יום ושעת איסוף, תשלום, והדפסה אוטומטית במטבח.',
      en: 'A shop with pre-ordering by collection day and time, payment, and an automatic print in the kitchen.',
    },
    stack: ['Next.js', 'Stripe', 'Postgres'],
    result: { he: '40% מההזמנות עברו לאונליין תוך חודש', en: '40% of orders moved online within a month' },
  },

  /* ── בוטים לוואטסאפ ────────────────────────────────────────────────────── */
  {
    id: 'bot-booking', zone: 'bots', emoji: '📅',
    name: { he: 'בוט קביעת תורים', en: 'The booking bot' },
    client: { he: 'מספרה', en: 'A hair salon' },
    problem: { he: 'הטלפון צלצל באמצע תספורות, ותורים נקבעו על דף.', en: 'The phone rang mid-haircut and appointments were booked on paper.' },
    built: {
      he: 'בוט שמראה שעות פנויות, קובע, שולח תזכורת יום לפני, ומאפשר לבטל — הכל בוואטסאפ, בעברית.',
      en: 'A bot that shows free slots, books, reminds the day before and lets people cancel — all on WhatsApp, in Hebrew.',
    },
    stack: ['WhatsApp Cloud API', 'Node', 'Google Calendar'],
    result: { he: 'ביטולים ברגע האחרון ירדו ב-70%', en: 'Last-minute no-shows down 70%' },
  },
  {
    id: 'bot-support', zone: 'bots', emoji: '🤖',
    name: { he: 'בוט מענה ראשוני', en: 'First-line support bot' },
    client: { he: 'חברת שירות', en: 'A service company' },
    problem: { he: '80% מהפניות היו אותן חמש שאלות.', en: 'Eight in ten enquiries were the same five questions.' },
    built: {
      he: 'בוט שעונה על השאלות הנפוצות מתוך מסמכי החברה, ומעביר לנציג אנושי ברגע שהוא לא בטוח — עם כל השיחה מצורפת.',
      en: 'A bot that answers the common questions from the company’s own documents and hands over to a person the moment it is unsure — with the whole conversation attached.',
    },
    stack: ['WhatsApp API', 'RAG', 'Vector DB'],
    result: { he: '80% נסגר בלי נציג', en: 'Eight in ten resolved without a person' },
  },

  /* ── אפליקציות ─────────────────────────────────────────────────────────── */
  {
    id: 'app-field', zone: 'apps', emoji: '🔧',
    name: { he: 'אפליקציה לטכנאי שטח', en: 'An app for field engineers' },
    client: { he: 'חברת מיזוג', en: 'An HVAC company' },
    problem: { he: 'טכנאים מילאו דוחות על נייר והקלידו אותם בערב.', en: 'Engineers filled in paper reports and typed them up at night.' },
    built: {
      he: 'אפליקציה שעובדת גם בלי רשת, מצלמת, מחתימה את הלקוח על המסך ומסנכרנת כשחוזר קליטה.',
      en: 'An app that works with no signal, takes photos, collects the customer’s signature on screen and syncs when coverage returns.',
    },
    stack: ['React Native', 'SQLite', 'Offline sync'],
    result: { he: 'שעה ביום לכל טכנאי', en: 'An hour a day per engineer' },
  },
  {
    id: 'app-3d', zone: 'apps', emoji: '🏠',
    name: { he: 'סיור תלת־ממד לנכסים', en: '3D property tours' },
    client: { he: 'מתווכים', en: 'Estate agents' },
    problem: { he: 'תמונות לא מעבירות איך הדירה מרגישה, וסריקה תלת־ממדית עולה יותר מדי.', en: 'Photographs do not convey how a flat feels, and a 3D scan costs too much.' },
    built: {
      he: 'מתווך מעלה תמונות, המערכת קוראת מהן את הצבעים, הרצפות והחלונות ובונה דירה שאפשר להסתובב בה — וקישור אחד נשלח ללקוח.',
      en: 'An agent uploads photographs, the system reads their colours, floors and windows and builds a flat you can walk through — and one link goes to the client.',
    },
    stack: ['three.js', 'Canvas analysis', 'Supabase'],
    result: { he: 'סיור מוכן בדקה, בלי ציוד', en: 'A tour ready in a minute, with no equipment' },
    live: '/tour',
  },

  /* ── ניהול עסק ─────────────────────────────────────────────────────────── */
  {
    id: 'biz-dashboard', zone: 'business', emoji: '📈',
    name: { he: 'דשבורד לבעל עסק', en: "The owner's dashboard" },
    client: { he: 'רשת מסעדות', en: 'A restaurant group' },
    problem: { he: 'המספרים ישבו בקופה, ברואה חשבון ובאקסל, ואף פעם לא באותו מקום.', en: 'The numbers lived in the till, at the accountant and in a spreadsheet, never in the same place.' },
    built: {
      he: 'מסך אחד: מכירות לפי סניף, עלות מול הכנסה, שעות עובדים ומלאי — מתעדכן לבד.',
      en: 'One screen: sales by branch, cost against revenue, staff hours and stock — updating itself.',
    },
    stack: ['React', 'Postgres', 'Metabase'],
    result: { he: 'סניף מפסיד מזוהה תוך ימים במקום תוך רבעון', en: 'A losing branch spotted in days rather than a quarter' },
  },
  {
    id: 'biz-crm', zone: 'business', emoji: '🗂️',
    name: { he: 'CRM מותאם', en: 'A CRM that fits' },
    client: { he: 'משרד עורכי דין', en: 'A law firm' },
    problem: { he: 'מערכות מדף לא התאימו לאיך שהמשרד באמת עובד, אז אף אחד לא השתמש בהן.', en: 'Off-the-shelf systems did not match how the firm works, so nobody used them.' },
    built: {
      he: 'מערכת שבנויה סביב התיק ולא סביב הליד: מסמכים, שעות, מועדים ותזכורות בית משפט.',
      en: 'A system built around the case rather than the lead: documents, hours, deadlines and court reminders.',
    },
    stack: ['Laravel', 'MySQL', 'Filament'],
    result: { he: 'אומץ על ידי כל המשרד תוך שבועיים', en: 'Adopted by the whole firm in a fortnight' },
  },
];

/* ── helpers ──────────────────────────────────────────────────────────────── */

export const PROJECTS_BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export const projectsIn = (zoneId) => PROJECTS.filter((p) => p.zone === zoneId);
export const TOTAL_PROJECTS = PROJECTS.length;
