import { useI18n } from '../../i18n/I18nContext';

/**
 * Whose city this is, and its level. Top start corner, one line. The name is
 * the user's when they have given one, "My City" until then — and somebody
 * else's when visiting.
 */
export default function CityProfile({ name, level, avatar = '🏙️', onTap }) {
  const { t } = useI18n();
  const title = name ? t('profile.city', { name }) : t('profile.myCity');
  return (
    <button
      type="button"
      onClick={onTap}
      className="ui-layer absolute z-30 start-3 top-[calc(0.5rem+env(safe-area-inset-top,0px))] md:start-4 md:top-3 flex items-center gap-2 h-10 ps-1.5 pe-3 rounded-2xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card text-start active:scale-[0.98] transition-transform"
    >
      <span className="w-7 h-7 rounded-xl bg-brand/15 grid place-items-center text-base leading-none">{avatar}</span>
      <span className="min-w-0">
        <span className="block text-[12px] font-black text-ink-900 leading-tight truncate max-w-[9rem]">{title}</span>
        <span className="block text-[10px] font-bold text-paper-muted leading-tight">{t('profile.level', { n: level })}</span>
      </span>
    </button>
  );
}
