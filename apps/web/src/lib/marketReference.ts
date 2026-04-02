/** Public reference prices from Binance (same source as `apps/api` market routes). */

const BINANCE = "https://api.binance.com";

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
  const res = await fetch(`${BINANCE}/api/v3/ticker/24hr`, { cache: "no-store" });
  if (!res.ok) return { ok: false as const, status: res.status };
  const all = (await res.json()) as {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
    highPrice: string;
    lowPrice: string;
  }[];
  const rows = all
    .filter((x) => x.symbol.endsWith(quote) && x.symbol.length < 20)
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
  return { ok: true as const, body: { quote, tickers: rows } };
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
