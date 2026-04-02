"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CryptoIcon } from "@/components/CryptoIcon";
import { MarketingBanner } from "@/components/landing/MarketingBanner";
import { MarketPreviewDrawer, type PreviewTicker } from "@/components/MarketPreviewDrawer";
import { useLocale } from "@/i18n/LocaleProvider";
import { pairBaseAsset } from "@/lib/marketSymbol";

type Ticker = PreviewTicker;

export function MarketsContent() {
  const { t } = useLocale();
  const [rows, setRows] = useState<Ticker[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<Ticker | null>(null);

  useEffect(() => {
    void fetch("/api/market/tickers?quote=USDT")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: { tickers: Ticker[] }) => setRows(j.tickers ?? []))
      .catch(() => setErr(t("markets.err")));
  }, [t]);

  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return rows;
    return rows.filter((r) => r.symbol.includes(s));
  }, [rows, q]);

  const openPreview = useCallback((row: Ticker) => {
    setPreview(row);
  }, []);

  const closePreview = useCallback(() => setPreview(null), []);

  return (
    <div className="mx-auto max-w-[1920px] space-y-4 px-3 pb-16 pt-4 sm:px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-2 inline-block font-sans text-xs text-[var(--muted)] hover:text-[var(--accent)]"
          >
            {t("markets.backHome")}
          </Link>
          <h1 className="font-mono text-xl font-semibold tracking-tight text-[var(--text)]">{t("markets.title")}</h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-[var(--muted)]">{t("markets.sub")}</p>
          <p className="mt-2 font-mono text-[10px] text-[var(--muted-dim)]">{t("markets.rowHint")}</p>
        </div>
        <input
          placeholder={t("markets.searchPh")}
          className="w-full max-w-xs border border-[var(--border)] bg-[var(--panel)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] sm:w-72"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}

      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
        <table className="w-full min-w-[720px] text-start font-mono text-[11px]">
          <thead className="border-b border-[var(--border)] text-[var(--muted-dim)]">
            <tr>
              <th className="px-3 py-2 font-medium">{t("markets.pair")}</th>
              <th className="px-3 py-2 font-medium">{t("markets.last")}</th>
              <th className="px-3 py-2 font-medium">{t("markets.chg")}</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">{t("markets.high")}</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">{t("markets.low")}</th>
              <th className="px-3 py-2 font-medium">{t("markets.vol")}</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const ch = Number.parseFloat(r.changePct);
              const col =
                Number.isNaN(ch) || ch >= 0 ? "text-[var(--buy)]" : "text-[var(--sell)]";
              const base = pairBaseAsset(r.symbol);
              return (
                <tr
                  key={r.symbol}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPreview(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPreview(r);
                    }
                  }}
                  className="cursor-pointer border-b border-[var(--border)]/80 transition-colors hover:bg-[var(--panel-hover)] focus-visible:bg-[var(--panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
                >
                  <td className="px-3 py-2.5 text-[var(--text)]">
                    <div className="flex items-center gap-2.5">
                      <CryptoIcon symbol={r.symbol} size={28} className="ring-1 ring-[var(--border)]" />
                      <div className="min-w-0">
                        <span className="font-semibold">{base}</span>
                        <span className="text-[var(--muted)]">/USDT</span>
                        <p className="truncate text-[10px] text-[var(--muted-dim)]">{r.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--text)]">{r.last}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${col}`}>{r.changePct}%</td>
                  <td className="hidden px-3 py-2.5 tabular-nums text-[var(--muted)] lg:table-cell">
                    {r.high}
                  </td>
                  <td className="hidden px-3 py-2.5 tabular-nums text-[var(--muted)] lg:table-cell">
                    {r.low}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--muted)]">{r.volume}</td>
                  <td className="px-3 py-2.5 text-end">
                    <Link
                      href={`/trade?symbol=${encodeURIComponent(r.symbol)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex rounded border border-[var(--border)] px-2 py-1 text-[var(--accent)] hover:border-[var(--border-strong)] hover:underline"
                    >
                      {t("markets.trade")}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && !err && (
          <p className="p-6 text-center font-mono text-[11px] text-[var(--muted)]">{t("markets.empty")}</p>
        )}
      </div>

      <MarketingBanner
        title={t("markets.bannerTitle")}
        subtitle={t("markets.bannerSub")}
        ctaHref="/signup"
        ctaLabel={t("markets.bannerCta")}
        variant="markets"
      />

      <MarketPreviewDrawer row={preview} onClose={closePreview} />
    </div>
  );
}
