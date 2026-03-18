import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

async function main() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    email,
    passwordHash,
    role: "admin",
    name: "Admin",
  });

  console.log("Admin created");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});