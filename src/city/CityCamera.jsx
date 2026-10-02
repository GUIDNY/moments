import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { focus, zoom } from '../world3d/focus';
import { setPlayerPos } from '../world3d/playerPos';

/**
 * A board-game camera: orthographic, a fixed angle, never rotates. Drag to
 * pan, pinch or scroll to zoom, +/− from the chrome. Everything moving lives
 * in refs and is applied in `useFrame`; a drag never re-renders anything.
 *
 * Fixed angle on purpose — FarmVille, not Google Earth. Pitch 40° shows a
 * facade and a roof; yaw 45° shows two faces of every building.
 */
const PITCH = (40 * Math.PI) / 180;
const YAW = Math.PI / 4;
const DEAD_PX = 8;
const DIST = 60; // far enough that nothing clips; depth is a non-issue orthographically

export default function CityCamera({ centre, size, compact }) {
  const { camera, gl } = useThree();
  const target = useRef({ x: centre.x, z: centre.z + 1.5 });
  // zoom is pixels per world unit: the whole city fits at the start
  const zoomRef = useRef(1);
  const minZoom = useRef(1);
  const maxZoom = useRef(1);
  const drag = useRef(null);
  const pinch = useRef(null);
  const clampRef = useRef(null);

  const fitZoom = () => {
    const el = gl.domElement;
    const w = el.clientWidth;
    const h = el.clientHeight;
    // the board's diagonal, seen at the yaw, is size·√2 across; vertically it
    // is foreshortened by the pitch, plus the tallest building standing on
    // its far corner. The chrome takes the top of the screen.
    const across = size * Math.SQRT2 + 2;
    const tall = across * Math.sin(PITCH) + 7;
    const fit = Math.min(w / across, (h - (compact ? 160 : 120)) / tall);
    minZoom.current = fit * 0.8;
    maxZoom.current = fit * 4;
    return fit;
  };

  useEffect(() => {
    // a phone is too narrow for the whole board at once: start on the
    // centre at a readable size and let the thumb take it from there
    zoomRef.current = fitZoom() * (compact ? 2.2 : 1);
    const onResize = () => {
      const was = zoomRef.current;
      const fit = fitZoom();
      zoomRef.current = Math.min(maxZoom.current, Math.max(minZoom.current, was || fit));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, size]);

  useEffect(() => {
    const el = gl.domElement;
    const clampZoom = (z) => Math.min(maxZoom.current, Math.max(minZoom.current, z));
    // the board must stay in shot. In screen terms the board is a diamond
    // with half-diagonal D; the viewport sees hu × hv of ground. Along an
    // axis where the board already fits, the target is pinned to the
    // centre (a portrait phone shows the whole height, so it never slides
    // up or down); along one where it overflows, it may pan until the
    // board's tip is most of the way to the screen's edge.
    const clampTarget = (t) => {
      const zoomNow = zoomRef.current;
      const hu = el.clientWidth / 2 / zoomNow;
      const hv = el.clientHeight / 2 / zoomNow / Math.sin(PITCH);
      const D = size / Math.SQRT2;
      const R = Math.SQRT1_2;
      const cx = size / 2;
      const dx = t.x - cx;
      const dz = t.z - cx;
      // screen right is (x − z), screen up is −(x + z), at a 45° yaw
      let u = (dx - dz) * R;
      let v = -(dx + dz) * R;
      const mu = Math.max(0, D - hu * 0.7);
      const mv = Math.max(0, D - hv * 0.7);
      u = Math.max(-mu, Math.min(mu, u));
      v = Math.max(-mv, Math.min(mv, v));
      t.x = cx + (u - v) * R;
      t.z = cx + (-u - v) * R;
    };
    clampRef.current = clampTarget;
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
        focus.at = null;
      }
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      // screen → ground: x along the yaw, y foreshortened by the pitch
      const k = 1 / zoomRef.current;
      const c = Math.cos(YAW);
      const s = Math.sin(YAW);
      const gx = dx * k;
      const gz = (dy * k) / Math.sin(PITCH);
      target.current.x -= gx * c - gz * s;
      target.current.z -= gx * s + gz * c;
      clampTarget(target.current);
    };
    const onUp = () => {
      drag.current = null;
    };
    const onWheel = (e) => {
      e.preventDefault();
      zoomRef.current = clampZoom(zoomRef.current * (1 - Math.sign(e.deltaY) * 0.1));
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoomRef.current };
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        const [a, b] = e.touches;
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        zoomRef.current = clampZoom((pinch.current.z * d) / Math.max(1, pinch.current.d));
      }
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinch.current = null;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    // handy from the console, and how the browser tests aim at a building
    window.__project = (x, z, y = 0) => {
      const p = new THREE.Vector3(x, y, z).project(camera);
      return { x: ((p.x + 1) / 2) * el.clientWidth, y: ((1 - p.y) / 2) * el.clientHeight };
    };
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl, camera, size]);

  const first = useRef(true);
  useFrame((_, rawDelta) => {
    const delta = Math.min(0.1, rawDelta);
    if (zoom.by != null) {
      // the factor is a magnification: 1.25 is closer, 0.8 is further. The
      // old rig took it as a distance and divided; here zoom is pixels per
      // metre, so it multiplies — the "+" button zoomed out until it did
      zoomRef.current = Math.min(maxZoom.current, Math.max(minZoom.current, zoomRef.current * zoom.by));
      zoom.by = null;
    }
    const t = target.current;
    if (focus.at) {
      const wasX = t.x;
      const wasZ = t.z;
      t.x += (focus.at.x - t.x) * Math.min(1, delta * 4);
      t.z += (focus.at.z - t.z) * Math.min(1, delta * 4);
      if (focus.dist) {
        const wantZoom = Math.min(maxZoom.current, minZoom.current * focus.dist);
        zoomRef.current += (wantZoom - zoomRef.current) * Math.min(1, delta * 4);
      }
      clampRef.current?.(t);
      // arrived, or as near as the clamp allows: the fly-to is over
      if (Math.hypot(focus.at.x - t.x, focus.at.z - t.z) < 0.05 || Math.hypot(t.x - wasX, t.z - wasZ) < 0.0005) focus.at = null;
    } else {
      clampRef.current?.(t);
    }
    const k = first.current ? 1 : Math.min(1, delta * 12);
    camera.position.x += (t.x + Math.sin(YAW) * Math.cos(PITCH) * DIST - camera.position.x) * k;
    camera.position.z += (t.z + Math.cos(YAW) * Math.cos(PITCH) * DIST - camera.position.z) * k;
    camera.position.y += (Math.sin(PITCH) * DIST - camera.position.y) * k;
    camera.lookAt(t.x, 0, t.z);
    if (Math.abs(camera.zoom - zoomRef.current) > 0.01) {
      camera.zoom += (zoomRef.current - camera.zoom) * (first.current ? 1 : Math.min(1, delta * 10));
      camera.updateProjectionMatrix();
    }
    first.current = false;
    setPlayerPos(t.x, t.z);
  });

  return null;
}

