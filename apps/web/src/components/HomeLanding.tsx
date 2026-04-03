"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LifestyleVideoRow } from "@/components/landing/LifestyleVideoRow";
import { TradeOnTheGoSection } from "@/components/landing/TradeOnTheGoSection";
import { TrustReserveSection } from "@/components/landing/TrustReserveSection";
import { CryptoIcon } from "@/components/CryptoIcon";
import { useLocale } from "@/i18n/LocaleProvider";
import { pairBaseAsset } from "@/lib/marketSymbol";
import { TOP_USDT_PAIRS } from "@/data/topUsdtPairs";

type Ticker = {
  symbol: string;
  last: string;
  changePct: string;
  volume: string;
};

/** Prefer these when building the “Popular” strip (first wins among available tickers). */
const POPULAR_ORDER = [...TOP_USDT_PAIRS];

const NEWS_KEYS = [
  "home.news0",
  "home.news1",
  "home.news2",
  "home.news3",
  "home.news4",
] as const;

const TRUST_STRIP = [
  { k: "1", titleKey: "home.trustA", subKey: "home.trustASub" },
  { k: "2", titleKey: "home.trustB", subKey: "home.trustBSub" },
  { k: "3", titleKey: "home.trustC", subKey: "home.trustCSub" },
] as const;

