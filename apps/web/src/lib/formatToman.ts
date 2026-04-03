import type { Locale } from "@/i18n/types";

/** Integer toman for display (Iranian open-market style). */
export function formatToman(n: number | null | undefined, locale: Locale): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(n);
}
