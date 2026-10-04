import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * A dividend, as an event in the city: a handful of gold coins arc from the
 * company that paid it to the treasury, one after another, and are gone.
 * Two seconds, from the frame clock; the parent keys it on the dividend so
 * a second one is a second flight.
 */
const COINS = 7;
const FLIGHT_S = 1.4;
const GAP_S = 0.12;

export default function CoinFlight({ from, to }) {
  const refs = useRef([]);
  const start = useRef(null);
  useFrame(({ clock }) => {
    if (start.current == null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (t - i * GAP_S) / FLIGHT_S;
      if (u < 0 || u > 1) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const x = from[0] + (to[0] - from[0]) * u;
      const z = from[2] + (to[2] - from[2]) * u;
      const y = from[1] + (to[1] - from[1]) * u + Math.sin(u * Math.PI) * 3.2;
      m.position.set(x, y, z);
      m.rotation.y = t * 6 + i;
      const s = u > 0.85 ? (1 - u) / 0.15 : 1;
      m.scale.setScalar(s);
    });
  });
  return (
    <group>
      {Array.from({ length: COINS }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
          <meshBasicMaterial color="#f5c542" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
