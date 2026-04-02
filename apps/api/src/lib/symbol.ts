/** Spot symbols ending in USDT (extend for other quotes). */
export function parseSymbol(symbol: string): { base: string; quote: string } {
  const s = symbol.toUpperCase();
  if (s.endsWith("USDT")) {
    return { base: s.slice(0, -4), quote: "USDT" };
  }
  throw new Error(`Unsupported symbol quote: ${symbol}`);
}
