import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { getAdminSession } from "@/lib/adminSession";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Revokes every session on every device — including this one — by bumping sessionVersion, and clears any biometric unlock credential. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.biometricCredentialHash = null;
  await user.save();

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.logout_all",
    entityType: "User",
    entityId: String(user._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin-token", "", { expires: new Date(0), path: "/" });
  return res;
}
