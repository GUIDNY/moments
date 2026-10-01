import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { H_ROADS, V_ROADS, isWalkable } from '../world/map-data';
import VoxelPerson from './VoxelPerson';
import { NPC_SKINS } from './skins';

/* A walk along the kerb of every road, both sides, plus the plaza cross: a
   city's streets have people on them all the way along, not six walkers
   pacing six lines. The kerb, not the pavement — the pavement is paint on
   tiles that are mostly buildings, and a route through a building is a
   walker through a wall. The strip at the road's edge is always road, and
   the cars keep to the middle of their lanes to leave it free. */
const ROUTES = [
  ...H_ROADS.filter((_, i) => i % 2 === 0).flatMap((r) => [
    { from: [r.x0 + 1.5, r.y + 0.18], to: [r.x1 - 0.5, r.y + 0.18] },
    { from: [r.x1 - 1.5, r.y + 1.82], to: [r.x0 + 0.5, r.y + 1.82] },
  ]),
  ...V_ROADS.filter((_, i) => i % 2 === 0).flatMap((r) => [
    { from: [r.x + 0.18, r.y0 + 1.5], to: [r.x + 0.18, r.y1 - 0.5] },
    { from: [r.x + 1.82, r.y1 - 1.5], to: [r.x + 1.82, r.y0 + 0.5] },
  ]),
  { from: [16.5, 20.5], to: [16.5, 3.5] },
  { from: [3.5, 11.5], to: [30.5, 11.5] },
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
      )
        // one kerb in three has a walker on it
        .filter((_, i) => i % 3 === 0)
        .map((route, i) => ({
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
