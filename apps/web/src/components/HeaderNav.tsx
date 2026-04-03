"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n/LocaleProvider";

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NavItem = {
  href: string;
  labelKey: string;
  descKey?: string;
  soon?: boolean;
};

function MegaColumn({
  title,
  items,
  t,
  soonLabel,
}: {
  title: string;
  items: NavItem[];
  t: (k: string) => string;
  soonLabel: string;
}) {
  return (
    <div className="min-w-[200px]">
      <p className="mb-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-dim)]">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, i) => {
          const content = (
            <>
              <span className="block font-sans text-sm font-medium text-[var(--text)]">
                {t(item.labelKey)}
                {item.soon ? (
                  <span className="ms-2 align-middle font-mono text-[9px] font-normal text-[var(--muted)]">
                    {soonLabel}
                  </span>
                ) : null}
              </span>
              {item.descKey ? (
                <span className="mt-0.5 block font-mono text-[10px] leading-snug text-[var(--muted)]">
                  {t(item.descKey)}
                </span>
              ) : null}
            </>
          );
          if (item.soon || item.href === "#") {
            return (
              <li key={`${item.labelKey}-${i}`}>
                <span className="block cursor-default rounded-md px-2 py-2 opacity-60">{content}</span>
              </li>
            );
          }
          return (
            <li key={`${item.href}-${item.labelKey}`}>
              <Link
                href={item.href}
                className="block rounded-md px-2 py-2 transition-colors hover:bg-[var(--panel-hover)]"
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DesktopDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full items-stretch">
      <button
        type="button"
        className={`flex items-center gap-1 rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors hover:bg-[var(--header-nav-hover)] hover:text-[var(--nav-icon)] ${
          active ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "text-[var(--landing-muted)]"
        }`}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className="opacity-70 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div
        className="pointer-events-none invisible absolute start-0 top-full z-[60] min-w-[max(100%,280px)] pt-1 opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
        role="region"
        aria-label={`${label} menu`}
      >
        <div className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
          {children}
        </div>
      </div>
    </div>
  );
}

const tradeSpot: NavItem[] = [
  { href: "/trade", labelKey: "nav.spot", descKey: "nav.spotDesc" },
  { href: "/convert", labelKey: "nav.convert", descKey: "nav.convertDesc" },
  { href: "#", labelKey: "nav.margin", descKey: "nav.marginDesc", soon: true },
];

const tradeMore: NavItem[] = [
  { href: "#", labelKey: "nav.bots", descKey: "nav.botsDesc", soon: true },
  { href: "#", labelKey: "nav.api", descKey: "nav.apiDesc", soon: true },
];

const futuresItems: NavItem[] = [
  { href: "#", labelKey: "nav.usdM", descKey: "nav.usdMDesc", soon: true },
  { href: "#", labelKey: "nav.coinM", descKey: "nav.coinMDesc", soon: true },
  { href: "#", labelKey: "nav.options", descKey: "nav.optionsDesc", soon: true },
];

const earnItems: NavItem[] = [
  { href: "#", labelKey: "nav.simpleEarn", descKey: "nav.simpleEarnDesc", soon: true },
  { href: "#", labelKey: "nav.staking", descKey: "nav.stakingDesc", soon: true },
  { href: "#", labelKey: "nav.dual", descKey: "nav.dualDesc", soon: true },
];

const squareItems: NavItem[] = [
  { href: "#", labelKey: "nav.squareNft", descKey: "nav.squareNftDesc", soon: true },
  { href: "#", labelKey: "nav.nft", descKey: "nav.nftDesc", soon: true },
  { href: "#", labelKey: "nav.fan", descKey: "nav.fanDesc", soon: true },
];

const moreItems: NavItem[] = [
  { href: "/markets", labelKey: "nav.mOverview", descKey: "nav.mOverviewDesc" },
  { href: "/learn", labelKey: "footer.learnHub", descKey: "nav.mOverviewDesc" },
  { href: "/help", labelKey: "footer.supHelp", descKey: "nav.homeDesc" },
  { href: "/announcements", labelKey: "footer.aboutAnnounce", descKey: "nav.homeDesc" },
  { href: "/", labelKey: "nav.home", descKey: "nav.homeDesc" },
  { href: "/legal", labelKey: "footer.aboutLegal", descKey: "nav.homeDesc" },
];

export function HeaderNavDesktop({ pathname }: { pathname: string }) {
  const { t } = useLocale();
  const soon = t("common.soon");
  const tradeActive = pathname.startsWith("/trade");
  const marketsActive = pathname.startsWith("/markets");
  const convertActive = pathname.startsWith("/convert");
  const buyActive = pathname.startsWith("/buy");

  return (
    <nav className="hidden h-full items-stretch gap-0.5 md:flex" aria-label="Main">
      <Link
        href="/buy"
        className={`flex items-center rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors hover:bg-[var(--header-nav-hover)] ${
          buyActive ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "text-[var(--landing-muted)] hover:text-[var(--nav-icon)]"
        }`}
      >
        {t("nav.buyCrypto")}
      </Link>
      <Link
        href="/markets"
        className={`flex items-center rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors hover:bg-[var(--header-nav-hover)] ${
          marketsActive ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "text-[var(--landing-muted)] hover:text-[var(--nav-icon)]"
        }`}
      >
        {t("nav.markets")}
      </Link>
      <Link
        href="/convert"
        className={`flex items-center rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors hover:bg-[var(--header-nav-hover)] ${
          convertActive ? "bg-[var(--gold-dim)] text-[var(--gold)]" : "text-[var(--landing-muted)] hover:text-[var(--nav-icon)]"
        }`}
      >
        {t("nav.convert")}
      </Link>
      <DesktopDropdown label={t("nav.trade")} active={tradeActive}>
        <div className="grid max-w-lg grid-cols-2 gap-6 p-4">
          <MegaColumn title={t("nav.basic")} items={tradeSpot} t={t} soonLabel={soon} />
          <MegaColumn title={t("nav.tools")} items={tradeMore} t={t} soonLabel={soon} />
        </div>
      </DesktopDropdown>
      <DesktopDropdown label={t("nav.futures")}>
        <div className="p-4">
          <MegaColumn title={t("nav.derivatives")} items={futuresItems} t={t} soonLabel={soon} />
        </div>
      </DesktopDropdown>
      <DesktopDropdown label={t("nav.earn")}>
        <div className="p-4">
          <MegaColumn title={t("nav.grow")} items={earnItems} t={t} soonLabel={soon} />
        </div>
      </DesktopDropdown>
      <DesktopDropdown label={t("nav.square")}>
        <div className="p-4">
          <MegaColumn title={t("nav.discover")} items={squareItems} t={t} soonLabel={soon} />
        </div>
      </DesktopDropdown>
      <DesktopDropdown label={t("nav.more")}>
        <div className="p-4">
          <MegaColumn title={t("nav.platform")} items={moreItems} t={t} soonLabel={soon} />
        </div>
      </DesktopDropdown>
    </nav>
  );
}

export function HeaderNavMobile() {
  const { t } = useLocale();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const panel = open ? (
    <>
      {/*
        Backdrop below the sticky header only so the menu trigger (in the header) stays tappable
        to toggle closed. Full-viewport overlays were stacking above the header and eating taps.
      */}
      <button
        type="button"
        className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-[90] bg-black/25 md:hidden"
        aria-label={t("markets.closePanel")}
        onClick={close}
      />
      <div
        id={panelId}
        ref={panelRef}
        className="fixed start-2 end-2 top-[calc(var(--header-h)+6px)] z-[100] max-h-[min(70vh,520px)] overflow-y-auto rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] p-3 shadow-2xl md:hidden"
        role="menu"
      >
        <div className="space-y-3 font-sans text-sm text-[var(--landing-text)]">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
              {t("nav.mobileTrade")}
            </p>
            <Link href="/trade" className="block rounded-md px-2 py-2 hover:bg-[var(--landing-row-hover)]" onClick={close}>
              {t("nav.spot")}
            </Link>
            <span className="block cursor-default rounded-md px-2 py-2 text-[var(--landing-muted)]">
              {t("nav.mobileFutures")}
            </span>
          </div>
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
              {t("nav.explore")}
            </p>
            <Link href="/buy" className="block rounded-md px-2 py-2 hover:bg-[var(--landing-row-hover)]" onClick={close}>
              {t("nav.buyCrypto")}
            </Link>
            <Link href="/markets" className="block rounded-md px-2 py-2 hover:bg-[var(--landing-row-hover)]" onClick={close}>
              {t("nav.markets")}
            </Link>
            <Link href="/convert" className="block rounded-md px-2 py-2 hover:bg-[var(--landing-row-hover)]" onClick={close}>
              {t("nav.convert")}
            </Link>
            <Link href="/" className="block rounded-md px-2 py-2 hover:bg-[var(--landing-row-hover)]" onClick={close}>
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative z-[60] shrink-0 md:hidden" ref={triggerRef}>
      <button
        type="button"
        className="flex touch-manipulation items-center gap-1 rounded-md border border-[var(--landing-border)] px-2 py-1.5 font-mono text-[10px] text-[var(--landing-muted)] hover:text-[var(--nav-icon)] active:bg-[var(--header-nav-hover)]"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {t("nav.menu")}
        <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
