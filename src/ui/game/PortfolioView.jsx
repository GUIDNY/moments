import { ArrowDownUp, BookOpen, Download, Trophy, Upload, UserCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { SECTORS, SECTOR_BY_ID } from '../../stocks/catalog';
import { useCity } from '../../stocks/CityContext';
import { formatMoney, formatPct } from '../../stocks/money';
import { STARTING_CASH } from '../../stocks/store';
import { moveColor } from '../../stocks/towers';
import { ACHIEVEMENTS } from '../../stocks/achievements';
import { MISSIONS } from '../../learn/content';
import { dailyFor } from '../../learn/daily';
import { today } from '../../stocks/progress';
import { shareOf, tierFor } from '../../city/tiers';
import { levelFor, xpFor } from '../../stocks/xp';

/** The portfolio's worth, day by day, from the starting purse. */
function HistoryLine({ history, base }) {
  if (!history || history.length < 2) return null;
  const W = 320;
  const H = 56;
  const vals = history.map((h) => h.total);
  const lo = Math.min(...vals, base);
  const hi = Math.max(...vals, base);
  const span = hi - lo || 1;
  const x = (i) => (i / (vals.length - 1)) * W;
  const y = (v) => H - 4 - ((v - lo) / span) * (H - 8);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const colour = vals[vals.length - 1] >= base ? '#4caf7d' : '#e2706f';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2={W} y1={y(base)} y2={y(base)} stroke="#c5cdd8" strokeWidth="1" strokeDasharray="4 3" />
      <path d={d} fill="none" stroke={colour} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const SORTS = ['sector', 'value', 'day', 'gain', 'name'];
const FILTERS = ['all', 'stocks', 'etf'];
const chip = (on) => `h-9 px-3 rounded-xl text-[12.5px] font-bold border transition-colors whitespace-nowrap ${on ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-900/70 border-paper-200'}`;

/**
 * The portfolio as a list: the same holdings the city draws, in rows. The
 * scoreboard on top, where the money sits by sector, today's two small
 * tasks, the holdings sorted and filtered the way the reader wants, the
 * trades. Tap a row and the city view opens on that building.
 */
export default function PortfolioView({ onOpenStock, onBuy, onLearn, onBadges, onImport, onHealth, onNews, onGlossary, onLesson, onAccount }) {
  const { t, loc } = useI18n();
  const { holdings, positions, positionOf, summary, cash, totalUsd, history, trades, progress, nextMission, isShared, resetGame, doDaily, account } = useCity();
  const [sort, setSort] = useState('sector');
  const [filter, setFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState(null);
  const base = history?.[0]?.total ?? STARTING_CASH;
  const sinceStart = totalUsd != null && base > 0 ? ((totalUsd - base) / base) * 100 : null;
  const level = levelFor(xpFor(progress, { holdings, trades, positions, totalUsd }));

  /* where the money sits, by sector, of what is invested */
  const allocation = useMemo(() => {
    const by = {};
    let invested = 0;
    for (const h of holdings) {
      const p = positionOf(h.symbol);
      if (!p || p.missing || !p.valueUsd) continue;
      by[h.sector] = (by[h.sector] || 0) + p.valueUsd;
      invested += p.valueUsd;
    }
    return { invested, rows: Object.entries(by).map(([id, usd]) => ({ sector: SECTOR_BY_ID[id], usd, pct: invested ? (usd / invested) * 100 : 0 })).sort((a, b) => b.usd - a.usd) };
  }, [holdings, positionOf]);

  /* today's two small tasks */
  const day = today();
  const daily = dailyFor(day);
  const dailyDone = new Set(progress.daily?.day === day ? progress.daily.done : []);
  const runDaily = (task) => {
    doDaily(task.id);
    if (task.action === 'health') onHealth?.();
    else if (task.action === 'allocation') document.getElementById('allocation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (task.action === 'news') onNews?.(allocation.rows.length ? holdings.find((h) => h.sector === allocation.rows[0].sector?.id)?.symbol ?? holdings[0]?.symbol : null);
    else if (task.action === 'lesson') onLesson?.(task.lesson);
    else if (task.action === 'glossary') onGlossary?.();
  };

  /* the rows, filtered and sorted */
  const rows = useMemo(() => {
    const list = holdings
      .filter((h) => (filter === 'etf' ? h.sector === 'other' : filter === 'stocks' ? h.sector !== 'other' : true))
      .filter((h) => !sectorFilter || h.sector === sectorFilter)
      .map((h) => ({ h, p: positionOf(h.symbol) }));
    const val = (x) => (x.p && !x.p.missing ? x.p.valueUsd ?? 0 : 0);
    const by = {
      value: (a, b) => val(b) - val(a),
      day: (a, b) => (b.p?.dayPct ?? -Infinity) - (a.p?.dayPct ?? -Infinity),
      gain: (a, b) => (b.p?.gainPct ?? -Infinity) - (a.p?.gainPct ?? -Infinity),
      name: (a, b) => (loc(a.h.name) || a.h.symbol).localeCompare(loc(b.h.name) || b.h.symbol),
      sector: (a, b) => SECTORS.findIndex((s) => s.id === a.h.sector) - SECTORS.findIndex((s) => s.id === b.h.sector) || val(b) - val(a),
    };
    return list.sort(by[sort] ?? by.sector);
  }, [holdings, positionOf, filter, sectorFilter, sort, loc]);

  const Row = ({ h, p }) => {
    const live = p && !p.missing;
    const tier = tierFor(shareOf(p?.valueUsd, totalUsd));
    const sector = SECTOR_BY_ID[h.sector];
    return (
      <li>
        <button type="button" onClick={() => onOpenStock(h.symbol)} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-start hover:bg-paper-50 active:bg-paper-100 transition-colors">
          <span className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-[11px] font-black text-ink-900" style={{ background: `${sector?.color ?? '#c1c1ff'}33` }}>
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
              <span className="block text-[11.5px] font-bold tabular-nums" style={{ color: moveColor(sort === 'gain' ? p.gainPct : p.dayPct) }}>
                {sort === 'gain' ? (p.gainPct != null ? formatPct(p.gainPct) : '—') : formatPct(p.dayPct)}
              </span>
            </span>
          )}
        </button>
      </li>
    );
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
            {summary.gainPct != null ? (
              <div className="text-end">
                <div className="text-[16px] font-black tabular-nums" style={{ color: moveColor(summary.gainPct) }}>{summary.gain >= 0 ? '+' : ''}{formatMoney(summary.gain, 'USD', true)} · {formatPct(summary.gainPct)}</div>
                <div className="text-[11px] text-paper-muted">{t('city.gain')}</div>
              </div>
            ) : sinceStart != null ? (
              <div className="text-end">
                <div className="text-[16px] font-black tabular-nums" style={{ color: moveColor(sinceStart) }}>{formatPct(sinceStart)}</div>
                <div className="text-[11px] text-paper-muted">{t('game.sinceStart')}</div>
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-[12.5px]">
            <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2 min-w-0">
              <div className="text-[10.5px] font-bold text-paper-muted">{t('hud.today')}</div>
              <div className="font-black tabular-nums truncate" style={{ color: moveColor(summary.dayPct) }}>{holdings.length ? formatPct(summary.dayPct) : '—'}</div>
            </div>
            <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2 min-w-0">
              <div className="text-[10.5px] font-bold text-paper-muted">{t('game.invested')}</div>
              <div className="font-black tabular-nums text-ink-900 truncate">{formatMoney(summary.valueUsd, 'USD', true)}</div>
            </div>
            <div className="rounded-2xl bg-paper-50 border border-paper-200 px-3 py-2 min-w-0">
              <div className="text-[10.5px] font-bold text-paper-muted">{t('game.cash')}</div>
              <div className="font-black tabular-nums text-ink-900 truncate">{formatMoney(cash, 'USD', true)}</div>
            </div>
          </div>
          <HistoryLine history={history} base={base} />
        </section>

        {/* the level, and today's two small tasks */}
        {!isShared && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-brand/12 text-brand-deep grid place-items-center text-[15px] font-black tabular-nums">{level.level}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-black text-ink-900">{loc(level.title)}</span>
                <span className="block text-[11.5px] text-paper-muted">{level.max ? t('hud.maxLevel') : t('hud.xpNext', { xp: level.need, n: level.level + 1 })}</span>
              </span>
              <span className="text-[12px] font-black text-paper-muted tabular-nums">{level.xp} XP</span>
            </div>
            <div className="mt-2 relative h-1.5 w-full rounded-full bg-paper-200 overflow-hidden">
              <span className="absolute inset-y-0 start-0 rounded-full bg-brand" style={{ width: `${level.max ? 100 : Math.round((level.into / Math.max(1, level.span)) * 100)}%` }} />
            </div>
            <h3 className="mt-4 text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('daily.title')}</h3>
            <ul className="mt-1.5 space-y-1.5">
              {daily.map((task) => {
                const done = dailyDone.has(task.id);
                return (
                  <li key={task.id}>
                    <button type="button" onClick={() => runDaily(task)} className={`w-full min-h-[48px] rounded-2xl border px-3 py-2 flex items-center gap-3 text-start ${done ? 'bg-paper-50 border-paper-200' : 'bg-white border-paper-200 shadow-card active:scale-[0.99] transition-transform'}`}>
                      <span className="text-xl leading-none">{done ? '✅' : task.emoji}</span>
                      <span className={`flex-1 text-[13px] font-black ${done ? 'text-paper-muted line-through' : 'text-ink-900'}`}>{loc(task.title)}</span>
                      <span className="text-[11px] font-bold text-brand-deep tabular-nums">+30 XP</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

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

        {/* where the money sits */}
        {allocation.rows.length > 0 && (
          <section id="allocation" className="rounded-3xl bg-white border border-paper-200 shadow-card p-4 scroll-mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted">{t('alloc.title')}</h3>
              {onHealth && (
                <button type="button" onClick={onHealth} className="text-[11.5px] font-black text-brand-deep">{t('health.title')}</button>
              )}
            </div>
            <ul className="mt-2 space-y-2">
              {allocation.rows.map(({ sector, usd, pct }) => (
                <li key={sector?.id ?? 'x'}>
                  <button type="button" onClick={() => setSectorFilter(sectorFilter === sector?.id ? null : sector?.id)} className="w-full text-start">
                    <span className="flex items-center justify-between text-[12.5px]">
                      <span className="font-black text-ink-900 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: sector?.color }} />{loc(sector?.name)}</span>
                      <span className="font-bold tabular-nums text-paper-muted">{formatMoney(usd, 'USD', true)} · <span className="text-ink-900">{pct.toFixed(0)}%</span></span>
                    </span>
                    <span className="block mt-1 h-2 rounded-full bg-paper-100 overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: sector?.color }} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* the holdings */}
        {holdings.length === 0 ? (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/12 text-brand-deep grid place-items-center"><Upload size={28} strokeWidth={2.2} aria-hidden="true" /></div>
            <h2 className="text-[16px] font-black text-ink-900 mt-2">{t('empty.connect')}</h2>
            <p className="text-[13px] text-paper-muted mt-1">{t('empty.connectBody')}</p>
            {!isShared && (
              <div className="flex gap-2 justify-center mt-4">
                <button type="button" onClick={onImport} className="h-12 px-5 rounded-2xl bg-brand text-white font-black text-[14px] shadow-fab">{t('empty.connectCta')}</button>
                <button type="button" onClick={onBuy} className="h-12 px-4 rounded-2xl bg-white border border-paper-200 text-ink-900 font-black text-[14px]">{t('directory.add')}</button>
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-2">
            <div className="flex items-center gap-1.5 px-1 pt-1 pb-2 overflow-x-auto">
              <ArrowDownUp size={14} className="shrink-0 text-paper-muted" aria-hidden="true" />
              {SORTS.map((id) => (
                <button key={id} type="button" onClick={() => setSort(id)} className={chip(sort === id)}>{t(`sort.${id}`)}</button>
              ))}
              <span className="w-px h-6 bg-paper-200 shrink-0 mx-0.5" aria-hidden="true" />
              {FILTERS.map((id) => (
                <button key={id} type="button" onClick={() => setFilter(id)} className={chip(filter === id)}>{t(`filter.${id}`)}</button>
              ))}
              {sectorFilter && (
                <button type="button" onClick={() => setSectorFilter(null)} className={chip(true)}>{loc(SECTOR_BY_ID[sectorFilter]?.name)} ×</button>
              )}
            </div>
            {sort === 'sector' ? (
              SECTORS.map((sector) => {
                const inSector = rows.filter(({ h }) => h.sector === sector.id);
                if (!inSector.length) return null;
                return (
                  <div key={sector.id}>
                    <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-paper-muted px-2 pt-1.5 pb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: sector.color }} />
                      {loc(sector.name)}
                    </h3>
                    <ul>{inSector.map(({ h, p }) => <Row key={h.symbol} h={h} p={p} />)}</ul>
                  </div>
                );
              })
            ) : (
              <ul>{rows.map(({ h, p }) => <Row key={h.symbol} h={h} p={p} />)}</ul>
            )}
            {rows.length === 0 && <p className="text-[12.5px] text-paper-muted px-3 py-3">{t('filter.none')}</p>}
          </section>
        )}

        {trades.length > 0 && (
          <section className="rounded-3xl bg-white border border-paper-200 shadow-card p-3">
            <h3 className="text-[11px] font-black uppercase tracking-wide text-paper-muted mb-1">{t('game.trades')}</h3>
            <ul className="divide-y divide-paper-100">
              {[...trades].reverse().slice(0, 8).map((tr, i) => (
                <li key={i} className="flex items-center gap-2 py-2 text-[12.5px]">
                  <span className={`font-black ${tr.side === 'buy' ? 'text-[#4caf7d]' : tr.side === 'dividend' ? 'text-[#b8860b]' : 'text-[#e2706f]'}`}>{t(tr.side === 'buy' ? 'game.buy' : tr.side === 'dividend' ? 'game.dividend' : 'game.sell')}</span>
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
          {!isShared && onImport && (
            <button type="button" onClick={onImport} className="w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-bold text-[13px] inline-flex items-center justify-center gap-2">
              <Download size={16} aria-hidden="true" />
              {t('import.button')}
            </button>
          )}
          {!isShared && onAccount && account?.ready && (
            <button type="button" onClick={onAccount} className="w-full h-11 rounded-2xl bg-white border border-paper-200 text-ink-900 font-bold text-[13px] inline-flex items-center justify-center gap-2">
              <UserCircle2 size={16} aria-hidden="true" />
              {account.session ? `${t('auth.title')} · ${account.session.user.email}` : t('friends.signInCta')}
            </button>
          )}
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
