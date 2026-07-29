import type { IncomingMessage, ServerResponse } from "http";

import { validateEnv } from "../src/config/env";
import { connectDB } from "../src/config/database";
import app from "../src/app";

// Vercel entrypoint. Serverless functions cannot listen on a port, so the
// Express app is invoked directly. `src/server.ts` stays the local dev entry.
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    validateEnv();
    await connectDB();
  } catch (error) {
    console.error("❌ Startup failure:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Service unavailable" }));
    return;
  }

  app(req, res);
}
