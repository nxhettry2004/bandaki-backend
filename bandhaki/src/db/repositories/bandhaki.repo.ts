import { and, desc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { db } from "../client";
import { bandhaki, customers, payments, syncOutbox } from "../schema";
import type {
  DetailedLoanEntry,
  GoldItem,
  InterestType,
  LoanListEntry,
} from "../../types";
import {
  calculateInterest,
  calculateDaysBetween,
} from "../../utils/interest";
import * as outbox from "./outbox.repo";
import type { LocalGoldItem, LocalLoanImage, ImageSyncStatus } from "../schema";

export interface LoanPaginationOptions {
  page?: number;
  limit?: number;
  query?: string;
  status?: string;
}

export interface LoanListResult {
  loans: LoanListEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface LocalLoanDetail extends DetailedLoanEntry {
  localId: string;
  serverId: string | null;
  customerLocalId: string;
  images: LocalLoanDisplayImage[];
  _pendingSync: boolean;
}

export interface LocalLoanDisplayImage {
  localId: string;
  _id?: string;
  name: string;
  url: string;
  localUri?: string;
  status: ImageSyncStatus;
}

export interface CreateLoanLocalInput {
  customerLocalId: string;
  loanDate: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  goldItems: LocalGoldItem[];
  totalValuation: number;
  status: string;
  paymentStatus: string;
}

export interface PendingImageInput {
  localUri: string;
  name: string;
}

interface BandhakiJoinedRow {
  bandhaki: typeof bandhaki.$inferSelect;
  customers: typeof customers.$inferSelect | null;
}

function parseGoldItems(json: string): GoldItem[] {
  try {
    return JSON.parse(json) as GoldItem[];
  } catch {
    return [];
  }
}

export function parseImages(json: string): LocalLoanImage[] {
  try {
    return JSON.parse(json) as LocalLoanImage[];
  } catch {
    return [];
  }
}

function imageToDisplay(img: LocalLoanImage): LocalLoanDisplayImage {
  return {
    localId: img.localId,
    _id: img.serverId,
    name: img.name,
    url: img.url ?? img.localUri ?? "",
    localUri: img.localUri,
    status: img.status,
  };
}

function toListEntry(row: BandhakiJoinedRow, pending: Set<string>): LoanListEntry {
  const b = row.bandhaki;
  const c = row.customers;
  return {
    _id: b.localId,
    loanNumber: b.loanNumber ?? "Pending…",
    principalAmount: b.principalAmount,
    paymentStatus: b.paymentStatus,
    status: b.status,
    interestRate: b.interestRate,
    interestType: b.interestType,
    loanDate: b.loanDate.toISOString().split("T")[0],
    customer: c
      ? { _id: c.localId, name: c.name, phone: c.phone ?? undefined }
      : undefined,
    customerName: c?.name,
    customerPhone: c?.phone ?? undefined,
  };
}

function computeDetail(
  row: BandhakiJoinedRow,
  paymentRows: typeof payments.$inferSelect[],
  pending: Set<string>
): LocalLoanDetail {
  const b = row.bandhaki;
  const c = row.customers;

  const loanDate = new Date(b.loanDate);
  const lastInterestPaidDate = new Date(b.lastInterestPaidDate);
  const today = new Date();
  const daysSinceLoan = calculateDaysBetween(
    isNaN(lastInterestPaidDate.getTime()) ? loanDate : lastInterestPaidDate,
    today
  );

  const paidAmount = paymentRows.reduce((s, p) => s + p.amount, 0);
  const paidPrincipal = paymentRows.reduce((s, p) => s + p.principalComponent, 0);

  const principal = b.principalAmount;
  const calculatedInterest = calculateInterest(
    principal,
    b.interestRate,
    daysSinceLoan,
    b.interestType as InterestType
  );

  const outstandingPrincipal = Math.max(0, principal - paidPrincipal);
  const outstandingInterest = b.outstandingInterest || 0;
  const totalDue = outstandingPrincipal + calculatedInterest + outstandingInterest;

  return {
    _id: b.localId,
    localId: b.localId,
    serverId: b.serverId ?? null,
    customerLocalId: b.customerLocalId,
    loanNumber: b.loanNumber ?? "Pending…",
    customerName: c?.name || "Unknown",
    principalAmount: principal,
    interestRate: b.interestRate,
    interestType: b.interestType,
    loanDate: b.loanDate.toISOString().split("T")[0],
    lastInterestPaidDate: lastInterestPaidDate.toISOString().split("T")[0],
    daysSinceLoan,
    paidAmount: Math.round(paidAmount * 100) / 100,
    outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
    outstandingInterest,
    calculatedInterest: Math.round(calculatedInterest * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    paymentStatus: b.paymentStatus,
    status: b.status,
    goldItems: parseGoldItems(b.goldItemsJson),
    images: parseImages(b.imagesJson).map(imageToDisplay),
    totalValuation: b.totalValuation,
    _pendingSync: pending.has(b.localId),
  };
}

async function loadPaymentsFor(loanLocalIds: string[]) {
  if (loanLocalIds.length === 0) return [];
  return db
    .select()
    .from(payments)
    .where(or(...loanLocalIds.map((id) => eq(payments.bandhakiLocalId, id))));
}

export async function listBandhakiPaginated(
  options: LoanPaginationOptions = {}
): Promise<LoanListResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;
  const query = (options.query ?? "").trim();
  const status = options.status ?? "all";

  const conditions = [isNull(bandhaki.deletedAt)] as any[];

  if (status && status !== "all") {
    if (status === "active") {
      conditions.push(inArray(bandhaki.status, ["active", "defaulted"]));
    } else {
      conditions.push(eq(bandhaki.status, status));
    }
  }

  const hasQuery = query.length > 0;
  if (hasQuery) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        like(bandhaki.loanNumber, pattern),
        like(customers.name, pattern),
        like(customers.phone, pattern)
      )!
    );
  }

  const where = and(...conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({ bandhaki, customers })
      .from(bandhaki)
      .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
      .where(where)
      .orderBy(desc(bandhaki.createdAt))
      .limit(limit)
      .offset(skip),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bandhaki)
      .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
      .where(where),
  ]);

  const pending = await outbox.getUnsyncedLocalIds();
  const totalCount = totalRows[0]?.count ?? 0;

  return {
    loans: rows.map((r) => toListEntry(r, pending)),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
      limit,
    },
  };
}

