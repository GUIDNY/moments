import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import { useCity } from '../stocks/CityContext';
import { BOARD_BY_SYMBOL } from '../stocks/catalog';
import { lookAt } from '../world3d/focus';
import { planCity } from './layout';
import CityCamera from './CityCamera';
import CityGrid from './CityGrid';
import Decor from './Decor';
import PortfolioHQ from './PortfolioHQ';
import SectorDistrict from './SectorDistrict';
import StockBuilding from './StockBuilding';

/**
 * The city, as a picture of the portfolio. Reads the finished numbers from
 * `CityContext`, hands them to `planCity` for a grid, and draws the grid.
 * Nothing in here knows about brokers, prices or trades; swap the data
 * layer and this file does not change.
 */
export default function CityScene({ compact, selected, onSelectBuilding, onSelectHQ, visiting = null }) {
  const city = useCity();
  const source = visiting ?? city;
  const { holdings, positions, totalUsd } = source;

  /* The plan is remade when the holdings change or a tier boundary is
     crossed, not on every price tick: a price moves a glow, not a plot. */
  const tierKey = positions.map((p) => `${p.symbol}:${Math.floor((p.valueUsd ?? 0) / 1000)}`).join('|');
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

  // a building that was not in the last plan rises, and the camera goes to it
  useEffect(() => {
    const fresh = plan.buildings.find((b) => b.fresh);
    // stand back to see the new building and its neighbours; on a phone the
    // board is wider than the screen, so stay as close as the start
    if (fresh) lookAt(fresh.cx, fresh.cz, compact ? 2.75 : 1.9);
    // only a new plan flies the camera; a resize must not fly it again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  return (
    <Canvas
      orthographic
      shadows="soft"
      dpr={[1, compact ? 1.5 : 2]}
      camera={{ zoom: 20, near: -50, far: 200, position: [40, 40, 40] }}
      gl={{ antialias: true }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#dfe9ee']} />
      <ambientLight intensity={0.85} color="#ffffff" />
      <hemisphereLight args={['#ffffff', '#cfdac8', 0.7]} />
      <directionalLight
        position={[18, 30, 12]}
        intensity={1.3}
        color="#fff8ec"
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
        <Decor plan={plan} />
        {plan.districts.map((d) => (
          <SectorDistrict key={d.sector} district={d} />
        ))}
        <PortfolioHQ hq={plan.hq} totalUsd={totalUsd} onSelect={onSelectHQ} />
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
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
