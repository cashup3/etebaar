import type { FastifyInstance } from "fastify";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { adminSecretOk } from "../lib/httpAuth.js";
import { ADMIN_DASHBOARD_HTML } from "./adminDashboardHtml.js";

const listQuery = z.object({
  take: z.coerce.number().int().min(1).max(500).optional().default(100),
  skip: z.coerce.number().int().min(0).optional().default(0),
});

function dec(v: unknown): string {
  if (v != null && typeof v === "object" && "toString" in v) {
    return (v as { toString: () => string }).toString();
  }
  return String(v);
}

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/admin", async (_req, reply) => {
    if (!config.adminSecret) {
      return reply
        .type("text/html")
        .send(
          "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Admin disabled</title></head><body style='font-family:system-ui;padding:2rem'><p>Set <strong>ADMIN_API_SECRET</strong> on the API process and restart.</p></body></html>",
        );
    }
    return reply.type("text/html").send(ADMIN_DASHBOARD_HTML);
  });

  await app.register(
    async (r) => {
      r.addHook("preHandler", async (req, reply) => {
        if (!config.adminSecret) {
          return reply.status(503).send({ error: "ADMIN_API_SECRET is not set" });
        }
        if (!adminSecretOk(req)) {
          return reply.status(401).send({ error: "Unauthorized" });
        }
      });

      r.get("/stats", async () => {
        const [users, orders, deposits, withdrawals, fills, fxOverrides, signupCodes, matchLogs] =
          await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.deposit.count(),
            prisma.withdrawal.count(),
            prisma.fill.count(),
            prisma.adminFxOverride.count(),
            prisma.signupVerificationCode.count(),
            prisma.matchLog.count(),
          ]);
        return {
          users,
          orders,
          deposits,
          withdrawals,
          fills,
          fxOverrides,
          signupCodes,
          matchLogs,
          time: new Date().toISOString(),
        };
      });

      r.get("/users", async (req, reply) => {
        const q = listQuery.merge(z.object({ q: z.string().optional() })).safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const where =
          q.data.q && q.data.q.trim()
            ? { email: { contains: q.data.q.trim(), mode: "insensitive" as const } }
            : undefined;
        const users = await prisma.user.findMany({
          where,
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          select: { id: true, email: true, fullName: true, phone: true, createdAt: true },
        });
        return { users };
      });

      r.get("/users/:id", async (req, reply) => {
        const id = (req.params as { id: string }).id;
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            createdAt: true,
            accounts: true,
            orders: { take: 30, orderBy: { createdAt: "desc" } },
          },
        });
        if (!user) return reply.status(404).send({ error: "Not found" });
        return {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            createdAt: user.createdAt,
            accounts: user.accounts.map((a) => ({
              ...a,
              balance: dec(a.balance),
            })),
            orders: user.orders.map((o) => ({
              ...o,
              price: dec(o.price),
              amount: dec(o.amount),
              filledAmount: dec(o.filledAmount),
              quoteReserved: dec(o.quoteReserved),
              baseReserved: dec(o.baseReserved),
            })),
          },
        };
      });

      r.get("/orders", async (req, reply) => {
        const q = listQuery
          .merge(
            z.object({
              status: z.string().optional(),
              symbol: z.string().optional(),
              userId: z.string().uuid().optional(),
            }),
          )
          .safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const where: Record<string, unknown> = {};
        if (q.data.status) where.status = q.data.status;
        if (q.data.symbol) where.symbol = q.data.symbol.toUpperCase();
        if (q.data.userId) where.userId = q.data.userId;
        const orders = await prisma.order.findMany({
          where,
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { email: true, id: true } } },
        });
        return {
          orders: orders.map((o) => ({
            id: o.id,
            userId: o.userId,
            user: o.user,
            clientOrderId: o.clientOrderId,
            symbol: o.symbol,
            side: o.side,
            price: dec(o.price),
            amount: dec(o.amount),
            filledAmount: dec(o.filledAmount),
            quoteReserved: dec(o.quoteReserved),
            baseReserved: dec(o.baseReserved),
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
          })),
        };
      });

      r.get("/orders/:id", async (req, reply) => {
        const id = (req.params as { id: string }).id;
        const o = await prisma.order.findUnique({
          where: { id },
          include: { user: { select: { email: true, id: true } } },
        });
        if (!o) return reply.status(404).send({ error: "Not found" });
        return {
          order: {
            ...o,
            price: dec(o.price),
            amount: dec(o.amount),
            filledAmount: dec(o.filledAmount),
            quoteReserved: dec(o.quoteReserved),
            baseReserved: dec(o.baseReserved),
          },
        };
      });

      r.get("/deposits", async (req, reply) => {
        const q = listQuery
          .merge(z.object({ status: z.string().optional(), userId: z.string().uuid().optional() }))
          .safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const where: Record<string, unknown> = {};
        if (q.data.status) where.status = q.data.status;
        if (q.data.userId) where.userId = q.data.userId;
        const deposits = await prisma.deposit.findMany({
          where,
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { email: true, id: true } } },
        });
        return {
          deposits: deposits.map((d) => ({
            id: d.id,
            userId: d.userId,
            user: d.user,
            asset: d.asset,
            amount: dec(d.amount),
            status: d.status,
            externalRef: d.externalRef,
            confirmationsRequired: d.confirmationsRequired,
            confirmationsCurrent: d.confirmationsCurrent,
            createdAt: d.createdAt,
          })),
        };
      });

      r.get("/withdrawals", async (req, reply) => {
        const q = listQuery
          .merge(z.object({ status: z.string().optional(), userId: z.string().uuid().optional() }))
          .safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const where: Record<string, unknown> = {};
        if (q.data.status) where.status = q.data.status;
        if (q.data.userId) where.userId = q.data.userId;
        const withdrawals = await prisma.withdrawal.findMany({
          where,
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { email: true, id: true } } },
        });
        return {
          withdrawals: withdrawals.map((w) => ({
            id: w.id,
            userId: w.userId,
            user: w.user,
            asset: w.asset,
            amount: dec(w.amount),
            toAddress: w.toAddress,
            status: w.status,
            createdAt: w.createdAt,
          })),
        };
      });

      r.get("/fills", async (req, reply) => {
        const q = listQuery
          .merge(
            z.object({
              symbol: z.string().optional(),
              ledgerApplied: z.enum(["true", "false"]).optional(),
            }),
          )
          .safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const where: Record<string, unknown> = {};
        if (q.data.symbol) where.symbol = q.data.symbol.toUpperCase();
        if (q.data.ledgerApplied === "true") where.ledgerApplied = true;
        if (q.data.ledgerApplied === "false") where.ledgerApplied = false;
        const fills = await prisma.fill.findMany({
          where,
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
        });
        return {
          fills: fills.map((f) => ({
            id: f.id,
            symbol: f.symbol,
            makerOrderId: f.makerOrderId,
            takerOrderId: f.takerOrderId,
            price: dec(f.price),
            quantity: dec(f.quantity),
            ledgerApplied: f.ledgerApplied,
            createdAt: f.createdAt,
          })),
        };
      });

      r.get("/match-logs", async (req, reply) => {
        const q = listQuery.safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const logs = await prisma.matchLog.findMany({
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { seq: "desc" },
        });
        return {
          logs: logs.map((l) => ({
            seq: l.seq.toString(),
            event: l.event,
            payload: l.payload,
            createdAt: l.createdAt,
          })),
        };
      });

      r.get("/signup-codes", async (req, reply) => {
        const q = listQuery.safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const rows = await prisma.signupVerificationCode.findMany({
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          select: { email: true, expiresAt: true, createdAt: true },
        });
        return { rows };
      });

      r.get("/fx-overrides", async () => {
        const overrides = await prisma.adminFxOverride.findMany({
          orderBy: { currencyCode: "asc" },
        });
        return {
          overrides: overrides.map((o) => ({
            currencyCode: o.currencyCode,
            usdPerUnit: dec(o.usdPerUnit),
            note: o.note,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
          })),
        };
      });

      r.put<{ Params: { code: string } }>("/fx-overrides/:code", async (req, reply) => {
        const code = req.params.code.trim().toUpperCase();
        if (!/^[A-Z0-9]{2,12}$/.test(code)) {
          return reply.status(400).send({ error: "Invalid currency code" });
        }
        const parsed = z
          .object({ usdPerUnit: z.string().min(1), note: z.string().optional() })
          .safeParse(req.body);
        if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
        let d: Decimal;
        try {
          d = new Decimal(parsed.data.usdPerUnit);
        } catch {
          return reply.status(400).send({ error: "Invalid usdPerUnit number" });
        }
        if (d.lte(0)) return reply.status(400).send({ error: "usdPerUnit must be > 0" });
        const row = await prisma.adminFxOverride.upsert({
          where: { currencyCode: code },
          create: {
            currencyCode: code,
            usdPerUnit: d,
            note: parsed.data.note ?? null,
          },
          update: {
            usdPerUnit: d,
            note: parsed.data.note ?? null,
          },
        });
        return {
          override: {
            currencyCode: row.currencyCode,
            usdPerUnit: dec(row.usdPerUnit),
            note: row.note,
            updatedAt: row.updatedAt,
          },
        };
      });

      r.delete<{ Params: { code: string } }>("/fx-overrides/:code", async (req, reply) => {
        const code = req.params.code.trim().toUpperCase();
        try {
          await prisma.adminFxOverride.delete({ where: { currencyCode: code } });
        } catch {
          return reply.status(404).send({ error: "Not found" });
        }
        return { ok: true };
      });

      r.get("/ledger-txs", async (req, reply) => {
        const q = listQuery.safeParse(req.query);
        if (!q.success) return reply.status(400).send({ error: q.error.flatten() });
        const txs = await prisma.ledgerTransaction.findMany({
          take: q.data.take,
          skip: q.data.skip,
          orderBy: { createdAt: "desc" },
          include: { lines: { include: { account: { select: { userId: true, kind: true, asset: true } } } } },
        });
        return {
          transactions: txs.map((t) => ({
            id: t.id,
            type: t.type,
            idempotencyKey: t.idempotencyKey,
            referenceType: t.referenceType,
            referenceId: t.referenceId,
            meta: t.meta,
            createdAt: t.createdAt,
            lines: t.lines.map((ln) => ({
              id: ln.id,
              asset: ln.asset,
              amount: dec(ln.amount),
              account: ln.account,
            })),
          })),
        };
      });
    },
    { prefix: "/admin/api" },
  );
}
