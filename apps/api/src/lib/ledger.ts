import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { config } from "../config.js";
import { prisma } from "./prisma.js";
import { getAccountId } from "./accounts.js";

export type LedgerLeg = {
  userId: string;
  kind: string;
  asset: string;
  amount: Decimal;
};

function toPrismaDecimal(d: Decimal): Prisma.Decimal {
  return new PrismaNS.Decimal(d.toFixed());
}

function assertZeroNet(legs: LedgerLeg[]) {
  const byAsset = new Map<string, Decimal>();
  for (const leg of legs) {
    const k = leg.asset.toUpperCase();
    byAsset.set(k, (byAsset.get(k) ?? new Decimal(0)).plus(leg.amount));
  }
  for (const [, sum] of byAsset) {
    if (!sum.isZero()) {
      throw new Error(`Ledger not balanced for asset: ${sum.toFixed()}`);
    }
  }
}

export async function postLedgerTransactionInTx(
  tx: Prisma.TransactionClient,
  args: {
    type: string;
    idempotencyKey?: string;
    referenceType?: string;
    referenceId?: string;
    meta?: Prisma.InputJsonValue;
    legs: LedgerLeg[];
  },
): Promise<{ id: string; duplicate: boolean }> {
  assertZeroNet(args.legs);

  if (args.idempotencyKey) {
    const existing = await tx.ledgerTransaction.findUnique({
      where: { idempotencyKey: args.idempotencyKey },
    });
    if (existing) {
      return { id: existing.id, duplicate: true };
    }
  }

  const ledgerTx = await tx.ledgerTransaction.create({
    data: {
      type: args.type,
      idempotencyKey: args.idempotencyKey,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      meta: args.meta ?? undefined,
    },
  });

  for (const leg of args.legs) {
    const accountId = await getAccountId(tx, leg.userId, leg.kind, leg.asset);
    await tx.ledgerLine.create({
      data: {
        transactionId: ledgerTx.id,
        accountId,
        asset: leg.asset.toUpperCase(),
        amount: toPrismaDecimal(leg.amount),
      },
    });
    await tx.account.update({
      where: { id: accountId },
      data: {
        balance: { increment: toPrismaDecimal(leg.amount) },
      },
    });
  }

  return { id: ledgerTx.id, duplicate: false };
}

export async function postLedgerTransaction(args: {
  type: string;
  idempotencyKey?: string;
  referenceType?: string;
  referenceId?: string;
  meta?: Prisma.InputJsonValue;
  legs: LedgerLeg[];
}): Promise<{ id: string; duplicate: boolean }> {
  if (args.idempotencyKey) {
    const existing = await prisma.ledgerTransaction.findUnique({
      where: { idempotencyKey: args.idempotencyKey },
    });
    if (existing) {
      return { id: existing.id, duplicate: true };
    }
  }

  return prisma.$transaction((tx) => postLedgerTransactionInTx(tx, args));
}

export async function assertNonNegativeBalances(
  tx: Prisma.TransactionClient,
  touched: { userId: string; kind: string; asset: string }[],
) {
  for (const t of touched) {
    if (t.userId === config.systemUserId) continue;
    const acc = await tx.account.findUnique({
      where: {
        userId_kind_asset: {
          userId: t.userId,
          kind: t.kind,
          asset: t.asset.toUpperCase(),
        },
      },
    });
    if (!acc) continue;
    if (new Decimal(acc.balance.toString()).lt(0)) {
      throw new Error(
        `Negative balance ${t.userId} ${t.kind} ${t.asset}: ${acc.balance.toString()}`,
      );
    }
  }
}
