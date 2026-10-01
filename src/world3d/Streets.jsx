import { useMemo } from 'react';
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

/** One ordinary building: an apartment block, a townhouse or a shop with an awning. */
function Filler({ b }) {
  const { x, y, w, h, seed, facing } = b;
  const kind = seed % 3; // 0 flats, 1 house, 2 shop
  const wall = pick(WALLS, seed);
  const storeys = kind === 0 ? 2 + (seed % 3) : kind === 1 ? 1 : 2;
  const storey = 1.25;
  const tall = storeys * storey;
  const facade = useMemo(() => {
    const t = facadeTexture(wall, pick(GLASS, seed, 1), kind === 2 ? 'clinic' : 'window').clone();
    t.repeat.set(1, storeys);
    return t;
  }, [wall, seed, kind, storeys]);
  const cx = x + w / 2;
  const cz = y + h / 2;
  const front = facing === -1 ? y : y + h;

  return (
    <group>
      <mesh position={[cx, tall / 2, cz]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.3, tall, h - 0.3]} />
        <meshLambertMaterial color={wall} map={facade} />
      </mesh>

      {kind === 1 ? (
        // a pitched roof on the townhouse
        <mesh position={[cx, tall + 0.42, cz]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0, (h - 0.3) * 0.72, 0.85, 4, 1]} />
          <meshLambertMaterial color={pick(ROOFS, seed, 2)} />
        </mesh>
      ) : (
        <>
          {/* parapet and the clutter every flat roof has: a tank, an AC unit */}
          <mesh position={[cx, tall + 0.08, cz]} castShadow>
            <boxGeometry args={[w - 0.2, 0.16, h - 0.2]} />
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

      {kind === 2 && (
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

      {kind === 0 && storeys > 2 && (
        // balconies on the taller blocks
        <mesh position={[cx, storey * 2, front + facing * 0.2]} castShadow>
          <boxGeometry args={[w - 0.9, 0.08, 0.4]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      )}
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
      for (let x = r.x0 + 1; x <= r.x1; x += 4) {
        lamps.push([x + 0.5, 0, r.y - 0.15]);          // pavement above the top lane
        lamps.push([x + 2.5, 0, r.y + 2.15]);          // pavement below the bottom lane
      }
      for (let x = r.x0 + 2; x <= r.x1 - 1; x += 5) {
        if ((x + r.y) % 3 === 0) cars.push({ at: [x + 0.5, 0, r.y + 0.42], along: 'x', c: (x * 7 + r.y) % CARS.length });
      }
    });
    V_ROADS.forEach((r, i) => {
      if (i % 2) return;
      for (let y = r.y0 + 2; y <= r.y1; y += 4) {
        lamps.push([r.x - 0.15, 0, y + 0.5]);
        lamps.push([r.x + 2.15, 0, y + 2.5]);
      }
      for (let y = r.y0 + 1; y <= r.y1 - 1; y += 5) {
        if ((y + r.x) % 3 === 1) cars.push({ at: [r.x + 0.42, 0, y + 0.5], along: 'z', c: (y * 5 + r.x) % CARS.length });
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

export default function Streets() {
  // the fillers change with every relayout, the furniture never does
  const version = getVersion();
  const fillers = useMemo(() => getFillers(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      {fillers.map((b) => (
        <Filler key={b.id} b={b} />
      ))}
      <Furniture />
    </group>
  );
}
