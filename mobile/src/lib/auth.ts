import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./api";
import {
  clearBiometricCredential,
  getBiometricCredential,
  storeBiometricCredential,
} from "./biometricAuth";

const SESSION_KEY = "dpm_admin_session";
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Mirrors the safe fields GET /api/admin/me returns (password hash is
 * already stripped server-side via `.select("-passwordHash")`). This is
 * the ONLY thing ever persisted on-device — never the JWT itself, which
 * is an httpOnly cookie and is never exposed to JavaScript by design,
 * and never the password.
 */
export type AdminUser = {
  _id: string;
  email: string;
  role: string;
  name?: string;
};

/**
 * Carries the real HTTP status and the server's own (sanitized — it can
 * only ever contain the fields our API routes return, never a password)
 * response body, so the login screen can show exactly what happened
 * instead of a generic "didn't work".
 */
export class AdminAuthError extends Error {
  status?: number;
  body?: string;

  constructor(message: string, status?: number, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Lets the tab bar (which decides whether to show the Admin tab at all —
 * see app/(tabs)/_layout.tsx) react immediately to a login or logout
 * instead of only picking it up on the next mount/focus check.
 */
type AdminAuthListener = (user: AdminUser | null) => void;
const authListeners = new Set<AdminAuthListener>();

export function subscribeAdminAuthChange(listener: AdminAuthListener): () => void {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function notifyAdminAuthChange(user: AdminUser | null) {
  authListeners.forEach((listener) => listener(user));
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * fetch() with a hard timeout. Without this, a request stuck on a redirect
 * or a dropped connection leaves the caller's promise unsettled forever —
 * from the login screen that looks exactly like "nothing happened", with
 * the Sign In button spinning indefinitely and no error ever shown.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new AdminAuthError(
      aborted
        ? `${label} timed out after ${REQUEST_TIMEOUT_MS / 1000}s contacting ${url}.`
        : `${label} failed: ${err instanceof Error ? err.message : "network error"} (${url}).`
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Calls the real GET /api/admin/me. Returns null on any non-2xx response. */
export async function fetchAdminMe(): Promise<AdminUser | null> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/me`,
    { credentials: "include" },
    "Session check"
  );

  if (!res.ok) return null;

  const data = await parseJsonSafe(res);
  if (!data || !data._id) return null;

  return data as AdminUser;
}

/**
 * Same as fetchAdminMe(), but for the moment right after a login POST: here
 * a failure is unexpected and worth explaining (status + body), rather than
 * the ordinary "not signed in yet" case fetchAdminMe() covers everywhere else.
 */
async function fetchAdminMeOrThrow(): Promise<AdminUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/me`,
    { credentials: "include" },
    "Session verification"
  );

  const data = await parseJsonSafe(res);

  if (!res.ok || !data?._id) {
    throw new AdminAuthError(
      `Login appeared to succeed, but the session did not verify (GET /api/admin/me → ${res.status}). ` +
        `This usually means the admin-token cookie from the login response wasn't sent back — ` +
        `check that the app is talking to the same host both times.`,
      res.status,
      JSON.stringify(data)
    );
  }

  return data as AdminUser;
}

/**
 * Logs in via the real POST /api/admin/login. That endpoint never returns
 * the JWT in the response body (httpOnly cookie only) — the server sets
 * the cookie, and the platform's native networking layer (NSURLSession on
 * iOS, React Native's own cookie-jar-backed OkHttp client on Android) is
 * responsible for storing and resending it automatically on subsequent
 * requests to the same host. We never attempt to read or store the token
 * ourselves.
 *
 * Immediately after a "successful" login response, we verify the session
 * actually took hold by calling /api/admin/me — this is the real proof
 * the cookie persisted, rather than assuming it did.
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AdminUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/login`,
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
    // `data` here is only ever { error: "..." } from our own API — never the
    // password, which this client never receives back under any status.
    throw new AdminAuthError(
      `${data?.error || "Invalid email or password."} (HTTP ${res.status})`,
      res.status,
      JSON.stringify(data)
    );
  }

  const user = await fetchAdminMeOrThrow();

  if (user.role !== "admin") {
    // The account is real but not an admin — clear the session the server
    // just created rather than leaving an unused cookie on the device.
    await adminLogout();
    throw new AdminAuthError("This account does not have admin access.");
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  notifyAdminAuthChange(user);
  return user;
}

/** Calls the real POST /api/admin/logout and clears the local session marker. */
/** Always resolves the same way regardless of whether the email exists — the server response is deliberately generic. */
export async function adminForgotPassword(email: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/forgot-password`,
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

export async function adminLogout(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/admin/logout`,
      { method: "POST", credentials: "include" },
      "Logout request"
    );
  } catch {
    // Ignore network errors here — local state is still cleared below.
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
  notifyAdminAuthChange(null);
}

/** Signs out of every device — the server bumps sessionVersion and clears biometricCredentialHash, so this also permanently disables biometric sign-in until re-enrolled. */
export async function adminLogoutAll(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/admin/logout-all`,
      { method: "POST", credentials: "include" },
      "Logout-all request"
    );
  } catch {
    // Local state is still cleared below even if the network call fails.
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await clearBiometricCredential("admin");
  notifyAdminAuthChange(null);
}

/* ------------------------------------------------------------------ *
 * Phone + SMS one-time-code login
 * ------------------------------------------------------------------ */

/** Always resolves the same way regardless of whether the phone is enrolled — the server response is deliberately generic. */
export async function adminRequestOtpLogin(phone: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/otp/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    },
    "Login code request"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok && res.status === 503) {
    throw new AdminAuthError(data?.error || "SMS sign-in isn't available right now.", res.status);
  }
  return data?.message || "If that phone number has a verified admin account, a login code was sent.";
}

export async function adminVerifyOtpLogin(phone: string, code: string): Promise<AdminUser> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/otp/verify`,
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
    throw new AdminAuthError(data?.error || "That code is invalid or has expired.", res.status);
  }
  const user = await fetchAdminMe();
  if (!user || user.role !== "admin") {
    throw new AdminAuthError("Sign-in succeeded, but the session could not be verified as an admin.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  notifyAdminAuthChange(user);
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

export async function adminHasBiometricEnrolled(): Promise<boolean> {
  return Boolean(await getBiometricCredential("admin"));
}

/** Must only be called while already signed in — enrolling requires one real, already-completed login first. */
export async function adminEnrollBiometric(): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/biometric/register`,
    { method: "POST", credentials: "include" },
    "Biometric enrollment"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.credential || !data?.userId) {
    throw new AdminAuthError(data?.error || "Could not enable biometric sign-in.", res.status);
  }
  await storeBiometricCredential("admin", { id: data.userId, credential: data.credential });
}

export async function adminBiometricLogin(): Promise<AdminUser> {
  const stored = await getBiometricCredential("admin");
  if (!stored) {
    throw new AdminAuthError("Biometric sign-in isn't set up on this device.");
  }

  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/admin/biometric/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: stored.id, credential: stored.credential }),
    },
    "Biometric sign-in"
  );
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    await clearBiometricCredential("admin");
    throw new AdminAuthError(data?.error || "Biometric sign-in failed.", res.status);
  }
  const user = await fetchAdminMe();
  if (!user || user.role !== "admin") {
    throw new AdminAuthError("Sign-in succeeded, but the session could not be verified as an admin.");
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  notifyAdminAuthChange(user);
  return user;
}

/** Turns off biometric sign-in without touching the current password session. */
export async function adminRevokeBiometric(): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/api/admin/biometric/revoke`,
      { method: "POST", credentials: "include" },
      "Biometric revoke"
    );
  } catch {
    // Local credential is cleared below regardless of network outcome.
  }
  await clearBiometricCredential("admin");
}

/** Reads the locally-stored session marker without contacting the server. */
export async function getStoredAdminSession(): Promise<AdminUser | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

/**
 * The real security boundary is server-side: every admin API call is
 * independently verified by getAdminSession() regardless of what this
 * function returns. This just keeps the on-device UI state honest by
 * re-checking with the server (catches a revoked/expired session, or a
 * role change) before showing any admin screen.
 */
export async function verifyAdminSession(): Promise<AdminUser | null> {
  const stored = await getStoredAdminSession();
  if (!stored) return null;

  const user = await fetchAdminMe();

  if (!user || user.role !== "admin") {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}
