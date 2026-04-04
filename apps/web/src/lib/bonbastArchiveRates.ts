/**
 * Daily open-market rates (toman) archived from bonbast.com via
 * https://github.com/SamadiPour/rial-exchange-rates-archive — MIT license.
 * Uses the `gregorian_7days.min.json` shape: { "YYYY/MM/DD": { "usd": { buy, sell }, ... } }.
 */

import { buildIranRows, type NormalizedIranRates } from "@/lib/iranRatesJson";

const DEFAULT_ARCHIVE_URL =
  "https://cdn.jsdelivr.net/gh/SamadiPour/rial-exchange-rates-archive@data/gregorian_7days.min.json";

const DATE_KEY = /^\d{4}\/\d{2}\/\d{2}$/;

function midToman(buy: number, sell: number): number | null {
  if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) return null;
  const m = (buy + sell) / 2;
  return Number.isFinite(m) && m > 1000 ? m : null;
}

function pickLatestDay(root: Record<string, unknown>): { dateKey: string; day: Record<string, unknown> } | null {
  const keys = Object.keys(root).filter((k) => DATE_KEY.test(k));
  if (!keys.length) return null;
  keys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  for (const dateKey of keys) {
    const day = root[dateKey];
    if (day && typeof day === "object" && !Array.isArray(day)) {
      return { dateKey, day: day as Record<string, unknown> };
    }
  }
  return null;
}

/**
 * Fetches the public 7-day archive file and returns the latest day as normalized open-market rows.
 * USD mid (buy+sell)/2 in toman is used as the USDT/IRT reference proxy (open-market USD ≈ USDT).
 */
export async function fetchBonbastArchiveRates(fetchInit: RequestInit): Promise<NormalizedIranRates | null> {
  const url = process.env.BONBAST_ARCHIVE_JSON_URL?.trim() || DEFAULT_ARCHIVE_URL;
  try {
    const res = await fetch(url, {
      ...fetchInit,
      headers: {
        Accept: "application/json",
        "User-Agent": "EtebaarConvert/1.0",
      },
      signal: AbortSignal.timeout(14_000),
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const root = raw as Record<string, unknown>;
    const picked = pickLatestDay(root);
    if (!picked) return null;
    const usd = picked.day.usd as Record<string, unknown> | undefined;
    if (!usd || typeof usd !== "object") return null;
    const buy = typeof usd.buy === "number" ? usd.buy : Number.parseFloat(String(usd.buy ?? ""));
    const sell = typeof usd.sell === "number" ? usd.sell : Number.parseFloat(String(usd.sell ?? ""));
    const tomanPerUsdt = midToman(buy, sell);
    if (tomanPerUsdt === null) return null;

    const rows = buildIranRows(picked.day, tomanPerUsdt);
    const isoDate = picked.dateKey.replace(/\//g, "-");
    return {
      tomanPerUsdt,
      sourceLabel: "Bonbast (rial-exchange-rates-archive)",
      updatedAt: `${isoDate}T12:00:00.000Z`,
      rows,
    };
  } catch {
    return null;
  }
}
