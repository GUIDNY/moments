import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { OWNER, ZONE_BY_ID } from '../portfolio/projects';
import { useVisit } from '../portfolio/VisitContext';
import { DISTRICTS, districtAt } from './map-data';
import { playerPos } from '../world3d/playerPos';

const DISTRICT_COLOR = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.color]));

/**
 * Samples the shared player position a couple of times a second and only sets
 * state when the zone actually changes — walking must not re-render the app.
 */
function useCurrentZone() {
  const [zone, setZone] = useState(() => districtAt(playerPos.x, playerPos.z));
  useEffect(() => {
    const id = setInterval(() => {
      const next = districtAt(playerPos.x, playerPos.z);
      setZone((cur) => (cur === next ? cur : next));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return zone;
}

/**
 * One slim row over the town: whose work this is, which part of it you are
 * standing in, and how much of it you have seen. Everything else lives in
 * sheets, so the town keeps the screen.
 */
export default function CityHud({ onOpenAbout }) {
  const { t, loc } = useI18n();
  const { seenCount, total } = useVisit();
  const zoneId = useCurrentZone();
  const zone = ZONE_BY_ID[zoneId];
  const pct = total ? Math.round((seenCount / total) * 100) : 0;

  return (
    <header className="ui-layer absolute top-0 inset-x-0 z-30 pointer-events-none px-2.5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] md:px-4 md:pt-4">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {/* whose town this is — the ring fills as you see more of it */}
        <button
          type="button"
          onClick={onOpenAbout}
          aria-label={t('about.title')}
          className="pointer-events-auto relative shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip
            grid place-items-center active:scale-95 transition-transform"
        >
          <span className="text-[13px] md:text-sm font-black text-white leading-none">
            {loc(OWNER.name).trim().charAt(0) || '·'}
          </span>
          <span
            className="absolute -inset-px rounded-full"
            style={{
              background: `conic-gradient(#ff6b1a ${pct * 3.6}deg, transparent 0)`,
              WebkitMask: 'radial-gradient(circle, transparent 61%, #000 63%)',
              mask: 'radial-gradient(circle, transparent 61%, #000 63%)',
            }}
          />
        </button>

        {/* which zone you are standing in */}
        <div
          className="pointer-events-none flex min-w-0 items-center gap-1.5 h-10 md:h-11 px-3 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: DISTRICT_COLOR[zoneId] ?? '#ff6b1a' }}
          />
          <span className="text-[13px] font-bold text-white/95 truncate">
            {zone ? loc(zone.name) : t('app.name')}
          </span>
        </div>

        <div className="flex-1" />

        {/* how much of the work you have walked into */}
        <div
          className="pointer-events-none flex items-center gap-1.5 h-10 md:h-11 px-3.5 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip"
        >
          <span className="text-sm leading-none">🗂️</span>
          <span className="text-[13px] md:text-sm font-black text-white tabular-nums">
            {t('hud.seen', { n: seenCount, total })}
          </span>
        </div>
      </div>
    </header>
  );
}
