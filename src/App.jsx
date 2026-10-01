import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import { useCity } from './stocks/CityContext';
import { ACHIEVEMENT_BY_ID } from './stocks/achievements';
import BadgesScreen from './stocks/BadgesScreen';
import LearnScreen from './learn/LearnScreen';
import LessonSheet from './learn/LessonSheet';
import HoldingScreen from './stocks/HoldingScreen';
import PickerScreen from './stocks/PickerScreen';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import Toast from './ui/Toast';
import CityHud from './world/CityHud';
import Directory from './world/Directory';
import World3D from './world3d/World3D';

const WELCOME_KEY = 'stockcity.welcomed';

export default function App() {
  const { t, loc } = useI18n();
  const { holdings, freshBadges, dismissBadge, current, dismissCurrent, readLesson, lastTrade, holdingOf } = useCity();
  const [view, setView] = useState({ type: 'city' });
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
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

  const openHolding = useCallback((symbol) => {
    setDirectoryOpen(false);
    setView({ type: 'holding', symbol });
  }, []);

  const openPicker = useCallback(() => {
    setDirectoryOpen(false);
    setView({ type: 'picker' });
  }, []);

  const backToCity = useCallback(() => setView({ type: 'city' }), []);

  let content;
  if (view.type === 'holding') {
    content = <HoldingScreen key={view.symbol} symbol={view.symbol} onExit={backToCity} />;
  } else if (view.type === 'picker') {
    content = <PickerScreen onExit={backToCity} />;
  } else {
    content = (
      <>
        <World3D
          onEnter={(building) => openHolding(building.symbol)}
          onOpenDirectory={() => setDirectoryOpen(true)}
          onBuild={openPicker}
        />
        <CityHud onOpenPortfolio={() => setDirectoryOpen(true)} onLearn={() => setLearnOpen(true)} />
        <Directory
          open={directoryOpen}
          onClose={() => setDirectoryOpen(false)}
          onEnter={openHolding}
          onAdd={openPicker}
          onBadges={() => {
            setDirectoryOpen(false);
            setBadgesOpen(true);
          }}
          onLearn={() => {
            setDirectoryOpen(false);
            setLearnOpen(true);
          }}
        />
        <BadgesScreen open={badgesOpen} onClose={() => setBadgesOpen(false)} />
        <LearnScreen open={learnOpen} onClose={() => setLearnOpen(false)} />
      </>
    );
  }

  return (
    <>
      {content}
      {toast && <Toast emoji={toast.emoji} text={toast.text} onDone={toastDone} />}
      {/* lessons and finished missions, one at a time, only in the city */}
      {view.type === 'city' && !welcome && (
        <LessonSheet item={current} onDone={dismissCurrent} onReadLesson={readLesson} />
      )}
      <Sheet open={welcome} onClose={closeWelcome} title={t('welcome.title')} tone="paper">
        <p className="text-[14px] text-ink-900/80 leading-relaxed">{t('welcome.body')}</p>
        <Button className="w-full mt-4" onClick={holdings.length ? closeWelcome : () => { closeWelcome(); openPicker(); }}>
          {holdings.length ? t('welcome.cta') : t('directory.add')}
        </Button>
      </Sheet>
    </>
  );
}
