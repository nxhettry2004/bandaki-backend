import express from "express";
import cors from "cors";

import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./features/auth/auth.routes";
import customerRoutes from "./features/customer/customer.routes";
import bandhakiRoutes from "./features/bandhaki/bandhaki.routes";
import paymentRoutes from "./features/payment/payment.routes";
import dashboardRoutes from "./features/dashboard/dashboard.routes";

const app = express();

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    hostname === "127.0.0.1"
  );
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const parsedOrigin = new URL(origin);

    if (!["http:", "https:", "exp:"].includes(parsedOrigin.protocol)) {
      return false;
    }

    return parsedOrigin.hostname === "localhost" || isPrivateIpv4(parsedOrigin.hostname);
  } catch {
    return false;
  }
}

// Global middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Ensure a live MongoDB connection before any route runs. On serverless
// (Vercel) each invocation may be a cold instance, so we connect (or reuse
// the cached connection) per request instead of only once at boot.
app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Bandhaki API is running", timestamp: new Date().toISOString() });
});

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bandhaki", bandhakiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
