import { DISTRICTS } from './map-data';
import { useGame } from '../engine/GameContext';
import { GAMES } from '../games/registry';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

/** The city guide — what every place is, and a shortcut straight inside. */
export default function Directory({ open, onClose, onEnter }) {
  const { state } = useGame();

  return (
    <Modal open={open} onClose={onClose} labelledBy="directory-title">
      <div className="p-5">
        <h2 id="directory-title" className="text-xl font-bold text-text mb-1">
          🗺️ מדריך העיר
        </h2>
        <p className="text-sm text-text-2 mb-5">
          כל מקום משלם מטבעות. אפשר להגיע ברגל — או להיכנס ישר מכאן.
        </p>

        {DISTRICTS.map((district) => {
          const games = GAMES.filter((g) => g.district === district.id);
          if (games.length === 0) return null;
          return (
            <section key={district.id} className="mb-5">
              <h3 className="text-xs font-bold mb-2" style={{ color: district.color }}>
                {district.name}
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
                        <span className="block font-bold text-sm text-text">{game.name}</span>
                        <span className="block text-xs text-text-2">{game.tagline}</span>
                        <span className="block text-[11px] text-gold mt-1">{game.payout}</span>
                        {row && (
                          <span className="block text-[11px] text-text-3 mt-0.5">
                            {row.plays} ריצות · שיא {row.best} · 🪙 {row.coins}
                          </span>
                        )}
                      </span>
                      <Button
                        size="sm"
                        aria-label={`כניסה ל${game.name}`}
                        onClick={() => onEnter(game.id)}
                      >
                        כניסה
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <section>
          <h3 className="text-xs font-bold text-text-3 mb-2">שירותי העיר</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'bank', emoji: '🏦', name: 'הבנק' },
              { id: 'shop', emoji: '🛍️', name: 'החנות' },
              { id: 'profile', emoji: '🏠', name: 'הבית' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onEnter(s.id)}
                className="rounded-xl border border-border/50 bg-surface p-3 text-center hover:border-primary transition-colors"
              >
                <span className="block text-2xl">{s.emoji}</span>
                <span className="block text-xs font-bold text-text mt-1">{s.name}</span>
              </button>
            ))}
          </div>
        </section>

        <Button variant="ghost" className="w-full mt-5" onClick={onClose}>
          סגור
        </Button>
      </div>
    </Modal>
  );
}
