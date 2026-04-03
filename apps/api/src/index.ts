import Fastify from "fastify";
import cors from "@fastify/cors";
import { Redis } from "ioredis";
import { config } from "./config.js";
import { processUnappliedFills } from "./services/fillLedger.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerBalanceRoutes } from "./routes/balances.js";
import { registerDepositRoutes } from "./routes/deposits.js";
import { registerWithdrawalRoutes } from "./routes/withdrawals.js";
import { registerOrderRoutes } from "./routes/orders.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerMarketRoutes } from "./routes/market.js";
import { registerWs } from "./ws.js";

async function main() {
  const app = Fastify({ logger: true });
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: () => null,
  });
  redis.on("error", (err) => {
    app.log.warn({ err }, "redis error");
  });

  await app.register(cors, { origin: config.corsOrigin });
  await registerWs(app, redis);

  app.get("/", async () => ({
    service: "etebaar-api",
    message: "HTTP API is running. This is not the website.",
    health: "/health",
    ws: "/ws",
    hint: "Open the Next.js app (usually http://localhost:3000) for the UI.",
  }));

  app.get("/health", async () => ({
    ok: true,
    service: "etebaar-api",
    time: new Date().toISOString(),
    redis: redis.status,
  }));

  await registerUserRoutes(app);
  await registerAuthRoutes(app);
  await registerMarketRoutes(app);
  await registerBalanceRoutes(app);
  await registerDepositRoutes(app);
  await registerWithdrawalRoutes(app);
  await registerOrderRoutes(app);

  app.get("/markets/:symbol/book", async (req, reply) => {
    const symbol = (req.params as { symbol: string }).symbol.toUpperCase();
    try {
      const raw = await redis.get(`book:${symbol}`);
      if (!raw) {
        return reply.status(404).send({ error: "No book snapshot yet" });
      }
      return reply.type("application/json").send(JSON.parse(raw));
    } catch {
      return reply.status(503).send({ error: "Redis unavailable" });
    }
  });

  setInterval(() => {
    void processUnappliedFills(80).catch((err) => {
      app.log.warn({ err }, "fill processor skipped (DB likely down)");
    });
  }, 800);

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
