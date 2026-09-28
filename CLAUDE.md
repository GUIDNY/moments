# עיר הנרות (Candle City) — Claude Code notes

## What this is
A Hebrew, RTL, dark-mode virtual world of stock-market mini-games. The player walks an avatar
around a tile city, steps into doorways, plays a mini-game and earns coins into one shared wallet.
It grew out of the chart-pattern game in `GUIDNY/stockgame`.

## Stack
Vite 6 + React 18 (JSX, no TypeScript) + Tailwind 3. No backend, no router, no chart library —
state lives in `localStorage`, views are switched in `src/App.jsx`, and the candlestick chart is
hand-rolled SVG in `src/ui/CandleChart.jsx`.

## Layout
- `src/engine/` — seeded RNG (`rng.js`), candle generation (`market.js`), coins/XP/levels
  (`economy.js`), persistence (`storage.js`), the store (`GameContext.jsx`), shared hooks.
- `src/data/` — `patterns.js` (17 seed-built candlestick patterns), `items.js`, `achievements.js`.
- `src/world/` — `map-data.js` (grid, buildings, props, BFS pathfinding), `WorldMap.jsx`,
  `CityHud.jsx`, `Directory.jsx`.
- `src/games/` — one file per mini-game plus `registry.js`.
- `src/screens/` — bank, shop, profile.
- `src/ui/` — chart, button, panel, modal, toasts, `GameShell`, `ResultScreen`.

## Rules of the road
- Every mini-game is `({ meta, onExit }) => JSX`, wraps itself in `<GameShell>`, ends on
  `<ResultScreen>`, and pays out through `finishGame(meta.id, { score, base, accuracy, … })` so the
  economy stays on one scale. Never add coins directly from a game.
- A building's `target` in `map-data.js` must match a game id in `registry.js` or a key in
  `SCREENS` in `App.jsx`. Adding a game means bumping `TOTAL_GAMES` in `engine/constants.js`
  (the "played everything" achievement counts against it).
- Door tiles are walkable holes inside a blocked building footprint, and BFS never routes *through*
  a doorway — so you only ever arrive at one deliberately.
- The page is `dir="rtl"`. An absolutely positioned box with `auto` insets lands on the *right* in
  RTL, so anything positioned by `left:` (the world container, tiles, the avatar) needs an explicit
  `left`/`top`.
- Tailwind config keys with a hyphen must be quoted — an unquoted `pulse-ring:` is a syntax error
  that surfaces as a confusing PostCSS failure.

## Commands
```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview  # http://localhost:4173
npm run lint
```

## Design system
Primary `#44e092`, gold `#f5c542`, secondary `#ffb4aa`, tertiary `#c1c1ff`, surface `#0f131c`,
font Be Vietnam Pro — carried over from the original chart game.
