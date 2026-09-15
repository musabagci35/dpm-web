// DEPRECATED: this file connects to a "dpm" database that is separate from
// the real dealership data, which lives in "driveprimemotors" (see
// lib/mongodb.ts, used everywhere else in the app). It was previously wired
// into lib/auth.ts and the dealer-assistant API route, causing those features
// to query an empty/wrong database. Both call sites have been switched to
// lib/mongodb.ts. Do not import connectDB from this file for new code — use
// lib/mongodb.ts instead. Left in place (unused) rather than deleted so this
// history isn't lost; safe to remove once confirmed nothing else needs it.
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing");
}

declare global {
  var mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cached = global.mongooseCache || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "dpm",
    });
  }

  cached.conn = await cached.promise;
  global.mongooseCache = cached;
  return cached.conn;
}