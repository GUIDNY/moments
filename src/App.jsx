import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import { useCity } from './stocks/CityContext';
import { ACHIEVEMENT_BY_ID } from './stocks/achievements';
import BadgesScreen from './stocks/BadgesScreen';
import LearnScreen from './learn/LearnScreen';
import LessonSheet from './learn/LessonSheet';
import PickerScreen from './stocks/PickerScreen';
import { levelFor, xpFor } from './stocks/xp';
import { formatMoney } from './stocks/money';
import InsightCard from './ui/game/InsightCard';
import CityScene from './city/CityScene';
import { frame, goHome, zoomBy } from './world3d/focus';
import { LocateFixed, Minus, Newspaper, Plus, Upload } from 'lucide-react';
import Toast from './ui/Toast';
import BottomNavigation from './ui/game/BottomNavigation';
import CityProfile from './ui/game/CityProfile';
import PortfolioHUD from './ui/game/PortfolioHUD';
import PortfolioView from './ui/game/PortfolioView';
import FriendsScreen from './ui/game/FriendsScreen';
import StockInfoPanel from './ui/game/StockInfoPanel';
import DistrictSheet from './ui/game/DistrictSheet';
import DistrictBar from './ui/game/DistrictBar';
import NewsSheet from './ui/game/NewsSheet';
import ImportFlow from './ui/game/ImportFlow';
import Onboarding from './ui/game/Onboarding';
import { HealthChip, HealthSheet } from './ui/game/HealthChip';
import VisitCityMode from './ui/game/VisitCityMode';
import AccountSheet from './ui/game/AccountSheet';
import CloudConflictSheet from './ui/game/CloudConflictSheet';

const WELCOME_KEY = 'stockcity.welcomed';

/** Phones get a bottom sheet instead of a side panel, and a lighter render budget. */
function useIsCompact() {
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return compact;
}

const ZOOM_BTN = 'ui-layer w-10 h-10 rounded-xl grid place-items-center bg-white/95 backdrop-blur-md border border-paper-200 shadow-card text-ink-900 active:scale-90 transition-transform';

