import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "dpm_admin_session";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || "fallback_secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionValue(email: string) {
  const payload = `${email}|admin`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionValue(sessionValue: string) {
  const [payload, signature] = sessionValue.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return false;
  return verifySessionValue(session);
}