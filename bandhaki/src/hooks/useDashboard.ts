import { useQuery } from '@tanstack/react-query';
import { computeDashboardLocal } from '../db/repositories/dashboard.repo';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      return await computeDashboardLocal();
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
