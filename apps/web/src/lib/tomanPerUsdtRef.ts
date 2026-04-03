import { fetchIranRatesFromEnv, type NormalizedIranRates } from "@/lib/iranRatesJson";

const fetchOpts = { next: { revalidate: 30 } as const };

const NOBITEX_ORDERBOOK_URLS = [
  "https://api.nobitex.ir/v2/orderbook/USDTIRT",
  "https://api.nobitex.net/v2/orderbook/USDTIRT",
] as const;

const WALLEX_USDT_DEPTH = "https://api.wallex.ir/v1/depth?symbol=USDTTMN";

export const DEFAULT_TOMAN_FALLBACK = 105000;

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : null;
}

function parseNobitexOrderbookToman(j: Record<string, unknown>): number | null {
  const bids = j.bids as [string, string][] | undefined;
  const asks = j.asks as [string, string][] | undefined;
  const b = num(bids?.[0]?.[0]);
  const a = num(asks?.[0]?.[0]);
  if (b !== null && a !== null && b > 0 && a > 0) {
    const midRial = (b + a) / 2;
    const tomanPerUsdt = midRial / 10;
    if (Number.isFinite(tomanPerUsdt) && tomanPerUsdt > 5000) return tomanPerUsdt;
  }
  const last = num(String(j.lastTradePrice ?? j.lastTrade ?? ""));
  if (last !== null && last > 20_000) {
    const tomanPerUsdt = last / 10;
    if (Number.isFinite(tomanPerUsdt) && tomanPerUsdt > 5000) return tomanPerUsdt;
  }
  return null;
}

export async function fetchTomanPerUsdtNobitex(): Promise<number | null> {
  for (const url of NOBITEX_ORDERBOOK_URLS) {
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        headers: { Accept: "application/json", "User-Agent": "EtebaarConvert/1.0" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const j = (await res.json()) as Record<string, unknown>;
      const t = parseNobitexOrderbookToman(j);
      if (t !== null) return t;
    } catch {
      /* try next host */
    }
  }
  return null;
}

export async function fetchTomanPerUsdtWallex(): Promise<number | null> {
  try {
    const res = await fetch(WALLEX_USDT_DEPTH, {
      ...fetchOpts,
      headers: { Accept: "application/json", "User-Agent": "EtebaarConvert/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      result?: { bid?: { price: number }[]; ask?: { price: number }[] };
    };
    const bid = j.result?.bid?.[0]?.price;
    const ask = j.result?.ask?.[0]?.price;
    if (typeof bid !== "number" || typeof ask !== "number") return null;
    const mid = (bid + ask) / 2;
    if (!Number.isFinite(mid) || mid < 10_000) return null;
    return mid;
  } catch {
    return null;
  }
}

export type TomanPerUsdtSource = "iran-json" | "nobitex" | "wallex" | "fallback";

export function mergeTomanPerUsdtMeta(
  iranJson: NormalizedIranRates | null,
  iranDisplayOnly: boolean,
  nobitexToman: number | null,
  wallexToman: number | null,
  fallbackToman: number,
): { source: TomanPerUsdtSource; tomanPerUsdt: number } {
  const irtFromIran = iranJson && !iranDisplayOnly;
  if (irtFromIran) {
    return { source: "iran-json", tomanPerUsdt: iranJson.tomanPerUsdt };
  }
  if (nobitexToman !== null) {
    return { source: "nobitex", tomanPerUsdt: nobitexToman };
  }
  if (wallexToman !== null) {
    return { source: "wallex", tomanPerUsdt: wallexToman };
  }
  return { source: "fallback", tomanPerUsdt: fallbackToman };
}

/** Same IRT/USDT reference as /api/convert/rates (Nobitex → Wallex → env fallback; optional IRAN_RATES_JSON_URL). */
export async function getIranAndTomanMeta(): Promise<{
  irtMeta: { source: TomanPerUsdtSource; tomanPerUsdt: number };
  iranJson: NormalizedIranRates | null;
}> {
  const fallbackToman =
    Number.parseFloat(process.env.FALLBACK_TOMAN_PER_USDT ?? "") || DEFAULT_TOMAN_FALLBACK;
  const iranDisplayOnly =
    process.env.IRAN_RATES_DISPLAY_ONLY === "1" ||
    process.env.IRAN_RATES_DISPLAY_ONLY?.toLowerCase() === "true";

  const [nobitexToman, wallexToman, iranJson] = await Promise.all([
    fetchTomanPerUsdtNobitex(),
    fetchTomanPerUsdtWallex(),
    fetchIranRatesFromEnv(),
  ]);

  const irtMeta = mergeTomanPerUsdtMeta(
    iranJson,
    iranDisplayOnly,
    nobitexToman,
    wallexToman,
    fallbackToman,
  );

  return { irtMeta, iranJson };
}

export function irtFromUsdtPrice(usdtStr: string, tomanPerUsdt: number): number | null {
  const p = Number.parseFloat(usdtStr);
  if (!Number.isFinite(p) || p < 0 || !Number.isFinite(tomanPerUsdt) || tomanPerUsdt <= 0) return null;
  return Math.round(p * tomanPerUsdt);
}
