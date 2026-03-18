import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, index: true },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    entityType: { type: String },
    entityId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);