import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { fetchTickersByQuote } from "@/lib/marketReference";
import { getIranAndTomanMeta, irtFromUsdtPrice } from "@/lib/tomanPerUsdtRef";

export const dynamic = "force-dynamic";
/** Binance batched calls + IRT fetch; allow headroom on serverless (Hobby max 10s). */
export const maxDuration = 25;

type TickerRow = {
  symbol: string;
  last: string;
  changePct: string;
  volume: string;
  high: string;
  low: string;
  lastIrt: number | null;
  highIrt: number | null;
  lowIrt: number | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quote = (searchParams.get("quote") ?? "USDT").toUpperCase();
  const live = searchParams.get("refresh") === "1";
  if (live) {
    noStore();
  }

  const [marketResult, { irtMeta }] = await Promise.all([
    fetchTickersByQuote(quote),
    getIranAndTomanMeta({ live }),
  ]);

  if (!marketResult.ok) {
    return NextResponse.json({ error: "Upstream market data error" }, { status: 502 });
  }

  const tpm = irtMeta.tomanPerUsdt;
  const tickers: TickerRow[] = marketResult.body.tickers.map((r) => ({
    ...r,
    lastIrt: irtFromUsdtPrice(r.last, tpm),
    highIrt: irtFromUsdtPrice(r.high, tpm),
    lowIrt: irtFromUsdtPrice(r.low, tpm),
  }));

  return NextResponse.json({
    quote: marketResult.body.quote,
    irt: {
      tomanPerUsdt: tpm,
      source: irtMeta.source,
    },
    tickers,
  });
}
