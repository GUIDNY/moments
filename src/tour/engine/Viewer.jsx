import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { jump, look, move, pose } from './controls';

const SPEED = 1.55; // metres per second, an unhurried walk
const EYE = 1.62;
const RADIUS = 0.26;
const MAX_STEP = 0.02; // seconds per collision sub-step

/** Moves the camera through the flat and keeps it out of the walls. */
export default function Viewer({ start, canStand }) {
  const { camera } = useThree();
  const ready = useRef(false);
  const bob = useRef(0);

  useFrame((_, rawDelta) => {
    if (!ready.current) {
      pose.x = start.x;
      pose.z = start.z;
      look.yaw = start.yaw;
      look.pitch = start.pitch ?? 0;
      ready.current = true;
    }

    if (jump.to) {
      pose.x = jump.to.x;
      pose.z = jump.to.z;
      look.yaw = jump.to.yaw;
      // a viewpoint may ask to look slightly down: a phone held upright has a
      // tall frame, and level eyes spend half of it on ceiling
      look.pitch = jump.to.pitch ?? 0;
      jump.to = null;
    }

    const delta = Math.min(0.25, rawDelta);
    const len = Math.hypot(move.x, move.z);
    const moving = len > 0.08;

    if (moving) {
      const nx = len > 1 ? move.x / len : move.x;
      const nz = len > 1 ? move.z / len : move.z;
      // forward is where you are looking; strafe is ninety degrees off it
      const sin = Math.sin(look.yaw);
      const cos = Math.cos(look.yaw);
      const dirX = -sin * -nz + cos * nx;
      const dirZ = -cos * -nz - sin * nx;

      // long frames are walked in slices so a slow device cannot phase a wall
      const steps = Math.max(1, Math.ceil(delta / MAX_STEP));
      const stepDelta = delta / steps;
      for (let i = 0; i < steps; i++) {
        const step = SPEED * stepDelta;
        const tx = pose.x + dirX * step;
        const tz = pose.z + dirZ * step;
        // each axis on its own, so you slide along a wall instead of sticking
        if (canStand(tx, pose.z, RADIUS)) pose.x = tx;
        if (canStand(pose.x, tz, RADIUS)) pose.z = tz;
      }
      bob.current += delta * 8.5;
    }

    camera.position.set(
      pose.x,
      EYE + (moving ? Math.sin(bob.current) * 0.018 : 0),
      pose.z
    );
    camera.rotation.set(look.pitch, look.yaw, 0, 'YXZ');

    // debug handle, handy when tuning the plan from the console
    if (typeof window !== 'undefined') window.__aptPose = { x: pose.x, z: pose.z };
  });

  return null;
}
