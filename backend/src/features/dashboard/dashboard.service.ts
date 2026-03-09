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
        .populate({
          path: "bandhaki",
          select: "loanNumber status principalAmount customer",
          match: { status: { $in: ["active", "defaulted"] } },
          populate: {
            path: "customer",
            select: "name phone",
          },
        })
        .lean(),
    ]);

    const filteredTransactions = recentTransactions
      .filter((t: any) => t.bandhaki)
      .slice(0, 5);

    return {
      totalCustomers,
      activeLoans,
      recentTransactions: filteredTransactions.map((t: any) => ({
        _id: t.bandhaki?._id?.toString() || t._id.toString(),
        amount: t.amount,
        paymentDate: t.paymentDate,
        paymentMethod: t.paymentMethod,
        loanNumber: t.bandhaki?.loanNumber || "N/A",
        principalAmount: t.bandhaki?.principalAmount || 0,
        status: t.bandhaki?.status || "active",
        customer: t.bandhaki?.customer
          ? {
              _id: t.bandhaki.customer._id?.toString(),
              name: t.bandhaki.customer.name || "Unknown",
              phone: t.bandhaki.customer.phone || "",
            }
          : undefined,
        interestComponent: t.interestComponent,
        principalComponent: t.principalComponent,
        createdAt: t.createdAt,
      })),
    };
  }
}
