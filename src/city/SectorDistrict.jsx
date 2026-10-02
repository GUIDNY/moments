import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { districtLabel } from './textures';

/**
 * A district's name, flat on the pavement at its centre — read when you look
 * for it, invisible when you do not. Only districts with a building in them
 * are labelled; an empty one is just more city.
 */
export default function SectorDistrict({ district }) {
  const { loc, dir } = useI18n();
  const label = loc(district.name);
  const tex = useMemo(() => districtLabel(label, district.tint, dir), [label, district.tint, dir]);
  if (!district.used) return null;
  // the lane through the district, which is always free of buildings
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[district.cx, 0.02, district.cz]}>
      <planeGeometry args={[2.6, 0.5]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
