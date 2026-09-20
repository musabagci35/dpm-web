import mongoose, { Schema, models, model } from "mongoose";

/**
 * A private marketplace seller account — deliberately separate from
 * models/User.ts (Drive Prime Motors staff/admin accounts). Sellers never
 * get a role, never get admin/sales permissions, and staff credentials are
 * never valid here. Keeping these fully separate is what keeps "Sell My
 * Car" listings from ever being reachable through dealer-staff auth.
 */
const ModerationNoteSchema = new Schema(
  {
    note: { type: String, trim: true, required: true },
    addedByEmail: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MarketplaceSellerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    /**
     * active — normal account.
     * frozen — admin hold (e.g. a payment/verification issue); reversible.
     * suspended — admin action for a policy/TOS violation; reversible, kept
     *   distinct from "frozen" only for audit/reporting clarity — both are
     *   enforced identically everywhere in code (see lib/sellerModeration.ts).
     * deleted — soft-deleted; the record and its audit trail are kept, PII
     *   is scrubbed. Never set outside the admin delete-account action.
     */
    status: { type: String, enum: ["active", "frozen", "suspended", "deleted"], default: "active", index: true },
    statusReason: { type: String, trim: true, default: "" },
    moderationNotes: { type: [ModerationNoteSchema], default: [] },
    deletedAt: { type: Date, default: null },

    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, default: null },
    emailVerifyTokenExpiresAt: { type: Date, default: null },

    phoneVerified: { type: Boolean, default: false },

    // Bumped on every password reset / "log out everywhere" / freeze /
    // suspend / delete so every previously-issued JWT — which embeds the
    // version it was signed with — stops verifying, without needing a
    // server-side session store. This is the only real revocation
    // mechanism for a stateless JWT.
    sessionVersion: { type: Number, default: 0 },

    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    resetTokenUsed: { type: Boolean, default: false },

    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },

    // Device-bound biometric unlock credential — never the password itself.
    // Cleared (not just left stale) on password reset, logout-all, freeze,
    // suspend, delete, or a credential mismatch, so a device that had
    // biometric unlock enabled can never keep using it past one of those events.
    biometricCredentialHash: { type: String, default: null },
  },
  { timestamps: true }
);

const MarketplaceSeller =
  models.MarketplaceSeller || model("MarketplaceSeller", MarketplaceSellerSchema);

export default MarketplaceSeller;
