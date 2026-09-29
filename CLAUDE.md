# Playtown — Claude Code notes

## What this is
A dark-mode 3D town of mini-games. The player walks a voxel character around the streets, steps
into a lit doorway, plays a mini-game and earns coins into one shared wallet. English by default
with a Hebrew toggle; the look is third-person voxel.

The theme is deliberately neutral — no finance, no niche — because the target is web game portals
and a broad audience.

## Five pages
Vite is an MPA (`build.rollupOptions.input`); the pages share the build and the Tailwind tokens and
nothing else.
- `index.html` — the game.
- `apartment.html` — a hand-built first-person walkthrough of one ski studio, modelled from photos.
- `landing.html` — the front door of the agent product: it takes the photographs and hands off to
  the builder.
- `studio.html` / `tour.html` — the estate-agent product. Both load `src/tour/entry.jsx`, which
  shows the **builder** when the URL has no `?p=`, and the **client tour** when it does. That is
  why the link an agent generates is just this same page again, and works under any host.

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
- `src/apartment/` — the walkthrough: `plan.js` (metres, walls, solids, viewpoints and the
  collision test), `materials.js` (every surface painted on a canvas), `Apartment.jsx` (geometry),
  `Viewer.jsx` (camera), `controls.js`, `Stick.jsx`.
- `src/tour/` — the agent product. Two ways to get a flat: `fromPhotos.js` builds **the** flat from
  what `api/analyse.js` read in the photographs, and `generate.js` builds *a* flat from the
  builder's form for the preview before any photograph exists. `SurveyedHome.jsx` draws the first,
  `Home.jsx` the second, `surfaces.js` paints every surface from the observed colours,
  `TourApp`/`StudioApp` are the two faces, `share.js` packs the property into the URL, and
  `engine/` holds the first-person camera, joystick and adaptive field of view shared with the
  apartment page.
- `api/analyse.js` — the one server-side thing in the repo: a Vercel function that
  sends the uploaded photographs to Claude and gets back a surveyed home.
- `src/landing/` — `LandingApp.jsx`, the marketing page that owns the first upload.
- `src/upload/PhotoUploader.jsx` — the one place a photograph enters the product, shared by the
  landing page and the builder.
- `src/lib/` — `supabase.js` (a ~60-line REST client for Storage) and `images.js` (canvas
  downscaling).
- `src/ui/` — button, panel, modal, `Sheet` (bottom sheet on phones, dialog from md up),
  toasts, `GameShell`, `ResultScreen`.

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
- The chrome over the game has its own small palette — `brand` (orange), `ink` (dark blue-greys)
  and `paper` (white/greys). The world keeps its district colours for wayfinding; do not mix the
  two sets.
- Floating controls share one recipe: same size, same radius, same `bg-ink-800/85` + blur + border
  + `shadow-chip`. The orange FAB is the only exception, because it is the one call to action.
- `world3d/playerPos.js` publishes the player position outside React, the way `controls.js` does
  for input. The minimap reads it in its own animation frame and the header samples it every
  400ms — neither re-renders while you walk.
- The venue sheet sets `--dock` to its own measured height; the joystick and the rail lift by that
  amount so an open sheet never buries the controls. Never hard-code that offset.
- Chrome that must mirror with the language uses `start-*`/`end-*`, never `left-*`/`right-*`.
- `src/tour/generate.js` places furniture and then *verifies* it: each piece is added only if every
  room is still reachable from the front door by flood fill. That is why the generator cannot emit a
  flat with a room you can see but never enter — keep that invariant if you add furniture.
- Where you stand in a room is found, not written down: `standIn` picks the reachable cell nearest a
  hint. Hard-coded viewpoints end up inside the dining table.
- A phone held upright has a very narrow horizontal view. `engine/AdaptiveFov` widens the vertical
  angle as the viewport gets taller, so the same amount of room stays in frame; without it an
  interior reads as one square metre of wall.
- In the apartment, `plan.js` is the single source of truth: the geometry you see and the collision
  you feel are both built from it, so a wall can never be drawn where you can walk. After changing
  the plan, flood-fill from the front door and check every viewpoint is still reachable — two choke
  points were narrower than the walker before that check caught them.
- A `planeGeometry` faces +Z. Anything you look at from the other side needs a rotation or
  `side={THREE.DoubleSide}`, or it silently vanishes.
- Tailwind config keys with a hyphen must be quoted — an unquoted `pulse-ring:` is a syntax error
  that surfaces as a confusing PostCSS failure.
