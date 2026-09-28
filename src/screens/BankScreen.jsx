import { formatCoins } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import { GAMES } from '../games/registry';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';

export default function BankScreen({ onExit }) {
  const { state, dailyBonus, claimDailyBonus, achievements } = useGame();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const earnings = GAMES.map((g) => ({ game: g, row: state.games[g.id] })).filter((e) => e.row);
  const topEarner = earnings.slice().sort((a, b) => b.row.coins - a.row.coins)[0];

  return (
    <GameShell title="הבנק" emoji="🏦" onExit={onExit}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
            <div className="text-sm text-text-2">היתרה שלך</div>
            <div className="text-5xl font-bold text-gold tabular-nums my-2">
              🪙 {formatCoins(state.coins)}
            </div>
            <div className="text-xs text-text-3">
              הרווחת עד היום {formatCoins(state.totalCoinsEarned)} מטבעות
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container p-5 text-center">
            <div className="text-3xl mb-1">🎁</div>
            <h3 className="font-bold text-text mb-1">בונוס יומי</h3>
            <p className="text-sm text-text-2 mb-4">
              {dailyBonus.available
                ? `מחכים לך ${formatCoins(dailyBonus.amount)} מטבעות — יום ${dailyBonus.nextStreak} ברצף`
                : `כבר נאסף היום. רצף נוכחי: ${state.dailyStreak} ימים`}
            </p>
            <Button variant="gold" disabled={!dailyBonus.available} onClick={claimDailyBonus}>
              {dailyBonus.available ? 'קח את הבונוס' : 'חזור מחר'}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'משחקונים ששוחקו', value: state.totalPlays },
              { label: 'הישגים', value: `${unlocked}/${achievements.length}` },
              { label: 'רצף ימים', value: state.dailyStreak },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-surface-container p-4 text-center">
                <div className="text-xl font-bold text-text tabular-nums">{s.value}</div>
                <div className="text-[11px] text-text-3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container overflow-hidden">
            <h3 className="font-bold text-text px-4 py-3 border-b border-border/40">
              דוח הכנסות לפי מקום
            </h3>
            {earnings.length === 0 && (
              <p className="text-sm text-text-3 p-4">עוד לא שיחקת בשום מקום בעיר.</p>
            )}
            <ul className="divide-y divide-border/30">
              {earnings.map(({ game, row }) => (
                <li key={game.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{game.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm text-text truncate">{game.name}</span>
                    <span className="block text-xs text-text-3">
                      {row.plays} ריצות · שיא {row.best}
                    </span>
                  </span>
                  <span className="text-gold font-bold tabular-nums text-sm">
                    🪙 {formatCoins(row.coins)}
                  </span>
                </li>
              ))}
            </ul>
            {topEarner && (
              <p className="text-xs text-text-3 px-4 py-3 border-t border-border/30">
                המקום הרווחי שלך: {topEarner.game.emoji} {topEarner.game.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
