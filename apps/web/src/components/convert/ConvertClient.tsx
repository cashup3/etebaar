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
  iranOpenMarket?: {
    label?: string;
    updatedAt?: string;
    rows: Array<{ label: string; buy?: number; sell?: number }>;
  };
};

function parseAmount(raw: string): number {
  const s = raw.replace(/,/g, "").replace(/\s/g, "").trim();
  if (!s) return 0;
  const x = Number.parseFloat(s);
  return Number.isFinite(x) ? x : 0;
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

export function ConvertClient() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [from, setFrom] = useState("IRT");
  const [to, setTo] = useState("USD");
  const [amountIn, setAmountIn] = useState("1000000");

  useEffect(() => {
    void fetch("/api/convert/rates")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: RatesPayload) => {
        setData(j);
        setLoadErr(null);
      })
      .catch(() => setLoadErr(t("convertPage.errLoad")));
  }, [t]);

  const allCodes = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    for (const c of data.fiatCodes) set.add(c);
    for (const c of data.cryptoCodes) set.add(c);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

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

  const { outVal, invRate, midUsd } = useMemo(() => {
    if (!data) return { outVal: 0, invRate: null as number | null, midUsd: null as number | null };
    const amt = parseAmount(amountIn);
    const uf = data.usdPerUnit[from];
    const ut = data.usdPerUnit[to];
    if (!amt || !uf || !ut) return { outVal: 0, invRate: null, midUsd: null };
    const usd = amt * uf;
    const out = usd / ut;
    const inv = ut / uf;
    return { outVal: out, invRate: inv, midUsd: usd };
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
    if (["BTC", "ETH", "BNB"].includes(code))
      return nfDetail.format(v).slice(0, 16);
    if (["USD", "USDT", "GBP", "EUR", "AED", "GEL"].includes(code))
      return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 6 }).format(v);
    return nfDetail.format(v).slice(0, 14);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-3 pb-20 pt-6 sm:px-4">
      <div>
        <Link href="/" className="mb-2 inline-block font-mono text-xs text-[var(--muted)] hover:text-[var(--accent)]">
          {t("convertPage.back")}
        </Link>
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-[var(--text)]">{t("convertPage.title")}</h1>
        <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed text-[var(--muted)]">{t("convertPage.sub")}</p>
      </div>

      {loadErr && <p className="font-mono text-xs text-[var(--sell)]">{loadErr}</p>}

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted-dim)]">
              {t("convertPage.from")}
            </label>
            <div className="flex items-stretch gap-2">
              <div className="flex shrink-0 items-center">
                <CurrencyIcon code={from} size={28} className="ring-1 ring-[var(--border)]" />
              </div>
              <div className="flex min-w-0 flex-1 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="min-w-0 flex-1 border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
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
                  className="w-[min(140px,42vw)] shrink-0 border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                >
                  {allCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {from === "IRT" && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["1000000", "5000000", "10000000"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmountIn(p)}
                    className="rounded border border-[var(--border)] px-2 py-0.5 font-mono text-[9px] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
                  >
                    {nfIrt.format(Number.parseInt(p, 10))} {t("convertPage.toman")}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center sm:pb-2">
            <button
              type="button"
              onClick={swap}
              className="rounded-full border border-[var(--border)] p-2.5 text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              title={t("convertPage.swap")}
              aria-label={t("convertPage.swap")}
            >
              <SwapIcon />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted-dim)]">
              {t("convertPage.to")}
            </label>
            <div className="flex min-h-[46px] items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
              <CurrencyIcon code={to} size={28} className="ring-1 ring-[var(--border)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold tabular-nums text-[var(--text)]">
                  {data ? fmtResult(to, outVal) : "—"}
                </p>
              </div>
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
                className="max-w-[100px] border-0 bg-transparent py-1 font-mono text-xs text-[var(--muted)] outline-none"
              >
                {allCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {invRate != null && data && (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-[var(--border)] pt-3 font-mono text-[10px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1">
              <span>1</span>
              <CurrencyIcon code={from} size={18} className="ring-1 ring-[var(--border)]" />
              <span>{from}</span>
            </span>
            <span>≈</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span>{fmtResult(to, invRate)}</span>
              <CurrencyIcon code={to} size={18} className="ring-1 ring-[var(--border)]" />
              <span>{to}</span>
            </span>
            {midUsd != null && midUsd > 0 ? (
              <span className="ms-2 text-[var(--muted-dim)]">
                (~{nfDetail.format(midUsd)} USD)
              </span>
            ) : null}
          </p>
        )}

        {data?.cryptoCodes.includes(to) && (
          <div className="border-t border-[var(--border)] pt-3">
            <Link
              href={`/trade?symbol=${encodeURIComponent(`${to}USDT`)}`}
              className="inline-flex items-center gap-2 font-mono text-[11px] font-medium text-[var(--accent)] hover:underline"
            >
              {t("convertPage.openTrade")} ({to}/USDT)
            </Link>
          </div>
        )}
      </div>

      {data?.iranOpenMarket && data.iranOpenMarket.rows.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-dim)]">
            {t("convertPage.iranPanelTitle")}
          </p>
          {data.iranOpenMarket.label ? (
            <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">{data.iranOpenMarket.label}</p>
          ) : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[280px] text-start font-mono text-[10px]">
              <thead className="border-b border-[var(--border)] text-[var(--muted-dim)]">
                <tr>
                  <th className="py-1.5 pe-2 font-medium">{locale === "fa" ? "نام" : "Item"}</th>
                  <th className="py-1.5 pe-2 font-medium">{t("convertPage.iranBuy")}</th>
                  <th className="py-1.5 font-medium">{t("convertPage.iranSell")}</th>
                </tr>
              </thead>
              <tbody>
                {data.iranOpenMarket.rows.map((r) => (
                  <tr key={r.label} className="border-b border-[var(--border)]/60">
                    <td className="py-1.5 pe-2 text-[var(--text)]">{r.label}</td>
                    <td className="py-1.5 pe-2 tabular-nums text-[var(--muted)]">
                      {r.buy != null ? nfIrt.format(Math.round(r.buy)) : "—"}
                    </td>
                    <td className="py-1.5 tabular-nums text-[var(--muted)]">
                      {r.sell != null ? nfIrt.format(Math.round(r.sell)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.iranOpenMarket.updatedAt ? (
            <p className="mt-2 font-mono text-[9px] text-[var(--muted-dim)]">
              {t("convertPage.updated")}{" "}
              {new Date(data.iranOpenMarket.updatedAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatOut(code: string, v: number): string {
  if (code === "IRT") return String(Math.round(v));
  if (v >= 1) return v.toFixed(6).replace(/\.?0+$/, "");
  return v.toFixed(8).replace(/\.?0+$/, "");
}
