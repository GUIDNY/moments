import { useEffect, useState } from 'react';
import { avatarEmoji } from '../data/items';
import { formatCoins } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { DISTRICTS, districtAt } from './map-data';
import { playerPos } from '../world3d/playerPos';

const DISTRICT_COLOR = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.color]));

/**
 * Samples the shared player position a couple of times a second and only sets
 * state when the district actually changes — walking must not re-render the app.
 */
function useCurrentDistrict() {
  const [district, setDistrict] = useState(() => districtAt(playerPos.x, playerPos.z));
  useEffect(() => {
    const id = setInterval(() => {
      const next = districtAt(playerPos.x, playerPos.z);
      setDistrict((cur) => (cur === next ? cur : next));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return district;
}

/**
 * One slim row over the game: who you are, where you are, what you have.
 * Everything else lives in sheets, so the town keeps the screen.
 */
export default function CityHud({ onOpenProfile }) {
  const { state, levelInfo, dailyBonus } = useGame();
  const { t } = useI18n();
  const district = useCurrentDistrict();

  return (
    <header className="ui-layer absolute top-0 inset-x-0 z-30 pointer-events-none px-2.5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] md:px-4 md:pt-4">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        {/* identity — the level reads as a ring so the row stays one line high */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={state.name}
          className="pointer-events-auto relative shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip
            grid place-items-center active:scale-95 transition-transform"
        >
          <span className="text-xl md:text-2xl leading-none">{avatarEmoji(state.avatar)}</span>
          <span
            className="absolute -inset-px rounded-full"
            style={{
              background: `conic-gradient(#ff6b1a ${levelInfo.pct * 3.6}deg, transparent 0)`,
              WebkitMask: 'radial-gradient(circle, transparent 61%, #000 63%)',
              mask: 'radial-gradient(circle, transparent 61%, #000 63%)',
            }}
          />
          <span
            className="absolute -bottom-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-brand
              text-[10px] font-black text-white grid place-items-center tabular-nums shadow-chip"
          >
            {levelInfo.level}
          </span>
        </button>

        {/* where you are now */}
        <div
          className="pointer-events-none flex min-w-0 items-center gap-1.5 h-10 md:h-11 px-3 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: DISTRICT_COLOR[district] ?? '#ff6b1a' }}
          />
          <span className="text-[13px] font-bold text-white/95 truncate">
            {t(`district.${district}`)}
          </span>
          <span className="hidden sm:inline text-[11px] text-white/40 truncate">
            · {t('app.name')}
          </span>
        </div>

        <div className="flex-1" />

        {/* wallet — the daily bonus is a dot here instead of its own pill */}
        <div
          className="pointer-events-none relative flex items-center gap-1.5 h-10 md:h-11 px-3.5 rounded-full
            bg-ink-800/85 backdrop-blur-md border border-ink-line shadow-chip"
        >
          <span className="text-sm leading-none">🪙</span>
          <span className="text-[13px] md:text-sm font-black text-white tabular-nums">
            {formatCoins(state.coins)}
          </span>
          {dailyBonus.available && (
            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-ink-900 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
