import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useCity } from '../../stocks/CityContext';
import { DISTRICTS } from '../../city/layout';

/**
 * The neighbourhoods, as a row of chips over the city: one per district
 * with a building in it, biggest first, each with its share of the city.
 * A tap enters the district. The pills on the board say the same thing
 * from inside the picture; this row is for the thumb, always in reach.
 */
export default function DistrictBar({ selected, onSelect }) {
  const { loc } = useI18n();
  const { holdings, positions, totalUsd } = useCity();
  const rows = useMemo(() => {
    const by = new Map();
    for (const h of holdings) {
      const p = positions.find((x) => x.symbol === h.symbol);
      const usd = p && !p.missing && p.valueUsd != null ? p.valueUsd : 0;
      by.set(h.sector, (by.get(h.sector) || 0) + usd);
    }
    return DISTRICTS.filter((d) => by.has(d.sector))
      .map((d) => ({ ...d, usd: by.get(d.sector), pct: totalUsd > 0 ? Math.round((by.get(d.sector) / totalUsd) * 100) : null }))
      .sort((a, b) => b.usd - a.usd);
  }, [holdings, positions, totalUsd]);
  if (!rows.length) return null;
  return (
    <div className="ui-layer pointer-events-none absolute z-30 inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-24 ps-3 pe-[4.25rem] md:pe-4" data-testid="district-bar">
      <div className="pointer-events-auto flex gap-1.5 overflow-x-auto no-scrollbar py-1 -my-1">
        {rows.map((d) => {
          const on = selected === d.sector;
          return (
            <button
              key={d.sector}
              type="button"
              onClick={() => onSelect(d.sector)}
              aria-pressed={on}
              className={`shrink-0 h-9 ps-2.5 pe-3 rounded-full border shadow-card backdrop-blur-md inline-flex items-center gap-1.5 text-[12.5px] font-black active:scale-95 transition-transform ${on ? 'bg-ink-900 border-ink-900 text-white' : 'bg-white/95 border-paper-200 text-ink-900'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.tint }} />
              {loc(d.name)}
              {d.pct != null && <span className={`tabular-nums text-[11px] ${on ? 'text-white/70' : 'text-paper-muted'}`}>{d.pct}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
