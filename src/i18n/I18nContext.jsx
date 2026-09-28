import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANG, LANGUAGES, STRINGS } from './strings';

const KEY = 'playtown_lang';
const I18nContext = createContext(null);

function readLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && LANGUAGES[saved]) return saved;
    // a Hebrew browser gets Hebrew on the first visit
    const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    if (nav.toLowerCase().startsWith('he') || nav.toLowerCase().startsWith('iw')) return 'he';
  } catch {
    /* private mode — fall through to the default */
  }
  return DEFAULT_LANG;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', LANGUAGES[lang].dir);
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!LANGUAGES[next]) return;
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => {
    const table = STRINGS[lang] ?? STRINGS[DEFAULT_LANG];

    /** loc({ en: 'Pair Up', he: 'זוגות' }) — for content that lives beside the data */
    const loc = (entry) => {
      if (entry == null) return '';
      if (typeof entry === 'string') return entry;
      return entry[lang] ?? entry[DEFAULT_LANG] ?? '';
    };

    /**
     * t('bank.daily') · t('bank.dailyReady', { n: 120, d: 3 })
     * A parameter can itself be a { en, he } entry — handy for names that live
     * in the data files rather than in this dictionary.
     */
    const t = (key, params) => {
      let out = table[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          const value = v && typeof v === 'object' ? loc(v) : String(v);
          out = out.split(`{${k}}`).join(value);
        }
      }
      return out;
    };

    return { lang, setLang, t, loc, dir: LANGUAGES[lang].dir, languages: LANGUAGES };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
