"use client";

import Image from "next/image";
import Link from "next/link";
import { STOCK } from "@/components/landing/stockPhotos";
import { useLocale } from "@/i18n/LocaleProvider";

type Props = {
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  variant?: "markets" | "trade";
};

export function MarketingBanner({
  title,
  subtitle,
  ctaHref = "/signup",
  ctaLabel,
  variant = "markets",
}: Props) {
  const { t } = useLocale();
  const src = variant === "trade" ? STOCK.tradeStrip : STOCK.marketsBanner;
  const tit = variant === "trade" ? t("mBanner.tradeTitle") : (title ?? "");
  const sub = variant === "trade" ? t("mBanner.tradeSub") : subtitle;
  const cta =
    ctaLabel ?? (variant === "trade" ? t("mBanner.cta") : t("markets.bannerCta"));

  return (
    <div className="relative mt-10 overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="relative aspect-[21/5] min-h-[140px] w-full sm:aspect-[21/4]">
        <Image src={src} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 rtl:bg-gradient-to-l" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-center px-5 py-6 sm:px-8">
        <h2 className="max-w-xl text-lg font-bold text-white sm:text-xl">{tit}</h2>
        {sub ? <p className="mt-1 max-w-xl text-sm text-white/80">{sub}</p> : null}
        <Link
          href={ctaHref}
          className="mt-4 inline-flex w-fit rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[var(--gold-ink)] hover:bg-[var(--gold-hover)] sm:text-sm"
        >
          {cta}
        </Link>
      </div>
      <p className="absolute bottom-2 end-3 text-[9px] text-white/50">{t("photoCredit")}</p>
    </div>
  );
}