export function HomeLanding() {
  const { t } = useLocale();
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [mktLoad, setMktLoad] = useState<"loading" | "ok" | "error">("loading");
  const [tab, setTab] = useState<"popular" | "new">("popular");

  useEffect(() => {
    void fetch("/api/market/tickers?quote=USDT")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: { tickers: Ticker[] }) => {
        setTickers(j.tickers ?? []);
        setMktLoad("ok");
      })
      .catch(() => {
        setTickers([]);
        setMktLoad("error");
      });
  }, []);

  const popularRows = useMemo(() => {
    const map = new Map(tickers.map((t) => [t.symbol, t]));
    const ordered: Ticker[] = [];
    for (const s of POPULAR_ORDER) {
      const row = map.get(s);
      if (row) ordered.push(row);
    }
    for (const t of tickers) {
      if (!ordered.includes(t) && ordered.length < 6) ordered.push(t);
    }
    return ordered.slice(0, 6);
  }, [tickers]);

  const newRows = useMemo(() => {
    return [...tickers].slice(-6).reverse();
  }, [tickers]);

  const displayRows = tab === "popular" ? popularRows : newRows.length ? newRows : popularRows;

  return (
    <div className="relative min-h-[calc(100vh-var(--header-h))] bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
          {/* Hero */}
          <section className="space-y-8">
            <div>
              <p className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight">
                <span className="text-[var(--landing-text)]">{t("home.heroHeadlineLead")}</span>
                <span className="text-[var(--gold)]">{t("home.heroHeadlineBrand")}</span>
              </p>
              <p className="mt-3 text-lg text-[var(--landing-muted)] sm:text-xl">{t("home.heroSub")}</p>
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-10">
              <div className="flex items-start gap-2">
                <span className="text-2xl text-[var(--gold)]" aria-hidden>
                  🏅
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--landing-text)]">{t("home.liqTitle")}</p>
                  <p className="text-xs text-[var(--landing-muted)]">{t("home.liqSub")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl text-[var(--gold)]" aria-hidden>
                  🏅
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--landing-text)]">{t("home.speedTitle")}</p>
                  <p className="text-xs text-[var(--landing-muted)]">{t("home.speedSub")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] px-4 py-2.5 text-sm text-[var(--landing-muted)]">
                <span className="text-[var(--gold)]" aria-hidden>
                  🎁
                </span>
                <span>{t("home.perk")}</span>
              </div>
              <Link
                href="/signup"
                className="inline-flex min-w-[160px] items-center justify-center rounded-md bg-[var(--gold)] px-8 py-3.5 text-center text-base font-semibold text-[var(--gold-ink)] shadow-sm transition-colors hover:bg-[var(--gold-hover)]"
              >
                {t("home.signup")}
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs text-[var(--landing-muted)]">{t("home.getApp")}</span>
              <div className="flex gap-3 opacity-80">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] text-[var(--landing-text)]"
                  title={t("home.gpSoon")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3.6 1.2 13.2 12 3.6 22.8c-.8-.5-1.3-1.3-1.3-2.3V3.5c0-1 .5-1.8 1.3-2.3zm16.6 9.1L20.4 12l-.2.7-6.2 3.6 6-6.9zM15.1 12 5.1 2.1l8.9 5.1 1.1 4.8zM5.1 21.9l10-9.9-4 2.3-6 3.6z" />
                  </svg>
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] text-[var(--landing-text)]"
                  title={t("home.asSoon")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M16.4 12.5c-.1-3 2.5-4.5 2.6-4.6-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.7 1.1-4.7 1.1-.9 0-2.4-1.1-4-1-2.1.1-4 1.2-5.1 3.1-2.2 3.8-.6 9.4 1.6 12.5 1 1.5 2.3 3.1 3.9 3 1.6-.1 2.2-1 4.1-1s2.5 1 4.1.9c1.7-.1 2.8-1.5 3.8-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-3.2-1.2-3.2-4.6zM14.3 4.6c.9-1 1.5-2.4 1.4-3.8-1.4.1-2.9 1-3.8 2-1 1.1-1.8 2.9-1.6 4.6 1.5.1 3-1 4-2.8z" />
                  </svg>
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] text-[var(--landing-text)]"
                  title={t("home.qrSoon")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
                    <path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h6v2h-6z" />
                  </svg>
                </span>
              </div>
            </div>
          </section>

          {/* Widgets */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)]">
              <div className="flex items-center justify-between border-b border-[var(--landing-border)] px-4 pt-3">
                <div className="flex gap-6">
                  <button
                    type="button"
                    onClick={() => setTab("popular")}
                    className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                      tab === "popular"
                        ? "border-[var(--gold)] text-[var(--landing-text)]"
                        : "border-transparent text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                    }`}
                  >
                    {t("home.popular")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("new")}
                    className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
                      tab === "new"
                        ? "border-[var(--gold)] text-[var(--landing-text)]"
                        : "border-transparent text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                    }`}
                  >
                    {t("home.newListing")}
                  </button>
                </div>
                <Link
                  href="/markets"
                  className="pb-2.5 text-xs font-medium text-[var(--gold)] hover:underline"
                >
                  {t("home.viewAll")}
                </Link>
              </div>
              <ul className="divide-y divide-[var(--landing-border)]">
                {displayRows.map((r) => {
                  const ch = Number.parseFloat(r.changePct);
                  const up = !Number.isNaN(ch) && ch >= 0;
                  const base = pairBaseAsset(r.symbol);
                  return (
                    <li key={r.symbol}>
                      <Link
                        href={`/trade?symbol=${encodeURIComponent(r.symbol)}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--landing-row-hover)]"
                      >
                        <CryptoIcon symbol={r.symbol} size={32} className="ring-2 ring-[var(--landing-border)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--landing-text)]">{base}</p>
                          <p className="truncate text-xs text-[var(--landing-muted)]">{r.symbol}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-medium tabular-nums text-[var(--landing-text)]">{r.last}</p>
                          <p className={`text-xs font-medium tabular-nums ${up ? "text-[var(--buy)]" : "text-[var(--sell)]"}`}>
                            {up ? "+" : ""}
                            {r.changePct}%
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {mktLoad === "loading" && !displayRows.length && (
                  <li className="px-4 py-8 text-center text-sm text-[var(--landing-muted)]">
                    {t("home.loadingMkts")}
                  </li>
                )}
                {mktLoad === "error" && (
                  <li className="px-4 py-8 text-center text-sm text-[var(--landing-muted)]">
                    {t("home.marketsErr")}
                  </li>
                )}
                {mktLoad === "ok" && !displayRows.length && (
                  <li className="px-4 py-8 text-center text-sm text-[var(--landing-muted)]">
                    {t("home.marketsEmpty")}
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--landing-text)]">{t("home.news")}</h2>
                <span className="text-xs text-[var(--landing-muted)]">{t("home.newsView")}</span>
              </div>
              <ul className="space-y-3">
                {NEWS_KEYS.map((key) => (
                  <li key={key}>
                    <p className="text-xs leading-relaxed text-[var(--landing-muted)] hover:text-[var(--landing-text)]">
                      {t(key)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <TrustReserveSection />
        <LifestyleVideoRow />
        <TradeOnTheGoSection />

        {/* Trust strip */}
        <section className="mt-20 border-t border-[var(--landing-border)] pt-12">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-[var(--landing-muted)]">
            {t("home.trustNote")}
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {TRUST_STRIP.map((item) => (
              <div
                key={item.k}
                className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4 sm:text-start"
              >
                <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--landing-elevated)] text-lg font-bold text-[var(--landing-muted)] sm:mb-0">
                  {item.k}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--landing-text)]">{t(item.titleKey)}</p>
                  <p className="mt-1 text-xs text-[var(--landing-muted)]">{t(item.subKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
