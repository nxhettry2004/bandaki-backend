import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/express";
import UserModel, { IUser } from "../models/user.model";

/**
 * Authenticate JWT from Authorization header (Bearer token).
 * Attaches decoded user info to req.user.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Verify user still exists, is active, and not expired
    const user = await UserModel.findById(decoded.userId).select("-password").lean() as IUser | null;
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: "User account is inactive or not found" });
      return;
    }
    if (user.expiryDate && new Date() > user.expiryDate) {
      res.status(401).json({ success: false, message: "Your subscription has expired" });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "tenant",
      tenantId: user._id.toString(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token expired" });
      return;
    }
    next(error);
  }
}

/**
 * Require a specific role.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
