"use client";

import { useCallback, useState } from "react";
import { cryptoIconUrl, pairBaseAsset } from "@/lib/marketSymbol";

type Props = {
  /** Base symbol (BTC) or full pair (BTCUSDT) */
  symbol: string;
  size?: number;
  className?: string;
  imgClassName?: string;
};

export function CryptoIcon({ symbol, size = 32, className = "", imgClassName = "" }: Props) {
  const base = pairBaseAsset(symbol);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  const letter = base.charAt(0) || "?";

  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--panel-hover)] to-[var(--panel)] font-semibold text-[var(--text)] ring-1 ring-[var(--border)] ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.35) }}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--panel)] ring-1 ring-[var(--border)] ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cryptoIconUrl(base)}
        alt=""
        width={size}
        height={size}
        className={`h-full w-full object-cover ${imgClassName}`}
        loading="lazy"
        decoding="async"
        onError={onError}
      />
    </span>
  );
}
