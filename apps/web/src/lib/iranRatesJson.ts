/**
 * Optional Iranian open-market rates from a JSON URL you host or generate.
 *
 * Many sites (e.g. Bonbast) use signed browser-only requests; point IRAN_RATES_JSON_URL
 * at a tiny worker / cron job / static file that outputs the shapes documented in .env.example.
 */

export type IranOpenMarketRow = {
  label: string;
  buy?: number;
  sell?: number;
};

export type NormalizedIranRates = {
  /** Toman per 1 USDT/USD (open market reference). */
  tomanPerUsdt: number;
  sourceLabel?: string;
  updatedAt?: string;
  rows: IranOpenMarketRow[];
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number.parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

function readNestedUsd(o: Record<string, unknown>): number | null {
  const nested = (o.usd ?? o.USD ?? o.dollar ?? o.Dollar) as Record<string, unknown> | undefined;
  if (!nested || typeof nested !== "object") return null;
  return num(nested.sell ?? nested.Sell ?? nested.s ?? nested.price ?? nested.last);
}

/** Extract toman per USD/USDT from several common JSON shapes. */
export function pickTomanPerUsdt(o: Record<string, unknown>): number | null {
  const keys = ["tomanPerUsdt", "tomanPerUSD", "toman_per_usdt", "toman_per_usd", "usd_sell_toman", "usdToman"];
  for (const k of keys) {
    const v = num(o[k]);
    if (v !== null && v > 1000) return v;
  }
  const n = readNestedUsd(o);
  if (n !== null && n > 1000) return n;
  return null;
}

function rowFromPair(label: string, v: unknown): IranOpenMarketRow | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") {
    const x = num(v);
    if (x === null || x < 1) return null;
    return { label, sell: x };
  }
  if (typeof v === "object") {
    const p = v as Record<string, unknown>;
    const buy = num(p.buy ?? p.Buy);
    const sell = num(p.sell ?? p.Sell ?? p.price);
    if (buy === null && sell === null) return null;
    return { label, buy: buy ?? undefined, sell: sell ?? undefined };
  }
  return null;
}

/** Build display rows from `items[]` or common fiat/gold keys (all values in toman). */
export function buildIranRows(o: Record<string, unknown>, tomanPerUsdt: number): IranOpenMarketRow[] {
  const rows: IranOpenMarketRow[] = [];

  if (Array.isArray(o.items)) {
    for (const raw of o.items) {
      if (!raw || typeof raw !== "object") continue;
      const it = raw as Record<string, unknown>;
      const label = String(it.label ?? it.name ?? it.title ?? "—");
      const buy = num(it.buy ?? it.Buy);
      const sell = num(it.sell ?? it.Sell ?? it.price);
      if (buy !== null || sell !== null) {
        rows.push({ label, buy: buy ?? undefined, sell: sell ?? undefined });
      }
    }
    if (rows.length) return rows;
  }

  const pairs: [string, string[]][] = [
    ["USD", ["usd", "USD"]],
    ["EUR", ["eur", "EUR"]],
    ["GBP", ["gbp", "GBP"]],
    ["AED", ["aed", "AED"]],
    ["TRY", ["try", "TRY"]],
    ["CNY", ["cny", "CNY"]],
  ];
  for (const [label, keys] of pairs) {
    for (const k of keys) {
      if (!(k in o)) continue;
      const r = rowFromPair(label, o[k]);
      if (r) {
        rows.push(r);
        break;
      }
    }
  }

  const goldKeys: [string, string[]][] = [
    ["Gold 18k (g)", ["gold18", "gold_18g", "gold18g", "gol18"]],
    ["Mithqal", ["mithqal", "mithal"]],
    ["Emami coin", ["emami", "emami1"]],
    ["Azadi coin", ["azadi", "azadi1"]],
    ["Ounce", ["ounce", "ons", "moz"]],
  ];
  for (const [label, keys] of goldKeys) {
    for (const k of keys) {
      if (!(k in o)) continue;
      const r = rowFromPair(label, o[k]);
      if (r) {
        rows.push(r);
        break;
      }
    }
  }

  if (!rows.length) {
    rows.push({ label: "USDT ≈ USD (reference)", sell: tomanPerUsdt });
  }

  return rows;
}

export function normalizeIranRatesJson(raw: unknown): NormalizedIranRates | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tomanPerUsdt = pickTomanPerUsdt(o);
  if (tomanPerUsdt === null) return null;
  const rows = buildIranRows(o, tomanPerUsdt);
  const sourceLabel = typeof o.source === "string" ? o.source : typeof o.label === "string" ? o.label : undefined;
  const updatedAt = typeof o.updatedAt === "string" ? o.updatedAt : typeof o.updated_at === "string" ? o.updated_at : undefined;
  return { tomanPerUsdt, sourceLabel, updatedAt, rows };
}

export async function fetchIranRatesFromEnv(): Promise<NormalizedIranRates | null> {
  const url = process.env.IRAN_RATES_JSON_URL?.trim();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "EtebaarConvert/1.0",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 45 },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as unknown;
    return normalizeIranRatesJson(j);
  } catch {
    return null;
  }
}
