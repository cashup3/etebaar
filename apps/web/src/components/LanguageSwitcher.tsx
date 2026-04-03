"use client";

import type { Locale } from "@/i18n/types";
import { useLocale } from "@/i18n/LocaleProvider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  function pill(l: Locale, label: string) {
    const on = locale === l;
    return (
      <button
        type="button"
        onClick={() => setLocale(l)}
        className={`touch-manipulation rounded-md px-2 py-1 text-xs font-medium transition-colors ${
          on
            ? "bg-[var(--gold-dim)] text-[var(--gold)]"
            : "text-[var(--landing-muted)] hover:text-[var(--nav-icon)]"
        }`}
        aria-pressed={on}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-md border border-[var(--landing-border)] p-0.5 ${className ?? ""}`}
      role="group"
      aria-label={t("lang.switch")}
    >
      {pill("en", "EN")}
      {pill("fa", "فا")}
    </div>
  );
}
