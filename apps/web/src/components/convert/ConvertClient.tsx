"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { useLocale } from "@/i18n/LocaleProvider";

type RatesPayload = {
  updatedAt: string;
  usdPerUnit: Record<string, number>;
  fiatCodes: string[];
  cryptoCodes: string[];
  sources: { irt: string; fx: string; crypto: string };
  note: string;
  refreshedLive?: boolean;
};

export type ConvertClientProps = {
  /** Display serif for headline (e.g. Cormorant Garamond from `convert/page.tsx`). */
  displayFontClass?: string;
};

function parseAmount(raw: string): number {
  const s = raw.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!s) return 0;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : 0;
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ConvertTab = "fiat" | "crypto";

function pickDefaultFiatPair(codes: string[]): { from: string; to: string } {
  const from = codes.includes("USD") ? "USD" : codes[0];
  const to =
    codes.includes("IRT") && from !== "IRT" ? "IRT" : (codes.find((c) => c !== from) ?? codes[1]);
  return { from, to };
}

function pickDefaultCryptoPair(codes: string[]): { from: string; to: string } {
  const from = codes.includes("BTC") ? "BTC" : codes[0];
  const to =
    codes.includes("ETH") && from !== "ETH" ? "ETH" : (codes.find((c) => c !== from) ?? codes[1]);
  return { from, to };
}

