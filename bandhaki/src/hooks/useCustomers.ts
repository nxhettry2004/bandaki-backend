import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../api/endpoints';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await getCustomers();
      } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
