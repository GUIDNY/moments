import { useI18n } from '../../i18n/I18nContext';

/** The tabs that are not built yet say so, in one card, in the city's voice. */
export default function SoonScreen({ icon: Icon, textKey }) {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 bg-paper-50 flex items-center justify-center px-6 pb-16">
      <div className="max-w-sm rounded-3xl bg-white border border-paper-200 shadow-card p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand/12 text-brand-deep grid place-items-center"><Icon size={32} strokeWidth={2.2} aria-hidden="true" /></div>
        <h2 className="text-[16px] font-black text-ink-900 mt-2">{t('soon.title')}</h2>
        <p className="text-[13px] text-paper-muted mt-1 leading-relaxed">{t(textKey)}</p>
      </div>
    </div>
  );
}
