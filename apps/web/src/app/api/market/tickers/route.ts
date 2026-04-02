import { NextResponse } from "next/server";
import { fetchTickersByQuote } from "@/lib/marketReference";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const quote = (searchParams.get("quote") ?? "USDT").toUpperCase();
  const result = await fetchTickersByQuote(quote);
  if (!result.ok) {
    return NextResponse.json({ error: "Upstream market data error" }, { status: 502 });
  }
  return NextResponse.json(result.body);
}
