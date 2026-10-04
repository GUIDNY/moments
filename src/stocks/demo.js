import { BOARD_BY_SYMBOL } from './catalog';

/**
 * A sample portfolio for someone who wants to see the city before giving it
 * anything: a dozen companies across eight sectors plus an index fund, in
 * both markets, weighted the way a real, reasonably spread portfolio is —
 * one large position, a few medium ones, a tail. Quantities only: the cost
 * is the live price on the day the demo is built, so the demo is "bought
 * today" and never pretends to a history it does not have.
 */
export const DEMO = [
  { symbol: 'AAPL', qty: 45 },
  { symbol: 'MSFT', qty: 18 },
  { symbol: 'NVDA', qty: 30 },
  { symbol: 'POLI.TA', qty: 120 },
  { symbol: 'JPM', qty: 20 },
  { symbol: 'TEVA.TA', qty: 60 },
  { symbol: 'XOM', qty: 25 },
  { symbol: 'COST', qty: 4 },
  { symbol: 'ESLT.TA', qty: 2 },
  { symbol: 'AZRG.TA', qty: 12 },
  { symbol: 'GOOGL', qty: 15 },
  { symbol: 'SPY', qty: 8 },
];

/** The demo as import rows, costed at the quotes given (major units). */
export function demoHoldings(priceOf) {
  return DEMO.map((d) => {
    const b = BOARD_BY_SYMBOL[d.symbol];
    const price = priceOf?.(d.symbol) ?? null;
    return { symbol: d.symbol, qty: d.qty, cost: price, sector: b?.sector ?? 'tech', name: b?.name ?? null };
  });
}

export const DEMO_CASH_USD = 12000;
