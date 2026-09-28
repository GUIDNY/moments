import { DISTRICTS } from './map-data';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { GAMES } from '../games/registry';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const SERVICES = [
  { id: 'bank', emoji: '🏦', key: 'bank.title' },
  { id: 'shop', emoji: '🛍️', key: 'shop.title' },
  { id: 'profile', emoji: '🏠', key: 'profile.title' },
];

/** The town guide — what every place is, and a shortcut straight inside. */
export default function Directory({ open, onClose, onEnter }) {
  const { state } = useGame();
  const { t, loc } = useI18n();

  return (
    <Modal open={open} onClose={onClose} labelledBy="directory-title">
      <div className="p-5">
        <h2 id="directory-title" className="text-xl font-bold text-text mb-1">
          {t('directory.title')}
        </h2>
        <p className="text-sm text-text-2 mb-5">{t('directory.sub')}</p>

        {DISTRICTS.map((district) => {
          const games = GAMES.filter((g) => g.district === district.id);
          if (games.length === 0) return null;
          return (
            <section key={district.id} className="mb-5">
              <h3 className="text-xs font-bold mb-2" style={{ color: district.color }}>
                {t(`district.${district.id}`)}
              </h3>
              <div className="space-y-2">
                {games.map((game) => {
                  const row = state.games[game.id];
                  return (
                    <div
                      key={game.id}
                      className="rounded-xl border border-border/50 bg-surface p-3 flex items-start gap-3"
                    >
                      <span className="text-2xl">{game.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-sm text-text">{loc(game.name)}</span>
                        <span className="block text-xs text-text-2">{loc(game.tagline)}</span>
                        <span className="block text-[11px] text-gold mt-1">{loc(game.payout)}</span>
                        {row && (
                          <span className="block text-[11px] text-text-3 mt-0.5">
                            {row.plays} {t('directory.runs')} · {t('common.best')} {row.best} · 🪙{' '}
                            {row.coins}
                          </span>
                        )}
                      </span>
                      <Button
                        size="sm"
                        aria-label={`${t('common.enter')} — ${loc(game.name)}`}
                        onClick={() => onEnter(game.id)}
                      >
                        {t('common.enter')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section>
          <h3 className="text-xs font-bold text-text-3 mb-2">{t('directory.services')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onEnter(s.id)}
                className="rounded-xl border border-border/50 bg-surface p-3 text-center hover:border-primary transition-colors"
              >
                <span className="block text-2xl">{s.emoji}</span>
                <span className="block text-xs font-bold text-text mt-1">{t(s.key)}</span>
              </button>
            ))}
          </div>
        </section>

        <Button variant="ghost" className="w-full mt-5" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}
