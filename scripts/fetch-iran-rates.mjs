#!/usr/bin/env node
/**
 * Fetches IRAN_RATES_JSON_URL (or first CLI arg), validates JSON, prints a short summary.
 *
 * Usage:
 *   IRAN_RATES_JSON_URL=https://example.com/rates.json node scripts/fetch-iran-rates.mjs
 *   node scripts/fetch-iran-rates.mjs https://example.com/rates.json
 *
 * Host the same JSON shape as scripts/iran-rates.example.json (see .env.example).
 */

const url = process.argv[2] || process.env.IRAN_RATES_JSON_URL;
if (!url) {
  console.error("Set IRAN_RATES_JSON_URL or pass URL as first argument.");
  process.exit(1);
}

const res = await fetch(url, {
  headers: { Accept: "application/json", "User-Agent": "EtebaarFetchIranRates/1.0" },
});
if (!res.ok) {
  console.error("HTTP", res.status, res.statusText);
  process.exit(1);
}
const j = await res.json();
const tp =
  typeof j.tomanPerUsdt === "number"
    ? j.tomanPerUsdt
    : typeof j.tomanPerUSD === "number"
      ? j.tomanPerUSD
      : j.usd && typeof j.usd === "object"
        ? Number.parseFloat(String(j.usd.sell ?? j.usd.buy ?? ""))
        : NaN;

console.log("URL:", url);
console.log("tomanPerUsdt (parsed):", Number.isFinite(tp) ? tp : "(missing — add tomanPerUsdt or usd.sell)");
console.log("source:", j.source ?? j.label ?? "—");
console.log("updatedAt:", j.updatedAt ?? j.updated_at ?? "—");
console.log("rows/items:", Array.isArray(j.items) ? j.items.length : 0);
console.log("OK — point IRAN_RATES_JSON_URL at this URL in Vercel / .env");
