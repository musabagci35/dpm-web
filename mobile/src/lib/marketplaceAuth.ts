import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./api";
import {
  clearBiometricCredential,
  getBiometricCredential,
  storeBiometricCredential,
} from "./biometricAuth";

const SESSION_KEY = "dpm_seller_session";
const REQUEST_TIMEOUT_MS = 15000;

/**
 * A private marketplace seller — completely separate from AdminUser
 * (lib/auth.ts). A seller session can never grant dealer-admin access, and
 * this is never persisted alongside or merged with the admin session.
 */
export type SellerUser = {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
};

export class SellerAuthError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new SellerAuthError(
      aborted
        ? `${label} timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
        : `${label} failed: ${err instanceof Error ? err.message : "network error"}.`
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSellerMe(): Promise<SellerUser | null> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/me`,
    { credentials: "include" },
    "Session check"
  );
  if (!res.ok) return null;
  const data = await parseJsonSafe(res);
  if (!data || !data._id) return null;
  return data as SellerUser;
}

export async function sellerRegister(input: {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  phone?: string;
}): Promise<SellerUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    },
    "Account creation"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new SellerAuthError(data?.error || "Could not create your account.", res.status);
  }
  const user = await fetchSellerMe();
  if (!user) {
    throw new SellerAuthError("Account created, but the session could not be verified.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

export async function sellerLogin(email: string, password: string): Promise<SellerUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    },
    "Login request"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new SellerAuthError(
      `${data?.error || "Invalid email or password."} (HTTP ${res.status})`,
      res.status
    );
  }
  const user = await fetchSellerMe();
  if (!user) {
    throw new SellerAuthError("Login succeeded, but the session could not be verified.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

/** Always resolves the same way regardless of whether the email exists — the server response is deliberately generic. */
export async function sellerForgotPassword(email: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/forgot-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
    "Password reset request"
  );
  const data = await parseJsonSafe(res);
  return data?.message || "If an account exists for that email, a password reset link has been sent.";
}

export async function sellerResetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Password reset"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new SellerAuthError(data?.error || "Could not reset your password.", res.status);
  }
}

export async function sellerLogout(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/marketplace/auth/logout`,
      { method: "POST", credentials: "include" },
      "Logout request"
    );
  } catch {
    // Local state is still cleared below even if the network call fails.
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

/** Signs out of every device — the server bumps sessionVersion and clears biometricCredentialHash, so this also permanently disables biometric sign-in until re-enrolled. */
export async function sellerLogoutAll(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/marketplace/auth/logout-all`,
      { method: "POST", credentials: "include" },
      "Logout-all request"
    );
  } catch {
    // Local state is still cleared below even if the network call fails.
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await clearBiometricCredential("seller");
}

/**
 * Permanently deletes the signed-in account (Apple Guideline 5.1.1(v)) —
 * requires the current password even though a session is already active,
 * so a left-open or stolen session alone can never trigger this. On
 * success the server has already anonymized the account, hidden every
 * listing/auction it owns, and revoked every session; this only needs to
 * clear what's stored on this device.
 */
export async function sellerDeleteAccount(password: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/delete-account`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password, confirm: true }),
    },
    "Account deletion"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new SellerAuthError(data?.error || "Could not delete your account.", res.status);
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await clearBiometricCredential("seller");
}

/* ------------------------------------------------------------------ *
 * Phone + SMS one-time-code login
 * ------------------------------------------------------------------ */

/** Always resolves the same way regardless of whether the phone is enrolled — the server response is deliberately generic. */
export async function sellerRequestOtpLogin(phone: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/otp/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    },
    "Login code request"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok && res.status === 503) {
    throw new SellerAuthError(data?.error || "SMS sign-in isn't available right now.", res.status);
  }
  return data?.message || "If that phone number has a verified account, a login code was sent.";
}

export async function sellerVerifyOtpLogin(phone: string, code: string): Promise<SellerUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/otp/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone, code }),
    },
    "Code verification"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new SellerAuthError(data?.error || "That code is invalid or has expired.", res.status);
  }
  const user = await fetchSellerMe();
  if (!user) {
    throw new SellerAuthError("Sign-in succeeded, but the session could not be verified.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

/* ------------------------------------------------------------------ *
 * Face ID / Touch ID
 *
 * Every function here assumes the biometric *device* unlock already
 * happened (see lib/biometricAuth.ts's promptBiometricUnlock) — none of
 * this ever touches the actual Face ID/Touch ID scan, only the
 * already-unlocked device-bound credential.
 * ------------------------------------------------------------------ */

export async function sellerHasBiometricEnrolled(): Promise<boolean> {
  return Boolean(await getBiometricCredential("seller"));
}

/** Must only be called while already signed in — enrolling requires one real, already-completed login first. */
export async function sellerEnrollBiometric(): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/biometric/register`,
    { method: "POST", credentials: "include" },
    "Biometric enrollment"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.credential || !data?.sellerId) {
    throw new SellerAuthError(data?.error || "Could not enable biometric sign-in.", res.status);
  }
  await storeBiometricCredential("seller", { id: data.sellerId, credential: data.credential });
}

export async function sellerBiometricLogin(): Promise<SellerUser> {
  const stored = await getBiometricCredential("seller");
  if (!stored) {
    throw new SellerAuthError("Biometric sign-in isn't set up on this device.");
  }

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/marketplace/auth/biometric/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sellerId: stored.id, credential: stored.credential }),
    },
    "Biometric sign-in"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    // The server already revoked a mismatched credential — the stale
    // local copy must go too, so the next attempt falls straight through
    // to password/phone instead of retrying a credential that can never work again.
    await clearBiometricCredential("seller");
    throw new SellerAuthError(data?.error || "Biometric sign-in failed.", res.status);
  }
  const user = await fetchSellerMe();
  if (!user) {
    throw new SellerAuthError("Sign-in succeeded, but the session could not be verified.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

/** Turns off biometric sign-in without touching the current password session. */
export async function sellerRevokeBiometric(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/marketplace/auth/biometric/revoke`,
      { method: "POST", credentials: "include" },
      "Biometric revoke"
    );
  } catch {
    // Local credential is cleared below regardless of network outcome.
  }
  await clearBiometricCredential("seller");
}

export async function getStoredSellerSession(): Promise<SellerUser | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SellerUser;
  } catch {
    return null;
  }
}

export async function verifySellerSession(): Promise<SellerUser | null> {
  const stored = await getStoredSellerSession();
  if (!stored) return null;

  const user = await fetchSellerMe();
  if (!user) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}
