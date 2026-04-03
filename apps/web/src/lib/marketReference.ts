/** Public reference prices from Binance (same source as `apps/api` market routes). */

const BINANCE = "https://api.binance.com";

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

async function listTradingSymbolsForQuote(quote: string): Promise<string[]> {
  try {
    const res = await fetch(`${BINANCE}/api/v3/exchangeInfo`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
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

async function fetch24hrBatch(symbols: string[]): Promise<Binance24hr[]> {
  if (!symbols.length) return [];
  const qs = encodeURIComponent(JSON.stringify(symbols));
  const url = `${BINANCE}/api/v3/ticker/24hr?symbols=${qs}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as Binance24hr | Binance24hr[];
  return Array.isArray(json) ? json : [json];
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

export async function fetchTicker24hr(symbol: string) {
  const url = `${BINANCE}/api/v3/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url, { cache: "no-store" });
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

export async function fetchTickersByQuote(quote: string) {
  const q = quote.toUpperCase();
  const fromInfo = await listTradingSymbolsForQuote(q);
  const fallback = FALLBACK_QUOTE_SYMBOLS[q] ?? [];
  const symbols = [...new Set([...fallback, ...fromInfo])].slice(0, 400);
  if (!symbols.length) return { ok: false as const, status: 404 };

  const batches = chunk(symbols, 100);
  const batchResults = await Promise.all(batches.map((b) => fetch24hrBatch(b)));
  const merged = batchResults.flat();

  if (!merged.length) return { ok: false as const, status: 502 };

  const rows = merged
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

  return { ok: true as const, body: { quote: q, tickers: rows } };
}

export async function fetchKlines(symbol: string, interval: string, limit: number) {
  const intv = INTERVALS.has(interval) ? interval : "15m";
  const lim = Math.min(1000, Math.max(10, limit));
  const url = new URL(`${BINANCE}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", intv);
  url.searchParams.set("limit", String(lim));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { ok: false as const, status: res.status };
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
