"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ActivityTape, type TapeRow } from "@/components/trade/ActivityTape";
import { ChartPane } from "@/components/trade/ChartPane";
import {
  InstrumentBar,
  type TickerStats,
} from "@/components/trade/InstrumentBar";
import { OrderBookPanel, type BookLevel } from "@/components/trade/OrderBookPanel";
import { OrderTicket } from "@/components/trade/OrderTicket";
import { getToken } from "@/lib/authStorage";
import { useLocale } from "@/i18n/LocaleProvider";

type Health = { ok: boolean; service: string; time: string };

type BookSnap = {
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
  ts: number;
};

const LS_DEV_USER = "etebaar_dev_user";

function wsBaseUrl() {
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const wsProto = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${hostname}:4000`;
  }
  return "ws://127.0.0.1:4000";
}

function parsePair(symbol: string): { symbol: string; base: string; quote: string } {
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 6) {
    return { symbol: "BTCUSDT", base: "BTC", quote: "USDT" };
  }
  if (s.endsWith("USDT")) {
    return { symbol: s, base: s.slice(0, -4), quote: "USDT" };
  }
  return { symbol: s, base: s, quote: "" };
}

export function TradeTerminal() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const [devUserId, setDevUserId] = useState("");

  const { symbol, base, quote } = useMemo(() => {
    const raw = searchParams.get("symbol") ?? "BTCUSDT";
    return parsePair(raw);
  }, [searchParams]);

  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [book, setBook] = useState<BookSnap | null>(null);
  const [ticker, setTicker] = useState<TickerStats | null>(null);
  const [tape, setTape] = useState<TapeRow[]>([]);
  const [devOpen, setDevOpen] = useState(false);
  const [ticketSide, setTicketSide] = useState<"BUY" | "SELL">("BUY");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [orderMsg, setOrderMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setDevUserId(localStorage.getItem(LS_DEV_USER) ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveUserId = user?.id ?? devUserId;

  useEffect(() => {
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setHealth)
      .catch((e: Error) => setErr(e.message));
  }, []);

  const refreshBook = useCallback(() => {
    void fetch(`/api/markets/${symbol}/book`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j) setBook(j as BookSnap);
      })
      .catch(() => undefined);
  }, [symbol]);

  const refreshTicker = useCallback(() => {
    void fetch(`/api/market/ticker?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j === "object" && "last" in j) {
          const tk = j as TickerStats;
          setTicker(tk);
          setPrice((p) => p || tk.last);
        }
      })
      .catch(() => undefined);
  }, [symbol]);

  useEffect(() => {
    refreshBook();
    const t = setInterval(refreshBook, 2000);
    return () => clearInterval(t);
  }, [refreshBook]);

  useEffect(() => {
    refreshTicker();
    const t = setInterval(refreshTicker, 10_000);
    return () => clearInterval(t);
  }, [refreshTicker]);

  useEffect(() => {
    setPrice("");
  }, [symbol]);

  const wsUrl = useMemo(() => {
    const baseWs = wsBaseUrl();
    const q = new URLSearchParams({ symbol });
    if (effectiveUserId) q.set("userId", effectiveUserId);
    return `${baseWs}/ws?${q.toString()}`;
  }, [symbol, effectiveUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          channel?: string;
          data?: Record<string, unknown>;
        };
        if (msg.channel === `book:${symbol}` && msg.data) {
          setBook(msg.data as BookSnap);
        }
        const ch = msg.channel ?? "";
        if (ch.startsWith("user:") && msg.data && msg.data.type === "fill") {
          const d = msg.data as {
            price?: string;
            qty?: string;
            side?: string;
          };
          const side = d.side?.toUpperCase() === "SELL" ? "sell" : "buy";
          const row: TapeRow = {
            id: `${Date.now()}-${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            side,
            price: d.price ?? "—",
            qty: d.qty ?? "—",
          };
          setTape((prev) => [row, ...prev].slice(0, 40));
        }
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => setErr(t("terminal.wsErr"));
    return () => ws.close();
  }, [wsUrl, symbol, t]);

  function authHeaders(): Record<string, string> {
    const t = token ?? getToken();
    if (t) return { Authorization: `Bearer ${t}` };
    if (effectiveUserId) return { "X-User-Id": effectiveUserId };
    return {};
  }

  async function placeOrder() {
    setOrderMsg(null);
    if (!effectiveUserId && !getToken() && !token) {
      setOrderMsg(t("terminal.signInMsg"));
      return;
    }
    setBusy(true);
    try {
      const clientOrderId = crypto.randomUUID();
      const h = authHeaders();
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": clientOrderId,
          ...h,
        },
        body: JSON.stringify({
          symbol,
          side: ticketSide,
          price: price || ticker?.last || "1",
          amount,
          clientOrderId,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setOrderMsg(`${t("terminal.orderErr")} ${JSON.stringify(j)}`);
        return;
      }
      setOrderMsg(`${ticketSide} ${t("terminal.orderOk")} ${(j as { id: string }).id.slice(0, 8)}…`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h)-1rem)] flex-col">
      <InstrumentBar base={base} quote={quote || "—"} book={book} ticker={ticker} />

      <div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_300px_300px] xl:grid-cols-[minmax(0,1fr)_280px_300px]">
        <ChartPane symbol={symbol} />
        <OrderBookPanel book={book} rows={16} />
        <OrderTicket
          side={ticketSide}
          onSide={setTicketSide}
          price={price || ticker?.last || ""}
          onPrice={setPrice}
          amount={amount}
          onAmount={setAmount}
          onSubmit={() => void placeOrder()}
          busy={busy}
          message={orderMsg}
        />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        <ActivityTape rows={tape} />
        <div className="border border-[var(--border)] bg-[var(--panel)]">
          <button
            type="button"
            onClick={() => setDevOpen((o) => !o)}
            className="flex w-full items-center justify-between border-b border-[var(--border)] px-3 py-2 text-start font-mono text-[11px] text-[var(--muted)] hover:bg-[var(--panel-hover)]"
          >
            <span>{t("terminal.sessionDev")}</span>
            <span className="text-[var(--muted-dim)]">{devOpen ? "−" : "+"}</span>
          </button>
          {devOpen && (
            <div className="space-y-3 p-3 font-mono text-[10px] text-[var(--muted)]">
              <p className="text-[var(--muted-dim)]">
                {t("terminal.signedInLine")} {user?.email ?? t("terminal.noUser")}. {t("terminal.devHint")}
              </p>
              <label className="block">
                <span className="text-[var(--muted-dim)]">{t("terminal.devLabel")}</span>
                <input
                  className="mt-1 w-full border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[var(--text)]"
                  value={devUserId}
                  onChange={(e) => {
                    setDevUserId(e.target.value);
                    try {
                      localStorage.setItem(LS_DEV_USER, e.target.value);
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              </label>
              <p className="break-all text-[var(--muted-dim)]">WS {wsUrl}</p>
              <pre className="max-h-28 overflow-auto rounded border border-[var(--border)] bg-[var(--bg)] p-2 text-[9px] text-[var(--muted-dim)]">
                {err ? `err: ${err}\n` : ""}
                {health ? JSON.stringify(health, null, 2) : t("terminal.healthWait")}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
