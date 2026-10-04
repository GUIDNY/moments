import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fitHeight, useModel } from '../world3d/models';
import { loadLogo } from '../world3d/logos';
import { tapHandlers } from '../world3d/nav';
import { lookAt } from '../world3d/focus';
import { moveColor } from '../stocks/towers';
import { formatPct } from '../stocks/money';
import { tierFor } from './tiers';
import { plaqueTexture, tickerBadge } from './textures';

/**
 * One stock, one building. The tier (from the position's share of the
 * portfolio) picks the height; the district picks the architecture; the
 * day's move is a mood — a lit, busy building when the stock is up, a
 * quieter, dimmer one when it is down — never a building painted red. The
 * ticker and the day's move ride a small dark pill over the roof, the mark
 * sits on a plaque on the street face; a tap opens the panel.
 *
 * A new position is a construction site first and a building second; a
 * position that steps up a tier swaps model with a small pop under the
 * crane; one sold out shrinks into the ground and is gone.
 */

/* What each district builds in. Lists per tier so a shop is a shop and a
   skyscraper a skyscraper, and a sector keeps its character up the tiers. */
const KITS = {
  tech: {
    1: ['commercial/building-c', 'commercial/building-e'],
    2: ['commercial/building-a', 'commercial/building-b', 'commercial/building-d'],
    3: ['commercial/building-f', 'commercial/building-g', 'commercial/building-h'],
    4: ['commercial/building-skyscraper-a', 'commercial/building-skyscraper-b'],
    5: ['commercial/building-skyscraper-c', 'commercial/building-skyscraper-e'],
  },
  banks: {
    1: ['commercial/building-i', 'commercial/building-j'],
    2: ['commercial/building-k', 'commercial/building-l'],
    3: ['commercial/building-m', 'commercial/building-n'],
    4: ['commercial/building-skyscraper-d', 'commercial/building-skyscraper-a'],
    5: ['commercial/building-skyscraper-b', 'commercial/building-skyscraper-d'],
  },
  health: {
    1: ['suburban/building-type-a', 'suburban/building-type-c'],
    2: ['commercial/low-detail-building-a', 'commercial/low-detail-building-c'],
    3: ['commercial/low-detail-building-wide-a', 'commercial/low-detail-building-e'],
    4: ['commercial/low-detail-building-g', 'commercial/low-detail-building-i'],
    5: ['commercial/building-skyscraper-e', 'commercial/low-detail-building-k'],
  },
  energy: {
    1: ['industrial/building-a', 'industrial/building-c'],
    2: ['industrial/building-e', 'industrial/building-g'],
    3: ['industrial/building-i', 'industrial/building-k'],
    4: ['industrial/building-m', 'industrial/building-o'],
    5: ['industrial/building-q', 'industrial/building-s'],
  },
  consumer: {
    1: ['suburban/building-type-b', 'suburban/building-type-d'],
    2: ['commercial/low-detail-building-b', 'commercial/low-detail-building-d'],
    3: ['commercial/low-detail-building-wide-b', 'commercial/low-detail-building-f'],
    4: ['commercial/low-detail-building-h', 'commercial/low-detail-building-j'],
    5: ['commercial/low-detail-building-l', 'commercial/building-skyscraper-e'],
  },
  industry: {
    1: ['industrial/building-b', 'industrial/building-d'],
    2: ['industrial/building-f', 'industrial/building-h'],
    3: ['industrial/building-j', 'industrial/building-l'],
    4: ['industrial/building-n', 'industrial/building-p'],
    5: ['industrial/building-r', 'industrial/building-t'],
  },
  realestate: {
    1: ['suburban/building-type-e', 'suburban/building-type-f'],
    2: ['suburban/building-type-g', 'suburban/building-type-h'],
    3: ['modular/building-sample-tower-a', 'suburban/building-type-k'],
    4: ['modular/building-sample-tower-b', 'modular/building-sample-tower-c'],
    5: ['modular/building-sample-tower-d', 'commercial/building-skyscraper-e'],
  },
  comm: {
    1: ['commercial/building-d', 'suburban/building-type-i'],
    2: ['commercial/building-g', 'commercial/low-detail-building-l'],
    3: ['commercial/low-detail-building-m', 'commercial/low-detail-building-n'],
    4: ['commercial/building-skyscraper-e', 'commercial/low-detail-building-i'],
    5: ['commercial/building-skyscraper-a', 'commercial/building-skyscraper-c'],
  },
  other: {
    1: ['modular/building-sample-house-a', 'modular/building-sample-house-b'],
    2: ['modular/building-sample-house-c', 'modular/building-sample-tower-b'],
    3: ['modular/building-sample-tower-a', 'modular/building-sample-tower-b'],
    4: ['modular/building-sample-tower-c', 'modular/building-sample-tower-d'],
    5: ['modular/building-sample-tower-d', 'commercial/building-skyscraper-c'],
  },
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/* A sector's look, on top of its kit: a tint the kit's colours are
   multiplied by (cool glass for tech, sandstone for the banks, white for
   health, warm for energy, rose for retail, olive for industry, beige for
   homes, teal for media) and an emblem on the roof — a mast, a gold dome,
   a cross, a solar panel, an awning, a chimney, a water tank, a dish, a
   flag. The user asked for a city where "each stock looks like its
   sector", and the kits alone did not say it. */
const LOOK = {
  tech: { tint: '#cfe0ff' },
  banks: { tint: '#f1e3bf' },
  health: { tint: '#f4f8ff' },
  energy: { tint: '#ffd8b0' },
  consumer: { tint: '#ffdbe6' },
  industry: { tint: '#d3dfcc' },
  realestate: { tint: '#ecdcc4' },
  comm: { tint: '#cdeeea' },
  other: { tint: '#e4dfff' },
};

/* Clone the kit's materials for this one building and tint them. The
   clones are what the mood later lights or dims, so they are kept. */
function tint(scene, hex) {
  const c = new THREE.Color(hex);
  const mats = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const m = o.material.clone();
    m.color = m.color.clone().multiply(c);
    m.userData.base = m.color.clone();
    o.material = m;
    mats.push(m);
  });
  return { scene, mats };
}

