import { env, validateEnv } from "./config/env";
import { connectDB } from "./config/database";
import app from "./app";

async function main() {
  // Validate required environment variables
  validateEnv();

  // Connect to MongoDB
  await connectDB();

  // Start server
  app.listen(env.PORT, () => {
    console.log(`🚀 Bandhaki API server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
