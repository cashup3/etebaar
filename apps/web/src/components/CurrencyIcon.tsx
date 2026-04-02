"use client";

import { useCallback, useState } from "react";
import { CryptoIcon } from "@/components/CryptoIcon";

/**
 * Flag images from flagcdn (CC BY-SA / free use per site terms).
 * IRT → Iran; GEL → Georgia (lari); AED → UAE; EUR → EU flag.
 */
const FIAT_FLAG_CC: Record<string, string> = {
  USD: "us",
  GBP: "gb",
  EUR: "eu",
  GEL: "ge",
  AED: "ae",
  IRT: "ir",
};

type Props = {
  /** ISO-style code: USD, IRT, BTC, USDT, … */
  code: string;
  size?: number;
  className?: string;
};

export function CurrencyIcon({ code, size = 28, className = "" }: Props) {
  const c = code.toUpperCase();
  const flagCc = FIAT_FLAG_CC[c];
  const [flagFailed, setFlagFailed] = useState(false);

  const onFlagError = useCallback(() => setFlagFailed(true), []);

  if (flagCc && !flagFailed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--panel)] ring-1 ring-[var(--border)] ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w80/${flagCc}.png`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={onFlagError}
        />
      </span>
    );
  }

  if (flagCc && flagFailed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--panel-hover)] font-mono font-semibold text-[var(--muted)] ring-1 ring-[var(--border)] ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.28) }}
        aria-hidden
      >
        {c.slice(0, 2)}
      </span>
    );
  }

  // USDT: pairBaseAsset needs a synthetic pair so base resolves to "USDT"
  const cryptoSymbol = c === "USDT" ? "USDTUSDT" : `${c}USDT`;
  return <CryptoIcon symbol={cryptoSymbol} size={size} className={className} />;
}
