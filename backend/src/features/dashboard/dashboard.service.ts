import CustomerModel from "../../models/customer.model";
import BandhakiModel from "../../models/bandhaki.model";
import PaymentModel from "../../models/payment.model";

export class DashboardService {
  async getStats(tenantId: string) {
    const [totalCustomers, activeLoans, recentTransactions] = await Promise.all([
      CustomerModel.countDocuments({ tenantId }),
      BandhakiModel.countDocuments({
        tenantId,
        status: { $in: ["active", "defaulted"] },
      }),
      PaymentModel.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("bandhaki", "loanNumber")
        .lean(),
    ]);

    return {
      totalCustomers,
      activeLoans,
      recentTransactions: recentTransactions.map((t: any) => ({
        _id: t._id.toString(),
        amount: t.amount,
        paymentDate: t.paymentDate,
        paymentMethod: t.paymentMethod,
        loanNumber: t.bandhaki?.loanNumber || "N/A",
        interestComponent: t.interestComponent,
        principalComponent: t.principalComponent,
        createdAt: t.createdAt,
      })),
    };
  }
}
