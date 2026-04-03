"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { useLocale } from "@/i18n/LocaleProvider";

function parseAmount(raw: string): number {
  const s = raw.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!s) return 0;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : 0;
}

function formatOutForSwap(code: string, v: number): string {
  if (code === "IRT") return String(Math.round(v));
  if (v >= 1) return v.toFixed(6).replace(/\.?0+$/, "");
  return v.toFixed(8).replace(/\.?0+$/, "");
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type HomeCurrencyCalculatorProps = {
  /** Same `usdPerUnit` map as /api/convert/rates — single source of truth for dropdowns and math. */
  usdPerUnit: Record<string, number> | null;
  convertLoad: "loading" | "ok" | "error";
};

function codesFromUsdPerUnit(map: Record<string, number> | null): string[] {
  if (!map) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out.push(k);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function HomeCurrencyCalculator({ usdPerUnit, convertLoad }: HomeCurrencyCalculatorProps) {
  const { t, locale } = useLocale();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("IRT");
  const [amountIn, setAmountIn] = useState("100");

  const allCodes = useMemo(() => codesFromUsdPerUnit(usdPerUnit), [usdPerUnit]);

  const dataReady = convertLoad === "ok" && allCodes.length >= 2;

  useEffect(() => {
    if (allCodes.length < 2) return;
    const nextFrom = allCodes.includes(from)
      ? from
      : allCodes.includes("USD")
        ? "USD"
        : allCodes[0];
    const nextTo =
      allCodes.includes(to) && to !== nextFrom
        ? to
        : allCodes.includes("IRT") && nextFrom !== "IRT"
          ? "IRT"
          : (allCodes.find((c) => c !== nextFrom) ?? allCodes[1]);
    if (nextFrom !== from) setFrom(nextFrom);
    if (nextTo !== to) setTo(nextTo);
  }, [allCodes, from, to]);

  const swap = useCallback(() => {
    const prevFrom = from;
    const prevTo = to;
    setFrom(prevTo);
    setTo(prevFrom);
    setAmountIn((prev) => {
      const v = parseAmount(prev);
      if (!usdPerUnit || v <= 0) return prev;
      const uf = usdPerUnit[prevFrom];
      const ut = usdPerUnit[prevTo];
      if (!uf || !ut) return prev;
      const out = (v * uf) / ut;
      return formatOutForSwap(prevTo, out);
    });
  }, [from, to, usdPerUnit]);

  const { outVal, invRate, midUsd } = useMemo(() => {
    if (!usdPerUnit) return { outVal: 0, invRate: null as number | null, midUsd: null as number | null };
    const amt = parseAmount(amountIn);
    const uf = usdPerUnit[from];
    const ut = usdPerUnit[to];
    if (!amt || !uf || !ut) return { outVal: 0, invRate: null, midUsd: null };
    const usd = amt * uf;
    const out = usd / ut;
    return { outVal: out, invRate: ut / uf, midUsd: usd };
  }, [usdPerUnit, amountIn, from, to]);

  const nfDetail = useMemo(
    () =>
      new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: 12,
        minimumFractionDigits: 0,
      }),
    [locale],
  );

  const nfIrt = useMemo(
    () => new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 0 }),
    [locale],
  );

  const fmtResult = (code: string, v: number) => {
    if (code === "IRT") return nfIrt.format(v);
    if (["BTC", "ETH", "BNB"].includes(code)) return nfDetail.format(v).slice(0, 16);
    if (["USD", "USDT", "GBP", "EUR", "AED", "GEL"].includes(code))
      return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 6 }).format(v);
    return nfDetail.format(v).slice(0, 14);
  };

  const presetIRT = ["1000000", "5000000", "10000000"] as const;

  return (
    <div className="relative mt-10 w-full min-w-0 max-w-xl">
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.35rem] opacity-80"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--gold) 55%, transparent) 0%, transparent 42%, color-mix(in oklab, var(--gold) 25%, transparent) 100%)",
        }}
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.45)]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 0%, var(--gold) 0%, transparent 55%),
              radial-gradient(circle at 100% 100%, var(--gold) 0%, transparent 50%)`,
          }}
          aria-hidden
        />
        <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--landing-text)]">{t("home.calcTitle")}</h2>
              <p className="mt-1 max-w-[42ch] text-xs leading-relaxed text-[var(--landing-muted)]">
                {t("home.calcSub")}
              </p>
            </div>
            <Link
              href="/convert"
              className="shrink-0 rounded-full border border-[var(--landing-border)] bg-[var(--landing-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--landing-row-hover)]"
            >
              {t("home.calcFull")}
            </Link>
          </div>

          {convertLoad === "loading" && (
            <div className="space-y-3 animate-pulse" aria-busy="true">
              <div className="h-24 rounded-xl bg-[var(--landing-elevated)]" />
              <div className="flex justify-center">
                <div className="h-11 w-11 rounded-full bg-[var(--landing-elevated)]" />
              </div>
              <div className="h-24 rounded-xl bg-[var(--landing-elevated)]" />
            </div>
          )}

          {convertLoad === "error" && (
            <p className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-elevated)] px-4 py-6 text-center text-sm text-[var(--landing-muted)]">
              {t("convertPage.errLoad")}
            </p>
          )}

          {convertLoad === "ok" && !dataReady && (
            <p className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-elevated)] px-4 py-6 text-center text-sm text-[var(--landing-muted)]">
              {t("home.calcNoRates")}
            </p>
          )}

          {dataReady && (
            <div className="relative">
              <div className="rounded-t-2xl border border-b-0 border-[var(--landing-border)] bg-[var(--landing-elevated)]/80 p-4 sm:p-5">
                <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--landing-muted)]">
                  <CurrencyIcon code={from} size={22} className="ring-1 ring-[var(--landing-border)]" />
                  {t("convertPage.from")}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2.5 text-base font-semibold tabular-nums text-[var(--landing-text)] outline-none ring-0 transition-shadow focus:border-[var(--gold)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_22%,transparent)]"
                    placeholder="0"
                    aria-label={t("convertPage.amount")}
                  />
                  <select
                    value={from}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFrom(v);
                      if (v === to) {
                        const alt = allCodes.find((c) => c !== v);
                        if (alt) setTo(alt);
                      }
                    }}
                    className="min-h-[48px] w-full rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 text-sm font-semibold text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:w-[min(132px,40vw)]"
                  >
                    {allCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {from === "IRT" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {presetIRT.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAmountIn(p)}
                        className="rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] px-3 py-1 text-[11px] font-medium text-[var(--landing-muted)] transition-colors hover:border-[var(--gold)] hover:text-[var(--landing-text)]"
                      >
                        {nfIrt.format(Number.parseInt(p, 10))} {t("convertPage.toman")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative z-10 flex justify-center">
                <button
                  type="button"
                  onClick={swap}
                  className="-my-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--landing-card)] text-[var(--gold)] shadow-lg transition-[transform,box-shadow] hover:shadow-[0_8px_28px_-6px_color-mix(in_oklab,var(--gold)_50%,transparent)] motion-safe:hover:scale-105 motion-safe:active:scale-95"
                  title={t("convertPage.swap")}
                  aria-label={t("convertPage.swap")}
                >
                  <SwapIcon />
                </button>
              </div>

              <div className="rounded-b-2xl border border-t-0 border-[var(--landing-border)] bg-[var(--landing-elevated)]/80 p-4 sm:p-5">
                <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--landing-muted)]">
                  <CurrencyIcon code={to} size={22} className="ring-1 ring-[var(--landing-border)]" />
                  {t("convertPage.to")}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="min-h-[48px] min-w-0 flex-1 break-all rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2.5 text-xl font-bold tabular-nums leading-tight text-[var(--landing-text)] sm:text-2xl">
                    {fmtResult(to, outVal)}
                  </p>
                  <select
                    value={to}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTo(v);
                      if (v === from) {
                        const alt = allCodes.find((c) => c !== v);
                        if (alt) setFrom(alt);
                      }
                    }}
                    className="min-h-[48px] w-full rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 text-sm font-semibold text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:w-[min(132px,40vw)]"
                  >
                    {allCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {invRate != null && usdPerUnit ? (
                <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-[var(--landing-border)] pt-4 text-[11px] text-[var(--landing-muted)]">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <span>1</span>
                    <CurrencyIcon code={from} size={16} className="ring-1 ring-[var(--landing-border)]" />
                    <span>{from}</span>
                  </span>
                  <span className="text-[var(--landing-muted)]">≈</span>
                  <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-[var(--landing-text)]">
                    <span>{fmtResult(to, invRate)}</span>
                    <CurrencyIcon code={to} size={16} className="ring-1 ring-[var(--landing-border)]" />
                    <span>{to}</span>
                  </span>
                  {midUsd != null && midUsd > 0 ? (
                    <span className="w-full text-[10px] text-[var(--landing-muted)] sm:ms-2 sm:w-auto">
                      (~{nfDetail.format(midUsd)} USD)
                    </span>
                  ) : null}
                </p>
              ) : null}

              <p className="mt-3 text-[10px] leading-relaxed text-[var(--landing-muted)]">{t("home.calcDisclaimer")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
