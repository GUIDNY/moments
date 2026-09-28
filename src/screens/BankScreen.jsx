import { formatCoins } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { GAMES } from '../games/registry';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';

export default function BankScreen({ onExit }) {
  const { state, dailyBonus, claimDailyBonus, achievements } = useGame();
  const { t, loc } = useI18n();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const earnings = GAMES.map((g) => ({ game: g, row: state.games[g.id] })).filter((e) => e.row);
  const topEarner = earnings.slice().sort((a, b) => b.row.coins - a.row.coins)[0];

  return (
    <GameShell title={t('bank.title')} emoji="🏦" onExit={onExit}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
            <div className="text-sm text-text-2">{t('bank.balance')}</div>
            <div className="text-5xl font-bold text-gold tabular-nums my-2">
              🪙 {formatCoins(state.coins)}
            </div>
            <div className="text-xs text-text-3">
              {t('bank.earnedTotal', { n: formatCoins(state.totalCoinsEarned) })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container p-5 text-center">
            <div className="text-3xl mb-1">🎁</div>
            <h3 className="font-bold text-text mb-1">{t('bank.daily')}</h3>
            <p className="text-sm text-text-2 mb-4">
              {dailyBonus.available
                ? t('bank.dailyReady', {
                    n: formatCoins(dailyBonus.amount),
                    d: dailyBonus.nextStreak,
                  })
                : t('bank.dailyDone', { d: state.dailyStreak })}
            </p>
            <Button variant="gold" disabled={!dailyBonus.available} onClick={claimDailyBonus}>
              {dailyBonus.available ? t('bank.collect') : t('bank.comeBack')}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('bank.plays'), value: state.totalPlays },
              { label: t('bank.achievements'), value: `${unlocked}/${achievements.length}` },
              { label: t('bank.dayStreak'), value: state.dailyStreak },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/60 bg-surface-container p-4 text-center"
              >
                <div className="text-xl font-bold text-text tabular-nums">{s.value}</div>
                <div className="text-[11px] text-text-3 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container overflow-hidden">
            <h3 className="font-bold text-text px-4 py-3 border-b border-border/40">
              {t('bank.report')}
            </h3>
            {earnings.length === 0 && (
              <p className="text-sm text-text-3 p-4">{t('bank.reportEmpty')}</p>
            )}
            <ul className="divide-y divide-border/30">
              {earnings.map(({ game, row }) => (
                <li key={game.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl">{game.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm text-text truncate">
                      {loc(game.name)}
                    </span>
                    <span className="block text-xs text-text-3">
                      {row.plays} {t('directory.runs')} · {t('common.best')} {row.best}
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
                {t('bank.topEarner', {
                  name: `${topEarner.game.emoji} ${loc(topEarner.game.name)}`,
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
