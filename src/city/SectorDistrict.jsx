import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { tapHandlers } from '../world3d/nav';
import { districtLabel } from './textures';

/**
 * A district's name on a small pill over its lane — read when you look for
 * it, out of the way when you do not. Only districts with a building in them
 * are labelled; an empty one is just more city. A tap on the pill is a tap
 * on the neighbourhood: the camera goes in and its sheet opens.
 */
export default function SectorDistrict({ district, selected = false, onSelect }) {
  const { loc, dir } = useI18n();
  const label = loc(district.name);
  const tex = useMemo(() => districtLabel(label, district.tint, dir), [label, district.tint, dir]);
  const tap = useMemo(() => {
    const h = tapHandlers(() => onSelect?.(district));
    return {
      onPointerDown: (e) => {
        e.stopPropagation();
        h.onPointerDown(e);
      },
      onPointerUp: (e) => {
        e.stopPropagation();
        h.onPointerUp(e);
      },
      onPointerOver: (e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        document.body.style.cursor = '';
      },
    };
  }, [onSelect, district]);
  if (!district.used) return null;
  const k = selected ? 1.18 : 1;
  // at the shore end of the lane through the district, clear of its plots
  return (
    <sprite position={[district.label.x, selected ? 0.9 : 0.7, district.label.z]} scale={[2.7 * k, 0.5 * k, 1]} {...tap}>
      <spriteMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}
