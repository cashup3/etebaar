"use client";

import { useLocale } from "@/i18n/LocaleProvider";

type Side = "BUY" | "SELL";

export function OrderTicket({
  side,
  onSide,
  price,
  onPrice,
  amount,
  onAmount,
  onSubmit,
  busy,
  message,
}: {
  side: Side;
  onSide: (s: Side) => void;
  price: string;
  onPrice: (v: string) => void;
  amount: string;
  onAmount: (v: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  message: string | null;
}) {
  const { t } = useLocale();
  const buyActive = side === "BUY";
  return (
    <div className="flex h-full min-h-[320px] flex-col border border-[var(--border)] bg-[var(--panel)] sm:min-h-[400px] lg:min-h-[calc(100vh-220px)]">
      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => onSide("BUY")}
          className={`flex-1 py-2.5 font-mono text-xs font-semibold transition-colors ${
            buyActive
              ? "bg-[var(--buy-bg)] text-[var(--buy)]"
              : "text-[var(--muted)] hover:bg-[var(--panel-hover)]"
          }`}
        >
          {t("terminal.buy")}
        </button>
        <button
          type="button"
          onClick={() => onSide("SELL")}
          className={`flex-1 py-2.5 font-mono text-xs font-semibold transition-colors ${
            !buyActive
              ? "bg-[var(--sell-bg)] text-[var(--sell)]"
              : "text-[var(--muted)] hover:bg-[var(--panel-hover)]"
          }`}
        >
          {t("terminal.sell")}
        </button>
      </div>
      <div className="flex gap-1 border-b border-[var(--border)] p-2">
        <span className="rounded bg-[var(--accent-dim)] px-2 py-1 font-mono text-[10px] text-[var(--accent)]">
          {t("terminal.limit")}
        </span>
        <span className="rounded px-2 py-1 font-mono text-[10px] text-[var(--muted-dim)]">{t("terminal.market")}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--muted-dim)]">
            {t("terminal.price")}
          </span>
          <input
            className="mt-1 w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            value={price}
            onChange={(e) => onPrice(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--muted-dim)]">
            {t("terminal.amount")}
          </span>
          <input
            className="mt-1 w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            value={amount}
            onChange={(e) => onAmount(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          {["25", "50", "75", "100"].map((pct) => (
            <button
              key={pct}
              type="button"
              className="flex-1 rounded border border-[var(--border)] py-1.5 font-mono text-[10px] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            >
              {pct}%
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className={`mt-auto w-full py-3 font-mono text-sm font-semibold transition-opacity disabled:opacity-50 ${
            buyActive
              ? "bg-[var(--buy)] text-[var(--bg)] hover:brightness-110"
              : "bg-[var(--sell)] text-white hover:brightness-110"
          }`}
        >
          {buyActive ? t("terminal.placeBuy") : t("terminal.placeSell")}
        </button>
        {message && (
          <p className="font-mono text-[10px] leading-snug text-[var(--muted)]">{message}</p>
        )}
      </div>
    </div>
  );
}
