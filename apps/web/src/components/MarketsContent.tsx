"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CryptoIcon } from "@/components/CryptoIcon";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { CurrencyPreviewDrawer, type FiatPreviewRow } from "@/components/CurrencyPreviewDrawer";
import { MarketingBanner } from "@/components/landing/MarketingBanner";
import { MarketPreviewDrawer, type PreviewTicker } from "@/components/MarketPreviewDrawer";
import { useLocale } from "@/i18n/LocaleProvider";
import { FIAT_WIDGET_ORDER } from "@/data/fiatWidgetOrder";
import { formatToman } from "@/lib/formatToman";
import { pairBaseAsset } from "@/lib/marketSymbol";

type Ticker = PreviewTicker;

export function MarketsContent() {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<"fiat" | "crypto">("fiat");
  const [rows, setRows] = useState<Ticker[]>([]);
  const [usdPerUnit, setUsdPerUnit] = useState<Record<string, number> | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [convertErr, setConvertErr] = useState<string | null>(null);
  const [cryptoPreview, setCryptoPreview] = useState<Ticker | null>(null);
  const [fiatPreview, setFiatPreview] = useState<FiatPreviewRow | null>(null);

  useEffect(() => {
    void fetch("/api/market/tickers?quote=USDT")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: { tickers: Ticker[] }) => setRows(j.tickers ?? []))
      .catch(() => setErr(t("markets.err")));
  }, [t]);

  useEffect(() => {
    void fetch("/api/convert/rates")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: { usdPerUnit?: Record<string, number> }) => {
        setUsdPerUnit(j.usdPerUnit ?? null);
        setConvertErr(null);
      })
      .catch(() => {
        setUsdPerUnit(null);
        setConvertErr(t("convertPage.errLoad"));
      });
  }, [t]);

  const fiatRows = useMemo(() => {
    if (!usdPerUnit) return [];
    const irt = usdPerUnit.IRT;
    if (typeof irt !== "number" || !Number.isFinite(irt) || irt <= 0) return [];
    const out: FiatPreviewRow[] = [];
    for (const code of FIAT_WIDGET_ORDER) {
      const u = usdPerUnit[code];
      if (typeof u !== "number" || !Number.isFinite(u) || u <= 0) continue;
      const tomanPerUnit = u / irt;
      if (!Number.isFinite(tomanPerUnit) || tomanPerUnit <= 0) continue;
      out.push({ code, tomanPerUnit });
    }
    return out;
  }, [usdPerUnit]);

  const filteredCrypto = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return rows;
    return rows.filter((r) => r.symbol.includes(s));
  }, [rows, q]);

  const filteredFiat = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return fiatRows;
    return fiatRows.filter((r) => r.code.includes(s));
  }, [fiatRows, q]);

  const openCryptoPreview = useCallback((row: Ticker) => {
    setCryptoPreview(row);
  }, []);

  const closeCryptoPreview = useCallback(() => {
    setCryptoPreview(null);
  }, []);

  const openFiatPreview = useCallback((row: FiatPreviewRow) => {
    setFiatPreview(row);
  }, []);

  const closeFiatPreview = useCallback(() => {
    setFiatPreview(null);
  }, []);

  const currencyNames = useMemo(
    () => new Intl.DisplayNames(locale === "fa" ? "fa-IR" : "en-US", { type: "currency" }),
    [locale],
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1920px] space-y-4 px-3 pb-16 pt-4 sm:px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-2 inline-block font-sans text-xs text-[var(--muted)] hover:text-[var(--accent)]"
          >
            {t("markets.backHome")}
          </Link>
          <h1 className="font-mono text-xl font-semibold tracking-tight text-[var(--text)]">{t("markets.title")}</h1>
          <p className="mt-1 max-w-xl font-mono text-[11px] text-[var(--muted)]">
            {tab === "crypto" ? t("markets.sub") : t("markets.subFiat")}
          </p>
          <p className="mt-2 font-mono text-[10px] text-[var(--muted-dim)]">
            {tab === "crypto" ? t("markets.rowHint") : t("markets.rowHintFiat")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <div className="flex gap-1 border border-[var(--border)] bg-[var(--panel)] p-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setTab("fiat")}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                tab === "fiat" ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("markets.tabCurrencies")}
            </button>
            <button
              type="button"
              onClick={() => setTab("crypto")}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${
                tab === "crypto" ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("markets.tabCrypto")}
            </button>
          </div>
          <input
            placeholder={t("markets.searchPh")}
            className="w-full max-w-xs border border-[var(--border)] bg-[var(--panel)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] sm:w-72"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {tab === "crypto" && err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}
      {tab === "fiat" && convertErr && <p className="font-mono text-xs text-[var(--sell)]">{convertErr}</p>}

      {tab === "crypto" && (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
          <table className="w-full min-w-[800px] text-start font-mono text-[11px]">
            <thead className="border-b border-[var(--border)] text-[var(--muted-dim)]">
              <tr>
                <th className="px-3 py-2 font-medium">{t("markets.pair")}</th>
                <th className="px-3 py-2 font-medium">{t("markets.priceIrt")}</th>
                <th className="px-3 py-2 font-medium">{t("markets.chg")}</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">{t("markets.highIrt")}</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">{t("markets.lowIrt")}</th>
                <th className="px-3 py-2 font-medium">{t("markets.vol")}</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filteredCrypto.map((r) => {
                const ch = Number.parseFloat(r.changePct);
                const col =
                  Number.isNaN(ch) || ch >= 0 ? "text-[var(--buy)]" : "text-[var(--sell)]";
                const base = pairBaseAsset(r.symbol);
                return (
                  <tr
                    key={r.symbol}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCryptoPreview(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCryptoPreview(r);
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
                    <td className="px-3 py-2.5 text-[var(--text)]">
                      <span className="block font-semibold tabular-nums">{formatToman(r.lastIrt ?? null, locale)}</span>
                      <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--muted-dim)]">
                        {t("markets.usdtRef")} {r.last}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 tabular-nums ${col}`}>{r.changePct}%</td>
                    <td className="hidden px-3 py-2.5 tabular-nums text-[var(--muted)] lg:table-cell">
                      {formatToman(r.highIrt ?? null, locale)}
                    </td>
                    <td className="hidden px-3 py-2.5 tabular-nums text-[var(--muted)] lg:table-cell">
                      {formatToman(r.lowIrt ?? null, locale)}
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
          {!filteredCrypto.length && !err && (
            <p className="p-6 text-center font-mono text-[11px] text-[var(--muted)]">{t("markets.empty")}</p>
          )}
        </div>
      )}

      {tab === "fiat" && (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--panel)]">
          <table className="w-full min-w-[560px] text-start font-mono text-[11px]">
            <thead className="border-b border-[var(--border)] text-[var(--muted-dim)]">
              <tr>
                <th className="px-3 py-2 font-medium">{t("markets.pair")}</th>
                <th className="px-3 py-2 font-medium">{t("markets.priceIrt")}</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filteredFiat.map((r) => {
                let label: string;
                try {
                  label = currencyNames.of(r.code) ?? r.code;
                } catch {
                  label = r.code;
                }
                return (
                  <tr
                    key={r.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => openFiatPreview(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFiatPreview(r);
                      }
                    }}
                    className="cursor-pointer border-b border-[var(--border)]/80 transition-colors hover:bg-[var(--panel-hover)] focus-visible:bg-[var(--panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
                  >
                    <td className="px-3 py-2.5 text-[var(--text)]">
                      <div className="flex items-center gap-2.5">
                        <CurrencyIcon code={r.code} size={28} className="ring-1 ring-[var(--border)]" />
                        <div className="min-w-0">
                          <span className="font-semibold">{r.code}</span>
                          <p className="truncate text-[10px] text-[var(--muted-dim)]">{label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text)]">
                      <span className="block font-semibold tabular-nums">
                        {formatToman(Math.round(r.tomanPerUnit), locale)}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[var(--muted-dim)]">{t("home.fiatHint")}</span>
                    </td>
                    <td className="px-3 py-2.5 text-end">
                      <Link
                        href="/convert"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex rounded border border-[var(--border)] px-2 py-1 text-[var(--accent)] hover:border-[var(--border-strong)] hover:underline"
                      >
                        {t("home.viewAllConvert")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredFiat.length && !convertErr && (
            <p className="p-6 text-center font-mono text-[11px] text-[var(--muted)]">{t("markets.empty")}</p>
          )}
        </div>
      )}

      <MarketingBanner
        title={t("markets.bannerTitle")}
        subtitle={t("markets.bannerSub")}
        ctaHref="/login?signup=1"
        ctaLabel={t("markets.bannerCta")}
        variant="markets"
      />

      <MarketPreviewDrawer row={cryptoPreview} onClose={closeCryptoPreview} />
      <CurrencyPreviewDrawer row={fiatPreview} onClose={closeFiatPreview} />
    </div>
  );
}
