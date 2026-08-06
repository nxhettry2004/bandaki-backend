import { and, eq, inArray, isNull } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import apiClient from "../api/axiosClient";
import { db } from "../db/client";
import { bandhaki, customers, payments, syncCursor, syncOutbox } from "../db/schema";
import { parseImages } from "../db/repositories/bandhaki.repo";
import type { Tx } from "../db/repositories/outbox.repo";
import type { LocalLoanImage } from "../db/schema";

type EntityName = "customers" | "bandhaki" | "payments";

const ENTITY_PATHS: Record<EntityName, string> = {
  customers: "/api/customers/sync",
  bandhaki: "/api/bandhaki/sync",
  payments: "/api/payments/sync",
};

async function readCursor(entity: EntityName): Promise<Date | null> {
  const rows = await db
    .select()
    .from(syncCursor)
    .where(eq(syncCursor.entity, entity))
    .limit(1);
  return rows[0]?.lastPulledAt ?? null;
}

// Belt-and-braces: never clobber a row that still has unfinished local edits.
async function hasPending(tx: Tx, localId: string): Promise<boolean> {
  const rows = await tx
    .select()
    .from(syncOutbox)
    .where(
      and(
        eq(syncOutbox.entityLocalId, localId),
        inArray(syncOutbox.status, ["pending", "inflight", "error", "blocked"])
      )
    )
    .limit(1);
  return rows.length > 0;
}

function mergeImages(localJson: string, serverImages: any[]): string {
  const local = parseImages(localJson);
  const result: LocalLoanImage[] = [...local];

  for (const s of serverImages || []) {
    const matchIdx = result.findIndex(
      (l) =>
        (s._id && l.serverId === s._id) ||
        (s.clientMutationId && l.clientMutationId === s.clientMutationId)
    );
    if (matchIdx >= 0) {
      result[matchIdx] = {
        ...result[matchIdx],
        serverId: s._id,
        url: s.url,
        name: s.name,
        status: "synced",
      };
    } else {
      result.push({
        localId: Crypto.randomUUID(),
        serverId: s._id,
        name: s.name,
        url: s.url,
        status: "synced",
      });
    }
  }
  return JSON.stringify(result);
}

async function upsertCustomer(tx: Tx, u: any): Promise<void> {
  const rows = await tx
    .select()
    .from(customers)
    .where(eq(customers.serverId, u._id))
    .limit(1);
  const existing = rows[0];
  const now = new Date();
  const data = {
    serverId: u._id,
    name: u.name,
    phone: u.phone ?? null,
    address: u.address ?? null,
    idProof: u.idProof ?? null,
    photoUrl: u.photoUrl ?? null,
    createdAt: u.createdAt ? new Date(u.createdAt) : now,
    updatedAt: u.updatedAt ? new Date(u.updatedAt) : now,
  };

  if (existing) {
    if (await hasPending(tx, existing.localId)) return;
    await tx.update(customers).set(data).where(eq(customers.localId, existing.localId));
  } else {
    await tx
      .insert(customers)
      .values({ ...data, localId: Crypto.randomUUID(), deletedAt: null });
  }
}

