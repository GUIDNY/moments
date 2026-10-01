import { useI18n } from '../i18n/I18nContext';
import Sheet from '../ui/Sheet';
import { ACHIEVEMENTS } from './achievements';
import { useCity } from './CityContext';
import { formatMoney, formatPct } from './money';
import { moveColor } from './towers';

/**
 * The trophy cabinet: every badge the city can award, the ones you have, and
 * the records it has kept while you were here. Locked badges are shown too —
 * a cabinet with empty shelves is what makes you come back.
 */
export default function BadgesScreen({ open, onClose }) {
  const { t, loc } = useI18n();
  const { progress, display } = useCity();
  const won = new Set(progress.unlocked);

  return (
    <Sheet open={open} onClose={onClose} title={t('badges.title')} tone="paper">
      <p className="text-[12.5px] text-paper-muted -mt-2 mb-3">
        {t('badges.sub', { n: won.size, total: ACHIEVEMENTS.length })}
      </p>

      {/* the streak is the one number that is about you rather than the market */}
      <div className="rounded-2xl bg-paper-50 border border-paper-200 p-3.5 mb-4 flex items-center gap-3">
        <span className="text-3xl leading-none">🔥</span>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black text-ink-900 leading-tight">
            {progress.streak > 1 ? t('badges.streak', { n: progress.streak }) : t('badges.streakOne')}
          </div>
          <div className="text-[11.5px] text-paper-muted">{t('badges.best', { n: progress.best })}</div>
        </div>
      </div>

      {(progress.bestDayPct != null || progress.peak > 0) && (
        <dl className="grid grid-cols-3 gap-2 mb-4 text-center">
          {progress.bestDayPct != null && (
            <div className="rounded-2xl bg-paper-50 border border-paper-200 p-2.5">
              <dt className="text-[10.5px] font-bold text-paper-muted">{t('badges.bestDay')}</dt>
              <dd className="text-[14px] font-black tabular-nums" style={{ color: moveColor(progress.bestDayPct) }}>
                {formatPct(progress.bestDayPct)}
              </dd>
            </div>
          )}
          {progress.worstDayPct != null && (
            <div className="rounded-2xl bg-paper-50 border border-paper-200 p-2.5">
              <dt className="text-[10.5px] font-bold text-paper-muted">{t('badges.worstDay')}</dt>
              <dd className="text-[14px] font-black tabular-nums" style={{ color: moveColor(progress.worstDayPct) }}>
                {formatPct(progress.worstDayPct)}
              </dd>
            </div>
          )}
          {progress.peak > 0 && (
            <div className="rounded-2xl bg-paper-50 border border-paper-200 p-2.5">
              <dt className="text-[10.5px] font-bold text-paper-muted">{t('badges.peak')}</dt>
              <dd className="text-[14px] font-black tabular-nums text-ink-900">
                {formatMoney(progress.peak, display, true)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <ul className="grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const has = won.has(a.id);
          return (
            <li
              key={a.id}
              className={`rounded-2xl border p-3 flex flex-col gap-1 ${
                has ? 'bg-white border-paper-200 shadow-card' : 'bg-paper-50 border-paper-200 opacity-60'
              }`}
            >
              <span className={`text-2xl leading-none ${has ? '' : 'grayscale'}`}>{a.emoji}</span>
              <span className="text-[13px] font-black text-ink-900 leading-tight">{loc(a.name)}</span>
              <span className="text-[11px] text-paper-muted leading-snug">
                {has ? loc(a.note) : t('badges.locked')}
              </span>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
