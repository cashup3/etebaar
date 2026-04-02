"use client";

import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useCallback, useEffect, useRef, useState } from "react";

const TF: { label: string; interval: string }[] = [
  { label: "1m", interval: "1m" },
  { label: "5m", interval: "5m" },
  { label: "15m", interval: "15m" },
  { label: "1H", interval: "1h" },
  { label: "4H", interval: "4h" },
  { label: "1D", interval: "1d" },
];

type Bar = { t: number; o: string; h: string; l: string; c: string };

export function ChartPane({
  symbol,
  compact = false,
  className = "",
}: {
  symbol: string;
  compact?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [interval, setInterval] = useState("15m");
  const [err, setErr] = useState<string | null>(null);
  const [tools] = useState([
    "Crosshair",
    "Trend",
    "Fib",
    "Long / Short",
    "Clear",
  ]);

  const load = useCallback(async () => {
    setErr(null);
    const u = new URLSearchParams({ symbol, interval, limit: "500" });
    const r = await fetch(`/api/market/klines?${u.toString()}`);
    if (!r.ok) {
      setErr(`Klines ${r.status}`);
      return;
    }
    const j = (await r.json()) as { bars: Bar[] };
    const data = j.bars.map((b) => ({
      time: Math.floor(b.t / 1000) as UTCTimestamp,
      open: Number.parseFloat(b.o),
      high: Number.parseFloat(b.h),
      low: Number.parseFloat(b.l),
      close: Number.parseFloat(b.c),
    }));
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [symbol, interval]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const rs = getComputedStyle(document.documentElement);
    const panel = rs.getPropertyValue("--panel").trim() || "#1a3054";
    const muted = rs.getPropertyValue("--muted").trim() || "#9db0d0";
    const grid =
      rs.getPropertyValue("--chart-grid").trim() || "rgba(42, 53, 69, 0.35)";
    const border = rs.getPropertyValue("--border").trim() || "rgba(255,255,255,0.1)";
    const buy = rs.getPropertyValue("--buy").trim() || "#34d399";
    const sell = rs.getPropertyValue("--sell").trim() || "#fb7185";

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: panel },
        textColor: muted,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: compact ? 10 : 11,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: border },
      timeScale: { borderColor: border, timeVisible: true, secondsVisible: false },
    });

    const series = chart.addCandlestickSeries({
      upColor: buy,
      downColor: sell,
      borderVisible: false,
      wickUpColor: buy,
      wickDownColor: sell,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (!wrapRef.current) return;
      chart.applyOptions({
        width: wrapRef.current.clientWidth,
        height: wrapRef.current.clientHeight,
      });
    });
    ro.observe(el);
    chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [compact]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden border border-[var(--border)] bg-[var(--panel)] ${
        compact
          ? "min-h-[260px]"
          : "min-h-[320px] sm:min-h-[400px] lg:min-h-[calc(100vh-220px)]"
      } ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-2 py-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] sm:text-[11px]">
          {symbol}
        </span>
        <div className="flex flex-wrap gap-0.5 sm:gap-1">
          {TF.map((t) => (
            <button
              key={t.interval}
              type="button"
              onClick={() => setInterval(t.interval)}
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] sm:px-2 sm:text-[10px] ${
                interval === t.interval
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-[var(--muted-dim)] hover:bg-[var(--panel-hover)] hover:text-[var(--muted)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {!compact && (
          <div className="hidden flex-wrap gap-1 lg:flex">
            {tools.map((x) => (
              <button
                key={x}
                type="button"
                className="rounded border border-[var(--border)] px-2 py-0.5 font-mono text-[9px] text-[var(--muted-dim)] hover:border-[var(--border-strong)] hover:text-[var(--muted)]"
              >
                {x}
              </button>
            ))}
          </div>
        )}
      </div>
      {err && (
        <div className="border-b border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--sell)]">
          {err}
        </div>
      )}
      <div ref={wrapRef} className={`w-full flex-1 ${compact ? "min-h-[200px]" : "min-h-[280px]"}`} />
    </div>
  );
}
