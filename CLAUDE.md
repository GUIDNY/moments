# Stock City — Claude Code notes

## What this is
A game that teaches how the stock market works, played the way a builder's game is played. You
start with **$100,000 of play money**, buy and sell real stocks at real (delayed) prices, and look
down on a 3D city in daylight where **every tower is a stock you hold**: tap a vacant lot to build
(buy), watch the tower go up, tap it to go in. There is no avatar and no joystick — you are the
mayor, not a pedestrian. Drag to pan, pinch or scroll to zoom. A tower's height is what the
position is worth, its roof is green when the stock is up today and red when it is down, and the
facade is bright when you are in profit and dark and cold when you are not. What the tower is
*made of* is its sector: stone and columns for the banks, curtain glass and a mast for the chip
makers, a chimney for energy, a radar for defence, a cross for health. Tap a tower and you get
that holding's numbers — shares, price, what you paid, profit and loss, three months of price with
your cost drawn across it — and the buttons to buy more or sell. The missions walk a beginner
through it; the lessons say what each number means; the glossary is for the words.

Prices are live, free and keyless. Hebrew first, English as a toggle.

The city machinery — streets, minimap, the generated map and its reachability check — has survived
four products now (a town of mini-games, a portfolio of projects, a city you walked, this). The
walker, the joystick and tap-to-walk were removed when it became a builder's game; `Npcs` still
walk the kerbs because a city with nobody in it is a model.

## The chain
`portfolio → prices → arithmetic → skyline → streets`, and `stocks/CityContext.jsx` owns all of it.
Everything downstream reads the finished article. The game sits on the same chain: a trade is
priced from the live quote and its dollar rate, settled in `store.js`, and the score is
`summary.valueUsd + cash`.

## Four pages
Vite is an MPA (`build.rollupOptions.input`); the pages share the build and the Tailwind tokens and
nothing else.
- `index.html` — the stock city.
- `apartment.html` — a hand-built first-person walkthrough of one ski studio, modelled from photos.
- `landing.html` — the front door of the estate-agent product: it takes the photographs.
- `studio.html` / `tour.html` — that product. Both load `src/tour/entry.jsx`, which shows the
  **builder** when the URL has no `?p=`, and the **client tour** when it does.

## Stack
Vite 6 + React 18 (JSX, no TypeScript) + Tailwind 3, with three.js through react-three-fiber for
the town. No backend, no router and no drei — state lives in `localStorage`, views are switched in
`src/App.jsx`, and every label in the 3D scene is a canvas texture.

## Layout
- `src/stocks/` — **the product**: `catalog.js` (the board you pick from, and the sectors that are
  also the districts), `store.js` (holdings in localStorage plus the share link), `money.js` (the
  arithmetic), `market.js` (live prices, published outside React), `towers.js` (what each tower
  should look like), `CityContext.jsx` (the chain), `PickerScreen.jsx`, `HoldingScreen.jsx`.
  The game layer: `achievements.js` (the badges and their tests), `progress.js` (what the city
  remembers between visits — badges, streak, records, lessons read, missions done),
  `BadgesScreen.jsx`, `TradeSheet.jsx` (the order ticket).
- `src/learn/` — what the city teaches: `content.js` (LESSONS that fire on the moment they are
  about, MISSIONS in order, the GLOSSARY — all bilingual beside their data), `LessonSheet.jsx`
  (one lesson or finished mission at a time), `LearnScreen.jsx` (the classroom).
- `api/quotes.js`, `api/search.js`, `api/logo.js` — the only server-side code, and it holds no
  key: the upstreams send no CORS headers, so the browser cannot call them directly. `logo.js`
  asks two public favicon caches for a company's mark and sends on the larger. `vite.config.js`
  mounts the same handlers in dev and preview so a change can be tried without shipping it — but
  it bundles the list of handler files when the server starts, so a *new* `api/*.js` needs the
  preview server restarted before it exists there.
