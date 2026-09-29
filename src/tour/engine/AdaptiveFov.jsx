import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * A phone held upright is a very narrow window on the world: with a fixed
 * vertical field of view you end up staring at one square metre of wall. This
 * widens the vertical angle as the viewport gets taller than it is wide, which
 * keeps roughly the same amount of *room* in frame on any device.
 */
export default function AdaptiveFov({ base = 68, max = 88 }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = Math.min(max, base / Math.min(1, aspect * 1.6));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, size, base, max]);

  return null;
}
