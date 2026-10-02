import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Kit from '../world3d/Kit';
import VoxelPerson from '../world3d/VoxelPerson';
import { NPC_SKINS } from '../world3d/skins';
import { TILE } from './layout';

/**
 * What makes the board a town: trees in the park and along the pavements,
 * benches, lamps, two cars that drive the ring, a handful of tiny people. All
 * of it is decided once from the plan, none of it is per-frame React. The
 * budget is deliberate — the buildings are the hero, this is the air around
 * them.
 */

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function Decor({ plan }) {
  const { grid, size, hq } = plan;

  const items = useMemo(() => {
    const next = seeded(42);
    const trees = [];
    const benches = [];
    const lamps = [];
    const planters = [];
    const isRoad = (x, y) => grid[y]?.[x] === TILE.ROAD || grid[y]?.[x] === TILE.LANE;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = grid[y][x];
        const inPlaza = x >= hq.x - 1 && x <= hq.x + hq.w && y >= hq.y - 1 && y <= hq.y + hq.h;
        if (t === TILE.PARK && !inPlaza) {
          // a tree on about a third of the park's tiles, never on its paths
          if (next() < 0.34) trees.push({ x: x + 0.3 + next() * 0.4, z: y + 0.3 + next() * 0.4, big: next() < 0.5, turn: Math.floor(next() * 4) });
          else if (next() < 0.06) benches.push({ x: x + 0.5, z: y + 0.5, turn: Math.floor(next() * 4) });
        }
        if (t === TILE.GRASS && !isRoad(x, y)) {
          // the verges, and the plots no stock has taken yet: gardens, so an
          // empty district is green rather than bare, and a planter here and
          // there so the lawn has a street in it
          const r = next();
          if (r < 0.22) trees.push({ x: x + 0.25 + next() * 0.5, z: y + 0.25 + next() * 0.5, big: next() < 0.3, turn: Math.floor(next() * 4) });
          else if (r < 0.26) planters.push({ x: x + 0.5, z: y + 0.5, turn: Math.floor(next() * 4) });
        }
        // a lamp on the pavement beside long roads, every fifth tile
        if (!isRoad(x, y) && t !== TILE.WATER && grid[y]?.[x + 1] === TILE.ROAD && y % 5 === 2) lamps.push({ x: x + 0.82, z: y + 0.5 });
        if (!isRoad(x, y) && t !== TILE.WATER && grid[y + 1]?.[x] === TILE.ROAD && x % 5 === 2) lamps.push({ x: x + 0.5, z: y + 0.82 });
      }
    }
    return { trees: trees.slice(0, 150), benches: benches.slice(0, 10), lamps: lamps.slice(0, 40), planters: planters.slice(0, 24) };
  }, [grid, size, hq]);

  return (
    <group>
      {items.trees.map((t, i) => (
        <Kit key={`t${i}`} model={t.big ? 'suburban/tree-large' : 'suburban/tree-small'} fit={[0.7, 0.7]} maxScale={3.4} position={[t.x, 0, t.z]} turn={t.turn} />
      ))}
      {items.planters.map((p, i) => (
        <Kit key={`p${i}`} model="suburban/planter" fit={[0.6, 0.6]} maxScale={2} position={[p.x, 0, p.z]} turn={p.turn} />
      ))}
      {items.benches.map((b, i) => (
        <group key={`b${i}`} position={[b.x, 0, b.z]} rotation={[0, (b.turn * Math.PI) / 2, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.6, 0.06, 0.22]} />
            <meshLambertMaterial color="#8d6b4a" />
          </mesh>
          <mesh position={[0, 0.34, -0.09]} castShadow>
            <boxGeometry args={[0.6, 0.22, 0.05]} />
            <meshLambertMaterial color="#8d6b4a" />
          </mesh>
        </group>
      ))}
      {items.lamps.map((l, i) => (
        <group key={`l${i}`} position={[l.x, 0, l.z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.035, 1, 6]} />
            <meshLambertMaterial color="#7c8792" />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#fff2c6" />
          </mesh>
        </group>
      ))}
      <Cars plan={plan} />
      <People plan={plan} />
    </group>
  );
}

/** Two small cars round the ring road, one each way. */
const RING = [
  [9.5, 9.5], [18.5, 9.5], [18.5, 18.5], [9.5, 18.5],
];
function Cars() {
  return (
    <>
      <Car offset={0} speed={1.6} colour="#e0574f" lane={0.18} />
      <Car offset={0.5} speed={1.3} colour="#3d6fd0" lane={-0.18} dir={-1} />
    </>
  );
}
function Car({ offset, speed, colour, lane, dir = 1 }) {
  const ref = useRef();
  const t = useRef(offset);
  useFrame((_, d) => {
    t.current = (t.current + dir * (speed * Math.min(0.05, d)) / 36 + 1) % 1;
    const u = t.current * 4;
    const i = Math.floor(u);
    const f = u - i;
    const a = RING[i % 4];
    const b = RING[(i + 1) % 4];
    const x = a[0] + (b[0] - a[0]) * f;
    const z = a[1] + (b[1] - a[1]) * f;
    const ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const g = ref.current;
    if (!g) return;
    g.position.set(x + Math.cos(ang) * lane, 0, z - Math.sin(ang) * lane);
    g.rotation.y = ang + (dir === 1 ? 0 : Math.PI);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.3, 0.18, 0.55]} />
        <meshLambertMaterial color={colour} />
      </mesh>
      <mesh position={[0, 0.3, -0.03]} castShadow>
        <boxGeometry args={[0.26, 0.13, 0.3]} />
        <meshLambertMaterial color="#1f2a38" />
      </mesh>
    </group>
  );
}

/** Four tiny people on the park paths — atmosphere, not actors. */
function People({ plan }) {
  const { park } = plan;
  const walkers = useMemo(
    () => [
      { from: [park.x0 + 0.5, park.y0 + 0.5], to: [park.x1 + 0.5, park.y0 + 0.5], skin: NPC_SKINS[0], speed: 0.05 },
      { from: [park.x1 + 0.5, park.y1 - 1.5], to: [park.x0 + 2.5, park.y1 - 1.5], skin: NPC_SKINS[1], speed: 0.04 },
      { from: [2.5, 8.5], to: [25.5, 8.5], skin: NPC_SKINS[2], speed: 0.03 },
      { from: [19.5, 2.5], to: [19.5, 25.5], skin: NPC_SKINS[3], speed: 0.035 },
    ],
    [park]
  );
  return (
    <>
      {walkers.map((w, i) => (
        <Walker key={i} {...w} offset={i * 0.3} />
      ))}
    </>
  );
}
function Walker({ from, to, skin, speed, offset }) {
  const ref = useRef();
  const t = useRef(offset);
  const dir = useRef(1);
  const motion = useRef({ moving: true, facing: 0 });
  useFrame((_, d) => {
    t.current += dir.current * speed * Math.min(0.05, d);
    if (t.current >= 1) { t.current = 1; dir.current = -1; }
    if (t.current <= 0) { t.current = 0; dir.current = 1; }
    const g = ref.current;
    if (!g) return;
    g.position.x = from[0] + (to[0] - from[0]) * t.current;
    g.position.z = from[1] + (to[1] - from[1]) * t.current;
    motion.current.facing = Math.atan2(-(to[0] - from[0]) * dir.current, -(to[1] - from[1]) * dir.current);
  });
  return (
    <group ref={ref}>
      <VoxelPerson skin={skin} motion={motion} scale={0.42} />
    </group>
  );
}
