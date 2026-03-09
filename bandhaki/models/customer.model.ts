import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone?: string;
  address?: string;
  idProof?: string;
  photoUrl?: string;
  tenantId: mongoose.Types.ObjectId; // User who owns this customer
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String},
    address: { type: String },
    idProof: { type: String },
    photoUrl: { type: String },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Compound index for tenant-based queries
CustomerSchema.index({ tenantId: 1, createdAt: -1 });
CustomerSchema.index({ tenantId: 1, phone: 1 });

const CustomerModel =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

export default CustomerModel;
