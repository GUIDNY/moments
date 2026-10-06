# Stock City — Claude Code notes

## What this is
A game that teaches how the stock market works, played the way FarmVille or Township is played:
a small, dense, isometric city on a board, seen from a fixed angle, where **every stock you hold
is a building**. You start with **$100,000 of play money**, buy and sell real stocks at real
(delayed) prices, and the city is the picture of the portfolio: a building's *tier* (shop → block
→ office → tower → skyscraper) is the position's dollar value, its district is the sector, the
day's move is a soft glow at its foot and a small arrow over its roof, and the headquarters in the
central park grows a level as the whole portfolio does. Tap a building and a side panel (a bottom
sheet on a phone) shows the position; tap the HQ and the portfolio view opens. Five tabs along the
bottom: City, Portfolio, Market, Rankings, Friends. The missions walk a beginner through it; the
lessons say what each number means; the glossary is for the words.

Prices are live, free and keyless. Hebrew first, English as a toggle.

This is the fifth shape of the product (a town of mini-games, a portfolio of projects, a city you
walked, a city you built with a free camera, this). What survived every time is the data layer;
the visualization has been replaced whole, and the seam between them is the point.

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
the town, Lucide for icons and Motion for the chrome's springs. No backend, no router and no drei — state lives in `localStorage`, views are switched in
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
- `api/quotes.js`, `api/search.js`, `api/logo.js`, `api/news.js` — the only server-side code, and
  it holds no key: the upstreams send no CORS headers, so the browser cannot call them directly. `logo.js`
  asks two public favicon caches for a company's mark and sends on the larger. `vite.config.js`
  mounts the same handlers in dev and preview so a change can be tried without shipping it — but
  it bundles the list of handler files when the server starts, so a *new* `api/*.js` needs the
  preview server restarted before it exists there.
- `src/city/` — **the City Visualization Layer.** It reads finished numbers from `CityContext`
  and draws them; nothing in it knows about brokers, prices or trades, so the data layer can be
  swapped without touching it. `tiers.js` (BUILDING_TIERS by position value, HQ_LEVELS by
  portfolio value, `cityLevel` — tables, not formulas), `layout.js` (`planCity`: a 28×28 grid
  with a park and the HQ in the middle, a road ring and cross, one district per sector around
  them, four 3×3 plots each, biggest position nearest the centre), `CityScene.jsx` (canvas,
  lights, AO; plans the city from the context), `CityCamera.jsx` (orthographic, fixed 40°/45°,
  drag, pinch, wheel, +/−, fly-to), `CityGrid.jsx` (the ground painted once, the board's edge,
  the lake), `StockBuilding.jsx` (tier → kit model per district, plaque with mark and ticker,
  glow, arrow, hover badge, tap), `PortfolioHQ.jsx`, `SectorDistrict.jsx` (a flat label on the
  lane), `Decor.jsx` (trees, benches, lamps, two cars, four tiny people — a fixed budget),
  `textures.js` (ground, plaque, badge, label).
- `src/ui/game/` — the chrome: `PortfolioHUD` (one number top centre), `CityProfile` (whose city,
  level), `BottomNavigation`, `StockInfoPanel` (side panel / bottom sheet, buy and sell),
  `PortfolioView` (the same holdings as a list, scoreboard, trades), `VisitCityMode` (the frame
  for somebody else's city and the `CityCard` the Friends tab will list), `SoonScreen`.
- `src/world3d/` — what the city still uses from the walking era: `models.js` + `Kit.jsx` (kit
  loader, cache, `fitTo`/`fitHeight`) with `kenney-bounds.json`, `logos.js`, `nav.js` (what
  counts as a tap), `focus.js` (fly-to and zoom requests), `playerPos.js` (the camera's point of
  attention), `VoxelPerson.jsx`, `skins.js`.
- `public/models/` — Kenney's CC0 city kits (commercial, suburban, industrial, and the ready-made
  samples from modular), GLB plus each kit's `Textures/colormap.png`. The GLBs reference that
  colormap by relative path, so a kit folder is copied whole or not at all.
