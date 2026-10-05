/**
 * The Tel Aviv names a broker's export is written in.
 *
 * Yahoo's search knows nothing in Hebrew and nothing of TASE security
 * numbers (tested: "בנק הפועלים", "טבע", "662577" all come back empty), so
 * a Meitav file — Hebrew names, a number per security — can only be
 * resolved against a list we carry. This is that list: the TA-125 and the
 * names Israeli portfolios actually hold, each with the Yahoo symbol, the
 * Hebrew name(s) the brokers print, and the TASE security number where it
 * is known. Every symbol here has been checked against the quote proxy
 * (SPNS, MGIC, DELT and TA125 are not on Yahoo and were dropped);
 * a number is a *second* key, used when the name does not match, and the
 * preview always shows the resolved company beside the file's own name so
 * a wrong match is seen, not trusted.
 *
 * Not in the city's board (`catalog.js`): the board is what you tap to buy;
 * this is what you already own. A symbol found here and not there gets its
 * sector from here and no logo domain.
 */
export const TASE = [
  // ── banks & finance ──────────────────────────────────────────────────────
  { symbol: 'POLI.TA', id: '662577', he: ['בנק הפועלים', 'פועלים'], en: 'Bank Hapoalim', sector: 'banks' },
  { symbol: 'LUMI.TA', id: '604611', he: ['בנק לאומי', 'לאומי'], en: 'Bank Leumi', sector: 'banks' },
  { symbol: 'DSCT.TA', id: '691212', he: ['בנק דיסקונט', 'דיסקונט'], en: 'Israel Discount Bank', sector: 'banks' },
  { symbol: 'MZTF.TA', id: '695437', he: ['מזרחי טפחות', 'מזרחי'], en: 'Mizrahi Tefahot', sector: 'banks' },
  { symbol: 'FIBI.TA', id: '593038', he: ['הבינלאומי', 'בינלאומי', 'הבנק הבינלאומי'], en: 'First International Bank', sector: 'banks' },
  { symbol: 'HARL.TA', id: '585018', he: ['הראל השקעות', 'הראל'], en: 'Harel Insurance', sector: 'banks' },
  { symbol: 'PHOE.TA', id: '767012', he: ['הפניקס', 'פניקס'], en: 'Phoenix Holdings', sector: 'banks' },
  { symbol: 'MMHD.TA', id: '566018', he: ['מנורה מבטחים', 'מנורה'], en: 'Menora Mivtachim', sector: 'banks' },
  { symbol: 'CLIS.TA', id: '224014', he: ['כלל ביטוח', 'כלל עסקי ביטוח'], en: 'Clal Insurance', sector: 'banks' },
  { symbol: 'MGDL.TA', id: '1081165', he: ['מגדל ביטוח', 'מגדל'], en: 'Migdal Insurance', sector: 'banks' },
  { symbol: 'ISCD.TA', id: '1157403', he: ['ישראכרט'], en: 'Isracard', sector: 'banks' },
  { symbol: 'MTAV.TA', he: ['מיטב', 'מיטב בית השקעות'], en: 'Meitav Investment House', sector: 'banks' },
  { symbol: 'IBI.TA', he: ['איביאי', 'אי.בי.אי', 'IBI בית השקעות'], en: 'IBI Investment House', sector: 'banks' },
  // ── tech ─────────────────────────────────────────────────────────────────
  { symbol: 'NICE.TA', id: '273011', he: ['נייס'], en: 'NICE', sector: 'tech' },
  { symbol: 'TSEM.TA', id: '1082379', he: ['טאואר', 'טאואר סמיקונדקטור'], en: 'Tower Semiconductor', sector: 'tech' },
  { symbol: 'NVMI.TA', id: '1084557', he: ['נובה'], en: 'Nova', sector: 'tech' },
  { symbol: 'CAMT.TA', id: '1095264', he: ['קמטק'], en: 'Camtek', sector: 'tech' },
  { symbol: 'FORTY.TA', id: '256016', he: ['פורמולה', 'פורמולה מערכות'], en: 'Formula Systems', sector: 'tech' },
  { symbol: 'MTRX.TA', id: '445015', he: ['מטריקס'], en: 'Matrix IT', sector: 'tech' },
  { symbol: 'ONE.TA', id: '161018', he: ['וואן', 'וואן טכנולוגיות', 'וואן תוכנה'], en: 'One Software Technologies', sector: 'tech' },
  { symbol: 'HLAN.TA', id: '1084698', he: ['הילן'], en: 'Hilan', sector: 'tech' },
  { symbol: 'NXSN.TA', he: ['נקסט ויז׳ן', "נקסט ויז'ן", 'נקסט וויז׳ן'], en: 'Next Vision', sector: 'tech' },
  { symbol: 'ELTR.TA', id: '739037', he: ['אלקטרה'], en: 'Electra', sector: 'industry' },
  { symbol: 'ELCO.TA', id: '694034', he: ['אלקו'], en: 'Elco', sector: 'industry' },
  // ── defence & industry ───────────────────────────────────────────────────
  { symbol: 'ESLT.TA', id: '1081124', he: ['אלביט מערכות', 'אלביט'], en: 'Elbit Systems', sector: 'industry' },
  { symbol: 'ASHG.TA', id: '1132315', he: ['אשטרום קבוצה', 'אשטרום'], en: 'Ashtrom Group', sector: 'industry' },
  { symbol: 'SKBN.TA', id: '1081942', he: ['שיכון ובינוי'], en: 'Shikun & Binui', sector: 'industry' },
  // ── health ───────────────────────────────────────────────────────────────
  { symbol: 'TEVA.TA', id: '629014', he: ['טבע', 'טבע תעשיות'], en: 'Teva', sector: 'health' },
  { symbol: 'INCR.TA', id: '1106376', he: ['אינטרקיור'], en: 'InterCure', sector: 'health' },
  { symbol: 'KMDA.TA', id: '1094119', he: ['קמהדע'], en: 'Kamada', sector: 'health' },
  // ── energy & utilities ───────────────────────────────────────────────────
  { symbol: 'ICL.TA', id: '281014', he: ['כיל', 'כימיקלים לישראל'], en: 'ICL Group', sector: 'energy' },
  { symbol: 'DLEKG.TA', id: '1084128', he: ['דלק קבוצה', 'קבוצת דלק'], en: 'Delek Group', sector: 'energy' },
  { symbol: 'PAZ.TA', id: '1100007', he: ['פז', 'פז נפט', 'פז אנרגיה'], en: 'Paz', sector: 'energy' },
  { symbol: 'NWMD.TA', id: '475020', he: ['ניומד אנרג׳י', "ניומד אנרג'י", 'ניו-מד', 'ניומד'], en: 'NewMed Energy', sector: 'energy' },
  { symbol: 'ENOG.TA', he: ['אנרג׳יאן', "אנרג'יאן", 'אנרגיאן'], en: 'Energean', sector: 'energy' },
  { symbol: 'ORA.TA', he: ['אורמת', 'אורמת טכנולוגיות'], en: 'Ormat', sector: 'energy' },
  { symbol: 'ENLT.TA', id: '720011', he: ['אנלייט', 'אנלייט אנרגיה'], en: 'Enlight Renewable Energy', sector: 'energy' },
  { symbol: 'ENRG.TA', id: '1123355', he: ['אנרג׳יקס', "אנרג'יקס", 'אנרגיקס'], en: 'Energix', sector: 'energy' },
  { symbol: 'DORL.TA', he: ['דוראל', 'דוראל אנרגיה'], en: 'Doral Energy', sector: 'energy' },
  { symbol: 'OPCE.TA', id: '1141571', he: ['או.פי.סי אנרגיה', 'או פי סי', 'OPC'], en: 'OPC Energy', sector: 'energy' },
  { symbol: 'DRAL.TA', id: '1093202', he: ['דור אלון', 'דור אלון אנרגיה'], en: 'Dor Alon', sector: 'energy' },
  { symbol: 'NOFR.TA', he: ['נופר אנרג׳י', "נופר אנרג'י", 'נופר'], en: 'Nofar Energy', sector: 'energy' },
  // ── consumer ─────────────────────────────────────────────────────────────
  { symbol: 'SAE.TA', id: '777037', he: ['שופרסל'], en: 'Shufersal', sector: 'consumer' },
  { symbol: 'STRS.TA', id: '746016', he: ['שטראוס', 'שטראוס גרופ'], en: 'Strauss Group', sector: 'consumer' },
  { symbol: 'FOX.TA', id: '1087022', he: ['פוקס', 'פוקס ויזל'], en: 'Fox-Wizel', sector: 'consumer' },
  { symbol: 'RMLI.TA', id: '1104249', he: ['רמי לוי', 'רמי לוי שיווק השקמה'], en: 'Rami Levy', sector: 'consumer' },
  { symbol: 'VCTR.TA', he: ['ויקטורי', 'ויקטורי רשת סופרמרקטים'], en: 'Victory Supermarkets', sector: 'consumer' },
  { symbol: 'ELAL.TA', id: '1087824', he: ['אל על'], en: 'El Al', sector: 'consumer' },
  // ── real estate ──────────────────────────────────────────────────────────
  { symbol: 'AZRG.TA', id: '1119478', he: ['עזריאלי', 'עזריאלי קבוצה', 'קבוצת עזריאלי'], en: 'Azrieli Group', sector: 'realestate' },
  { symbol: 'MLSR.TA', id: '323014', he: ['מליסרון'], en: 'Melisron', sector: 'realestate' },
  { symbol: 'AMOT.TA', id: '1097278', he: ['אמות', 'אמות השקעות'], en: 'Amot Investments', sector: 'realestate' },
  { symbol: 'GVYM.TA', id: '759019', he: ['גב ים', 'גב-ים'], en: 'Gav-Yam', sector: 'realestate' },
  { symbol: 'BIG.TA', id: '1097260', he: ['ביג', 'ביג מרכזי קניות'], en: 'BIG Shopping Centers', sector: 'realestate' },
  { symbol: 'ALHE.TA', id: '390013', he: ['אלוני חץ'], en: 'Alony Hetz', sector: 'realestate' },
  { symbol: 'MVNE.TA', id: '226019', he: ['מבנה', 'מבנה נדל״ן', 'מבנה נדל"ן'], en: 'Mivne Real Estate', sector: 'realestate' },
  { symbol: 'DIMRI.TA', id: '1090315', he: ['דמרי', 'י.ח. דמרי'], en: 'Y.H. Dimri', sector: 'realestate' },
  { symbol: 'AFPR.TA', he: ['אפי נכסים', 'אפריקה ישראל נכסים'], en: 'AFI Properties', sector: 'realestate' },
  { symbol: 'ISRS.TA', id: '613034', he: ['ישרס'], en: 'Isras', sector: 'realestate' },
  { symbol: 'RIT1.TA', id: '1098920', he: ['ריט 1', 'ריט1'], en: 'Reit 1', sector: 'realestate' },
  { symbol: 'SLARL.TA', he: ['סלע נדל״ן', 'סלע נדל"ן', 'סלע קפיטל'], en: 'Sella Capital Real Estate', sector: 'realestate' },
  // ── communication ────────────────────────────────────────────────────────
  { symbol: 'BEZQ.TA', id: '230011', he: ['בזק'], en: 'Bezeq', sector: 'comm' },
  { symbol: 'PTNR.TA', id: '1083484', he: ['פרטנר', 'פרטנר תקשורת'], en: 'Partner', sector: 'comm' },
  { symbol: 'CEL.TA', id: '1101534', he: ['סלקום'], en: 'Cellcom', sector: 'comm' },
  // ── indices ──────────────────────────────────────────────────────────────
  { symbol: 'TA35.TA', he: ['ת״א 35', 'ת"א 35', 'תא 35', 'מדד ת"א 35', 'מדד ת״א 35'], en: 'TA-35 index', sector: 'other' },
];

export const TASE_BY_SYMBOL = Object.fromEntries(TASE.map((x) => [x.symbol, x]));
export const TASE_BY_ID = Object.fromEntries(TASE.filter((x) => x.id).map((x) => [x.id, x]));
