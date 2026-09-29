import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM, WALL_T, WALLS } from './plan';
import { buildMaterials } from './materials';

/** A wall run turned into a box, so the plan stays the single source of truth. */
function Wall({ seg, materials }) {
  const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1);
  if (len < 0.001) return null;
  const alongX = Math.abs(seg.x2 - seg.x1) > Math.abs(seg.z2 - seg.z1);
  const cx = (seg.x1 + seg.x2) / 2;
  const cz = (seg.z1 + seg.z2) / 2;

  const map =
    seg.mat === 'wood' ? materials.wood : seg.mat === 'tile' ? materials.tile : null;
  const colour = seg.mat === 'tile' ? '#cfc7b6' : '#e8e4dc';

  return (
    <mesh
      position={[cx, seg.y0 + seg.h / 2, cz]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={alongX ? [len, seg.h, WALL_T] : [WALL_T, seg.h, len]} />
      <meshLambertMaterial map={map} color={map ? '#ffffff' : colour} />
    </mesh>
  );
}

const Box = ({ p, s, color = '#ffffff', map = null, ...rest }) => (
  <mesh position={p} castShadow receiveShadow {...rest}>
    <boxGeometry args={s} />
    <meshLambertMaterial color={color} map={map} />
  </mesh>
);

/* ── kitchen ──────────────────────────────────────────────────────────────── */

function Kitchen({ m }) {
  const H = 0.88; // worktop height
  return (
    <group>
      {/* run along the east wall */}
      <Box p={[3.88, H / 2, 3.53]} s={[0.63, H, 1.13]} map={m.oak} />
      <Box p={[3.88, H + 0.02, 3.53]} s={[0.65, 0.04, 1.15]} map={m.worktop} />

      {/* return across the north end */}
      <Box p={[2.95, H / 2, 3.78]} s={[1.18, H, 0.63]} map={m.oak} />
      <Box p={[2.95, H + 0.02, 3.78]} s={[1.2, 0.04, 0.65]} map={m.worktop} />

      {/* tall unit: oven over microwave, as in the photo */}
      <Box p={[3.88, 1.1, 2.65]} s={[0.63, 2.2, 0.6]} map={m.oak} />
      <Box p={[3.56, 1.32, 2.65]} s={[0.02, 0.5, 0.52]} color="#101216" />
      <Box p={[3.56, 0.78, 2.65]} s={[0.02, 0.42, 0.52]} color="#15171c" />
      <mesh position={[3.55, 1.6, 2.65]}>
        <boxGeometry args={[0.015, 0.06, 0.2]} />
        <meshBasicMaterial color="#2a6cf0" />
      </mesh>

      {/* wall cupboards */}
      <Box p={[3.92, 1.82, 3.6]} s={[0.55, 0.7, 1.0]} map={m.oak} />
      <Box p={[2.95, 1.82, 3.87]} s={[1.18, 0.7, 0.45]} map={m.oak} />
      {/* extractor under them */}
      <Box p={[2.95, 1.42, 3.87]} s={[0.9, 0.1, 0.42]} color="#b9bcc2" />

      {/* splashback */}
      <Box p={[4.16, 1.15, 3.4]} s={[0.02, 0.55, 1.5]} color="#5d5346" />
      <Box p={[2.95, 1.15, 4.08]} s={[1.2, 0.55, 0.02]} color="#5d5346" />

      {/* induction hob */}
      <Box p={[2.85, H + 0.05, 3.78]} s={[0.55, 0.02, 0.45]} color="#0c0d10" />
      {[-0.13, 0.13].map((dx) =>
        [-0.1, 0.1].map((dz) => (
          <mesh key={`${dx}-${dz}`} position={[2.85 + dx, H + 0.065, 3.78 + dz]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.055, 0.065, 20]} />
            <meshBasicMaterial color="#3a3f48" side={THREE.DoubleSide} />
          </mesh>
        ))
      )}

      {/* sink and the black tap */}
      <Box p={[3.9, H - 0.02, 3.35]} s={[0.4, 0.1, 0.36]} color="#1b1d22" />
      <Box p={[4.06, H + 0.14, 3.35]} s={[0.04, 0.26, 0.04]} color="#15171b" />
      <Box p={[3.99, H + 0.26, 3.35]} s={[0.18, 0.035, 0.035]} color="#15171b" />

      {/* door and drawer fronts, so the units read at the right scale */}
      {[3.24, 3.81].map((z) => (
        <group key={z}>
          <Box p={[3.55, 0.47, z]} s={[0.02, 0.76, 0.53]} map={m.oak} color="#f0dcba" />
          <Box p={[3.535, 0.78, z]} s={[0.018, 0.018, 0.2]} color="#111318" />
        </group>
      ))}
      {[2.66, 3.24].map((x) => (
        <group key={x}>
          <Box p={[x, 0.47, 3.46]} s={[0.55, 0.76, 0.02]} map={m.oak} color="#f0dcba" />
          <Box p={[x, 0.78, 3.445]} s={[0.2, 0.018, 0.018]} color="#111318" />
        </group>
      ))}
      {/* tall unit: drawers below the appliances, cupboard above */}
      {[0.16, 0.38, 0.6].map((y) => (
        <group key={y}>
          <Box p={[3.55, y, 2.65]} s={[0.02, 0.2, 0.54]} map={m.oak} color="#f0dcba" />
          <Box p={[3.535, y, 2.65]} s={[0.018, 0.016, 0.22]} color="#111318" />
        </group>
      ))}
      <Box p={[3.55, 1.95, 2.65]} s={[0.02, 0.46, 0.54]} map={m.oak} color="#f0dcba" />
      {/* wall cupboard doors */}
      {[3.35, 3.85].map((z) => (
        <Box key={z} p={[3.63, 1.82, z]} s={[0.02, 0.66, 0.46]} map={m.oak} color="#f0dcba" />
      ))}
    </group>
  );
}

