import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ensureUserAccounts } from "../lib/accounts.js";
import { signUserToken, verifyUserToken } from "../lib/authJwt.js";
import { generateSixDigitCode, hashSignupOtp, verifySignupOtp } from "../lib/signupOtp.js";

const phoneSchema = z
  .string()
  .trim()
  .min(8, "phone_short")
  .max(32, "phone_long")
  .regex(/^[\d+\s().-]+$/, "phone_format");

const sendVerificationBody = z.object({
  email: z.string().email(),
});

const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  verificationCode: z.string().regex(/^\d{6}$/, "code_format"),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const userPublicSelect = { id: true, email: true, fullName: true, phone: true } as const;

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/signup/send-verification", async (req, reply) => {
    const parsed = sendVerificationBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    await prisma.signupVerificationCode.deleteMany({ where: { email } });

    const code = generateSixDigitCode();
    const codeHash = hashSignupOtp(email, code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.signupVerificationCode.create({
      data: { email, codeHash, expiresAt },
    });

    req.log.info({ email, code }, "signup email verification code (check server logs; configure email provider for production)");

    const payload: { ok: true; devCode?: string } = { ok: true };
    if (process.env.OTP_DEV_RETURN === "1") {
      payload.devCode = code;
    }
    return reply.status(200).send(payload);
  });

  app.post("/auth/signup", async (req, reply) => {
    const parsed = signupBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const row = await prisma.signupVerificationCode.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!row || !verifySignupOtp(email, parsed.data.verificationCode, row.codeHash)) {
      return reply.status(400).send({ error: "Invalid or expired verification code" });
    }

    await prisma.signupVerificationCode.deleteMany({ where: { email } });

    const passwordHash = await bcrypt.hash(parsed.data.password, 11);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    });
    await ensureUserAccounts(prisma, user.id);
    const token = signUserToken(user.id, email);
    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        email,
        fullName: user.fullName,
        phone: user.phone,
      },
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
    return {
      token,
      user: {
        id: user.id,
        email,
        fullName: user.fullName,
        phone: user.phone,
      },
    };
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
      select: userPublicSelect,
    });
    if (!user?.email) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    return { user };
  });
}
