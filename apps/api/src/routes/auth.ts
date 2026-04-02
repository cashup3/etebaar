import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";
import { signUserToken, verifyUserToken } from "../lib/authJwt.js";

const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (req, reply) => {
    const parsed = signupBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 11);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });
    await ensureUserAccounts(prisma, user.id);
    const token = signUserToken(user.id, email);
    return reply.status(201).send({
      token,
      user: { id: user.id, email },
    });
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }
    const token = signUserToken(user.id, email);
    return { token, user: { id: user.id, email } };
  });

  app.get("/auth/me", async (req, reply) => {
    const auth = req.headers.authorization;
    if (typeof auth !== "string" || !auth.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const p = verifyUserToken(auth.slice(7).trim());
    if (!p) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: p.sub },
      select: { id: true, email: true },
    });
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    return { user };
  });
}
