import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../utils/api-response";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      if (!user) {
        res.status(401).json({ success: false, message: "User not found or inactive" });
        return;
      }
      sendSuccess(res, user, "User fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params.token as string;
      const result = await authService.validateSetupToken(token);
      sendSuccess(res, result, "Token is valid");
    } catch (error) {
      next(error);
    }
  }

  async setupPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.setupPassword(token, password);
      sendSuccess(res, null, "Password set up successfully");
    } catch (error) {
      next(error);
    }
  }
}
