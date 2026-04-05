"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { FiatFxChart } from "@/components/markets/FiatFxChart";
import { useLocale } from "@/i18n/LocaleProvider";
import { formatToman, formatTomanPerFiatUnit } from "@/lib/formatToman";

export type FiatPreviewRow = {
  code: string;
  /** Live toman per 1 unit from convert rates. */
  tomanPerUnit: number;
};

export function CurrencyPreviewDrawer({
  row,
  onClose,
}: {
  row: FiatPreviewRow | null;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();

  const currencyNames = useMemo(
    () => new Intl.DisplayNames(locale === "fa" ? "fa-IR" : "en-US", { type: "currency" }),
    [locale],
  );

  let label: string;
  try {
    label = row ? (currencyNames.of(row.code) ?? row.code) : "";
  } catch {
    label = row?.code ?? "";
  }

  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [row, onClose]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="fiat-preview-title">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--text)]/20 backdrop-blur-[2px] transition-opacity dark:bg-black/50"
        onClick={onClose}
        aria-label={t("markets.closePanel")}
      />
      <aside className="absolute end-0 top-0 flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-full flex-col border-s border-[var(--border)] bg-[var(--bg-elevated)] pt-[env(safe-area-inset-top,0px)] shadow-2xl sm:max-w-lg md:max-w-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <CurrencyIcon code={row.code} size={48} className="ring-2 ring-[var(--border)]" />
            <div className="min-w-0">
              <h2 id="fiat-preview-title" className="truncate font-mono text-lg font-semibold text-[var(--text)]">
                {row.code}
              </h2>
              <p className="truncate font-mono text-[10px] text-[var(--muted-dim)]">{label}</p>
              <p className="mt-1 font-mono text-[10px] text-[var(--muted-dim)]">{t("markets.fiatRefNote")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            {t("markets.closePanel")}
          </button>
        </div>

        <div className="grid gap-1 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3 font-mono">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums text-[var(--text)]">
                {formatTomanPerFiatUnit(row.tomanPerUnit, locale)}
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--muted-dim)]">{t("markets.fiatTomanPerUnit")}</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted-dim)]">
            {t("markets.fiatChartTitle")}
          </p>
          <p className="mb-2 font-mono text-[9px] leading-relaxed text-[var(--muted-dim)]">{t("markets.fiatChartSub")}</p>
          <div className="min-h-[280px] flex-1 overflow-hidden rounded-md border border-[var(--border)]">
            <FiatFxChart code={row.code} compact className="min-h-[280px] border-0" />
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <Link
            href="/convert"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-md bg-[var(--accent)] py-3 font-mono text-sm font-semibold text-[var(--gold-ink)] transition-colors hover:opacity-95"
          >
            {t("markets.openConvert")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
