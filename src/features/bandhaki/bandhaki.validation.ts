import { z } from "zod";

const GoldItemSchema = z.object({
  itemType: z.string().min(1, "Item type is required"),
  weight: z.number().optional(),
  notes: z.string().optional(),
});

const ImageSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
});

export const CreateBandhakiSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  loanDate: z.string().min(1, "Loan date is required"),
  principalAmount: z.number().positive("Principal amount must be positive"),
  interestRate: z.number().positive("Interest rate must be positive"),
  interestType: z.enum(["simple", "compound"]),
  goldItems: z.array(GoldItemSchema).min(1, "At least one gold item is required"),
  images: z.array(ImageSchema).optional(),
  totalValuation: z.number().optional(),
  status: z.enum(["active", "closed", "defaulted"]).default("active"),
  paymentStatus: z.string().default("pending"),
});

export const UpdateBandhakiSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  loanDate: z.string().min(1, "Loan date is required"),
  principalAmount: z.number().positive("Principal amount must be positive"),
  interestRate: z.number().positive("Interest rate must be positive"),
  interestType: z.enum(["simple", "compound"]),
  goldItems: z.array(GoldItemSchema).min(1, "At least one gold item is required"),
  images: z.array(ImageSchema).optional(),
  totalValuation: z.number().optional(),
  status: z.enum(["active", "closed", "defaulted"]),
  paymentStatus: z.string(),
});

export const AddImageSchema = z.object({
  url: z.string().min(1, "URL is required"),
  name: z.string().min(1, "Filename is required"),
});

export type CreateBandhakiInput = z.infer<typeof CreateBandhakiSchema>;
export type UpdateBandhakiInput = z.infer<typeof UpdateBandhakiSchema>;
export type AddImageInput = z.infer<typeof AddImageSchema>;
