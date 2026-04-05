/**
 * Pull manual FX overrides from the Node API (Postgres `AdminFxOverride`).
 * Requires API_ORIGIN + INTERNAL_API_SECRET on the Next.js server (same secret as deposit webhooks).
 */

export async function mergeFxOverridesFromApi(usdPerUnit: Record<string, number>): Promise<void> {
  const base = process.env.API_ORIGIN?.trim();
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!base || !secret) return;
  try {
    const url = `${base.replace(/\/$/, "")}/internal/fx-overrides`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "x-internal-secret": secret },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return;
    const j = (await res.json()) as { overrides?: Record<string, string> };
    for (const [code, v] of Object.entries(j.overrides ?? {})) {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n) && n > 0) {
        usdPerUnit[code.toUpperCase()] = n;
      }
    }
  } catch {
    /* optional: API down during local dev */
  }
}
