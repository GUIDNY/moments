import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SECTORS, SECTOR_BY_ID } from '../stocks/catalog';
import { useCity } from '../stocks/CityContext';
import { formatMoney, formatPct } from '../stocks/money';
import { moveColor } from '../stocks/towers';
import { ACHIEVEMENTS } from '../stocks/achievements';
import { STARTING_CASH } from '../stocks/store';
import { MISSIONS } from '../learn/content';

const MISSION_COUNT = MISSIONS.length;
import Sheet from '../ui/Sheet';

/** The portfolio's worth, day by day, as one line from the starting purse. */
function HistoryLine({ history }) {
  if (!history || history.length < 2) return null;
  const W = 320;
  const H = 56;
  const vals = history.map((h) => h.total);
  const lo = Math.min(...vals, STARTING_CASH);
  const hi = Math.max(...vals, STARTING_CASH);
  const span = hi - lo || 1;
  const x = (i) => (i / (vals.length - 1)) * W;
  const y = (v) => H - 4 - ((v - lo) / span) * (H - 8);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const up = vals[vals.length - 1] >= STARTING_CASH;
  const colour = up ? '#4caf7d' : '#e2706f';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2={W} y1={y(STARTING_CASH)} y2={y(STARTING_CASH)} stroke="#c5cdd8" strokeWidth="1" strokeDasharray="4 3" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The portfolio as a list, for when walking is not the point.
 *
 * The city is the reason this exists, but somebody who wants to know what
 * Apple did today should not have to find the tower on foot. Same sectors, same
 * colours, and a tap takes you to that tower's door.
 */

function HoldingRow({ position, holding, onEnter, loc }) {
  // the catalogue's Hebrew name beats the exchange's own ALL-CAPS English;
  // a symbol found by search has no catalogue name, so the quote fills in
  const name = loc(holding.name) || position?.name || holding.symbol;
  return (
    <li>
      <button
        type="button"
        onClick={() => onEnter(holding.symbol)}
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start hover:bg-paper-50 active:bg-paper-100 transition-colors"
      >
        <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-[11px] font-black text-ink-900">
          {holding.symbol.replace(/\.(TA|L)$/, '').slice(0, 5)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-black text-ink-900 truncate">{name}</span>
          <span className="block text-[11.5px] text-paper-muted truncate">
            {holding.qty.toLocaleString()} ×{' '}
            {position && !position.missing ? formatMoney(position.price, position.currency) : '—'}
          </span>
        </span>
        {position && !position.missing && (
          <span className="shrink-0 text-end">
            <span className="block text-[13px] font-black tabular-nums text-ink-900">
              {formatMoney(position.value, position.currency, true)}
            </span>
            <span
              className="block text-[11.5px] font-bold tabular-nums"
              style={{ color: moveColor(position.dayPct) }}
            >
              {formatPct(position.dayPct)}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}

export default function Directory({ open, onClose, onEnter, onAdd, onBadges, onLearn }) {
  const { t, loc } = useI18n();
  const {
    holdings, positionOf, summary, shareUrl, isShared, delayed, error, progress,
    cash, totalUsd, history, trades, nextMission, resetGame,
  } = useCity();
  const [copied, setCopied] = useState(false);
  const sinceStart = totalUsd != null ? ((totalUsd - STARTING_CASH) / STARTING_CASH) * 100 : null;

  const share = () => {
    const url = shareUrl();
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }, () => {});
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('directory.title')} tone="paper">
      {/* the scoreboard: cash, holdings, the total, and how far from the start */}
      <div className="rounded-2xl bg-paper-50 border border-paper-200 p-3.5 -mt-1 mb-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('game.total')}</div>
            <div className="text-[24px] font-black text-ink-900 tabular-nums leading-tight">
              {totalUsd != null ? formatMoney(totalUsd, 'USD') : '…'}
            </div>
          </div>
          {sinceStart != null && (
            <div className="text-end">
              <div className="text-[15px] font-black tabular-nums" style={{ color: moveColor(sinceStart) }}>{formatPct(sinceStart)}</div>
              <div className="text-[11px] text-paper-muted">{t('game.sinceStart')}</div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-[12.5px]">
          <div className="rounded-xl bg-white border border-paper-200 px-2.5 py-1.5">
            <div className="text-[10.5px] font-bold text-paper-muted">{t('game.cash')}</div>
            <div className="font-black tabular-nums text-ink-900">{formatMoney(cash, 'USD')}</div>
          </div>
          <div className="rounded-xl bg-white border border-paper-200 px-2.5 py-1.5">
            <div className="text-[10.5px] font-bold text-paper-muted">{t('game.invested')}</div>
            <div className="font-black tabular-nums text-ink-900">{formatMoney(summary.valueUsd, 'USD')}</div>
            {holdings.length > 0 && (
              <div className="text-[11px] font-bold tabular-nums" style={{ color: moveColor(summary.dayPct) }}>
                {formatPct(summary.dayPct)} {t('city.today')}
              </div>
            )}
          </div>
        </div>
        <HistoryLine history={history} />
        <p className="text-[11px] text-paper-muted mt-1">{t('game.start', { amount: formatMoney(STARTING_CASH, 'USD') })}</p>
      </div>

      {/* the next thing to do, and why */}
      {!isShared && nextMission && (
        <button
          type="button"
          onClick={onLearn}
          className="w-full rounded-2xl bg-white border border-brand shadow-card p-3 mb-3 flex items-start gap-3 text-start active:scale-[0.99] transition-transform"
        >
          <span className="text-2xl leading-none">{nextMission.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-black uppercase tracking-wide text-brand-deep">{t('learn.mission')}</span>
            <span className="block text-[13.5px] font-black text-ink-900 leading-tight">{loc(nextMission.title)}</span>
            <span className="block text-[12px] text-paper-muted leading-snug mt-0.5">{loc(nextMission.why)}</span>
          </span>
        </button>
      )}

      {holdings.length === 0 ? (
        <>
          <p className="text-[13px] text-paper-muted mb-3">{t('directory.empty')}</p>
          <button
            type="button"
            onClick={onAdd}
            className="w-full h-12 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab"
          >
            {t('directory.add')}
          </button>
        </>
      ) : (
        <>

          {/* the game, in one row: your streak and your shelf */}
          {!isShared && (
            <button
              type="button"
              onClick={onBadges}
              className="w-full flex items-center gap-3 h-12 px-3.5 mb-4 rounded-2xl bg-white border border-paper-200 shadow-card text-start active:scale-[0.99] transition-transform"
            >
              <span className="text-xl leading-none">🔥</span>
              <span className="flex-1 min-w-0 text-[13px] font-black text-ink-900 truncate">
                {progress.streak > 1 ? t('badges.streak', { n: progress.streak }) : t('badges.streakOne')}
              </span>
              <span className="text-[12px] font-bold text-paper-muted tabular-nums">
                🏆 {progress.unlocked.length}/{ACHIEVEMENTS.length}
              </span>
            </button>
          )}
          {!isShared && (
            <button
              type="button"
              onClick={onLearn}
              className="w-full flex items-center gap-3 h-11 px-3.5 mb-4 rounded-2xl bg-paper-50 border border-paper-200 text-start active:scale-[0.99] transition-transform"
            >
              <span className="text-lg leading-none">📚</span>
              <span className="flex-1 text-[13px] font-black text-ink-900">{t('learn.title')}</span>
              <span className="text-[12px] font-bold text-paper-muted tabular-nums">
                {progress.missions.length}/{MISSION_COUNT}
              </span>
            </button>
          )}

          <p className="text-[12.5px] text-paper-muted mb-2">{t('directory.sub')}</p>

          <div className="space-y-4">
            {SECTORS.map((sector) => {
              const inSector = holdings.filter((h) => h.sector === sector.id);
              if (!inSector.length) return null;
              return (
                <section key={sector.id}>
                  <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: sector.color }} />
                    {sector.emoji} {loc(SECTOR_BY_ID[sector.id].name)}
                  </h3>
                  <ul>
                    {inSector.map((h) => (
                      <HoldingRow
                        key={h.symbol}
                        holding={h}
                        position={positionOf(h.symbol)}
                        onEnter={onEnter}
                        loc={loc}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {trades.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1">{t('game.trades')}</h3>
              <ul className="divide-y divide-paper-200 rounded-2xl border border-paper-200 bg-paper-50">
                {[...trades].reverse().slice(0, 8).map((tr, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2 text-[12.5px]">
                    <span className={`font-black ${tr.side === 'buy' ? 'text-[#4caf7d]' : 'text-[#e2706f]'}`}>
                      {tr.side === 'buy' ? t('game.buy') : t('game.sell')}
                    </span>
                    <span dir="ltr" className="font-bold text-ink-900">{tr.qty.toLocaleString()} × {tr.symbol}</span>
                    <span className="flex-1 text-end tabular-nums text-ink-900">{formatMoney(tr.valueUsd, 'USD')}</span>
                    {tr.realised != null && (
                      <span className="tabular-nums font-bold" style={{ color: moveColor(tr.realised) }}>
                        {tr.realised >= 0 ? '+' : ''}{formatMoney(tr.realised, 'USD')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-5 space-y-2">
            {!isShared && (
              <button
                type="button"
                onClick={onAdd}
                className="w-full h-11 rounded-2xl bg-brand text-white font-black text-[14px]"
              >
                {t('directory.add')}
              </button>
            )}
            <button
              type="button"
              onClick={share}
              className="w-full h-11 rounded-2xl bg-paper-100 text-ink-900 font-bold text-[13px]"
            >
              {copied ? t('directory.copied') : t('directory.share')}
            </button>
            {!isShared && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('game.resetConfirm', { amount: formatMoney(STARTING_CASH, 'USD') }))) {
                    resetGame();
                    onClose();
                  }
                }}
                className="w-full h-10 rounded-2xl text-[12px] font-bold text-paper-muted"
              >
                {t('game.reset')}
              </button>
            )}
          </div>
        </>
      )}

      <div className="mt-4 space-y-1.5">
        {isShared && <p className="text-[11.5px] font-bold text-brand-deep">{t('directory.shared')}</p>}
        {summary.unconverted > 0 && (
          <p className="text-[11.5px] text-paper-muted">
            {t('city.unconverted', { n: summary.unconverted })}
          </p>
        )}
        {error && <p className="text-[11.5px] font-bold text-[#e5484d]">{t('city.offline')}</p>}
        {delayed && <p className="text-[11px] text-paper-muted leading-snug">{t('city.delayed')}</p>}
      </div>
    </Sheet>
  );
}
