import { NextResponse } from "next/server";
import { fetchIranRatesFromEnv } from "@/lib/iranRatesJson";

/** Cache aggregated rates briefly at the edge. */
export const revalidate = 30;

const fetchOpts = { next: { revalidate: 30 } as const };

const BINANCE = "https://api.binance.com";
const FRANKFURTER = "https://api.frankfurter.app/latest";
const NOBITEX = "https://api.nobitex.ir/v2/orderbook/USDTIRT";

/** ~toman per 1 USDT when Nobitex is unreachable (override with FALLBACK_TOMAN_PER_USDT). */
const DEFAULT_TOMAN_FALLBACK = 52000;

const CRYPTO_PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "TRXUSDT",
  "AVAXUSDT",
  "DOTUSDT",
  "LINKUSDT",
  "MATICUSDT",
  "LTCUSDT",
  "UNIUSDT",
  "ATOMUSDT",
  "FILUSDT",
  "ETCUSDT",
  "XLMUSDT",
  "TONUSDT",
  "NEARUSDT",
  "APTUSDT",
] as const;

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : null;
}

async function fetchTomanPerUsdt(): Promise<{ tomanPerUsdt: number; note: string } | null> {
  try {
    const res = await fetch(NOBITEX, fetchOpts);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      bids?: [string, string][];
      asks?: [string, string][];
    };
    const bid = j.bids?.[0]?.[0];
    const ask = j.asks?.[0]?.[0];
    const b = num(bid);
    const a = num(ask);
    if (b === null || a === null) return null;
    const midRial = (b + a) / 2;
    // Nobitex USDTIRT is quoted in Iranian rials per 1 USDT; 1 toman = 10 rials.
    const tomanPerUsdt = midRial / 10;
    if (!Number.isFinite(tomanPerUsdt) || tomanPerUsdt < 1000) return null;
    return { tomanPerUsdt, note: "nobitex-usdtirt-mid-rial-to-toman" };
  } catch {
    return null;
  }
}

async function fetchFrankfurterUsdTargets(): Promise<Partial<Record<string, number>>> {
  const out: Partial<Record<string, number>> = {};
  try {
    const u = new URL(FRANKFURTER);
    u.searchParams.set("from", "USD");
    u.searchParams.set("to", "GBP,GEL,AED,EUR");
    const res = await fetch(u.toString(), fetchOpts);
    if (!res.ok) return out;
    const j = (await res.json()) as { rates?: Record<string, number> };
    const rates = j.rates ?? {};
    for (const [code, v] of Object.entries(rates)) {
      if (typeof v === "number" && v > 0) {
        // 1 USD = v units of `code` → 1 unit of `code` = 1/v USD
        out[code] = 1 / v;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

async function fetchBinanceUsdPerCrypto(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  try {
    const sym = JSON.stringify([...CRYPTO_PAIRS]);
    const url = `${BINANCE}/api/v3/ticker/price?symbols=${encodeURIComponent(sym)}`;
    const res = await fetch(url, fetchOpts);
    if (!res.ok) return out;
    const rows = (await res.json()) as { symbol: string; price: string }[];
    for (const row of rows) {
      const p = num(row.price);
      if (p === null) continue;
      if (row.symbol.endsWith("USDT")) {
        const base = row.symbol.slice(0, -4);
        out[base] = p;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function GET() {
  const fallbackToman = Number.parseFloat(process.env.FALLBACK_TOMAN_PER_USDT ?? "") || DEFAULT_TOMAN_FALLBACK;
  const iranDisplayOnly =
    process.env.IRAN_RATES_DISPLAY_ONLY === "1" || process.env.IRAN_RATES_DISPLAY_ONLY?.toLowerCase() === "true";

  const [nobitex, iranJson, fx, crypto] = await Promise.all([
    fetchTomanPerUsdt(),
    fetchIranRatesFromEnv(),
    fetchFrankfurterUsdTargets(),
    fetchBinanceUsdPerCrypto(),
  ]);

  const irtFromIran = iranJson && !iranDisplayOnly;
  const irtMeta = irtFromIran
    ? { source: "iran-json" as const, tomanPerUsdt: iranJson.tomanPerUsdt }
    : nobitex
      ? { source: "nobitex" as const, tomanPerUsdt: nobitex.tomanPerUsdt }
      : { source: "fallback" as const, tomanPerUsdt: fallbackToman };

  const iranOpenMarket = iranJson
    ? {
        label: iranJson.sourceLabel,
        updatedAt: iranJson.updatedAt,
        rows: iranJson.rows,
      }
    : undefined;

  /** USD value of 1 unit of asset (1 IRT = 1 toman here). */
  const usdPerUnit: Record<string, number> = {
    USD: 1,
    USDT: 1,
    IRT: 1 / irtMeta.tomanPerUsdt,
  };

  for (const code of Object.keys(fx)) {
    const u = fx[code];
    if (typeof u === "number" && Number.isFinite(u) && u > 0) usdPerUnit[code] = u;
  }

  for (const base of Object.keys(crypto)) {
    const u = crypto[base];
    if (typeof u === "number" && Number.isFinite(u) && u > 0) usdPerUnit[base] = u;
  }

  const fiatCodes = ["IRT", "USD", "USDT", "GBP", "GEL", "AED", "EUR"].filter((c) => usdPerUnit[c] != null);
  const cryptoCodes = CRYPTO_PAIRS.map((p) => p.replace("USDT", "")).filter(
    (b) => usdPerUnit[b] != null && !fiatCodes.includes(b),
  );

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    usdPerUnit,
    fiatCodes,
    cryptoCodes,
    sources: {
      irt: irtMeta.source,
      fx: Object.keys(fx).length ? "frankfurter-ecb" : "unavailable",
      crypto: Object.keys(crypto).length ? "binance-usdt" : "unavailable",
    },
    iranOpenMarket: iranOpenMarket ?? undefined,
    note:
      "Reference rates only. IRT uses IRAN_RATES_JSON_URL when configured (see .env.example), else Nobitex USDT/IRT (rial→toman ÷10) or a fallback; fiat crosses via Frankfurter (ECB); crypto via Binance USDT last. Not for settlement or tax.",
  });
}
