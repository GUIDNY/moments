import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { focus, zoom } from '../world3d/focus';
import { setPlayerPos } from '../world3d/playerPos';

/**
 * A board-game camera: orthographic, a fixed angle, never rotates. Drag to
 * pan, pinch or scroll to zoom, +/− and "home" from the chrome. Everything
 * moving lives in refs and is applied in `useFrame`; a drag never re-renders
 * anything.
 *
 * Fixed angle on purpose — FarmVille, not Google Earth. Pitch 40° shows a
 * facade and a roof; yaw 45° shows two faces of every building.
 *
 * The feel is the whole point, and it was wrong once: the camera eased
 * towards the finger (a rubbery lag), stopped dead at a clamp that pinned a
 * phone's vertical drags, and pinched about the screen's centre. Now a drag
 * is 1:1 while the finger is down, keeps its momentum when it lifts, zoom
 * holds the ground under the fingers still, and the clamp only keeps some
 * of the board in shot.
 */
const PITCH = (40 * Math.PI) / 180;
const YAW = Math.PI / 4;
const DEAD_PX = 5;
const DIST = 60; // far enough that nothing clips; depth is a non-issue orthographically
const START_MAG = { phone: 3.0, desktop: 1.5 }; // × the fitted zoom

/** A screen vector, in pixels (y down), as a vector on the ground at this
    zoom. The camera sits on the +x+z side looking back, so screen right is
    ground (x − z) and screen down is ground (x + z) foreshortened by the
    pitch. The signs here were once the other way round and a finger dragged
    right moved the city up — "really, really uncomfortable". */
function groundVec(dx, dy, zoomNow) {
  const a = dx / zoomNow;
  const b = dy / zoomNow / Math.sin(PITCH);
  const c = Math.cos(YAW);
  const s = Math.sin(YAW);
  return { x: a * c + b * s, z: -a * s + b * c };
}

