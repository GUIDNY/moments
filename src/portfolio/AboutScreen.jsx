import { useI18n } from '../i18n/I18nContext';
import { OWNER, ZONES, projectsIn } from './projects';

/** Who built all this, and what each part of town is for. */
export default function AboutScreen({ onExit }) {
  const { t, loc } = useI18n();

  return (
    <div className="fixed inset-0 bg-paper overflow-y-auto">
      <header className="sticky top-0 z-10 bg-paper/90 backdrop-blur-md border-b border-paper-200">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-3.5 rounded-xl bg-paper-50 border border-paper-200 text-[13px] font-bold
              text-ink-900 active:scale-95 transition-transform"
          >
            {t('common.back')}
          </button>
          <span className="flex-1 text-[13px] font-black text-ink-900 text-center">
            {t('about.title')}
          </span>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-7">
        <div>
          <h1 className="text-[26px] font-black text-ink-900 leading-tight">{loc(OWNER.name)}</h1>
          <p className="text-[14px] text-paper-muted mt-1">{loc(OWNER.role)}</p>
          <p className="text-[14.5px] text-ink-900/85 leading-relaxed mt-4">{loc(OWNER.intro)}</p>
        </div>

        <section>
          <h2 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-2.5">
            {t('about.zones')}
          </h2>
          <ul className="space-y-2.5">
            {ZONES.filter((z) => projectsIn(z.id).length > 0).map((zone) => (
              <li key={zone.id} className="flex gap-3 rounded-2xl bg-paper-50 border border-paper-200 p-3">
                <span
                  className="w-10 h-10 shrink-0 rounded-xl grid place-items-center text-xl"
                  style={{ background: `${zone.color}22` }}
                >
                  {zone.emoji}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-black text-ink-900">{loc(zone.name)}</h3>
                  <p className="text-[12.5px] text-paper-muted leading-snug mt-0.5">
                    {loc(zone.blurb)}
                  </p>
                  <p className="text-[11.5px] font-bold text-paper-muted mt-1">
                    {t('about.count', { n: projectsIn(zone.id).length })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={onExit}
          className="w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px] active:scale-[0.99] transition-transform"
        >
          {t('project.backToTown')}
        </button>
      </div>
    </div>
  );
}
