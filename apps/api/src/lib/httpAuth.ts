import type { FastifyRequest } from "fastify";
import { config } from "../config.js";

export function internalSecretOk(req: FastifyRequest): boolean {
  const h = req.headers["x-internal-secret"];
  return typeof h === "string" && h === config.internalSecret;
}

export function adminSecretOk(req: FastifyRequest): boolean {
  if (!config.adminSecret) return false;
  const h = req.headers["x-admin-secret"];
  return typeof h === "string" && h === config.adminSecret;
}
