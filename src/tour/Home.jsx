import { useMemo } from 'react';
import * as THREE from 'three';
import { buildMaterials } from '../apartment/materials';
import { CEIL, WALL_T } from './generate';

const Box = ({ p, s, color = '#ffffff', map = null, ...rest }) => (
  <mesh position={p} castShadow receiveShadow {...rest}>
    <boxGeometry args={s} />
    <meshLambertMaterial color={color} map={map} />
  </mesh>
);

function Wall({ seg, m }) {
  const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1);
  if (len < 0.001) return null;
  const alongX = Math.abs(seg.x2 - seg.x1) > Math.abs(seg.z2 - seg.z1);
  return (
    <mesh
      position={[(seg.x1 + seg.x2) / 2, seg.y0 + seg.h / 2, (seg.z1 + seg.z2) / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={alongX ? [len, seg.h, WALL_T] : [WALL_T, seg.h, len]} />
      <meshLambertMaterial color={seg.mat === 'tile' ? '#ffffff' : '#ece8e1'} map={seg.mat === 'tile' ? m.tile : null} />
    </mesh>
  );
}

/* ── furniture ────────────────────────────────────────────────────────────── */

function Bed({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <Box p={[cx, 0.22, cz]} s={[f.w, 0.4, f.d]} color="#8c7a63" />
      <Box p={[cx, 0.47, cz]} s={[f.w - 0.08, 0.18, f.d - 0.06]} color="#f3f1ec" />
      <Box p={[cx + f.w * 0.1, 0.58, cz]} s={[f.w * 0.72, 0.08, f.d - 0.12]} color="#cfd6de" />
      <Box p={[f.x + f.w - 0.06, 0.62, cz]} s={[0.1, 0.72, f.d]} color="#9b8a72" />
      {[-1, 1].map((sgn) => (
        <Box
          key={sgn}
          p={[f.x + 0.28, 0.6, cz + sgn * (f.d / 4)]}
          s={[0.34, 0.11, Math.min(0.42, f.d / 2.4)]}
          color="#ffffff"
        />
      ))}
    </group>
  );
}

function Wardrobe({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  const doors = Math.max(2, Math.round(f.w / 0.6));
  return (
    <group>
      <Box p={[cx, 1.05, cz]} s={[f.w, 2.1, f.d]} color="#d8cbb6" />
      {Array.from({ length: doors }, (_, i) => {
        const dw = f.w / doors;
        const x = f.x + dw * (i + 0.5);
        return (
          <group key={i}>
            <Box p={[x, 1.05, f.z - 0.012]} s={[dw - 0.03, 2.04, 0.02]} color="#e6dbc8" />
            <Box p={[x + dw * 0.32, 1.05, f.z - 0.03]} s={[0.03, 0.22, 0.03]} color="#2c2f36" />
          </group>
        );
      })}
    </group>
  );
}

function Bedside({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <Box p={[cx, 0.24, cz]} s={[f.w, 0.48, f.d]} color="#d8cbb6" />
      <mesh position={[cx, 0.62, cz]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color="#ffe6bd" />
      </mesh>
      <pointLight position={[cx, 0.66, cz]} intensity={1.1} distance={2.4} color="#ffd9a4" />
    </group>
  );
}

function Shower({ f, m }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <mesh position={[cx, 0.03, cz]} receiveShadow>
        <boxGeometry args={[f.w, 0.06, f.d]} />
        <meshLambertMaterial map={m.mosaic} />
      </mesh>
      <mesh position={[f.x, 1.05, cz]}>
        <boxGeometry args={[0.02, 2.0, f.d]} />
        <meshPhysicalMaterial color="#d2e6ec" transparent opacity={0.2} roughness={0.05} />
      </mesh>
      <Box p={[f.x, 1.05, f.z]} s={[0.04, 2.0, 0.04]} color="#15181d" />
      <Box p={[f.x, 1.05, f.z + f.d]} s={[0.04, 2.0, 0.04]} color="#15181d" />
      <Box p={[f.x + f.w - 0.08, 1.35, cz]} s={[0.04, 1.1, 0.04]} color="#c6ccd4" />
      <Box p={[f.x + f.w - 0.2, 1.86, cz]} s={[0.2, 0.03, 0.1]} color="#c6ccd4" />
    </group>
  );
}

function Wc({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <Box p={[cx, 0.2, cz]} s={[0.36, 0.4, 0.5]} color="#fbfbfa" />
      <Box p={[cx, 0.42, cz - 0.02]} s={[0.4, 0.06, 0.52]} color="#ffffff" />
      <Box p={[cx, 0.62, f.z + f.d - 0.1]} s={[0.4, 0.5, 0.16]} color="#f4f4f2" />
    </group>
  );
}

function Vanity({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <Box p={[cx, 0.42, cz]} s={[f.w, 0.84, f.d]} color="#1b1e24" />
      <Box p={[cx, 0.86, cz]} s={[f.w + 0.04, 0.04, f.d + 0.04]} color="#292d34" />
      <mesh position={[cx, 0.96, cz]} castShadow>
        <cylinderGeometry args={[0.17, 0.15, 0.15, 20]} />
        <meshLambertMaterial color="#fcfcfb" />
      </mesh>
      <Box p={[cx, 1.52, f.z + f.d - 0.02]} s={[Math.min(0.8, f.w), 0.52, 0.02]} color="#2e343d" />
      <mesh position={[cx, 1.52, f.z + f.d - 0.035]}>
        <planeGeometry args={[Math.min(0.86, f.w + 0.06), 0.58]} />
        <meshBasicMaterial color="#e9f5ff" />
      </mesh>
      <pointLight position={[cx, 1.52, cz - 0.2]} intensity={1.8} distance={2.4} color="#dbeeff" />
    </group>
  );
}

function Counter({ f, m }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  const alongZ = f.d > f.w;
  return (
    <group>
      <Box p={[cx, 0.44, cz]} s={[f.w, 0.88, f.d]} map={m.oak} />
      <Box p={[cx, 0.9, cz]} s={[f.w + 0.03, 0.04, f.d + 0.03]} map={m.worktop} />
      {/* a hob and a sink, laid along whichever way the run goes */}
      <Box
        p={alongZ ? [cx, 0.93, f.z + f.d * 0.3] : [f.x + f.w * 0.3, 0.93, cz]}
        s={alongZ ? [f.w * 0.7, 0.02, 0.45] : [0.5, 0.02, f.d * 0.7]}
        color="#0c0e12"
      />
      <Box
        p={alongZ ? [cx, 0.88, f.z + f.d * 0.72] : [f.x + f.w * 0.72, 0.88, cz]}
        s={alongZ ? [f.w * 0.62, 0.1, 0.36] : [0.4, 0.1, f.d * 0.6]}
        color="#1d2026"
      />
      {/* wall cupboards above */}
      <Box p={[cx, 1.82, cz]} s={[f.w * 0.92, 0.68, f.d * 0.66]} map={m.oak} />
    </group>
  );
}

function Sofa({ f, m }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <mesh position={[cx, 0.22, cz]} castShadow receiveShadow>
        <boxGeometry args={[f.w, 0.44, f.d]} />
        <meshLambertMaterial map={m.sofa} />
      </mesh>
      <mesh position={[f.x + 0.16, 0.6, cz]} castShadow>
        <boxGeometry args={[0.32, 0.5, f.d]} />
        <meshLambertMaterial map={m.sofa} />
      </mesh>
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[cx + 0.08, 0.5, cz + sgn * (f.d / 3.4)]} castShadow>
          <boxGeometry args={[f.w * 0.62, 0.13, Math.min(0.5, f.d / 3)]} />
          <meshLambertMaterial map={m.sofa} />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  const r = Math.min(f.w, f.d) / 2;
  return (
    <group>
      <mesh position={[cx, 0.36, cz]} castShadow>
        <cylinderGeometry args={[r, r, 0.04, 20]} />
        <meshLambertMaterial color="#20242b" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[cx + Math.cos((i / 3) * Math.PI * 2) * r * 0.66, 0.17, cz + Math.sin((i / 3) * Math.PI * 2) * r * 0.66]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.34, 6]} />
          <meshLambertMaterial color="#20242b" />
        </mesh>
      ))}
    </group>
  );
}

