import { BookOpen, Hammer, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { SECTORS, SECTOR_BY_ID } from '../../stocks/catalog';
import { useCity } from '../../stocks/CityContext';
import { formatMoney, formatPct } from '../../stocks/money';
import { STARTING_CASH } from '../../stocks/store';
import { moveColor } from '../../stocks/towers';
import { ACHIEVEMENTS } from '../../stocks/achievements';
import { MISSIONS } from '../../learn/content';
import { tierFor } from '../../city/tiers';

/** The portfolio's worth, day by day, from the starting purse. */
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
  const colour = vals[vals.length - 1] >= STARTING_CASH ? '#4caf7d' : '#e2706f';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2={W} y1={y(STARTING_CASH)} y2={y(STARTING_CASH)} stroke="#c5cdd8" strokeWidth="1" strokeDasharray="4 3" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The portfolio as a list: the same holdings the city draws, in rows. The
 * scoreboard on top, the next mission, the holdings by sector, the trades.
 * Tap a row and the city view opens on that building.
 */
export default function PortfolioView({ onOpenStock, onBuy, onLearn, onBadges }) {
  const { t, loc } = useI18n();
  const { holdings, positionOf, summary, cash, totalUsd, history, trades, progress, nextMission, isShared, resetGame, shareUrl } = useCity();
  const [copied, setCopied] = useState(false);
  const sinceStart = totalUsd != null ? ((totalUsd - STARTING_CASH) / STARTING_CASH) * 100 : null;

  const share = () => {
    navigator.clipboard?.writeText(shareUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }, () => {});
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper-50 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] md:pt-6 space-y-3">
        {/* the scoreboard */}
        <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('game.total')}</div>
              <div className="text-[28px] font-black text-ink-900 tabular-nums leading-tight">{totalUsd != null ? formatMoney(totalUsd, 'USD') : '…'}</div>
            </div>
            {sinceStart != null && (
              <div className="text-end">
                <div className="text-[16px] font-black tabular-nums" style={{ color: moveColor(sinceStart) }}>{formatPct(sinceStart)}</div>
                <div className="text-[11px] text-paper-muted">{t('game.sinceStart')}</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[12.5px]">
            <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
              <div className="text-[10.5px] font-bold text-paper-muted">{t('game.cash')}</div>
              <div className="font-black tabular-nums text-ink-900">{formatMoney(cash, 'USD')}</div>
            </div>
            <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2">
              <div className="text-[10.5px] font-bold text-paper-muted">{t('game.invested')}</div>
              <div className="font-black tabular-nums text-ink-900">{formatMoney(summary.valueUsd, 'USD')}</div>
              {holdings.length > 0 && (
                <div className="text-[11px] font-bold tabular-nums" style={{ color: moveColor(summary.dayPct) }}>{formatPct(summary.dayPct)} {t('city.today')}</div>
              )}
            </div>
          </div>
          <HistoryLine history={history} />
        </section>

        {!isShared && nextMission && (
          <button type="button" onClick={onLearn} className="w-full rounded-3xl bg-white border border-brand/60 shadow-card p-3.5 flex items-start gap-3 text-start active:scale-[0.99] transition-transform">
            <span className="text-2xl leading-none">{nextMission.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-black uppercase tracking-wide text-brand-deep">{t('learn.mission')}</span>
              <span className="block text-[13.5px] font-black text-ink-900 leading-tight">{loc(nextMission.title)}</span>
              <span className="block text-[12px] text-paper-muted leading-snug mt-0.5">{loc(nextMission.why)}</span>
            </span>
          </button>
        )}

        {!isShared && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onBadges} className="rounded-2xl bg-white border border-paper-200 shadow-card h-12 px-3 flex items-center gap-2 text-start">
              <span className="w-8 h-8 rounded-xl bg-[#f5c542]/20 text-[#b8860b] grid place-items-center"><Trophy size={16} strokeWidth={2.4} aria-hidden="true" /></span>
              <span className="text-[12.5px] font-black text-ink-900 flex-1">{t('badges.title')}</span>
              <span className="text-[11.5px] font-bold text-paper-muted tabular-nums">{progress.unlocked.length}/{ACHIEVEMENTS.length}</span>
            </button>
            <button type="button" onClick={onLearn} className="rounded-2xl bg-white border border-paper-200 shadow-card h-12 px-3 flex items-center gap-2 text-start">
              <span className="w-8 h-8 rounded-xl bg-brand/12 text-brand-deep grid place-items-center"><BookOpen size={16} strokeWidth={2.4} aria-hidden="true" /></span>
              <span className="text-[12.5px] font-black text-ink-900 flex-1">{t('learn.title')}</span>
              <span className="text-[11.5px] font-bold text-paper-muted tabular-nums">{progress.missions.length}/{MISSIONS.length}</span>
            </button>
          </div>
        )}

        {/* the holdings, the way the city groups them */}
        {holdings.length === 0 ? (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/12 text-brand-deep grid place-items-center"><Hammer size={28} strokeWidth={2.2} aria-hidden="true" /></div>
            <h2 className="text-[16px] font-black text-ink-900 mt-2">{t('empty.title')}</h2>
            <p className="text-[13px] text-paper-muted mt-1">{t('empty.body')}</p>
            {!isShared && (
              <button type="button" onClick={onBuy} className="mt-4 h-12 px-6 rounded-2xl bg-brand text-white font-black text-[15px] shadow-fab">{t('directory.add')}</button>
            )}
          </section>
        ) : (
          SECTORS.map((sector) => {
            const inSector = holdings.filter((h) => h.sector === sector.id);
            if (!inSector.length) return null;
            return (
              <section key={sector.id} className="rounded-3xl bg-white border border-paper-200 shadow-card p-2">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted px-2 pt-1.5 pb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: sector.color }} />
                  {loc(SECTOR_BY_ID[sector.id].name)}
                </h3>
                <ul>
                  {inSector.map((h) => {
                    const p = positionOf(h.symbol);
                    const live = p && !p.missing;
                    const tier = tierFor(p?.valueUsd);
                    return (
                      <li key={h.symbol}>
                        <button type="button" onClick={() => onOpenStock(h.symbol)} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start hover:bg-paper-50 active:bg-paper-100 transition-colors">
                          <span className="w-11 h-11 shrink-0 rounded-2xl bg-paper-100 grid place-items-center text-[11px] font-black text-ink-900">
                            {h.symbol.replace(/\.(TA|L)$/, '').slice(0, 5)}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-black text-ink-900 truncate">{loc(h.name) || p?.name || h.symbol}</span>
                            <span className="block text-[11.5px] text-paper-muted truncate">
                              {h.qty.toLocaleString()} × {live ? formatMoney(p.price, p.currency) : '—'} · {loc(tier.label)}
                            </span>
                          </span>
                          {live && (
                            <span className="shrink-0 text-end">
                              <span className="block text-[13px] font-black tabular-nums text-ink-900">{formatMoney(p.valueUsd ?? p.value, p.valueUsd != null ? 'USD' : p.currency, true)}</span>
                              <span className="block text-[11.5px] font-bold tabular-nums" style={{ color: moveColor(p.dayPct) }}>{formatPct(p.dayPct)}</span>
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}

        {trades.length > 0 && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-3">
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1">{t('game.trades')}</h3>
            <ul className="divide-y divide-paper-100">
              {[...trades].reverse().slice(0, 8).map((tr, i) => (
                <li key={i} className="flex items-center gap-2 py-2 text-[12.5px]">
                  <span className={`font-black ${tr.side === 'buy' ? 'text-[#4caf7d]' : 'text-[#e2706f]'}`}>{tr.side === 'buy' ? t('game.buy') : t('game.sell')}</span>
                  <span dir="ltr" className="font-bold text-ink-900">{tr.qty.toLocaleString()} × {tr.symbol}</span>
                  <span className="flex-1 text-end tabular-nums text-ink-900">{formatMoney(tr.valueUsd, 'USD')}</span>
                  {tr.realised != null && (
                    <span className="tabular-nums font-bold" style={{ color: moveColor(tr.realised) }}>{tr.realised >= 0 ? '+' : ''}{formatMoney(tr.realised, 'USD')}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="space-y-2 pt-1">
          <button type="button" onClick={share} className="w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-bold text-[13px]">
            {copied ? t('directory.copied') : t('directory.share')}
          </button>
          {!isShared && (
            <button
              type="button"
              onClick={() => window.confirm(t('game.resetConfirm', { amount: formatMoney(STARTING_CASH, 'USD') })) && resetGame()}
              className="w-full h-10 rounded-2xl text-[12px] font-bold text-paper-muted"
            >
              {t('game.reset')}
            </button>
          )}
          <p className="text-[11px] text-paper-muted leading-snug text-center">{t('city.delayed')}</p>
        </div>
      </div>
    </div>
  );
}
