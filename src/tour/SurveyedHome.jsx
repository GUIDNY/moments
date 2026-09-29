import { useMemo } from 'react';
import * as THREE from 'three';
import { floorTexture, luminance, outside, plaster, shade } from './surfaces';

/**
 * The home the photographs described, drawn.
 *
 * Its sibling `Home.jsx` draws the *generated* flat — the one built from a
 * slider, used for the builder's live preview before any photograph exists.
 * This one draws the surveyed flat, and everything it puts on screen traces
 * back to a photograph: the wall colour of each room, its floor and what that
 * floor is made of, the height of its ceiling, where its windows sit, and which
 * piece of furniture stands against which wall.
 *
 * Nothing here hangs a photograph on a wall. That was the old trick, and it was
 * the wrong one: it left the client walking through a flat that was not the one
 * in the pictures, with the pictures framed inside it as if to prove it.
 */

const Box = ({ p, s, color, map = null, ...rest }) => (
  <mesh position={p} castShadow receiveShadow {...rest}>
    <boxGeometry args={s} />
    <meshLambertMaterial color={color} map={map} />
  </mesh>
);

/** Height above the floor, and how far up it starts, for each kind of thing. */
const HEIGHT = {
  bed: 0.32, wardrobe: 2.0, bedside: 0.48, sofa: 0.42, armchair: 0.44,
  'coffee-table': 0.38, 'dining-table': 0.72, bookshelf: 1.78, desk: 0.72,
  counter: 0.9, island: 0.9, fridge: 1.78, bathtub: 0.52, wc: 0.4,
  vanity: 0.8, plant: 0.36, rug: 0.012, tv: 0.62, shower: 2.0,
};

function Piece({ f }) {
  const h = HEIGHT[f.kind] ?? 0.6;
  const cx = f.x + f.w / 2;
  const cz = f.z + f.d / 2;
  const c = f.color || '#8e8e8e';
  const dark = shade(c, -0.25);
  const light = shade(c, 0.22);

  switch (f.kind) {
    case 'bed':
      return (
        <group>
          {/* base, mattress, pillows — the pillows sit at the narrow end */}
          <Box p={[cx, 0.16, cz]} s={[f.w, 0.32, f.d]} color={dark} />
          <Box p={[cx, 0.4, cz]} s={[f.w - 0.06, 0.18, f.d - 0.06]} color={light} />
          <Box p={[f.x + 0.3, 0.55, cz]} s={[0.42, 0.12, f.d * 0.8]} color="#f4f1ea" />
          <Box p={[f.x + 0.02, 0.62, cz]} s={[0.06, 0.62, f.d]} color={dark} />
        </group>
      );
    case 'sofa':
      return (
        <group>
          <Box p={[cx, 0.21, cz]} s={[f.w, 0.42, f.d]} color={c} />
          <Box p={[cx, 0.52, cz]} s={[f.w * 0.55, 0.2, f.d - 0.1]} color={light} />
          <Box p={[f.x + 0.12, 0.6, cz]} s={[0.22, 0.58, f.d]} color={dark} />
        </group>
      );
    case 'armchair':
      return (
        <group>
          <Box p={[cx, 0.22, cz]} s={[f.w, 0.44, f.d]} color={c} />
          <Box p={[f.x + 0.1, 0.62, cz]} s={[0.18, 0.5, f.d]} color={dark} />
        </group>
      );
    case 'wc':
      return (
        <group>
          <Box p={[cx, 0.2, cz]} s={[f.w * 0.75, 0.4, f.d * 0.8]} color="#f3f4f3" />
          <Box p={[f.x + 0.08, 0.55, cz]} s={[0.16, 0.7, f.d * 0.8]} color="#eceeec" />
        </group>
      );
    case 'shower':
      return (
        <group>
          <Box p={[cx, 0.04, cz]} s={[f.w, 0.08, f.d]} color={shade(c, 0.1)} />
          <mesh position={[cx, 1.05, cz]}>
            <boxGeometry args={[f.w, 2.0, f.d]} />
            <meshPhysicalMaterial color="#dff0f5" transparent opacity={0.16} roughness={0} />
          </mesh>
        </group>
      );
    case 'plant':
      return (
        <group>
          <Box p={[cx, 0.17, cz]} s={[f.w * 0.7, 0.34, f.d * 0.7]} color="#9a6a4a" />
          <mesh position={[cx, 0.78, cz]} castShadow>
            <sphereGeometry args={[Math.max(f.w, f.d) * 0.62, 10, 8]} />
            <meshLambertMaterial color="#4a7f4a" />
          </mesh>
        </group>
      );
    case 'rug':
      return (
        <mesh position={[cx, 0.008, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[f.w, f.d]} />
          <meshLambertMaterial color={c} />
        </mesh>
      );
    case 'tv':
      return (
        <group>
          <Box p={[cx, 1.28, cz]} s={[Math.max(f.w, 0.08), 0.62, Math.max(f.d, 0.08)]} color="#101318" />
          <pointLight position={[cx, 1.28, cz]} intensity={0.5} distance={2.4} color="#8fb6ff" />
        </group>
      );
    case 'dining-table':
    case 'desk':
    case 'coffee-table': {
      const legR = 0.035;
      return (
        <group>
          <Box p={[cx, h, cz]} s={[f.w, 0.06, f.d]} color={c} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <mesh key={i} position={[cx + sx * (f.w / 2 - 0.1), h / 2, cz + sz * (f.d / 2 - 0.1)]} castShadow>
              <cylinderGeometry args={[legR, legR, h, 6]} />
              <meshLambertMaterial color={dark} />
            </mesh>
          ))}
        </group>
      );
    }
    case 'counter':
    case 'island':
      return (
        <group>
          <Box p={[cx, 0.44, cz]} s={[f.w, 0.88, f.d]} color={c} />
          <Box p={[cx, 0.92, cz]} s={[f.w + 0.03, 0.05, f.d + 0.03]} color={shade(c, -0.4)} />
        </group>
      );
    default:
      return <Box p={[cx, h / 2, cz]} s={[f.w, h, f.d]} color={c} />;
  }
}

