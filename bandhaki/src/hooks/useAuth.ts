import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logoutApi } from '../api/endpoints';
import { removeToken } from '../api/axiosClient';
import type { User } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User | null> => {
      try {
        return await getMe();
      } catch {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 500,
  });

  const logout = async () => {
    await logoutApi();
    await removeToken();
    queryClient.setQueryData(['currentUser'], null);
    queryClient.clear();
  };

  return {
    user: data ?? null,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!data,
    tenantId: data?.tenantId,
    logout,
  };
}
