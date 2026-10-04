import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * The city's light, by the market's clock. Open: a warm, low afternoon sun
 * with long soft shadows. Closed: the same sun a touch lower, cooler and
 * quieter, with a bluer sky — a city after hours, not a night mode. The two
 * are eased between in the frame loop, so the change on a reload is a
 * moment and not a cut.
 */
const OPEN = { sun: new THREE.Color('#ffe7c2'), sunI: 2.1, sky: new THREE.Color('#e6f3ff'), skyI: 0.75, amb: 0.5, y: 26 };
const CLOSED = { sun: new THREE.Color('#dfe3f0'), sunI: 1.55, sky: new THREE.Color('#cfdcf2'), skyI: 0.6, amb: 0.42, y: 20 };

export default function Daylight({ open = true, compact }) {
  const sun = useRef();
  const sky = useRef();
  const amb = useRef();
  const k = useRef(open ? 1 : 0);
  useFrame(() => {
    const want = open ? 1 : 0;
    if (Math.abs(k.current - want) < 0.002) return;
    k.current += (want - k.current) * 0.04;
    const t = k.current;
    if (sun.current) {
      sun.current.color.copy(CLOSED.sun).lerp(OPEN.sun, t);
      sun.current.intensity = CLOSED.sunI + (OPEN.sunI - CLOSED.sunI) * t;
      sun.current.position.y = CLOSED.y + (OPEN.y - CLOSED.y) * t;
    }
    if (sky.current) {
      sky.current.color.copy(CLOSED.sky).lerp(OPEN.sky, t);
      sky.current.intensity = CLOSED.skyI + (OPEN.skyI - CLOSED.skyI) * t;
    }
    if (amb.current) amb.current.intensity = CLOSED.amb + (OPEN.amb - CLOSED.amb) * t;
  });
  const s = open ? OPEN : CLOSED;
  return (
    <>
      <ambientLight ref={amb} intensity={s.amb} color="#ffffff" />
      <hemisphereLight ref={sky} args={[s.sky, '#9cc274', s.skyI]} />
      <directionalLight
        ref={sun}
        position={[24, s.y, 6]}
        intensity={s.sunI}
        color={s.sun}
        castShadow
        shadow-mapSize={compact ? [2048, 2048] : [4096, 4096]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
    </>
  );
}
