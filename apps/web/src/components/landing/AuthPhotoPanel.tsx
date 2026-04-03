"use client";

import Image from "next/image";
import { STOCK } from "@/components/landing/stockPhotos";
import { useLocale } from "@/i18n/LocaleProvider";

export function AuthPhotoPanel() {
  const { t } = useLocale();

  return (
    <div className="relative hidden min-h-[520px] flex-1 lg:flex">
      <Image
        src={STOCK.authSide}
        alt="Abstract technology and circuit imagery"
        fill
        className="object-cover"
        sizes="50vw"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--landing-bg)] via-black/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/30 lg:to-[var(--landing-bg)]" />
      <div className="relative z-[1] mt-auto p-8">
        <p className="text-lg font-semibold text-white">{t("authPanel.title")}</p>
        <p className="mt-2 max-w-sm text-sm text-white/85">{t("authPanel.sub")}</p>
      </div>
    </div>
  );
}
