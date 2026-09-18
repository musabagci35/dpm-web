import * as SecureStore from "expo-secure-store";

import { API_BASE_URL } from "./api";

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
