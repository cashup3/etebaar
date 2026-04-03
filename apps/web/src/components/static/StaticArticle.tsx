"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

const MAX_P = 12;

type Props = {
  /** i18n prefix `pages.{slug}.*` */
  slug: string;
  backKey?: string;
  backHref?: string;
};

export function StaticArticle({ slug, backKey = "pages.common.backHome", backHref = "/" }: Props) {
  const { t } = useLocale();
  const base = `pages.${slug}`;

  const title = t(`${base}.title`);
  const subtitle = t(`${base}.subtitle`);
  const titleMissing = title === `${base}.title`;

  const paragraphs: string[] = [];
  for (let i = 1; i <= MAX_P; i++) {
    const key = `${base}.p${i}`;
    const text = t(key);
    if (text !== key) paragraphs.push(text);
  }

  return (
    <div className="mx-auto min-h-[50vh] w-full min-w-0 max-w-3xl px-4 py-10 pb-20 sm:px-6">
      <Link
        href={backHref}
        className="mb-6 inline-block font-mono text-xs text-[var(--muted)] hover:text-[var(--accent)]"
      >
        {t(backKey)}
      </Link>
      {!titleMissing && (
        <>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
          {subtitle !== `${base}.subtitle` && (
            <p className="mt-3 font-mono text-sm leading-relaxed text-[var(--muted)]">{subtitle}</p>
          )}
          <div className="mt-8 max-w-none break-words font-mono text-sm leading-relaxed text-[var(--text)]">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-4 break-words text-[var(--landing-muted)] [&:last-child]:mb-0">
                {p}
              </p>
            ))}
          </div>
        </>
      )}
      {titleMissing && (
        <p className="font-mono text-sm text-[var(--sell)]">{t("pages.common.notFound")}</p>
      )}
    </div>
  );
}
