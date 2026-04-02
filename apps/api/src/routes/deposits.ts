import type { FastifyInstance } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";
import {
  assertNonNegativeBalances,
  postLedgerTransaction,
} from "../lib/ledger.js";
import { resolveUserId } from "../lib/requestUser.js";

const createDeposit = z.object({
  asset: z.string().min(1),
  amount: z.string().refine((s) => {
    try {
      return new Decimal(s).gt(0);
    } catch {
      return false;
    }
  }),
  externalRef: z.string().optional(),
  confirmationsRequired: z.number().int().min(1).max(500).optional(),
});

const confirmBody = z.object({
  confirmationsCurrent: z.number().int().min(0),
});

function assertInternal(req: { headers: Record<string, unknown> }) {
  const h = req.headers["x-internal-secret"];
  return typeof h === "string" && h === config.internalSecret;
}

export async function registerDepositRoutes(app: FastifyInstance) {
  app.post("/deposits", async (req, reply) => {
    const userId = resolveUserId(req, reply);
    if (!userId) return;
    const parsed = createDeposit.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    await ensureUserAccounts(prisma, userId, [parsed.data.asset.toUpperCase()]);

    const dep = await prisma.deposit.create({
      data: {
        userId,
        asset: parsed.data.asset.toUpperCase(),
        amount: parsed.data.amount,
        externalRef: parsed.data.externalRef,
        confirmationsRequired:
          parsed.data.confirmationsRequired ?? 12,
        confirmationsCurrent: 0,
        status: "PENDING",
      },
    });
    return dep;
  });

  app.post("/deposits/:id/confirm", async (req, reply) => {
    if (!assertInternal(req)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const id = (req.params as { id: string }).id;
    const parsed = confirmBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const dep = await prisma.deposit.findUnique({ where: { id } });
    if (!dep) return reply.status(404).send({ error: "Not found" });
    if (dep.status === "CONFIRMED") {
      return dep;
    }

    const next = await prisma.deposit.update({
      where: { id },
      data: {
        confirmationsCurrent: parsed.data.confirmationsCurrent,
        status:
          parsed.data.confirmationsCurrent >= dep.confirmationsRequired
            ? "CONFIRMED"
            : "PENDING",
      },
    });

    if (
      next.status === "CONFIRMED" &&
      dep.status !== "CONFIRMED"
    ) {
      const idem = `deposit:${next.id}`;
      await postLedgerTransaction({
        type: "DEPOSIT_CONFIRM",
        idempotencyKey: idem,
        referenceType: "Deposit",
        referenceId: next.id,
        legs: [
          {
            userId: next.userId,
            kind: "AVAILABLE",
            asset: next.asset,
            amount: new Decimal(next.amount.toString()),
          },
          {
            userId: config.systemUserId,
            kind: "POOL",
            asset: next.asset,
            amount: new Decimal(next.amount.toString()).neg(),
          },
        ],
      });
      await prisma.$transaction(async (tx) => {
        await assertNonNegativeBalances(tx, [
          { userId: next.userId, kind: "AVAILABLE", asset: next.asset },
        ]);
      });
    }

    return next;
  });
}
