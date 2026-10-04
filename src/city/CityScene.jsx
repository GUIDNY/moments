import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import CoinFlight from './CoinFlight';
import Decor from './Decor';
import Daylight from './Daylight';
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
  const { holdings, positions, totalUsd, cash, progress, trades, marketOpen, lastDividend } = source;
  const level = levelFor(xpFor(progress, { holdings, trades, positions, totalUsd })).level;

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

  /* A building whose symbol was not in the last plan is new: it rises. One
     that was and is not any more is sold: it stays as a ghost, shrinking
     into the ground, until it says it is gone. */
  const [ghosts, setGhosts] = useState([]);
  const lastPlan = useRef(plan);
  for (const b of plan.buildings) b.fresh = !known.current.has(b.symbol);
  useEffect(() => {
    const now = new Set(plan.buildings.map((b) => b.symbol));
    const left = lastPlan.current.buildings.filter((b) => !now.has(b.symbol));
    if (left.length) setGhosts((g) => [...g.filter((x) => !now.has(x.symbol)), ...left.map((b) => ({ ...b, fresh: false, leaving: true }))]);
    else setGhosts((g) => (g.some((x) => now.has(x.symbol)) ? g.filter((x) => !now.has(x.symbol)) : g));
    lastPlan.current = plan;
    known.current = now;
  }, [plan]);
  const onGone = useCallback((symbol) => setGhosts((g) => g.filter((x) => x.symbol !== symbol)), []);

  // handy from the console, and what the browser tests aim their taps with
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__buildings = plan.buildings.map((b) => ({ symbol: b.symbol, cx: b.cx, cz: b.cz, sector: b.sector, share: b.share }));
    window.__hq = plan.hq;
    window.__plan = { size: plan.size, districts: plan.districts.map((d) => ({ sector: d.sector, used: d.used, label: d.label })) };
  }, [plan]);

  // a dividend: coins fly from the company to the treasury
  const flight = useMemo(() => {
    if (!lastDividend) return null;
    const from = plan.buildings.find((b) => b.symbol === lastDividend.symbol);
    if (!from) return null;
    return { key: lastDividend.at + lastDividend.symbol, from: [from.cx, 1.5, from.cz], to: [plan.treasury.x, 1.2, plan.treasury.z] };
  }, [lastDividend, plan]);

  // a building that was not in the last plan rises where it stands. The
  // camera does not go to it: the user asked for a city that does not move
  // by itself, and a site with a crane is enough of a cue.

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
      {/* a warm afternoon while the market is open, a quieter, cooler light
          once it has closed — the light is most of what makes a board look
          like a place, and the difference is the city's clock */}
      <Daylight open={marketOpen} compact={compact} />
      <CityCamera centre={plan.centre} size={plan.size} compact={compact} />
      <Suspense fallback={null}>
        <CityGrid plan={plan} />
        <Decor plan={plan} level={level} open={marketOpen} unlocked={progress?.unlocked ?? []} />
        {plan.districts.map((d) => (
          <SectorDistrict key={d.sector} district={d} />
        ))}
        <PortfolioHQ hq={plan.hq} totalUsd={totalUsd} onSelect={onSelectHQ} />
        {/* the cash, as a building: the treasury beside the plaza */}
        <Treasury x={plan.treasury.x} z={plan.treasury.z} share={shareOf(cash, totalUsd)} onSelect={onSelectHQ} />
        {/* the market news board: small, in the park's far corner, second to the city */}
        <NewsBoard x={plan.board.x} z={plan.board.z} onSelect={onSelectNews} />
        {plan.buildings.map((b) => (
          <StockBuilding
            key={b.id}
            building={b}
            position={positions.find((p) => p.symbol === b.symbol)}
            selected={selected === b.symbol}
            onSelect={onSelectBuilding}
            marketOpen={marketOpen}
          />
        ))}
        {ghosts.map((b) => (
          <StockBuilding key={`ghost-${b.id}`} building={b} position={null} onGone={onGone} />
        ))}
        {flight && <CoinFlight key={flight.key} from={flight.from} to={flight.to} />}
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