export default function CityCamera({ centre, size, compact }) {
  const { camera, gl } = useThree();
  const target = useRef({ x: centre.x, z: centre.z + 1.5 });
  // zoom is pixels per world unit
  const zoomRef = useRef(1);
  const minZoom = useRef(1);
  const maxZoom = useRef(1);
  const startZoom = useRef(1);
  const drag = useRef(null);
  const pinch = useRef(null);
  const vel = useRef({ x: 0, z: 0 }); // momentum after a drag, ground units per second
  const clampRef = useRef(null);
  const dragging = useRef(false);

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
    // centre close enough that the city fills the screen, and let the thumb
    // take it from there. Desktop starts a touch past the fit for the same
    // reason — the board should reach the edges, not float in the middle.
    startZoom.current = fitZoom() * (compact ? START_MAG.phone : START_MAG.desktop);
    zoomRef.current = startZoom.current;
    const onResize = () => {
      const was = zoomRef.current;
      const fit = fitZoom();
      startZoom.current = fit * (compact ? START_MAG.phone : START_MAG.desktop);
      zoomRef.current = Math.min(maxZoom.current, Math.max(minZoom.current, was || fit));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, size]);

  useEffect(() => {
    const el = gl.domElement;
    const clampZoom = (z) => Math.min(maxZoom.current, Math.max(minZoom.current, z));
    // the board must stay in shot — some of it. In screen terms the board
    // is a diamond with half-diagonal D; the viewport sees hu × hv of
    // ground. The target may travel until the board's tip is a third of
    // the way in from the screen's edge, on either axis: enough that a
    // drag always does something, not enough to lose the city.
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
      const mu = Math.max(0, D - hu * 0.35);
      const mv = Math.max(0, D - hv * 0.35);
      const hitU = Math.abs(u) > mu;
      const hitV = Math.abs(v) > mv;
      u = Math.max(-mu, Math.min(mu, u));
      v = Math.max(-mv, Math.min(mv, v));
      t.x = cx + (u - v) * R;
      t.z = cx + (-u - v) * R;
      return hitU || hitV;
    };
    clampRef.current = clampTarget;

    /* Zoom so that the ground under a screen point stays under it. */
    const zoomAt = (next, px, py) => {
      const was = zoomRef.current;
      const z = clampZoom(next);
      if (z === was) return;
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const before = groundVec(dx, dy, was);
      const after = groundVec(dx, dy, z);
      target.current.x += before.x - after.x;
      target.current.z += before.z - after.z;
      zoomRef.current = z;
      clampTarget(target.current);
    };

    const onDown = (e) => {
      if (e.pointerType === 'touch' && e.isPrimary === false) return;
      if (pinch.current) return;
      drag.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, live: false, t: e.timeStamp, vx: 0, vz: 0 };
      vel.current.x = 0;
      vel.current.z = 0;
    };
    const onMove = (e) => {
      const d = drag.current;
      if (!d || pinch.current) return;
      if (!d.live) {
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DEAD_PX) return;
        d.live = true;
        d.x = e.clientX;
        d.y = e.clientY;
        d.t = e.timeStamp;
        dragging.current = true;
        focus.at = null;
      }
      // event time, not frame time: a slow frame must not read as a pause
      const now = e.timeStamp;
      const dt = Math.max(1, now - d.t);
      const g = groundVec(e.clientX - d.x, e.clientY - d.y, zoomRef.current);
      d.x = e.clientX;
      d.y = e.clientY;
      d.t = now;
      target.current.x -= g.x;
      target.current.z -= g.z;
      // velocity, smoothed over the last few moves, for the release
      const k = 0.5;
      d.vx = d.vx * (1 - k) + (-g.x / dt) * 1000 * k;
      d.vz = d.vz * (1 - k) + (-g.z / dt) * 1000 * k;
      clampTarget(target.current);
    };
    const onUp = (e) => {
      const d = drag.current;
      if (d?.live) {
        // a flick keeps going; a finger that paused before lifting does not
        const stale = e.timeStamp - d.t > 150;
        vel.current.x = stale ? 0 : d.vx;
        vel.current.z = stale ? 0 : d.vz;
      }
      dragging.current = false;
      drag.current = null;
    };
    const onWheel = (e) => {
      e.preventDefault();
      zoomAt(zoomRef.current * (1 - Math.sign(e.deltaY) * 0.1), e.clientX, e.clientY);
    };
    const mid = (a, b) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const m = mid(a, b);
        pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoomRef.current, mx: m.x, my: m.y };
        drag.current = null;
        dragging.current = false;
        vel.current.x = 0;
        vel.current.z = 0;
        focus.at = null;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinch.current) {
        e.preventDefault();
        const [a, b] = e.touches;
        const p = pinch.current;
        const m = mid(a, b);
        // two fingers also pan: the ground under the midpoint follows it
        const g = groundVec(m.x - p.mx, m.y - p.my, zoomRef.current);
        target.current.x -= g.x;
        target.current.z -= g.z;
        p.mx = m.x;
        p.my = m.y;
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        zoomAt((p.z * d) / Math.max(1, p.d), m.x, m.y);
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
    el.addEventListener('touchcancel', onTouchEnd);
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
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [gl, camera, size]);

  const first = useRef(true);
  useFrame((_, rawDelta) => {
    const delta = Math.min(0.1, rawDelta);
    if (zoom.by != null) {
      // the factor is a magnification: 1.25 is closer, 0.8 is further;
      // zoom is pixels per metre, so it multiplies. About the centre.
      zoomRef.current = Math.min(maxZoom.current, Math.max(minZoom.current, zoomRef.current * zoom.by));
      zoom.by = null;
    }
    if (zoom.home) {
      // the "home" button: back to the middle at the starting zoom
      zoom.home = false;
      focus.at = { x: size / 2, z: size / 2 + 1.5 };
      focus.zoomTo = startZoom.current;
      vel.current.x = 0;
      vel.current.z = 0;
    }
    const t = target.current;
    if (focus.at) {
      const wasX = t.x;
      const wasZ = t.z;
      t.x += (focus.at.x - t.x) * Math.min(1, delta * 5);
      t.z += (focus.at.z - t.z) * Math.min(1, delta * 5);
      const wantZoom = focus.zoomTo ?? (focus.dist ? Math.min(maxZoom.current, minZoom.current * focus.dist) : null);
      if (wantZoom) zoomRef.current += (wantZoom - zoomRef.current) * Math.min(1, delta * 5);
      clampRef.current?.(t);
      // arrived, or as near as the clamp allows: the fly-to is over
      if (Math.hypot(focus.at.x - t.x, focus.at.z - t.z) < 0.05 || Math.hypot(t.x - wasX, t.z - wasZ) < 0.0005) {
        focus.at = null;
        focus.zoomTo = null;
        if (wantZoom) zoomRef.current = wantZoom;
      }
    } else if (!dragging.current && (vel.current.x || vel.current.z)) {
      // momentum: the flick carries on and dies away; a wall stops it
      t.x += vel.current.x * delta;
      t.z += vel.current.z * delta;
      const hit = clampRef.current?.(t);
      const decay = Math.exp(-delta * 5);
      vel.current.x *= decay;
      vel.current.z *= decay;
      if (hit || Math.hypot(vel.current.x, vel.current.z) < 0.08) {
        vel.current.x = 0;
        vel.current.z = 0;
      }
    } else {
      clampRef.current?.(t);
    }
    // under a finger the camera is the finger: no easing. Otherwise a short
    // ease so a button press or a fly-to lands softly.
    const k = first.current || dragging.current || pinch.current ? 1 : Math.min(1, delta * 18);
    camera.position.x += (t.x + Math.sin(YAW) * Math.cos(PITCH) * DIST - camera.position.x) * k;
    camera.position.z += (t.z + Math.cos(YAW) * Math.cos(PITCH) * DIST - camera.position.z) * k;
    camera.position.y += (Math.sin(PITCH) * DIST - camera.position.y) * k;
    camera.lookAt(t.x, 0, t.z);
    if (Math.abs(camera.zoom - zoomRef.current) > 0.01) {
      camera.zoom += (zoomRef.current - camera.zoom) * (first.current || pinch.current ? 1 : Math.min(1, delta * 14));
      camera.updateProjectionMatrix();
    }
    first.current = false;
    setPlayerPos(t.x, t.z);
  });

  return null;
}