export default function App() {
  const { t, loc } = useI18n();
  const city = useCity();
  const { holdings, summary, cash, totalUsd, freshBadges, dismissBadge, current, dismissCurrent, readLesson, lastTrade, lastDividend, holdingOf, isShared, progress, trades, positions, marketOpen, visitedMeta } = city;
  const [learnTab, setLearnTab] = useState('missions');
  const compact = useIsCompact();

  const [tab, setTab] = useState('city');
  const [selected, setSelected] = useState(null); // symbol of the open building
  const [district, setDistrict] = useState(null); // sector id of the open neighbourhood
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsSymbol, setNewsSymbol] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // a password-reset link opens the account sheet on its new-password form
  const recovery = city.account?.linkType === 'recovery';
  useEffect(() => {
    if (recovery) setAccountOpen(true);
  }, [recovery]);
  const [imported, setImported] = useState(null); // a count, toasted once

  /* one toast at a time: a trade just made, else a dividend just paid, else a badge just won */
  const [seenTrade, setSeenTrade] = useState(null);
  const [seenDividend, setSeenDividend] = useState(null);
  const tradeToast = lastTrade && lastTrade.at !== seenTrade ? lastTrade : null;
  const dividendToast = lastDividend && lastDividend.when !== seenDividend ? lastDividend : null;
  const badge = freshBadges.length ? ACHIEVEMENT_BY_ID[freshBadges[0]] : null;
  const toast = useMemo(
    () =>
      imported != null
        ? { emoji: '🏗️', text: t('import.done', { n: imported }), done: () => setImported(null) }
        : tradeToast
        ? {
            emoji: tradeToast.side === 'buy' ? '🧾' : '🏷️',
            text: t(tradeToast.side === 'buy' ? 'trade.bought' : 'trade.sold', {
              n: tradeToast.qty.toLocaleString(),
              name: loc(tradeToast.name || holdingOf(tradeToast.symbol)?.name) || tradeToast.symbol,
            }),
            done: () => setSeenTrade(tradeToast.at),
          }
        : dividendToast
          ? {
              emoji: '🪙',
              text: t('trade.dividend', { amount: formatMoney(dividendToast.valueUsd, 'USD'), name: loc(holdingOf(dividendToast.symbol)?.name) || dividendToast.symbol }),
              done: () => setSeenDividend(dividendToast.when),
            }
        : badge
          ? { emoji: badge.emoji, text: t('achv.unlocked', { name: loc(badge.name) }), done: () => dismissBadge(freshBadges[0]) }
          : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tradeToast, dividendToast, badge, freshBadges, t, loc, imported]
  );
  const toastDone = useCallback(() => toast?.done(), [toast]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) setWelcome(true);
    } catch {
      /* private mode — just skip the intro */
    }
  }, []);
  const closeWelcome = (connect = false) => {
    setWelcome(false);
    try {
      localStorage.setItem(WELCOME_KEY, '1');
    } catch {
      /* ignore */
    }
    if (connect && !holdings.length) setImportOpen(true);
  };

  // a building that was sold out from under the panel closes it
  useEffect(() => {
    if (selected && !holdingOf(selected)) setSelected(null);
  }, [holdings, selected, holdingOf]);

  const openStock = useCallback((symbol) => {
    setTab('city');
    setSelected(symbol);
  }, []);
  const goMarket = useCallback(() => {
    setSelected(null);
    setTab('market');
  }, []);
  const onSelectBuilding = useCallback((b) => {
    setDistrict(null);
    setSelected(b ? b.symbol : null);
  }, []);
  // a tap on a district's name: the camera goes in, the neighbourhood's sheet opens
  const onSelectDistrict = useCallback((d) => {
    setSelected(null);
    setDistrict(d.sector);
    frame(d.cx, d.cz, Math.max(d.x1 - d.x0, d.y1 - d.y0) + 2);
  }, []);
  const openDistrict = useCallback((sector) => {
    const d = window.__plan?.districts?.find((x) => x.sector === sector);
    setTab('city');
    setSelected(null);
    setDistrict(sector);
    if (d) frame(d.cx, d.cz, d.span);
  }, []);
  const level = levelFor(xpFor(progress, { holdings, trades, positions, totalUsd }));

  return (
    <div className="absolute inset-0 bg-[#9ec877] overflow-hidden">
      {/* the city is always mounted: switching tabs must not rebuild it */}
      <div className={tab === 'city' ? 'absolute inset-0' : 'absolute inset-0 invisible'}>
        <CityScene compact={compact} selected={selected} district={district} onSelectBuilding={onSelectBuilding} onSelectDistrict={onSelectDistrict} onSelectHQ={() => setTab('portfolio')} onSelectNews={() => setNewsOpen(true)} />
        <CityProfile name={isShared ? visitedMeta?.name || null : city.name || null} level={isShared ? visitedMeta?.level ?? 1 : level.level} onTap={() => setTab('portfolio')} />
        <PortfolioHUD
          totalUsd={totalUsd}
          hideAmounts={isShared && visitedMeta?.privacy === 'city'}
          gainPct={holdings.length ? summary.gainPct : null}
          baseUsd={city.history?.[0]?.total ?? undefined}
          cash={cash}
          dayUsd={summary.valueUsd && summary.value ? (summary.day / summary.value) * summary.valueUsd : 0}
          dayPct={holdings.length ? summary.dayPct : null}
          level={level}
          open={marketOpen}
          onOpen={() => setTab('portfolio')}
        />
        {!selected && !district && <InsightCard onLesson={readLesson} onLearn={() => setLearnOpen(true)} />}
        {/* the neighbourhoods, in reach of the thumb */}
        {holdings.length > 0 && !selected && !welcome && <DistrictBar selected={district} onSelect={openDistrict} />}
        {holdings.length > 0 && (
          <div className="absolute z-30 start-3 md:start-4 top-[calc(3.6rem+env(safe-area-inset-top,0px))] md:top-16 pointer-events-none">
            <HealthChip onOpen={() => setHealthOpen(true)} />
          </div>
        )}
        {isShared && <VisitCityMode name={visitedMeta?.name || t('friends.unnamed')} cityOnly={visitedMeta?.privacy === 'city'} onLeave={() => window.location.assign(window.location.pathname)} />}
        <div className="absolute z-30 end-3 md:end-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 flex flex-col gap-1.5">
          <button type="button" className={ZOOM_BTN} onClick={() => zoomBy(1.25)} aria-label="+"><Plus size={20} strokeWidth={2.6} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={() => zoomBy(0.8)} aria-label="−"><Minus size={20} strokeWidth={2.6} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={goHome} aria-label={t('city.home')}><LocateFixed size={19} strokeWidth={2.4} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={() => { setNewsSymbol(null); setNewsOpen(true); }} aria-label={t('news.title')}><Newspaper size={19} strokeWidth={2.4} aria-hidden="true" /></button>
        </div>
        {holdings.length === 0 && !welcome && !isShared && (
          <div className="absolute inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-sm w-full rounded-3xl bg-white/95 backdrop-blur-md border border-paper-200 shadow-card p-4 text-center">
              <h2 className="text-[15px] font-black text-ink-900">{t('empty.connect')}</h2>
              <p className="text-[12.5px] text-paper-muted mt-0.5">{t('empty.connectBody')}</p>
              <button type="button" onClick={() => setImportOpen(true)} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-white font-black text-[14px] h-12 shadow-fab active:scale-[0.98] transition-transform">
                <Upload size={18} strokeWidth={2.4} aria-hidden="true" />
                {t('empty.connectCta')}
              </button>
            </div>
          </div>
        )}
        {district && !selected && <DistrictSheet sector={district} onClose={() => setDistrict(null)} onOpenStock={(sym) => { setDistrict(null); setSelected(sym); }} onLesson={readLesson} />}
        {selected && <StockInfoPanel symbol={selected} onClose={() => setSelected(null)} readOnly={isShared} onNews={(sym) => { setNewsSymbol(sym); setNewsOpen(true); }} onPortfolio={() => { setSelected(null); setTab('portfolio'); }} />}
      </div>

      {tab === 'portfolio' && (
        <PortfolioView
          onOpenStock={openStock}
          onBuy={goMarket}
          onLearn={() => { setLearnTab('missions'); setLearnOpen(true); }}
          onGlossary={() => { setLearnTab('glossary'); setLearnOpen(true); }}
          onLesson={(id) => { setTab('city'); readLesson(id); }}
          onBadges={() => setBadgesOpen(true)}
          onImport={() => setImportOpen(true)}
          onHealth={() => setHealthOpen(true)}
          onNews={(sym) => { setNewsSymbol(sym ?? null); setNewsOpen(true); }}
          onAccount={() => setAccountOpen(true)}
          onOpenSector={openDistrict}
        />
      )}
      {tab === 'market' && (
        <div className="absolute inset-0">
          <PickerScreen onExit={() => setTab('city')} />
        </div>
      )}
      {tab === 'rankings' && <FriendsScreen mode="rankings" onAccount={() => setAccountOpen(true)} />}
      {tab === 'friends' && <FriendsScreen mode="friends" onAccount={() => setAccountOpen(true)} />}

      <BottomNavigation active={tab} onChange={(id) => { setSelected(null); setDistrict(null); setTab(id); }} />

      <BadgesScreen open={badgesOpen} onClose={() => setBadgesOpen(false)} />
      <LearnScreen open={learnOpen} initialTab={learnTab} onClose={() => setLearnOpen(false)} />
      <NewsSheet open={newsOpen} symbol={newsSymbol} onClose={() => { setNewsOpen(false); setNewsSymbol(null); }} />
      <ImportFlow open={importOpen} onClose={(n) => { setImportOpen(false); if (Number.isFinite(n)) { setImported(n); setTab('city'); setSelected(null); } }} onManual={goMarket} />
      <HealthSheet open={healthOpen} onClose={() => setHealthOpen(false)} onLesson={readLesson} />
      <AccountSheet open={accountOpen} mode={recovery ? 'recovery' : 'signin'} onClose={() => { setAccountOpen(false); city.account?.clearLink?.(); }} />
      {!isShared && <CloudConflictSheet />}
      {toast && <Toast emoji={toast.emoji} text={toast.text} onDone={toastDone} />}
      {tab === 'city' && !welcome && <LessonSheet item={current} onDone={dismissCurrent} onReadLesson={readLesson} />}
      {welcome && <Onboarding onDone={closeWelcome} />}
    </div>
  );
}