export function ConvertClient({ displayFontClass }: ConvertClientProps) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ratesBusy, setRatesBusy] = useState(false);
  const [tab, setTab] = useState<ConvertTab>("fiat");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("IRT");
  const [amountIn, setAmountIn] = useState("100");

  const loadRates = useCallback(async () => {
    setRatesBusy(true);
    setLoadErr(null);
    try {
      const r = await fetch("/api/convert/rates?refresh=1", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as RatesPayload;
      setData(j);
      setLoadErr(null);
    } catch {
      setLoadErr(t("convertPage.errLoad"));
    } finally {
      setRatesBusy(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  const fiatList = useMemo(() => {
    if (!data) return [] as string[];
    return [...data.fiatCodes].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const cryptoList = useMemo(() => {
    if (!data) return [] as string[];
    return [...data.cryptoCodes].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const tabCodes = tab === "fiat" ? fiatList : cryptoList;

  useEffect(() => {
    if (!data || tabCodes.length < 2) return;
    const inTab = (c: string) => tabCodes.includes(c);
    const valid = inTab(from) && inTab(to) && from !== to;
    if (valid) return;
    const { from: f, to: t0 } =
      tab === "fiat" ? pickDefaultFiatPair(tabCodes) : pickDefaultCryptoPair(tabCodes);
    setFrom(f);
    setTo(t0);
    setAmountIn(tab === "fiat" ? "100" : "1");
  }, [tab, data, tabCodes, from, to]);

  const swap = useCallback(() => {
    const prevFrom = from;
    const prevTo = to;
    setFrom(prevTo);
    setTo(prevFrom);
    setAmountIn((prev) => {
      const v = parseAmount(prev);
      if (!data || v <= 0) return prev;
      const uf = data.usdPerUnit[prevFrom];
      const ut = data.usdPerUnit[prevTo];
      if (!uf || !ut) return prev;
      const out = (v * uf) / ut;
      return formatOut(prevTo, out);
    });
  }, [from, to, data]);

  const outVal = useMemo(() => {
    if (!data) return 0;
    const amt = parseAmount(amountIn);
    const uf = data.usdPerUnit[from];
    const ut = data.usdPerUnit[to];
    if (!amt || !uf || !ut) return 0;
    return (amt * uf) / ut;
  }, [data, amountIn, from, to]);

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
    if (["USD", "USDT", "GBP", "EUR", "AED", "GEL", "PKR", "INR", "TRY", "PLN"].includes(code))
      return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 6 }).format(v);
    return nfDetail.format(v).slice(0, 14);
  };

  const titleFont = displayFontClass ?? "";

  return (
    <div className="relative isolate min-h-[calc(100dvh-var(--header-h)-6rem)] w-full min-w-0 pb-28 pt-10 sm:pt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(560px,75vh)] opacity-[0.85]"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% -15%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 58%), radial-gradient(ellipse 80% 50% at 100% 20%, color-mix(in srgb, var(--brand-navy-mid) 35%, transparent), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 -z-10 h-px opacity-60 sm:inset-x-24"
        style={{
          background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 45%, transparent), transparent)",
        }}
      />

      <div className="mx-auto w-full max-w-md px-5 sm:max-w-lg sm:px-6">
        <Link
          href="/"
          className="inline-block text-[13px] font-medium tracking-wide text-[var(--muted)] transition-colors duration-300 hover:text-[var(--accent)]"
        >
          {t("convertPage.back")}
        </Link>

        <header className="mt-8 sm:mt-10">
          <h1
            className={`text-[2.125rem] font-semibold leading-[1.08] tracking-[0.03em] text-[var(--text)] sm:text-[2.75rem] ${titleFont}`.trim()}
          >
            {t("convertPage.title")}
          </h1>
          <p className="mt-5 max-w-[26rem] text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">{t("convertPage.sub")}</p>
        </header>

        {loadErr ? (
          <p className="mt-8 text-sm text-[var(--sell)]" role="alert">
            {loadErr}
          </p>
        ) : null}

        <div
          className="mt-10 flex rounded-2xl p-1"
          style={{
            background: "color-mix(in srgb, var(--bg-elevated) 100%, transparent)",
            boxShadow: "0 0 0 1px var(--border)",
          }}
          role="tablist"
          aria-label={t("convertPage.title")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "fiat"}
            disabled={fiatList.length < 2}
            onClick={() => setTab("fiat")}
            className={`relative flex-1 rounded-xl py-3 text-sm font-semibold tracking-wide transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === "fiat" ? "text-[var(--gold-ink)]" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={
              tab === "fiat"
                ? {
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, #fff 8%), var(--accent))",
                    boxShadow: "0 1px 0 color-mix(in srgb, #fff 35%, transparent), 0 8px 24px -6px color-mix(in srgb, var(--accent) 45%, transparent)",
                  }
                : undefined
            }
          >
            {t("convertPage.tabFiat")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "crypto"}
            disabled={cryptoList.length < 2}
            onClick={() => setTab("crypto")}
            className={`relative flex-1 rounded-xl py-3 text-sm font-semibold tracking-wide transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === "crypto" ? "text-[var(--gold-ink)]" : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            style={
              tab === "crypto"
                ? {
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, #fff 8%), var(--accent))",
                    boxShadow: "0 1px 0 color-mix(in srgb, #fff 35%, transparent), 0 8px 24px -6px color-mix(in srgb, var(--accent) 45%, transparent)",
                  }
                : undefined
            }
          >
            {t("convertPage.tabCrypto")}
          </button>
        </div>

        <div
          role="tabpanel"
          className={`mt-6 rounded-[1.75rem] border p-7 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.28)] sm:p-9 ${ratesBusy && !data ? "opacity-60" : ""} `}
          style={{
            borderColor: "color-mix(in srgb, var(--text) 9%, var(--border))",
            background: "color-mix(in srgb, var(--panel) 92%, var(--bg))",
            boxShadow:
              "0 32px 64px -16px rgba(0,0,0,0.28), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent) inset",
          }}
        >
          <div className="flex flex-col gap-8">
            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-dim)]">
                {t("convertPage.from")}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 sm:gap-4">
                  <div className="flex shrink-0 items-center ps-1">
                    <CurrencyIcon code={from} size={36} className="opacity-95 ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-2xl font-medium tracking-tight text-[var(--text)] outline-none placeholder:text-[var(--muted-dim)]"
                    placeholder="0"
                    aria-label={t("convertPage.amount")}
                  />
                </div>
                <select
                  value={from}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFrom(v);
                    if (v === to) {
                      const alt = tabCodes.find((c) => c !== v);
                      if (alt) setTo(alt);
                    }
                  }}
                  className="w-full shrink-0 cursor-pointer rounded-2xl border-0 px-4 py-3.5 text-sm font-medium text-[var(--text)] outline-none sm:w-[8.5rem]"
                  style={{
                    background: "color-mix(in srgb, var(--bg-elevated) 100%, transparent)",
                    boxShadow: "0 0 0 1px var(--border)",
                  }}
                >
                  {tabCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {from === "IRT" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {["1000000", "5000000", "10000000"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmountIn(p)}
                      className="rounded-full px-4 py-2 text-xs font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--text)]"
                      style={{
                        background: "color-mix(in srgb, var(--bg-elevated) 100%, transparent)",
                        boxShadow: "0 0 0 1px var(--border)",
                      }}
                    >
                      {nfIrt.format(Number.parseInt(p, 10))} {t("convertPage.toman")}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swap}
                className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--accent)] transition-transform duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "color-mix(in srgb, var(--accent) 12%, var(--panel))",
                  boxShadow:
                    "0 0 0 1px color-mix(in srgb, var(--accent) 35%, var(--border)), 0 12px 32px -8px color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
                title={t("convertPage.swap")}
                aria-label={t("convertPage.swap")}
              >
                <SwapIcon />
              </button>
            </div>

            <div>
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-dim)]">
                {t("convertPage.to")}
              </label>
              <div
                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl px-4 py-3 sm:gap-4 sm:px-5"
                style={{
                  background: "color-mix(in srgb, var(--bg-elevated) 100%, transparent)",
                  boxShadow: "0 0 0 1px var(--border)",
                }}
              >
                <CurrencyIcon code={to} size={36} className="shrink-0 opacity-95 ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]" />
                <p
                  className={`min-w-0 flex-1 text-2xl font-semibold tracking-tight text-[var(--text)] tabular-nums sm:text-[1.65rem] ${ratesBusy ? "opacity-45" : ""}`}
                >
                  {data ? fmtResult(to, outVal) : "—"}
                </p>
                <select
                  value={to}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTo(v);
                    if (v === from) {
                      const alt = tabCodes.find((c) => c !== v);
                      if (alt) setFrom(alt);
                    }
                  }}
                  className="max-w-[6.5rem] shrink-0 cursor-pointer border-0 bg-transparent py-1 text-sm font-medium text-[var(--muted)] outline-none"
                >
                  {tabCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {data?.cryptoCodes.includes(to) ? (
            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
              <Link
                href={`/trade?symbol=${encodeURIComponent(`${to}USDT`)}`}
                className="text-sm font-medium text-[var(--muted)] transition-colors duration-300 hover:text-[var(--accent)]"
              >
                {t("convertPage.openTrade")} · {to}/USDT
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatOut(code: string, v: number): string {
  if (code === "IRT") return String(Math.round(v));
  if (v >= 1) return v.toFixed(6).replace(/\.?0+$/, "");
  return v.toFixed(8).replace(/\.?0+$/, "");
}
