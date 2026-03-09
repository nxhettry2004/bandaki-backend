import mongoose, { Document, Schema } from "mongoose";

type InterestType = "simple" | "compound";

type StatusType = "active" | "closed" | "defaulted";

interface GoldItemsType {
  itemType: string;
  weight: number;
  notes?: string;
}

interface ImageType {
  name: string;
  url: string;
}

interface IBandhaki extends Document {
  customer: mongoose.Types.ObjectId;
  loanNumber: string;
  loanDate: Date;
  lastInterestPaidDate: Date;
  principalAmount: number;
  outstandingInterest: number;
  interestRate: number;
  interestType: InterestType;
  status: StatusType;
  goldItems: GoldItemsType[];
  images?: ImageType[];
  totalValuation?: number;
  paymentStatus: string;
  createdBy: Schema.Types.ObjectId;
  tenantId: Schema.Types.ObjectId;
  totalPaidAmount: number;
  outstandingPrincipal: number;
  isClosed: boolean;
}

// counter ko lagi

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
      
    ]
    ,    
    totalValuation: { type: Number , default: 0 },
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

// Compound indexes for tenant-based queries
BandhakiSchema.index({ tenantId: 1, status: 1 });
BandhakiSchema.index({ tenantId: 1, createdAt: -1 });
BandhakiSchema.index({ tenantId: 1, customer: 1 });

BandhakiSchema.pre("save", async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;

  const counter = await CounterModel.findByIdAndUpdate(
    { _id: "bandhakiLoanNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqId = counter.seq;

  doc.loanNumber = `BNDH-${seqId.toString().padStart(6, "0")}`;
});

const BandhakiModel =
  mongoose.models.Bandhaki ||
  mongoose.model<IBandhaki>("Bandhaki", BandhakiSchema);

export default BandhakiModel;
