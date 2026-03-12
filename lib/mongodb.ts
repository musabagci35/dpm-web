import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

global._mongooseConn ||= { conn: null, promise: null };

export async function connectDB() {
  if (global._mongooseConn!.conn) return global._mongooseConn!.conn;

  if (!global._mongooseConn!.promise) {
    global._mongooseConn!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  global._mongooseConn!.conn = await global._mongooseConn!.promise;
  return global._mongooseConn!.conn;
}