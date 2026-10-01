import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP_H, MAP_W, TERRAIN, getBuildings, getGrid, getProps } from '../world/map-data'
import { towerFor } from '../stocks/towers';
import { archetypeFor } from './architecture';
import { useI18n } from '../i18n/I18nContext';
import { playerPos } from './playerPos';
import { emojiTexture, facadeTexture, groundTexture, rooftopTexture, signTexture, billboardTexture } from './textures';
import { loadLogo } from './logos';

/* Lerping towards a colour needs a Color to lerp towards, and allocating two
   per building per frame is how a city of twenty towers starts stuttering. */
const SCRATCH = new THREE.Color();

/** tile (x, y) -> the centre of that tile in world space */
export const tileToWorld = (x, y) => [x + 0.5, 0, y + 0.5];

/* Daylight, not night. The whole city reads as a model on a table: pale
   pavement, soft planting, nothing saturated enough to compete with the one
   thing that is meant to carry colour — whether a holding is up or down. */
const GROUND_COLORS = {
  [TERRAIN.GRASS]: '#bdd3b4',
  [TERRAIN.ROAD]: '#c9cbc7',
  [TERRAIN.WATER]: '#aecde0',
  [TERRAIN.BLOCKED]: '#bdd3b4',
  [TERRAIN.PLAZA]: '#e4e3dc',
  pavement: '#e2e1da',
  kerb: 'rgba(0,0,0,0.2)',
};

/* The camera sits behind and above the avatar, so standing anywhere near an
   edge of the map points it straight off the end of the world. The apron is
   open country carried out well past the fog's far plane, which turns the
   map's edge into a horizon instead of a cliff. It is a shade deeper than the
   planting inside the town so the boundary reads as the edge of the built-up
   area rather than as unfinished ground. */
const APRON = 180;
const APRON_COLOR = '#b1c9a7';

export function Ground() {
  const tex = useMemo(() => groundTexture(getGrid(), GROUND_COLORS), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_W / 2, -0.02, MAP_H / 2]}>
        <planeGeometry args={[APRON, APRON]} />
        <meshLambertMaterial color={APRON_COLOR} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MAP_W / 2, 0, MAP_H / 2]} receiveShadow>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshLambertMaterial map={tex} />
      </mesh>
    </group>
  );
}

/* Deterministic, because the countryside must not reshuffle itself every time
   a price moves and React re-renders the scene. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * The country the town sits in.
 *
 * Without it the map's edge is a straight line with nothing past it, and since
 * the camera trails the avatar from above and behind, walking to the southern
 * kerb fills half the screen with empty ground. Fields and copses out to the
 * fog line give the city a landscape to be the middle of.
 */
