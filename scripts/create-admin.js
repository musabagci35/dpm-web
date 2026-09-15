import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.ts";

const MONGO_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@driveprimemotors.com";

if (!MONGO_URI) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD in environment.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin created");
  console.log(`Email: ${ADMIN_EMAIL}`);
  process.exit();
}

run();
