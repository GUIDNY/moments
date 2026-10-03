import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, HueSaturation, N8AO, SMAA, Vignette } from '@react-three/postprocessing';
import { useCity } from '../stocks/CityContext';
import { BOARD_BY_SYMBOL } from '../stocks/catalog';
import { planCity } from './layout';
import { shareOf } from './tiers';
import { levelFor, xpFor } from '../stocks/xp';
import Treasury from './Treasury';
import CityCamera from './CityCamera';
import CityGrid from './CityGrid';
import Decor from './Decor';
import PortfolioHQ from './PortfolioHQ';
import NewsBoard from './NewsBoard';
import SectorDistrict from './SectorDistrict';
import StockBuilding from './StockBuilding';

/**
 * The city, as a picture of the portfolio. Reads the finished numbers from
 * `CityContext`, hands them to `planCity` for a grid, and draws the grid.
 * Nothing in here knows about brokers, prices or trades; swap the data
 * layer and this file does not change.
 */
export default function CityScene({ compact, selected, onSelectBuilding, onSelectHQ, onSelectNews, visiting = null }) {
  const city = useCity();
  const source = visiting ?? city;
  const { holdings, positions, totalUsd, cash, progress } = source;
  const level = levelFor(xpFor(progress, holdings.length)).level;

  /* The plan is remade when the holdings change or a share crosses a whole
     per cent, not on every price tick: a price moves a glow, not a plot. */
  const tierKey = positions.map((p) => `${p.symbol}:${Math.round(shareOf(p.valueUsd ?? 0, totalUsd) * 100)}`).join('|');
  const known = useRef(new Set(holdings.map((h) => h.symbol)));
  const plan = useMemo(
    () =>
      planCity(
        holdings.map((h) => {
          const p = positions.find((x) => x.symbol === h.symbol);
          return {
            symbol: h.symbol,
            sector: h.sector,
            name: h.name,
            domain: BOARD_BY_SYMBOL[h.symbol]?.domain ?? null,
            valueUsd: p && !p.missing ? p.valueUsd ?? 0 : 0,
            share: p && !p.missing ? shareOf(p.valueUsd ?? 0, totalUsd) : 0,
          };
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holdings, tierKey]
  );
  // a building whose symbol was not in the last plan is new: it rises
  for (const b of plan.buildings) b.fresh = !known.current.has(b.symbol);
  known.current = new Set(plan.buildings.map((b) => b.symbol));

  // handy from the console, and what the browser tests aim their taps with
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__buildings = plan.buildings.map((b) => ({ symbol: b.symbol, cx: b.cx, cz: b.cz, sector: b.sector }));
    window.__hq = plan.hq;
  }, [plan]);

  // a building that was not in the last plan rises where it stands. The
  // camera does not go to it: the user asked for a city that does not move
  // by itself, and a new building rising under a crane is enough of a cue.

  return (
    <Canvas
      orthographic
      shadows="soft"
      dpr={[1, compact ? 1.5 : 2]}
      camera={{ zoom: 20, near: -50, far: 200, position: [40, 40, 40] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      style={{ touchAction: 'none' }}
      onPointerMissed={() => onSelectBuilding?.(null)}
    >
      <color attach="background" args={['#a7c48e']} />
      {/* a warm afternoon: sky-blue fill from above, bounced green from the
          lawn, a low golden sun with long soft shadows — the light is most
          of what makes a board look like a place */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <hemisphereLight args={['#e6f3ff', '#9cc274', 0.75]} />
      <directionalLight
        position={[24, 26, 6]}
        intensity={2.1}
        color="#ffe7c2"
        castShadow
        shadow-mapSize={compact ? [2048, 2048] : [4096, 4096]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
      <CityCamera centre={plan.centre} size={plan.size} compact={compact} />
      <Suspense fallback={null}>
        <CityGrid plan={plan} />
        <Decor plan={plan} level={level} />
        {plan.districts.map((d) => (
          <SectorDistrict key={d.sector} district={d} />
        ))}
        <PortfolioHQ hq={plan.hq} totalUsd={totalUsd} onSelect={onSelectHQ} />
        {/* the cash, as a building: the treasury beside the plaza */}
        <Treasury x={plan.hq.cx + 3.3} z={plan.hq.cz + 0.3} share={shareOf(cash, totalUsd)} onSelect={onSelectHQ} />
        {/* the news board: centre stage, behind the HQ (up the screen is −x−z) */}
        <NewsBoard x={plan.hq.cx - 3.0} z={plan.hq.cz - 3.0} onSelect={onSelectNews} />
        {plan.buildings.map((b) => (
          <StockBuilding
            key={b.id}
            building={b}
            position={positions.find((p) => p.symbol === b.symbol)}
            selected={selected === b.symbol}
            onSelect={onSelectBuilding}
          />
        ))}
      </Suspense>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <N8AO aoRadius={1.2} intensity={1.8} distanceFalloff={1} halfRes quality="performance" />
        {/* a touch more colour and a soft edge: a picture, not a viewport */}
        <HueSaturation saturation={0.14} />
        <Vignette offset={0.32} darkness={0.42} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
