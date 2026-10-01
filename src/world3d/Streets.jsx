import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { H_ROADS, MAP_H, MAP_W, V_ROADS, getFillers, getVersion } from '../world/map-data';
import Kit from './Kit';

/**
 * Everything that makes the streets streets and the blocks blocks, none of
 * which is a place you can go: the ordinary buildings on the plots no holding
 * occupies, the lamps along the kerbs, the cars at them. All of it is scenery,
 * decided once per city layout from a seed, and none of it is in the walkable
 * grid except the fillers' footprints — which `map-data` already blocks.
 */

export const tileToWorld = (x, y) => [x + 0.5, 0, y + 0.5];

/* The commercial kit's blocks for downtown; the suburban kit's houses for
   the quiet end. Letters, not adjectives: the kits are what they are. */
const DOWNTOWN = 'abcdefghijklmn'.split('').map((c) => `commercial/building-${c}`);
const SUBURBAN = 'abcdefghijklmnopqrstu'.split('').map((c) => `suburban/building-type-${c}`);
const TOWN = ['modular/building-sample-house-a', 'modular/building-sample-house-b', 'modular/building-sample-house-c'];

function pick(list, seed, salt = 0) {
  return list[(seed + salt) % list.length];
}

/**
 * A pocket park where a block would have been: a lawn, a path, a bench and a
 * couple of trees. A city that is building on every single plot is a wall;
 * the parks are what give the eye somewhere to rest and the streets air.
 */
function Park({ b }) {
  const { x, y, w, h, seed } = b;
  const cx = x + w / 2;
  const cz = y + h / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.015, cz]} receiveShadow>
        <planeGeometry args={[w - 0.2, h - 0.2]} />
        <meshLambertMaterial color="#b6d2a8" />
      </mesh>
      <Kit model="suburban/path-long" fit={[w - 0.6, 0.8]} position={[cx, 0.02, cz]} />
      {[[-0.9, -0.55], [0.95, 0.5], [0.1, -0.6]].map(([ox, oz], i) => (
        <Kit
          key={i}
          model={(seed + i) % 3 ? 'suburban/tree-large' : 'suburban/tree-small'}
          fit={[0.8 + ((seed + i) % 3) * 0.15, 0.8 + ((seed + i) % 3) * 0.15]}
          maxScale={4}
          position={[cx + ox, 0, cz + oz]}
          turn={(seed + i) % 4}
        />
      ))}
      <Kit model="suburban/planter" fit={[0.7, 0.7]} position={[cx - 0.2, 0, cz + 0.45]} />
    </group>
  );
}

/**
 * One ordinary building, from the kits. Downtown blocks get the commercial
 * kit's offices and apartment blocks; the quiet end gets the suburban kit's
 * houses and the odd townhouse. Each is scaled to its plot and turned to face
 * the street its plot fronts, and that is all the choosing there is: the
 * variety is the kit's, not ours.
 */
function Filler({ b }) {
  const { x, y, w, h, seed, facing, lively } = b;
  const cx = x + w / 2;
  const cz = y + h / 2;
  const model = lively
    ? pick(DOWNTOWN, seed)
    : seed % 3 === 0 ? pick(TOWN, seed, 1) : pick(SUBURBAN, seed, 2);
  // the kits face +z; a plot that fronts the street to its north turns round
  const turn = facing === 1 ? 0 : 2;
  return (
    <Kit
      model={model}
      fit={[w - 0.5, h - 0.4]}
      maxScale={lively ? 2.6 : 2.2}
      position={[cx, 0, cz]}
      turn={turn}
    />
  );
}

function Lamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.8, 6]} />
        <meshLambertMaterial color="#6b7580" />
      </mesh>
      <mesh position={[0, 1.82, 0]}>
        <boxGeometry args={[0.22, 0.1, 0.14]} />
        <meshLambertMaterial color="#4f5862" />
      </mesh>
      <mesh position={[0, 1.76, 0]}>
        <boxGeometry args={[0.18, 0.03, 0.1]} />
        <meshBasicMaterial color="#fff6d6" />
      </mesh>
    </group>
  );
}

function Car({ position, along, colour }) {
  const rot = along === 'x' ? 0 : Math.PI / 2;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.86, 0.26, 0.44]} />
        <meshLambertMaterial color={colour} />
      </mesh>
      <mesh position={[0.02, 0.45, 0]} castShadow>
        <boxGeometry args={[0.46, 0.2, 0.4]} />
        <meshLambertMaterial color="#1f2a38" />
      </mesh>
      {[-0.28, 0.28].map((wx) =>
        [-0.21, 0.21].map((wz) => (
          <mesh key={`${wx}${wz}`} position={[wx, 0.1, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
            <meshLambertMaterial color="#222" />
          </mesh>
        ))
      )}
    </group>
  );
}

