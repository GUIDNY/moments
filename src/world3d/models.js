import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import BOUNDS from './kenney-bounds.json';

/**
 * The city's models: Kenney's CC0 city kits, served from `public/models`.
 *
 * Each GLB is fetched once and remembered; every building that wants it gets
 * a clone of the loaded scene, which shares geometry and material and costs
 * nothing but a transform. The kits reference one `Textures/colormap.png`
 * beside the files, which is why the folder is copied whole and never a GLB
 * on its own.
 *
 * `BOUNDS` is measured at build time from the files' own vertex ranges, so a
 * building is scaled to its plot from a table rather than from a `Box3` on
 * every mount — and so the code can reason about a model's footprint before
 * it has loaded.
 */

const loader = new GLTFLoader();
const cache = new Map();

const url = (key) => `./models/${key}.glb`;

export const boundsOf = (key) => BOUNDS[key] ?? { w: 1, h: 1, d: 1, cx: 0, cz: 0, y0: 0 };

/** Resolve a kit model to its loaded scene (the original: clone before use). */
export function loadModel(key) {
  if (cache.has(key)) return cache.get(key);
  const p = new Promise((resolve) => {
    loader.load(
      url(key),
      (gltf) => {
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            // the kits ship with their own materials; only the colour space
            // of the shared colormap needs saying, and only once
            if (o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
          }
        });
        resolve(gltf.scene);
      },
      undefined,
      () => resolve(null) // a missing model is an empty plot, not a broken city
    );
  });
  cache.set(key, p);
  return p;
}

/**
 * A clone of the model, or null until it arrives. Clones share everything
 * but their transforms, so a street of the same block is one geometry.
 */
export function useModel(key) {
  const [scene, setScene] = useState(null);
  useEffect(() => {
    let live = true;
    if (!key) {
      setScene(null);
      return undefined;
    }
    loadModel(key).then((s) => live && setScene(s ? s.clone() : null));
    return () => {
      live = false;
    };
  }, [key]);
  return scene;
}

/**
 * Scale and offset that put a model's footprint inside `w × d` world units,
 * standing on the ground and centred: the kits are built to a one-unit tile
 * and this city's plots are not.
 */
export function fitTo(key, w, d, maxScale = 3) {
  const b = boundsOf(key);
  const scale = Math.min(maxScale, w / Math.max(0.01, b.w), d / Math.max(0.01, b.d));
  return { scale, offset: [-b.cx * scale, -b.y0 * scale, -b.cz * scale], height: b.h * scale };
}