export async function listActiveBandhaki(): Promise<LoanListEntry[]> {
  const rows = await db
    .select({ bandhaki, customers })
    .from(bandhaki)
    .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
    .where(
      and(
        isNull(bandhaki.deletedAt),
        inArray(bandhaki.status, ["active", "defaulted"])
      )
    )
    .orderBy(desc(bandhaki.createdAt));

  const pending = await outbox.getUnsyncedLocalIds();
  return rows.map((r) => toListEntry(r, pending));
}

export async function getBandhakiDetail(
  localId: string
): Promise<LocalLoanDetail | null> {
  const rows = await db
    .select({ bandhaki, customers })
    .from(bandhaki)
    .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
    .where(and(eq(bandhaki.localId, localId), isNull(bandhaki.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const paymentRows = await loadPaymentsFor([localId]);
  const pending = await outbox.getUnsyncedLocalIds();
  return computeDetail(row, paymentRows, pending);
}

export async function listBandhakiByCustomer(
  customerLocalId: string
): Promise<DetailedLoanEntry[]> {
  const rows = await db
    .select({ bandhaki, customers })
    .from(bandhaki)
    .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
    .where(
      and(
        eq(bandhaki.customerLocalId, customerLocalId),
        isNull(bandhaki.deletedAt),
        inArray(bandhaki.status, ["active", "defaulted"])
      )
    )
    .orderBy(desc(bandhaki.createdAt));

  const ids = rows.map((r) => r.bandhaki.localId);
  const paymentRows = await loadPaymentsFor(ids);
  const pending = await outbox.getUnsyncedLocalIds();

  return rows.map((r) => {
    const detail = computeDetail(r, paymentRows, pending);
    const { localId, serverId, customerLocalId: _c, _pendingSync, ...rest } = detail;
    return rest;
  });
}

export async function createBandhakiLocal(
  data: CreateLoanLocalInput,
  images: PendingImageInput[] = []
): Promise<LocalLoanDetail> {
  const localId = Crypto.randomUUID();
  const now = new Date();
  const loanDate = new Date(data.loanDate);

  const imageEntries: LocalLoanImage[] = images.map((img) => ({
    localId: Crypto.randomUUID(),
    name: img.name,
    localUri: img.localUri,
    clientMutationId: Crypto.randomUUID(),
    status: "pendingUpload" as const,
  }));

  const row = {
    localId,
    serverId: null,
    customerLocalId: data.customerLocalId,
    customerServerId: null,
    loanNumber: null,
    loanDate,
    lastInterestPaidDate: loanDate,
    principalAmount: data.principalAmount,
    outstandingPrincipal: data.principalAmount,
    outstandingInterest: 0,
    interestRate: data.interestRate,
    interestType: data.interestType,
    status: data.status,
    paymentStatus: data.paymentStatus,
    totalPaidAmount: 0,
    goldItemsJson: JSON.stringify(data.goldItems),
    imagesJson: JSON.stringify(imageEntries),
    totalValuation: data.totalValuation,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction(async (tx) => {
    await tx.insert(bandhaki).values(row);

    await outbox.enqueue(tx, {
      entityType: "bandhaki",
      operation: "create",
      entityLocalId: localId,
      payload: {
        customerLocalId: data.customerLocalId,
        loanDate: data.loanDate,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        goldItems: data.goldItems,
        totalValuation: data.totalValuation,
        status: data.status,
        paymentStatus: data.paymentStatus,
      },
    });

    // One addImage job per picked photo, after the loan create. Strict FIFO
    // guarantees the loan's serverId is resolvable before any image job runs.
    for (const img of imageEntries) {
      await outbox.enqueue(tx, {
        entityType: "bandhakiImage",
        operation: "addImage",
        entityLocalId: localId,
        clientMutationId: img.clientMutationId,
        payload: { imageLocalId: img.localId },
      });
    }
  });

  const pending = new Set([localId]);
  return computeDetail(
    { bandhaki: row as any, customers: null },
    [],
    pending
  );
}

export async function addImageLocal(
  loanLocalId: string,
  asset: { localUri: string; name: string }
): Promise<boolean> {
  const rows = await db
    .select()
    .from(bandhaki)
    .where(and(eq(bandhaki.localId, loanLocalId), isNull(bandhaki.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return false;

  const imageLocalId = Crypto.randomUUID();
  const imageClientMutationId = Crypto.randomUUID();
  const imagesJson = JSON.stringify([
    ...parseImages(row.imagesJson),
    {
      localId: imageLocalId,
      name: asset.name,
      localUri: asset.localUri,
      clientMutationId: imageClientMutationId,
      status: "pendingUpload",
    } as LocalLoanImage,
  ]);

  await db.transaction(async (tx) => {
    await tx
      .update(bandhaki)
      .set({ imagesJson, updatedAt: new Date() })
      .where(eq(bandhaki.localId, loanLocalId));
    await outbox.enqueue(tx, {
      entityType: "bandhakiImage",
      operation: "addImage",
      entityLocalId: loanLocalId,
      clientMutationId: imageClientMutationId,
      payload: { imageLocalId },
    });
  });

  return true;
}

// Removes a still-pending image (status pendingUpload) from a loan and drops
// its queued outbox job so nothing references a ghost image. Synced images are
// not handled here — they must go through the server delete endpoint.
export async function removePendingImageLocal(
  loanLocalId: string,
  imageLocalId: string
): Promise<boolean> {
  const rows = await db
    .select()
    .from(bandhaki)
    .where(and(eq(bandhaki.localId, loanLocalId), isNull(bandhaki.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return false;

  const images = parseImages(row.imagesJson);
  const target = images.find((img) => img.localId === imageLocalId);
  if (!target) return false;

  const next = images.filter((img) => img.localId !== imageLocalId);
  const clientMutationId = target.clientMutationId;

  await db.transaction(async (tx) => {
    await tx
      .update(bandhaki)
      .set({ imagesJson: JSON.stringify(next), updatedAt: new Date() })
      .where(eq(bandhaki.localId, loanLocalId));
    if (clientMutationId) {
      await tx
        .update(syncOutbox)
        .set({ status: "done", lastError: null })
        .where(eq(syncOutbox.clientMutationId, clientMutationId));
    }
  });

  return true;
}

export async function updateBandhakiLocal(
  localId: string,
  data: CreateLoanLocalInput
): Promise<LocalLoanDetail | null> {
  const rows = await db
    .select({ bandhaki, customers })
    .from(bandhaki)
    .leftJoin(customers, eq(bandhaki.customerLocalId, customers.localId))
    .where(and(eq(bandhaki.localId, localId), isNull(bandhaki.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const loanDate = new Date(data.loanDate);

  await db.transaction(async (tx) => {
    await tx
      .update(bandhaki)
      .set({
        customerLocalId: data.customerLocalId,
        loanDate,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        goldItemsJson: JSON.stringify(data.goldItems),
        totalValuation: data.totalValuation,
        status: data.status,
        paymentStatus: data.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(bandhaki.localId, localId));

    await outbox.enqueue(tx, {
      entityType: "bandhaki",
      operation: "update",
      entityLocalId: localId,
      payload: {
        customerLocalId: data.customerLocalId,
        loanDate: data.loanDate,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestType: data.interestType,
        goldItems: data.goldItems,
        totalValuation: data.totalValuation,
        status: data.status,
        paymentStatus: data.paymentStatus,
      },
    });
  });

  return getBandhakiDetail(localId);
}

export async function softDeleteBandhakiLocal(localId: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(bandhaki)
    .where(and(eq(bandhaki.localId, localId), isNull(bandhaki.deletedAt)))
    .limit(1);
  if (!rows[0]) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(bandhaki)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(bandhaki.localId, localId));
    await outbox.enqueue(tx, {
      entityType: "bandhaki",
      operation: "delete",
      entityLocalId: localId,
      payload: {},
    });
  });
  return true;
}

