import { z } from "zod";

export const CreatePaymentSchema = z.object({
  bandhaki: z.string().min(1, "Loan ID is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  amount: z.number().positive("Amount must be positive"),
  interestComponent: z.number().optional(),
  principalComponent: z.number().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