- `src/i18n/` — `strings.js` (flat he/en dictionary, Hebrew default) and `I18nContext.jsx`.
- `src/lib/auth.js`, `src/stocks/cloud.js`, `src/stocks/useCloud.js`, `src/ui/game/AccountSheet.jsx`,
  `src/ui/game/CloudConflictSheet.jsx` — the optional account: sign-in, the city kept on the
  server, friends by code (see the rule below).
- `src/apartment/`, `src/tour/`, `src/landing/`, `src/upload/`, `src/lib/` — the estate-agent
  product and its photo reader, unchanged and independent of the city.
- `src/ui/` — button, panel, modal, `Sheet`.

## Rules of the road
- **Agorot.** Tel Aviv quotes in `ILA` and London in `GBp` — hundredths of a shekel and of a pound.
  The currency code is the only thing that says so. `money.js` `toMajor()` is the single most
  dangerous line in the app, because getting it wrong looks plausible: a ₪7,726 bank share instead
  of ₪77.26. The **cost basis is stored in major units** — `store.js` writes the settled trade
  price, ₪77.46 — so `priceHolding` converts the quote and *not* the cost. Converting both turned a
  position bought a minute ago into a 9,900% gain with a "doubled" badge; converting neither is the
  ₪7,726 share. The unit of each number is decided where it is written, never guessed where it is
  read.
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
- **The pavement is paint, and a strip.** `city/textures.js` `groundTexture` draws a kerb and a
  pavement a quarter of a tile wide along every road edge, lane dashes on the main roads only,
  nothing at a junction, and a district lane (`TILE.LANE`) as a pale path through the lawn, not a
  road — all from the grid, none of it in the grid. The pavement was once the whole tile beside a
  road, and since two rows of every plot touch a road the whole city read as parking lots; the
  user said it did not look good enough, and that was most of why.
- **The light is most of the look.** A warm, low sun (`#ffe7c2`, intensity 2.1, from [24, 26, 6])
  with long soft shadows, a sky-and-lawn hemisphere light, ACES tone mapping at 1.08, a touch of
  saturation and a vignette in the composer. Lawns are two tones of patch, never flat; flower
  beds (four colours), low hedges at the garden's road edge and a fountain in front of the HQ give
  the board colour and detail. Tiers run 1.5–6.8 high on footprints 2.0–2.7 of a 3×3 plot, so a
  building fills its plot rather than standing in a car park.
- **Only buildings that are stocks.** No fillers: a plot without a position is a garden — trees
  and a planter or two, so an empty district is green rather than bare. The user asked for a city
  where the stocks are the hero and nothing else draws the eye; the decor budget is ~150 trees,
  24 planters, 10 benches, 40 lamps, 2 cars, 4 people, all decided once per plan.
- A company's mark comes from `api/logo.js` by the `domain` in the catalogue, same-origin, which is
  what lets `logos.js` read its pixels for the brand colour — a cross-origin favicon can be shown
  but never sampled. The colour goes on the fascia, the lintel and the frame of the board on the
  roof, never on the walls (the sector's) or the parapet (the day's). A logo that never arrives
  leaves the sector sign in place; the city is never blocked on a third party.