export function Surrounds() {
  const items = useMemo(() => {
    const next = rng(20260401);
    const out = [];
    const RING = 44;
    /* Density falls off with distance from the kerb. Scattering evenly across
       the whole apron instead leaves the first few metres past the boundary —
       the part you are actually looking at — bare, which is the exact gap this
       is here to close. */
    for (let i = 0; i < 4000 && out.length < 420; i++) {
      const x = -RING + next() * (MAP_W + RING * 2);
      const z = -RING + next() * (MAP_H + RING * 2);
      // the town itself is already built; this is only what surrounds it
      if (x > -1.5 && x < MAP_W + 1.5 && z > -1.5 && z < MAP_H + 1.5) continue;
      const out_x = Math.max(0, -x, x - MAP_W);
      const out_z = Math.max(0, -z, z - MAP_H);
      if (next() > (1 - Math.hypot(out_x, out_z) / RING) ** 2) continue;
      const r = next();
      const near = Math.hypot(out_x, out_z) < 18;
      // the first streets past the kerb are houses: a city does not stop at a
      // line and become a forest, it thins out
      const kind = near && r < 0.42
        ? 'house'
        : r < 0.6 ? 'tree' : r < 0.8 ? 'pine' : r < 0.91 ? 'field' : 'hedge';
      out.push({
        x,
        z,
        kind,
        size: 0.7 + next() * 0.8,
        turn: next() * Math.PI,
        hue: Math.floor(next() * 7),
      });
    }
    return out;
  }, []);

  return (
    <group>
      {items.map((it, i) => {
        const key = `s${i}`;
        if (it.kind === 'field') {
          return (
            <mesh
              key={key}
              rotation={[-Math.PI / 2, 0, it.turn]}
              position={[it.x, 0.01, it.z]}
            >
              <planeGeometry args={[6 * it.size, 4.5 * it.size]} />
              <meshLambertMaterial color={i % 2 ? '#a6c09b' : '#9bb891'} />
            </mesh>
          );
        }
        if (it.kind === 'house') {
          const wall = ['#f1e9dc', '#e9dfd0', '#e3e6e9', '#f3ecd9', '#ead9cf', '#e6ebe3', '#efe3dd'][it.hue];
          const roof = ['#c96f5c', '#b5705e', '#9c8c7b', '#8f9ca8'][it.hue % 4];
          const tall = 1.1 + (it.hue % 3) * 0.5;
          return (
            <group key={key} position={[it.x, 0, it.z]} rotation={[0, Math.round(it.turn / (Math.PI / 2)) * (Math.PI / 2), 0]}>
              <mesh position={[0, tall / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.2 * it.size, tall, 1.6 * it.size]} />
                <meshLambertMaterial color={wall} />
              </mesh>
              {it.hue % 2 ? (
                <mesh position={[0, tall + 0.35, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
                  <cylinderGeometry args={[0, 1.25 * it.size, 0.7, 4, 1]} />
                  <meshLambertMaterial color={roof} />
                </mesh>
              ) : (
                <mesh position={[0, tall + 0.06, 0]} castShadow>
                  <boxGeometry args={[2.3 * it.size, 0.12, 1.7 * it.size]} />
                  <meshLambertMaterial color={roof} />
                </mesh>
              )}
            </group>
          );
        }
        if (it.kind === 'hedge') {
          return (
            <mesh key={key} position={[it.x, 0.3, it.z]} rotation={[0, it.turn, 0]} castShadow>
              <boxGeometry args={[3.2 * it.size, 0.6, 0.7]} />
              <meshLambertMaterial color="#5d8f63" />
            </mesh>
          );
        }
        return (
          <group key={key} scale={it.size}>
            <Tree position={[it.x / it.size, 0, it.z / it.size]} tall={it.kind === 'pine'} />
          </group>
        );
      })}
    </group>
  );
}

/** Water sits a hair above the floor so it reads as a surface, not a painted tile.
 *  It runs the length of the apron, not the map: a river that stops dead at the
 *  town boundary is the one thing that gives the edge away. */
export function River() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.03, MAP_H / 2]}>
      <planeGeometry args={[2, APRON]} />
      <meshLambertMaterial color="#3f84b8" transparent opacity={0.85} />
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
        <>
          <mesh position={[0, 1.1, 0]} castShadow>
            <icosahedronGeometry args={[0.58, 1]} />
            <meshLambertMaterial color="#3f9a63" flatShading />
          </mesh>
          <mesh position={[0.28, 1.38, 0.1]} castShadow>
            <icosahedronGeometry args={[0.36, 1]} />
            <meshLambertMaterial color="#56ad72" flatShading />
          </mesh>
        </>
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
      {getProps().map((p) => {
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
/** One storey, in world units — what a repeat of the facade texture covers. */
const STOREY = 1.5;

/**
 * The roofwork that tells you which district you are in from a street away.
 *
 * It is drawn at the top of the shaft, so it is mounted in a group whose height
 * `Shop` moves every frame — a crown written at a fixed y would sink into a
 * tower the moment its holding grew.
 */
function Crown({ kind, w, h, trim }) {
  const small = Math.min(w, h);
  switch (kind) {
    case 'mast':
      // a communications mast and a rooftop plant room: a campus, not an office
      return (
        <group>
          <mesh position={[w * 0.22, 0.3, -h * 0.2]} castShadow>
            <boxGeometry args={[small * 0.5, 0.6, small * 0.45]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh position={[-w * 0.2, 0.85, h * 0.18]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 1.7, 6]} />
            <meshLambertMaterial color="#8d99a4" />
          </mesh>
          <mesh position={[-w * 0.2, 1.55, h * 0.18]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.08, 0.14, 12]} />
            <meshLambertMaterial color="#e6ebee" />
          </mesh>
          <mesh position={[-w * 0.2, 1.78, h * 0.18]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#6fd3ff" />
          </mesh>
        </group>
      );

    case 'pediment':
      // a deep cornice and a pitched stone roof — the bank at the end of the
      // high street, four storeys up
      return (
        <group>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[w + 0.42, 0.24, h + 0.42]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[Math.hypot(w, h) * 0.46, 0.95, 4]} />
            <meshLambertMaterial color="#c9b98f" />
          </mesh>
        </group>
      );

    case 'radar':
      // a dish on a gantry and a whip aerial: you can see what this site does
      return (
        <group>
          <mesh position={[w * 0.18, 0.22, 0]} castShadow>
            <boxGeometry args={[small * 0.7, 0.44, small * 0.6]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh position={[w * 0.18, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.6, 6]} />
            <meshLambertMaterial color="#79857c" />
          </mesh>
          <mesh position={[w * 0.18, 1.08, 0]} rotation={[-0.75, 0, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.12, 0.2, 14]} />
            <meshLambertMaterial color="#eef1ee" />
          </mesh>
          <mesh position={[-w * 0.26, 0.75, h * 0.2]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1.5, 5]} />
            <meshLambertMaterial color="#5f6b63" />
          </mesh>
        </group>
      );

    case 'cross':
      // the one sign nobody has to be taught
      return (
        <group>
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[small * 0.8, 0.32, small * 0.7]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.24, 0.86, 0.1]} />
            <meshLambertMaterial color="#3fae8e" />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.86, 0.24, 0.1]} />
            <meshLambertMaterial color="#3fae8e" />
          </mesh>
        </group>
      );

    case 'stack':
      // a flue with its hazard band, and a storage tank beside it
      return (
        <group>
          <mesh position={[w * 0.26, 0.95, -h * 0.22]} castShadow>
            <cylinderGeometry args={[0.24, 0.3, 1.9, 10]} />
            <meshLambertMaterial color="#e3d9cb" />
          </mesh>
          <mesh position={[w * 0.26, 1.72, -h * 0.22]}>
            <cylinderGeometry args={[0.26, 0.26, 0.26, 10]} />
            <meshLambertMaterial color="#cf7a3c" />
          </mesh>
          <mesh position={[-w * 0.22, 0.34, h * 0.2]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.68, 12]} />
            <meshLambertMaterial color={trim} />
          </mesh>
        </group>
      );

    default:
      // the plain roof deck: a pale slab and a couple of vents
      return (
        <group>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[w - 0.25, 0.08, h - 0.25]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh position={[w * 0.2, 0.26, h * 0.18]} castShadow>
            <boxGeometry args={[small * 0.4, 0.36, small * 0.4]} />
            <meshLambertMaterial color={trim} />
          </mesh>
        </group>
      );
  }
}

