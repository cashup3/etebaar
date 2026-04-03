import { NextResponse } from "next/server";
import { TOP_USDT_PAIRS } from "@/data/topUsdtPairs";
import { getIranAndTomanMeta } from "@/lib/tomanPerUsdtRef";

/** Cache aggregated rates briefly at the edge. */
export const revalidate = 30;

const fetchOpts = { next: { revalidate: 30 } as const };

const BINANCE = "https://api.binance.com";
const FRANKFURTER = "https://api.frankfurter.app/latest";

const CRYPTO_PAIRS = TOP_USDT_PAIRS;

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : null;
}

async function fetchFrankfurterUsdTargets(): Promise<Partial<Record<string, number>>> {
  const out: Partial<Record<string, number>> = {};
  try {
    const u = new URL(FRANKFURTER);
    u.searchParams.set("from", "USD");
    u.searchParams.set("to", "GBP,GEL,AED,EUR,TRY,CHF,JPY,CAD,CNY,SEK,NOK,INR,PLN");
    const res = await fetch(u.toString(), fetchOpts);
    if (!res.ok) return out;
    const j = (await res.json()) as { rates?: Record<string, number> };
    const rates = j.rates ?? {};
    for (const [code, v] of Object.entries(rates)) {
      if (typeof v === "number" && v > 0) {
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
  const [{ irtMeta, iranJson }, fx, crypto] = await Promise.all([
    getIranAndTomanMeta(),
    fetchFrankfurterUsdTargets(),
    fetchBinanceUsdPerCrypto(),
  ]);

  const iranOpenMarket = iranJson
    ? {
        label: iranJson.sourceLabel,
        updatedAt: iranJson.updatedAt,
        rows: iranJson.rows,
      }
    : undefined;

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

  const fiatCodes = [
    "IRT",
    "USD",
    "USDT",
    "EUR",
    "GBP",
    "GEL",
    "AED",
    "TRY",
    "CHF",
    "JPY",
    "CAD",
    "CNY",
    "SEK",
    "NOK",
    "INR",
    "PLN",
  ].filter((c) => usdPerUnit[c] != null);
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
