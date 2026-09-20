import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import jwt from "jsonwebtoken";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);

  let email = "";
  let password = "";

  try {
    const body = await req.json();
    email = String(body?.email || "").trim().toLowerCase();
    password = body?.password || "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const ipLimit = rateLimit(`admin-login-ip:${ip}`, 10, 10 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`admin-login-email:${email}`, 8, 10 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  // Same generic message and same code path whether the account doesn't
  // exist, the password is wrong, or the account is deactivated — none of
  // those cases may be distinguishable from the response.
  const user = await User.findOne({ email });
  const isMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !isMatch || user.status === "deactivated") {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      sessionVersion: user.sessionVersion || 0,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  await AuditLog.create({
    actorEmail: email,
    actorRole: user.role,
    action: "admin.login",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });

  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
