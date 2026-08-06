import { and, asc, eq, inArray } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { db } from "../client";
import { syncOutbox, type OutboxOperation } from "../schema";

// Drizzle's SQLite transaction instance passed to the tx callback.
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface EnqueueArgs {
  entityType: string;
  operation: OutboxOperation;
  entityLocalId: string;
  payload: unknown;
  clientMutationId?: string;
}

/**
 * Appends a job to the global FIFO outbox. Must be called inside the same
 * Drizzle transaction as the entity write it belongs to (the caller owns the
 * transaction). Mints the clientMutationId here when the caller didn't — that
 * key is what makes replay idempotent server-side.
 */
export async function enqueue(
  tx: Tx,
  args: EnqueueArgs
): Promise<string> {
  const clientMutationId = args.clientMutationId ?? Crypto.randomUUID();
  await tx.insert(syncOutbox).values({
    entityType: args.entityType,
    operation: args.operation,
    entityLocalId: args.entityLocalId,
    payloadJson: JSON.stringify(args.payload),
    clientMutationId,
    status: "pending",
    attempts: 0,
    createdAt: new Date(),
  });
  return clientMutationId;
}

export interface OutboxRow {
  id: number;
  entityType: string;
  operation: OutboxOperation;
  entityLocalId: string;
  payload: any;
  clientMutationId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}

function mapRow(row: typeof syncOutbox.$inferSelect): OutboxRow {
  return {
    id: row.id,
    entityType: row.entityType,
    operation: row.operation as OutboxOperation,
    entityLocalId: row.entityLocalId,
    payload: JSON.parse(row.payloadJson),
    clientMutationId: row.clientMutationId,
    status: row.status,
    attempts: row.attempts,
    lastError: row.lastError,
    createdAt: row.createdAt,
  };
}

// FIFO order: oldest first. Includes 'error' rows so retries rejoin the drain.
export async function getPendingOrdered(): Promise<OutboxRow[]> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(inArray(syncOutbox.status, ["pending", "error"]))
    .orderBy(asc(syncOutbox.id));
  return rows.map(mapRow);
}

export async function getBlocked(): Promise<OutboxRow[]> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(eq(syncOutbox.status, "blocked"))
    .orderBy(asc(syncOutbox.id));
  return rows.map(mapRow);
}

export async function markInflight(id: number): Promise<void> {
  await db
    .update(syncOutbox)
    .set({ status: "inflight" })
    .where(eq(syncOutbox.id, id));
}

export async function markDone(id: number): Promise<void> {
  await db
    .update(syncOutbox)
    .set({ status: "done", lastError: null })
    .where(eq(syncOutbox.id, id));
}

async function bumpAttempts(id: number, status: string, error: string): Promise<void> {
  const rows = await db
    .select({ attempts: syncOutbox.attempts })
    .from(syncOutbox)
    .where(eq(syncOutbox.id, id))
    .limit(1);
  const attempts = (rows[0]?.attempts ?? 0) + 1;
  await db
    .update(syncOutbox)
    .set({ status, lastError: error, attempts })
    .where(eq(syncOutbox.id, id));
}

export async function markRetryable(id: number, error: string): Promise<void> {
  await bumpAttempts(id, "error", error);
}

export async function markBlocked(id: number, error: string): Promise<void> {
  await bumpAttempts(id, "blocked", error);
}

export async function retry(id: number): Promise<void> {
  await db
    .update(syncOutbox)
    .set({ status: "pending", lastError: null })
    .where(eq(syncOutbox.id, id));
}

export async function dismiss(id: number): Promise<void> {
  await db
    .update(syncOutbox)
    .set({ status: "done" })
    .where(eq(syncOutbox.id, id));
}

// Marks a job done by its clientMutationId (used when a pending local entity,
// e.g. a queued image, is removed before it ever reached the server).
export async function dismissByClientMutationId(
  clientMutationId: string
): Promise<void> {
  await db
    .update(syncOutbox)
    .set({ status: "done", lastError: null })
    .where(eq(syncOutbox.clientMutationId, clientMutationId));
}

// Local ids that still have an unfinished outbox job (used for _pendingSync
// flags on reads and to protect rows from pull-side clobbering).
export async function getUnsyncedLocalIds(): Promise<Set<string>> {
  const rows = await db
    .select({ entityLocalId: syncOutbox.entityLocalId })
    .from(syncOutbox)
    .where(inArray(syncOutbox.status, ["pending", "inflight", "error", "blocked"]));
  return new Set(rows.map((r) => r.entityLocalId));
}

export async function pendingCount(): Promise<number> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(inArray(syncOutbox.status, ["pending", "inflight", "error"]));
  return rows.length;
}

export async function blockedCount(): Promise<number> {
  const rows = await db
    .select()
    .from(syncOutbox)
    .where(eq(syncOutbox.status, "blocked"));
  return rows.length;
}
