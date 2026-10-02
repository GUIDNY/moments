import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { fitHeight, useModel } from '../world3d/models';
import { tapHandlers } from '../world3d/nav';
import { hqLevelFor } from './tiers';
import { useI18n } from '../i18n/I18nContext';
import { districtLabel } from './textures';

/* One model per level. The levels are a table in `tiers.js`; this is only
   what each one looks like. */
const HQ_MODELS = {
  1: 'commercial/building-h',
  2: 'commercial/building-skyscraper-a',
  3: 'commercial/building-skyscraper-b',
  4: 'commercial/building-skyscraper-d',
  5: 'commercial/building-skyscraper-c',
};

/**
 * The headquarters: the one building that is the whole portfolio. It stands
 * on the plaza in the park and grows a level as the portfolio does. Tapping
 * it opens the portfolio view.
 */
export default function PortfolioHQ({ hq, totalUsd, onSelect }) {
  const level = hqLevelFor(totalUsd);
  const model = HQ_MODELS[level.level] ?? HQ_MODELS[1];
  const scene = useModel(model);
  const fit = useMemo(() => fitHeight(model, level.height, 2.6, 2.6), [model, level.height]);
  const tap = useMemo(() => {
    const h = tapHandlers(() => onSelect?.());
    return {
      onPointerDown: (e) => {
        e.stopPropagation();
        h.onPointerDown(e);
      },
      onPointerUp: (e) => {
        e.stopPropagation();
        h.onPointerUp(e);
      },
      onPointerOver: () => {
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
      },
    };
  }, [onSelect]);

  // the level's name on a small flag over the roof: the one label that is
  // always up, because the HQ is the one building that is the whole city
  const { loc, dir } = useI18n();
  const flag = useMemo(() => districtLabel(loc(level.label), '#ff8a3d', dir), [loc, level.label, dir]);
  // a slow halo on the plaza, so the eye finds the centre
  const halo = useRef();
  useFrame(({ clock }) => {
    if (halo.current) halo.current.material.opacity = 0.16 + Math.sin(clock.elapsedTime * 0.9) * 0.05;
  });

  return (
    <group position={[hq.cx, 0, hq.cz]}>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.5, 2.1, 40]} />
        <meshBasicMaterial color="#ff6b1a" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group {...tap}>
        {scene && (
          <group scale={fit.scale} position={fit.offset}>
            <primitive object={scene} />
          </group>
        )}
        <mesh position={[0, fit.height / 2, 0]} visible={false}>
          <boxGeometry args={[2.4, fit.height, 2.4]} />
          <meshBasicMaterial />
        </mesh>
        <sprite position={[0, fit.height + 1.05, 0]} scale={[2.4, 0.45, 1]}>
          <spriteMaterial map={flag} transparent depthTest={false} />
        </sprite>
      </group>
    </group>
  );
}
