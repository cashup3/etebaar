/** Base asset from a spot pair (e.g. BTCUSDT → BTC). */
export function pairBaseAsset(pair: string): string {
  const p = pair.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (p.endsWith("USDT")) return p.slice(0, -4);
  if (p.endsWith("BUSD")) return p.slice(0, -4);
  if (p.endsWith("USDC")) return p.slice(0, -4);
  return p;
}

/**
 * Slug for cryptocurrency-icons (jsDelivr): svg/color/{slug}.svg
 * @see https://github.com/spothq/cryptocurrency-icons
 */
export function cryptoIconSlug(base: string): string {
  let b = base.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (b.startsWith("1000") && b.length > 4) b = b.slice(4);
  const aliases: Record<string, string> = {
    IOTA: "miota",
    BTT: "btt",
    SHIB: "shib",
    PEPE: "pepe",
    LUNC: "luna",
    USTC: "ust",
    RNDR: "rndr",
    /** Package predates POL rebrand */
    POL: "matic",
    MATIC: "matic",
  };
  return (aliases[b] ?? b).toLowerCase();
}

/** Same-origin proxy so icons work when jsdelivr/unpkg are blocked in the browser. */
export function cryptoIconUrl(base: string): string {
  const slug = cryptoIconSlug(base);
  return `/api/crypto-icon/${encodeURIComponent(slug)}`;
}
