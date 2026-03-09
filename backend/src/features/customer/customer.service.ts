import { ApiError } from "../../utils/api-error";
import { CustomerRepository } from "./customer.repository";
import { CreateCustomerInput, UpdateCustomerInput } from "./customer.validation";
import { ICustomer } from "../../models/customer.model";

export class CustomerService {
  private customerRepo: CustomerRepository;

  constructor() {
    this.customerRepo = new CustomerRepository();
  }

  async create(data: CreateCustomerInput, tenantId: string): Promise<ICustomer> {
    // Check for duplicate: by phone within same tenant if phone is provided
    if (data.phone && data.phone.length > 0) {
      const existing = await this.customerRepo.findByPhone(data.phone, tenantId);
      if (existing) {
        throw ApiError.conflict("A customer with this phone already exists.");
      }
    } else {
      // If no phone, check by name
      const existing = await this.customerRepo.findByName(data.name, tenantId);
      if (existing) {
        throw ApiError.conflict("A customer with this name already exists.");
      }
    }

    return this.customerRepo.create({ ...data, tenantId } as any);
  }

  async getAll(tenantId: string): Promise<ICustomer[]> {
    return this.customerRepo.findAllByTenant(tenantId);
  }

  async getById(id: string, tenantId: string): Promise<ICustomer> {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
    return customer;
  }

  async update(id: string, tenantId: string, data: UpdateCustomerInput): Promise<ICustomer> {
    const customer = await this.customerRepo.update(id, tenantId, data);
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
    return customer;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepo.delete(id, tenantId);
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
  }
}
