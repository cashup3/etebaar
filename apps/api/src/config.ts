export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  corsOrigin: process.env.CORS_ORIGIN?.split(",") ?? true,
  internalSecret: process.env.INTERNAL_API_SECRET ?? "dev-internal-secret",
  /** Set in production. Protects /admin UI data API and manual FX overrides. */
  adminSecret: process.env.ADMIN_API_SECRET?.trim() ?? "",
  systemUserId:
    process.env.SYSTEM_USER_ID ?? "00000000-0000-0000-0000-000000000001",
  feeBps: Number(process.env.FEE_BPS ?? 10),
  withdrawalDailyLimit: process.env.WITHDRAWAL_DAILY_LIMIT_USDT ?? "100000",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-jwt-secret-in-production",
};
