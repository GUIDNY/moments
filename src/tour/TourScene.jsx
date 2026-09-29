import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Home from './Home';
import SurveyedHome from './SurveyedHome';
import AdaptiveFov from './engine/AdaptiveFov';
import Stick from './engine/Stick';
import Viewer from './engine/Viewer';
import { addLook, attachKeyboard } from './engine/controls';

/**
 * The canvas plus its controls — shared by the tour and the studio preview.
 *
 * Two kinds of plan arrive here. One was surveyed from the agent's photographs
 * and carries a colour for every surface; the other was generated from the
 * builder's form and is what the preview shows before any photograph exists.
 * They are different enough to draw that each has its own renderer.
 */
export default function TourScene({ plan, compact = false, stickBottom }) {
  const last = useRef(null);

  useEffect(() => attachKeyboard(), []);

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

  return (
    <div
      className="absolute inset-0"
      onMouseDown={(e) => {
        last.current = { x: e.clientX, y: e.clientY, id: 'mouse' };
      }}
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        last.current = { x: t.clientX, y: t.clientY, id: t.identifier };
      }}
    >
      <Canvas
        shadows
        dpr={[1, compact ? 1.5 : 1.75]}
        camera={{ fov: 68, near: 0.05, far: 70, position: [plan.spawn.x, 1.62, plan.spawn.z] }}
        gl={{ antialias: true }}
      >
        <AdaptiveFov />
        <color attach="background" args={['#9fc4e2']} />
        <ambientLight intensity={0.52} color="#fff0e0" />
        <hemisphereLight args={['#dbeaff', '#6d6154', 0.8]} />
        <directionalLight
          position={[plan.W / 2, 4.4, plan.D + 12]}
          intensity={1.8}
          color="#fff3e4"
          castShadow
          shadow-mapSize={[1536, 1536]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={7}
          shadow-camera-bottom={-4}
          shadow-camera-far={34}
        />
        <Suspense fallback={null}>
          {plan.fromPhotos ? <SurveyedHome plan={plan} /> : <Home plan={plan} />}
          <Viewer start={plan.spawn} canStand={plan.canStand} />
        </Suspense>
      </Canvas>

      <Stick bottom={stickBottom} />
    </div>
  );
}
