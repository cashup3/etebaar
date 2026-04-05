import { DEFAULT_TOMAN_FALLBACK } from "@/lib/tomanPerUsdtRef";

/**
 * Pakistani rupee vs Iranian toman (IRT), not from Frankfurter.
 * Convention: **1 PKR = N IRT (toman)** → USD per 1 PKR = N × (USD per 1 IRT).
 */
export const DEFAULT_TOMAN_PER_PKR = 538;

/** Iranian toman (IRT) per 1 PKR; env `FIXED_TOMAN_PER_PKR` (default 538). */
export function tomanPerOnePkrFromEnv(): number {
  const raw = process.env.FIXED_TOMAN_PER_PKR?.trim() ?? "";
  const n = Number.parseFloat(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return DEFAULT_TOMAN_PER_PKR;
}

/** USD value of 1 IRT from the live map, or env fallback when IRT is missing/invalid. */
function effectiveIrtUsdForPkr(usdPerUnit: Record<string, number>): number | null {
  const i = usdPerUnit.IRT;
  if (Number.isFinite(i) && i > 0) return i;
  const fb =
    Number.parseFloat(process.env.FALLBACK_TOMAN_PER_USDT?.trim() ?? "") || DEFAULT_TOMAN_FALLBACK;
  if (!Number.isFinite(fb) || fb <= 0) return null;
  const v = 1 / fb;
  return Number.isFinite(v) && v > 0 ? v : null;
}

export function applyFixedPkrUsdPerUnit(usdPerUnit: Record<string, number>, tomanPerOnePkr: number): void {
  if (!Number.isFinite(tomanPerOnePkr) || tomanPerOnePkr <= 0) return;
  const irtUsd = effectiveIrtUsdForPkr(usdPerUnit);
  if (irtUsd === null || !Number.isFinite(irtUsd) || irtUsd <= 0) return;
  const pkrUsd = irtUsd * tomanPerOnePkr;
  if (Number.isFinite(pkrUsd) && pkrUsd > 0) usdPerUnit.PKR = pkrUsd;
}

/**
 * After admin FX overrides, PKR can be missing or invalid. Re-derive from final IRT unless PKR is already a positive rate.
 */
export function repairPkrUsdPerUnit(usdPerUnit: Record<string, number>): void {
  const cur = usdPerUnit.PKR;
  if (Number.isFinite(cur) && cur > 0) return;
  const n = tomanPerOnePkrFromEnv();
  if (!Number.isFinite(n) || n <= 0) return;
  const irtUsd = effectiveIrtUsdForPkr(usdPerUnit);
  if (irtUsd === null || !Number.isFinite(irtUsd) || irtUsd <= 0) return;
  const pkrUsd = irtUsd * n;
  if (Number.isFinite(pkrUsd) && pkrUsd > 0) usdPerUnit.PKR = pkrUsd;
}
