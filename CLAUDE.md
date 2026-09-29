# Playtown — Claude Code notes

## What this is
A dark-mode 3D town of mini-games. The player walks a voxel character around the streets, steps
into a lit doorway, plays a mini-game and earns coins into one shared wallet. English by default
with a Hebrew toggle; the look is third-person voxel.

The theme is deliberately neutral — no finance, no niche — because the target is web game portals
and a broad audience.

## Stack
Vite 6 + React 18 (JSX, no TypeScript) + Tailwind 3, with three.js through react-three-fiber for
the town. No backend, no router and no drei — state lives in `localStorage`, views are switched in
`src/App.jsx`, and every label in the 3D scene is a canvas texture.

## Layout
- `src/engine/` — seeded RNG (`rng.js`), coins/XP/levels
  (`economy.js`), persistence (`storage.js`), the store (`GameContext.jsx`), shared hooks.
- `src/i18n/` — `strings.js` (flat en/he dictionary) and `I18nContext.jsx` (`t`, `loc`, `setLang`).
- `src/data/` — `items.js`, `achievements.js`.
- `src/world/` — `map-data.js` (the tile grid, buildings, doors, props), `CityHud.jsx`,
  `Directory.jsx`.
- `src/world3d/` — `World3D.jsx` (canvas, lights, DOM chrome), `Scenery.jsx`, `VoxelPerson.jsx`,
  `Player.jsx`, `Npcs.jsx`, `Joystick.jsx`, `controls.js`, `textures.js`.
- `src/games/` — one file per mini-game plus `registry.js`.
- `src/screens/` — bank, shop, profile.
- `src/ui/` — button, panel, modal, toasts, `GameShell`, `ResultScreen`.

## Rules of the road
- Every mini-game is `({ meta, onExit }) => JSX`, wraps itself in `<GameShell>`, ends on
  `<ResultScreen>`, and pays out through `finishGame(meta.id, { score, base, accuracy, … })` so the
  economy stays on one scale. Never add coins directly from a game.
- User-facing text goes through `t('key')` from the dictionary, or `loc(entry)` for `{ en, he }`
  content that lives beside its data (game names, item names, achievements, level titles). No bare
  strings in components — a Hebrew literal in a component is a bug.
- `t()` localises object parameters too, so `t('achv.unlocked', { name: a.name })` works with a
  bilingual name straight from the data file.
- A building's `target` in `map-data.js` must match a game id in `registry.js` or a key in
  `SCREENS` in `App.jsx`. Adding a game means bumping `TOTAL_GAMES` in `engine/constants.js`
  (the "played everything" achievement counts against it).
- Door tiles are walkable holes inside a blocked building footprint. The opening is one tile and
  the player's collider is 0.6 wide, so `Player.jsx` steers the avatar towards the door centre when
  it is walking into one — without that magnetism you scrape the wall and never get in.
- Anything that moves every frame (position, facing, walk cycle, camera) is driven through refs
  inside `useFrame`, never through React state: `VoxelPerson` takes a `motion` ref for exactly this
  reason. A prop set once per render would freeze mid-walk.
- `Player.jsx` walks a long frame in sub-steps rather than clamping the delta — clamping makes the
  avatar crawl on a slow device, and no clamp at all tunnels through walls.
- ESLint's `react/no-unknown-property` is off for `src/world3d/**`: those JSX elements are three.js
  objects, not DOM nodes.
- The page direction is not fixed: `ltr` by default, `rtl` while Hebrew is on, flipped by
  `I18nProvider`. So never assume either one. In RTL an absolutely positioned box with `auto`
  insets lands on the *right*, which silently pushes anything positioned by `left:` off screen —
  give such elements an explicit `left`/`top`. Prefer `start`/`end` utilities over `left`/`right`
  for chrome that should mirror with the language.
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
font Be Vietnam Pro.
