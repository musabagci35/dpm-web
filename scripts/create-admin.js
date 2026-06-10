import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.ts";

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);

  const password = "123456";
  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    email: "admin@driveprimemotors.com",
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin created with password: 123456");
  process.exit();
}

run();