"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export type TapeRow = {
  id: string;
  time: string;
  side: "buy" | "sell";
  price: string;
  qty: string;
};

export function ActivityTape({ rows }: { rows: TapeRow[] }) {
  const { t } = useLocale();
  return (
    <div className="border border-[var(--border)] bg-[var(--panel)]">
      <div className="border-b border-[var(--border)] px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
        {t("terminal.trades")}
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 border-b border-[var(--border)] px-3 py-1 font-mono text-[10px] text-[var(--muted-dim)]">
        <span>{t("terminal.time")}</span>
        <span>{t("terminal.side")}</span>
        <span className="text-end">{t("terminal.price")}</span>
        <span className="text-end">{t("terminal.qty")}</span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {rows.length === 0 ? (
          <div className="py-6 text-center font-mono text-[10px] text-[var(--muted-dim)]">
            {t("terminal.tapeEmpty")}
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 border-b border-[var(--border)]/50 px-3 py-1.5 font-mono text-[11px] last:border-0"
            >
              <span className="text-[var(--muted-dim)]">{r.time}</span>
              <span className={r.side === "buy" ? "text-[var(--buy)]" : "text-[var(--sell)]"}>
                {r.side.toUpperCase()}
              </span>
              <span className="text-end text-[var(--text)]">{r.price}</span>
              <span className="text-end text-[var(--muted)]">{r.qty}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
