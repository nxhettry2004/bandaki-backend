import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  bandhaki: mongoose.Types.ObjectId;
  paymentDate: Date;
  amount: number;
  interestComponent: number;
  principalComponent: number;
  paymentMethod: string;
  notes?: string;
  tenantId: mongoose.Types.ObjectId;
  // Idempotency key for offline-payment replay. Payments are append-only, so
  // there is deliberately no deletedAt tombstone field.
  clientMutationId?: string;
  createdAt: Date;
  updatedAt: Date;
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
    clientMutationId: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ tenantId: 1, bandhaki: 1 });
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
PaymentSchema.index(
  { tenantId: 1, clientMutationId: 1 },
  { unique: true, sparse: true }
);

const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default PaymentModel;
