import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { ZONE_BY_ID } from './projects';
import { useVisit } from './VisitContext';

/**
 * What you get when you walk into a door.
 *
 * A case study read on a phone, in the order someone actually wants it: what
 * was wrong, what got built, what it was built with, and what changed. Every
 * section disappears if the project does not have it, so a half-filled entry
 * reads as a short case study rather than a broken one.
 */

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section>
      <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1.5">
        {title}
      </h3>
      <div className="text-[14px] text-ink-900/85 leading-relaxed">{children}</div>
    </section>
  );
}

export default function ProjectScreen({ project, onExit }) {
  const { t, loc } = useI18n();
  const { markVisited } = useVisit();
  const zone = ZONE_BY_ID[project.zone];

  useEffect(() => {
    markVisited(project.id);
  }, [project.id, markVisited]);

  return (
    <div className="fixed inset-0 bg-paper overflow-y-auto">
      {/* the zone's colour carries through from the street outside */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md border-b border-paper-200"
        style={{ background: `${zone?.color ?? '#c1c1ff'}14` }}
      >
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-10 px-3.5 rounded-xl bg-paper border border-paper-200 text-[13px] font-bold
              text-ink-900 active:scale-95 transition-transform"
          >
            {t('common.back')}
          </button>
          <span className="flex-1 min-w-0 text-[13px] font-black text-ink-900 truncate text-center">
            {loc(project.name)}
          </span>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-6">
        <div className="flex items-start gap-3">
          <span
            className="w-14 h-14 shrink-0 rounded-2xl grid place-items-center text-3xl"
            style={{ background: `${zone?.color ?? '#c1c1ff'}22` }}
          >
            {project.emoji}
          </span>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[22px] font-black text-ink-900 leading-tight">{loc(project.name)}</h1>
            <p className="text-[12.5px] text-paper-muted mt-0.5">
              {zone ? loc(zone.name) : ''}
              {project.client ? ` · ${loc(project.client)}` : ''}
            </p>
          </div>
        </div>

        {/* the number goes first: it is the part anyone remembers */}
        {project.result && (
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: `${zone?.color ?? '#c1c1ff'}14`,
              borderColor: `${zone?.color ?? '#c1c1ff'}44`,
            }}
          >
            <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1">
              {t('project.result')}
            </div>
            <div className="text-[17px] font-black text-ink-900 leading-snug">
              {loc(project.result)}
            </div>
          </div>
        )}

        <Section title={t('project.problem')}>{project.problem && loc(project.problem)}</Section>
        <Section title={t('project.built')}>{project.built && loc(project.built)}</Section>

        {project.stack?.length > 0 && (
          <Section title={t('project.stack')}>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  dir="ltr"
                  className="h-7 px-2.5 rounded-lg bg-paper-100 text-ink-900 text-[12px] font-bold grid place-items-center"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Section>
        )}

        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="block w-full h-12 rounded-2xl bg-brand text-white font-black text-[15px]
              grid place-items-center shadow-fab active:scale-[0.99] transition-transform"
          >
            {t('project.live')}
          </a>
        )}

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