- `src/world/` — `map-data.js` (lays the city out from the holdings), `CityHud.jsx`, `Directory.jsx`.
- `src/world3d/` — `World3D.jsx` (canvas, lights, DOM chrome), `Scenery.jsx` (ground, towers,
  the country past the kerb), `Streets.jsx` (the ordinary buildings, lamps and cars that make it a
  city), `architecture.js` (what each sector's buildings are made of), `logos.js` (a company's
  mark and its colour, loaded once), `models.js` + `Kit.jsx` (the kit models: loader, cache,
  fit-to-plot) with `kenney-bounds.json` (every model's footprint, measured from the files),
  `nav.js` (what counts as a tap), `VoxelPerson.jsx`, `Npcs.jsx`, `CameraRig.jsx` (drag to pan,
  pinch to zoom, fly to what asks) with `focus.js`, `MiniMap.jsx`, `textures.js`, `playerPos.js`
  (now the camera's point of attention).
- `public/models/` — Kenney's CC0 city kits (commercial, suburban, industrial, and the ready-made
  samples from modular), GLB plus each kit's `Textures/colormap.png`. The GLBs reference that
  colormap by relative path, so a kit folder is copied whole or not at all.
- `src/i18n/` — `strings.js` (flat he/en dictionary, Hebrew default) and `I18nContext.jsx`.
- `src/apartment/`, `src/tour/`, `src/landing/`, `src/upload/`, `src/lib/` — the estate-agent
  product and its photo reader, unchanged and independent of the city.
- `src/ui/` — button, panel, modal, `Sheet`.

## Rules of the road
- **Agorot.** Tel Aviv quotes in `ILA` and London in `GBp` — hundredths of a shekel and of a pound.
  The currency code is the only thing that says so. `money.js` `toMajor()` is the single most
  dangerous line in the app, because getting it wrong looks plausible: a ₪7,726 bank share instead
  of ₪77.26. The **cost basis goes through the same conversion as the price** — converting one and
  not the other turns a flat position into a 9,900% gain.
- A holding whose currency has no exchange rate is left **out** of the total and counted in
  `summary.unconverted`, never quietly added. Shekels plus dollars is not a number.
- Prices, tower heights and the player position are all mutated outside React and read inside
  `useFrame`. A price tick must never re-render the city. `CityContext` keeps a `tick` counter
  purely so the *React* side knows the mutable `market` object changed — it looks like an unused
  dependency and is the whole mechanism.
- Tower height is the **square root** of the holding's share of the portfolio. Linear scaling makes
  a normal portfolio one skyscraper beside a row of doorsteps, which cannot be read.
- **A badge is earned, never lost, and never earned from a half-priced portfolio.** Every test in
  `achievements.js` is decided from what is on screen — holdings, prices, streak — and the ones that
  depend on a price only run when `ready` is true: the market is not loading, something has been
  priced, and *every* holding has an entry in `market.bySymbol`. Before that gate, the first tower
  to be priced was read as the whole portfolio and the city gave out a medal for a two-percent
  fall nobody had.
- A shared link is somebody else's city: it neither grants badges nor counts a visit nor touches
  the viewer's streak. `progress.js` is keyed on the local date, so opening the app twice in a
  minute is one day and midnight is the user's, not the server's.
- The in-world mover badge (🔥/🧊 over a roof) fires at ±3% on the day, read in `useFrame` from
  `towers`. Lower and it is noise over every roof; it is a flag you cross the city for.
- **Every plot is built on.** The plots no holding occupies get a filler — an apartment block, an
  office, a shop with an awning, a townhouse — with no door and nothing behind it. Three towers in
  a field are a chart; three towers among a street of ordinary buildings are a city with three
  places that matter. Fillers are blocked tiles like any building, so `unreachableDoors()` still
  covers them: nobody walks now, but a door facing a wall is still a layout bug, and the NPCs do.
- **A holding's tower starts above the tallest filler's roof.** Kit fillers are fitted under
  `maxScale` 2.2 (about 2.8 high); `towers.js` `MIN_H` is 4. Raise one and raise the other, or a
  token holding disappears into the street it is supposed to be the landmark of.
- The city is alive from refs, never state: cars drive their lanes and walkers pace the kerbs from
  `useFrame`. Walkers keep to the kerb strip of the road tiles — the painted pavement is mostly
  building — and cars keep to the middle of their lanes to leave that strip free. Past the kerb,
  `Surrounds` puts blocks first and towers further out, so the fog holds a skyline rather than a
  tree line.
- A phone held upright gets a wider lens: `AdaptiveFov` in `World3D` opens the vertical angle as
  the viewport gets taller (38° landscape, up to 60° portrait), a lower pixel-ratio cap and a
  2048 shadow map. Without it a portrait screen showed one tower and a kerb and read as crowded
  for no reason but the aspect ratio.
- **The pavement is paint.** `groundTexture` draws a kerb and a pavement on every tile beside a
  road, lane dashes down the centre of each two-lane street and nothing on a junction — all from
  the grid, none of it in the grid. The walker still sees grass. Do not add a pavement terrain.
- A company's mark comes from `api/logo.js` by the `domain` in the catalogue, same-origin, which is
  what lets `logos.js` read its pixels for the brand colour — a cross-origin favicon can be shown
  but never sampled. The colour goes on the fascia, the lintel and the frame of the board on the
  roof, never on the walls (the sector's) or the parapet (the day's). A logo that never arrives
  leaves the sector sign in place; the city is never blocked on a third party.
- **The ordinary city is the kits'; the towers are ours.** Fillers, parks, trees and the country
  past the kerb are Kenney models fitted to their plots by `Kit` — scaled uniformly to the tighter
  of width and depth so a building keeps its proportions and merely grows. A holding's tower stays
  procedural because it carries things no kit model can: the company's mark and colour, the
  sector's material, and a height that animates with the price (stretching a GLB stretches its
  windows). `kenney-bounds.json` is generated from the files' vertex ranges; regenerate it when a
  model is added, never edit it.
