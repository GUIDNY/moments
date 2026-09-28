import { useMemo } from 'react';
import { BUILDINGS, MAP_H, MAP_W, PROPS, TERRAIN, TERRAIN_GRID } from '../world/map-data';
import { useI18n } from '../i18n/I18nContext';
import { emojiTexture, groundTexture, signTexture, billboardTexture } from './textures';

/** tile (x, y) -> the centre of that tile in world space */
export const tileToWorld = (x, y) => [x + 0.5, 0, y + 0.5];

const GROUND_COLORS = {
  [TERRAIN.GRASS]: '#37714f',
  [TERRAIN.ROAD]: '#5a6379',
  [TERRAIN.WATER]: '#2a6296',
  [TERRAIN.BLOCKED]: '#37714f',
  [TERRAIN.PLAZA]: '#6b7490',
};

export function Ground() {
  const tex = useMemo(() => groundTexture(TERRAIN_GRID, GROUND_COLORS), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_W / 2, 0, MAP_H / 2]} receiveShadow>
      <planeGeometry args={[MAP_W, MAP_H]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

/** Water sits a hair above the floor so it reads as a surface, not a painted tile. */
export function River() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.04, MAP_H / 2]}>
      <planeGeometry args={[2, MAP_H]} />
      <meshLambertMaterial color="#2a6ea8" transparent opacity={0.85} />
    </mesh>
  );
}

function Tree({ position, tall }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshLambertMaterial color="#6b4a2f" />
      </mesh>
      {tall ? (
        <>
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.55, 1.1, 5]} />
            <meshLambertMaterial color="#2f7a4d" />
          </mesh>
          <mesh position={[0, 1.75, 0]} castShadow>
            <coneGeometry args={[0.38, 0.8, 5]} />
            <meshLambertMaterial color="#3d9c6a" />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshLambertMaterial color="#35915c" />
        </mesh>
      )}
    </group>
  );
}

function Bench({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.9, 0.12, 0.35]} />
        <meshLambertMaterial color="#8a5a33" />
      </mesh>
      <mesh position={[0, 0.5, -0.16]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.1]} />
        <meshLambertMaterial color="#8a5a33" />
      </mesh>
    </group>
  );
}

function Fountain({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.65, 0.7, 0.3, 12]} />
        <meshLambertMaterial color="#9aa6bd" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 12]} />
        <meshLambertMaterial color="#3f8fd0" />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 8]} />
        <meshLambertMaterial color="#9aa6bd" />
      </mesh>
    </group>
  );
}

function TrafficLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 1.6, 0.1]} />
        <meshLambertMaterial color="#2b3140" />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 0.22]} />
        <meshLambertMaterial color="#1a1f2b" />
      </mesh>
      <mesh position={[0, 1.92, 0.12]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ff5b52" />
      </mesh>
      <mesh position={[0, 1.6, 0.12]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#44e092" />
      </mesh>
    </group>
  );
}

function Billboard({ emoji, position, height = 0.8 }) {
  const tex = useMemo(() => emojiTexture(emoji), [emoji]);
  return (
    <sprite position={[position[0], height / 2 + 0.1, position[2]]} scale={[height, height, 1]}>
      <spriteMaterial map={tex} transparent />
    </sprite>
  );
}

