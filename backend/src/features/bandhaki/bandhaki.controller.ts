import { Request, Response, NextFunction } from "express";
import { BandhakiService } from "./bandhaki.service";
import { sendSuccess } from "../../utils/api-response";

const bandhakiService = new BandhakiService();

export class BandhakiController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await bandhakiService.create(req.body, req.user!.tenantId, req.user!.username);
      sendSuccess(res, result, "Loan entry created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loans = await bandhakiService.getActive(req.user!.tenantId);
      sendSuccess(res, { loans }, "Active loans fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const query = (req.query.query as string) || "";
      const status = (req.query.status as string) || "";
      const result = await bandhakiService.getAll(req.user!.tenantId, page, limit, query, status);
      sendSuccess(res, { loans: result.entries, pagination: result.pagination }, "Loans fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await bandhakiService.getById(req.params.id as string, req.user!.tenantId);
      sendSuccess(res, { entry }, "Loan entry fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getByCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loans = await bandhakiService.getByCustomer(req.params.customerId as string, req.user!.tenantId);
      sendSuccess(res, { loans }, "Customer loans fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await bandhakiService.update(req.params.id as string, req.user!.tenantId, req.body);
      sendSuccess(res, result, "Loan entry updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async addImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await bandhakiService.addImage(req.params.id as string, req.user!.tenantId, req.body);
      sendSuccess(res, null, "Image added successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await bandhakiService.deleteImage(req.params.id as string, req.user!.tenantId, req.params.imageId as string);
      sendSuccess(res, null, "Image deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await bandhakiService.delete(req.params.id as string, req.user!.tenantId);
      sendSuccess(res, null, "Loan entry deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUpdatesSince(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const since = req.query.since as string | undefined;
      const result = await bandhakiService.getUpdatesSince(
        req.user!.tenantId,
        since ? new Date(since) : undefined
      );
      sendSuccess(res, result, "Loan sync data fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}
