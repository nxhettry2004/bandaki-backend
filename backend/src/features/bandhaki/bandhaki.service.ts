import { ApiError } from "../../utils/api-error";
import { calculateInterest, calculateDaysBetween } from "../../utils/interest";
import { BandhakiRepository, PaginatedResult } from "./bandhaki.repository";
import { CreateBandhakiInput, UpdateBandhakiInput, AddImageInput } from "./bandhaki.validation";
import CustomerModel from "../../models/customer.model";
import PaymentModel from "../../models/payment.model";
import UserModel from "../../models/user.model";

export class BandhakiService {
  private bandhakiRepo: BandhakiRepository;

  constructor() {
    this.bandhakiRepo = new BandhakiRepository();
  }

  async create(data: CreateBandhakiInput, tenantId: string, username: string) {
    // Verify customer exists
    const customer = await CustomerModel.findById(data.customer);
    if (!customer) {
      throw ApiError.badRequest("Selected customer does not exist");
    }

    // Get user document for createdBy
    const userDoc = await UserModel.findOne({ username });
    if (!userDoc) {
      throw ApiError.badRequest("User not found");
    }

    const savedBandhaki = await this.bandhakiRepo.create({
      customer: customer._id,
      loanDate: new Date(data.loanDate),
      lastInterestPaidDate: new Date(data.loanDate),
      principalAmount: data.principalAmount,
      outstandingPrincipal: data.principalAmount,
      interestRate: data.interestRate,
      interestType: data.interestType,
      goldItems: data.goldItems,
      images: data.images || [],
      totalValuation: data.totalValuation || 0,
      status: data.status,
      paymentStatus: data.paymentStatus,
      createdBy: userDoc._id,
      tenantId: tenantId as any,
    });

    return {
      _id: savedBandhaki._id.toString(),
      loanNumber: savedBandhaki.loanNumber,
      loanDate: savedBandhaki.loanDate.toISOString(),
      principalAmount: savedBandhaki.principalAmount,
      interestRate: savedBandhaki.interestRate,
      interestType: savedBandhaki.interestType,
      goldItems: savedBandhaki.goldItems,
      totalValuation: savedBandhaki.totalValuation,
      status: savedBandhaki.status,
      paymentStatus: savedBandhaki.paymentStatus,
      customer: {
        _id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        address: customer.address || "",
      },
    };
  }

  async getActive(tenantId: string) {
    const entries = await this.bandhakiRepo.findActiveByTenant(tenantId);

    return entries.map((entry: any) => ({
      _id: entry._id.toString(),
      loanNumber: entry.loanNumber || "N/A",
      customerName: entry.customer?.name || "Unknown",
      customerPhone: entry.customer?.phone || "N/A",
      principalAmount: entry.principalAmount || 0,
      paymentStatus: entry.paymentStatus || "pending",
      status: entry.status || "active",
      loanDate: entry.loanDate,
      customer: entry.customer
        ? {
            _id: entry.customer._id.toString(),
            name: entry.customer.name || "Unknown",
            phone: entry.customer.phone || "",
          }
        : undefined,
    }));
  }

