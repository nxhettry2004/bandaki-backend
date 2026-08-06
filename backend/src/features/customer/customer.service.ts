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
    // Idempotency: a replayed offline create carrying the same key must return
    // the existing record instead of inserting a duplicate.
    if (data.clientMutationId) {
      const existing = await this.customerRepo.findByClientMutationId(
        data.clientMutationId,
        tenantId
      );
      if (existing) return existing;
    }

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

  async getUpdatesSince(tenantId: string, since?: Date): Promise<{
    upserts: Array<{
      _id: string;
      name: string;
      phone: string | null;
      address: string | null;
      idProof: string | null;
      photoUrl: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    deletedIds: string[];
    serverTime: string;
  }> {
    // Capture start time before running queries so the returned cursor never
    // loses writes landing during this request's own execution window.
    const queryStartTime = new Date();
    const cursor = since ?? new Date(0);
    const upserts = await this.customerRepo.findUpsertsSince(tenantId, cursor);
    const deletedIds = await this.customerRepo.findDeletedIdsSince(tenantId, cursor);
    return {
      upserts: upserts.map((c) => this.toSyncShape(c)),
      deletedIds,
      serverTime: queryStartTime.toISOString(),
    };
  }

  private toSyncShape(c: ICustomer) {
    return {
      _id: c._id.toString(),
      name: c.name,
      phone: c.phone ?? null,
      address: c.address ?? null,
      idProof: c.idProof ?? null,
      photoUrl: c.photoUrl ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
