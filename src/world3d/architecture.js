/**
 * What a sector's buildings are made of.
 *
 * A city of identical boxes tells you nothing: you have to read the sign over
 * every door to know whether you are standing among the banks or the chip
 * makers. So each district gets its own architecture — stone and columns for
 * the banks, curtain glass and a mast for technology, a chimney for energy, a
 * radar for defence, a cross for health — and the district becomes something
 * you recognise from across the street, in silhouette, before any text.
 *
 * Only the *materials* live here. Height and the up/down colour still come
 * from `stocks/towers.js`, because those are the price and they change every
 * minute; this is the part of a building that never moves.
 */

/**
 * `style` picks the window pattern painted by `facadeTexture`, `crown` picks
 * the roofwork drawn by `Crown` in `Scenery.jsx`, and `storey` is how much
 * world height one repeat of the facade covers — a bank's floors are taller
 * than a factory's, which is most of why the two read differently at a glance.
 */
export const ARCHETYPES = {
  tech: {
    wall: '#eceff2',
    glass: '#79b2c6',
    trim: '#d7e0e5',
    style: 'glass',
    crown: 'mast',
    storey: 1.45,
    podium: '#e2e8ec',
    columns: false,
  },
  banks: {
    wall: '#f4ebd8',
    glass: '#b9a877',
    trim: '#e8dcbd',
    style: 'stone',
    crown: 'pediment',
    storey: 1.95,
    podium: '#efe3c9',
    columns: true,
  },
  defence: {
    wall: '#dde2de',
    glass: '#6f7d75',
    trim: '#c9d1cb',
    style: 'industrial',
    crown: 'radar',
    storey: 1.25,
    podium: '#d2d9d3',
    columns: false,
  },
  health: {
    wall: '#f7f3f3',
    glass: '#93c3bb',
    trim: '#e7edeb',
    style: 'clinic',
    crown: 'cross',
    storey: 1.5,
    podium: '#edf3f1',
    columns: false,
  },
  energy: {
    wall: '#f0e7db',
    glass: '#879099',
    trim: '#e1d5c5',
    style: 'industrial',
    crown: 'stack',
    storey: 1.35,
    podium: '#e7dbc9',
    columns: false,
  },
  other: {
    wall: '#f1eff2',
    glass: '#949ac0',
    trim: '#e2e0e9',
    style: 'window',
    crown: 'deck',
    storey: 1.6,
    podium: '#e8e6ec',
    columns: false,
  },
};

/** Anything the picker could not place still has to be built out of something. */
export const archetypeFor = (district) => ARCHETYPES[district] ?? ARCHETYPES.other;