- **Every building is a kit model now**, chosen per district and tier from `BUILDING_KITS` in
  `StockBuilding.jsx` and fitted by `fitHeight` to the tier's height (capped by the plot). The
  company's mark and ticker go on a small plaque over the door, never on the walls. **A sector
  is a look on top of the kit** (`LOOK` and `Emblem` in `StockBuilding`): the kit's colours are
  multiplied by the sector's tint (cool glass for tech, sandstone for banks, white for health,
  warm for energy, olive for defence) on a per-building clone of the materials, and a small
  procedural emblem stands on the roof — mast, gold dome, cross, solar panel, radar dish, flag.
  The user asked for a city where "each stock looks like its sector"; the kits alone did not say
  it. The tint is a shade, never the day's colour.
  `kenney-bounds.json` is generated from the files' vertex ranges; regenerate it when a model is
  added, never edit it.
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
- **Where the line begins is the baseline, and a connected portfolio begins at itself.** The
  history is one point per local day of total and cash; the same day overwrites, and `snapshot`
  only runs once the score is real (every holding priced). A played game gets a `start` point at
  the $100,000 purse; an import resets the history and the first real total is the first point
  (no synthetic start when `state.imported`). Everything "since the start" reads
  `history[0].total`: the HUD's return (cost-based `gainPct` when the holdings carry a cost,
  else against that baseline), the portfolio line, the "rise 2%" mission (`baseUsd` in the
  mission ctx) and the HQ's level (`HQ_LEVELS` are *multiples* of the baseline — a ₪50,000
  portfolio and a $5M one start at the same office). A file with no cash row asks on the
  preview: "portfolio only" (cash 0, the default — the city is worth what the portfolio is) or
  keep the play-money purse. Missions that only make sense in the play game (keep 10% cash,
  sell part) carry `skipIf: ({ imported })` and step aside for a connected portfolio. The user
  asked for exactly this: a real portfolio starts from its own value, never from $100,000. The
  share link carries the purse and the start date but not the history or the trades.
- Nothing in the lessons is advice, and the screens say so (`learn.notAdvice`). Keep it that way:
  the content explains how the machine works, with play money and delayed prices.
- **A tap is measured on the screen, not in the world.** While the city is being dragged the world
  point under the finger hardly moves, so a world-space tap test read every drag as a tap on
  wherever it ended. `nav.js` compares `clientX/Y` (10 px, 500 ms) and acts on the next tick,
  after the browser's follow-up `click` has gone by — a tap on a lot used to open the board and,
  in the same breath, the ticket for the row that was now under the finger. Lots and towers stop
  propagation so the ground does not also get the tap.
- **The plan is a table, not a search.** `planCity` places each sector in a fixed region so a
  city looks the same every time it opens, fills plots biggest-first nearest the centre, and
  spills a sector with more positions than plots into the nearest district with room — a building
  with nowhere to stand would vanish and the city would stop matching the portfolio. The plan is
  remade when the holdings change or a share crosses a whole per cent, never on a price tick: a
  price moves a glow, not a plot.
- **Nine sectors, nine districts, on a 31×31 board.** The boulevard (cross at 8 and 22, ring at
  9 and 21) cuts eight regions — four 7×7 corners with four plots, four 11-long sides with six —
  and the ninth district is the park: index funds stand beside the HQ, because an index fund *is*
  the whole market. The sector ids are stored on every holding, so an id is forever: `defence`
  became `industry` and `SECTOR_ALIASES` in the catalogue renames it on load; the catalogue is
  the authority on a known symbol's sector, so moving Google to Communication moves every city.
  Each district's lawn carries a faint wash of its colour (`groundTexture` `zones`, alpha 0.16)
  so the neighbourhoods read from far out — a shade on the grass, never a painted floor.
- **A sector is a look on top of the kit** — nine of them now: tint plus a roof emblem (mast,
  gold dome, cross, solar panel, striped awning, chimneys, water tank, dish, flag).
- **The day's move is a mood, not a paint job.** Up: the building's cloned materials get a warm
  emissive touch (more while the market is open) and the glow disc pulses; down: a shade darker,
  unlit, a dim glow. Set in an effect when the move changes, never per frame. The user asked for
  no "cheap red and green everywhere".
