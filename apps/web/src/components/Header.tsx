"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { HeaderNavDesktop, HeaderNavMobile } from "@/components/HeaderNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocale } from "@/i18n/LocaleProvider";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center ${className ?? ""}`}>
      <Image
        src="/brand/logo.png"
        alt="Etebaar"
        width={64}
        height={64}
        className="h-full w-full object-contain object-center"
        priority
        sizes="32px"
      />
    </span>
  );
}

export function Header() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const isLanding = pathname === "/";

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--landing-border)] bg-[var(--landing-bg)]/95 backdrop-blur-md"
      style={{ height: "var(--header-h)" }}
    >
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <LogoMark />
            <span className="font-semibold tracking-wide text-[var(--gold)]">ETEBAAR</span>
          </Link>
          <HeaderNavDesktop pathname={pathname} />
          <HeaderNavMobile />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            className="rounded-md p-2 text-[var(--nav-icon)] transition-colors hover:bg-[var(--header-nav-hover)]"
            title={t("header.searchSoon")}
            aria-label={t("header.search")}
          >
            <IconSearch />
          </button>

          {!isLanding ? (
            <>
              <button
                type="button"
                className="hidden rounded-md bg-[var(--gold)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--gold-ink)] shadow-sm transition-opacity hover:bg-[var(--gold-hover)] sm:inline"
                title={t("header.comingSoon")}
              >
                {t("header.deposit")}
              </button>
              <button
                type="button"
                className="hidden rounded-md px-2.5 py-1.5 font-sans text-xs text-[var(--landing-muted)] transition-colors hover:text-[var(--nav-icon)] md:inline"
                title={t("header.comingSoon")}
              >
                {t("header.wallet")}
              </button>
              <button
                type="button"
                className="hidden rounded-md px-2.5 py-1.5 font-sans text-xs text-[var(--landing-muted)] transition-colors hover:text-[var(--nav-icon)] lg:inline"
                title={t("header.comingSoon")}
              >
                {t("header.orders")}
              </button>
            </>
          ) : null}

          {!ready ? (
            <span className="px-1 font-mono text-[10px] text-[var(--landing-muted)]">…</span>
          ) : user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden max-w-[100px] truncate font-sans text-xs text-[var(--landing-muted)] lg:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-md px-2 py-1.5 font-sans text-xs text-[var(--nav-icon)] hover:bg-[var(--header-nav-hover)]"
              >
                {t("header.logout")}
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-2 py-1.5 font-sans text-sm text-[var(--nav-icon)] hover:text-[var(--gold)] sm:inline sm:px-3"
              >
                {t("header.login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--gold)] px-3 py-1.5 font-sans text-xs font-semibold text-[var(--gold-ink)] shadow-sm hover:bg-[var(--gold-hover)] sm:text-sm"
              >
                {t("header.signup")}
              </Link>
            </>
          )}

          <Link
            href="/downloads"
            className="hidden rounded-md p-2 text-[var(--nav-icon)] transition-colors hover:bg-[var(--header-nav-hover)] md:inline-flex"
            title={t("footer.aboutDownloads")}
            aria-label={t("footer.aboutDownloads")}
          >
            <IconDownload />
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
