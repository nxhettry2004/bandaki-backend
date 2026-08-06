import CustomerModel, { ICustomer } from "../../models/customer.model";

export class CustomerRepository {
  async create(data: Partial<ICustomer>): Promise<ICustomer> {
    return CustomerModel.create(data);
  }

  async findAllByTenant(tenantId: string): Promise<ICustomer[]> {
    return CustomerModel.find({ tenantId, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean() as unknown as ICustomer[];
  }

  async findById(id: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ _id: id, tenantId, deletedAt: null }).lean() as unknown as ICustomer | null;
  }

  async findByPhone(phone: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ phone, tenantId, deletedAt: null }).lean() as unknown as ICustomer | null;
  }

  async findByName(name: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ name, tenantId, deletedAt: null }).lean() as unknown as ICustomer | null;
  }

  async findByClientMutationId(
    clientMutationId: string,
    tenantId: string
  ): Promise<ICustomer | null> {
    return CustomerModel.findOne({ clientMutationId, tenantId, deletedAt: null }).lean() as unknown as ICustomer | null;
  }

  async update(id: string, tenantId: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    return CustomerModel.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      data,
      { new: true }
    ).lean() as unknown as ICustomer | null;
  }

  async delete(id: string, tenantId: string): Promise<ICustomer | null> {
    // Soft delete: set tombstone instead of removing the doc so offline sync
    // can tombstone down to the client via deletedAt.
    return CustomerModel.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).lean() as unknown as ICustomer | null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return CustomerModel.countDocuments({ tenantId, deletedAt: null });
  }

  async findUpsertsSince(tenantId: string, since: Date): Promise<ICustomer[]> {
    return CustomerModel.find({
      tenantId,
      deletedAt: null,
      updatedAt: { $gt: since },
    })
      .sort({ updatedAt: 1 })
      .lean() as unknown as ICustomer[];
  }

  async findDeletedIdsSince(tenantId: string, since: Date): Promise<string[]> {
    const docs = await CustomerModel.find({
      tenantId,
      deletedAt: { $ne: null, $gt: since },
    })
      .select("_id")
      .lean();
    return docs.map((d) => (d as any)._id.toString());
  }
}
