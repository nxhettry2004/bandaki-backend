import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./features/auth/auth.routes";
import customerRoutes from "./features/customer/customer.routes";
import bandhakiRoutes from "./features/bandhaki/bandhaki.routes";
import paymentRoutes from "./features/payment/payment.routes";
import dashboardRoutes from "./features/dashboard/dashboard.routes";

const app = express();

// Global middleware
// The client is a native app, which sends no Origin header, and auth is a
// Bearer token rather than a cookie — so there are no ambient credentials for
// an origin allowlist to protect. Open CORS keeps Expo dev, web builds and any
// future deployment domain working without configuration.
app.use(cors());
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
