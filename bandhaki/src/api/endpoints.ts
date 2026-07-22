import apiClient, { setToken, removeToken, getToken } from './axiosClient';
import type {
  LoginFormSchemaType,
} from '../schema/FormSchema';
import type {
  User,
  LoginResponse,
  AuthMeResponse,
  Customer,
  CustomerFormData,
  DashboardData,
  Bandhaki,
  BandhakiFormData,
  DetailedLoanEntry,
  LoanListEntry,
  LoanImage,
  Payment,
  PaymentFormData,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// ==================== Auth ====================

export async function loginApi(data: LoginFormSchemaType): Promise<LoginResponse> {
  const res = await apiClient.post('/api/auth/login', data);
  const payload = res.data?.data;
  if (res.data?.success && payload?.token) {
    await setToken(payload.token);
  }

  return {
    success: !!res.data?.success,
    message: res.data?.message || 'Login failed',
    token: payload?.token,
    user: payload?.user,
    errors: res.data?.errors,
  };
}

export async function getMe(): Promise<User | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await apiClient.get<AuthMeResponse>('/api/auth/me');
    return (res.data as any)?.data || null;
  } catch {
    return null;
  }
}

export async function logoutApi(): Promise<void> {
  await removeToken();
}

export async function validateSetupToken(token: string) {
  const res = await apiClient.get(`/api/auth/validate-token/${token}`);
  return res.data?.data;
}

export async function setupPassword(data: { token: string; password: string; confirmPassword: string }) {
  const res = await apiClient.post('/api/auth/setup-password', data);
  return res.data?.data;
}

// ==================== Dashboard ====================

export async function getDashboard(): Promise<DashboardData> {
  const res = await apiClient.get('/api/dashboard');
  return res.data.data;
}

// ==================== Customers ====================

export async function getCustomers(): Promise<Customer[]> {
  const res = await apiClient.get('/api/customers');
  return res.data?.data?.customers || [];
}

export async function getCustomerById(id: string): Promise<Customer> {
  const res = await apiClient.get(`/api/customers/${id}`);
  return res.data?.data;
}

export async function createCustomer(data: CustomerFormData): Promise<ApiResponse<Customer>> {
  const res = await apiClient.post('/api/customers', data);
  return res.data;
}

export async function updateCustomer(id: string, data: CustomerFormData): Promise<ApiResponse> {
  const res = await apiClient.put(`/api/customers/${id}`, data);
  return res.data;
}

// ==================== Bandhaki (Loans) ====================

export async function getActiveBandhaki(): Promise<{ loans: LoanListEntry[] }> {
  const res = await apiClient.get('/api/bandhaki/active');
  return res.data?.data;
}

export async function getAllBandhaki(params: {
  page?: number;
  limit?: number;
  query?: string;
  status?: string;
}): Promise<PaginatedResponse<LoanListEntry>> {
  const res = await apiClient.get('/api/bandhaki', { params });
  return res.data?.data;
}

export async function getBandhakiById(id: string): Promise<{ entry: DetailedLoanEntry }> {
  const res = await apiClient.get(`/api/bandhaki/${id}`);
  return res.data?.data;
}

export async function getBandhakiByCustomer(customerId: string): Promise<{ loans: DetailedLoanEntry[] }> {
  const res = await apiClient.get(`/api/bandhaki/customer/${customerId}`);
  return res.data?.data;
}

export async function createBandhaki(data: BandhakiFormData): Promise<ApiResponse<Bandhaki>> {
  const res = await apiClient.post('/api/bandhaki', data);
  return res.data;
}

export async function updateBandhaki(id: string, data: BandhakiFormData): Promise<ApiResponse<Bandhaki>> {
  const res = await apiClient.put(`/api/bandhaki/${id}`, data);
  return res.data;
}

export async function deleteBandhaki(id: string): Promise<ApiResponse> {
  const res = await apiClient.delete(`/api/bandhaki/${id}`);
  return res.data;
}

export async function addImageToLoan(loanId: string, image: LoanImage): Promise<ApiResponse> {
  const res = await apiClient.post(`/api/bandhaki/${loanId}/images`, image);
  return res.data;
}

export async function deleteImageFromLoan(loanId: string, imageId: string): Promise<ApiResponse> {
  const res = await apiClient.delete(`/api/bandhaki/${loanId}/images/${imageId}`);
  return res.data;
}

// ==================== Payments ====================

export async function createPayment(data: PaymentFormData): Promise<ApiResponse & { paymentId?: string }> {
  const res = await apiClient.post('/api/payments', data);
  return res.data;
}

export async function getPaymentsByBandhaki(bandhakiId: string): Promise<Payment[]> {
  const res = await apiClient.get(`/api/payments/bandhaki/${bandhakiId}`);
  return res.data?.data?.payments || [];
}

export { setToken, removeToken, getToken };
