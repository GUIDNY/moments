import { lcg, r2 } from './rng';

export const DAY = 86400;
export const T0 = 1704067200; // 2024-01-01, keeps every chart on a stable timeline

/** A run of candles drifting by `bias` each step with `vol` of noise. */
export function genTrend(startTime, startPrice, count, bias, vol, seed) {
  const rng = lcg(seed);
  const out = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = bias + (rng() - 0.5) * vol;
    const open = r2(price);
    const close = r2(price + change);
    out.push({
      time: startTime + i * DAY,
      open,
      high: r2(Math.max(open, close) + rng() * vol * 0.35),
      low: r2(Math.min(open, close) - rng() * vol * 0.35),
      close,
    });
    price = close;
  }
  return { candles: out, price, next: startTime + count * DAY };
}

/** One hand-shaped candle — used to plant a textbook pattern at the end of a trend. */
export function mk(time, open, close, wickUp, wickDown) {
  return {
    time,
    open: r2(open),
    high: r2(Math.max(open, close) + wickUp),
    low: r2(Math.min(open, close) - wickDown),
    close: r2(close),
  };
}

/** Random walk used by the trading floor — returns plain closing prices. */
export function genPriceSeries(count, startPrice, seed, { drift = 0, vol = 1.6 } = {}) {
  const rng = lcg(seed);
  const out = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    price = Math.max(1, price + drift + (rng() - 0.5) * vol * price * 0.02);
    out.push(r2(price));
  }
  return out;
}

export const body = (c) => Math.abs(c.close - c.open);
export const isGreen = (c) => c.close >= c.open;
