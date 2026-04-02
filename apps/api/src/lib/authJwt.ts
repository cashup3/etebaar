import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type JwtPayload = { sub: string; email: string };

export function signUserToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

export function verifyUserToken(token: string): JwtPayload | undefined {
  try {
    const p = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (typeof p.sub === "string" && typeof p.email === "string") return p;
  } catch {
    /* invalid */
  }
  return undefined;
}
