import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyUserToken } from "./authJwt.js";

/**
 * Prefer `Authorization: Bearer` (login); fall back to `X-User-Id` for local dev.
 */
export function resolveUserId(
  req: FastifyRequest,
  reply: FastifyReply,
): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    const p = verifyUserToken(token);
    if (p?.sub) return p.sub;
    void reply.status(401).send({ error: "Invalid or expired session" });
    return undefined;
  }
  const x = req.headers["x-user-id"];
  if (typeof x === "string" && x.length > 0) return x;
  void reply.status(401).send({ error: "Sign in required" });
  return undefined;
}