/* ── bunk beds ────────────────────────────────────────────────────────────── */

function Bunks() {
  const white = '#f2f2f0';
  const mattress = '#3b3f45';
  return (
    <group>
      {/* posts */}
      {[
        [0.06, 2.62],
        [1.39, 2.62],
        [0.06, 4.56],
        [1.39, 4.56],
      ].map(([x, z]) => (
        <Box key={`${x}-${z}`} p={[x, 0.95, z]} s={[0.08, 1.9, 0.08]} color={white} />
      ))}

      {/* lower bed */}
      <Box p={[0.72, 0.3, 3.6]} s={[1.36, 0.1, 1.98]} color={white} />
      <Box p={[0.72, 0.42, 3.6]} s={[1.3, 0.16, 1.92]} color={mattress} />

      {/* upper bed with its guard rail */}
      <Box p={[0.72, 1.38, 3.6]} s={[1.36, 0.1, 1.98]} color={white} />
      <Box p={[0.72, 1.5, 3.6]} s={[1.3, 0.16, 1.92]} color={mattress} />
      <Box p={[1.36, 1.72, 3.6]} s={[0.06, 0.28, 1.9]} color={white} />
      <Box p={[0.72, 1.86, 3.6]} s={[1.36, 0.08, 0.06]} color={white} />
      {/* pillow */}
      <Box p={[0.72, 1.63, 2.92]} s={[0.62, 0.12, 0.38]} color="#d9dade" />

      {/* ladder */}
      <Box p={[1.44, 0.95, 4.2]} s={[0.05, 1.9, 0.05]} color={white} />
      {[0.45, 0.72, 0.99, 1.26].map((y) => (
        <Box key={y} p={[1.44, y, 4.36]} s={[0.06, 0.04, 0.3]} color={white} />
      ))}

      {/* reading light under the top bunk */}
      <mesh position={[1.12, 1.26, 3.1]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#ffe9c0" />
      </mesh>
      <pointLight position={[1.12, 1.2, 3.1]} intensity={1.6} distance={2.2} color="#ffd9a0" />
    </group>
  );
}

/* ── shower room ──────────────────────────────────────────────────────────── */

function Bathroom({ m }) {
  return (
    <group>
      {/* tiled inner faces */}
      <mesh position={[0.06, 1.25, 1.15]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[2.2, 2.5]} />
        <meshLambertMaterial map={m.tile} />
      </mesh>
      <mesh position={[0.95, 1.25, 0.06]} receiveShadow>
        <planeGeometry args={[1.8, 2.5]} />
        <meshLambertMaterial map={m.tile} />
      </mesh>
      <mesh position={[0.95, 1.25, 2.24]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[1.8, 2.5]} />
        <meshLambertMaterial map={m.tile} />
      </mesh>

      {/* walk-in tray */}
      <mesh position={[0.52, 0.03, 0.62]} receiveShadow>
        <boxGeometry args={[0.94, 0.06, 1.12]} />
        <meshLambertMaterial map={m.mosaic} />
      </mesh>
      {/* glass screen in its black frame */}
      <mesh position={[1.0, 1.05, 0.62]}>
        <boxGeometry args={[0.02, 2.0, 1.1]} />
        <meshPhysicalMaterial color="#cfe4ea" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      <Box p={[1.0, 1.05, 0.06]} s={[0.04, 2.0, 0.04]} color="#111317" />
      <Box p={[1.0, 1.05, 1.17]} s={[0.04, 2.0, 0.04]} color="#111317" />
      <Box p={[1.0, 2.05, 0.62]} s={[0.04, 0.04, 1.12]} color="#111317" />
      {/* riser rail and head */}
      <Box p={[0.1, 1.35, 0.62]} s={[0.04, 1.1, 0.04]} color="#c9ced6" />
      <Box p={[0.16, 1.85, 0.62]} s={[0.14, 0.03, 0.09]} color="#c9ced6" />

      {/* vanity, basin, tap */}
      <Box p={[0.55, 0.42, 2.05]} s={[1.0, 0.84, 0.4]} color="#191b20" />
      <Box p={[0.55, 0.86, 2.05]} s={[1.04, 0.04, 0.44]} color="#26282e" />
      <mesh position={[0.6, 0.96, 2.05]} castShadow>
        <cylinderGeometry args={[0.19, 0.16, 0.16, 24]} />
        <meshLambertMaterial color="#fbfbfa" />
      </mesh>
      <Box p={[0.6, 1.05, 2.21]} s={[0.04, 0.22, 0.04]} color="#b9c0c8" />

      {/* the lit mirror */}
      <Box p={[0.62, 1.55, 2.23]} s={[0.78, 0.5, 0.02]} color="#2b3038" />
      <mesh position={[0.62, 1.55, 2.215]}>
        <planeGeometry args={[0.84, 0.56]} />
        <meshBasicMaterial color="#eaf6ff" />
      </mesh>
      <mesh position={[0.62, 1.55, 2.21]}>
        <planeGeometry args={[0.72, 0.44]} />
        <meshBasicMaterial color="#2f3640" />
      </mesh>
      <pointLight position={[0.62, 1.55, 1.95]} intensity={2.4} distance={2.6} color="#dceeff" />
    </group>
  );
}

/* ── living end ───────────────────────────────────────────────────────────── */

function Chair({ p, rotation = 0 }) {
  return (
    <group position={p} rotation={[0, rotation, 0]}>
      <Box p={[0, 0.44, 0]} s={[0.44, 0.05, 0.42]} color="#f4f4f2" />
      <mesh position={[0, 0.66, -0.19]} rotation={[-0.16, 0, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.05]} />
        <meshLambertMaterial color="#f4f4f2" />
      </mesh>
      {[
        [-0.16, -0.15],
        [0.16, -0.15],
        [-0.16, 0.16],
        [0.16, 0.16],
      ].map(([dx, dz]) => (
        <mesh key={`${dx}-${dz}`} position={[dx, 0.21, dz]} rotation={[dz > 0 ? 0.08 : -0.08, 0, dx > 0 ? -0.08 : 0.08]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.44, 8]} />
          <meshLambertMaterial color="#c8a878" />
        </mesh>
      ))}
    </group>
  );
}

