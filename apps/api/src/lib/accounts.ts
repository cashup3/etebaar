import type { Prisma, PrismaClient } from "@prisma/client";
import { config } from "../config.js";

const DEFAULT_ASSETS = ["USDT", "BTC", "ETH"] as const;

export async function ensureUserAccounts(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
  assets: string[] = [...DEFAULT_ASSETS],
) {
  for (const asset of assets) {
    for (const kind of ["AVAILABLE", "LOCKED"] as const) {
      await db.account.upsert({
        where: {
          userId_kind_asset: { userId, kind, asset },
        },
        create: { userId, kind, asset, balance: 0 },
        update: {},
      });
    }
  }
}

export async function getAccountId(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
  kind: string,
  asset: string,
): Promise<string> {
  const row = await db.account.findUnique({
    where: { userId_kind_asset: { userId, kind, asset } },
  });
  if (!row) {
    throw new Error(`Missing account ${userId} ${kind} ${asset}`);
  }
  return row.id;
}

export function systemUserId() {
  return config.systemUserId;
}
