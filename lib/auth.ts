import AuditLog from "@/models/AuditLog";
import { connectDB } from "@/lib/mongodb";

export async function writeAuditLog({
  actorEmail,
  actorRole,
  action,
  entityType,
  entityId,
  ip,
  userAgent,
  meta,
}: {
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}) {
  await connectDB();

  await AuditLog.create({
    actorEmail,
    actorRole,
    action,
    entityType,
    entityId,
    ip,
    userAgent,
    meta,
  });
}