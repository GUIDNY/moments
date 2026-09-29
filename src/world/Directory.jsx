import { DISTRICTS } from './map-data';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { GAMES } from '../games/registry';
import Sheet from '../ui/Sheet';

const SERVICES = [
  { id: 'bank', emoji: '🏦', key: 'bank.title' },
  { id: 'shop', emoji: '🛍️', key: 'shop.title' },
  { id: 'profile', emoji: '🏠', key: 'profile.title' },
];

/** One venue row — icon tile, name, what it pays, and the way in. */
function VenueRow({ game, row, onEnter, t, loc }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onEnter(game.id)}
        aria-label={`${t('common.enter')} — ${loc(game.name)}`}
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start
          hover:bg-paper-50 active:bg-paper-100 transition-colors"
      >
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-xl">
          {game.emoji}
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-black text-ink-900 truncate">
            {loc(game.name)}
          </span>
          <span className="block text-[12px] text-paper-muted truncate">{loc(game.tagline)}</span>
          <span className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] font-bold text-brand-deep">🪙 {loc(game.payout)}</span>
            {row && (
              <span className="text-[11px] text-paper-muted tabular-nums">
                · {t('common.best')} {row.best}
              </span>
            )}
          </span>
        </span>

        <span
          className="shrink-0 w-8 h-8 rounded-full bg-brand text-white grid place-items-center
            text-sm font-black rtl:rotate-180"
          aria-hidden="true"
        >
          ›
        </span>
      </button>
    </li>
  );
}

/** The town guide — every venue, and a shortcut straight inside. */
export default function Directory({ open, onClose, onEnter }) {
  const { state } = useGame();
  const { t, loc } = useI18n();

  return (
    <Sheet open={open} onClose={onClose} labelledBy="directory-title" tone="paper">
      <div className="px-4 pb-2 pt-1 md:pt-5">
        <h2 id="directory-title" className="text-lg font-black text-ink-900">
          {t('directory.title')}
        </h2>
        <p className="text-[12px] text-paper-muted mt-0.5">{t('directory.sub')}</p>
      </div>

      <div className="px-2">
        {DISTRICTS.map((district) => {
          const games = GAMES.filter((g) => g.district === district.id);
          if (games.length === 0) return null;
          return (
            <section key={district.id} className="mb-3">
              <h3 className="flex items-center gap-1.5 px-2.5 mb-1 text-[11px] font-black uppercase tracking-wide text-paper-muted">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: district.color }}
                />
                {t(`district.${district.id}`)}
              </h3>
              <ul>
                {games.map((game) => (
                  <VenueRow
                    key={game.id}
                    game={game}
                    row={state.games[game.id]}
                    onEnter={onEnter}
                    t={t}
                    loc={loc}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <h3 className="mb-2 text-[11px] font-black uppercase tracking-wide text-paper-muted">
          {t('directory.services')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onEnter(s.id)}
              className="rounded-2xl bg-paper-50 border border-paper-200 p-3 text-center
                active:scale-95 transition-transform"
            >
              <span className="block text-2xl">{s.emoji}</span>
              <span className="block text-[12px] font-bold text-ink-900 mt-1">{t(s.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
