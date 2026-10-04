import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Coins, Landmark, Upload } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Four screens before the first city, one idea each: a portfolio can be
 * a city; a stock is a building; the bigger the position the bigger the
 * building; connect a portfolio or try a demo. The last screen's button is
 * the only call to action in the product's first minute.
 */
const SCREENS = [
  { Icon: Building2, title: 'onboard.1', body: 'onboard.1b', tint: '#7db7ff' },
  { Icon: Landmark, title: 'onboard.2', body: 'onboard.2b', tint: '#f78fb3' },
  { Icon: Coins, title: 'onboard.3', body: 'onboard.3b', tint: '#f5c542' },
  { Icon: Upload, title: 'onboard.4', body: 'onboard.4b', tint: '#44e092' },
];

export default function Onboarding({ onDone }) {
  const { t } = useI18n();
  const [at, setAt] = useState(0);
  const last = at === SCREENS.length - 1;
  const s = SCREENS[at];
  return (
    <div className="ui-layer fixed inset-0 z-[60] bg-paper-50 flex flex-col" role="dialog" aria-modal="true" aria-label={t(s.title)}>
      <div className="flex justify-end px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        {!last && (
          <button type="button" onClick={() => onDone(false)} className="h-9 px-3 rounded-xl text-[12.5px] font-bold text-paper-muted">
            {t('onboard.skip')}
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={at}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="max-w-sm text-center"
          >
            <span className="mx-auto w-24 h-24 rounded-[28px] grid place-items-center shadow-card" style={{ background: `${s.tint}33`, color: s.tint }}>
              <s.Icon size={44} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-[24px] font-black text-ink-900 leading-tight">{t(s.title)}</h1>
            <p className="mt-3 text-[15px] text-ink-900/70 leading-relaxed">{t(s.body)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-center gap-1.5 mb-5" aria-hidden="true">
          {SCREENS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === at ? 'w-6 bg-brand' : 'w-1.5 bg-paper-300'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (last ? onDone(true) : setAt(at + 1))}
          className="w-full h-13 min-h-[52px] rounded-2xl bg-brand text-white font-black text-[16px] shadow-fab active:scale-[0.99] transition-transform"
        >
          {last ? t('onboard.cta') : t('onboard.next')}
        </button>
      </div>
    </div>
  );
}
