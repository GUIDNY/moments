import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { insightsFor } from '../../stocks/insights';

const KEY = 'stockcity.insights';
const today = () => new Date().toISOString().slice(0, 10);

/**
 * One small card over the city with something the city noticed — a sector
 * that is most of it, one company carrying everything, cash sitting out.
 * It teaches a concept and points at its lesson; it never says buy or sell.
 * Dismissed, it stays away for the day.
 */
export default function InsightCard({ onLesson, onLearn }) {
  const { t, loc } = useI18n();
  const { positions, summary, cash, holdings, isShared } = useCity();
  const [hidden, setHidden] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(hidden));
    } catch {
      /* private mode */
    }
  }, [hidden]);
  if (isShared) return null;
  const card = insightsFor({ positions, summary, cash, holdings }).find((i) => hidden[i.id] !== today());
  if (!card) return null;
  const text =
    card.kind === 'sector' ? t('insight.sector', { sector: loc(card.sector?.name), pct: card.pct })
    : card.kind === 'single' ? t('insight.single')
    : t('insight.cash', { pct: card.pct });
  const dismiss = () => setHidden((h) => ({ ...h, [card.id]: today() }));
  const go = () => {
    dismiss();
    if (card.lesson) onLesson?.(card.lesson);
    else onLearn?.();
  };
  return (
    <motion.div
      key={card.id}
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className="ui-layer absolute z-30 start-3 end-[4.25rem] md:end-auto md:w-[360px] bottom-[calc(7.75rem+env(safe-area-inset-bottom,0px))] md:bottom-[9rem]"
    >
      <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card p-3 flex items-start gap-2.5 text-ink-900">
        <span className="w-8 h-8 shrink-0 rounded-xl bg-[#f5c542]/25 text-[#b8860b] grid place-items-center"><Lightbulb size={17} strokeWidth={2.4} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold leading-snug">{text}</p>
          <button type="button" onClick={go} className="mt-1.5 text-[12px] font-black text-brand-deep">{t('insight.learn')}</button>
        </div>
        <button type="button" onClick={dismiss} aria-label={t('panel.close')} className="w-7 h-7 shrink-0 rounded-lg text-ink-900/60 grid place-items-center"><X size={15} aria-hidden="true" /></button>
      </div>
    </motion.div>
  );
}
