import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { fitHeight, useModel } from '../world3d/models';
import { loadLogo } from '../world3d/logos';
import { tapHandlers } from '../world3d/nav';
import { moveColor } from '../stocks/towers';
import { formatPct } from '../stocks/money';
import { tierFor } from './tiers';
import { plaqueTexture, tickerBadge } from './textures';

/**
 * One stock, one building. The tier (from the position's dollar value) picks
 * the height; the district picks the architecture; the day's move is a soft
 * glow at the base and a small arrow, never a building painted red. The
 * ticker and the day's move ride a small dark pill over the roof, the mark
 * sits on a plaque on the street face; a tap opens the panel.
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
  defence: {
    1: ['industrial/building-b', 'industrial/building-d'],
    2: ['industrial/building-f', 'industrial/building-h'],
    3: ['industrial/building-j', 'industrial/building-l'],
    4: ['industrial/building-n', 'industrial/building-p'],
    5: ['industrial/building-r', 'industrial/building-t'],
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

export default function StockBuilding({ building, position, onSelect, selected }) {
  const { symbol, sector, cx, cz, facing, plot } = building;
  const valueUsd = position?.valueUsd ?? building.valueUsd;
  const tier = tierFor(valueUsd);
  const kit = KITS[sector] ?? KITS.other;
  const model = useMemo(() => {
    const list = kit[tier.tier] ?? kit[2];
    return list[hash(symbol) % list.length];
  }, [kit, tier.tier, symbol]);
  const scene = useModel(model);
  const fit = useMemo(() => fitHeight(model, tier.height, tier.footprint, tier.footprint), [model, tier]);
  const logo = useLogo(building.domain);
  const brand = logo?.colour ?? building.district?.tint ?? '#6b7a90';
  const plaque = useMemo(() => plaqueTexture(logo?.image ?? null, symbol, brand), [logo, symbol, brand]);

  const dayPct = position?.dayPct;
  const colour = moveColor(dayPct);
  const [hover, setHover] = useState(false);
  // the pill over the roof: ticker always, the day's move once it is priced
  const ticker = symbol.replace(/\.(TA|L)$/, '');
  const badge = useMemo(
    () => tickerBadge(ticker, Number.isFinite(dayPct) ? formatPct(dayPct) : null, colour),
    [ticker, dayPct, colour]
  );

  const tap = useMemo(() => {
    const h = tapHandlers(() => onSelect?.(building));
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
  }, [onSelect, building]);

  /* The building rises when it is new, grows when it steps up a tier, and
     breathes a little while hovered — all from refs in the frame loop. */
  const group = useRef();
  const glow = useRef();
  const arrow = useRef();
  const label = useRef();
  const scaleRef = useRef(building.fresh ? 0.05 : 1);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const want = hover || selected ? 1.04 : 1;
    scaleRef.current += (want - scaleRef.current) * (scaleRef.current < 0.95 ? 0.04 : 0.15);
    g.scale.setScalar(scaleRef.current);
    if (glow.current) {
      const pulse = 0.22 + Math.sin(clock.elapsedTime * 1.6 + cx) * 0.06;
      glow.current.material.opacity = Number.isFinite(dayPct) && Math.abs(dayPct) >= 0.3 ? pulse : 0;
    }
    if (arrow.current) arrow.current.position.y = fit.height * scaleRef.current + 0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.06;
    if (label.current) {
      const k = hover || selected ? 1.2 : 1;
      label.current.scale.set(2.3 * k, 0.63 * k, 1);
      label.current.position.y = fit.height * scaleRef.current + 1.05;
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

      <group ref={group} {...tap}>
        {scene && (
          <group scale={fit.scale} position={fit.offset} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
            <primitive object={scene} />
          </group>
        )}
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

      {/* a small arrow above the roof, up or down, in the day's colour */}
      {Number.isFinite(dayPct) && Math.abs(dayPct) >= 0.3 && (
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
