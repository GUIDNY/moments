import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import { useCity } from './stocks/CityContext';
import { ACHIEVEMENT_BY_ID } from './stocks/achievements';
import BadgesScreen from './stocks/BadgesScreen';
import LearnScreen from './learn/LearnScreen';
import LessonSheet from './learn/LessonSheet';
import PickerScreen from './stocks/PickerScreen';
import { levelFor, xpFor } from './stocks/xp';
import InsightCard from './ui/game/InsightCard';
import CityScene from './city/CityScene';
import { goHome, zoomBy } from './world3d/focus';
import { Hammer, LocateFixed, Minus, Newspaper, Plus, Trophy, Users } from 'lucide-react';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import Toast from './ui/Toast';
import BottomNavigation from './ui/game/BottomNavigation';
import CityProfile from './ui/game/CityProfile';
import PortfolioHUD from './ui/game/PortfolioHUD';
import PortfolioView from './ui/game/PortfolioView';
import SoonScreen from './ui/game/SoonScreen';
import StockInfoPanel from './ui/game/StockInfoPanel';
import NewsSheet from './ui/game/NewsSheet';
import ImportSheet from './ui/game/ImportSheet';
import VisitCityMode from './ui/game/VisitCityMode';

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
  const { holdings, summary, cash, totalUsd, freshBadges, dismissBadge, current, dismissCurrent, readLesson, lastTrade, holdingOf, isShared, progress } = city;
  const compact = useIsCompact();

  const [tab, setTab] = useState('city');
  const [selected, setSelected] = useState(null); // symbol of the open building
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [newsSymbol, setNewsSymbol] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);

  /* one toast at a time: a trade just made, else a badge just won */
  const [seenTrade, setSeenTrade] = useState(null);
  const tradeToast = lastTrade && lastTrade.at !== seenTrade ? lastTrade : null;
  const badge = freshBadges.length ? ACHIEVEMENT_BY_ID[freshBadges[0]] : null;
  const toast = useMemo(
    () =>
      tradeToast
        ? {
            emoji: tradeToast.side === 'buy' ? '🧾' : '🏷️',
            text: t(tradeToast.side === 'buy' ? 'trade.bought' : 'trade.sold', {
              n: tradeToast.qty.toLocaleString(),
              name: loc(tradeToast.name || holdingOf(tradeToast.symbol)?.name) || tradeToast.symbol,
            }),
            done: () => setSeenTrade(tradeToast.at),
          }
        : badge
          ? { emoji: badge.emoji, text: t('achv.unlocked', { name: loc(badge.name) }), done: () => dismissBadge(freshBadges[0]) }
          : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tradeToast, badge, freshBadges, t, loc]
  );
  const toastDone = useCallback(() => toast?.done(), [toast]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) setWelcome(true);
    } catch {
      /* private mode — just skip the intro */
    }
  }, []);
  const closeWelcome = () => {
    setWelcome(false);
    try {
      localStorage.setItem(WELCOME_KEY, '1');
    } catch {
      /* ignore */
    }
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
  const onSelectBuilding = useCallback((b) => setSelected(b ? b.symbol : null), []);
  const level = levelFor(xpFor(progress, holdings.length));

  return (
    <div className="absolute inset-0 bg-[#9ec877] overflow-hidden">
      {/* the city is always mounted: switching tabs must not rebuild it */}
      <div className={tab === 'city' ? 'absolute inset-0' : 'absolute inset-0 invisible'}>
        <CityScene compact={compact} selected={selected} onSelectBuilding={onSelectBuilding} onSelectHQ={() => setTab('portfolio')} onSelectNews={() => setNewsOpen(true)} />
        <CityProfile name={null} level={level.level} onTap={() => setTab('portfolio')} />
        <PortfolioHUD
          totalUsd={totalUsd}
          dayUsd={summary.valueUsd && summary.value ? (summary.day / summary.value) * summary.valueUsd : 0}
          dayPct={holdings.length ? summary.dayPct : null}
          level={level}
          onOpen={() => setTab('portfolio')}
        />
        {!selected && <InsightCard onLesson={readLesson} onLearn={() => setLearnOpen(true)} />}
        {isShared && <VisitCityMode name={t('profile.myCity')} />}
        <div className="absolute z-30 end-3 md:end-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 flex flex-col gap-1.5">
          <button type="button" className={ZOOM_BTN} onClick={() => zoomBy(1.25)} aria-label="+"><Plus size={20} strokeWidth={2.6} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={() => zoomBy(0.8)} aria-label="−"><Minus size={20} strokeWidth={2.6} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={goHome} aria-label={t('city.home')}><LocateFixed size={19} strokeWidth={2.4} aria-hidden="true" /></button>
          <button type="button" className={ZOOM_BTN} onClick={() => { setNewsSymbol(null); setNewsOpen(true); }} aria-label={t('news.title')}><Newspaper size={19} strokeWidth={2.4} aria-hidden="true" /></button>
        </div>
        {holdings.length === 0 && !welcome && (
          <div className="absolute inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 flex justify-center px-4 pointer-events-none">
            <button type="button" onClick={goMarket} className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl bg-brand text-white font-black text-[14px] px-5 h-12 shadow-fab active:scale-95 transition-transform">
              <Hammer size={18} strokeWidth={2.4} aria-hidden="true" />
              {t('directory.add')}
            </button>
          </div>
        )}
        {selected && <StockInfoPanel symbol={selected} onClose={() => setSelected(null)} readOnly={isShared} onNews={(sym) => { setNewsSymbol(sym); setNewsOpen(true); }} onPortfolio={() => { setSelected(null); setTab('portfolio'); }} />}
      </div>

      {tab === 'portfolio' && (
        <PortfolioView onOpenStock={openStock} onBuy={goMarket} onLearn={() => setLearnOpen(true)} onBadges={() => setBadgesOpen(true)} onImport={() => setImportOpen(true)} />
      )}
      {tab === 'market' && (
        <div className="absolute inset-0">
          <PickerScreen onExit={() => setTab('city')} />
        </div>
      )}
      {tab === 'rankings' && <SoonScreen icon={Trophy} textKey="soon.rankings" />}
      {tab === 'friends' && <SoonScreen icon={Users} textKey="soon.friends" />}

      <BottomNavigation active={tab} onChange={(id) => { setSelected(null); setTab(id); }} />

      <BadgesScreen open={badgesOpen} onClose={() => setBadgesOpen(false)} />
      <LearnScreen open={learnOpen} onClose={() => setLearnOpen(false)} />
      <NewsSheet open={newsOpen} symbol={newsSymbol} onClose={() => { setNewsOpen(false); setNewsSymbol(null); }} />
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
      {toast && <Toast emoji={toast.emoji} text={toast.text} onDone={toastDone} />}
      {tab === 'city' && !welcome && <LessonSheet item={current} onDone={dismissCurrent} onReadLesson={readLesson} />}
      <Sheet open={welcome} onClose={closeWelcome} title={t('welcome.title')} tone="paper">
        <p className="text-[14px] text-ink-900/80 leading-relaxed">{t('welcome.body')}</p>
        <Button className="w-full mt-4" onClick={holdings.length ? closeWelcome : () => { closeWelcome(); goMarket(); }}>
          {holdings.length ? t('welcome.cta') : t('directory.add')}
        </Button>
      </Sheet>
    </div>
  );
}
