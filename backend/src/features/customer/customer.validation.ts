import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  idProof: z.string().optional(),
  photoUrl: z.string().optional(),
  // Idempotency key minted client-side by the offline outbox.
  clientMutationId: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema;

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