- **Buying and selling are events.** A new position is a construction site (`Site`: slab, fence,
  a stack of material) for 1.3 s under a crane, then the building rises; a tier change pops the
  new model in from 0.78 (up) or 1.12 (down) with the crane back for a moment; a position sold
  out stays in `CityScene`'s `ghosts` with `leaving: true`, shrinks into the ground and calls
  `onGone`. The plan's `fresh` flag is a building whose symbol was not in the last plan.
- **The market has a clock.** `api/quotes.js` says `open` per quote from the exchange's own
  session times (`currentTradingPeriod`, because the chart endpoint rarely says `marketState`);
  `CityContext.marketOpen` is true while any held exchange is in session. `Daylight` eases
  between a warm afternoon and a cooler, quieter light; `Decor` runs four cars when open and two
  after, slower walkers, warmer lamps. Subtle on purpose — a city after hours, not a night mode.
- **Far out, the city is its buildings.** `Decor` hides cars, people and benches below a camera
  zoom of 26 px per unit (`DETAIL_ZOOM`); trees are 80 on the board and 150 in the country — the
  user said the old city had too many, and it did. The news board is small (3.2×1.3) in the
  park's north-west corner, second to the city; it was centre stage and stole the eye.
- **Dividends are real and paid once.** The proxy passes the chart's `events.dividends` (ex-date
  and amount per share, in the quote's currency — agorot for Tel Aviv, like the price);
  `store.payDividends` credits `qty × amount × rate` to the purse for each one whose ex-date
  falls after the holding's `since`, recording a trade of side `dividend` keyed by symbol and
  date so a quote fetched twice pays once. `CoinFlight` arcs coins from the company to the
  treasury and a toast says who paid. Every holding carries `since` (set by `clean` at buy or
  import), which is also what "held for a month" and the held-days XP are measured from.
- **Privacy is three settings and the link is the only thing that travels.** `state.privacy`:
  `private` (no link), `city` (the default: holdings as *weights* of a notional $100,000, no
  cost, no cash amount — the visitor's HUD shows •••), `public` (as is). The link also carries
  the city's name, level and badge count; `stocks/friends.js` keeps the links friends sent as
  the neighbours, the Friends tab lists them and the Rankings tab sorts me and them by level,
  then badges, never by returns. Visiting is opening the link; `visitedMeta` is what it said.
- **An account is an email and a password for this game, and nothing else.** Supabase Auth on
  the `pr-ai-eu` project (never `pr-ai`), reached without an SDK: `lib/auth.js` speaks GoTrue's
  REST (sign up, password sign-in, refresh a minute before expiry, logout, recover, and the
  tokens a confirmation or recovery email lands with in the URL hash), keeps the session in
  localStorage and hands it to React through `useSession`. `stocks/cloud.js` speaks PostgREST
  with the player's own token, so the database's row-level rules are the boundary: `sc_cities`
  (the whole state and progress, owner only), `sc_profiles` (name, level, badges, privacy and the
  packed city a share link would carry — readable by the owner and by whoever added them;
  a trigger blanks the city of a private profile whatever the client sent), `sc_friends`
  (added by the six-letter code every profile gets from a trigger on sign-up; `sc_add_friend`
  is the only RPC and the only way to look a code up). `stocks/useCloud.js` is the sync: the
  first look on a device sends the city up when the account is empty, brings it down when the
  device is, takes the newer side when this device synced before, and *asks* when both have a
  city and never synced here (`CloudConflictSheet`); after that every change goes up 1.5 s
  later. "Last synced here" is kept per account, so a second account on the same phone is
  asked, not overwritten. Signing out leaves the city on the device. The project's email
  confirmation is on and its built-in mailer is rate-limited (a few an hour): the sheet says
  "check your email" when sign-up returns no session, and a real launch wants the project's own
  SMTP or confirmation off. Friends from the account and friends from links sit in one list;
  a friend without a city yet says so rather than showing as private. The browser test
  (`account.mjs`) signs in as two throwaway users created by SQL with a confirmed email, and
  relays the Supabase calls through Node because the headless browser cannot verify the
  session proxy's certificate; it seeds localStorage only *after* the app has mounted, because
  the app's first save otherwise overwrites the seed with an empty city.
- **A district can be entered.** A tap on a district's name pill (`SectorDistrict`, `tapHandlers`
  like a building) or the "לשכונה" chip on a row of the portfolio's allocation frames the
  neighbourhood (`focus.frame`: the zoom that fits its span on the shorter side of the screen,
  so a phone zooms *out* a little to show the whole district and a desktop zooms in) and opens
  `DistrictSheet`: the district's dollar value, its share of the city, today's move, the gain
  since its buildings were bought, a three-month line and the buildings by weight. The
  arithmetic is `stocks/districts.js`, read from the same priced positions as the HUD; the
  line is each position's closes × quantity × dollar rate summed, a position with no series
  held flat at today's value. One sentence says what the neighbourhood is doing (over 40% of
  the city → the concentration lesson; else who moved it today; else a quiet day). A row
  opens the building's card; "back to the whole city" is `goHome`. The sheet is the
  building card's shell, capped at 64vh on a phone so the district stays in view above it.
