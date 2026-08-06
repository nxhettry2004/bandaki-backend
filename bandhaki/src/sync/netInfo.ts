import { useEffect, useSyncExternalStore } from "react";
import NetInfo from "@react-native-community/netinfo";

let currentOnline = false;
const listeners = new Set<(online: boolean) => void>();

NetInfo.addEventListener((state) => {
  const online =
    state.isConnected === true && state.isInternetReachable !== false;
  if (online !== currentOnline) {
    currentOnline = online;
    listeners.forEach((l) => l(online));
  }
});

export function isCurrentlyOnline(): boolean {
  return currentOnline;
}

function getSnapshot(): boolean {
  return currentOnline;
}

export function subscribeToOnline(cb: (online: boolean) => void): () => void {
  listeners.add(cb);
  cb(currentOnline);
  return () => {
    listeners.delete(cb);
  };
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (cb) => subscribeToOnline(() => cb()),
    getSnapshot
  );
}
