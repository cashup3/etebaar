"use client";

import { Suspense } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { TradeTerminal } from "./TradeTerminal";

export function TradePageShell() {
  const { t } = useLocale();
  return (
    <Suspense
      fallback={
        <div className="p-8 font-mono text-sm text-[var(--muted)]">{t("terminal.loading")}</div>
      }
    >
      <TradeTerminal />
    </Suspense>
  );
}