export function Props() {
  return (
    <group>
      {PROPS.map((p) => {
        const pos = tileToWorld(p.x, p.y);
        switch (p.emoji) {
          case '🌳':
            return <Tree key={`${p.x}-${p.y}`} position={pos} tall={false} />;
          case '🌲':
            return <Tree key={`${p.x}-${p.y}`} position={pos} tall />;
          case '🪑':
            return <Bench key={`${p.x}-${p.y}`} position={pos} />;
          case '⛲':
            return <Fountain key={`${p.x}-${p.y}`} position={pos} />;
          case '🚦':
            return <TrafficLight key={`${p.x}-${p.y}`} position={pos} />;
          case '🗿':
            return (
              <mesh key={`${p.x}-${p.y}`} position={[pos[0], 0.7, pos[2]]} castShadow>
                <boxGeometry args={[0.6, 1.4, 0.55]} />
                <meshLambertMaterial color="#7d8596" />
              </mesh>
            );
          case '📮':
            return (
              <mesh key={`${p.x}-${p.y}`} position={[pos[0], 0.45, pos[2]]} castShadow>
                <boxGeometry args={[0.4, 0.9, 0.35]} />
                <meshLambertMaterial color="#d24a3d" />
              </mesh>
            );
          default:
            return <Billboard key={`${p.x}-${p.y}`} emoji={p.emoji} position={pos} height={0.7} />;
        }
      })}
    </group>
  );
}

const BUILDING_HEIGHT = 2.4;
const WALL_COLOR = '#49516b';

function Shop({ building }) {
  const { x, y, w, h, door, emoji, name, color } = building;
  const { loc, dir: textDir } = useI18n();
  const label = loc(name);
  const sign = useMemo(() => signTexture(emoji, label, color, textDir), [emoji, label, color, textDir]);
  const doorOnTopRow = door.y === y;
  // sign and doorway face the street the door opens onto
  const faceZ = doorOnTopRow ? y : y + h;
  const dir = doorOnTopRow ? -1 : 1;

  const blocks = [];
  for (let by = y; by < y + h; by++) {
    for (let bx = x; bx < x + w; bx++) {
      if (bx === door.x && by === door.y) continue;
      blocks.push([bx, by]);
    }
  }

  return (
    <group>
      {blocks.map(([bx, by]) => (
        <mesh key={`${bx}-${by}`} position={[bx + 0.5, BUILDING_HEIGHT / 2, by + 0.5]} castShadow receiveShadow>
          <boxGeometry args={[1, BUILDING_HEIGHT, 1]} />
          <meshLambertMaterial color={WALL_COLOR} />
        </mesh>
      ))}

      {/* lintel over the open doorway keeps the facade unbroken */}
      <mesh position={[door.x + 0.5, 2.1, door.y + 0.5]} castShadow>
        <boxGeometry args={[1, 0.6, 1]} />
        <meshLambertMaterial color={WALL_COLOR} />
      </mesh>

      {/* roof band in the district colour, flush so it does not overhang the street */}
      <mesh position={[x + w / 2, BUILDING_HEIGHT + 0.1, y + h / 2]} castShadow>
        <boxGeometry args={[w, 0.2, h]} />
        <meshLambertMaterial color={color} />
      </mesh>

      {/* lit doorway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[door.x + 0.5, 0.05, door.y + 0.5 + dir * 0.35]}
      >
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <pointLight position={[door.x + 0.5, 1.6, door.y + 0.5]} color={color} intensity={6} distance={4} />

      {/* shop sign above the entrance */}
      <mesh
        position={[x + w / 2, 1.85, faceZ + dir * 0.06]}
        rotation={[0, doorOnTopRow ? Math.PI : 0, 0]}
      >
        <planeGeometry args={[Math.min(w, 2.9), 0.9]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Shops() {
  return (
    <group>
      {BUILDINGS.map((b) => (
        <Shop key={b.id} building={b} />
      ))}
    </group>
  );
}

/** The plaza screen, the way the reference world puts a promo wall in the atrium. */
export function PlazaScreen({ title, tagline, coins }) {
  const { dir } = useI18n();
  const tex = useMemo(
    () => billboardTexture([title, tagline, coins], dir),
    [title, tagline, coins, dir]
  );
  return (
    <group position={[16.99, 0, 9.4]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.35, 2.4, 0.35]} />
        <meshLambertMaterial color="#2b3140" />
      </mesh>
      <mesh position={[0, 3.3, 0.14]}>
        <planeGeometry args={[3.6, 2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[3.9, 2.3, 0.22]} />
        <meshLambertMaterial color="#141822" />
      </mesh>
    </group>
  );
}
