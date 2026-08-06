import PaymentModel, { IPayment } from "../../models/payment.model";

export class PaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return PaymentModel.create(data);
  }

  async findByClientMutationId(
    clientMutationId: string,
    tenantId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ clientMutationId, tenantId }).lean() as unknown as IPayment | null;
  }

  async findByBandhaki(bandhakiId: string, tenantId: string): Promise<IPayment[]> {
    return PaymentModel.find({ bandhaki: bandhakiId, tenantId })
      .sort({ paymentDate: -1 })
      .lean() as unknown as IPayment[];
  }

  async findRecentByTenant(tenantId: string, limit = 5): Promise<IPayment[]> {
    return PaymentModel.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("bandhaki", "loanNumber")
      .lean() as unknown as IPayment[];
  }

  async findUpsertsSince(tenantId: string, since: Date): Promise<IPayment[]> {
    return PaymentModel.find({
      tenantId,
      updatedAt: { $gt: since },
    })
      .sort({ updatedAt: 1 })
      .lean() as unknown as IPayment[];
  }
}
