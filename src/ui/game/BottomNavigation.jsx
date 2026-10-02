import { motion } from 'motion/react';
import { Briefcase, Building2, Store, Trophy, Users } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

const TABS = [
  { id: 'city', Icon: Building2, key: 'nav.city' },
  { id: 'portfolio', Icon: Briefcase, key: 'nav.portfolio' },
  { id: 'market', Icon: Store, key: 'nav.market' },
  { id: 'rankings', Icon: Trophy, key: 'nav.rankings' },
  { id: 'friends', Icon: Users, key: 'nav.friends' },
];

/**
 * One bar, five places. A bottom bar on a phone, a floating pill at the
 * bottom on desktop — the same component, so the places are the same. The
 * pill is centred with a physical `left`: centring does not mirror, and a
 * logical `start-1/2` with a negative translate lands off-centre in RTL.
 */
export default function BottomNavigation({ active, onChange }) {
  const { t } = useI18n();
  return (
    <nav
      className="ui-layer absolute z-[45] inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-4 flex justify-center pointer-events-none"
      aria-label="Navigation"
    >
      <div className="pointer-events-auto flex w-full md:w-auto md:rounded-2xl bg-white/95 backdrop-blur-md border-t md:border border-paper-200 shadow-card px-1 md:px-1.5 pb-[env(safe-area-inset-bottom,0px)] md:pb-1.5 pt-1 md:pt-1.5">
        {TABS.map((tab) => {
          const on = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={on ? 'page' : undefined}
              className={`relative flex-1 md:flex-none md:w-[4.6rem] flex flex-col items-center justify-center gap-1 h-12 rounded-xl transition-colors ${
                on ? 'text-brand-deep' : 'text-ink-900/55 hover:text-ink-900'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-brand/12"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <tab.Icon size={20} strokeWidth={on ? 2.4 : 2} className="relative" aria-hidden="true" />
              <span className="relative text-[10.5px] font-black leading-none">{t(tab.key)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
