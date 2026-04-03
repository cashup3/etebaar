import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateSixDigitCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

function pepper(): string {
  return process.env.OTP_PEPPER ?? "dev-otp-pepper-change-in-production";
}

export function hashSignupOtp(email: string, code: string): string {
  return createHash("sha256")
    .update(`${pepper()}\n${email.toLowerCase().trim()}\n${code}`)
    .digest("hex");
}

export function verifySignupOtp(email: string, code: string, codeHash: string): boolean {
  const h = hashSignupOtp(email, code);
  try {
    const a = Buffer.from(h, "hex");
    const b = Buffer.from(codeHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
