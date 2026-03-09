import mongoose, { Document, Schema } from "mongoose";

interface IPayment extends Document {
  bandhaki: mongoose.Types.ObjectId;
  paymentDate: Date;
  amount: number;
  interestComponent: number;
  principalComponent?: number;
  paymentMethod: string;
  notes?: string;
  tenantId: mongoose.Types.ObjectId; // User who owns this payment
}

const PaymentSchema: Schema = new Schema(
  {
    bandhaki: { type: Schema.Types.ObjectId, ref: "Bandhaki", required: true },
    paymentDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    interestComponent: { type: Number, required: true },
    principalComponent: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    notes: { type: String },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Compound indexes for tenant-based queries
PaymentSchema.index({ tenantId: 1, bandhaki: 1 });
PaymentSchema.index({ tenantId: 1, createdAt: -1 });

const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default PaymentModel;
