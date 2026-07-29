import mongoose from "mongoose";
import { env } from "./env";

// Serverless invocations reuse a warm process, and several can start at once on
// a cold start. The connection promise is cached on the global object so they
// share a single pool instead of each opening their own.
declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose
      .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
      });
  }

  try {
    await global.mongooseConnection;
  } catch (error) {
    // Drop the rejected promise so the next request retries instead of
    // replaying the same failure for the lifetime of the process.
    global.mongooseConnection = undefined;
    throw error;
  }
}
