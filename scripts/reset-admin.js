const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb+srv://Drivermotor65:f6bNKK74RnmgIQvp@cluster0.ahoub.mongodb.net/dpm?retryWrites=true&w=majority";

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

  await User.findOneAndUpdate(
    { email: "admin@driveprimemotors.com" },
    {
      email: "admin@driveprimemotors.com",
      passwordHash: await bcrypt.hash("123456", 10),
      role: "admin",
      name: "Admin",
    },
    { upsert: true, new: true }
  );

  console.log("✅ Admin ready");
  console.log("Email: admin@driveprimemotors.com");
  console.log("Password: 123456");

  await mongoose.disconnect();
}

run().catch(console.error);
