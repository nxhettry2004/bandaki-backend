import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncNow } from "../sync/orchestrator";
import { refreshSyncStatus } from "../sync/syncStatusStore";
import { invalidateLocalData } from "../sync/useSyncTriggers";

/**
 * useMutation wrapper for local-first writes. The write is already durable in
 * SQLite when onSuccess fires, so the screen navigates away immediately and
 * syncNow is fire-and-forget (progress/failures surface via the status banner,
 * never by blocking the submit button).
 */
export function useSyncMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: async () => {
      await refreshSyncStatus();
      invalidateLocalData(queryClient);
      syncNow("post-mutation");
    },
  });
}
