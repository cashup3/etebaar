/**
 * Pakistani rupee is priced manually vs Iranian toman (IRT), not from Frankfurter/API.
 * Convention: 1 IRT = N PKR → USD per 1 PKR = (USD per 1 IRT) / N.
 */
export const DEFAULT_PKR_PER_IRT = 537;

export function fixedPkrPerIrtFromEnv(): number {
  const n = Number.parseFloat(process.env.FIXED_PKR_PER_IRT_TOMAN?.trim() ?? "");
  if (Number.isFinite(n) && n > 0) return n;
  return DEFAULT_PKR_PER_IRT;
}

export function applyFixedPkrUsdPerUnit(usdPerUnit: Record<string, number>, pkrPerIrt: number): void {
  const irtUsd = usdPerUnit.IRT;
  if (!Number.isFinite(irtUsd) || irtUsd <= 0 || !Number.isFinite(pkrPerIrt) || pkrPerIrt <= 0) return;
  usdPerUnit.PKR = irtUsd / pkrPerIrt;
}
