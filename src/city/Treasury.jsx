import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useI18n } from '../i18n/I18nContext';
import { fitHeight, useModel } from '../world3d/models';
import { tapHandlers } from '../world3d/nav';
import { tierFor } from './tiers';
import { tickerBadge } from './textures';

/**
 * The cash, as a building: the city's treasury, beside the plaza. Its size
 * is the cash's share of the whole portfolio, by the same tiers as a stock,
 * so a purse that is all cash is a vault the size of a tower, and one that
 * is all invested is a kiosk. The whole composition is on the board — what
 * is invested and what is not. Tapping it opens the portfolio.
 */
const MODELS = { 1: 'commercial/building-i', 2: 'commercial/building-j', 3: 'commercial/building-k', 4: 'commercial/building-m', 5: 'commercial/building-n' };
const GOLD = new THREE.Color('#f3dc9a');

export default function Treasury({ x, z, share, onSelect }) {
  const { dir } = useI18n();
  const tier = tierFor(share);
  const model = MODELS[tier.tier];
  const raw = useModel(model);
  const scene = useMemo(() => {
    if (!raw) return null;
    raw.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const m = o.material.clone();
      m.color = m.color.clone().multiply(GOLD);
      o.material = m;
    });
    return raw;
  }, [raw]);
  const fit = useMemo(() => fitHeight(model, tier.height, tier.footprint, tier.footprint), [model, tier]);
  const pct = `${Math.round(share * 100)}%`;
  const badge = useMemo(() => tickerBadge(dir === 'rtl' ? 'מזומן' : 'Cash', pct, '#f5c542'), [dir, pct]);
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
  const coin = useRef();
  useFrame(({ clock }) => {
    if (coin.current) coin.current.rotation.y = clock.elapsedTime * 1.2;
  });
  return (
    <group position={[x, 0, z]} {...tap}>
      {scene && (
        <group scale={fit.scale} position={fit.offset}>
          <primitive object={scene} />
        </group>
      )}
      <mesh position={[0, fit.height / 2, 0]} visible={false}>
        <boxGeometry args={[tier.footprint, fit.height, tier.footprint]} />
        <meshBasicMaterial />
      </mesh>
      {/* a coin turning on the roof: the one building that is money itself */}
      <mesh ref={coin} position={[0, fit.height + 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 20]} />
        <meshLambertMaterial color="#f5c542" />
      </mesh>
      <sprite position={[0, fit.height + 1.25, 0]} scale={[2.1, 0.58, 1]}>
        <spriteMaterial map={badge} transparent depthTest={false} />
      </sprite>
    </group>
  );
}