function Dining({ f }) {
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  return (
    <group>
      <Box p={[cx, 0.73, cz]} s={[f.w, 0.05, f.d]} color="#f3f1ec" />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[cx + sx * (f.w / 2 - 0.1), 0.36, cz + sz * (f.d / 2 - 0.1)]}>
          <cylinderGeometry args={[0.025, 0.03, 0.72, 8]} />
          <meshLambertMaterial color="#c6a67c" />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Box p={[cx + sx * (f.w / 2 + 0.28), 0.44, cz]} s={[0.42, 0.05, 0.42]} color="#f6f6f4" />
          <Box p={[cx + sx * (f.w / 2 + 0.44), 0.66, cz]} s={[0.05, 0.42, 0.42]} color="#f6f6f4" />
        </group>
      ))}
    </group>
  );
}

const PIECES = {
  bed: Bed,
  wardrobe: Wardrobe,
  bedside: Bedside,
  shower: Shower,
  wc: Wc,
  vanity: Vanity,
  counter: Counter,
  'kitchen-run': Counter,
  sofa: Sofa,
  coffee: CoffeeTable,
  dining: Dining,
};

/* ── the agent's own photographs, hung in the hall ────────────────────────── */

/* ── the whole home ───────────────────────────────────────────────────────── */

export default function Home({ plan }) {
  const m = useMemo(() => buildMaterials(), []);
  const living = plan.rooms.find((r) => r.type === 'living');

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[plan.W / 2, 0, plan.D / 2]} receiveShadow>
        <planeGeometry args={[plan.W, plan.D]} />
        <meshLambertMaterial map={m.floor} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[plan.W / 2, CEIL, plan.D / 2]}>
        <planeGeometry args={[plan.W, plan.D]} />
        <meshLambertMaterial color="#f2efe9" />
      </mesh>

      {plan.walls.map((seg, i) => (
        <Wall key={i} seg={seg} m={m} />
      ))}

      {/* the media wall in the living room */}
      {living && (
        <group>
          <mesh position={[plan.W - 0.03, 1.3, living.z + living.d - 1.2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[Math.min(2.6, living.d), 2.4]} />
            <meshLambertMaterial map={m.wood} />
          </mesh>
          <Box p={[plan.W - 0.12, 1.32, living.z + living.d - 1.2]} s={[0.06, 0.66, 1.15]} color="#0c0e12" />
          <mesh position={[plan.W - 0.16, 1.32, living.z + living.d - 1.2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.06, 0.6]} />
            <meshBasicMaterial map={m.fire} toneMapped={false} />
          </mesh>
          <pointLight
            position={[plan.W - 0.8, 1.32, living.z + living.d - 1.2]}
            intensity={1.8}
            distance={4}
            color="#ff8f3c"
          />
        </group>
      )}

      {plan.solids.map((f, i) => {
        const Piece = PIECES[f.kind];
        return Piece ? <Piece key={i} f={f} m={m} /> : null;
      })}

      {/* glazing, curtains and the balcony */}
      <mesh position={[(plan.window.x0 + plan.window.x1) / 2, 1.35, plan.D]}>
        <planeGeometry args={[plan.window.x1 - plan.window.x0, 1.9]} />
        <meshPhysicalMaterial color="#dbeeff" transparent opacity={0.1} roughness={0} side={THREE.DoubleSide} />
      </mesh>
      {[plan.window.x0 + 0.16, plan.window.x1 - 0.16].map((x) => (
        <mesh key={x} position={[x, 1.35, plan.D - 0.14]} castShadow>
          <boxGeometry args={[0.24, 2.3, 0.1]} />
          <meshLambertMaterial map={m.curtain} color="#b6c4cc" />
        </mesh>
      ))}

      {plan.balcony && (
        <group>
          <Box p={[plan.W / 2, 0.02, plan.D + 0.7]} s={[plan.W - 0.4, 0.06, 1.4]} color="#7d6a52" />
          <Box p={[plan.W / 2, 0.95, plan.D + 1.36]} s={[plan.W - 0.4, 0.08, 0.1]} color="#c9a87c" />
          {Array.from({ length: Math.round(plan.W * 3) }, (_, i) => (
            <mesh key={i} position={[0.35 + i * 0.34, 0.5, plan.D + 1.36]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.92, 6]} />
              <meshLambertMaterial color="#e0c9a6" />
            </mesh>
          ))}
        </group>
      )}

      {/* the view */}
      <mesh position={[plan.W / 2, 3.4, plan.D + 16]}>
        <planeGeometry args={[40, 22]} />
        <meshBasicMaterial map={m.view} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* a ceiling light per room */}
      {plan.rooms.map((room) => (
        <pointLight
          key={room.id}
          position={[room.x + room.w / 2, CEIL - 0.3, room.z + room.d / 2]}
          intensity={3.2}
          distance={Math.max(5, room.d + room.w)}
          color="#fff0da"
        />
      ))}
      <pointLight position={[0.65, CEIL - 0.3, 1.2]} intensity={2.4} distance={5} color="#fff0da" />
    </group>
  );
}
