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
import { useLocale } from "@/i18n/LocaleProvider";

type Point = { t: number; v: number };

export function FiatFxChart({
  code,
  compact = true,
  className = "",
}: {
  code: string;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const u = new URLSearchParams({ code, days: "120" });
    const r = await fetch(`/api/market/fx-series?${u}`);
    if (!r.ok) {
      setErr(String(r.status));
      return;
    }
    const j = (await r.json()) as { points?: Point[]; error?: string };
    if (j.error) {
      setErr(j.error);
      return;
    }
    const pts = j.points ?? [];
    const data = pts.map((p) => ({
      time: Math.floor(p.t / 1000) as UTCTimestamp,
      value: p.v,
    }));
    seriesRef.current?.setData(data);
    chartRef.current?.timeScale().fitContent();
    if (!data.length) setErr("empty");
  }, [code]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const rs = getComputedStyle(document.documentElement);
    const panel = rs.getPropertyValue("--panel").trim() || "#1a3054";
    const muted = rs.getPropertyValue("--muted").trim() || "#9db0d0";
    const grid = rs.getPropertyValue("--chart-grid").trim() || "rgba(42, 53, 69, 0.35)";
    const border = rs.getPropertyValue("--border").trim() || "rgba(255,255,255,0.1)";
    const accent = rs.getPropertyValue("--accent").trim() || "#eab308";

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

    const series = chart.addLineSeries({
      color: accent,
      lineWidth: 2,
      crosshairMarkerVisible: true,
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
        compact ? "min-h-[260px]" : "min-h-[320px]"
      } ${className}`.trim()}
    >
      <div className="border-b border-[var(--border)] px-2 py-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {code} → USD <span className="text-[var(--muted-dim)]">· {t("markets.fiatFxLegend")}</span>
        </span>
      </div>
      {err && err !== "empty" && (
        <div className="border-b border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--sell)]">{err}</div>
      )}
      {err === "empty" && (
        <div className="border-b border-[var(--border)] px-2 py-1 font-mono text-[10px] text-[var(--muted)]">
          {t("markets.fiatFxEmpty")}
        </div>
      )}
      <div ref={wrapRef} className={`w-full flex-1 ${compact ? "min-h-[200px]" : "min-h-[260px]"}`} />
    </div>
  );
}