async function upsertBandhaki(tx: Tx, u: any): Promise<void> {
  const rows = await tx
    .select()
    .from(bandhaki)
    .where(eq(bandhaki.serverId, u._id))
    .limit(1);
  const existing = rows[0];

  let customerLocalId = existing?.customerLocalId ?? null;
  if (!customerLocalId && u.customer?._id) {
    const cRows = await tx
      .select({ localId: customers.localId })
      .from(customers)
      .where(eq(customers.serverId, u.customer._id))
      .limit(1);
    customerLocalId = cRows[0]?.localId ?? null;
  }
  if (!customerLocalId) {
    // Parent customer not present locally — mint a placeholder so the FK holds.
    customerLocalId = Crypto.randomUUID();
    await tx.insert(customers).values({
      localId: customerLocalId,
      serverId: u.customer?._id ?? null,
      name: u.customer?.name ?? "Unknown",
      phone: u.customer?.phone ?? null,
      address: u.customer?.address ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  const now = new Date();
  const data = {
    serverId: u._id,
    customerLocalId,
    customerServerId: u.customer?._id ?? null,
    loanNumber: u.loanNumber ?? null,
    loanDate: new Date(u.loanDate),
    lastInterestPaidDate: new Date(u.lastInterestPaidDate),
    principalAmount: u.principalAmount,
    outstandingPrincipal: u.outstandingPrincipal,
    outstandingInterest: u.outstandingInterest || 0,
    interestRate: u.interestRate,
    interestType: u.interestType,
    status: u.status,
    paymentStatus: u.paymentStatus,
    totalPaidAmount: u.totalPaidAmount || 0,
    goldItemsJson: JSON.stringify(u.goldItems || []),
    imagesJson: mergeImages(existing ? existing.imagesJson : "[]", u.images || []),
    totalValuation: u.totalValuation || 0,
    createdAt: u.createdAt ? new Date(u.createdAt) : now,
    updatedAt: u.updatedAt ? new Date(u.updatedAt) : now,
  };

  if (existing) {
    if (await hasPending(tx, existing.localId)) return;
    await tx.update(bandhaki).set(data).where(eq(bandhaki.localId, existing.localId));
  } else {
    await tx
      .insert(bandhaki)
      .values({ ...data, localId: Crypto.randomUUID(), deletedAt: null });
  }
}

async function upsertPayment(tx: Tx, u: any): Promise<void> {
  const rows = await tx
    .select()
    .from(payments)
    .where(eq(payments.serverId, u._id))
    .limit(1);
  const existing = rows[0];

  let bandhakiLocalId = existing?.bandhakiLocalId ?? null;
  if (!bandhakiLocalId && u.bandhaki) {
    const lRows = await tx
      .select({ localId: bandhaki.localId })
      .from(bandhaki)
      .where(eq(bandhaki.serverId, u.bandhaki))
      .limit(1);
    bandhakiLocalId = lRows[0]?.localId ?? null;
  }
  // Parent loan not present yet (payments are pulled after loans) — skip.
  if (!bandhakiLocalId) return;

  const now = new Date();
  const data = {
    serverId: u._id,
    bandhakiLocalId,
    bandhakiServerId: u.bandhaki,
    paymentDate: new Date(u.paymentDate),
    amount: u.amount,
    interestComponent: u.interestComponent || 0,
    principalComponent: u.principalComponent || 0,
    paymentMethod: u.paymentMethod,
    notes: u.notes ?? null,
    createdAt: u.createdAt ? new Date(u.createdAt) : now,
    updatedAt: u.updatedAt ? new Date(u.updatedAt) : now,
  };

  if (existing) {
    if (await hasPending(tx, existing.localId)) return;
    await tx.update(payments).set(data).where(eq(payments.localId, existing.localId));
  } else {
    await tx
      .insert(payments)
      .values({ ...data, localId: Crypto.randomUUID() });
  }
}

async function tombstoneByServerId(
  tx: Tx,
  table: "customers" | "bandhaki",
  serverId: string
): Promise<void> {
  const tableObj = table === "customers" ? customers : bandhaki;
  const rows = await tx
    .select()
    .from(tableObj)
    .where(eq(tableObj.serverId, serverId))
    .limit(1);
  const existing = rows[0];
  if (!existing || existing.deletedAt) return;
  if (await hasPending(tx, existing.localId)) return;
  await tx
    .update(tableObj)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(tableObj.localId, existing.localId));
}

async function upsertEntity(tx: Tx, entity: EntityName, u: any): Promise<void> {
  if (entity === "customers") return upsertCustomer(tx, u);
  if (entity === "bandhaki") return upsertBandhaki(tx, u);
  return upsertPayment(tx, u);
}

async function tombstoneEntity(tx: Tx, entity: EntityName, serverId: string): Promise<void> {
  if (entity === "payments") return; // append-only — no tombstones
  return tombstoneByServerId(tx, entity, serverId);
}

export async function pullEntity(entity: EntityName): Promise<void> {
  const cursor = await readCursor(entity);
  const params = cursor ? { since: cursor.toISOString() } : undefined;

  const res = await apiClient.get(ENTITY_PATHS[entity], { params });
  const data = res.data?.data;
  const upserts: any[] = data?.upserts ?? [];
  const deletedIds: string[] = data?.deletedIds ?? [];
  const serverTime: string = data?.serverTime;

  await db.transaction(async (tx) => {
    for (const u of upserts) {
      await upsertEntity(tx, entity, u);
    }
    for (const id of deletedIds) {
      await tombstoneEntity(tx, entity, id);
    }
    if (serverTime) {
      await tx
        .insert(syncCursor)
        .values({ entity, lastPulledAt: new Date(serverTime) })
        .onConflictDoUpdate({
          target: syncCursor.entity,
          set: { lastPulledAt: new Date(serverTime) },
        });
    }
  });
}

export async function pullAll(): Promise<void> {
  await pullEntity("customers");
  await pullEntity("bandhaki");
  await pullEntity("payments");
}

/**
 * Drops the incremental cursors so the next pull asks the server for
 * everything from the beginning of time. Backs the manual "download all cloud
 * data" action — the upserts are idempotent, so a full replay only repairs
 * rows the device is missing and never touches ones with pending local edits.
 */
export async function resetCursors(): Promise<void> {
  await db.delete(syncCursor);
}

export async function getLastPulledAt(): Promise<Date | null> {
  const rows = await db.select().from(syncCursor);
  const times = rows.map((r) => r.lastPulledAt.getTime());
  return times.length ? new Date(Math.min(...times)) : null;
}
