import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * A block figure: head, torso, two arms, two legs. Motion comes in through a
 * ref ({ moving, facing }) rather than props, so walking never re-renders React
 * — the limbs swing and the body bobs straight from the render loop.
 */
export default function VoxelPerson({ skin, motion, scale = 1, position = [0, 0, 0] }) {
  const group = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const phase = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const { moving = false, facing = 0 } = motion?.current ?? {};

    // turn smoothly towards the direction of travel
    let diff = facing - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, delta * 12);

    if (moving) phase.current += delta * 9;
    else phase.current += delta * 1.6;

    const swing = moving ? Math.sin(phase.current) * 0.7 : Math.sin(phase.current) * 0.06;
    if (armL.current) armL.current.rotation.x = swing;
    if (armR.current) armR.current.rotation.x = -swing;
    if (legL.current) legL.current.rotation.x = -swing;
    if (legR.current) legR.current.rotation.x = swing;
    g.position.y = position[1] + (moving ? Math.abs(Math.sin(phase.current)) * 0.05 : 0);
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* legs */}
      <group ref={legL} position={[-0.11, 0.42, 0]}>
        <mesh position={[0, -0.21, 0]} castShadow>
          <boxGeometry args={[0.17, 0.44, 0.17]} />
          <meshLambertMaterial color={skin.pants} />
        </mesh>
      </group>
      <group ref={legR} position={[0.11, 0.42, 0]}>
        <mesh position={[0, -0.21, 0]} castShadow>
          <boxGeometry args={[0.17, 0.44, 0.17]} />
          <meshLambertMaterial color={skin.pants} />
        </mesh>
      </group>

      {/* torso */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[0.46, 0.52, 0.26]} />
        <meshLambertMaterial color={skin.shirt} />
      </mesh>

      {/* arms */}
      <group ref={armL} position={[-0.3, 0.9, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.13, 0.42, 0.16]} />
          <meshLambertMaterial color={skin.shirt} />
        </mesh>
      </group>
      <group ref={armR} position={[0.3, 0.9, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.13, 0.42, 0.16]} />
          <meshLambertMaterial color={skin.shirt} />
        </mesh>
      </group>

      {/* head + cap */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[0.38, 0.36, 0.34]} />
        <meshLambertMaterial color={skin.skin} />
      </mesh>
      <mesh position={[0, 1.33, 0]} castShadow>
        <boxGeometry args={[0.42, 0.1, 0.38]} />
        <meshLambertMaterial color={skin.hat} />
      </mesh>
      <mesh position={[0, 1.27, -0.24]} castShadow>
        <boxGeometry args={[0.4, 0.05, 0.16]} />
        <meshLambertMaterial color={skin.hat} />
      </mesh>
    </group>
  );
}