function Living({ m }) {
  const fire = useRef(null);
  // the fire on the screen should breathe a little
  useFrame(({ clock }) => {
    if (!fire.current) return;
    const t = clock.getElapsedTime();
    fire.current.intensity = 2.1 + Math.sin(t * 7.3) * 0.35 + Math.sin(t * 3.1) * 0.25;
  });

  return (
    <group>
      {/* television, playing the fireplace */}
      <Box p={[0.1, 1.38, 5.9]} s={[0.06, 0.7, 1.22]} color="#0b0c0f" />
      <mesh position={[0.14, 1.38, 5.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.12, 0.63]} />
        <meshBasicMaterial map={m.fire} toneMapped={false} />
      </mesh>
      <pointLight ref={fire} position={[0.75, 1.38, 5.9]} intensity={2.2} distance={4.2} color="#ff8a34" />

      {/* round table */}
      <mesh position={[1.37, 0.73, 5.62]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 32]} />
        <meshLambertMaterial color="#f6f6f4" />
      </mesh>
      {[
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
      ].map(([dx, dz]) => (
        <mesh key={`${dx}-${dz}`} position={[1.37 + dx, 0.36, 5.62 + dz]} rotation={[dz > 0 ? 0.1 : -0.1, 0, dx > 0 ? -0.1 : 0.1]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.72, 8]} />
          <meshLambertMaterial color="#c8a878" />
        </mesh>
      ))}

      <Chair p={[1.37, 0, 4.98]} rotation={0} />
      <Chair p={[1.37, 0, 6.26]} rotation={Math.PI} />
      <Chair p={[0.73, 0, 5.62]} rotation={Math.PI / 2} />
      <Chair p={[2.01, 0, 5.62]} rotation={-Math.PI / 2} />

      {/* the little black stool */}
      <mesh position={[0.45, 0.46, 4.85]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 16]} />
        <meshLambertMaterial color="#8d8f94" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.45 + Math.cos((i / 3) * Math.PI * 2) * 0.11, 0.22, 4.85 + Math.sin((i / 3) * Math.PI * 2) * 0.11]}
          rotation={[Math.sin((i / 3) * Math.PI * 2) * 0.12, 0, -Math.cos((i / 3) * Math.PI * 2) * 0.12]}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.44, 6]} />
          <meshLambertMaterial color="#1a1c20" />
        </mesh>
      ))}

      {/* sofa against the east wall */}
      <mesh position={[3.78, 0.22, 6.37]} castShadow receiveShadow>
        <boxGeometry args={[0.84, 0.44, 1.74]} />
        <meshLambertMaterial map={m.sofa} />
      </mesh>
      <mesh position={[4.02, 0.6, 6.37]} castShadow>
        <boxGeometry args={[0.36, 0.5, 1.74]} />
        <meshLambertMaterial map={m.sofa} />
      </mesh>
      {[5.72, 6.37, 7.02].map((z) => (
        <mesh key={z} position={[3.7, 0.5, z]} castShadow>
          <boxGeometry args={[0.6, 0.14, 0.58]} />
          <meshLambertMaterial map={m.sofa} />
        </mesh>
      ))}
      <Box p={[3.62, 0.66, 5.78]} s={[0.26, 0.26, 0.1]} color="#e3c45e" rotation={[0, 0, 0.5]} />

      {/* round tray coffee table */}
      <mesh position={[2.92, 0.36, 6.42]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 20]} />
        <meshLambertMaterial color="#1e2126" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[2.92 + Math.cos((i / 3) * Math.PI * 2) * 0.16, 0.17, 6.42 + Math.sin((i / 3) * Math.PI * 2) * 0.16]}
        >
          <cylinderGeometry args={[0.012, 0.012, 0.34, 6]} />
          <meshLambertMaterial color="#1e2126" />
        </mesh>
      ))}

      {/* curtains either side of the window */}
      {[0.58, 3.28].map((x) => (
        <mesh key={x} position={[x, 1.3, 7.44]} castShadow>
          <boxGeometry args={[0.26, 2.36, 0.1]} />
          <meshLambertMaterial map={m.curtain} color="#aebfc7" />
        </mesh>
      ))}

      {/* the cool LED strip along the floor by the curtain */}
      <mesh position={[3.3, 0.03, 7.3]}>
        <boxGeometry args={[0.5, 0.02, 0.24]} />
        <meshBasicMaterial color="#5bc8ff" />
      </mesh>
      <pointLight position={[3.3, 0.22, 7.2]} intensity={1.5} distance={2.4} color="#57c4ff" />

      {/* pendant light */}
      <Box p={[2.3, 2.46, 6.1]} s={[0.05, 0.08, 0.05]} color="#2a2d33" />
      <mesh position={[2.3, 2.28, 6.1]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshBasicMaterial color="#ffeccd" />
      </mesh>
      <pointLight position={[2.3, 2.2, 6.1]} intensity={3.4} distance={6} color="#ffe2b8" />
    </group>
  );
}

