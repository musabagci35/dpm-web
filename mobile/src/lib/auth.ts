import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./api";

const SESSION_KEY = "dpm_admin_session";

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

export class AdminAuthError extends Error {}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Calls the real GET /api/admin/me. Returns null on any non-2xx response. */
export async function fetchAdminMe(): Promise<AdminUser | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/me`, {
    credentials: "include",
  });

  if (!res.ok) return null;

  const data = await parseJsonSafe(res);
  if (!data || !data._id) return null;

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
  const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new AdminAuthError(data?.error || "Invalid email or password.");
  }

  const user = await fetchAdminMe();

  if (!user) {
    throw new AdminAuthError(
      "Login succeeded but the session could not be verified on this device. Please try again."
    );
  }

  if (user.role !== "admin") {
    // The account is real but not an admin — clear the session the server
    // just created rather than leaving an unused cookie on the device.
    await adminLogout();
    throw new AdminAuthError("This account does not have admin access.");
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
  return user;
}

/** Calls the real POST /api/admin/logout and clears the local session marker. */
export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore network errors here — local state is still cleared below.
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
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
