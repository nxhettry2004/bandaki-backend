// ==================== User / Auth ====================

export type UserRole = 'superadmin' | 'tenant';

export interface User {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: {
    username?: string[];
    password?: string[];
  };
}

export interface AuthMeResponse {
  success: boolean;
  user: User | null;
  message?: string;
}

// ==================== Customer ====================

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  idProof?: string;
  photoUrl?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface CustomerFormData {
  name: string;
  phone?: string;
  address?: string;
  idProof?: string;
  photoUrl?: string;
}

// ==================== Gold Items ====================

export interface GoldItem {
  itemType: string;
  weight?: number;
  notes?: string;
}

// ==================== Loan Image ====================

export interface LoanImage {
  name: string;
  url: string;
}

// ==================== Bandhaki / Loan ====================

export type InterestType = 'simple' | 'compound';
export type LoanStatus = 'active' | 'closed' | 'defaulted';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface Bandhaki {
  _id: string;
  customer: Customer | string;
  loanNumber: string;
  loanDate: string;
  lastInterestPaidDate: string;
  principalAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  interestRate: number;
  interestType: InterestType;
  status: LoanStatus;
  goldItems: GoldItem[];
  images?: LoanImage[];
  totalValuation?: number;
  paymentStatus: string;
  totalPaidAmount: number;
  createdBy: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BandhakiFormData {
  customer: string;
  loanDate: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  goldItems: GoldItem[];
  images?: LoanImage[];
  totalValuation: number;
  status: string;
  paymentStatus: string;
}

export interface DetailedLoanEntry {
  _id: string;
  loanNumber: string;
  customerName: string;
  principalAmount: number;
  interestRate: number;
  interestType: string;
  loanDate: string;
  lastInterestPaidDate: string;
  daysSinceLoan: number;
  paidAmount: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  calculatedInterest: number;
  totalDue: number;
  paymentStatus: string;
  status: string;
  goldItems: GoldItem[];
  images?: LoanImage[];
  totalValuation?: number;
}

export interface LoanListEntry {
  _id: string;
  loanNumber: string;
  customerName?: string;
  customerPhone?: string;
  principalAmount: number;
  paymentStatus: string;
  status: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
  };
  interestRate?: number;
  interestType?: string;
  loanDate?: string;
}

// ==================== Payment ====================

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'other';

export interface Payment {
  _id: string;
  bandhaki: string;
  paymentDate: string;
  amount: number;
  interestComponent: number;
  principalComponent?: number;
  paymentMethod: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  bandhaki: string;
  paymentDate: string;
  amount: number;
  interestComponent: number;
  principalComponent?: number;
  paymentMethod: string;
  notes?: string;
}

// ==================== Dashboard ====================

export interface DashboardData {
  totalCustomers: number;
  activeLoans: number;
  recentTransactions: Bandhaki[];
}

// ==================== API Responses ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  loans: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}
