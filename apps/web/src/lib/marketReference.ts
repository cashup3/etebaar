/** Public reference prices — Binance first (with mirror hosts), CoinGecko fallback for blocked datacenters (e.g. Vercel). */

const COINGECKO =
  process.env.COINGECKO_API_BASE?.replace(/\/$/, "") ?? "https://api.coingecko.com";

function binanceBases(): string[] {
  const env = process.env.BINANCE_API_BASE?.trim();
  const list = [
    env,
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://api.binance.us",
  ].filter((x): x is string => Boolean(x));
  return [...new Set(list)];
}

/** Used when exchangeInfo fails; keeps homepage/markets working on slow or restricted networks. */
const FALLBACK_QUOTE_SYMBOLS: Record<string, string[]> = {
  USDT: [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "DOTUSDT",
    "LINKUSDT", "TRXUSDT", "POLUSDT", "SHIBUSDT", "LTCUSDT", "BCHUSDT", "ETCUSDT", "XLMUSDT", "ATOMUSDT",
    "NEARUSDT", "APTUSDT", "FILUSDT", "ARBUSDT", "OPUSDT", "INJUSDT", "SUIUSDT", "SEIUSDT", "TIAUSDT",
    "WLDUSDT", "PEPEUSDT", "FETUSDT", "IMXUSDT", "GRTUSDT", "MKRUSDT", "AAVEUSDT", "SNXUSDT", "CRVUSDT",
    "LDOUSDT", "UNIUSDT", "SANDUSDT", "MANAUSDT", "AXSUSDT", "RUNEUSDT", "KAVAUSDT", "EGLDUSDT", "FLOWUSDT",
    "QNTUSDT", "STXUSDT", "CFXUSDT", "FXSUSDT", "DYDXUSDT", "PENDLEUSDT", "ORDIUSDT", "WIFUSDT", "BONKUSDT",
    "TAOUSDT", "JUPUSDT", "PYTHUSDT", "STRKUSDT", "HBARUSDT", "VETUSDT", "ICPUSDT", "ALGOUSDT", "EOSUSDT",
    "THETAUSDT", "XTZUSDT", "CHZUSDT", "SUSHIUSDT", "COMPUSDT", "YFIUSDT", "1INCHUSDT", "ENSUSDT", "ARUSDT",
  ],
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Pick a Binance host that answers (Vercel often blocks only some regions / endpoints). */
async function pickBinanceBase(bases: string[]): Promise<string | null> {
  const probe = encodeURIComponent(JSON.stringify(["BTCUSDT", "ETHUSDT"]));
  const settled = await Promise.allSettled(
    bases.map(async (base) => {
      const res = await fetch(`${base}/api/v3/ticker/24hr?symbols=${probe}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as unknown;
      if (!Array.isArray(j) || j.length < 1) throw new Error("empty");
      return base;
    }),
  );
  for (const s of settled) {
    if (s.status === "fulfilled") return s.value;
  }
  return null;
}

async function listTradingSymbolsForQuote(base: string, quote: string): Promise<string[]> {
  try {
    const res = await fetch(`${base}/api/v3/exchangeInfo`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error("exchangeInfo");
    const data = (await res.json()) as {
      symbols: Array<{ symbol: string; status: string; quoteAsset: string }>;
    };
    const list = data.symbols
      .filter((s) => s.status === "TRADING" && s.quoteAsset === quote)
      .map((s) => s.symbol);
    if (!list.length) throw new Error("empty");
    return list;
  } catch {
    return FALLBACK_QUOTE_SYMBOLS[quote] ?? [];
  }
}

type Binance24hr = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

async function fetch24hrBatchAt(base: string, symbols: string[]): Promise<Binance24hr[]> {
  if (!symbols.length) return [];
  const qs = encodeURIComponent(JSON.stringify(symbols));
  const url = `${base}/api/v3/ticker/24hr?symbols=${qs}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as Binance24hr | Binance24hr[];
  return Array.isArray(json) ? json : [json];
}

function mapBinanceRows(merged: Binance24hr[], q: string) {
  return merged
    .filter((x) => x.symbol.endsWith(q))
    .map((x) => ({
      symbol: x.symbol,
      last: x.lastPrice,
      changePct: x.priceChangePercent,
      volume: x.quoteVolume,
      high: x.highPrice,
      low: x.lowPrice,
    }))
    .sort((a, b) => Number.parseFloat(b.volume) - Number.parseFloat(a.volume))
    .slice(0, 400);
}

/** USD spot prices mapped to synthetic *USDT rows (reference only; not order-book prices). */
async function fetchTickersCoinGeckoAsUsdt() {
  const url = new URL(`${COINGECKO}/api/v3/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "volume_desc");
  url.searchParams.set("per_page", "250");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "EtebaarMarketData/1.0",
    },
    signal: AbortSignal.timeout(12_000),
    next: { revalidate: 45 },
  });
  if (!res.ok) return { ok: false as const, status: res.status };

  const arr = (await res.json()) as Array<{
    symbol: string;
    current_price: number | null;
    price_change_percentage_24h: number | null;
    total_volume: number | null;
    high_24h: number | null;
    low_24h: number | null;
  }>;

  const skip = new Set([
    "usdt", "usdc", "busd", "dai", "tusd", "usdd", "usdp", "fdusd", "pyusd", "usde", "eurs", "eurt",
  ]);

  const tickers = arr
    .filter((c) => c.symbol && !skip.has(c.symbol.toLowerCase()))
    .map((c) => {
      const price = c.current_price ?? 0;
      const chg = c.price_change_percentage_24h ?? 0;
      const vol = c.total_volume ?? 0;
      return {
        symbol: `${c.symbol.toUpperCase()}USDT`,
        last: String(price),
        changePct: String(chg),
        volume: String(vol),
        high: String(c.high_24h ?? price),
        low: String(c.low_24h ?? price),
      };
    });

  return { ok: true as const, body: { quote: "USDT" as const, tickers } };
}

const INTERVALS = new Set([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

export function cleanSymbol(raw: string | null | undefined): string {
  const s = (raw ?? "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 6 && s.length <= 20 ? s : "BTCUSDT";
}

async function fetchTicker24hrAt(base: string, symbol: string) {
  const url = `${base}/api/v3/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) return { ok: false as const, status: res.status };
  const j = (await res.json()) as {
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    quoteVolume: string;
  };
  return {
    ok: true as const,
    body: {
      symbol,
      last: j.lastPrice,
      changePct: j.priceChangePercent,
      high: j.highPrice,
      low: j.lowPrice,
      volume: j.quoteVolume,
    },
  };
}

export async function fetchTicker24hr(symbol: string) {
  const bases = binanceBases();
  for (const base of bases) {
    const r = await fetchTicker24hrAt(base, symbol);
    if (r.ok) return r;
  }
  return { ok: false as const, status: 502 };
}

export async function fetchTickersByQuote(quote: string) {
  const q = quote.toUpperCase();
  const bases = binanceBases();
  const base = await pickBinanceBase(bases);

  if (base) {
    const fromInfo = await listTradingSymbolsForQuote(base, q);
    const fallback = FALLBACK_QUOTE_SYMBOLS[q] ?? [];
    const symbols = [...new Set([...fallback, ...fromInfo])].slice(0, 400);
    if (symbols.length) {
      const batches = chunk(symbols, 100);
      const batchResults = await Promise.all(batches.map((b) => fetch24hrBatchAt(base, b)));
      const merged = batchResults.flat();
      if (merged.length) {
        return { ok: true as const, body: { quote: q, tickers: mapBinanceRows(merged, q) } };
      }
    }
  }

  if (q === "USDT") {
    const cg = await fetchTickersCoinGeckoAsUsdt();
    if (cg.ok) return cg;
  }

  return { ok: false as const, status: 502 };
}

export async function fetchKlines(symbol: string, interval: string, limit: number) {
  const intv = INTERVALS.has(interval) ? interval : "15m";
  const lim = Math.min(1000, Math.max(10, limit));
  const bases = binanceBases();
  for (const base of bases) {
    const url = new URL(`${base}/api/v3/klines`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", intv);
    url.searchParams.set("limit", String(lim));
    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) continue;
    const raw = (await res.json()) as unknown[];
    const bars = raw.map((row) => {
      const r = row as [
        number,
        string,
        string,
        string,
        string,
        string,
        number,
        string,
        number,
        string,
        string,
        string,
      ];
      return {
        t: r[0],
        o: r[1],
        h: r[2],
        l: r[3],
        c: r[4],
        v: r[5],
      };
    });
    return { ok: true as const, body: { symbol, interval: intv, bars } };
  }
  return { ok: false as const, status: 502 };
}
