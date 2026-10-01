import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SECTOR_BY_ID } from '../stocks/catalog';
import { useCity } from '../stocks/CityContext';
import { formatMoney, formatPct } from '../stocks/money';
import { moveColor } from '../stocks/towers';
import { STARTING_CASH } from '../stocks/store';
import { DISTRICTS, districtAt } from './map-data';
import { playerPos } from '../world3d/playerPos';

const DISTRICT_COLOR = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.color]));

/**
 * Samples the shared player position a couple of times a second and only sets
 * state when the sector actually changes — walking must not re-render the app.
 */
function useCurrentSector() {
  const [sector, setSector] = useState(() => districtAt(playerPos.x, playerPos.z));
  useEffect(() => {
    const id = setInterval(() => {
      const next = districtAt(playerPos.x, playerPos.z);
      setSector((cur) => (cur === next ? cur : next));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return sector;
}

/**
 * One slim row over the city: what the whole thing is worth, how the day has
 * gone, and which district you are standing in. The two numbers anyone opens
 * this for are the two numbers on screen at all times.
 */
export default function CityHud({ onOpenPortfolio, onLearn }) {
  const { t, loc } = useI18n();
  const { summary, holdings, loading, totalUsd, cash, nextMission } = useCity();
  const sinceStart = totalUsd != null ? ((totalUsd - STARTING_CASH) / STARTING_CASH) * 100 : null;
  const sectorId = useCurrentSector();
  const sector = SECTOR_BY_ID[sectorId];
  const empty = holdings.length === 0;

  return (
    <header className="ui-layer absolute top-0 inset-x-0 z-30 pointer-events-none px-2.5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] md:px-4 md:pt-4">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {/* the portfolio, as one tap and two numbers */}
        <button
          type="button"
          onClick={onOpenPortfolio}
          aria-label={t('directory.title')}
          className="pointer-events-auto flex min-w-0 items-center gap-2 h-11 md:h-12 px-3.5 rounded-2xl
            bg-white/92 backdrop-blur-md border border-paper-200 shadow-card
            active:scale-[0.98] transition-transform"
        >
          <span className="text-start min-w-0">
            {/* the score: everything you have in dollars, and how far from the start */}
            <span className="block text-[14px] md:text-[15px] font-black text-ink-900 tabular-nums leading-tight">
              {totalUsd != null ? formatMoney(totalUsd, 'USD', true) : empty ? t('hud.empty') : '…'}
            </span>
            {sinceStart != null && (
              <span
                className="block text-[11.5px] font-bold tabular-nums leading-tight"
                style={{ color: moveColor(sinceStart) }}
              >
                {formatPct(sinceStart)} {t('game.sinceStart')}
                {!empty && <span className="text-paper-muted"> · </span>}
                {!empty && <span style={{ color: moveColor(summary.dayPct) }}>{formatPct(summary.dayPct)} {t('city.today')}</span>}
              </span>
            )}
          </span>
          {loading && (
            <span className="w-3 h-3 shrink-0 rounded-full border-2 border-ink-900/25 border-t-transparent animate-spin" />
          )}
        </button>

        {/* the purse, the way a builder's game shows its resources */}
        <div className="pointer-events-none flex items-center gap-1.5 h-11 md:h-12 px-3 rounded-2xl bg-white/92 backdrop-blur-md border border-paper-200 shadow-card">
          <span className="text-base leading-none">💵</span>
          <span className="text-start">
            <span className="block text-[10px] font-bold text-paper-muted leading-tight">{t('game.cash')}</span>
            <span className="block text-[12.5px] font-black text-ink-900 tabular-nums leading-tight">{formatMoney(cash, 'USD', true)}</span>
          </span>
        </div>

        <div className="flex-1" />

        {/* which district you are looking at */}
        {!empty && sector && (
          <div
            className="pointer-events-none flex min-w-0 items-center gap-1.5 h-11 md:h-12 px-3 rounded-2xl
              bg-white/92 backdrop-blur-md border border-paper-200 shadow-card"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: DISTRICT_COLOR[sectorId] ?? '#ff6b1a' }}
            />
            <span className="text-[12.5px] font-bold text-ink-900/90 truncate">
              {loc(sector.name)}
            </span>
          </div>
        )}
      </div>

      {/* the next thing to do, where a builder's game keeps its quest */}
      {nextMission && (
        <div className="flex max-w-3xl mx-auto mt-2">
          <button
            type="button"
            onClick={onLearn}
            className="pointer-events-auto flex items-center gap-2 h-10 ps-2.5 pe-3.5 rounded-2xl bg-white/92 backdrop-blur-md border border-brand/60 shadow-card text-start active:scale-[0.98] transition-transform max-w-full"
          >
            <span className="text-lg leading-none">{nextMission.emoji}</span>
            <span className="min-w-0">
              <span className="block text-[9.5px] font-black uppercase tracking-wide text-brand-deep leading-tight">{t('learn.mission')}</span>
              <span className="block text-[12px] font-black text-ink-900 leading-tight truncate">{loc(nextMission.title)}</span>
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
