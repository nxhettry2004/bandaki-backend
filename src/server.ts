import os from "os";

import { env, validateEnv } from "./config/env";
import { connectDB } from "./config/database";
import app from "./app";

function getLanUrls(port: number): string[] {
  const interfaces = os.networkInterfaces();

  return Object.values(interfaces)
    .flat()
    .filter((network): network is os.NetworkInterfaceInfo => Boolean(network && network.family === "IPv4" && !network.internal))
    .map((network) => `http://${network.address}:${port}`);
}

// Validate required environment variables as soon as the module loads, so a
// misconfigured deployment fails fast on both serverless and local.
validateEnv();

// On Vercel the Express app is invoked as a serverless handler — there is no
// long-running process, so we must NOT call app.listen(). We connect to Mongo
// per request (see middleware in app.ts) and just export the app.
if (!process.env.VERCEL) {
  // Local / traditional server: eagerly connect and start listening.
  connectDB()
    .then(() => {
      app.listen(env.PORT, "0.0.0.0", () => {
        const lanUrls = getLanUrls(env.PORT);

        console.log(`🚀 Bandhaki API server running on port ${env.PORT}`);
        console.log(`   Environment: ${env.NODE_ENV}`);
        console.log(`   Health: http://localhost:${env.PORT}/api/health`);

        if (lanUrls.length > 0) {
          console.log("   LAN URLs:");
          lanUrls.forEach((url) => {
            console.log(`   - ${url}/api/health`);
          });
        }
      });
    })
    .catch((error) => {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    });
}

export default app;
