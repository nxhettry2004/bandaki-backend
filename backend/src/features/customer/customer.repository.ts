import CustomerModel, { ICustomer } from "../../models/customer.model";

export class CustomerRepository {
  async create(data: Partial<ICustomer>): Promise<ICustomer> {
    return CustomerModel.create(data);
  }

  async findAllByTenant(tenantId: string): Promise<ICustomer[]> {
    return CustomerModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .lean() as unknown as ICustomer[];
  }

  async findById(id: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ _id: id, tenantId }).lean() as unknown as ICustomer | null;
  }

  async findByPhone(phone: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ phone, tenantId }).lean() as unknown as ICustomer | null;
  }

  async findByName(name: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOne({ name, tenantId }).lean() as unknown as ICustomer | null;
  }

  async update(id: string, tenantId: string, data: Partial<ICustomer>): Promise<ICustomer | null> {
    return CustomerModel.findOneAndUpdate(
      { _id: id, tenantId },
      data,
      { new: true }
    ).lean() as unknown as ICustomer | null;
  }

  async delete(id: string, tenantId: string): Promise<ICustomer | null> {
    return CustomerModel.findOneAndDelete({ _id: id, tenantId }).lean() as unknown as ICustomer | null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return CustomerModel.countDocuments({ tenantId });
  }
}
