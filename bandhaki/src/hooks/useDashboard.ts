import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/endpoints';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      return await getDashboard();
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 3000),
  });
}
