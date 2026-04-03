"use client";

import Image from "next/image";
import Link from "next/link";
import { STOCK } from "@/components/landing/stockPhotos";
import { useLocale } from "@/i18n/LocaleProvider";

export function LifestyleVideoRow() {
  const { t } = useLocale();
  const CARDS = [
    {
      src: STOCK.cryptoSpotlight1,
      altKey: "cryptoGallery.alt1",
      capKey: "cryptoGallery.cap1",
      href: "/trade?symbol=BTCUSDT",
    },
    {
      src: STOCK.cryptoSpotlight2,
      altKey: "cryptoGallery.alt2",
      capKey: "cryptoGallery.cap2",
      href: "/markets",
    },
    {
      src: STOCK.cryptoSpotlight3,
      altKey: "cryptoGallery.alt3",
      capKey: "cryptoGallery.cap3",
      href: "/trade",
    },
  ] as const;

  return (
    <section className="mt-16 w-full min-w-0 sm:mt-20" aria-labelledby="crypto-gallery-heading">
      <h2 id="crypto-gallery-heading" className="mb-4 text-lg font-semibold text-[var(--landing-text)]">
        {t("cryptoGallery.title")}
      </h2>
      <p className="mb-6 max-w-2xl text-sm text-[var(--landing-muted)]">{t("cryptoGallery.blurb")}</p>
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {CARDS.map((item) => (
          <Link
            key={item.src}
            href={item.href}
            className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--landing-border)] bg-[var(--landing-card)] shadow-lg outline-none ring-[var(--gold)] transition hover:border-[var(--gold)]/50 focus-visible:ring-2"
          >
            <Image
              src={item.src}
              alt={t(item.altKey)}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <p className="absolute bottom-3 start-3 end-3 text-sm font-medium text-white drop-shadow-md">
              {t(item.capKey)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
