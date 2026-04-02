import type { FastifyInstance } from "fastify";

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

function cleanSymbol(raw: string | undefined): string {
  const s = (raw ?? "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 6 && s.length <= 20 ? s : "BTCUSDT";
}

/** OHLCV rows for charting (public reference data; not platform settlement). */
export async function registerMarketRoutes(app: FastifyInstance) {
  app.get("/market/ticker", async (req, reply) => {
    const q = req.query as { symbol?: string };
    const symbol = cleanSymbol(q.symbol);
    const url = `${BINANCE}/api/v3/ticker/24hr?symbol=${symbol}`;
    const res = await fetch(url);
    if (!res.ok) {
      return reply.status(502).send({ error: "Upstream market data error" });
    }
    const j = (await res.json()) as {
      lastPrice: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      quoteVolume: string;
    };
    return {
      symbol,
      last: j.lastPrice,
      changePct: j.priceChangePercent,
      high: j.highPrice,
      low: j.lowPrice,
      volume: j.quoteVolume,
    };
  });

  app.get("/market/klines", async (req, reply) => {
    const q = req.query as { symbol?: string; interval?: string; limit?: string };
    const symbol = cleanSymbol(q.symbol);
    const interval = INTERVALS.has(q.interval ?? "") ? q.interval! : "15m";
    const limit = Math.min(1000, Math.max(10, Number.parseInt(q.limit ?? "500", 10) || 500));
    const url = new URL(`${BINANCE}/api/v3/klines`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url);
    if (!res.ok) {
      return reply.status(502).send({ error: "Upstream market data error" });
    }
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
    return { symbol, interval, bars };
  });

  app.get("/market/tickers", async (req, reply) => {
    const q = req.query as { quote?: string };
    const quote = (q.quote ?? "USDT").toUpperCase();
    const res = await fetch(`${BINANCE}/api/v3/ticker/24hr`);
    if (!res.ok) {
      return reply.status(502).send({ error: "Upstream market data error" });
    }
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
    return { quote, tickers: rows };
  });
}
