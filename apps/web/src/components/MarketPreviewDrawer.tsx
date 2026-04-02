"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CryptoIcon } from "@/components/CryptoIcon";
import { ChartPane } from "@/components/trade/ChartPane";
import { useLocale } from "@/i18n/LocaleProvider";
import { pairBaseAsset } from "@/lib/marketSymbol";

export type PreviewTicker = {
  symbol: string;
  last: string;
  changePct: string;
  volume: string;
  high: string;
  low: string;
};

function fmt(n: string | undefined) {
  if (n === undefined) return "—";
  const x = Number.parseFloat(n);
  if (Number.isNaN(x)) return n;
  return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function MarketPreviewDrawer({
  row,
  onClose,
}: {
  row: PreviewTicker | null;
  onClose: () => void;
}) {
  const { t } = useLocale();

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

  const base = pairBaseAsset(row.symbol);
  const ch = Number.parseFloat(row.changePct);
  const up = !Number.isNaN(ch) && ch >= 0;
  const chCls = up ? "text-[var(--buy)]" : "text-[var(--sell)]";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="market-preview-title">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--text)]/20 backdrop-blur-[2px] transition-opacity dark:bg-black/50"
        onClick={onClose}
        aria-label={t("markets.closePanel")}
      />
      <aside className="absolute end-0 top-0 flex h-full w-full max-w-full flex-col border-s border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl sm:max-w-lg md:max-w-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <CryptoIcon symbol={row.symbol} size={48} className="ring-2 ring-[var(--border)]" />
            <div className="min-w-0">
              <h2 id="market-preview-title" className="truncate font-mono text-lg font-semibold text-[var(--text)]">
                {base}
                <span className="font-normal text-[var(--muted)]">/USDT</span>
              </h2>
              <p className="font-mono text-[10px] text-[var(--muted-dim)]">{t("markets.refSpot")}</p>
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
            <span className="text-2xl font-semibold tabular-nums text-[var(--text)]">{fmt(row.last)}</span>
            <span className={`text-sm font-medium tabular-nums ${chCls}`}>
              {up ? "+" : ""}
              {row.changePct}%
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--muted)]">
            <span>
              <span className="text-[var(--muted-dim)]">{t("markets.high")}</span> {fmt(row.high)}
            </span>
            <span>
              <span className="text-[var(--muted-dim)]">{t("markets.low")}</span> {fmt(row.low)}
            </span>
            <span>
              <span className="text-[var(--muted-dim)]">{t("markets.vol")}</span> {fmt(row.volume)}
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted-dim)]">
            {t("markets.chartPreview")}
          </p>
          <div className="min-h-[280px] flex-1 overflow-hidden rounded-md border border-[var(--border)]">
            <ChartPane symbol={row.symbol} compact className="min-h-[280px] border-0" />
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <Link
            href={`/trade?symbol=${encodeURIComponent(row.symbol)}`}
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-md bg-[var(--accent)] py-3 font-mono text-sm font-semibold text-[var(--gold-ink)] transition-colors hover:opacity-95"
          >
            {t("markets.openTerminal")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
