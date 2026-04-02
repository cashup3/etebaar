import { NextResponse } from "next/server";
import { cleanSymbol, fetchKlines } from "@/lib/marketReference";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = cleanSymbol(searchParams.get("symbol") ?? undefined);
  const interval = searchParams.get("interval") ?? "15m";
  const limit = Number.parseInt(searchParams.get("limit") ?? "500", 10) || 500;
  const result = await fetchKlines(symbol, interval, limit);
  if (!result.ok) {
    return NextResponse.json({ error: "Upstream market data error" }, { status: 502 });
  }
  return NextResponse.json(result.body);
}
