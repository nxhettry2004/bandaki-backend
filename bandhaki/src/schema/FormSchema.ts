import { z } from 'zod';

// ==================== Login ====================

export const LoginFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export type LoginFormSchemaType = z.infer<typeof LoginFormSchema>;

// ==================== Customer ====================

export const CustomerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  idProof: z.string().optional(),
  photoUrl: z.string().optional(),
});

export type CustomerFormSchemaType = z.infer<typeof CustomerFormSchema>;

// ==================== Payment ====================

export const PaymentFormSchema = z.object({
  bandhaki: z.string().min(1, 'Loan entry is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  interestComponent: z.number().min(0, 'Interest component cannot be negative'),
  principalComponent: z.number().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

export type PaymentFormSchemaType = z.infer<typeof PaymentFormSchema>;

// ==================== Bandhaki (Loan) ====================

export const BandhakiFormSchema = z.object({
  customer: z.string().min(1, 'Please select a customer'),
  loanDate: z.string().min(1, 'Loan date is required'),
  principalAmount: z.number().min(1, 'Principal amount must be greater than 0'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative'),
  interestType: z.string().refine((val) => ['simple', 'compound'].includes(val), {
    message: "Interest type must be either 'simple' or 'compound'",
  }),
  goldItems: z.object({
    itemType: z.string().min(1, 'Item type is required'),
    weight: z.number().optional(),
    notes: z.string().optional(),
  }),
  images: z
    .array(
      z.object({
        name: z.string().min(1, 'File name is required'),
        url: z.string().url('Invalid file URL'),
      })
    )
    .optional(),
  totalValuation: z.number().min(0, 'Total valuation cannot be negative'),
  status: z.string().min(1, 'Status is required'),
  paymentStatus: z.string().min(1, 'Payment status is required'),
});

export type BandhakiFormSchemaType = z.infer<typeof BandhakiFormSchema>;

// ==================== Bandhaki Payment (Quick Pay) ====================

export const BandhakiPaymentSchema = z.object({
  bandhaki: z.string().min(1, 'Loan entry is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.number().min(1, 'Amount must be at least 1'),
  interestComponent: z.number().min(0, 'Interest component cannot be negative').optional(),
  principalComponent: z.number().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

export type BandhakiPaymentSchemaType = z.infer<typeof BandhakiPaymentSchema>;

// ==================== Setup Password ====================

export const SetupPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SetupPasswordSchemaType = z.infer<typeof SetupPasswordSchema>;
