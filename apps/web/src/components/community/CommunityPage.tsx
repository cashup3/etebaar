"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

const CHANNELS = ["discord", "telegram", "x", "youtube", "reddit", "github"] as const;

export function CommunityPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto min-h-[50vh] w-full min-w-0 max-w-3xl px-4 py-10 pb-20 sm:px-6">
      <Link href="/" className="mb-6 inline-block font-mono text-xs text-[var(--muted)] hover:text-[var(--accent)]">
        {t("pages.common.backHome")}
      </Link>
      <h1 className="font-mono text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
        {t("pages.community.title")}
      </h1>
      <p className="mt-3 font-mono text-sm leading-relaxed text-[var(--muted)]">{t("pages.community.subtitle")}</p>
      <div className="mt-8 space-y-4 break-words font-mono text-sm leading-relaxed text-[var(--landing-muted)]">
        <p>{t("pages.community.p1")}</p>
        <p>{t("pages.community.p2")}</p>
      </div>
      <div className="mt-12 space-y-10">
        {CHANNELS.map((id) => (
          <section key={id} id={id} className="scroll-mt-24 border-t border-[var(--border)] pt-8 first:border-t-0 first:pt-0">
            <h2 className="font-mono text-lg font-semibold text-[var(--text)]">{t(`pages.community.h_${id}`)}</h2>
            <p className="mt-2 text-[var(--landing-muted)]">{t(`pages.community.blurb_${id}`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