/** A wall run, taking the colour of the room it faces. */
function Wall({ seg }) {
  const dx = seg.x2 - seg.x1;
  const dz = seg.z2 - seg.z1;
  const len = Math.hypot(dx, dz);
  if (len < 0.01 || seg.h < 0.01) return null;
  const tex = plaster(seg.color || '#efeae2');
  return (
    <mesh
      position={[(seg.x1 + seg.x2) / 2, seg.y0 + seg.h / 2, (seg.z1 + seg.z2) / 2]}
      rotation={[0, Math.atan2(dx, dz), 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.1, seg.h, len]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

/** A room's own floor, in its own material. */
function Floor({ room }) {
  const o = room.observed;
  const tex = useMemo(
    () => floorTexture(o.floor?.kind || 'wood', o.floor?.color || '#8a6a4a', Math.max(room.w, room.d)),
    [o.floor?.kind, o.floor?.color, room.w, room.d]
  );
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[room.x + room.w / 2, 0.001, room.z + room.d / 2]}
      receiveShadow
    >
      <planeGeometry args={[room.w, room.d]} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

export default function SurveyedHome({ plan }) {
  const H = plan.H;
  const firstRoom = plan.rooms[0];

  // the corridor takes the floor of the room you meet first, the way a hall
  // usually continues whatever the entrance is laid with
  const hallTex = useMemo(() => {
    const o = firstRoom?.observed;
    return floorTexture(o?.floor?.kind || 'tile', o?.floor?.color || '#b9b2a6', plan.D);
  }, [firstRoom, plan.D]);

  const ceilingColor = useMemo(() => {
    const wall = firstRoom?.observed?.wallColor || '#f2efe9';
    // a ceiling is nearly always lighter than the walls under it
    return luminance(wall) > 0.75 ? shade(wall, 0.25) : shade(wall, 0.45);
  }, [firstRoom]);

  const sky = useMemo(() => outside(), []);

  return (
    <group>
      {/* the corridor floor runs the length of the flat, rooms overlay their own */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[plan.W / 2, 0, plan.D / 2]} receiveShadow>
        <planeGeometry args={[plan.W, plan.D]} />
        <meshLambertMaterial map={hallTex} />
      </mesh>
      {plan.rooms.map((room) => (
        <Floor key={room.id} room={room} />
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[plan.W / 2, H, plan.D / 2]}>
        <planeGeometry args={[plan.W, plan.D]} />
        <meshLambertMaterial color={ceilingColor} />
      </mesh>

      {plan.walls.map((seg, i) => (
        <Wall key={i} seg={seg} />
      ))}

      {plan.solids.map((f, i) => (
        <Piece key={i} f={f} />
      ))}

      {/* the glazing in every opening, whichever wall it was cut into */}
      {(plan.openings || []).map((o, i) => {
        const w = o.b - o.a;
        const h = o.head - o.sill;
        if (w < 0.1 || h < 0.1) return null;
        const y = (o.sill + o.head) / 2;
        const mid = (o.a + o.b) / 2;
        const onSide = o.wall !== 'far';
        return (
          <mesh
            key={i}
            position={onSide ? [o.at, y, mid] : [mid, y, o.at]}
            rotation={onSide ? [0, Math.PI / 2, 0] : [0, 0, 0]}
          >
            <planeGeometry args={[w, h]} />
            <meshPhysicalMaterial color="#dbeeff" transparent opacity={0.12} roughness={0} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* and what is beyond them, on all three sides the flat can see out of */}
      <mesh position={[plan.W / 2, 3.2, plan.D + 15]}>
        <planeGeometry args={[46, 24]} />
        <meshBasicMaterial map={sky} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-12, 3.2, plan.D / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.max(46, plan.D * 2), 24]} />
        <meshBasicMaterial map={sky} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[plan.W + 12, 3.2, plan.D / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.max(46, plan.D * 2), 24]} />
        <meshBasicMaterial map={sky} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* one lamp per room, warm, at the ceiling */}
      {plan.rooms.map((room) => (
        <pointLight
          key={room.id}
          position={[room.x + room.w / 2, H - 0.3, room.z + room.d / 2]}
          intensity={3.0}
          distance={Math.max(5, room.d + room.w)}
          color="#fff0da"
        />
      ))}
      <pointLight position={[0.65, H - 0.3, 1.2]} intensity={2.2} distance={5} color="#fff0da" />
    </group>
  );
}