- A model that fails to load is an empty plot, not a broken city: `loadModel` resolves null and
  `Kit` renders nothing. Clones share geometry and material, so a street of the same block is one
  geometry and a `Kit` per plot is cheap.
- **The purse is in dollars, whatever the display currency.** A game needs one scoreboard, so
  `store.js` keeps `cash` in USD, every trade converts the stock's price to dollars at the live rate
  (`tradeQuote` in `money.js`), and `market.js` always fetches the dollar rate for every currency
  it meets — a shekel stock cannot be bought without knowing what a shekel costs. The cost basis
  stays in the stock's own currency, as before; `realised` on a sell trade is in dollars.
- **A trade is shown in full before the button.** The ticket prices the order from the live quote:
  price, fee (0.1%, a dollar at least — small enough never to matter to the score, present enough
  to teach that trading is not free), total and cash after. `buy`/`sell` in `store.js` are pure
  and return an `error` code rather than throwing; the UI puts the code into words. Never settle a
  trade whose currency has no dollar rate yet.
- **A trade is executed against the quote on screen.** `ensureQuote` fetches a quote on demand for
  a stock you do not hold yet; the board shows a live price beside every name for the same reason
  — a board with prices is a market, one without is a list of company names.
- **Lessons fire once, on the moment they are about.** The rules live in `CityContext` (first buy,
  first fee, first shekel trade, a day's move over 1%, two in one sector, an index fund, a sale,
  one holding over half, a red day, three days running). Missions complete in order — only the
  first open one is tested — and each opens its lesson. Both are queued and shown one at a time;
  reading a lesson is what marks it read. The welcome lesson is the first thing in the queue.
- The history is one point per local day of total and cash, with a `start` point at the purse so
  the line always begins somewhere; the same day overwrites. `snapshot` only runs once the score
  is real (every holding priced). The share link carries the purse and the start date but not the
  history or the trades.
- Nothing in the lessons is advice, and the screens say so (`learn.notAdvice`). Keep it that way:
  the content explains how the machine works, with play money and delayed prices.
- **The camera is the player.** `CameraRig` keeps its target and distance in refs and applies
  them in `useFrame`; a drag never re-renders anything. It is a three-quarter view (pitch ~38°,
  yaw 45°), not a map — the user asked for "not really from above". Panning starts only after an
  8 px dead zone, so a tap with a wobble in it stays a tap and the city stays put; the rail has
  +/− buttons because a thumb cannot scroll and often cannot pinch. A fly-to aims a little in
  front of the tower and stands back, or at this pitch the tower fills the frame and loses its
  roof. It publishes the point it looks at through
  `setPlayerPos`, which is what the minimap marker, the district chip and the signs that fade with
  distance read — so nothing downstream had to learn that the walker was gone. `focus.js` is how
  something asks to be looked at: a new tower sets it, the rig flies there and clears it, and a
  hand on the city clears it first.
- **A tap is measured on the screen, not in the world.** While the city is being dragged the world
  point under the finger hardly moves, so a world-space tap test read every drag as a tap on
  wherever it ended. `nav.js` compares `clientX/Y` (10 px, 500 ms) and acts on the next tick,
  after the browser's follow-up `click` has gone by — a tap on a lot used to open the board and,
  in the same breath, the ticket for the row that was now under the finger. Lots and towers stop
  propagation so the ground does not also get the tap.
- **The first empty block is the lots.** `map-data` themes it `lot`; `Streets` draws a fenced plot
  with a build-here sign that opens the board. A builder's city always has somewhere to build.
