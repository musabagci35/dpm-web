import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin-token";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAdminPath = pathname.startsWith("/admin");

  if (!isAdminPath && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Every one of these is reachable specifically because the visitor is
  // *not* authenticated yet — signing in, and every step of recovering a
  // forgotten password (by definition, before a session exists).
  const PUBLIC_ADMIN_PATHS = new Set([
    "/admin/login",
    "/admin/reset-password",
    "/api/admin/login",
    "/api/admin/logout",
    "/api/admin/forgot-password",
    "/api/admin/forgot-password/sms",
    "/api/admin/reset-password",
    "/api/admin/reset-password/sms",
    "/api/admin/biometric/login",
    "/api/admin/otp/request",
    "/api/admin/otp/verify",
  ]);

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};