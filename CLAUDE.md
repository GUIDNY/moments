# Stock City — Claude Code notes

## What this is
A 3D city you walk around in, in daylight, where **every tower is a stock you hold**. Its height is
what the position is worth, its roof is green when the stock is up today and red when it is down,
and the facade is bright when you are in profit and dark and cold when you are not. What the tower
is *made of* is its sector: stone and columns for the banks, curtain glass and a mast for the chip
makers, a chimney for energy, a radar for defence, a cross for health. Step into a doorway and you
get that holding's numbers: shares, price, what you paid, profit and loss.

Prices are live, free and keyless. Hebrew first, English as a toggle.

The city machinery — streets, joystick, doorway magnetism, minimap, voxel walker — has survived
three products now (a town of mini-games, a portfolio of projects, this). The map is the part that
changes.

## The chain
`portfolio → prices → arithmetic → skyline → streets`, and `stocks/CityContext.jsx` owns all of it.
Everything downstream reads the finished article.

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
  remembers between visits — badges, streak, records), `BadgesScreen.jsx`.
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
  mark and its colour, loaded once), `VoxelPerson.jsx`, `Player.jsx`, `Npcs.jsx`, `Joystick.jsx`,
  `MiniMap.jsx`, `controls.js`, `textures.js`, `playerPos.js`.
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
- The camera sits behind the player on the **+z** side, so what fills the screen is whatever has a
  smaller z. `getSpawn()` therefore puts the player *south* of the first tower whichever way its
  door faces; stepping "back" out of a north-facing door put the tower behind the camera.
- `getSpawn()` must also avoid door tiles. A door is walkable and standing on one enters that
  building, so a spawn that landed on a neighbour's doorstep opened its screen instantly.
- The city is relaid whenever a holding is added or sold, so the tile the avatar stands on can
  become the inside of a new tower. `Player` moves the avatar when `startTile` changes rather than
  only placing it on mount.
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
- **Every plot is built on.** The plots no holding occupies get a filler — an ordinary block, a
  townhouse, a shop with an awning — with no door and nothing behind it. Three towers in a field
  are a chart; three towers among a street of ordinary buildings are a city with three places that
  matter. Fillers are blocked tiles like any building, so `unreachableDoors()` covers them, and the
  spawn has to find a road tile with nothing in the three tiles behind it, because the camera is
  twelve tiles further south and a filler there hides the avatar.
- **The pavement is paint.** `groundTexture` draws a kerb and a pavement on every tile beside a
  road, lane dashes down the centre of each two-lane street and nothing on a junction — all from
  the grid, none of it in the grid. The walker still sees grass. Do not add a pavement terrain.
- A company's mark comes from `api/logo.js` by the `domain` in the catalogue, same-origin, which is
  what lets `logos.js` read its pixels for the brand colour — a cross-origin favicon can be shown
  but never sampled. The colour goes on the fascia, the lintel and the frame of the board on the
  roof, never on the walls (the sector's) or the parapet (the day's). A logo that never arrives
  leaves the sector sign in place; the city is never blocked on a third party.
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
- **The town is generated, so it is also checked.** `map-data.js` lays out four plots per zone and
  fills them from `projects.js`; a generated door can face a wall as easily as a street and the
  failure is silent — the building is there, the sign is over it, and you simply cannot get in.
  `unreachableDoors()` flood-fills from the spawn point and must return empty. Run it after any
  change to the plots, the roads or the props.
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
- **The camera trails the avatar from above and behind, so the edge of the map is always in shot.**
  `Ground` therefore lays an apron far past the fog's far plane and `Surrounds` fills the first
  forty metres of it with copses, hedges and fields, densest at the kerb. Without them, walking to
  the southern pavement fills half the screen with nothing. The river runs the length of the apron
  for the same reason — one that stopped at the boundary gave the whole trick away.
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
