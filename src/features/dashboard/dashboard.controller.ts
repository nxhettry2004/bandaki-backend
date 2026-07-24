import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";
import { sendSuccess } from "../../utils/api-response";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats(req.user!.tenantId);
      sendSuccess(res, stats, "Dashboard stats fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}