- **A new tower rises.** `CityContext` tells `rebuild()` which symbols are new since *its* last
  layout, and `map-data` flags those buildings `fresh` — so a reload builds the skyline standing
  and only a buy makes one rise. `Shop` starts a fresh tower at the ground and eases it up slowly
  under a crane sprite; `World3D` flies the camera to it and clears the flag, so coming back from
  the tower's own screen does not fly there again. The city is relaid during render (`useMemo` in
  `CityContext`), not in an effect: a buy closes the board and mounts the city in the same commit,
  and the city's first render already needs the tower.
- **The map is generated, so it is checked.** `unreachableDoors()` flood-fills from the plaza and
  must return empty, for every portfolio size from 0 to 24.
- Sectors keep their name and colour; **which block they occupy adapts** so the occupied ones crowd
  the plaza. Six fixed quarters and three holdings is a city you spawn in the middle of and cannot
  see a single tower from.
- A sector with more holdings than its block has plots spills into whichever block has room. A
  tower with nowhere to stand would vanish, and the city would stop matching the portfolio.
- `api/*` validates every symbol against a pattern before passing it upstream. Symbols arrive from
  links, pasted text and typing; the proxy must not become a way to make the server fetch anything.
- The upstream is unofficial and delayed. The UI says so, from the endpoint's own `delayed` flag —
  do not quietly present it as real-time, and do not present any of it as advice.
- User-facing text goes through `t('key')` from the dictionary, or `loc(entry)` for `{ he, en }`
  content that lives beside its data — company names, sector names. No bare strings in components;
  a Hebrew literal in a component is a bug. A name we chose in Hebrew beats the exchange's own
  ALL-CAPS English; a symbol found by search has no catalogue name, so the quote fills in.
- Which row of a plot the door goes in depends on which road the plot can reach, which is what
  `doorFor`'s `doorRow` is for. The blocks between two roads open upward from the top row and
  downward from the bottom one.
- Props are filtered against the building footprints rather than hand-avoided: the buildings move
  whenever the portfolio changes, and a prop dropped on top of one would block a doorway.
- `Sheet` renders a `title` when given one, and wraps it with the padding to match — a sheet given
  only `labelledBy` lays out its own header and must not be wrapped again. For a long time it took
  a `title` and drew nothing, so every sheet opened unlabelled with `aria-labelledby` pointing at
  an element that did not exist.
- `t()` localises object parameters too, so `t('achv.unlocked', { name: a.name })` works with a
  bilingual name straight from the data file.
- Anything that moves every frame (position, facing, walk cycle, camera) is driven through refs
  inside `useFrame`, never through React state: `VoxelPerson` takes a `motion` ref for exactly this
  reason. A prop set once per render would freeze mid-walk.
- ESLint's `react/no-unknown-property` is off for `src/world3d/**`: those JSX elements are three.js
  objects, not DOM nodes. The config's `rules` key overwrites the `recommended` spread above it,
  so the recommended rules are spread again inside `rules` — without that `no-undef` is silently
  off, and two ReferenceErrors once shipped past a clean lint.
- The page direction is not fixed: `ltr` by default, `rtl` while Hebrew is on, flipped by
  `I18nProvider`. So never assume either one. In RTL an absolutely positioned box with `auto`
  insets lands on the *right*, which silently pushes anything positioned by `left:` off screen —
  give such elements an explicit `left`/`top`. Prefer `start`/`end` utilities over `left`/`right`
  for chrome that should mirror with the language.
- The chrome over the game has its own small palette — `brand` (orange), `ink` (dark blue-greys)
  and `paper` (white/greys). The world keeps its district colours for wayfinding; do not mix the
  two sets.
- **Ambient occlusion is most of the difference between a rendered model and a drawn one.** The
  canvas ends with an `EffectComposer` running `N8AO` at half resolution and `SMAA`, and the sun
  casts soft shadows from a 4096 map. That stack is `@react-three/postprocessing@2` — the 3.x line
  is for fiber 9, and this app is on fiber 8. Keep AO cheap (`halfRes`, `quality="performance"`):
  the test is a phone at sixty frames, not a desktop screenshot.
- **A city is not only buildings.** Every empty block gets a character, by distance from the
  plaza: the nearest is the *market* (parasols over paving, planters), the next the *park* (paths,
  the kit's trees, a fountain on its first plot), the rest *suburbs* (a house with its fence and
  drive). A block with a tower in it is *downtown*: the commercial kit's blocks, a park on one plot
  in four. `map-data` assigns the theme (`filler.theme`), `Streets` draws it. The edges are places
  too: `Waterfront` runs a promenade of trees and benches down the river bank (painted as pavement
  by `groundTexture`), a small port where the river leaves town, a water tower and tank at the
  other corner, windmills in the far corners and solar fields on the southern margin.
