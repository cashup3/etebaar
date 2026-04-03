"use client";

import { CryptoIcon } from "@/components/CryptoIcon";
import { useLocale } from "@/i18n/LocaleProvider";

type BookSnap = {
  bids: { p: string; q: string }[];
  asks: { p: string; q: string }[];
  ts: number;
};

export type TickerStats = {
  last: string;
  changePct: string;
  high: string;
  low: string;
  volume: string;
};

function fmt(n: string | undefined) {
  if (n === undefined) return "—";
  const x = Number.parseFloat(n);
  if (Number.isNaN(x)) return n;
  return x.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function fmtPct(s: string | undefined) {
  if (s === undefined) return "—";
  const x = Number.parseFloat(s);
  if (Number.isNaN(x)) return s;
  const sign = x >= 0 ? "+" : "";
  return `${sign}${x.toFixed(2)}%`;
}

export function InstrumentBar({
  base,
  quote,
  book,
  ticker,
}: {
  base: string;
  quote: string;
  book: BookSnap | null;
  ticker: TickerStats | null;
}) {
  const { t } = useLocale();
  const bestBid = book?.bids?.[0]?.p;
  const bestAsk = book?.asks?.[0]?.p;
  let mid: string | null = null;
  if (bestBid && bestAsk) {
    const b = Number.parseFloat(bestBid);
    const a = Number.parseFloat(bestAsk);
    if (!Number.isNaN(b) && !Number.isNaN(a)) {
      mid = ((b + a) / 2).toFixed(8);
    }
  }

  const ref = ticker?.last ?? mid;
  const ch = ticker?.changePct;
  const chNum = ch !== undefined ? Number.parseFloat(ch) : NaN;
  const chColor =
    !Number.isNaN(chNum) && chNum >= 0 ? "text-[var(--buy)]" : "text-[var(--sell)]";

  return (
    <div className="mb-2 w-full min-w-0 space-y-2 border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CryptoIcon symbol={base} size={36} className="ring-1 ring-[var(--border)]" />
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-base font-semibold tracking-tight text-[var(--text)]">
              {base}
              <span className="text-[var(--muted)]">/{quote}</span>
            </span>
            <span className="font-mono text-lg font-semibold text-[var(--accent)]">
              {ref ? fmt(ref) : "—"}
            </span>
            <span className={`font-mono text-sm ${chColor}`}>{fmtPct(ch)}</span>
            <span className="font-mono text-[10px] text-[var(--muted-dim)]">{t("terminal.ref24h")}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-[11px] text-[var(--muted)]">
          <div>
            <span className="text-[var(--muted-dim)]">{t("terminal.bid")}</span>{" "}
            <span className="text-[var(--buy)]">{fmt(bestBid)}</span>
          </div>
          <div>
            <span className="text-[var(--muted-dim)]">{t("terminal.ask")}</span>{" "}
            <span className="text-[var(--sell)]">{fmt(bestAsk)}</span>
          </div>
          <div>
            <span className="text-[var(--muted-dim)]">{t("terminal.book")}</span>{" "}
            {book ? new Date(book.ts).toLocaleTimeString() : "—"}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--border)] pt-2 font-mono text-[10px] text-[var(--muted)]">
        <span>
          <span className="text-[var(--muted-dim)]">{t("terminal.h24")}</span> {fmt(ticker?.high)}
        </span>
        <span>
          <span className="text-[var(--muted-dim)]">{t("terminal.l24")}</span> {fmt(ticker?.low)}
        </span>
        <span>
          <span className="text-[var(--muted-dim)]">
            {t("terminal.v24")} ({quote})
          </span>{" "}
          {ticker?.volume ? fmt(ticker.volume) : "—"}
        </span>
        <span className="text-[var(--muted-dim)]">
          {t("terminal.midBook")} {mid ? fmt(mid) : "—"}
        </span>
      </div>
    </div>
  );
}