- **The market screen is a glance, not a terminal:** open/closed, four index tiles, the
  portfolio's three biggest movers today, the watchlist (a star on any row; `state.watchlist`,
  no building until bought), then the board. **Daily tasks** (`learn/daily.js`): two a day by
  the date, each one thing to look at or read, 30 XP once; never a trade.
- **XP is for behaviour.** `xpFor(progress, { holdings, trades, positions, totalUsd })`: besides
  missions, lessons, badges and streak days, it pays per company, per sector, per day a position
  has been held (capped), a spread bonus (five holdings, none over 40%) and a calm bonus (three
  days in, no more than a trade a day on average). Badges unlock decor: a statue for five
  sectors, a clock tower for a month held, flags for a portfolio built, more flower beds for
  diversified, a gold fountain for the first dividend. Levels have titles (`LEVEL_TITLES`:
  new investor → portfolio builder → market explorer → city investor → capital architect) and
  the first real connection pays `XP_FOR.connect` once (`progress.connected`).
- **The health score is an explanation.** `stocks/health.js`: securities (40), sectors (30),
  the largest holding's weight (30), with one sentence that says why; the chip under the HUD
  opens the sheet. It never says buy or sell.
- **Tiers, not scaling, by share.** A building's height comes from `BUILDING_TIERS` by the
  position's share of the *whole* portfolio, cash included (`shareOf(valueUsd, totalUsd)`): a
  40% position is the building you see first, one $5,000 stock in a $100,000 purse is a shop.
  A position that grows steps up a class and visibly changes model. Never scale a model by value
  — a FarmVille city reads by classes. The HQ's level is `HQ_LEVELS` by `totalUsd`.
- **The cash is a building.** `city/Treasury` stands beside the plaza, gold-tinted, with a coin
  turning on its roof and a pill that says "cash · 95%"; its tier is the cash's share by the same
  table, so the whole composition is on the board — what is invested and what is not. Tapping it
  opens the portfolio.
- **Progress is XP, never returns.** `stocks/xp.js`: tables, never returns; `LEVEL_XP` sets the
  levels. The HUD is one white card: city value, today's move as a chip and in dollars, the
  return since the game began (`totalUsd` against `STARTING_CASH`), cash, the level with its bar,
  and the market's state as a dot. The decor budget (beds, benches, lamps) grows with the level.
  A friend's city compares on XP, not on money.
- **The city teaches by noticing.** `stocks/insights.js` reads the finished numbers — a sector
  that is 60%+ of the city, one company carrying everything, cash 30%+ of the purse — and
  `ui/game/InsightCard` shows one small card over the city with a concept and a lesson link,
  dismissed for the day. It never says buy or sell.
- A tap on a building opens its sheet; a second tap within 350 ms flies to it (`lookAt`); a tap
  on empty ground (`onPointerMissed` on the Canvas) closes the sheet. A new building rises under a
  turning crane that goes when it has stood up.
