import {
  getPendingOrdered,
  markBlocked,
  markDone,
  markInflight,
  markRetryable,
} from "../db/repositories/outbox.repo";
import { isCurrentlyOnline } from "./netInfo";
import { pushOne, BlockedPushError } from "./push";
import { pullAll, resetCursors } from "./pull";
import {
  notifySyncComplete,
  refreshSyncStatus,
  setSyncStatus,
} from "./syncStatusStore";

let isSyncing = false;

/**
 * FIFO drain: one row at a time, in id order. On any failure it halts the
 * loop (never skipping to the next row) — a later payment must never be sent
 * while an earlier one is unresolved. Retryable/network errors mark the row
 * 'error' and halt; 4xx business-rule errors mark it 'blocked' and halt.
 * Returns true if the whole queue drained.
 */
export async function pushDrain(): Promise<boolean> {
  const rows = await getPendingOrdered();
  for (const row of rows) {
    if (!isCurrentlyOnline()) return false;

    await markInflight(row.id);
    try {
      await pushOne(row);
      await markDone(row.id);
    } catch (err) {
      const message = (err as Error)?.message || "Unknown error";
      if (err instanceof BlockedPushError) {
        await markBlocked(row.id, message);
      } else {
        await markRetryable(row.id, message);
      }
      return false; // halt the drain
    }
  }
  return true;
}

/**
 * Push always runs to completion (or halts on the first blocker) before pull
 * runs. Never interleaved — a pull can't clobber a not-yet-sent local edit.
 *
 * `full` drops the incremental cursors first, so the pull re-downloads every
 * record the account has rather than only what changed since last time.
 */
async function runSync(trigger: string, full: boolean): Promise<void> {
  if (isSyncing) return;
  if (!isCurrentlyOnline()) {
    throw new Error("You are offline. Connect to the internet and try again.");
  }

  isSyncing = true;
  setSyncStatus({ isSyncing: true });
  try {
    await pushDrain();
    if (full) await resetCursors();
    await pullAll();
  } finally {
    isSyncing = false;
    setSyncStatus({ isSyncing: false });
    await refreshSyncStatus();
    notifySyncComplete();
  }
}

/**
 * Fire-and-forget entry point for background triggers. Failures are logged and
 * surfaced through the status banner rather than thrown at the caller.
 */
export async function syncNow(trigger?: string): Promise<void> {
  try {
    await runSync(trigger ?? "trigger", false);
  } catch (err) {
    console.error(`[sync] ${trigger ?? "trigger"} failed:`, err);
  }
}

/**
 * User-initiated sync. Throws so the screen can report what went wrong instead
 * of silently appearing to succeed.
 */
export async function syncNowOrThrow(trigger = "manual"): Promise<void> {
  await runSync(trigger, false);
}

/**
 * User-initiated full re-download of everything on the server, for a device
 * that was set up after the data was created.
 */
export async function downloadAllFromCloud(): Promise<void> {
  await runSync("manual-full-download", true);
}

export { isSyncing as getIsSyncing };
