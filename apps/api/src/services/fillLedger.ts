import { Decimal } from "@prisma/client/runtime/library";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { parseSymbol } from "../lib/symbol.js";
import {
  assertNonNegativeBalances,
  postLedgerTransactionInTx,
} from "../lib/ledger.js";

const feeBps = () => new Decimal(config.feeBps).div(10_000);

export async function processUnappliedFills(limit = 50) {
  const fills = await prisma.fill.findMany({
    where: { ledgerApplied: false },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  for (const fill of fills) {
    try {
      await applyOneFill(fill.id);
    } catch (e) {
      console.error("fill ledger failed", fill.id, e);
    }
  }
}

async function applyOneFill(fillId: string) {
  await prisma.$transaction(async (tx) => {
    const fill = await tx.fill.findUnique({ where: { id: fillId } });
    if (!fill || fill.ledgerApplied) return;

    const taker = await tx.order.findUnique({
      where: { id: fill.takerOrderId },
    });
    const maker = await tx.order.findUnique({
      where: { id: fill.makerOrderId },
    });
    if (!taker || !maker) {
      throw new Error("fill references missing order");
    }

    const { base, quote } = parseSymbol(fill.symbol);
    const p = new Decimal(fill.price.toString());
    const q = new Decimal(fill.quantity.toString());
    const notional = p.mul(q);
    const feeRate = feeBps();
    const sys = config.systemUserId;

    const legs: {
      userId: string;
      kind: string;
      asset: string;
      amount: Decimal;
    }[] = [];

    if (taker.side === "BUY") {
      const feeBase = q.mul(feeRate);
      const baseToTaker = q.minus(feeBase);
      legs.push(
        { userId: taker.userId, kind: "LOCKED", asset: quote, amount: notional.neg() },
        { userId: maker.userId, kind: "LOCKED", asset: base, amount: q.neg() },
        { userId: taker.userId, kind: "AVAILABLE", asset: base, amount: baseToTaker },
        { userId: maker.userId, kind: "AVAILABLE", asset: quote, amount: notional },
        { userId: sys, kind: "AVAILABLE", asset: base, amount: feeBase },
      );
    } else if (taker.side === "SELL") {
      const feeQuote = notional.mul(feeRate);
      const quoteToTaker = notional.minus(feeQuote);
      legs.push(
        { userId: taker.userId, kind: "LOCKED", asset: base, amount: q.neg() },
        { userId: maker.userId, kind: "LOCKED", asset: quote, amount: notional.neg() },
        { userId: taker.userId, kind: "AVAILABLE", asset: quote, amount: quoteToTaker },
        { userId: maker.userId, kind: "AVAILABLE", asset: base, amount: q },
        { userId: sys, kind: "AVAILABLE", asset: quote, amount: feeQuote },
      );
    } else {
      throw new Error(`unknown taker side ${taker.side}`);
    }

    const idempotencyKey = `fill:${fill.id}`;
    await postLedgerTransactionInTx(tx, {
      type: "FILL",
      idempotencyKey,
      referenceType: "Fill",
      referenceId: fill.id,
      legs,
    });

    const touched = [
      { userId: taker.userId, kind: "LOCKED", asset: taker.side === "BUY" ? quote : base },
      { userId: taker.userId, kind: "AVAILABLE", asset: taker.side === "BUY" ? base : quote },
      { userId: maker.userId, kind: "LOCKED", asset: taker.side === "BUY" ? base : quote },
      { userId: maker.userId, kind: "AVAILABLE", asset: taker.side === "BUY" ? quote : base },
      { userId: sys, kind: "AVAILABLE", asset: taker.side === "BUY" ? base : quote },
    ];
    await assertNonNegativeBalances(tx, touched);

    await tx.fill.update({
      where: { id: fill.id },
      data: { ledgerApplied: true },
    });
  });
}