  async getByCustomer(customerId: string, tenantId: string) {
    const entries = await this.bandhakiRepo.findByCustomer(customerId, tenantId);

    const loansWithDetails = await Promise.all(
      entries.map(async (entry: any) => {
        const loanDate = new Date(entry.loanDate);
        if (isNaN(loanDate.getTime())) return null;

        const today = new Date();
        const daysSinceLoan = Math.floor(
          (today.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const payments = await PaymentModel.find({ bandhaki: entry._id }).lean();
        const paidAmount = payments.reduce(
          (sum: number, p: any) => sum + (p.amount || 0), 0
        );
        const paidPrincipal = payments.reduce(
          (sum: number, p: any) => sum + (p.principalComponent || 0), 0
        );

        let calculatedInterest = 0;
        const principal = entry.principalAmount;
        const rate = entry.interestRate / 100;
        const days = daysSinceLoan;

        if (entry.interestType === "simple") {
          calculatedInterest = (principal * rate * days) / 30;
        } else if (entry.interestType === "compound") {
          const months = days / 30;
          calculatedInterest = principal * (Math.pow(1 + rate, months) - 1);
        }

        const outstandingPrincipal = principal - paidPrincipal;
        const totalDue = outstandingPrincipal + calculatedInterest;

        return {
          _id: entry._id.toString(),
          loanNumber: entry.loanNumber,
          principalAmount: principal,
          interestRate: entry.interestRate,
          interestType: entry.interestType,
          loanDate: loanDate.toISOString().split("T")[0],
          daysSinceLoan,
          paidAmount,
          outstandingPrincipal,
          calculatedInterest: Math.round(calculatedInterest * 100) / 100,
          totalDue: Math.round(totalDue * 100) / 100,
          paymentStatus: entry.paymentStatus,
          status: entry.status,
        };
      })
    );

    return loansWithDetails.filter(Boolean);
  }

  async getById(id: string, tenantId: string) {
    const entry = await this.bandhakiRepo.findById(id, tenantId);
    if (!entry) {
      throw ApiError.notFound("Loan entry not found");
    }

    const loanDate = new Date(entry.loanDate);
    if (isNaN(loanDate.getTime())) {
      throw ApiError.badRequest("Invalid loan date in entry");
    }

    let lastInterestPaidDate = new Date(entry.lastInterestPaidDate);
    if (isNaN(lastInterestPaidDate.getTime())) {
      lastInterestPaidDate = loanDate;
    }

    const today = new Date();
    const daysSinceLoan = calculateDaysBetween(lastInterestPaidDate, today);

    const payments = await PaymentModel.find({ bandhaki: entry._id }).lean();
    const paidAmount = payments.reduce(
      (sum: number, p: any) => sum + (p.amount || 0), 0
    );
    const paidPrincipal = payments.reduce(
      (sum: number, p: any) => sum + (p.principalComponent || 0), 0
    );

    const principal = entry.principalAmount;
    const calculatedInterest = calculateInterest(
      principal,
      entry.interestRate,
      daysSinceLoan,
      entry.interestType
    );

    const outstandingPrincipal = principal - paidPrincipal;
    const outstandingInterest = entry.outstandingInterest || 0;
    const totalDue = outstandingPrincipal + calculatedInterest + outstandingInterest;

    return {
      customerName: (entry.customer as any)?.name || "Unknown",
      _id: entry._id.toString(),
      loanNumber: entry.loanNumber,
      principalAmount: principal,
      interestRate: entry.interestRate,
      interestType: entry.interestType,
      lastInterestPaidDate: lastInterestPaidDate.toISOString().split("T")[0],
      loanDate: loanDate.toISOString().split("T")[0],
      daysSinceLoan,
      paidAmount,
      outstandingInterest,
      outstandingPrincipal,
      images: entry.images || [],
      goldItems: entry.goldItems || [],
      totalValuation: entry.totalValuation || 0,
      calculatedInterest: Math.round(calculatedInterest * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      paymentStatus: entry.paymentStatus,
      status: entry.status,
    };
  }

  async getAll(tenantId: string, page = 1, limit = 10, query = "", status = ""): Promise<PaginatedResult> {
    return this.bandhakiRepo.findPaginated(tenantId, { page, limit, query, status });
  }

  async update(id: string, tenantId: string, data: UpdateBandhakiInput) {
    // Verify customer exists
    const customer = await CustomerModel.findById(data.customer);
    if (!customer) {
      throw ApiError.badRequest("Selected customer does not exist");
    }

    const updated = await this.bandhakiRepo.update(id, tenantId, {
      customer: customer._id,
      loanDate: new Date(data.loanDate),
      principalAmount: data.principalAmount,
      interestRate: data.interestRate,
      interestType: data.interestType,
      goldItems: data.goldItems,
      images: data.images || [],
      totalValuation: data.totalValuation || 0,
      status: data.status,
      paymentStatus: data.paymentStatus,
    });

    if (!updated) {
      throw ApiError.notFound("Loan entry not found");
    }

    return {
      _id: updated._id.toString(),
      loanNumber: updated.loanNumber,
      loanDate: (updated.loanDate as Date).toISOString(),
      principalAmount: updated.principalAmount,
      interestRate: updated.interestRate,
      interestType: updated.interestType,
      goldItems: updated.goldItems,
      totalValuation: updated.totalValuation,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      customer: {
        _id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        address: customer.address || "",
      },
    };
  }

  async addImage(id: string, tenantId: string, imageData: AddImageInput) {
    const updated = await this.bandhakiRepo.addImage(id, tenantId, imageData);
    if (!updated) {
      throw ApiError.notFound("Loan not found");
    }
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const result = await this.bandhakiRepo.delete(id, tenantId);
    if (!result) {
      throw ApiError.notFound("Loan entry not found");
    }
  }
}
