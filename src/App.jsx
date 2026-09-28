import { useCallback, useEffect, useState } from 'react';
import { GAMES_BY_ID } from './games/registry';
import { useGame } from './engine/GameContext';
import BankScreen from './screens/BankScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Toasts from './ui/Toasts';
import CityHud from './world/CityHud';
import Directory from './world/Directory';
import World3D from './world3d/World3D';

const SCREENS = {
  bank: BankScreen,
  shop: ShopScreen,
  profile: ProfileScreen,
};

const WELCOME_KEY = 'candle_city_welcomed';

export default function App() {
  const { state } = useGame();
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

      <Modal open={welcome} onClose={closeWelcome}>
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">🏙️</div>
          <h2 className="text-2xl font-bold text-text mb-2">ברוך הבא לעיר הנרות</h2>
          <p className="text-sm text-text-2 mb-5 leading-relaxed">
            עיר שלמה של משחקוני בורסה. בכל בניין מחכה משחקון אחר — וכל משחקון משלם
            במטבעות. תלמד לקרוא גרפים, תאסוף מטבעות, תקנה דמויות וחפצי מזל, ותטפס ברמות.
          </p>
          <div className="text-right text-sm text-text-2 bg-surface rounded-xl p-4 space-y-2 mb-5">
            <p>🚶 הזז את הדמות עם החיצים, WASD או לחיצה על המפה</p>
            <p>🚪 היכנס דרך הדלת המהבהבת של כל בניין</p>
            <p>🗺️ &quot;מדריך העיר&quot; מראה מה יש בכל מקום ונותן כניסה מהירה</p>
            <p>🎁 בבנק מחכה בונוס יומי — כל יום ברצף שווה יותר</p>
          </div>
          <Button className="w-full" onClick={closeWelcome}>
            יאללה, לעיר ←
          </Button>
          <p className="text-[11px] text-text-3 mt-3">
            המשחק נשמר בדפדפן שלך ({state.name}). אין צורך בחשבון.
          </p>
        </div>
      </Modal>
    </div>
  );
}
