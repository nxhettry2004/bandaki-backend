import { useQuery } from '@tanstack/react-query';
import { listCustomers } from '../db/repositories/customers.repo';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await listCustomers();
      } catch (error) {
        console.error('Error reading customers:', error);
        return [];
      }
    },
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
  });
}
