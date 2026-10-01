import { useMemo } from 'react';
import { fitTo, useModel } from './models';

/**
 * One model from the kits, fitted to a footprint and stood on the ground.
 *
 * `fit` is the `[width, depth]` in world units the footprint may fill; the
 * model is scaled uniformly to the tighter of the two (and never past
 * `maxScale`), so a building keeps its proportions and merely grows to its
 * plot. `turn` is quarter turns: the kits' buildings face +z, and a filler
 * must face the street its plot fronts.
 */
export default function Kit({ model, fit, position, turn = 0, maxScale = 3, children }) {
  const scene = useModel(model);
  const { scale, offset } = useMemo(() => fitTo(model, fit[0], fit[1], maxScale), [model, fit, maxScale]);
  if (!scene) return null;
  return (
    <group position={position} rotation={[0, (turn * Math.PI) / 2, 0]}>
      <group scale={scale} position={offset}>
        <primitive object={scene} />
      </group>
      {children}
    </group>
  );
}