const WARM = new THREE.Color('#ffd27a');

/** The emblem on the roof, by sector. Small, procedural, in the sector's
    language; sits on the model's top. */
function Emblem({ sector, y }) {
  switch (sector) {
    case 'tech':
      return (
        <group position={[0.3, y, 0.3]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 0.9, 6]} />
            <meshLambertMaterial color="#8a94a3" />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#ff5a5a" />
          </mesh>
        </group>
      );
    case 'banks':
      return (
        <mesh position={[0, y + 0.02, 0]}>
          <sphereGeometry args={[0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshLambertMaterial color="#e2b84a" />
        </mesh>
      );
    case 'health':
      return (
        <group position={[0, y + 0.3, 0]}>
          <mesh>
            <boxGeometry args={[0.16, 0.56, 0.16]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.56, 0.16, 0.16]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, -0.09]}>
            <boxGeometry args={[0.6, 0.6, 0.02]} />
            <meshLambertMaterial color="#e2706f" />
          </mesh>
        </group>
      );
    case 'energy':
      return (
        <group position={[0, y + 0.08, 0]} rotation={[-0.5, Math.PI / 4, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.04, 0.6]} />
            <meshLambertMaterial color="#1f3a6e" />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.92, 0.01, 0.52]} />
            <meshBasicMaterial color="#3b6fc9" />
          </mesh>
        </group>
      );
    case 'consumer':
      // a striped awning on the roof's edge and a round sign: a shop
      return (
        <group position={[0, y, 0]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-0.5 + i * 0.25, 0.04, 0.35]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.24, 0.02, 0.5]} />
              <meshLambertMaterial color={i % 2 ? '#ffffff' : '#e9607a'} />
            </mesh>
          ))}
          <mesh position={[0.35, 0.5, -0.2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
            <meshLambertMaterial color="#8a94a3" />
          </mesh>
          <mesh position={[0.35, 0.95, -0.2]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
            <meshLambertMaterial color="#f78fb3" />
          </mesh>
        </group>
      );
    case 'industry':
      // two chimneys, one with a puff
      return (
        <group position={[0, y, 0]}>
          <mesh position={[-0.35, 0.3, -0.3]}>
            <cylinderGeometry args={[0.09, 0.11, 0.6, 8]} />
            <meshLambertMaterial color="#9b6b55" />
          </mesh>
          <mesh position={[0.1, 0.22, -0.35]}>
            <cylinderGeometry args={[0.07, 0.09, 0.44, 8]} />
            <meshLambertMaterial color="#9b6b55" />
          </mesh>
          <mesh position={[-0.35, 0.72, -0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshLambertMaterial color="#f2f2f2" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-0.28, 0.9, -0.26]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshLambertMaterial color="#f2f2f2" transparent opacity={0.55} />
          </mesh>
        </group>
      );
    case 'realestate':
      // the water tank every block of flats keeps on its roof
      return (
        <group position={[0.3, y, -0.3]}>
          {[-0.12, 0.12].map((dx) => (
            <mesh key={dx} position={[dx, 0.15, 0]}>
              <boxGeometry args={[0.03, 0.3, 0.03]} />
              <meshLambertMaterial color="#6b5a4a" />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.4, 12]} />
            <meshLambertMaterial color="#8d6b4a" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <coneGeometry args={[0.22, 0.14, 12]} />
            <meshLambertMaterial color="#6b5a4a" />
          </mesh>
        </group>
      );
    case 'comm':
      // a mast with a dish turned to the sky
      return (
        <group position={[0.25, y, 0.25]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.03, 0.045, 1.1, 6]} />
            <meshLambertMaterial color="#8a94a3" />
          </mesh>
          {[0.5, 0.75].map((h) => (
            <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1, 0.012, 6, 14]} />
              <meshLambertMaterial color="#c5ccd6" />
            </mesh>
          ))}
          <mesh position={[0, 1.05, 0]} rotation={[-0.7, Math.PI / 4, 0]}>
            <coneGeometry args={[0.3, 0.12, 14, 1, true]} />
            <meshLambertMaterial color="#f4f6f8" side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    default:
      return (
        <group position={[0.3, y, 0.3]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.9, 6]} />
            <meshLambertMaterial color="#8a94a3" />
          </mesh>
          <mesh position={[0.22, 0.78, 0]}>
            <planeGeometry args={[0.42, 0.26]} />
            <meshLambertMaterial color="#ff8a3d" side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
  }
}

