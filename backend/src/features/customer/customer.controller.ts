import { Request, Response, NextFunction } from "express";
import { CustomerService } from "./customer.service";
import { sendSuccess } from "../../utils/api-response";

const customerService = new CustomerService();

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.create(req.body, req.user!.tenantId);
      sendSuccess(res, customer, "Customer created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await customerService.getAll(req.user!.tenantId);
      sendSuccess(res, { customers }, "Customers fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getById(req.params.id as string, req.user!.tenantId);
      sendSuccess(res, customer, "Customer fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.update(req.params.id as string, req.user!.tenantId, req.body);
      sendSuccess(res, customer, "Customer updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerService.delete(req.params.id as string, req.user!.tenantId);
      sendSuccess(res, null, "Customer deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
