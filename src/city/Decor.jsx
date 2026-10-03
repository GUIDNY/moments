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

export default function Decor({ plan, level = 1 }) {
  const { grid, size, hq } = plan;

  const items = useMemo(() => {
    const next = seeded(42);
    const trees = [];
    const benches = [];
    const lamps = [];
    const planters = [];
    const beds = []; // flower beds: the colour a lawn needs
    const hedges = []; // low fences along a garden's road side
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
          else if (r < 0.34) beds.push({ x: x + 0.5, z: y + 0.5, hue: Math.floor(next() * 4), turn: next() < 0.5 });
          // a hedge where the garden meets a road
          if (grid[y]?.[x + 1] === TILE.ROAD && next() < 0.5) hedges.push({ x: x + 0.62, z: y + 0.5, turn: 1 });
          if (grid[y + 1]?.[x] === TILE.ROAD && next() < 0.5) hedges.push({ x: x + 0.5, z: y + 0.62, turn: 0 });
        }
        if (t === TILE.PARK && !inPlaza && next() < 0.07) beds.push({ x: x + 0.5, z: y + 0.5, hue: Math.floor(next() * 4), turn: next() < 0.5 });
        // a lamp on the pavement beside long roads, every fifth tile
        if (!isRoad(x, y) && t !== TILE.WATER && grid[y]?.[x + 1] === TILE.ROAD && y % 5 === 2) lamps.push({ x: x + 0.82, z: y + 0.5 });
        if (!isRoad(x, y) && t !== TILE.WATER && grid[y + 1]?.[x] === TILE.ROAD && x % 5 === 2) lamps.push({ x: x + 0.5, z: y + 0.82 });
      }
    }
    // the country past the board: copses, densest near the kerb, thinning
    // out — so whatever the camera shows past the plan is still a place
    const country = [];
    for (let i = 0; i < 1400 && country.length < 260; i++) {
      const x = -26 + next() * (size + 52);
      const z = -26 + next() * (size + 52);
      const out = Math.max(-x, x - size, -z, z - size); // distance past the kerb
      if (out < 1.2) continue;
      if (next() < Math.max(0.12, 1 - out / 22)) country.push({ x, z, big: next() < 0.45, turn: Math.floor(next() * 4) });
    }
    // the city grows with its level: more beds, benches and lamps as it rises
    const k = Math.min(1, 0.55 + level * 0.09);
    return {
      trees: trees.slice(0, 150),
      country,
      benches: benches.slice(0, Math.round(10 * k)),
      lamps: lamps.slice(0, Math.round(40 * k)),
      planters: planters.slice(0, Math.round(24 * k)),
      beds: beds.slice(0, Math.round(40 * k)),
      hedges: hedges.slice(0, Math.round(40 * k)),
    };
  }, [grid, size, hq, level]);

  return (
    <group>
      {items.trees.map((t, i) => (
        <Kit key={`t${i}`} model={t.big ? 'suburban/tree-large' : 'suburban/tree-small'} fit={[0.7, 0.7]} maxScale={3.4} position={[t.x, 0, t.z]} turn={t.turn} />
      ))}
      {items.country.map((t, i) => (
        <Kit key={`c${i}`} model={t.big ? 'suburban/tree-large' : 'suburban/tree-small'} fit={[0.8, 0.8]} maxScale={3.6} position={[t.x, 0, t.z]} turn={t.turn} />
      ))}
      {items.beds.map((b, i) => (
        <FlowerBed key={`fb${i}`} x={b.x} z={b.z} hue={b.hue} turn={b.turn} />
      ))}
      {items.hedges.map((h, i) => (
        <Kit key={`h${i}`} model="suburban/fence-low" fit={[0.9, 0.3]} maxScale={2.2} position={[h.x, 0, h.z]} turn={h.turn} />
      ))}
      <Fountain x={hq.x + hq.w / 2} z={hq.y + hq.h + 1.4} />
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
      <Birds cx={hq.x + hq.w / 2} cz={hq.y + hq.h / 2} />
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
      <Car offset={0.27} speed={1.45} colour="#f5c542" lane={0.18} />
      <Car offset={0.78} speed={1.2} colour="#f6f6f2" lane={-0.18} dir={-1} />
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

/* A bed of flowers: a low box of earth with a bright top, in one of four
   colours. The cheapest colour a city can have. */
const BED_COLOURS = ['#f06a84', '#f5c542', '#f59a52', '#b58cf0'];
function FlowerBed({ x, z, hue, turn }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn ? Math.PI / 2 : 0, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.12, 0.3]} />
        <meshLambertMaterial color="#8d6b4a" />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.24]} />
        <meshLambertMaterial color={BED_COLOURS[hue % BED_COLOURS.length]} />
      </mesh>
    </group>
  );
}

/* The fountain in front of the HQ: a basin, water, a spout that breathes. */
function Fountain({ x, z }) {
  const jet = useRef();
  useFrame(({ clock }) => {
    if (jet.current) jet.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 2.4) * 0.15;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.0, 0.24, 20]} />
        <meshLambertMaterial color="#d9d4c4" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.04, 20]} />
        <meshLambertMaterial color="#62b8dc" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.5, 10]} />
        <meshLambertMaterial color="#cfc9b8" />
      </mesh>
      <mesh ref={jet} position={[0, 0.95, 0]}>
        <coneGeometry args={[0.16, 0.5, 10]} />
        <meshBasicMaterial color="#bfe8f7" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/* Three birds circling high over the park, now and then: a sky with
   something in it. Each a small dark V, flapping from the frame clock. */
function Birds({ cx, cz }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const a = t * (0.22 + i * 0.05) + i * 2.1;
      const r = 5 + i * 1.6;
      g.position.set(cx + Math.cos(a) * r, 7.5 + i * 0.6 + Math.sin(t * 0.7 + i) * 0.3, cz + Math.sin(a) * r);
      g.rotation.y = -a;
      const flap = Math.sin(t * 9 + i) * 0.5;
      g.children[0].rotation.z = flap;
      g.children[1].rotation.z = -flap;
    });
  });
  return (
    <>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.26, 0.02, 0.06]} />
            <meshBasicMaterial color="#2b3340" />
          </mesh>
          <mesh position={[0.12, 0, 0]}>
            <boxGeometry args={[0.26, 0.02, 0.06]} />
            <meshBasicMaterial color="#2b3340" />
          </mesh>
        </group>
      ))}
    </>
  );
}
