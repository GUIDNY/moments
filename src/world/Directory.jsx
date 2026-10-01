import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { SECTORS, SECTOR_BY_ID } from '../stocks/catalog';
import { useCity } from '../stocks/CityContext';
import { formatMoney, formatPct } from '../stocks/money';
import { moveColor } from '../stocks/towers';
import { ACHIEVEMENTS } from '../stocks/achievements';
import Sheet from '../ui/Sheet';

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

export default function Directory({ open, onClose, onEnter, onAdd, onBadges }) {
  const { t, loc } = useI18n();
  const { holdings, positionOf, summary, display, shareUrl, isShared, delayed, error, progress } = useCity();
  const [copied, setCopied] = useState(false);

  const share = () => {
    const url = shareUrl();
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }, () => {});
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('directory.title')} tone="paper">
      {holdings.length === 0 ? (
        <>
          <p className="text-[13px] text-paper-muted -mt-2 mb-4">{t('directory.empty')}</p>
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
          {/* the whole thing, before any of the parts */}
          <div className="rounded-2xl bg-paper-50 border border-paper-200 p-3.5 -mt-1 mb-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-paper-muted">
              {t('city.value')}
            </div>
            <div className="text-[24px] font-black text-ink-900 tabular-nums leading-tight">
              {formatMoney(summary.value, display)}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[12.5px] font-bold tabular-nums">
              <span style={{ color: moveColor(summary.dayPct) }}>
                {formatPct(summary.dayPct)} {t('city.today')}
              </span>
              {summary.gainPct != null && (
                <span style={{ color: moveColor(summary.gainPct) }}>
                  {formatPct(summary.gainPct)} {t('city.gain')}
                </span>
              )}
            </div>
          </div>

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
