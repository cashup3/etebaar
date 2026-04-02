import type { FastifyInstance } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";
import {
  assertNonNegativeBalances,
  postLedgerTransactionInTx,
} from "../lib/ledger.js";
import { resolveUserId } from "../lib/requestUser.js";

const createWithdrawal = z.object({
  asset: z.string().min(1),
  amount: z.string().refine((s) => {
    try {
      return new Decimal(s).gt(0);
    } catch {
      return false;
    }
  }),
  toAddress: z.string().min(4),
});

export async function registerWithdrawalRoutes(app: FastifyInstance) {
  app.post("/withdrawals", async (req, reply) => {
    const userId = resolveUserId(req, reply);
    if (!userId) return;
    const parsed = createWithdrawal.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const asset = parsed.data.asset.toUpperCase();
    const amount = new Decimal(parsed.data.amount);
    await ensureUserAccounts(prisma, userId, [asset]);

    const limit = new Decimal(config.withdrawalDailyLimit);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (asset === "USDT") {
      const agg = await prisma.withdrawal.aggregate({
        where: {
          userId,
          asset: "USDT",
          status: { in: ["REQUESTED", "APPROVED", "SENT"] },
          createdAt: { gte: since },
        },
        _sum: { amount: true },
      });
      const used = new Decimal(agg._sum.amount?.toString() ?? "0");
      if (used.plus(amount).gt(limit)) {
        return reply.status(400).send({
          error: "Daily USDT withdrawal limit exceeded",
          limit: limit.toFixed(),
          used: used.toFixed(),
        });
      }
    }

    try {
      const wd = await prisma.$transaction(async (tx) => {
        const wdRow = await tx.withdrawal.create({
          data: {
            userId,
            asset,
            amount: parsed.data.amount,
            toAddress: parsed.data.toAddress,
            status: "REQUESTED",
          },
        });

        await postLedgerTransactionInTx(tx, {
          type: "WITHDRAWAL_REQUEST",
          idempotencyKey: `withdrawal:${wdRow.id}`,
          referenceType: "Withdrawal",
          referenceId: wdRow.id,
          legs: [
            {
              userId,
              kind: "AVAILABLE",
              asset,
              amount: amount.neg(),
            },
            {
              userId: config.systemUserId,
              kind: "ESCROW",
              asset,
              amount,
            },
          ],
        });

        await assertNonNegativeBalances(tx, [
          { userId, kind: "AVAILABLE", asset },
        ]);

        return wdRow;
      });

      return wd;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "withdrawal failed";
      return reply.status(400).send({ error: msg });
    }
  });
}
