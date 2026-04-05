import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { internalSecretOk } from "../lib/httpAuth.js";

/** Server-to-server: Next.js convert route merges these over live FX (same `usdPerUnit` semantics). */
export async function registerInternalFxOverrideRoutes(app: FastifyInstance) {
  app.get("/internal/fx-overrides", async (req, reply) => {
    if (!internalSecretOk(req)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const rows = await prisma.adminFxOverride.findMany();
    const overrides: Record<string, string> = {};
    for (const r of rows) {
      overrides[r.currencyCode.toUpperCase()] = r.usdPerUnit.toString();
    }
    return reply.send({ overrides });
  });
}
