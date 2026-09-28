import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { isWalkable } from '../world/map-data';
import VoxelPerson from './VoxelPerson';
import { NPC_SKINS } from './skins';

const ROUTES = [
  { from: [16.5, 20.5], to: [16.5, 3.5] },
  { from: [3.5, 11.5], to: [30.5, 11.5] },
  { from: [4.5, 5.5], to: [4.5, 18.5] },
  { from: [28.5, 18.5], to: [28.5, 5.5] },
  { from: [9.5, 11.5], to: [9.5, 18.5] },
  { from: [22.5, 4.5], to: [27.5, 4.5] },
];

/** Other shoppers pacing the streets — they make the city feel inhabited. */
function Npc({ route, skin, speed, offset }) {
  const ref = useRef();
  const t = useRef(offset);
  const dir = useRef(1);
  const motion = useRef({ moving: true, facing: 0 });

  useFrame((_, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    t.current += dir.current * speed * delta;
    if (t.current >= 1) {
      t.current = 1;
      dir.current = -1;
    } else if (t.current <= 0) {
      t.current = 0;
      dir.current = 1;
    }
    if (!ref.current) return;
    ref.current.position.x = route.from[0] + (route.to[0] - route.from[0]) * t.current;
    ref.current.position.z = route.from[1] + (route.to[1] - route.from[1]) * t.current;
    motion.current.facing = Math.atan2(
      -(route.to[0] - route.from[0]) * dir.current,
      -(route.to[1] - route.from[1]) * dir.current
    );
  });

  return (
    <group ref={ref} position={[route.from[0], 0, route.from[1]]}>
      <VoxelPerson skin={skin} motion={motion} scale={0.95} />
    </group>
  );
}

export default function Npcs() {
  const walkers = useMemo(
    () =>
      ROUTES.filter(
        (r) =>
          isWalkable(Math.floor(r.from[0]), Math.floor(r.from[1])) &&
          isWalkable(Math.floor(r.to[0]), Math.floor(r.to[1]))
      ).map((route, i) => ({
        route,
        skin: NPC_SKINS[i % NPC_SKINS.length],
        speed: 0.05 + (i % 3) * 0.018,
        offset: (i * 0.37) % 1,
      })),
    []
  );

  return (
    <group>
      {walkers.map((w, i) => (
        <Npc key={i} {...w} />
      ))}
    </group>
  );
}
