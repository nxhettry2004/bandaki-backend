import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../utils/api-error";
import { AuthRepository } from "./auth.repository";
import { LoginInput } from "./auth.validation";
import { JwtPayload } from "../../types/express";

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  async login(data: LoginInput): Promise<{ token: string; user: JwtPayload }> {
    const user = await this.authRepo.findByUsernameOrEmail(data.username);

    if (!user) {
      throw ApiError.unauthorized("Invalid username or password");
    }

    // Prevent superadmin login via tenant endpoint
    if (user.role === "superadmin") {
      throw ApiError.unauthorized("Please use the admin login");
    }

    if (!user.password) {
      throw ApiError.unauthorized(
        "Please complete your account setup first. Check your email for the setup link."
      );
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid username or password");
    }

    if (!user.isActive) {
      throw ApiError.unauthorized(
        "Your account has been deactivated. Please contact the administrator."
      );
    }

    if (user.expiryDate && new Date() > user.expiryDate) {
      throw ApiError.unauthorized(
        "Your subscription has expired. Please contact the administrator."
      );
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user._id.toString(),
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);

    return { token, user: payload };
  }

  async getCurrentUser(userId: string): Promise<JwtPayload | null> {
    const user = await this.authRepo.findById(userId);
    if (!user || !user.isActive) return null;
    if (user.expiryDate && new Date() > user.expiryDate) return null;

    return {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "tenant",
      tenantId: user._id.toString(),
    };
  }

  async validateSetupToken(token: string): Promise<{ email: string }> {
    const user = await this.authRepo.findByResetToken(token);
    if (!user) {
      throw ApiError.badRequest("Invalid or expired setup token");
    }
    return { email: user.email };
  }

  async setupPassword(token: string, password: string): Promise<void> {
    const user = await this.authRepo.findByResetToken(token);
    if (!user) {
      throw ApiError.badRequest("Invalid or expired setup token");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.authRepo.updatePassword(user._id.toString(), hashedPassword);
  }
}
