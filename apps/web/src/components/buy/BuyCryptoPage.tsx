"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CryptoIcon } from "@/components/CryptoIcon";
import { useLocale } from "@/i18n/LocaleProvider";
import { TOP_USDT_PAIRS } from "@/data/topUsdtPairs";
import { formatToman } from "@/lib/formatToman";
import { pairBaseAsset } from "@/lib/marketSymbol";

type Ticker = {
  symbol: string;
  last: string;
  changePct: string;
  lastIrt?: number | null;
};

/** Core list to surface on Buy (subset of full TOP_USDT_PAIRS). */
const BUY_SHOWCASE = TOP_USDT_PAIRS.slice(0, 20);

export function BuyCryptoPage() {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<Ticker[]>([]);
  const [load, setLoad] = useState<"loading" | "ok" | "error">("loading");
  const [q, setQ] = useState("");

  useEffect(() => {
    void fetch("/api/market/tickers?quote=USDT")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: { tickers?: Ticker[] }) => {
        setRows(j.tickers ?? []);
        setLoad("ok");
      })
      .catch(() => setLoad("error"));
  }, []);

  const ordered = useMemo(() => {
    const map = new Map(rows.map((r) => [r.symbol, r]));
    const out: Ticker[] = [];
    for (const sym of BUY_SHOWCASE) {
      const row = map.get(sym);
      if (row) out.push(row);
    }
    for (const r of rows) {
      if (!out.includes(r) && out.length < 24) out.push(r);
    }
    return out;
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return ordered;
    return ordered.filter((r) => r.symbol.includes(s) || pairBaseAsset(r.symbol).toUpperCase().includes(s));
  }, [ordered, q]);

  return (
    <div className="min-h-[calc(100dvh-var(--header-h))] w-full min-w-0 overflow-x-clip bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-10 pb-20 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-block font-mono text-xs text-[var(--landing-muted)] hover:text-[var(--gold)]"
        >
          {t("pages.common.backHome")}
        </Link>

        <header className="max-w-3xl">
          <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-tight tracking-tight text-[var(--landing-text)]">
            {t("buyPage.heroTitle")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">{t("buyPage.heroSub")}</p>
        </header>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/login?signup=1"
            className="inline-flex min-w-[140px] items-center justify-center rounded-md bg-[var(--gold)] px-6 py-3 font-mono text-sm font-semibold text-[var(--gold-ink)] shadow-sm transition-colors hover:bg-[var(--gold-hover)]"
          >
            {t("buyPage.ctaSignup")}
          </Link>
          <Link
            href="/markets"
            className="inline-flex min-w-[140px] items-center justify-center rounded-md border border-[var(--landing-border)] bg-[var(--landing-card)] px-6 py-3 font-mono text-sm font-semibold text-[var(--landing-text)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            {t("buyPage.ctaMarkets")}
          </Link>
          <Link
            href="/convert"
            className="inline-flex min-w-[140px] items-center justify-center rounded-md border border-[var(--landing-border)] bg-[var(--landing-card)] px-6 py-3 font-mono text-sm font-semibold text-[var(--landing-text)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            {t("buyPage.ctaConvert")}
          </Link>
        </div>

        <section className="mt-14">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
            {t("buyPage.stepsTitle")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <div
                key={n}
                className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--landing-elevated)] font-mono text-sm font-bold text-[var(--gold)]">
                  {n}
                </span>
                <h3 className="mt-3 font-mono text-sm font-semibold text-[var(--landing-text)]">
                  {t(`buyPage.step${n}Title`)}
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--landing-muted)]">
                  {t(`buyPage.step${n}Body`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-mono text-lg font-semibold text-[var(--landing-text)]">{t("buyPage.popularTitle")}</h2>
              <p className="mt-1 max-w-xl font-mono text-[11px] text-[var(--landing-muted)]">{t("buyPage.popularSub")}</p>
            </div>
            <input
              type="search"
              placeholder={t("buyPage.searchPh")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full max-w-xs border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-xs text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:w-64"
            />
          </div>

          {load === "error" && (
            <p className="mt-6 font-mono text-sm text-[var(--sell)]">{t("buyPage.errLoad")}</p>
          )}

          {load === "loading" && (
            <div className="mt-6 grid animate-pulse gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-[var(--landing-elevated)]" />
              ))}
            </div>
          )}

          {load === "ok" && (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const ch = Number.parseFloat(r.changePct);
                const up = !Number.isNaN(ch) && ch >= 0;
                const base = pairBaseAsset(r.symbol);
                return (
                  <li
                    key={r.symbol}
                    className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--landing-row-hover)]"
                  >
                    <Link href={`/trade?symbol=${encodeURIComponent(r.symbol)}`} className="flex items-center gap-3 p-4">
                      <CryptoIcon symbol={r.symbol} size={40} className="ring-2 ring-[var(--landing-border)]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold text-[var(--landing-text)]">{base}</p>
                        <p className="truncate font-mono text-[10px] text-[var(--landing-muted)]">{r.symbol}</p>
                        <p className="mt-1 font-mono text-xs tabular-nums text-[var(--landing-text)]">
                          {formatToman(r.lastIrt ?? null, locale)}
                          <span className="ms-1 text-[10px] text-[var(--landing-muted)]">{t("markets.usdtRef")}</span>
                        </p>
                        <p className={`font-mono text-[11px] tabular-nums ${up ? "text-[var(--buy)]" : "text-[var(--sell)]"}`}>
                          {t("markets.chg")} {up ? "+" : ""}
                          {r.changePct}%
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-[var(--gold)] px-2 py-1 font-mono text-[10px] font-semibold text-[var(--gold)]">
                        {t("buyPage.tradeCta")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {load === "ok" && !filtered.length && (
            <p className="mt-6 font-mono text-sm text-[var(--landing-muted)]">{t("buyPage.emptyFiltered")}</p>
          )}
        </section>

        <aside className="mt-12 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-elevated)]/40 p-5">
          <p className="font-mono text-[11px] leading-relaxed text-[var(--landing-muted)]">{t("buyPage.disclaimer")}</p>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--landing-muted)]">{t("buyPage.fiatNote")}</p>
        </aside>
      </div>
    </div>
  );
}
