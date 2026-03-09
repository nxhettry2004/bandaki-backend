import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware";  
import authRoutes from "./features/auth/auth.routes";
import customerRoutes from "./features/customer/customer.routes";
import bandhakiRoutes from "./features/bandhaki/bandhaki.routes";
import paymentRoutes from "./features/payment/payment.routes";
import dashboardRoutes from "./features/dashboard/dashboard.routes";

const app = express();

const ipOriginRegex = /^https?:\/\/(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)\d{1,3}\.\d{1,3}(:\d+)?$/;
const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Global middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (localhostOriginRegex.test(origin) || ipOriginRegex.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
