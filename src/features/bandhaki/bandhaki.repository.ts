import BandhakiModel, { IBandhaki } from "../../models/bandhaki.model";
import CustomerModel from "../../models/customer.model";

export interface PaginationOptions {
  page: number;
  limit: number;
  query?: string;
  status?: string;
}

export interface PaginatedResult {
  entries: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export class BandhakiRepository {
  async create(data: Partial<IBandhaki>): Promise<IBandhaki> {
    const bandhaki = new BandhakiModel(data);
    return bandhaki.save();
  }

  async findById(id: string, tenantId: string): Promise<IBandhaki | null> {
    return BandhakiModel.findOne({ _id: id, tenantId })
      .populate("customer", "name phone address")
      .lean() as unknown as IBandhaki | null;
  }

  async findActiveByTenant(tenantId: string): Promise<any[]> {
    return BandhakiModel.find({
      status: { $in: ["active", "defaulted"] },
      tenantId,
    })
      .populate("customer", "name phone")
      .select("loanNumber principalAmount paymentStatus status customer loanDate")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByCustomer(customerId: string, tenantId: string): Promise<any[]> {
    return BandhakiModel.find({
      customer: customerId,
      status: { $in: ["active", "defaulted"] },
      tenantId,
    })
      .select("loanNumber principalAmount interestRate interestType loanDate paymentStatus status")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findPaginated(tenantId: string, options: PaginationOptions): Promise<PaginatedResult> {
    const { page, limit, query, status } = options;
    const skip = (page - 1) * limit;

    let filter: Record<string, unknown> = { tenantId };

    if (status && status !== 'all') {
      if (status === 'active') {
        filter.status = { $in: ['active', 'defaulted'] };
      } else {
        filter.status = status;
      }
    }

    if (query) {
      const searchRegex = new RegExp(query, "i");

      // Find customers matching name or phone within tenant
      const matchingCustomers = await CustomerModel.find({
        tenantId,
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      }).select("_id");

      const customerIds = matchingCustomers.map((c) => c._id);

      filter = {
        ...filter,
        $or: [
          { loanNumber: searchRegex },
          { customer: { $in: customerIds } },
        ],
      };
    }

    const [entries, totalCount] = await Promise.all([
      BandhakiModel.find(filter)
        .populate("customer", "name phone")
        .select("loanNumber principalAmount interestRate interestType loanDate paymentStatus status customer")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BandhakiModel.countDocuments(filter),
    ]);

    return {
      entries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    };
  }

  async update(id: string, tenantId: string, data: Partial<IBandhaki>): Promise<IBandhaki | null> {
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId },
      data,
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async addImage(id: string, tenantId: string, image: { name: string; url: string }): Promise<IBandhaki | null> {
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $push: { images: image } },
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async deleteImage(id: string, tenantId: string, imageId: string): Promise<IBandhaki | null> {
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId },
      { $pull: { images: { _id: imageId } } },
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async delete(id: string, tenantId: string): Promise<IBandhaki | null> {
    return BandhakiModel.findOneAndDelete({ _id: id, tenantId }).lean() as unknown as IBandhaki | null;
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    return BandhakiModel.countDocuments({
      tenantId,
      status: { $in: ["active", "defaulted"] },
    });
  }
}