/* ── the view out ─────────────────────────────────────────────────────────── */

function Outside({ m }) {
  return (
    <group>
      {/* balcony deck and its carved railing */}
      <Box p={[1.95, 0.02, 8.25]} s={[3.4, 0.06, 1.3]} color="#7d6a52" />
      <Box p={[1.95, 0.95, 8.85]} s={[3.4, 0.08, 0.1]} color="#caa87c" />
      <Box p={[1.95, 0.2, 8.85]} s={[3.4, 0.1, 0.1]} color="#caa87c" />
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[0.35 + i * 0.23, 0.58, 8.85]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.68, 8]} />
          <meshLambertMaterial color="#e2cba6" />
        </mesh>
      ))}

      {/* the mountains, painted on a backdrop */}
      <mesh position={[1.9, 3.2, 15]}>
        <planeGeometry args={[34, 20]} />
        <meshBasicMaterial map={m.view} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ── the whole flat ───────────────────────────────────────────────────────── */

export default function Apartment() {
  const m = useMemo(() => buildMaterials(), []);

  return (
    <group>
      {/* floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM.w / 2, 0, ROOM.d / 2]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshLambertMaterial map={m.floor} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[ROOM.w / 2, ROOM.h, ROOM.d / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshLambertMaterial color="#efece6" />
      </mesh>

      {WALLS.map((seg, i) => (
        <Wall key={i} seg={seg} materials={m} />
      ))}

      {/* glazing in the window opening */}
      <mesh position={[1.925, 1.3, ROOM.d]}>
        <planeGeometry args={[2.95, 1.9]} />
        <meshPhysicalMaterial
          color="#dbeeff"
          transparent
          opacity={0.1}
          roughness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Box p={[1.925, 1.3, ROOM.d]} s={[0.035, 1.9, 0.05]} color="#8b9099" />

      {/* front door */}
      <Box p={[3.35, 1.02, 0.02]} s={[0.86, 2.04, 0.05]} color="#1b1d22" />
      <mesh position={[3.72, 1.0, 0.06]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        <meshLambertMaterial color="#c8ccd2" />
      </mesh>

      {/* ceiling panel over the hall, as in the photo */}
      <mesh position={[3.0, 2.47, 1.5]}>
        <boxGeometry args={[0.7, 0.04, 0.35]} />
        <meshBasicMaterial color="#fdf6e6" />
      </mesh>
      <pointLight position={[3.0, 2.3, 1.6]} intensity={4.5} distance={6.5} color="#fff2dc" />
      <pointLight position={[3.1, 2.25, 3.3]} intensity={4.2} distance={5.5} color="#ffeed6" />
      <pointLight position={[0.95, 2.25, 1.1]} intensity={2.6} distance={3.6} color="#f0f6ff" />
      <pointLight position={[1.0, 2.2, 3.6]} intensity={2.2} distance={3.6} color="#ffeed6" />

      <Kitchen m={m} />
      <Bunks />
      <Bathroom m={m} />
      <Living m={m} />
      <Outside m={m} />
    </group>
  );
}
