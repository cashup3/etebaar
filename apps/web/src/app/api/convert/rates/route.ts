import { NextResponse } from "next/server";
import { fetchIranRatesFromEnv } from "@/lib/iranRatesJson";

/** Cache aggregated rates briefly at the edge. */
export const revalidate = 30;

const fetchOpts = { next: { revalidate: 30 } as const };

const BINANCE = "https://api.binance.com";
const FRANKFURTER = "https://api.frankfurter.app/latest";
const NOBITEX_ORDERBOOK_URLS = [
  "https://api.nobitex.ir/v2/orderbook/USDTIRT",
  "https://api.nobitex.net/v2/orderbook/USDTIRT",
] as const;

/** Wallex quotes USDT/TMN in toman per 1 USDT (works from many datacenters when Nobitex .ir is blocked). */
const WALLEX_USDT_DEPTH = "https://api.wallex.ir/v1/depth?symbol=USDTTMN";

/** ~toman per 1 USDT when no live feed works (override with FALLBACK_TOMAN_PER_USDT on Vercel). */
const DEFAULT_TOMAN_FALLBACK = 105000;

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

async function fetchTomanPerUsdtNobitex(): Promise<number | null> {
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

/** TMN = toman on Wallex; mid of best bid/ask. */
async function fetchTomanPerUsdtWallex(): Promise<number | null> {
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

  const [nobitexToman, wallexToman, iranJson, fx, crypto] = await Promise.all([
    fetchTomanPerUsdtNobitex(),
    fetchTomanPerUsdtWallex(),
    fetchIranRatesFromEnv(),
    fetchFrankfurterUsdTargets(),
    fetchBinanceUsdPerCrypto(),
  ]);

  const irtFromIran = iranJson && !iranDisplayOnly;
  const irtMeta = irtFromIran
    ? { source: "iran-json" as const, tomanPerUsdt: iranJson.tomanPerUsdt }
    : nobitexToman !== null
      ? { source: "nobitex" as const, tomanPerUsdt: nobitexToman }
      : wallexToman !== null
        ? { source: "wallex" as const, tomanPerUsdt: wallexToman }
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
      "Reference rates only. IRT uses IRAN_RATES_JSON_URL when set, else Nobitex USDT/IRT (or Wallex USDT/TMN if Nobitex is unreachable), else FALLBACK_TOMAN_PER_USDT. Fiat via Frankfurter; crypto via Binance USDT. Not for settlement or tax.",
  });
}
