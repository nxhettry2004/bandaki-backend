import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone?: string;
  address?: string;
  idProof?: string;
  photoUrl?: string;
  tenantId: mongoose.Types.ObjectId;
  // Soft-delete tombstone (set on delete instead of removing the doc) and
  // idempotency key for offline-create replay.
  deletedAt?: Date | null;
  clientMutationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    idProof: { type: String },
    photoUrl: { type: String },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deletedAt: { type: Date, default: null },
    clientMutationId: { type: String },
  },
  { timestamps: true }
);

CustomerSchema.index({ tenantId: 1, createdAt: -1 });
CustomerSchema.index({ tenantId: 1, phone: 1 });
CustomerSchema.index({ tenantId: 1, updatedAt: 1 });
CustomerSchema.index({ tenantId: 1, deletedAt: 1 });
CustomerSchema.index(
  { tenantId: 1, clientMutationId: 1 },
  { unique: true, sparse: true }
);

const CustomerModel =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default CustomerModel;
