import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Apartment from './Apartment';
import AdaptiveFov from '../tour/engine/AdaptiveFov';
import Stick from '../tour/engine/Stick';
import Viewer from '../tour/engine/Viewer';
import { ZONES, SPAWN, canStand } from './plan';
import { addLook, attachKeyboard, goTo } from '../tour/engine/controls';

const LANG = (() => {
  try {
    const n = (navigator.language || '').toLowerCase();
    return n.startsWith('he') || n.startsWith('iw') ? 'he' : 'en';
  } catch {
    return 'en';
  }
})();

const T = {
  en: {
    title: 'Apartment tour',
    sub: 'Drag to look · joystick or WASD to walk',
    entry: 'Entrance',
    kitchen: 'Kitchen',
    bunks: 'Beds',
    bathroom: 'Shower room',
    living: 'Living area',
    window: 'The view',
  },
  he: {
    title: 'סיור בדירה',
    sub: 'גרור כדי להסתכל · ג׳ויסטיק או WASD כדי ללכת',
    entry: 'הכניסה',
    kitchen: 'המטבח',
    bunks: 'המיטות',
    bathroom: 'המקלחת',
    living: 'הסלון',
    window: 'הנוף',
  },
}[LANG];

/** Drag anywhere on the scene to turn your head. */
function useLookDrag() {
  const last = useRef(null);

  useEffect(() => {
    const move = (x, y) => {
      if (!last.current) return;
      addLook((x - last.current.x) * 0.0045, (y - last.current.y) * 0.0045);
      last.current.x = x;
      last.current.y = y;
    };
    const onMouseMove = (e) => move(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (!last.current) return;
      const t = [...e.touches].find((x) => x.identifier === last.current.id);
      if (t) move(t.clientX, t.clientY);
    };
    const end = () => {
      last.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
      end();
    };
  }, []);

  return {
    onMouseDown: (e) => {
      last.current = { x: e.clientX, y: e.clientY, id: 'mouse' };
    },
    onTouchStart: (e) => {
      const t = e.changedTouches[0];
      last.current = { x: t.clientX, y: t.clientY, id: t.identifier };
    },
  };
}

export default function App() {
  const lookHandlers = useLookDrag();
  const [zone, setZone] = useState(SPAWN.id);

  useEffect(() => attachKeyboard(), []);
  useEffect(() => {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === 'he' ? 'rtl' : 'ltr';
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0d1017] overflow-hidden touch-none select-none">
      <div className="absolute inset-0" {...lookHandlers}>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 66, near: 0.05, far: 60, position: [SPAWN.x, 1.62, SPAWN.z] }}
          gl={{ antialias: true }}
        >
          <AdaptiveFov />
          <color attach="background" args={['#9fc4e2']} />

          {/* daylight pours in through the balcony window */}
          <ambientLight intensity={0.5} color="#ffeede" />
          <hemisphereLight args={['#dbeaff', '#6d6154', 0.75]} />
          <directionalLight
            position={[2.2, 4.2, 13]}
            intensity={1.9}
            color="#fff3e4"
            castShadow
            shadow-mapSize={[1536, 1536]}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-3}
            shadow-camera-far={26}
          />

          <Suspense fallback={null}>
            <Apartment />
            <Viewer start={SPAWN} canStand={canStand} />
          </Suspense>
        </Canvas>
      </div>

      {/* header */}
      <header className="ui-layer absolute top-0 inset-x-0 z-20 pointer-events-none px-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="h-10 px-3.5 rounded-full bg-ink-800/80 backdrop-blur-md border border-ink-line shadow-chip flex items-center gap-2">
            <span className="text-base leading-none">🏔️</span>
            <span className="text-[13px] font-black text-white">{T.title}</span>
          </span>
          <span className="hidden sm:flex h-10 px-3 rounded-full bg-ink-800/70 backdrop-blur-md border border-ink-line items-center">
            <span className="text-[12px] text-white/60">{T.sub}</span>
          </span>
        </div>
      </header>

      <Stick />

      {/* jump straight to a part of the flat */}
      <nav className="ui-layer absolute z-20 inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] px-3">
        <div className="max-w-2xl mx-auto flex gap-1.5 overflow-x-auto pb-1 justify-start md:justify-center [scrollbar-width:none]">
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                goTo(z);
                setZone(z.id);
              }}
              className={`shrink-0 h-10 ps-2.5 pe-3.5 rounded-full flex items-center gap-1.5
                border backdrop-blur-md text-[13px] font-bold transition-colors
                ${
                  zone === z.id
                    ? 'bg-brand text-white border-brand shadow-fab'
                    : 'bg-ink-800/80 text-white/90 border-ink-line shadow-chip'
                }`}
            >
              <span className="text-base leading-none">{z.emoji}</span>
              {T[z.id]}
            </button>
          ))}
        </div>
      </nav>

      <p className="sm:hidden absolute z-10 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] inset-x-0 text-center text-[11px] text-white/45 pointer-events-none">
        {T.sub}
      </p>
    </div>
  );
}
