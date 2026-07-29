import dotenv from "dotenv";

// Resolved from the working directory, so it picks up backend/.env locally and
// is a silent no-op on Vercel, where variables come from the project settings.
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "8080", 10),
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  TOLERANCE_PRICE: parseFloat(process.env.TOLERANCE_PRICE || "10"),
} as const;

export function validateEnv(): void {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required");
  }
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
}
