import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";



async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const password = "123456";
  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    email: "admin@driveprimemotors.com",
    passwordHash,
    role: "admin",
  });

  console.log("✅ Admin created");
  process.exit(0);
}

run();