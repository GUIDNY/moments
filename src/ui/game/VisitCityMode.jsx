import { useI18n } from '../../i18n/I18nContext';

/**
 * The frame around somebody else's city. Today a shared link is the only
 * way in (`isShared` in the context); tomorrow friends and rankings open
 * the same frame with the same props. A visited city is read-only: no buy,
 * no sell, no missions, the visitor's own streak untouched.
 *
 * `source` is whatever `CityScene` should draw — the context's own numbers
 * now, a friend's snapshot later — and that is the whole seam.
 */
export default function VisitCityMode({ name, onLeave }) {
  const { t } = useI18n();
  return (
    <div className="ui-layer absolute z-30 inset-x-0 top-[calc(3.6rem+env(safe-area-inset-top,0px))] md:top-16 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink-900/90 text-white backdrop-blur-md shadow-card ps-4 pe-2 py-1.5">
        <span className="text-[12.5px] font-bold">{t('visit.banner', { name })}</span>
        {onLeave && (
          <button type="button" onClick={onLeave} className="h-8 px-3 rounded-xl bg-white/15 text-[12px] font-black">
            {t('visit.leave')}
          </button>
        )}
      </div>
    </div>
  );
}

/** A friend's city as a row — the card the Friends tab will list. */
export function CityCard({ city, onVisit }) {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl bg-white border border-paper-200 shadow-card p-3 flex items-center gap-3">
      <span className="w-11 h-11 rounded-2xl bg-brand/15 grid place-items-center text-xl">{city.avatar ?? '🏙️'}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-ink-900 truncate">{city.name}</span>
        <span className="block text-[11.5px] text-paper-muted truncate">{city.owner} · {t('profile.level', { n: city.level })}</span>
      </span>
      <button type="button" onClick={() => onVisit(city)} className="h-9 px-3 rounded-xl bg-brand text-white text-[12px] font-black">{t('visit.visit')}</button>
    </div>
  );
}
