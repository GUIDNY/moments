import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP_H, MAP_W } from '../world/map-data';
import { focus, zoom } from './focus';
import { setPlayerPos } from './playerPos';

/**
 * The city seen the way a builder sees it: from above, at a fixed angle, with
 * the whole thing under your thumb. Drag to pan, pinch or scroll to zoom,
 * arrow keys to nudge. No avatar — you are the mayor, not a pedestrian.
 *
 * Everything that moves lives in refs and is applied in `useFrame`: the
 * target the camera looks at, the distance it looks from, and where it is
 * easing towards when something asks for attention (`focus`). A drag never
 * re-renders anything.
 */
/* A three-quarter view, not a map: low enough that a facade is a facade and a
   street has depth, high enough that the plots behind are not hidden. The
   diagonal yaw shows two faces of every building, the way an isometric game
   does. */
const PITCH = 0.66; // radians down from level (~38°)
const YAW = Math.PI / 4;
const MIN_D = 9;
const MAX_D = 48;
/* A finger never holds still. Panning only starts once the pointer has moved
   this far, so a tap with a wobble in it stays a tap and the city stays put. */
const DEAD_PX = 8;

export default function CameraRig({ compact }) {
  const { camera, gl } = useThree();
  const target = useRef({ x: MAP_W / 2, z: MAP_H / 2 + 2 });
  const dist = useRef(compact ? 26 : 24);
  const drag = useRef(null);
  const pinch = useRef(null);

  useEffect(() => {
    const el = gl.domElement;
    const panScale = () => dist.current / el.clientHeight;
    // handy from the console, and how the browser tests aim at a lot or a tower
    window.__project = (x, z, y = 0) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: ((v.x + 1) / 2) * el.clientWidth, y: ((1 - v.y) / 2) * el.clientHeight };
    };

    const onDown = (e) => {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      drag.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, live: false };
    };
    const onMove = (e) => {
      const d = drag.current;
      if (!d || pinch.current) return;
      if (!d.live) {
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DEAD_PX) return;
        d.live = true;
        d.x = e.clientX;
        d.y = e.clientY;
        focus.at = null; // a hand on the city cancels any flight
      }
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      // screen right is world +x rotated by the yaw; screen down is world +z
      const k = panScale() * 1.5;
      const c = Math.cos(YAW);
      const s = Math.sin(YAW);
      target.current.x -= (dx * c - dy * s) * k;
      target.current.z -= (dx * s + dy * c) * k;
      clampTarget(target.current);
    };
    const onUp = () => {
      drag.current = null;
    };
    const onWheel = (e) => {
      e.preventDefault();
      dist.current = Math.min(MAX_D, Math.max(MIN_D, dist.current * (1 + Math.sign(e.deltaY) * 0.12)));
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: dist.current };
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        const [a, b] = e.touches;
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        dist.current = Math.min(MAX_D, Math.max(MIN_D, (pinch.current.dist * pinch.current.d) / Math.max(1, d)));
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinch.current = null;
    };
    const onKey = (e) => {
      const step = 1.5;
      const map = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
      const v = map[e.key];
      if (!v) return;
      e.preventDefault();
      target.current.x += v[0];
      target.current.z += v[1];
      clampTarget(target.current);
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [gl, camera]);

  const first = useRef(true);
  useFrame((_, rawDelta) => {
    const delta = Math.min(0.1, rawDelta);
    // the chrome's zoom buttons: applied once, eased below
    if (zoom.by != null) {
      dist.current = Math.min(MAX_D, Math.max(MIN_D, dist.current * zoom.by));
      zoom.by = null;
    }
    // something asked to be looked at: fly there, then let go
    if (focus.at) {
      const t = target.current;
      t.x += (focus.at.x - t.x) * Math.min(1, delta * 4);
      t.z += (focus.at.z - t.z) * Math.min(1, delta * 4);
      if (focus.dist) dist.current += (focus.dist - dist.current) * Math.min(1, delta * 4);
      if (Math.hypot(focus.at.x - t.x, focus.at.z - t.z) < 0.05) focus.at = null;
    }
    const t = target.current;
    const d = dist.current;
    const px = t.x + Math.sin(YAW) * Math.cos(PITCH) * d;
    const pz = t.z + Math.cos(YAW) * Math.cos(PITCH) * d;
    const py = Math.sin(PITCH) * d;
    const k = first.current ? 1 : Math.min(1, delta * 10);
    camera.position.x += (px - camera.position.x) * k;
    camera.position.y += (py - camera.position.y) * k;
    camera.position.z += (pz - camera.position.z) * k;
    camera.lookAt(t.x, 0, t.z);
    first.current = false;
    // the point you are looking at is "where you are" to the minimap, the
    // district chip and the signs that fade with distance
    setPlayerPos(t.x, t.z);
  });

  return null;
}

function clampTarget(t) {
  t.x = Math.max(-4, Math.min(MAP_W + 4, t.x));
  t.z = Math.max(-4, Math.min(MAP_H + 6, t.z));
}
