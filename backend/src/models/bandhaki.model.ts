import mongoose, { Document, Schema } from "mongoose";

export type InterestType = "simple" | "compound";
export type StatusType = "active" | "closed" | "defaulted";

export interface IGoldItem {
  itemType: string;
  weight?: number;
  notes?: string;
}

export interface IImage {
  name: string;
  url: string;
}

export interface IBandhaki extends Document {
  customer: mongoose.Types.ObjectId;
  loanNumber: string;
  loanDate: Date;
  lastInterestPaidDate: Date;
  principalAmount: number;
  outstandingInterest: number;
  outstandingPrincipal: number;
  interestRate: number;
  interestType: InterestType;
  status: StatusType;
  goldItems: IGoldItem[];
  images?: IImage[];
  totalValuation?: number;
  paymentStatus: string;
  totalPaidAmount: number;
  isClosed: boolean;
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Counter for auto-generating loan numbers
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel =
  mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const BandhakiSchema: Schema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    loanNumber: { type: String, unique: true },
    loanDate: { type: Date, required: true },
    lastInterestPaidDate: { type: Date, required: true },
    outstandingInterest: { type: Number, default: 0 },
    principalAmount: { type: Number, required: true },
    outstandingPrincipal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    interestType: {
      type: String,
      enum: ["simple", "compound"],
      required: true,
    },
    goldItems: [
      {
        itemType: { type: String, required: true },
        weight: { type: Number, required: false },
        notes: { type: String },
      },
    ],
    images: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    totalValuation: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "closed", "defaulted"],
      required: true,
    },
    paymentStatus: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

BandhakiSchema.index({ tenantId: 1, status: 1 });
BandhakiSchema.index({ tenantId: 1, createdAt: -1 });
BandhakiSchema.index({ tenantId: 1, customer: 1 });

BandhakiSchema.pre("save", async function () {
  if (!this.isNew) return; // Only generate loan number for new documents
  const doc = this as any;

  const counter = await CounterModel.findByIdAndUpdate(
    { _id: "bandhakiLoanNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  doc.loanNumber = `BNDH-${counter.seq.toString().padStart(6, "0")}`;
});

const BandhakiModel =
  mongoose.models.Bandhaki || mongoose.model<IBandhaki>("Bandhaki", BandhakiSchema);

export default BandhakiModel;