- **The photographs build the home; they are never hung on its walls.** That was the first shape of
  this product and it was the wrong one: the client walked through a flat generated from a slider,
  with the agent's photographs framed on its walls as if to prove it was not the same place. Now
  `api/analyse.js` reads the rooms, their sizes, their wall and floor colours, their windows and
  their furniture out of the photographs, and `fromPhotos.js` builds that. Do not reintroduce
  `PhotoFrame`.
- `fromPhotos.js` preserves each room's observed **area**, not its width and depth separately. Every
  room is stretched to the corridor's width and given the difference back in depth, which keeps the
  rectangles clean and the small rooms small. A room's width and depth are what the model guessed;
  its area is what a person feels.
- How many rooms hang off the corridor decides the shape of the flat: three or more line both sides
  (stacked end to end, a seven-room flat is twenty-six metres long), one or two take a single side,
  and none means there is no corridor at all — a studio is just its room. Getting this wrong gives
  either a corridor nobody has walked down or a wide, shallow slot.
- "Left" and "far" only mean something relative to the door you came in by, and the two kinds of
  room are entered from different directions — a side room along x, the end room along z. `place()`
  takes a `facing` for exactly this. Measuring a piece's length along the wrong axis is how a
  two-metre sofa ends up through the wall of a room that is wide enough one way and not the other.
- A room on the left of the corridor is entered the other way round, so `toWorld` rotates its layout
  by half a turn. A mirror would be wrong — it swaps left and right inside the room.
- Furniture is kept only if every room is still reachable from the front door afterwards, exactly as
  in `generate.js`. A rug is excluded from that test: counting it as a solid walls off the middle of
  the very room it decorates. A piece that lands across a doorway slides along its wall first.
- Viewpoints are a photographer's angle, not a doorway's: stand to one side at the near end and look
  down the room's diagonal, with the eyes a few degrees below level. Straight in from the door you
  face the room's narrow side — a metre of wall and the end of a bed — and on a phone held upright,
  level eyes spend half the frame on ceiling.
- Every room's window is cut into the outer wall of the run it occupies. A bedroom without one reads
  as a cell, and it is the single biggest difference between a room that looks modelled and one that
  looks real.
- The survey is asked for a fixed vocabulary of room kinds, floor kinds, furniture kinds and walls,
  because anything outside it arrives as a word the renderer cannot build. Add to `api/analyse.js`
  and `SurveyedHome.jsx` together or not at all.
- A link now carries the whole survey, which is a few kilobytes of JSON — past where chat apps start
  mangling links. `share.js` gzips it (`packSpec`/`unpackSpec`) and marks the payload `z` or `j`;
  anything with neither marker is an old link and is read the old way. Decoding is therefore
  asynchronous, which is why `TourApp` renders a spinner before it has a spec.
- `PhotoUploader` keeps its list in a ref and lets React state follow, and `publish()` advances
  **both**. Picking a file starts its upload in the same tick, and the first progress callback
  patches that item before React has re-rendered — against a ref refreshed only during render, that
  patch rebuilds the list from *before* the file existed and silently drops it. Never reintroduce
  the `ref.current = state` -in-render form here.
- Photographs go through `lib/images.js` before the network: 1600px, JPEG, q0.82. That is not only
  for weight — an iPhone hands over `image/heic`, which no browser renders in an `<img>` but every
  browser decodes into a canvas, so the round trip is also what makes HEIC work at all.
- Supabase holds nothing but a public bucket, and the browser only ever has the publishable key.
  The bucket itself enforces the rules (images only, 8 MB, insert-only for `anon`) — the client is
  not a security boundary and must not be treated as one.
- `lib/supabase.js` uses XHR, not fetch, because only XHR reports upload progress; an agent on a
  phone uploading eight photographs needs a bar that moves.
- The landing page hands photographs to the builder through `tour/draft.js` in localStorage, not
  the query string: eight public URLs make a link some chat apps truncate.
- Missing Supabase env vars are a *build-time* fact — `storageReady` is false and the UI says so
  once, rather than failing one file at a time.

## Commands
`api/analyse.js` needs `ANTHROPIC_API_KEY` in the environment. Without it the endpoint answers
503 and the landing page says the survey is not connected, which is a working state — the builder
still makes tours by hand.

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview  # http://localhost:4173
npm run lint
```

## Design system
Primary `#44e092`, gold `#f5c542`, secondary `#ffb4aa`, tertiary `#c1c1ff`, surface `#0f131c`,
font Be Vietnam Pro.
