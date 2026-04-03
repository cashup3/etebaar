"use client";

import { useLocale } from "@/i18n/LocaleProvider";

const STAT_KEYS = [
  { valueKey: "trust.s1v", unitKey: "trust.s1u", descKey: "trust.s1d" },
  { valueKey: "trust.s2v", unitKey: "trust.s2u", descKey: "trust.s2d" },
  { valueKey: "trust.s3v", unitKey: "trust.s3u", descKey: "trust.s3d" },
] as const;

export function TrustReserveSection() {
  const { t } = useLocale();
  return (
    <section
      className="mt-16 w-full min-w-0 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] px-5 py-10 sm:mt-20 sm:px-8 sm:py-12"
      aria-labelledby="trust-reserve-heading"
    >
      <div className="grid min-w-0 gap-10 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-center lg:gap-14">
        <div>
          <h2
            id="trust-reserve-heading"
            className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight tracking-tight"
          >
            <span className="text-[var(--landing-text)]">{t("trust.titleA")}</span>
            <span className="text-[var(--gold)]">{t("trust.titleB")}</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)]">{t("trust.body")}</p>
        </div>
        <div className="grid min-w-0 gap-6 sm:grid-cols-3 lg:gap-4">
          {STAT_KEYS.map((s) => (
            <div
              key={s.unitKey}
              className="min-w-0 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg)]/80 px-4 py-5"
            >
              <p className="break-words text-2xl font-bold tabular-nums text-[var(--gold)] sm:text-xl lg:text-2xl">
                {t(s.valueKey)}{" "}
                <span className="text-lg font-semibold text-[var(--landing-text)]">{t(s.unitKey)}</span>
              </p>
              {t(s.descKey).trim() ? (
                <p className="mt-2 text-[10px] leading-snug text-[var(--landing-muted)]">{t(s.descKey)}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
