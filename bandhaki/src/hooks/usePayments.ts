import { useQuery } from '@tanstack/react-query';
import { listBandhakiByCustomer } from '../db/repositories/bandhaki.repo';
import { listPaymentsForLoan } from '../db/repositories/payments.repo';

export function usePaymentsForLoan(bandhakiLocalId?: string) {
  return useQuery({
    queryKey: ['payments', bandhakiLocalId],
    queryFn: async () => {
      return await listPaymentsForLoan(bandhakiLocalId!);
    },
    enabled: !!bandhakiLocalId,
    staleTime: Infinity,
  });
}

export function useCustomerLoans(customerLocalId?: string) {
  return useQuery({
    queryKey: ['customerLoans', customerLocalId],
    queryFn: async () => {
      return { loans: await listBandhakiByCustomer(customerLocalId!) };
    },
    enabled: !!customerLocalId,
    staleTime: Infinity,
  });
}
