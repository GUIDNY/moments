import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { districtLabel } from './textures';

/**
 * A district's name on a small pill over its lane — read when you look for
 * it, out of the way when you do not. Only districts with a building in them
 * are labelled; an empty one is just more city.
 */
export default function SectorDistrict({ district }) {
  const { loc, dir } = useI18n();
  const label = loc(district.name);
  const tex = useMemo(() => districtLabel(label, district.tint, dir), [label, district.tint, dir]);
  if (!district.used) return null;
  // at the shore end of the lane through the district, clear of its plots
  return (
    <sprite position={[district.label.x, 0.7, district.label.z]} scale={[2.7, 0.5, 1]}>
      <spriteMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}
