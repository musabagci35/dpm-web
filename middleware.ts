import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // sadece admin koru
  if (url.pathname.startsWith("/admin")) {
    const auth = req.headers.get("authorization");

    const username = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASS;

    if (!auth) {
      return new Response("Auth required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    const base64 = auth.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString();
    const [user, pass] = decoded.split(":");

    if (user !== username || pass !== password) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};