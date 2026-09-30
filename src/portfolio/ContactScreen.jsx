import { useI18n } from '../i18n/I18nContext';
import { OWNER } from './projects';

/**
 * The way out of the town and into an inbox.
 *
 * Every route is optional: fill in a field in `projects.js` and its button
 * appears, leave it empty and it does not. An empty contact screen would be a
 * silly thing to ship, so when nothing is filled in the screen says so plainly
 * rather than showing a row of dead buttons.
 */

/** Israeli numbers come in as 05x…; WhatsApp wants 9725x…. */
function whatsappHref(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('972') ? digits : digits.replace(/^0/, '972');
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function Route({ href, emoji, label, detail, tone }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 rounded-2xl p-3.5 border active:scale-[0.99] transition-transform ${tone}`}
    >
      <span className="w-11 h-11 shrink-0 rounded-xl bg-white/15 grid place-items-center text-xl">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-black">{label}</span>
        <span dir="ltr" className="block text-[12.5px] opacity-75 truncate text-start">
          {detail}
        </span>
      </span>
    </a>
  );
}

export default function ContactScreen({ onExit }) {
  const { t, loc } = useI18n();

  const greeting = t('contact.greeting');
  const routes = [
    OWNER.whatsapp && {
      key: 'wa',
      href: whatsappHref(OWNER.whatsapp, greeting),
      emoji: '💬',
      label: t('contact.whatsapp'),
      detail: OWNER.whatsapp,
      tone: 'bg-[#25d366] text-white border-[#1eb855]',
    },
    OWNER.email && {
      key: 'mail',
      href: `mailto:${OWNER.email}?subject=${encodeURIComponent(greeting)}`,
      emoji: '✉️',
      label: t('contact.email'),
      detail: OWNER.email,
      tone: 'bg-ink-800 text-white border-ink-line',
    },
    OWNER.site && {
      key: 'site',
      href: OWNER.site,
      emoji: '🌐',
      label: t('contact.site'),
      detail: OWNER.site.replace(/^https?:\/\//, ''),
      tone: 'bg-paper-50 text-ink-900 border-paper-200',
    },
    OWNER.linkedin && {
      key: 'in',
      href: OWNER.linkedin,
      emoji: '💼',
      label: 'LinkedIn',
      detail: OWNER.linkedin.replace(/^https?:\/\//, ''),
      tone: 'bg-paper-50 text-ink-900 border-paper-200',
    },
  ].filter(Boolean);

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
            {t('contact.title')}
          </span>
          <span className="w-[4.5rem] shrink-0" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-5">
        <div>
          <h1 className="text-[24px] font-black text-ink-900 leading-tight">{t('contact.heading')}</h1>
          <p className="text-[14px] text-paper-muted leading-relaxed mt-1.5">{t('contact.sub')}</p>
        </div>

        {routes.length > 0 ? (
          <div className="space-y-2.5">
            {routes.map((r) => (
              <Route key={r.key} {...r} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-brand/10 p-4">
            <p className="text-[13px] font-bold text-brand-deep leading-snug">{t('contact.empty')}</p>
          </div>
        )}

        <p className="text-[12px] text-paper-muted leading-snug">
          {loc(OWNER.role)}
        </p>

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