- **The camera is a board-game camera.** Orthographic, pitch 40°, yaw 45°, never rotates. Zoom is
  `camera.zoom` (pixels per world unit). `focus.js` carries fly-to (`lookAt`), `zoomBy` and
  `goHome` (the ⌖ button: the middle at the starting zoom); a hand on the city cancels a flight.
- **The finger owns the camera.** `groundVec` in `CityCamera` is the one place screen pixels become
  ground: screen right is ground (x − z), screen down is (x + z) foreshortened by sin(pitch),
  because the camera sits on the +x+z side. Its signs were once rotated and a finger dragged right
  moved the city *up* — the user called it "really, really uncomfortable" and was right. While a
  finger is down the camera is 1:1 (no easing); on lift a flick keeps its momentum (velocity from
  event timestamps, never frame time — a slow frame must not read as a pause) and dies away or
  stops at the clamp; pinch and wheel zoom about the fingers (`zoomAt`) and two fingers also pan.
  The clamp lets the board's tip travel to a third of the way in from the screen edge on either
  axis — the old one pinned a phone's vertical drags and felt stuck. `dragfeel.mjs` checks the
  direction, 1:1, home and the pinch anchor; momentum needs a real phone (the software-GL box
  delivers a touch event every 650 ms).
- **The day's move is never a painted building.** A glow disc at the foot (opacity by pulse,
  only past ±0.3%), a small cone over the roof, and the ticker with the percentage on a small
  dark pill over the roof (`tickerBadge`), always on — the user's reference had one on every
  building, and it is what makes the city read as "these are my stocks" in two seconds. It is a
  sprite with `depthTest` off, 2.3 world units wide, a fifth larger under the hand. Red buildings
  read as cheap; the user said so.
- The ticket (`TradeSheet`) is portalled to `document.body`: the market screen is `position:
  fixed`, which is a stacking context of its own, so a ticket drawn inside it sat under the bottom
  bar whatever z-index it was given.
- The city canvas stays mounted while another tab is open (`invisible`, not unmounted):
  switching tabs must not rebuild the scene and reload every model.
- `api/*` validates every symbol against a pattern before passing it upstream. Symbols arrive from
  links, pasted text and typing; the proxy must not become a way to make the server fetch anything.
- The upstream is unofficial and delayed. The UI says so, from the endpoint's own `delayed` flag —
  do not quietly present it as real-time, and do not present any of it as advice.
- **Yesterday's close is the last bar before today's session**, found in the series by timestamp
  (`api/quotes.js`). The chart endpoint's `chartPreviousClose` is the close before the *range*
  began — three months back — and reading it as yesterday gave every roof a quarter's move: Apple
  was "+12% today" on a day it fell 0.8%. The day move drives the roof glow, the HUD, the 🔥 badge
  and the lessons, so it is the one number the whole city shows at once.
