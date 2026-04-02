import { NextResponse } from "next/server";
import { cleanSymbol, fetchTicker24hr } from "@/lib/marketReference";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = cleanSymbol(searchParams.get("symbol") ?? undefined);
  const result = await fetchTicker24hr(symbol);
  if (!result.ok) {
    return NextResponse.json({ error: "Upstream market data error" }, { status: 502 });
  }
  return NextResponse.json(result.body);
}
