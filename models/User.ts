import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "sales"],
      default: "sales",
      required: true,
    },
    name: { type: String },

    status: { type: String, enum: ["active", "deactivated"], default: "active" },

    phone: { type: String, trim: true, default: "" },
    phoneVerified: { type: Boolean, default: false },

    // Same revocation mechanism as MarketplaceSeller — see that model for
    // the full rationale. Bumping this invalidates every JWT issued before it.
    sessionVersion: { type: Number, default: 0 },

    resetTokenHash: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    resetTokenUsed: { type: Boolean, default: false },

    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },

    biometricCredentialHash: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
