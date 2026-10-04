import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useI18n } from '../i18n/I18nContext';
import { useCity } from '../stocks/CityContext';
import { SECTOR_BY_ID } from '../stocks/catalog';
import { tapHandlers } from '../world3d/nav';
import { newsTexture } from './textures';

/**
 * The market news board: a small screen on two posts in the park's far
 * corner, cycling the city's headlines — the stocks you hold and the market
 * — every few seconds. It was once centre stage and the size of a building,
 * and it stole the eye from the stocks; now it is a board in a park, second
 * to the city, and faces the camera. A tap opens the news sheet. Textures
 * are built once per headline and kept; the cycle runs from the frame
 * clock, never from React.
 */
const EVERY_S = 7;
const W = 3.2;
const H = 1.3;

export default function NewsBoard({ x, z, onSelect }) {
  const { news, holdingOf } = useCity();
  const { loc, dir } = useI18n();
  const items = useMemo(() => news.items.slice(0, 24), [news]);

  // one texture per headline, made as the board reaches it
  const cache = useRef(new Map());
  useEffect(() => {
    const keep = new Set(items.map((i) => i.id));
    for (const [id, tex] of cache.current) if (!keep.has(id)) {
      tex.dispose();
      cache.current.delete(id);
    }
  }, [items]);
  const textureFor = (item) => {
    let tex = cache.current.get(item.id);
    if (!tex) {
      const h = item.symbol ? holdingOf(item.symbol) : null;
      const sector = h ? SECTOR_BY_ID[h.sector] : null;
      const mine = dir === 'rtl' ? 'חדשות התיק' : 'Portfolio news';
      const market = dir === 'rtl' ? 'חדשות השוק' : 'Market news';
      const label = item.symbol ? `${mine} · ${loc(h?.name) || item.symbol}` : market;
      const hebrew = /[\u0590-\u05ff]/.test(item.title);
      tex = newsTexture({ title: item.title, source: item.source, tag: label, colour: sector?.color }, hebrew ? 'rtl' : 'ltr');
      cache.current.set(item.id, tex);
    }
    return tex;
  };

  const screen = useRef();
  const at = useRef({ i: -1, t: 0 });
  useFrame(({ clock }) => {
    const m = screen.current;
    if (!m) return;
    if (!items.length) {
      m.visible = false;
      return;
    }
    m.visible = true;
    const i = Math.floor(clock.elapsedTime / EVERY_S) % items.length;
    if (i !== at.current.i) {
      at.current.i = i;
      at.current.t = clock.elapsedTime;
      m.material.map = textureFor(items[i]);
      m.material.needsUpdate = true;
    }
    // a short flip as a headline arrives
    const k = Math.min(1, (clock.elapsedTime - at.current.t) / 0.35);
    m.scale.y = 0.82 + 0.18 * k;
  });

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

  // faces the camera: a plane faces +z, the camera looks along −x−z
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 4, 0]} {...tap}>
      {[-1.3, 1.3].map((px) => (
        <mesh key={px} position={[px, 0.75, -0.1]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.5, 8]} />
          <meshLambertMaterial color="#6b7480" />
        </mesh>
      ))}
      <mesh position={[0, 2.0, -0.11]} castShadow>
        <boxGeometry args={[W + 0.18, H + 0.18, 0.12]} />
        <meshLambertMaterial color="#2b3340" />
      </mesh>
      <mesh ref={screen} position={[0, 2.0, 0]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
    </group>
  );
}
