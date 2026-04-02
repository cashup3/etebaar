"use client";

import Image from "next/image";
import Link from "next/link";
import { STOCK } from "@/components/landing/stockPhotos";
import { useLocale } from "@/i18n/LocaleProvider";

export function TradeOnTheGoSection() {
  const { t } = useLocale();
  return (
    <section
      className="mt-16 grid gap-10 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] px-5 py-10 sm:mt-20 sm:px-8 sm:py-12 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-12"
      aria-labelledby="trade-go-heading"
    >
      <div className="relative mx-auto w-full max-w-[280px] lg:order-2 lg:mx-0">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl border border-[var(--landing-border)] shadow-2xl shadow-black/40">
          <Image
            src={STOCK.phone}
            alt=""
            fill
            className="object-cover"
            sizes="280px"
          />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
        </div>
      </div>
      <div className="lg:order-1">
        <h2 id="trade-go-heading" className="text-2xl font-bold text-[var(--landing-text)] sm:text-3xl">
          {t("tradeGo.title")}
        </h2>
        <p className="mt-3 max-w-lg text-sm text-[var(--landing-muted)]">{t("tradeGo.body")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--landing-border)] bg-[var(--landing-bg)] px-5 py-4">
            <div
              className="h-24 w-24 rounded-md bg-[var(--landing-elevated)] opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(90deg,var(--landing-border) 1px,transparent 1px),linear-gradient(var(--landing-border) 1px,transparent 1px)",
                backgroundSize: "12px 12px",
              }}
              aria-hidden
            />
            <span className="text-center text-xs font-medium text-[var(--landing-muted)]">
              {t("tradeGo.scan")}
              <br />
              <span className="text-[10px]">{t("tradeGo.scanSoon")}</span>
            </span>
          </div>
          <Link
            href="/trade"
            className="inline-flex items-center justify-center rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--gold-ink)] hover:bg-[var(--gold-hover)]"
          >
            {t("tradeGo.cta")}
          </Link>
        </div>
        <p className="mt-4 text-[10px] text-[var(--landing-muted)]">{t("photoCredit")}</p>
      </div>
    </section>
  );
}
