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

  async findByClientMutationId(
    clientMutationId: string,
    tenantId: string
  ): Promise<IBandhaki | null> {
    return BandhakiModel.findOne({ clientMutationId, tenantId, deletedAt: null })
      .populate("customer", "name phone address")
      .lean() as unknown as IBandhaki | null;
  }

  async findById(id: string, tenantId: string): Promise<IBandhaki | null> {
    return BandhakiModel.findOne({ _id: id, tenantId, deletedAt: null })
      .populate("customer", "name phone address")
      .lean() as unknown as IBandhaki | null;
  }

  async findActiveByTenant(tenantId: string): Promise<any[]> {
    return BandhakiModel.find({
      status: { $in: ["active", "defaulted"] },
      tenantId,
      deletedAt: null,
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
      deletedAt: null,
    })
      .select("loanNumber principalAmount interestRate interestType loanDate paymentStatus status")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findPaginated(tenantId: string, options: PaginationOptions): Promise<PaginatedResult> {
    const { page, limit, query, status } = options;
    const skip = (page - 1) * limit;

    let filter: Record<string, unknown> = { tenantId, deletedAt: null };

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
        deletedAt: null,
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
      { _id: id, tenantId, deletedAt: null },
      data,
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async addImage(id: string, tenantId: string, image: { name: string; url: string; clientMutationId?: string }): Promise<IBandhaki | null> {
    // Idempotency: if a previously-replayed attach already pushed an image with
    // this key, return the document unchanged instead of duplicating it.
    if (image.clientMutationId) {
      const existing = await BandhakiModel.findOne({
        _id: id,
        tenantId,
        deletedAt: null,
        "images.clientMutationId": image.clientMutationId,
      });
      if (existing) {
        return existing as unknown as IBandhaki;
      }
    }
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      { $push: { images: image } },
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async deleteImage(id: string, tenantId: string, imageId: string): Promise<IBandhaki | null> {
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      { $pull: { images: { _id: imageId } } },
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async delete(id: string, tenantId: string): Promise<IBandhaki | null> {
    // Soft delete: set tombstone instead of removing the doc so offline sync
    // can tombstone down to the client via deletedAt.
    return BandhakiModel.findOneAndUpdate(
      { _id: id, tenantId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).lean() as unknown as IBandhaki | null;
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    return BandhakiModel.countDocuments({
      tenantId,
      status: { $in: ["active", "defaulted"] },
      deletedAt: null,
    });
  }

  async findUpsertsSince(tenantId: string, since: Date): Promise<any[]> {
    return BandhakiModel.find({
      tenantId,
      deletedAt: null,
      updatedAt: { $gt: since },
    })
      .populate("customer", "name phone address")
      .sort({ updatedAt: 1 })
      .lean();
  }

  async findDeletedIdsSince(tenantId: string, since: Date): Promise<string[]> {
    const docs = await BandhakiModel.find({
      tenantId,
      deletedAt: { $ne: null, $gt: since },
    })
      .select("_id")
      .lean();
    return docs.map((d) => (d as any)._id.toString());
  }
}
