require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@driveprimemotors.com";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD in environment.");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
    name: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  try {
    await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        email: ADMIN_EMAIL,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role: "admin",
        name: "Admin",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin ready");
    console.log(`Email: ${ADMIN_EMAIL}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error("Failed to reset admin:", err.message);
  process.exit(1);
});
