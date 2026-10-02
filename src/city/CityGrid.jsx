import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TILE } from './layout';
import { GROUND, groundTexture } from './textures';

/**
 * The ground: one textured plane for the whole grid, a base slab under it
 * so the city reads as a board with an edge, and a lake that ripples. Drawn
 * once per layout; nothing here is per-tile React.
 */
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
      {/* the board's edge: a slab a little larger than the grid, in the lawn's colour */}
      <mesh position={[size / 2, -0.3, size / 2]} receiveShadow>
        <boxGeometry args={[size + 1.2, 0.6, size + 1.2]} />
        <meshLambertMaterial color="#a9c391" />
      </mesh>
      <mesh position={[size / 2, -0.62, size / 2]}>
        <boxGeometry args={[size + 1.2, 0.08, size + 1.2]} />
        <meshLambertMaterial color="#8fa97a" />
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