/** The colonnade across a bank's street front. */
function Columns({ x, w, faceZ, dir, color }) {
  const count = Math.max(2, Math.round(w) + 1);
  const span = w - 0.5;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[x + 0.25 + (span / (count - 1)) * i, 0.62, faceZ + dir * 0.12]}
          castShadow
        >
          <cylinderGeometry args={[0.13, 0.15, 1.24, 8]} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/* The towers you cross the city for: anything that has moved this much today
   gets a flag you can see from three streets away. Hot or cold, nothing in
   between — a marker for a one-percent day is noise over every roof. */
const MOVER_PCT = 3;

/**
 * Bobs above the roof of a holding that is having a day. It follows the tower's
 * animated height, so it is mounted in the same moving group as the crown and
 * only decides each frame whether it should be showing at all.
 */
function MoverBadge({ symbol }) {
  const hot = useMemo(() => emojiTexture('🔥'), []);
  const cold = useMemo(() => emojiTexture('🧊'), []);
  const sprite = useRef(null);
  const mat = useRef(null);
  useFrame(({ clock }) => {
    const sp = sprite.current;
    const m = mat.current;
    if (!sp || !m) return;
    const tower = towerFor(symbol);
    const pct = tower?.dayPct;
    const show = Number.isFinite(pct) && Math.abs(pct) >= MOVER_PCT;
    sp.visible = show;
    if (!show) return;
    const want = pct > 0 ? hot : cold;
    if (m.map !== want) {
      m.map = want;
      m.needsUpdate = true;
    }
    sp.position.y = 1.9 + Math.sin(clock.elapsedTime * 2.2) * 0.12;
  });
  return (
    <sprite ref={sprite} position={[0, 1.9, 0]} scale={[1.1, 1.1, 1]} visible={false}>
      <spriteMaterial ref={mat} map={hot} transparent depthTest={false} />
    </sprite>
  );
}

/**
 * The company's own mark, once it has arrived. Nothing here is per-frame: a
 * logo lands once, the sign and the fascia are repainted once, and the tower
 * goes on being driven from `useFrame` exactly as before.
 */
function useLogo(domain) {
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let live = true;
    loadLogo(domain).then((got) => live && setLogo(got));
    return () => {
      live = false;
    };
  }, [domain]);
  return logo;
}