- The city needs air as much as buildings: fillers stay under `maxScale` 2.2, lamps every eight
  tiles, one car a road, a walker on one kerb in three. Density past that read as a wall, and the
  user said so twice. Towers run 4 to 7.5: "not that height" — a mid-rise city, not a wall.
- **The city is lit as a model on a table, so its chrome is white cards.** Floating controls over
  the city share one recipe: same size, same radius, `bg-white/92` + blur + `border-paper-200` +
  `shadow-card`, with `text-ink-900`. The orange FAB is the only exception, because it is the one
  call to action. The dark `bg-ink-800/85` + `shadow-chip` recipe still belongs to the estate-agent
  pages, which are dark — do not carry either one across.
- A sector's architecture lives in `world3d/architecture.js` and nowhere else: wall, glass, trim,
  window `style`, roof `crown`, storey height and whether it has a colonnade. `facadeTexture` paints
  the `style` and `Crown` in `Scenery.jsx` builds the `crown`; adding a sector means adding to all
  three. Height and the up/down colour are *not* in there, because those are the price.
- The mood of a holding is a **shade**, not a colour. `towers.js` publishes `shade` and `chill` and
  `Scenery` multiplies the district's own wall colour by them. It used to publish a finished grey,
  which painted all six districts the same the moment they stopped being identical boxes.
- **The camera can be dragged to the map's edge, so the edge is always in shot.** `Ground`
  therefore lays an apron far past the fog's far plane and `Surrounds` fills the first forty
  metres of it with blocks, towers, copses, hedges and fields, densest at the kerb. Without them,
  panning to the southern margin fills half the screen with nothing. The river runs the length of
  the apron for the same reason — one that stopped at the boundary gave the whole trick away.
- `world3d/playerPos.js` publishes the camera's point of attention outside React. The minimap
  reads it in its own animation frame and the header samples it every 400ms — neither re-renders
  while you drag.
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
  with the agent's photographs framed on its walls as if to prove it was not the same place. Do not
  reintroduce `PhotoFrame`.
- **The survey runs in the browser and costs nothing.** The job splits along the line where both
  halves are easy: a canvas can measure every surface in a photograph but cannot say what it is
  looking at, and an agent can say what they are looking at instantly but would never type colour
  codes. So `readPhoto.js` measures, and the agent taps a room kind per photograph and the flat's
  m². Keep it that way — a key is an upgrade, never a requirement.
- Colour constancy is ill-posed: a warm photograph of a white room and a neutral photograph of a
  cream room are the same pixels. `illuminant()` therefore scales its correction with how strong
  the estimated cast is — below a ratio of 1.12 it does nothing at all, because a faint tint is far
  more likely to be the room than the light. Correcting unconditionally painted a cool grey
  bathroom beige.
- The floor's material comes from *lines*, not from edge counts. Counting edges cannot separate a
  noisy carpet from a tiled floor; boards put a seam right across the picture and nothing down it,
  grout runs both ways, and carpet has texture everywhere and no line anywhere. Colour only breaks
  ties — plenty of carpet is the same beige as oak.
- A window is found as the largest *connected* blob of bright pixels, not the bounding box of all
  of them. Almost every interior photograph has a white ceiling in shot; a box around the ceiling
  and the window together spans the whole frame and the window is thrown away for being too wide.
- The brightness cut for that blob is relative to the room's own wall and capped below 255. A fixed
  margin above a pale wall lands past white, and then nothing is ever bright enough.
- Furniture is the one part of the free survey that is a guess rather than a measurement — a kit
  per room kind, in the colours read from that room's own photograph. The UI says so; keep it
  saying so.
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
`npm run preview` must be started as a *background* process in a Claude Code session — a server
started inside a foreground call dies when the call returns, and the browser tests then fail with
`ERR_CONNECTION_REFUSED` and nothing else wrong.

No keys anywhere. `api/quotes.js` and `api/search.js` proxy a free public endpoint and hold no
secret; `api/analyse.js` is an optional upgrade for the estate-agent product and nothing calls it.

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview  # http://localhost:4173
npm run lint
```

## Design system
Primary `#44e092`, gold `#f5c542`, secondary `#ffb4aa`, tertiary `#c1c1ff`, surface `#0f131c`,
font Be Vietnam Pro.
