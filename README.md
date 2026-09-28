# 🎮 Playtown

A small 3D town made of mini-games. Walk your character down the street, step into a
lit doorway, play — and every game pays coins into one shared wallet.

No account, no backend, no install. It runs in a browser tab and saves to `localStorage`.

**English and Hebrew**, switchable in-game (the page direction flips with it).

## The ten games

| District | Game | What you do | Pays |
| --- | --- | --- | --- |
| Puzzle Park | 🃏 Pair Up | Match every pair in as few moves as you can | up to 300 |
| Puzzle Park | 🎵 Echo | Repeat the sequence — it grows every round | 45 per step |
| Puzzle Park | 👁️ Odd One Out | Find the tile that is a shade off | 34 per round |
| Puzzle Park | 🧮 Quick Maths | Eight sums, ten seconds each | up to 220 |
| Speed Alley | ⚡ Reaction | Wait for green, then tap | up to 340 |
| Speed Alley | 🔢 Number Rush | Tap 1 to 16 in order against the clock | up to 320 |
| Speed Alley | 🧺 Catch | Slide the basket, catch fruit, dodge bombs | 20 per point |
| Speed Alley | 🐹 Mole Mayhem | Tap the critters, spare the bombs | 22 per point |
| Town Square | 🎯 Bullseye | Stop the pulsing ring exactly on the outline | up to 360 |
| Funfair | 🎡 Lucky Stop | Stop the marker on the narrow, rich slice | up to 1,800 |

Plus 🏦 **the Bank** (daily streak bonus, earnings report), 🛍️ **the Shop** (characters and
lucky charms that raise every payout) and 🏠 **Your Place** (level, achievements, language).

## Controls

- 🕹️ Drag the on-screen joystick, or use the arrow keys / `WASD`
- 🚪 Walk into a lit doorway to go inside — the character lines itself up with the opening
- 🗺️ The town guide lists every game and lets you jump straight in

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview  # http://localhost:4173
npm run lint
```

## How it is built

```
src/
├── engine/     # seeded RNG, coins/XP/levels, localStorage, the store, shared hooks
├── i18n/       # the string table and the language provider
├── data/       # shop items, achievements
├── world/      # town data: tile grid, buildings, doorways, props — plus HUD and guide
├── world3d/    # the 3D layer: scene, voxel characters, camera, joystick, canvas textures
├── games/      # one file per mini-game, plus the registry
├── screens/    # bank, shop, profile
└── ui/         # buttons, modal, toasts, game shell, result screen
```

Worth knowing:

- **The town is three.js** (through react-three-fiber). The ground is a single texture painted
  from the tile grid, buildings are boxes, and characters are built from boxes with a walk cycle.
- **Nothing that moves every frame touches React state.** Position, facing, the walk cycle and the
  camera all run through refs inside the render loop, so walking never re-renders the app.
- **Every game pays through one formula** (`payout` in `engine/economy.js`), so the economy stays
  balanced and the worn charm multiplies at the end.
- **Every label in the 3D scene is a canvas texture**, which keeps Hebrew crisp without a font loader.

To add a game: write a component taking `{ meta, onExit }` that calls `finishGame`, register it in
`src/games/registry.js`, add a building in `src/world/map-data.js` whose `target` is the game id,
and bump `TOTAL_GAMES` in `src/engine/constants.js`.
