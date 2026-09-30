import { useCallback, useEffect, useState } from 'react';
import { useI18n } from './i18n/I18nContext';
import AboutScreen from './portfolio/AboutScreen';
import ContactScreen from './portfolio/ContactScreen';
import ProjectScreen from './portfolio/ProjectScreen';
import { PROJECTS_BY_ID } from './portfolio/projects';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import Toasts from './ui/Toasts';
import CityHud from './world/CityHud';
import Directory from './world/Directory';
import World3D from './world3d/World3D';

const SCREENS = { about: AboutScreen, contact: ContactScreen };

const WELCOME_KEY = 'portfolio.welcomed';

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
    else if (PROJECTS_BY_ID[targetId]) setView({ type: 'project', id: targetId });
  }, []);

  const backToTown = useCallback(() => setView({ type: 'world' }), []);

  let content;
  if (view.type === 'project') {
    content = (
      <ProjectScreen key={view.id} project={PROJECTS_BY_ID[view.id]} onExit={backToTown} />
    );
  } else if (view.type === 'screen') {
    const Screen = SCREENS[view.id];
    content = <Screen onExit={backToTown} />;
  } else {
    content = (
      <>
        <World3D
          onEnter={(building) => open(building.target)}
          onOpenDirectory={() => setDirectoryOpen(true)}
        />
        <CityHud onOpenAbout={() => open('about')} />
        <Directory open={directoryOpen} onClose={() => setDirectoryOpen(false)} onEnter={open} />
      </>
    );
  }

  return (
    <>
      {content}
      <Toasts />
      <Sheet open={welcome} onClose={closeWelcome} title={t('welcome.title')} tone="paper">
        <p className="text-[14px] text-ink-900/80 leading-relaxed">{t('welcome.body')}</p>
        <Button className="w-full mt-4" onClick={closeWelcome}>
          {t('welcome.cta')}
        </Button>
      </Sheet>
    </>
  );
}