/* A fenced plot with a slab, a stack of material and a barrier: what stands
   on the lot before the building does. */
function Site({ size }) {
  const s = size * 0.5;
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[size, 0.1, size]} />
        <meshLambertMaterial color="#c9bfae" />
      </mesh>
      {[[-s, 0], [s, 0], [0, -s], [0, s]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}>
          <boxGeometry args={[0.04, 0.4, size]} />
          <meshLambertMaterial color="#f5b400" />
        </mesh>
      ))}
      <mesh position={[-s * 0.4, 0.28, s * 0.3]} castShadow>
        <boxGeometry args={[0.6, 0.36, 0.4]} />
        <meshLambertMaterial color="#b58a5a" />
      </mesh>
      <mesh position={[s * 0.4, 0.22, -s * 0.3]} castShadow>
        <boxGeometry args={[0.5, 0.24, 0.5]} />
        <meshLambertMaterial color="#9aa5b1" />
      </mesh>
    </group>
  );
}

function useLogo(domain) {
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let live = true;
    loadLogo(domain).then((got) => live && setLogo(got));
    return () => {
      live = false;
    };
  }, [domain]);
  return logo;
}

const SITE_S = 1.3; // how long the construction site stands before the building rises

export default function StockBuilding({ building, position, onSelect, selected, marketOpen = true, onGone }) {
  const { symbol, sector, cx, cz, facing, plot } = building;
  const tier = tierFor(building.share);
  const kit = KITS[sector] ?? KITS.other;
  const model = useMemo(() => {
    const list = kit[tier.tier] ?? kit[2];
    return list[hash(symbol) % list.length];
  }, [kit, tier.tier, symbol]);
  const raw = useModel(model);
  const tinted = useMemo(() => (raw ? tint(raw, (LOOK[sector] ?? LOOK.other).tint) : null), [raw, sector]);
  const scene = tinted?.scene ?? null;
  const fit = useMemo(() => fitHeight(model, tier.height, tier.footprint, tier.footprint), [model, tier]);
  const logo = useLogo(building.domain);
  const brand = logo?.colour ?? building.district?.tint ?? '#6b7a90';
  const plaque = useMemo(() => plaqueTexture(logo?.image ?? null, symbol, brand), [logo, symbol, brand]);

  const dayPct = position?.dayPct;
  const colour = moveColor(dayPct);
  const up = Number.isFinite(dayPct) && dayPct >= 0.3;
  const down = Number.isFinite(dayPct) && dayPct <= -0.3;
  const [hover, setHover] = useState(false);
  // the pill over the roof: ticker always, the day's move once it is priced
  const ticker = symbol.replace(/\.(TA|L)$/, '');
  const badge = useMemo(
    () => tickerBadge(ticker, Number.isFinite(dayPct) ? formatPct(dayPct) : null, colour),
    [ticker, dayPct, colour]
  );

  /* The mood: a stock that is up is a building with the lights on — a warm
     emissive touch, more while the market is open; one that is down is a
     shade darker and unlit. Set when the move changes, never per frame. */
  useEffect(() => {
    if (!tinted) return;
    const lit = up ? (marketOpen ? 0.16 : 0.09) : 0;
    const shade = down ? 0.9 : 1;
    for (const m of tinted.mats) {
      if (m.emissive) {
        m.emissive.copy(WARM);
        m.emissiveIntensity = lit;
      }
      m.color.copy(m.userData.base).multiplyScalar(shade);
    }
  }, [tinted, up, down, marketOpen]);

  // one tap opens the sheet; a second within a third of a second flies in
  const lastTap = useRef(0);
  const tap = useMemo(() => {
    const h = tapHandlers(() => {
      const now = performance.now();
      if (now - lastTap.current < 350) lookAt(cx, cz, 3);
      lastTap.current = now;
      onSelect?.(building);
    });
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
        setHover(true);
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        setHover(false);
        document.body.style.cursor = '';
      },
    };
  }, [onSelect, building, cx, cz]);

  /* The building is a site first and rises when it is new, pops when it
     steps up or down a tier, shrinks away when sold, and breathes a little
     while hovered — all from refs in the frame loop. */
  const group = useRef();
  const glow = useRef();
  const arrow = useRef();
  const label = useRef();
  const crane = useRef();
  const site = useRef();
  const scaleRef = useRef(building.fresh ? 0.02 : 1);
  const born = useRef(null); // clock time the site appeared, while it is a site
  const gone = useRef(false);
  const lastTier = useRef({ tier: tier.tier, priced: building.share > 0 });
  useEffect(() => {
    const was = lastTier.current;
    lastTier.current = { tier: tier.tier, priced: building.share > 0 };
    if (was.tier === tier.tier || !was.priced || !(building.share > 0)) return;
    // a step up: the crane comes back and the new model grows into place; a
    // step down: it settles from a little too big. Only between two priced
    // plans — the first prices arriving are not an upgrade
    scaleRef.current = tier.tier > was.tier ? 0.78 : 1.12;
  }, [tier.tier, building.share]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    if (building.leaving) {
      scaleRef.current *= 0.9;
      if (scaleRef.current < 0.02 && !gone.current) {
        gone.current = true;
        onGone?.(symbol);
      }
    } else if (building.fresh && scaleRef.current < 0.05) {
      // the site stands for a moment before the building goes up
      if (born.current == null) born.current = t;
      if (t - born.current > SITE_S) scaleRef.current = 0.06;
    } else {
      const want = hover || selected ? 1.04 : 1;
      scaleRef.current += (want - scaleRef.current) * (scaleRef.current < 0.95 ? 0.045 : 0.15);
    }
    g.scale.setScalar(scaleRef.current);
    g.visible = scaleRef.current >= 0.05;
    if (site.current) site.current.visible = building.fresh && scaleRef.current < 0.05;
    if (glow.current) {
      const pulse = 0.2 + Math.sin(t * 1.6 + cx) * 0.06;
      glow.current.material.opacity = up ? pulse * (marketOpen ? 1.15 : 0.85) : down ? 0.1 : 0;
    }
    if (arrow.current) arrow.current.position.y = fit.height * scaleRef.current + 0.55 + Math.sin(t * 2.2) * 0.06;
    if (crane.current) {
      // the crane stands while the site is up and the building rises, then goes
      crane.current.visible = !building.leaving && scaleRef.current < 0.985 && scaleRef.current <= 1;
      crane.current.rotation.y = t * 0.25;
    }
    if (label.current) {
      const k = hover || selected ? 1.2 : 1;
      label.current.scale.set(2.3 * k, 0.63 * k, 1);
      label.current.position.y = fit.height * Math.max(0.3, scaleRef.current) + 1.05;
      label.current.visible = !building.leaving;
    }
  });

  const front = facing === 1 ? cz + plot.h / 2 - 0.02 : cz - plot.h / 2 + 0.02;
  const arrowUp = Number.isFinite(dayPct) && dayPct >= 0;

  return (
    <group position={[cx, 0, cz]}>
      {/* the day's move: a soft disc of light at the foot of the building */}
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[tier.footprint * 0.85, 28]} />
        <meshBasicMaterial color={colour} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* the construction site, before there is a building */}
      {building.fresh && (
        <group ref={site} visible={false} {...tap}>
          <Site size={tier.footprint} />
        </group>
      )}

      <group ref={group} {...tap}>
        {scene && (
          <group scale={fit.scale} position={fit.offset} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
            <primitive object={scene} />
          </group>
        )}
        <Emblem sector={sector} y={fit.height} />
        {/* a tap target the size of the building, whatever the model's holes */}
        <mesh position={[0, fit.height / 2, 0]} visible={false}>
          <boxGeometry args={[tier.footprint, fit.height, tier.footprint]} />
          <meshBasicMaterial />
        </mesh>
        {/* the plaque over the door, on the street face */}
        <mesh position={[0, Math.min(1.1, fit.height * 0.45), (front - cz) + (facing === 1 ? 0.04 : -0.04)]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[Math.min(1.3, tier.footprint * 0.8), Math.min(1.3, tier.footprint * 0.8) * 0.375]} />
          <meshBasicMaterial map={plaque} toneMapped={false} transparent />
        </mesh>
      </group>

      {/* a crane while the building goes up, or steps up a tier */}
      <group ref={crane} visible={false} position={[tier.footprint * 0.55, 0, -tier.footprint * 0.55]}>
        <mesh position={[0, (tier.height + 1.2) / 2, 0]}>
          <boxGeometry args={[0.16, tier.height + 1.2, 0.16]} />
          <meshLambertMaterial color="#f5b400" />
        </mesh>
        <mesh position={[-1.0, tier.height + 1.15, 0]}>
          <boxGeometry args={[2.6, 0.12, 0.12]} />
          <meshLambertMaterial color="#f5b400" />
        </mesh>
        <mesh position={[-1.9, tier.height + 0.55, 0]}>
          <boxGeometry args={[0.02, 1.1, 0.02]} />
          <meshBasicMaterial color="#444" />
        </mesh>
      </group>
      {/* a small arrow above the roof, up or down, in the day's colour */}
      {(up || down) && !building.leaving && (
        <mesh ref={arrow} position={[0, fit.height + 0.55, 0]} rotation={[arrowUp ? 0 : Math.PI, 0, 0]}>
          <coneGeometry args={[0.16, 0.3, 4]} />
          <meshBasicMaterial color={colour} toneMapped={false} />
        </mesh>
      )}
      {/* the ticker and the move, always, small; a little larger under the hand */}
      <sprite ref={label} position={[0, fit.height + 1.05, 0]} scale={[2.3, 0.63, 1]}>
        <spriteMaterial map={badge} transparent depthTest={false} />
      </sprite>
    </group>
  );
}

export const BUILDING_KITS = KITS;
