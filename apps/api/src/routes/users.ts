import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";

const createUserBody = z.object({
  email: z.string().email().optional(),
});

export async function registerUserRoutes(app: FastifyInstance) {
  app.post("/users", async (req, reply) => {
    const parsed = createUserBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const user = await prisma.user.create({
      data: { email: parsed.data.email },
    });
    await ensureUserAccounts(prisma, user.id);
    return { id: user.id, email: user.email };
  });
}