function Shop({ building, compact }) {
  const { x, y, w, h, door, emoji, name, color, district, domain } = building;
  const { loc, dir: textDir } = useI18n();
  const label = loc(name);
  const logo = useLogo(domain);
  const sign = useMemo(
    () => signTexture(emoji, label, color, textDir, logo?.image ?? null),
    [emoji, label, color, textDir, logo]
  );
  const doorOnTopRow = door.y === y;
  // sign and doorway face the street the door opens onto
  const faceZ = doorOnTopRow ? y : y + h;
  const dir = doorOnTopRow ? -1 : 1;

  /* What this building is made of, which is decided by the sector and never
     changes; how tall it is and how the day has gone come from the price.
     The company's colour is the one thing laid over the sector's material:
     the fascia over the shopfront and the frame of the board on the roof,
     the way a bank's branch is the bank's red whatever street it is on. */
  const arch = archetypeFor(district);
  const brand = logo?.colour ?? null;
  const fascia = brand ?? arch.podium;
  const board = useMemo(
    () => (logo ? rooftopTexture(logo.image, label, brand ?? color) : null),
    [logo, label, brand, color]
  );

  // distance fade: full strength close by, gone once the venue is well behind you
  const signMat = useRef(null);
  const centre = [x + w / 2, y + h / 2];
  useFrame(() => {
    const mat = signMat.current;
    if (!mat) return;
    const dist = Math.hypot(playerPos.x - centre[0], playerPos.z - centre[1]);
    const near = compact ? 9 : 13;
    const far = compact ? 17 : 24;
    const target = dist <= near ? 1 : dist >= far ? 0 : 1 - (dist - near) / (far - near);
    // ease towards the target so signs never pop
    mat.opacity += (target - mat.opacity) * 0.12;
    mat.visible = mat.opacity > 0.02;
  });

  const blocks = [];
  for (let by = y; by < y + h; by++) {
    for (let bx = x; bx < x + w; bx++) {
      if (bx === door.x && by === door.y) continue;
      blocks.push([bx, by]);
    }
  }

  /* The tower is one tall box scaled from its base rather than a stack, so a
     holding that doubles grows smoothly instead of popping a new storey into
     existence. Height, facade and roof all ease towards their targets in
     `useFrame`; nothing here re-renders when a price moves. */
  const shaft = useRef(null);
  const roof = useRef(null);
  const crown = useRef(null);
  const shaftMat = useRef(null);
  const roofMat = useRef(null);
  const current = useRef(BUILDING_HEIGHT);

  // one texture per sector; the repeat is per-material, not per-texture, so a
  // shared map still gives each building its own number of storeys
  const facade = useMemo(() => facadeTexture(arch.wall, arch.glass, arch.style).clone(), [arch]);

  /* The mood tints the district's own material rather than replacing it, so a
     bank under water is still stone and a chip maker in profit is still glass. */
  const wall = useMemo(() => new THREE.Color(arch.wall), [arch]);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const tower = building.symbol ? towerFor(building.symbol) : null;
    const want = tower?.height ?? BUILDING_HEIGHT;
    current.current += (want - current.current) * 0.08;
    const tall = current.current;

    if (shaft.current) {
      shaft.current.scale.y = tall / BUILDING_HEIGHT;
      shaft.current.position.y = tall / 2;
    }
    if (roof.current) roof.current.position.y = tall + 0.08;
    if (crown.current) crown.current.position.y = tall + 0.19;

    // the facade repeats once per storey, and a storey is taller in a bank
    // than in a plant — which is most of why the two read differently
    facade.repeat.set(1, Math.max(1, Math.round(tall / (arch.storey || STOREY))));

    if (tower) {
      target.copy(wall).multiplyScalar(tower.shade);
      // a loss goes cold as well as dark: the blue channel is held back least
      if (tower.chill) target.lerp(SCRATCH.set('#aab6c4'), 0.22);
      shaftMat.current?.color.lerp(target, 0.08);
      roofMat.current?.color.lerp(SCRATCH.set(tower.roof), 0.08);
    }
  });

  return (
    <group>
      {/* the shaft: every block of the footprint except the doorway */}
      <group ref={shaft} position={[0, BUILDING_HEIGHT / 2, 0]}>
        {blocks.map(([bx, by]) => (
          <mesh key={`${bx}-${by}`} position={[bx + 0.5, 0, by + 0.5]} castShadow receiveShadow>
            <boxGeometry args={[1, BUILDING_HEIGHT, 1]} />
            <meshLambertMaterial ref={shaftMat} color={arch.wall} map={facade} />
          </mesh>
        ))}
      </group>

      {/* ground floor: a plain band so the doorway sits in a shopfront rather
          than halfway up a window */}
      <mesh position={[x + w / 2, 0.42, y + h / 2]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.04, 0.84, h + 0.04]} />
        <meshLambertMaterial color={arch.podium} />
      </mesh>
      {/* the fascia: a band in the company's colour along the top of the
          shopfront, on every side, so the brand reads from any street */}
      {brand && (
        <mesh position={[x + w / 2, 0.93, y + h / 2]} castShadow>
          <boxGeometry args={[w + 0.1, 0.2, h + 0.1]} />
          <meshLambertMaterial color={fascia} />
        </mesh>
      )}

      {arch.columns && (
        <Columns x={x} w={w} faceZ={faceZ} dir={dir} color={arch.podium} />
      )}

      {/* lintel over the open doorway keeps the facade unbroken */}
      <mesh position={[door.x + 0.5, 1.1, door.y + 0.5]} castShadow>
        <boxGeometry args={[1, 0.5, 1]} />
        <meshLambertMaterial color={fascia} />
      </mesh>

      {/* parapet in today's colour, and the district's own roofwork above it */}
      <mesh ref={roof} position={[x + w / 2, BUILDING_HEIGHT + 0.08, y + h / 2]} castShadow>
        <boxGeometry args={[w + 0.1, 0.22, h + 0.1]} />
        <meshLambertMaterial ref={roofMat} color={color} />
      </mesh>
      <group ref={crown} position={[x + w / 2, BUILDING_HEIGHT + 0.19, y + h / 2]}>
        <Crown kind={arch.crown} w={w} h={h} trim={arch.trim} />
        {/* the board on the roof: the mark, facing the street the door is on,
            on two slim posts so it reads as signage and not as a billboard
            that fell on the building */}
        {board && (
          <group position={[0, 0, (h / 2) * dir * 0.55]} rotation={[0, doorOnTopRow ? Math.PI : 0, 0]}>
            {[-0.7, 0.7].map((px) => (
              <mesh key={px} position={[px * Math.min(w, 2.6) * 0.5, 0.45, 0]} castShadow>
                <boxGeometry args={[0.08, 0.9, 0.08]} />
                <meshLambertMaterial color="#8d99a4" />
              </mesh>
            ))}
            <mesh position={[0, 1.35, 0]} castShadow>
              <boxGeometry args={[Math.min(w, 2.6) + 0.1, 1.5, 0.1]} />
              <meshLambertMaterial color={brand ?? color} />
            </mesh>
            <mesh position={[0, 1.35, 0.06]}>
              <planeGeometry args={[Math.min(w, 2.6), 1.42]} />
              <meshBasicMaterial map={board} toneMapped={false} />
            </mesh>
            <mesh position={[0, 1.35, -0.06]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[Math.min(w, 2.6), 1.42]} />
              <meshBasicMaterial map={board} toneMapped={false} />
            </mesh>
          </group>
        )}
        {building.symbol && <MoverBadge symbol={building.symbol} />}
      </group>

      {/* lit doorway */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[door.x + 0.5, 0.05, door.y + 0.5 + dir * 0.35]}
      >
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <pointLight position={[door.x + 0.5, 1.6, door.y + 0.5]} color={color} intensity={7} distance={4.6} />

      {/* shop sign above the entrance */}
      <mesh
        position={[x + w / 2, compact ? 1.95 : 1.85, faceZ + dir * 0.06]}
        rotation={[0, doorOnTopRow ? Math.PI : 0, 0]}
        scale={compact ? 0.78 : 1}
      >
        <planeGeometry args={[Math.min(w, 2.9), 0.9]} />
        <meshBasicMaterial ref={signMat} map={sign} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}


export function Shops({ compact = false }) {
  return (
    <group>
      {getBuildings().map((b) => (
        <Shop key={b.id} building={b} compact={compact} />
      ))}
    </group>
  );
}

/** The plaza screen, the way the reference world puts a promo wall in the atrium. */
export function PlazaScreen({ title, tagline, coins, accent = '#4caf7d', compact = false }) {
  const { dir } = useI18n();
  const tex = useMemo(
    () => billboardTexture([title, tagline, coins], dir, accent),
    [title, tagline, coins, dir, accent]
  );
  return (
    <group position={[16.99, 0, 9.4]} scale={compact ? 0.86 : 1}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.3, 2.4, 0.3]} />
        <meshLambertMaterial color="#b9c2cc" />
      </mesh>
      <mesh position={[0, 3.3, 0.14]}>
        <planeGeometry args={[3.6, 2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[3.9, 2.3, 0.22]} />
        <meshLambertMaterial color="#e7eaee" />
      </mesh>
    </group>
  );
}
