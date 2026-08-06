import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { db } from "../client";
import { bandhaki, customers } from "../schema";
import type { Customer, CustomerFormData } from "../../types";
import * as outbox from "./outbox.repo";

// Thrown by the local writes below when the same customer already exists on the
// device. Mirrors the server's 409 so the form can reject before anything is
// queued — a duplicate that only surfaces at push time halts the whole FIFO
// outbox until someone resolves it by hand.
export class DuplicateCustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateCustomerError";
  }
}

export interface LocalCustomer extends Customer {
  localId: string;
  serverId: string | null;
  _pendingSync: boolean;
}

function mapRow(row: typeof customers.$inferSelect, pending: Set<string>): LocalCustomer {
  return {
    _id: row.localId,
    localId: row.localId,
    serverId: row.serverId ?? null,
    name: row.name,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    idProof: row.idProof ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    _pendingSync: pending.has(row.localId),
  };
}

export async function listCustomers(): Promise<LocalCustomer[]> {
  const [rows, pending] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt))
      .orderBy(desc(customers.createdAt)),
    outbox.getUnsyncedLocalIds(),
  ]);
  return rows.map((r) => mapRow(r, pending));
}

export async function getCustomerById(localId: string): Promise<LocalCustomer | null> {
  const [rows, pending] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(and(eq(customers.localId, localId), isNull(customers.deletedAt)))
      .limit(1),
    outbox.getUnsyncedLocalIds(),
  ]);
  const row = rows[0];
  return row ? mapRow(row, pending) : null;
}

/**
 * Mirrors CustomerService.create's duplicate rule: match on phone when one is
 * given, otherwise on name. Name is compared case-insensitively (the server is
 * exact) so "Ram Bahadur" and "ram bahadur" are caught here rather than at push
 * time. `excludeLocalId` lets an update skip the row it is editing.
 */
export async function findDuplicateCustomer(
  data: Pick<CustomerFormData, "name" | "phone">,
  excludeLocalId?: string
): Promise<LocalCustomer | null> {
  const phone = data.phone?.trim() ?? "";
  const name = data.name?.trim() ?? "";

  const match = phone
    ? eq(customers.phone, phone)
    : sql`lower(trim(${customers.name})) = ${name.toLowerCase()}`;

  const conditions = [isNull(customers.deletedAt), match];
  if (excludeLocalId) conditions.push(ne(customers.localId, excludeLocalId));

  const rows = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ? mapRow(rows[0], new Set()) : null;
}

async function assertNoDuplicate(
  data: CustomerFormData,
  excludeLocalId?: string
): Promise<void> {
  const existing = await findDuplicateCustomer(data, excludeLocalId);
  if (!existing) return;
  throw new DuplicateCustomerError(
    data.phone?.trim()
      ? `${existing.name} already uses the phone number ${data.phone.trim()}.`
      : `A customer named ${existing.name} already exists.`
  );
}

export async function createCustomerLocal(data: CustomerFormData): Promise<LocalCustomer> {
  await assertNoDuplicate(data);

  const localId = Crypto.randomUUID();
  const now = new Date();
  const row = {
    localId,
    serverId: null,
    name: data.name,
    phone: data.phone ?? null,
    address: data.address ?? null,
    idProof: data.idProof ?? null,
    photoUrl: data.photoUrl ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction(async (tx) => {
    await tx.insert(customers).values(row);
    await outbox.enqueue(tx, {
      entityType: "customer",
      operation: "create",
      entityLocalId: localId,
      payload: {
        name: data.name,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        idProof: data.idProof ?? undefined,
        photoUrl: data.photoUrl ?? undefined,
      },
    });
  });

  return mapRow(row, new Set([localId]));
}

export async function updateCustomerLocal(
  localId: string,
  data: CustomerFormData
): Promise<LocalCustomer | null> {
  const existing = await getCustomerById(localId);
  if (!existing) return null;

  await assertNoDuplicate(data, localId);

  const now = new Date();
  const row = {
    name: data.name,
    phone: data.phone ?? null,
    address: data.address ?? null,
    idProof: data.idProof ?? null,
    photoUrl: data.photoUrl ?? null,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.update(customers).set(row).where(eq(customers.localId, localId));
    await outbox.enqueue(tx, {
      entityType: "customer",
      operation: "update",
      entityLocalId: localId,
      payload: {
        name: data.name,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        idProof: data.idProof ?? undefined,
        photoUrl: data.photoUrl ?? undefined,
      },
    });
  });

  return {
    ...existing,
    ...row,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    idProof: row.idProof ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    updatedAt: now.toISOString(),
    _pendingSync: true,
  };
}

export async function softDeleteCustomerLocal(localId: string): Promise<boolean> {
  const existing = await getCustomerById(localId);
  if (!existing) return false;

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(customers)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(customers.localId, localId));
    await outbox.enqueue(tx, {
      entityType: "customer",
      operation: "delete",
      entityLocalId: localId,
      payload: {},
    });
  });
  return true;
}

/**
 * Points a local customer row at an existing server record. Used when a queued
 * create is rejected as a duplicate: rather than parking the job in Sync Issues
 * (which freezes the FIFO outbox behind it), the local row adopts the server's
 * id so every loan that references it can go on syncing.
 *
 * If another local row already holds that serverId the two are genuinely the
 * same customer, so loans are repointed at the survivor and the losing row is
 * dropped.
 */
export async function adoptServerCustomer(
  localId: string,
  serverId: string
): Promise<string> {
  const owners = await db
    .select({ localId: customers.localId })
    .from(customers)
    .where(and(eq(customers.serverId, serverId), ne(customers.localId, localId)))
    .limit(1);
  const survivor = owners[0]?.localId;

  if (!survivor) {
    await db
      .update(customers)
      .set({ serverId })
      .where(eq(customers.localId, localId));
    return localId;
  }

  await db
    .update(bandhaki)
    .set({ customerLocalId: survivor, customerServerId: serverId })
    .where(eq(bandhaki.customerLocalId, localId));
  await db.delete(customers).where(eq(customers.localId, localId));
  return survivor;
}
