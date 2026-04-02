"use client";

import { useMemo } from "react";
import { useLocale } from "@/i18n/LocaleProvider";

export type BookLevel = { p: string; q: string };

type BookSnap = {
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
  ts: number;
};

function Row({
  price,
  qty,
  side,
  depthPct,
}: {
  price: string;
  qty: string;
  side: "bid" | "ask";
  depthPct: number;
}) {
  const bg =
    side === "bid"
      ? "linear-gradient(90deg, var(--buy-bg) 0%, transparent 100%)"
      : "linear-gradient(90deg, var(--sell-bg) 0%, transparent 100%)";
  return (
    <div className="relative grid grid-cols-[1fr_1fr] gap-2 py-[3px] pl-2 pr-2 font-mono text-[11px]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 opacity-90"
        style={{
          width: `${Math.min(100, depthPct)}%`,
          background: bg,
        }}
      />
      <span
        className={`relative z-[1] text-start ${side === "bid" ? "text-[var(--buy)]" : "text-[var(--sell)]"}`}
      >
        {price}
      </span>
      <span className="relative z-[1] text-end text-[var(--muted)]">{qty}</span>
    </div>
  );
}

export function OrderBookPanel({ book, rows = 14 }: { book: BookSnap | null; rows?: number }) {
  const { t } = useLocale();
  const { maxQ, asksDisplay, bidsDisplay } = useMemo(() => {
    const askSlice = (book?.asks ?? []).slice(0, rows);
    const bidSlice = (book?.bids ?? []).slice(0, rows);
    const asksRev = [...askSlice].reverse();
    const allQ = [...askSlice, ...bidSlice].map((x) => Number.parseFloat(x.q) || 0);
    const maxQ = Math.max(1e-12, ...allQ);
    return { maxQ, asksDisplay: asksRev, bidsDisplay: bidSlice };
  }, [book, rows]);

  return (
    <div className="flex h-full min-h-[320px] flex-col border border-[var(--border)] bg-[var(--panel)] sm:min-h-[400px] lg:min-h-[calc(100vh-220px)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-2 py-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {t("terminal.obTitle")}
        </span>
        <span className="font-mono text-[10px] text-[var(--muted-dim)]">{t("terminal.obAgg")}</span>
      </div>
      <div className="grid grid-cols-2 border-b border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted-dim)]">
        <span>{t("terminal.price")}</span>
        <span className="text-end">{t("terminal.obSize")}</span>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {asksDisplay.map((a) => (
            <Row
              key={`ask-${a.p}`}
              price={a.p}
              qty={a.q}
              side="ask"
              depthPct={((Number.parseFloat(a.q) || 0) / maxQ) * 100}
            />
          ))}
          {!asksDisplay.length && (
            <div className="py-8 text-center font-mono text-[10px] text-[var(--muted-dim)]">
              {t("terminal.obNoAsks")}
            </div>
          )}
        </div>
        <div className="border-y border-[var(--border-strong)] bg-[var(--bg-elevated)] py-1.5 text-center font-mono text-[10px] text-[var(--accent)]">
          {t("terminal.obSpread")}
        </div>
        <div className="flex-1 overflow-y-auto">
          {bidsDisplay.map((b) => (
            <Row
              key={`bid-${b.p}`}
              price={b.p}
              qty={b.q}
              side="bid"
              depthPct={((Number.parseFloat(b.q) || 0) / maxQ) * 100}
            />
          ))}
          {!bidsDisplay.length && (
            <div className="py-8 text-center font-mono text-[10px] text-[var(--muted-dim)]">
              {t("terminal.obNoBids")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
