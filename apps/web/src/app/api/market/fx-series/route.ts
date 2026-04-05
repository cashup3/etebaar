import { NextResponse } from "next/server";

export const revalidate = 3600;

const FRANKFURTER = "https://api.frankfurter.app";

const fetchOpts = { next: { revalidate: 3600 } as const };

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Daily USD per 1 unit of `code` (matches convert `usdPerUnit`), from Frankfurter. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const days = Math.min(366, Math.max(14, Number.parseInt(searchParams.get("days") ?? "120", 10) || 120));

  if (!code || code === "IRT" || code === "PKR") {
    return NextResponse.json({ points: [], reason: "no_fx_history" as const });
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  if (code === "USD" || code === "USDT") {
    const points: { t: number; v: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      points.push({ t: Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), 12, 0, 0), v: 1 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return NextResponse.json({ points, base: code, source: "flat_usd" as const });
  }

  const url = `${FRANKFURTER}/${isoDate(start)}..${isoDate(end)}?from=${encodeURIComponent(code)}&to=USD`;
  try {
    const res = await fetch(url, fetchOpts);
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_fx", status: res.status }, { status: 502 });
    }
    const j = (await res.json()) as { rates?: Record<string, { USD?: number }> };
    const rates = j.rates ?? {};
    const points = Object.entries(rates)
      .map(([date, row]) => {
        const usd = row?.USD;
        if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) return null;
        const t = Date.parse(`${date}T12:00:00Z`);
        if (!Number.isFinite(t)) return null;
        return { t, v: usd };
      })
      .filter((p): p is { t: number; v: number } => p != null)
      .sort((a, b) => a.t - b.t);

    return NextResponse.json({ points, base: code, source: "frankfurter" as const });
  } catch {
    return NextResponse.json({ error: "fx_fetch_failed" }, { status: 502 });
  }
}
