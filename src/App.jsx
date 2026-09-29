import { useCallback, useEffect, useState } from 'react';
import { GAMES_BY_ID } from './games/registry';
import { useI18n } from './i18n/I18nContext';
import BankScreen from './screens/BankScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import Toasts from './ui/Toasts';
import CityHud from './world/CityHud';
import Directory from './world/Directory';
import World3D from './world3d/World3D';

const SCREENS = {
  bank: BankScreen,
  shop: ShopScreen,
  profile: ProfileScreen,
};

const WELCOME_KEY = 'playtown_welcomed';

export default function App() {
  const { t } = useI18n();
  const [view, setView] = useState({ type: 'world' });
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);

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

  const open = useCallback((targetId) => {
    setDirectoryOpen(false);
    if (SCREENS[targetId]) setView({ type: 'screen', id: targetId });
    else if (GAMES_BY_ID[targetId]) setView({ type: 'game', id: targetId });
  }, []);

  const backToCity = useCallback(() => setView({ type: 'world' }), []);

  let content;
  if (view.type === 'game') {
    const meta = GAMES_BY_ID[view.id];
    const Game = meta.component;
    content = <Game key={meta.id} meta={meta} onExit={backToCity} />;
  } else if (view.type === 'screen') {
    const Screen = SCREENS[view.id];
    content = <Screen onExit={backToCity} />;
  } else {
    content = (
      <>
        <World3D onEnter={(building) => open(building.target)} onOpenDirectory={() => setDirectoryOpen(true)} />
        <CityHud onOpenProfile={() => open('profile')} />
        <Directory open={directoryOpen} onClose={() => setDirectoryOpen(false)} onEnter={open} />
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface text-text font-body overflow-hidden">
      {content}
      <Toasts />

      <Sheet open={welcome} onClose={closeWelcome} tone="paper" labelledBy="welcome-title">
        <div className="px-5 pb-5 pt-1 md:pt-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-brand/10 grid place-items-center text-4xl mb-3">
            🏙️
          </div>
          <h2 id="welcome-title" className="text-xl font-black text-ink-900 mb-1.5">
            {t('welcome.title')}
          </h2>
          <p className="text-[13px] text-paper-muted leading-relaxed mb-4">{t('welcome.body')}</p>

          <ul className="text-start bg-paper-50 rounded-2xl p-3.5 space-y-2 mb-4">
            {['welcome.move', 'welcome.door', 'welcome.guide', 'welcome.bonus'].map((key) => (
              <li key={key} className="text-[13px] text-ink-900/80 leading-snug">
                {t(key)}
              </li>
            ))}
          </ul>

          <Button variant="brand" className="w-full py-3.5" onClick={closeWelcome}>
            {t('welcome.cta')}
          </Button>
          <p className="text-[11px] text-paper-muted mt-2.5">{t('welcome.saved')}</p>
        </div>
      </Sheet>
    </div>
  );
}
