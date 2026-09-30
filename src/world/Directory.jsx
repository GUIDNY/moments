import { useI18n } from '../i18n/I18nContext';
import { OWNER, PROJECTS_BY_ID, ZONES, projectsIn } from '../portfolio/projects';
import { useVisit } from '../portfolio/VisitContext';
import Sheet from '../ui/Sheet';

/**
 * The index of the town.
 *
 * Walking is the point, but a visitor who already knows they want the WhatsApp
 * work should not have to find it on foot. Every project is one tap from here,
 * grouped by zone in the same colours the streets use, with the ones already
 * read marked so a second visit picks up where the first left off.
 */

function ProjectRow({ project, seen, onEnter, loc }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onEnter(project.id)}
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start
          hover:bg-paper-50 active:bg-paper-100 transition-colors"
      >
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-xl">
          {project.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-black text-ink-900 truncate">
            {loc(project.name)}
          </span>
          {project.result && (
            <span className="block text-[12px] text-paper-muted truncate">
              {loc(project.result)}
            </span>
          )}
        </span>
        {seen && (
          <span className="shrink-0 w-5 h-5 rounded-full bg-paper-100 text-paper-muted text-[11px] grid place-items-center">
            ✓
          </span>
        )}
      </button>
    </li>
  );
}

export default function Directory({ open, onClose, onEnter }) {
  const { t, loc } = useI18n();
  const { hasVisited } = useVisit();

  const go = (id) => {
    onClose();
    onEnter(id);
  };

  const hasContact = Boolean(OWNER.whatsapp || OWNER.email || OWNER.site || OWNER.linkedin);

  return (
    <Sheet open={open} onClose={onClose} title={t('directory.title')} tone="paper">
      <p className="text-[12.5px] text-paper-muted -mt-2 mb-3">{t('directory.sub')}</p>

      <div className="space-y-5">
        {ZONES.filter((z) => z.id !== 'studio').map((zone) => {
          const projects = projectsIn(zone.id);
          return (
            <section key={zone.id}>
              <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: zone.color }} />
                {zone.emoji} {loc(zone.name)}
              </h3>
              {projects.length ? (
                <ul>
                  {projects.map((p) => (
                    <ProjectRow
                      key={p.id}
                      project={PROJECTS_BY_ID[p.id]}
                      seen={hasVisited(p.id)}
                      onEnter={go}
                      loc={loc}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-paper-muted px-2.5 py-2">{t('directory.empty')}</p>
              )}
            </section>
          );
        })}

        <section>
          <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1.5">
            {t('directory.services')}
          </h3>
          <ul>
            <li>
              <button
                type="button"
                onClick={() => go('about')}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start hover:bg-paper-50 active:bg-paper-100 transition-colors"
              >
                <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-xl">
                  👋
                </span>
                <span className="text-[14px] font-black text-ink-900">{t('about.title')}</span>
              </button>
            </li>
            {hasContact && (
              <li>
                <button
                  type="button"
                  onClick={() => go('contact')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start hover:bg-paper-50 active:bg-paper-100 transition-colors"
                >
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-xl">
                    ✉️
                  </span>
                  <span className="text-[14px] font-black text-ink-900">{t('contact.title')}</span>
                </button>
              </li>
            )}
          </ul>
        </section>
      </div>
    </Sheet>
  );
}
