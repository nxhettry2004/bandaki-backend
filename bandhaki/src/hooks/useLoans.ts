import { useQuery } from '@tanstack/react-query';
import {
  getBandhakiDetail,
  listActiveBandhaki,
  listBandhakiPaginated,
} from '../db/repositories/bandhaki.repo';

export function useLoans(params?: { page?: number; limit?: number; query?: string; status?: string }) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: async () => {
      return await listBandhakiPaginated(params || {});
    },
    staleTime: Infinity,
  });
}

export function useActiveLoans() {
  return useQuery({
    queryKey: ['activeLoans'],
    queryFn: async () => {
      return await listActiveBandhaki();
    },
    staleTime: Infinity,
  });
}

export function useLoan(localId?: string) {
  return useQuery({
    queryKey: ['loan', localId],
    queryFn: async () => {
      const entry = await getBandhakiDetail(localId!);
      return { entry };
    },
    enabled: !!localId,
    staleTime: Infinity,
  });
}
