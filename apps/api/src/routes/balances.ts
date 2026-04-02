import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { resolveUserId } from "../lib/requestUser.js";

export async function registerBalanceRoutes(app: FastifyInstance) {
  app.get("/balances", async (req, reply) => {
    const userId = resolveUserId(req, reply);
    if (!userId) return;
    const rows = await prisma.account.findMany({
      where: { userId },
      orderBy: [{ asset: "asc" }, { kind: "asc" }],
    });
    return rows.map((r) => ({
      asset: r.asset,
      kind: r.kind,
      balance: r.balance.toString(),
    }));
  });
}