- **The news is two keyless feeds, by what each is good at.** `api/news.js` asks Yahoo Finance's
  RSS per ticker (English, knows every symbol the quotes do, Tel Aviv included) and Google News'
  RSS search for a company's Hebrew name and for the market (Hebrew, the papers people here read),
  caches ten minutes, dedupes by title. A Hebrew name goes in quotes with "מניה" after it: "טבע"
  alone is nature. `stocks/news.js` pulls once per set of holdings and every ten minutes;
  `CityContext` publishes `news`; the board (`city/NewsBoard`, a screen on two posts centre
  stage behind the HQ — up the screen is −x−z — textures from `newsTexture` tagged "portfolio
  news · name" or "market news", cycled from the frame clock) and the news sheet
  (`ui/game/NewsSheet`, with links out) read it. The feeds are unofficial, like the quotes.
- **A real portfolio comes in by file, by its column names.** No broker has an API a browser
  can call, so `stocks/broker.js` reads the broker's export: `raw file → parser (a table found
  by its header row, every column by name in Hebrew or English) → normaliser (one
  PortfolioPosition shape) → validation (warnings, never guesses) → holdings`. Meitav Trade's
  export is the first file it was written for: "שם נייר, מספר נייר, כמות, שער, שווי, שער
  ממוצע…" — and Meitav puts a foreign ticker in the security-number column, so letters there
  are a symbol and digits a Tel Aviv id. Cash rows (מזומן) set the purse, converted to dollars;
  total rows (סה״כ) are skipped; a security whose name starts with a column word is still a
  security (only a row with no numbers is a repeated header). Positions match by symbol only,
  never by name. A file with no header row falls back to the forgiving line reader in
  `importer.js`, which is what pasted and photographed tables go through. The real `data.xlsx`
  the user meant to attach never arrived; the parser is written to names, not positions, so a
  column it does not know is a warning on the preview and not a wrong number. **The real
  file arrived on day two** and taught the parser Meitav's actual layout: one sheet, header on
  row 1 — "שם נייר, מספר נייר, סימבול, המלצות, סוג נייר, מטבע, כמות נוכחית, שער, % שינוי, שווי
  נוכחי, רווח/הפסד יומי, שינוי מעלות (ב%, במטבע מקור), עלות, מחיר ממוצע, מחיר ממוצע במטבע
  מקור, אחוז אחזקה". The truths that matter: `שווי`, `עלות` and the plain `מחיר ממוצע` are in
  **shekels** for every row (the account's reporting currency), `מחיר ממוצע במטבע מקור` is in
  the security's own currency and major units — that is the cost basis, and it says its unit,
  so no agorot guessing for it (`costInAgorot: false`; InterCure down 78% fooled the live-price
  heuristic); `שער` is dollars for a foreign row and agorot for a Tel Aviv one; `סוג נייר` says
  which ("מניה זרה בחו״ל", "מניה ישראלית בחו״ל", "מניות בש״ח", "קרנות נאמנות זרות") and so does
  the currency; `סימבול` is the ticker for a foreign row and a Hebrew short name ("אנלט") for a
  Tel Aviv one, so only a Latin symbol is a symbol; `מספר נייר` is Meitav's own number for
  foreign rows and the TASE id for Israeli ones; the cash row is typed "מט״ח מזומן", named by
  its currency ("דולר ארה״ב") with the amount in `כמות`; "תפ״ס/פח״ק" (a tax shield) is not a
  security. **A dollar-priced TEVA or ESLT is the New York listing**, not TEVA.TA: the row's
  currency decides, and the Tel Aviv entry only lends its name and sector. **The file's own
  symbol beats a name match**: GOOG and GOOGL are both "Alphabet Inc". A broker export
  is often several sections (shares, foreign, funds), each under its own header row with its own
  columns: the *first* header row starts the table and every later header row re-maps the
  columns; a row with a name and no number at all is a section title, not a security; an
  "Excel" that is really an HTML table (the common Israeli export) is read as text.
  **Yahoo's search knows no Hebrew and no TASE security numbers** (tested: "בנק הפועלים",
  "טבע", "662577" all return nothing), so a Meitav row can only be resolved against a list we
  carry: `stocks/tase.js`, the TA-125 and what Israeli portfolios hold, each with its Yahoo
  symbol (every one checked against the quote proxy), the Hebrew names brokers print and the
  security number where known (a *second* key, used when the name fails). Names match by whole
  words from the start, never by substring — a substring match turned "אפלייד" into Apple. The
  preview shows the resolved company and, when it differs, the file's own name, the live price
  and the cost, so a wrong match is seen. **Agorot are decided per row from the live price**
  (`agorotFor`: a cost within 4× of the price after ÷100 is agorot, as it is is shekels, neither
  leaves the toggle to decide and flags the cost) — a global checkbox got Meitav's shekel-priced
  screens wrong.
  `ui/game/ImportFlow` is the whole journey on one screen: connect (Meitav, Excel/CSV,
  screenshot, manual, demo, paste) → reading phases → preview (value, day, assets, cash, a card
  per row with edit/remove and its warnings, agorot toggle, and **what changes in the city** —
  `diffHoldings` by symbol: added, grown, shrunk, demolished) → build. A reimport keeps each
  holding's `since` (`store.importHoldings(rows, previous)`), so dividends and held-days survive.
  An imported or demo portfolio completes its missions quietly (`quiet` in the mission effect)
  and only the welcome lesson fires: five sheets in a row on a city just built is noise.
  **Three doors in, the phone's first:** a screenshot of the broker's app, read on the phone by
  Tesseract (`stocks/ocr.js`, `heb+eng`, the default page layout — the block modes glued columns
  together, and Hebrew alone misread the digits that matter most; loaded only when a picture is
  given, nothing uploaded); an Excel export read by SheetJS (lazy too); or paste/type. A
  screenshot read right-to-left puts the name last and the columns reversed, so the parser
  reverses the numbers when every number precedes the name. OCR drops a decimal point now and
  then, so the sheet asks for a live price per row and flags a cost more than three times off it
  ("check the cost") — flagged, never silently fixed.
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
- **Icons are Lucide, motion is Motion.** `lucide-react` for every icon in the chrome (nav, HUD
  trend, zoom, close, buy/sell, badges, learn, build); emoji stay only where they are content —
  a lesson's or a badge's own emoji. `motion/react` for the nav's sliding pill (`layoutId`), the
  building sheet's spring, the toast, and `NumberTicker` (the HUD total rolls to a new value; the
  first value shows at once so a reload never counts up from zero). Nothing in the 3D scene
  uses either: the city animates from refs in `useFrame`, as before.
- **Ambient occlusion is most of the difference between a rendered model and a drawn one.** The
  canvas ends with an `EffectComposer` running `N8AO` at half resolution and `SMAA`, and the sun
  casts soft shadows from a 4096 map. That stack is `@react-three/postprocessing@2` — the 3.x line
  is for fiber 9, and this app is on fiber 8. Keep AO cheap (`halfRes`, `quality="performance"`):
  the test is a phone at sixty frames, not a desktop screenshot.
- **The city is lit as a model on a table, so its chrome is white cards.** Floating controls over
  the city share one recipe: same size, same radius, `bg-white/95` + blur (92 is not on Tailwind's opacity scale: the class is dropped and the card goes clear) + `border-paper-200` +
  `shadow-card`, with `text-ink-900`. The orange FAB is the only exception, because it is the one
  call to action. The dark `bg-ink-800/85` + `shadow-chip` recipe still belongs to the estate-agent
  pages, which are dark — do not carry either one across.
- **The city fills the screen, whatever the screen.** Past the board's pale kerb the ground is
  the same lawn a shade deeper, with fields and ~260 trees densest at the kerb (`CityGrid`
  `FIELDS`, `Decor` `country`), out past anything the camera can reach. It was sea for a day and
  the user read the sea as empty: "the city on the whole screen". The phone starts at 2.8× the
  fitted zoom and desktop at 1.3×, so the board reaches the edges rather than floating in the
  middle; the page behind the canvas is the country's colour so nothing flashes.
- **The camera never moves by itself.** A new building rises where it stands under its crane; the
  camera does not fly to it — the user asked twice for a city that does not move. `focus.js`
  `lookAt` is still there for a tap on a portfolio row, nothing else calls it.
- District names are small dark pills floating over each district's lane (`SectorDistrict`,
  `districtLabel`), only for districts with a building. Flat on the pavement they could not be
  read at the board-game pitch.
- `world3d/playerPos.js` publishes the camera's point of attention outside React, for whatever
  wants to know where you are looking without re-rendering while you drag (the tests read it).
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
