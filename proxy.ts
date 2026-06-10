import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "dpm_admin_session";

function sign(value: string) {
  const secret = process.env.AUTH_SECRET || "fallback_secret";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function verifySessionValue(sessionValue: string) {
  const [payload, signature] = sessionValue.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAdminPath = pathname.startsWith("/admin");
  const isLoginPath = pathname === "/admin/login";
  const isAdminApiLogin = pathname === "/api/admin/login";
  const isAdminApiLogout = pathname === "/api/admin/logout";

  if (!isAdminPath && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (isLoginPath || isAdminApiLogin || isAdminApiLogout) {
    return NextResponse.next();
  }

  const session = req.cookies.get(COOKIE_NAME)?.value;
  const authenticated = session ? verifySessionValue(session) : false;

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};