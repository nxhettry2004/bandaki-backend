import { useQuery } from '@tanstack/react-query';
import { getAllBandhaki, getActiveBandhaki } from '../api/endpoints';

export function useLoans(params?: { page?: number; limit?: number; query?: string; status?: string }) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: async () => {
      return await getAllBandhaki(params || {});
    },
    staleTime: 60 * 1000,
  });
}

export function useActiveLoans() {
  return useQuery({
    queryKey: ['activeLoans'],
    queryFn: async () => {
      const res = await getActiveBandhaki();
      return res.loans || [];
    },
    staleTime: 60 * 1000,
  });
}
