// Seeded linear-congruential generator: a given seed always rebuilds the exact
// same board, deck or question set.
export function lcg(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const randomSeed = () => Math.floor(Math.random() * 1e9);

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const r2 = (n) => Math.round(n * 100) / 100;
