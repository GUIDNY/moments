import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { H_ROADS, MAP_H, MAP_W, V_ROADS, getFillers, getVersion } from '../world/map-data';
import { facadeTexture } from './textures';

/**
 * Everything that makes the streets streets and the blocks blocks, none of
 * which is a place you can go: the ordinary buildings on the plots no holding
 * occupies, the lamps along the kerbs, the cars at them. All of it is scenery,
 * decided once per city layout from a seed, and none of it is in the walkable
 * grid except the fillers' footprints — which `map-data` already blocks.
 */

export const tileToWorld = (x, y) => [x + 0.5, 0, y + 0.5];

/* A small town's palette: render, stucco, brick, a pale blue, a warm stone.
   Nothing saturated enough to argue with the brand on a tower's fascia. */
const WALLS = ['#f1e9dc', '#e9dfd0', '#e3e6e9', '#f3ecd9', '#ead9cf', '#e6ebe3', '#efe3dd'];
const GLASS = ['#9fb6c4', '#a8bcc6', '#97aec0'];
const ROOFS = ['#c96f5c', '#b5705e', '#9c8c7b', '#8f9ca8'];
const AWNINGS = ['#d9534f', '#3b7dd8', '#2f9e6f', '#e2a23b'];

function pick(list, seed, salt = 0) {
  return list[(seed + salt) % list.length];
}

/**
 * One ordinary building. A city is mid-rise: apartment blocks of four to
 * seven floors, an office block in glass now and then, a shop with an awning
 * at the corner — and the odd townhouse so the skyline is not a bar chart.
 * The towers that matter are still the tallest things on their street,
 * because a holding's tower starts above a filler's roof.
 */
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.02, cz]}>
        <planeGeometry args={[w - 0.2, 0.5]} />
        <meshLambertMaterial color="#e2dfd4" />
      </mesh>
      {[[-0.9, -0.55], [0.95, 0.5], [0.1, -0.6]].map(([ox, oz], i) => (
        <group key={i} position={[cx + ox, 0, cz + oz]} scale={0.8 + ((seed + i) % 3) * 0.15}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.18, 0.7, 0.18]} />
            <meshLambertMaterial color="#6b4a2f" />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshLambertMaterial color={i % 2 ? '#3f9a63' : '#56ad72'} flatShading />
          </mesh>
        </group>
      ))}
      <mesh position={[cx - 0.2, 0.26, cz + 0.45]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.3]} />
        <meshLambertMaterial color="#8d6b4a" />
      </mesh>
    </group>
  );
}

function Filler({ b }) {
  const { x, y, w, h, seed, facing, lively } = b;
  const kind = seed % 5; // 0,1 flats, 2 office, 3 shop, 4 townhouse
  const wall = kind === 2 ? '#e8edf1' : pick(WALLS, seed);
  // two or three floors downtown, one or two at the quiet end: the shortest
  // holding's tower starts above the tallest filler's roof, so the places
  // that matter are the tallest on their street
  const storeys = lively
    ? kind === 4 ? 2 : kind === 3 ? 2 : kind === 2 ? 3 : 2 + (seed % 2)
    : kind === 4 ? 1 : kind === 3 ? 1 : 2;
  const storey = 1.1;
  const tall = storeys * storey;
  const facade = useMemo(() => {
    const style = kind === 2 ? 'glass' : kind === 3 ? 'clinic' : 'window';
    const t = facadeTexture(wall, kind === 2 ? '#86b1c6' : pick(GLASS, seed, 1), style).clone();
    t.repeat.set(1, storeys);
    return t;
  }, [wall, seed, kind, storeys]);
  const cx = x + w / 2;
  const cz = y + h / 2;
  const front = facing === -1 ? y : y + h;

  return (
    <group>
      <mesh position={[cx, tall / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.6, tall, h - 0.5]} />
        <meshLambertMaterial color={wall} map={facade} />
      </mesh>

      {kind === 4 ? (
        // a pitched roof on the townhouse
        <mesh position={[cx, tall + 0.42, cz]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0, (h - 0.5) * 0.74, 0.85, 4, 1]} />
          <meshLambertMaterial color={pick(ROOFS, seed, 2)} />
        </mesh>
      ) : (
        <>
          {/* parapet and the clutter every flat roof has: a tank, an AC unit */}
          <mesh position={[cx, tall + 0.08, cz]} castShadow>
            <boxGeometry args={[w - 0.5, 0.16, h - 0.4]} />
            <meshLambertMaterial color={pick(ROOFS, seed, 3)} />
          </mesh>
          <mesh position={[cx - 0.6, tall + 0.42, cz + 0.3]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.5, 10]} />
            <meshLambertMaterial color="#e8e8e2" />
          </mesh>
          <mesh position={[cx + 0.7, tall + 0.3, cz - 0.3]} castShadow>
            <boxGeometry args={[0.45, 0.3, 0.35]} />
            <meshLambertMaterial color="#cfd3d6" />
          </mesh>
        </>
      )}

      {kind === 3 && (
        // the shop's awning, out over the pavement on the street side
        <mesh
          position={[cx, 1.05, front + facing * 0.3]}
          rotation={[facing * 0.35, 0, 0]}
          castShadow
        >
          <boxGeometry args={[w - 0.6, 0.06, 0.7]} />
          <meshLambertMaterial color={pick(AWNINGS, seed, 4)} />
        </mesh>
      )}

      {kind <= 1 &&
        // a balcony on every floor above the ground, on the street side
        Array.from({ length: storeys - 1 }, (_, i) => (
          <mesh key={i} position={[cx, storey * (i + 1), front + facing * 0.22]} castShadow>
            <boxGeometry args={[w - 0.9, 0.07, 0.42]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        ))}
    </group>
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
