import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { db } from "../db/client";
import { syncCursor } from "../db/schema";
import { getToken } from "../api/axiosClient";
import { isCurrentlyOnline, subscribeToOnline } from "./netInfo";
import { syncNow } from "./orchestrator";
import { refreshSyncStatus, subscribeSyncComplete } from "./syncStatusStore";

export async function needsInitialPull(): Promise<boolean> {
  const rows = await db.select().from(syncCursor).limit(1);
  return rows.length === 0;
}

/** Every query key backed by the local SQLite mirror. */
const LOCAL_DATA_KEYS = [
  ["customers"],
  ["loans"],
  ["activeLoans"],
  ["dashboardData"],
  ["customerLoans"],
  ["loan"],
  ["payments"],
];

export function invalidateLocalData(queryClient: QueryClient): void {
  for (const queryKey of LOCAL_DATA_KEYS) {
    queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * The device has never pulled: either it is a fresh install or the user only
 * just signed in. Runs on mount, on reconnect and on app-active because none of
 * those alone is reliable — at cold start NetInfo has usually not resolved yet
 * and, on the login screen, there is no token to sync with.
 */
export async function maybeInitialPull(): Promise<void> {
  if (!isCurrentlyOnline()) return;
  const token = await getToken();
  if (!token) return;
  if (!(await needsInitialPull())) return;
  await syncNow("first-pull");
}

/**
 * Wired once into app/_layout.tsx. Triggers a sync on:
 *  - offline -> online transition (NetInfo)
 *  - background -> active while online (AppState)
 *  - the first pull, retried on each of the above until it actually lands
 * No polling interval — syncs happen on these lifecycle events and after each
 * local mutation (via syncNow in the mutation hooks). Also refreshes every
 * cached read once any sync completes, whoever started it.
 */
export function useSyncTriggers() {
  const queryClient = useQueryClient();
  const wasOnlineRef = useRef(isCurrentlyOnline());

  useEffect(() => {
    // One place to refresh the UI: fires for lifecycle syncs, post-mutation
    // syncs and manual ones alike.
    const unsubscribeComplete = subscribeSyncComplete(() => {
      invalidateLocalData(queryClient);
    });

    // offline -> online transition
    const unsubscribeOnline = subscribeToOnline((online) => {
      const wasOnline = wasOnlineRef.current;
      wasOnlineRef.current = online;
      if (!online) {
        refreshSyncStatus();
        return;
      }
      if (!wasOnline) syncNow("reconnect");
      else maybeInitialPull();
    });

    // background -> active while online
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isCurrentlyOnline()) {
        syncNow("app-active");
      }
    });

    // Seed the banner with the real queue depth / last-pull time on cold start.
    refreshSyncStatus();
    maybeInitialPull();

    return () => {
      unsubscribeComplete();
      unsubscribeOnline();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
