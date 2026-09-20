import crypto from "crypto";

/**
 * Password-reset and email-verification tokens: a random value is emailed
 * to the user, but only its SHA-256 hash is ever stored. A leaked database
 * never yields a usable token, and the raw value is never logged.
 */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** 6-digit SMS one-time code. Only the hash is ever stored; the code itself is never logged. */
export function generateOtp(): { code: string; codeHash: string } {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return { code, codeHash: hashToken(code) };
}

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

/** Constant-time compare for hashes, so a timing side-channel can't shave off match attempts. */
export function safeCompareHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
