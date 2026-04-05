import type { Locale } from "@/i18n/types";

const locOf = (locale: Locale) => (locale === "fa" ? "fa-IR" : "en-US");

/** Integer toman for display (Iranian open-market style). */
export function formatToman(n: number | null | undefined, locale: Locale): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locOf(locale), {
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Toman per 1 unit of fiat (e.g. EUR). Values < 1 toman must not use Math.round (would show 0); PKR is usually ≥ 538 with the fixed PKR rate.
 */
export function formatTomanPerFiatUnit(n: number | null | undefined, locale: Locale): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n < 1) {
    return new Intl.NumberFormat(locOf(locale), {
      maximumFractionDigits: 8,
      minimumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat(locOf(locale), { maximumFractionDigits: 0 }).format(Math.round(n));
}
