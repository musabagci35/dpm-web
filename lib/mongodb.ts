import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing in .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "driveprimemotors", // 🔥 BURASI ÇOK KRİTİK
    });
  }

  cached.conn = await cached.promise;

  console.log("✅ Connected to DB:", cached.conn.connection.name);

  return cached.conn;
}