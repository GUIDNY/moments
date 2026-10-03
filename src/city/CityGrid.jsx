import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TILE } from './layout';
import { GROUND, groundTexture } from './textures';

/**
 * The ground: one textured plane for the whole grid, a base slab under it
 * so the city reads as a board with an edge, the country around it, and a
 * lake that ripples. Drawn
 * once per layout; nothing here is per-tile React.
 */
/* Fields in the country round the board: offsets from the board's centre,
   past its edge on every side, in two greens and a straw. Decided once. */
const FIELDS = [
  { x: -24, z: -6, w: 9, h: 14, c: '#b4d47f' },
  { x: -22, z: 12, w: 7, h: 9, c: '#d6cf7e' },
  { x: 24, z: -10, w: 8, h: 12, c: '#b4d47f' },
  { x: 25, z: 8, w: 10, h: 10, c: '#d6cf7e' },
  { x: -6, z: -24, w: 14, h: 8, c: '#8fbd6b' },
  { x: 12, z: -25, w: 9, h: 9, c: '#d6cf7e' },
  { x: 4, z: 25, w: 12, h: 9, c: '#b4d47f' },
  { x: -14, z: 24, w: 8, h: 7, c: '#8fbd6b' },
];

export default function CityGrid({ plan }) {
  const { grid, size } = plan;
  const tex = useMemo(() => groundTexture(grid, TILE), [grid]);
  const water = useMemo(() => {
    const cells = [];
    grid.forEach((row, y) => row.forEach((v, x) => v === TILE.WATER && cells.push([x, y])));
    return cells;
  }, [grid]);
  const ripple = useRef();
  useFrame(({ clock }) => {
    if (ripple.current) ripple.current.position.y = 0.025 + Math.sin(clock.elapsedTime * 1.3) * 0.006;
  });
  return (
    <group>
      {/* the country past the board, out past anything the camera can reach:
          the same lawn, a shade deeper, with fields in it — so the city fills
          every screen and never floats on a blank. A pale kerb marks where the
          plan ends. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size / 2, -0.02, size / 2]} receiveShadow>
        <planeGeometry args={[size * 8, size * 8]} />
        <meshLambertMaterial color="#9ec877" />
      </mesh>
      {FIELDS.map((f, i) => (
        <mesh key={`f${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[size / 2 + f.x, -0.01, size / 2 + f.z]} receiveShadow>
          <planeGeometry args={[f.w, f.h]} />
          <meshLambertMaterial color={f.c} />
        </mesh>
      ))}
      <mesh position={[size / 2, -0.04, size / 2]} receiveShadow>
        <boxGeometry args={[size + 0.9, 0.08, size + 0.9]} />
        <meshLambertMaterial color="#d6d9cb" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size / 2, 0.001, size / 2]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshLambertMaterial map={tex} />
      </mesh>
      {/* the lake: one bright plane a hair above the painted water, breathing */}
      <group ref={ripple}>
        {water.map(([x, y]) => (
          <mesh key={`${x}-${y}`} rotation={[-Math.PI / 2, 0, 0]} position={[x + 0.5, 0, y + 0.5]}>
            <planeGeometry args={[1, 1]} />
            <meshLambertMaterial color={GROUND.water} transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
