"use client";

import Link from "next/link";
import {
  footerAbout,
  footerBusiness,
  footerLearn,
  footerProducts,
  footerService,
  footerSupport,
  footerSocial,
  type FooterLinkKey,
} from "@/data/footerNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/LocaleProvider";

function FootLink({ item, t }: { item: FooterLinkKey; t: (k: string) => string }) {
  const className =
    "block py-1.5 text-sm text-[var(--landing-muted)] transition-colors hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]";
  const label = t(item.labelKey);
  if (item.href === "#") {
    return (
      <button type="button" className={`${className} w-full text-start`} title={t("header.comingSoon")}>
        {label}
      </button>
    );
  }
  if (item.external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className}>
      {label}
    </Link>
  );
}

function LinkColumn({ titleKey, links, t }: { titleKey: string; links: FooterLinkKey[]; t: (k: string) => string }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t(titleKey)}</h3>
      <ul className="space-y-0">
        {links.map((item) => (
          <li key={item.labelKey}>
            <FootLink item={item} t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessLearnColumn({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t("footer.business")}</h3>
        <ul className="space-y-0">
          {footerBusiness.map((item) => (
            <li key={item.labelKey}>
              <FootLink item={item} t={t} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t("footer.learn")}</h3>
        <ul className="space-y-0">
          {footerLearn.map((item) => (
            <li key={item.labelKey}>
              <FootLink item={item} t={t} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ServiceSupportColumn({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t("footer.service")}</h3>
        <ul className="space-y-0">
          {footerService.map((item) => (
            <li key={item.labelKey}>
              <FootLink item={item} t={t} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t("footer.support")}</h3>
        <ul className="space-y-0">
          {footerSupport.map((item) => (
            <li key={item.labelKey}>
              <FootLink item={item} t={t} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CommunityColumn({ t }: { t: (k: string) => string }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-[var(--landing-text)]">{t("footer.community")}</h3>
      <div className="mb-6 grid max-w-[200px] grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4">
        {footerSocial.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] text-xs font-semibold text-[var(--landing-muted)] transition-colors hover:border-[var(--gold)]/50 hover:text-[var(--gold)]"
            title={s.label}
            aria-label={s.label}
          >
            {s.key}
          </Link>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-[var(--landing-border)] pt-5">
        <label className="flex items-center gap-2 text-xs text-[var(--landing-muted)]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--landing-border)]" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a16 16 0 0 0 0 18" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px]">{t("footer.lang")}</span>
            <LanguageSwitcher />
          </span>
        </label>
        <label className="flex items-center gap-2 text-xs text-[var(--landing-muted)]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--landing-border)]" aria-hidden>
            $
          </span>
          <select
            disabled
            className="min-w-0 flex-1 cursor-not-allowed rounded-md border border-[var(--landing-border)] bg-[var(--landing-bg)] px-2 py-1.5 text-[var(--landing-text)]"
            aria-label={t("footer.currency")}
            title={t("header.comingSoon")}
          >
            <option>USD</option>
          </select>
        </label>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-[var(--landing-muted)]">{t("footer.theme")}</span>
          <ThemeToggle className="rounded-md border border-[var(--landing-border)] p-2 text-[var(--landing-text)] hover:bg-[var(--landing-row-hover)]" />
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="w-full min-w-0 border-t border-[var(--landing-border)] bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-8">
          <CommunityColumn t={t} />
          <LinkColumn titleKey="footer.about" links={footerAbout} t={t} />
          <LinkColumn titleKey="footer.products" links={footerProducts} t={t} />
          <BusinessLearnColumn t={t} />
          <ServiceSupportColumn t={t} />
        </div>

        <div className="mt-14 border-t border-[var(--landing-border)] pt-8">
          <p className="text-[11px] leading-relaxed text-[var(--landing-muted)]">
            <strong className="font-medium text-[var(--landing-text)]">{t("footer.riskTitle")}</strong>{" "}
            {t("footer.riskBody")}
          </p>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--landing-muted)]">{t("footer.legalBody")}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--landing-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--landing-muted)]">
            © {new Date().getFullYear()} Etebaar. {t("footer.copyright")}
          </p>
          <Link
            href="/cookies"
            className="w-fit text-xs text-[var(--landing-muted)] underline-offset-2 hover:text-[var(--gold)] hover:underline"
          >
            {t("footer.cookies")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
