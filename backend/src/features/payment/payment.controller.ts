import { Request, Response, NextFunction } from "express";
import { PaymentService } from "./payment.service";
import { sendSuccess } from "../../utils/api-response";

const paymentService = new PaymentService();

export class PaymentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.create(req.body, req.user!.tenantId);
      sendSuccess(res, result, "Payment recorded successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getByBandhaki(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await paymentService.getByBandhaki(req.params.bandhakiId as string, req.user!.tenantId);
      sendSuccess(res, { payments }, "Payments fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUpdatesSince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const since = req.query.since as string | undefined;
      const result = await paymentService.getUpdatesSince(
        req.user!.tenantId,
        since ? new Date(since) : undefined
      );
      sendSuccess(res, result, "Payment sync data fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}
