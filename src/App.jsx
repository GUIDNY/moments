import { useCallback, useEffect, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import { useCity } from './stocks/CityContext';
import { ACHIEVEMENT_BY_ID } from './stocks/achievements';
import BadgesScreen from './stocks/BadgesScreen';
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
  const { holdings, freshBadges, dismissBadge } = useCity();
  const [view, setView] = useState({ type: 'city' });
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);

  // badges are announced one at a time, oldest first
  const announcing = freshBadges.length ? ACHIEVEMENT_BY_ID[freshBadges[0]] : null;
  const doneAnnouncing = useCallback(() => {
    if (freshBadges.length) dismissBadge(freshBadges[0]);
  }, [freshBadges, dismissBadge]);

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
        />
        <CityHud onOpenPortfolio={() => setDirectoryOpen(true)} />
        <Directory
          open={directoryOpen}
          onClose={() => setDirectoryOpen(false)}
          onEnter={openHolding}
          onAdd={openPicker}
          onBadges={() => {
            setDirectoryOpen(false);
            setBadgesOpen(true);
          }}
        />
        <BadgesScreen open={badgesOpen} onClose={() => setBadgesOpen(false)} />
      </>
    );
  }

  return (
    <>
      {content}
      {announcing && (
        <Toast
          emoji={announcing.emoji}
          text={t('achv.unlocked', { name: loc(announcing.name) })}
          onDone={doneAnnouncing}
        />
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
