import type { FastifyInstance } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";
import { parseSymbol } from "../lib/symbol.js";
import {
  assertNonNegativeBalances,
  postLedgerTransactionInTx,
} from "../lib/ledger.js";
import { resolveUserId } from "../lib/requestUser.js";

const placeOrderBody = z.object({
  symbol: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  price: z.string().refine((s) => {
    try {
      return new Decimal(s).gt(0);
    } catch {
      return false;
    }
  }),
  amount: z.string().refine((s) => {
    try {
      return new Decimal(s).gt(0);
    } catch {
      return false;
    }
  }),
  clientOrderId: z.string().uuid(),
});

function toDec(s: string | Prisma.Decimal) {
  return new Decimal(typeof s === "string" ? s : s.toString());
}

export async function registerOrderRoutes(app: FastifyInstance) {
  app.post("/orders", async (req, reply) => {
    const userId = resolveUserId(req, reply);
    if (!userId) return;

    const parsed = placeOrderBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { base, quote } = parseSymbol(parsed.data.symbol);
    const price = new Decimal(parsed.data.price);
    const amount = new Decimal(parsed.data.amount);
    const symbol = parsed.data.symbol.toUpperCase();

    await ensureUserAccounts(prisma, userId, [base, quote]);

    const existing = await prisma.order.findUnique({
      where: {
        userId_clientOrderId: {
          userId,
          clientOrderId: parsed.data.clientOrderId,
        },
      },
    });
    if (existing) {
      return reply.status(200).send(existing);
    }

    const idemKey =
      typeof req.headers["idempotency-key"] === "string"
        ? req.headers["idempotency-key"]
        : `order:${userId}:${parsed.data.clientOrderId}`;

    try {
      const order = await prisma.$transaction(async (tx) => {
        const dup = await tx.ledgerTransaction.findUnique({
          where: { idempotencyKey: idemKey },
        });
        if (dup) {
          const o = await tx.order.findUnique({
            where: {
              userId_clientOrderId: {
                userId,
                clientOrderId: parsed.data.clientOrderId,
              },
            },
          });
          if (o) return o;
          throw new Error("Idempotency conflict");
        }

        const legs =
          parsed.data.side === "BUY"
            ? [
                {
                  userId,
                  kind: "AVAILABLE",
                  asset: quote,
                  amount: price.mul(amount).neg(),
                },
                {
                  userId,
                  kind: "LOCKED",
                  asset: quote,
                  amount: price.mul(amount),
                },
              ]
            : [
                {
                  userId,
                  kind: "AVAILABLE",
                  asset: base,
                  amount: amount.neg(),
                },
                {
                  userId,
                  kind: "LOCKED",
                  asset: base,
                  amount,
                },
              ];

        await postLedgerTransactionInTx(tx, {
          type: "ORDER_LOCK",
          idempotencyKey: idemKey,
          referenceType: "OrderClientId",
          referenceId: parsed.data.clientOrderId,
          legs,
        });

        await assertNonNegativeBalances(tx, [
          {
            userId,
            kind: "AVAILABLE",
            asset: parsed.data.side === "BUY" ? quote : base,
          },
        ]);

        return tx.order.create({
          data: {
            userId,
            clientOrderId: parsed.data.clientOrderId,
            symbol,
            side: parsed.data.side,
            price: parsed.data.price,
            amount: parsed.data.amount,
            filledAmount: 0,
            quoteReserved:
              parsed.data.side === "BUY" ? price.mul(amount).toFixed() : "0",
            baseReserved:
              parsed.data.side === "SELL" ? amount.toFixed() : "0",
            status: "OPEN",
          },
        });
      });

      return reply.status(201).send(order);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "order failed";
      return reply.status(400).send({ error: msg });
    }
  });

  app.post("/orders/:id/cancel", async (req, reply) => {
    const userId = resolveUserId(req, reply);
    if (!userId) return;
    const id = (req.params as { id: string }).id;

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id, userId },
        });
        if (!order) {
          throw Object.assign(new Error("Not found"), { status: 404 });
        }
        if (!["OPEN", "PARTIALLY_FILLED"].includes(order.status)) {
          throw Object.assign(new Error("Not cancelable"), { status: 400 });
        }

        const qRes = toDec(order.quoteReserved);
        const bRes = toDec(order.baseReserved);
        const { base, quote } = parseSymbol(order.symbol);

        const legs = [];
        if (qRes.gt(0)) {
          legs.push(
            { userId, kind: "LOCKED", asset: quote, amount: qRes.neg() },
            { userId, kind: "AVAILABLE", asset: quote, amount: qRes },
          );
        }
        if (bRes.gt(0)) {
          legs.push(
            { userId, kind: "LOCKED", asset: base, amount: bRes.neg() },
            { userId, kind: "AVAILABLE", asset: base, amount: bRes },
          );
        }

        if (legs.length > 0) {
          await postLedgerTransactionInTx(tx, {
            type: "ORDER_CANCEL_RELEASE",
            idempotencyKey: `cancel:${order.id}`,
            referenceType: "Order",
            referenceId: order.id,
            legs,
          });
        }

        await assertNonNegativeBalances(tx, [
          { userId, kind: "LOCKED", asset: quote },
          { userId, kind: "LOCKED", asset: base },
          { userId, kind: "AVAILABLE", asset: quote },
          { userId, kind: "AVAILABLE", asset: base },
        ]);

        return tx.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELED",
            quoteReserved: "0",
            baseReserved: "0",
          },
        });
      });

      return updated;
    } catch (e) {
      const err = e as Error & { status?: number };
      const code = err.status ?? 400;
      return reply.status(code).send({ error: err.message });
    }
  });
}