const CARS = ['#e0574f', '#3d6fd0', '#f0f0ea', '#2c2f36', '#e9b84a', '#7aa6d9', '#c9c9c4'];

/**
 * Lamps every few tiles down the pavement side of each road, and a car parked
 * in the kerbside lane every so often. Both are laid out from the road tables
 * rather than placed by hand, so a change to the streets moves them too.
 */
function Furniture() {
  const items = useMemo(() => {
    const lamps = [];
    const cars = [];
    H_ROADS.forEach((r, i) => {
      if (i % 2) return; // one of each pair of lanes carries the furniture
      for (let x = r.x0 + 1; x <= r.x1; x += 8) {
        lamps.push([x + 0.5, 0, r.y - 0.15]);          // pavement above the top lane
        lamps.push([x + 2.5, 0, r.y + 2.15]);          // pavement below the bottom lane
      }

    });
    V_ROADS.forEach((r, i) => {
      if (i % 2) return;
      for (let y = r.y0 + 2; y <= r.y1; y += 8) {
        lamps.push([r.x - 0.15, 0, y + 0.5]);
        lamps.push([r.x + 2.15, 0, y + 2.5]);
      }

    });
    const inside = ([x, , z]) => x > 0.2 && x < MAP_W - 0.2 && z > 0.2 && z < MAP_H - 0.2;
    return { lamps: lamps.filter(inside), cars: cars.filter((c) => inside(c.at)) };
  }, []);

  return (
    <group>
      {items.lamps.map((p, i) => (
        <Lamp key={`l${i}`} position={p} />
      ))}
      {items.cars.map((c, i) => (
        <Car key={`c${i}`} position={c.at} along={c.along} colour={CARS[c.c]} />
      ))}
    </group>
  );
}

/**
 * Cars that move. Nothing says "city" like traffic, and nothing is cheaper:
 * each car owns one road, drives its lane to the end and comes back up the
 * other, and is advanced from a ref in `useFrame` — a dozen cars cost one
 * position write per frame each and never touch React. They are scenery:
 * the walker passes through them, and they pass through the plaza, because
 * the plaza is where the two main roads cross.
 */
const LANES = [
  // lanes sit a little in from the kerb, which is where the pedestrians walk
  ...H_ROADS.filter((_, i) => i % 2 === 0).map((r) => ({
    axis: 'x', from: r.x0 + 0.5, to: r.x1 + 0.5, lane: [r.y + 0.64, r.y + 1.36],
  })),
  ...V_ROADS.filter((_, i) => i % 2 === 0).map((r) => ({
    axis: 'z', from: r.y0 + 0.5, to: r.y1 + 0.5, lane: [r.x + 0.64, r.x + 1.36],
  })),
];

function MovingCar({ road, offset, speed, colour }) {
  const ref = useRef();
  const t = useRef(offset);          // 0..2: out along lane 0, back along lane 1
  const len = road.to - road.from;
  useFrame((_, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    t.current = (t.current + (speed * delta) / len) % 2;
    const out = t.current < 1;
    const along = road.from + (out ? t.current : 2 - t.current) * len;
    const side = road.lane[out ? 0 : 1];
    const car = ref.current;
    if (!car) return;
    if (road.axis === 'x') {
      car.position.set(along, 0, side);
      car.rotation.y = out ? 0 : Math.PI;
    } else {
      car.position.set(side, 0, along);
      car.rotation.y = out ? -Math.PI / 2 : Math.PI / 2;
    }
  });
  return (
    <group ref={ref}>
      <Car position={[0, 0, 0]} along="x" colour={colour} />
    </group>
  );
}

function Traffic() {
  const cars = useMemo(() => {
    const out = [];
    LANES.forEach((road, i) => {
      // one car a road: traffic you notice, not traffic you sit in
      const n = 1;
      for (let k = 0; k < n; k++) {
        out.push({ road, offset: ((k * 2) / n + i * 0.23) % 2, speed: 2.2 + ((i + k) % 3) * 0.5, colour: CARS[(i * 3 + k) % CARS.length] });
      }
    });
    return out;
  }, []);
  return (
    <group>
      {cars.map((c, i) => (
        <MovingCar key={i} {...c} />
      ))}
    </group>
  );
}

export default function Streets() {
  // the fillers change with every relayout, the furniture never does
  const version = getVersion();
  const fillers = useMemo(() => getFillers(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      {/* a quarter of the plots downtown are parks; half of them at the quiet end */}
      {fillers.map((b) =>
        (b.lively ? b.seed % 4 === 1 : b.seed % 2 === 1) ? <Park key={b.id} b={b} /> : <Filler key={b.id} b={b} />
      )}
      <Furniture />
      <Traffic />
    </group>
  );
}
