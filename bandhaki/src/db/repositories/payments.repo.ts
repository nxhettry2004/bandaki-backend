import { and, desc, eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { db } from "../client";
import { payments } from "../schema";
import type { Payment } from "../../types";
import * as outbox from "./outbox.repo";

export interface LocalPayment extends Payment {
  localId: string;
  serverId: string | null;
  bandhakiLocalId: string;
  _pendingSync: boolean;
}

function mapRow(row: typeof payments.$inferSelect, pending: Set<string>): LocalPayment {
  return {
    _id: row.localId,
    localId: row.localId,
    serverId: row.serverId ?? null,
    bandhakiLocalId: row.bandhakiLocalId,
    bandhaki: row.bandhakiLocalId,
    paymentDate: row.paymentDate.toISOString(),
    amount: row.amount,
    interestComponent: row.interestComponent,
    principalComponent: row.principalComponent,
    paymentMethod: row.paymentMethod,
    notes: row.notes ?? undefined,
    tenantId: "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    _pendingSync: pending.has(row.localId),
  };
}

export async function listPaymentsForLoan(
  bandhakiLocalId: string
): Promise<LocalPayment[]> {
  const [rows, pending] = await Promise.all([
    db
      .select()
      .from(payments)
      .where(eq(payments.bandhakiLocalId, bandhakiLocalId))
      .orderBy(desc(payments.createdAt)),
    outbox.getUnsyncedLocalIds(),
  ]);
  return rows.map((r) => mapRow(r, pending));
}

export interface CreatePaymentLocalInput {
  bandhakiLocalId: string;
  paymentDate: string;
  amount: number;
  interestComponent: number;
  principalComponent: number;
  paymentMethod: string;
  notes?: string;
}

export async function createPaymentLocal(
  data: CreatePaymentLocalInput
): Promise<LocalPayment> {
  const localId = Crypto.randomUUID();
  const now = new Date();
  const row = {
    localId,
    serverId: null,
    bandhakiLocalId: data.bandhakiLocalId,
    bandhakiServerId: null,
    paymentDate: new Date(data.paymentDate),
    amount: data.amount,
    interestComponent: data.interestComponent,
    principalComponent: data.principalComponent,
    paymentMethod: data.paymentMethod,
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.insert(payments).values(row);
    await outbox.enqueue(tx, {
      entityType: "payment",
      operation: "create",
      entityLocalId: localId,
      payload: {
        bandhakiLocalId: data.bandhakiLocalId,
        paymentDate: data.paymentDate,
        amount: data.amount,
        interestComponent: data.interestComponent,
        principalComponent: data.principalComponent,
        paymentMethod: data.paymentMethod,
        notes: data.notes ?? undefined,
      },
    });
  });

  return mapRow(row as any, new Set([localId]));
}
