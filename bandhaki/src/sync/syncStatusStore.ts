import { useSyncExternalStore } from "react";
import { isCurrentlyOnline } from "./netInfo";
import { blockedCount, pendingCount } from "../db/repositories/outbox.repo";
import { getLastPulledAt } from "./pull";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  blockedCount: number;
  lastSyncedAt: Date | null;
}

let state: SyncStatus = {
  isOnline: isCurrentlyOnline(),
  isSyncing: false,
  pendingCount: 0,
  blockedCount: 0,
  lastSyncedAt: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot(): SyncStatus {
  return state;
}

export function subscribeSyncStatus(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setSyncStatus(partial: Partial<SyncStatus>): void {
  state = { ...state, ...partial };
  emit();
}

export async function refreshSyncStatus(): Promise<void> {
  const [pending, blocked, lastSyncedAt] = await Promise.all([
    pendingCount(),
    blockedCount(),
    getLastPulledAt(),
  ]);
  setSyncStatus({
    isOnline: isCurrentlyOnline(),
    pendingCount: pending,
    blockedCount: blocked,
    lastSyncedAt,
  });
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSnapshot);
}

// ==================== Sync completion fan-out ====================

const completionListeners = new Set<() => void>();

/**
 * Fires after every sync, whatever triggered it. React Query caches read from
 * SQLite with staleTime: Infinity, so a pull that writes new rows is invisible
 * until something invalidates them — this is what the app subscribes to in
 * order to do that from one place instead of at each call site.
 */
export function subscribeSyncComplete(cb: () => void): () => void {
  completionListeners.add(cb);
  return () => {
    completionListeners.delete(cb);
  };
}

export function notifySyncComplete(): void {
  completionListeners.forEach((l) => l());
}
