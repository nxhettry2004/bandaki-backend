import { ApiError } from "../../utils/api-error";
import { calculateInterest, calculateDaysBetween } from "../../utils/interest";
import { env } from "../../config/env";
import { PaymentRepository } from "./payment.repository";
import { CreatePaymentInput } from "./payment.validation";
import BandhakiModel from "../../models/bandhaki.model";
import { IPayment } from "../../models/payment.model";

export class PaymentService {
  private paymentRepo: PaymentRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
  }

  async create(data: CreatePaymentInput, tenantId: string): Promise<{ paymentId: string }> {
    const TOLERANCE_PRICE = env.TOLERANCE_PRICE;

    // Verify bandhaki entry exists and belongs to tenant
    const bandhakiEntry = await BandhakiModel.findOne({
      _id: data.bandhaki,
      tenantId,
    });

    if (!bandhakiEntry) {
      throw ApiError.notFound("Selected loan entry does not exist");
    }

    if (bandhakiEntry.status === "closed") {
      throw ApiError.badRequest("Cannot record payment on a closed loan");
    }

    // Calculate current interest due
    const daysSinceLastPayment = calculateDaysBetween(
      bandhakiEntry.lastInterestPaidDate,
      data.paymentDate
    );

    const currentInterestDue = calculateInterest(
      bandhakiEntry.outstandingPrincipal,
      bandhakiEntry.interestRate,
      daysSinceLastPayment,
      bandhakiEntry.interestType as "simple" | "compound"
    );

    const totalInterestDue = currentInterestDue + (bandhakiEntry.outstandingInterest || 0);

    // Payment allocation logic
    let finalInterestComponent = 0;
    let finalPrincipalComponent = 0;
    let newOutstandingInterest = 0;

    if (!data.interestComponent && !data.principalComponent) {
      // Only total amount provided - auto-allocate
      if (data.amount < totalInterestDue) {
        finalInterestComponent = data.amount;
        finalPrincipalComponent = 0;
        newOutstandingInterest = totalInterestDue - data.amount;
      } else {
        finalInterestComponent = totalInterestDue;
        const remainingAmount = data.amount - totalInterestDue;

        if (remainingAmount > TOLERANCE_PRICE) {
          finalPrincipalComponent = remainingAmount;
        }

        newOutstandingInterest = 0;
        bandhakiEntry.lastInterestPaidDate = new Date(data.paymentDate);
      }
    } else {
      // Component breakdown provided
      finalInterestComponent = data.interestComponent || 0;
      finalPrincipalComponent = data.principalComponent || 0;

      if (finalInterestComponent >= totalInterestDue) {
        const excessInterest = finalInterestComponent - totalInterestDue;

        if (excessInterest > TOLERANCE_PRICE) {
          finalPrincipalComponent += excessInterest;
          finalInterestComponent = totalInterestDue;
        }

        newOutstandingInterest = 0;
        bandhakiEntry.lastInterestPaidDate = new Date(data.paymentDate);
      } else {
        newOutstandingInterest = totalInterestDue - finalInterestComponent;
      }
    }

    // Update bandhaki entry
    const newOutstandingPrincipal = Math.max(
      0,
      bandhakiEntry.outstandingPrincipal - finalPrincipalComponent
    );

    bandhakiEntry.outstandingPrincipal = newOutstandingPrincipal;
    bandhakiEntry.outstandingInterest = newOutstandingInterest;
    bandhakiEntry.totalPaidAmount = (bandhakiEntry.totalPaidAmount || 0) + data.amount;
    bandhakiEntry.lastInterestPaidDate = new Date(data.paymentDate);

    // Update payment status and auto-close if fully paid
    if (
      newOutstandingPrincipal <= TOLERANCE_PRICE &&
      newOutstandingInterest <= TOLERANCE_PRICE
    ) {
      bandhakiEntry.paymentStatus = "paid";
      bandhakiEntry.status = "closed";
    } else if (bandhakiEntry.totalPaidAmount > 0) {
      bandhakiEntry.paymentStatus = "partial";
    }

    // Create payment record
    const newPayment = await this.paymentRepo.create({
      bandhaki: bandhakiEntry._id,
      paymentDate: new Date(data.paymentDate),
      amount: data.amount,
      interestComponent: finalInterestComponent,
      principalComponent: finalPrincipalComponent,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      tenantId: tenantId as any,
    });

    // Save updated bandhaki
    await bandhakiEntry.save();

    return { paymentId: newPayment._id.toString() };
  }

  async getByBandhaki(bandhakiId: string, tenantId: string): Promise<IPayment[]> {
    return this.paymentRepo.findByBandhaki(bandhakiId, tenantId);
  }

  async getRecent(tenantId: string, limit = 5): Promise<IPayment[]> {
    return this.paymentRepo.findRecentByTenant(tenantId, limit);
  }
}
