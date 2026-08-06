import { and, eq, isNull } from "drizzle-orm";
import apiClient from "../api/axiosClient";
import { uploadFileToCloudinary } from "../api/cloudinary";
import { db } from "../db/client";
import { bandhaki, customers, payments } from "../db/schema";
import { parseImages } from "../db/repositories/bandhaki.repo";
import { adoptServerCustomer } from "../db/repositories/customers.repo";
import type { OutboxRow } from "../db/repositories/outbox.repo";
import type { LocalLoanImage } from "../db/schema";

// ==================== Error taxonomy ====================

// Network/timeout/5xx — safe to retry; the drain halts on it and retries later.
export class RetryablePushError extends Error {}
// 4xx business-rule rejection — will not resolve on retry; sent to Sync Issues.
export class BlockedPushError extends Error {}

function toPushError(err: any): Error {
  const response = err?.response;
  if (response) {
    const status = response.status;
    const msg = response.data?.message || `Server error (${status})`;
    if (status >= 500 || status === 429) return new RetryablePushError(msg);
    return new BlockedPushError(msg);
  }
  return new RetryablePushError(err?.message || "Network error");
}

// ==================== Local row lookups ====================

async function findCustomer(localId: string) {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.localId, localId), isNull(customers.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

async function findBandhaki(localId: string) {
  const rows = await db
    .select()
    .from(bandhaki)
    .where(and(eq(bandhaki.localId, localId), isNull(bandhaki.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

async function findPayment(localId: string) {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.localId, localId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * The loan's own customerLocalId rather than the queued payload's: a duplicate
 * customer resolved at push time repoints the loan at the surviving row, and
 * the payload captured at enqueue time still names the row that went away.
 */
async function findLoanCustomer(loanLocalId: string, payloadCustomerLocalId?: string) {
  const loan = await findBandhaki(loanLocalId);
  const customerLocalId = loan?.customerLocalId ?? payloadCustomerLocalId;
  return customerLocalId ? findCustomer(customerLocalId) : null;
}

// ==================== Handlers ====================

/**
 * The server rejects a create whose phone (or name, when no phone) already
 * belongs to someone else. That record is the same person, so find it and adopt
 * its id instead of parking the job — a blocked create would freeze every later
 * job in the FIFO outbox behind it.
 */
async function resolveDuplicateCustomer(row: OutboxRow): Promise<boolean> {
  const p = row.payload;
  const phone = (p.phone ?? "").trim();
  const name = (p.name ?? "").trim().toLowerCase();

  let remote: any[];
  try {
    // The sync feed rather than /api/customers: it returns a flat list of every
    // record and is the same shape the puller already understands.
    const res = await apiClient.get("/api/customers/sync");
    remote = res.data?.data?.upserts ?? [];
  } catch (err) {
    throw toPushError(err);
  }

  const match = remote.find((c: any) =>
    phone ? (c.phone ?? "").trim() === phone : (c.name ?? "").trim().toLowerCase() === name
  );
  if (!match?._id) return false;

  await adoptServerCustomer(row.entityLocalId, match._id);
  return true;
}

async function pushCustomerCreate(row: OutboxRow): Promise<void> {
  const p = row.payload;
  let res;
  try {
    res = await apiClient.post("/api/customers", {
      name: p.name,
      phone: p.phone,
      address: p.address,
      idProof: p.idProof,
      photoUrl: p.photoUrl,
      clientMutationId: row.clientMutationId,
    });
  } catch (err: any) {
    if (err?.response?.status === 409 && (await resolveDuplicateCustomer(row))) {
      return;
    }
    throw toPushError(err);
  }
  const serverId = res.data?.data?._id;
  if (!serverId) throw new RetryablePushError("Customer create returned no id");
  await db
    .update(customers)
    .set({ serverId })
    .where(eq(customers.localId, row.entityLocalId));
}

async function pushCustomerUpdate(row: OutboxRow): Promise<void> {
  const customer = await findCustomer(row.entityLocalId);
  // Merged into a duplicate, or soft-deleted with its delete job queued behind
  // this one. Either way there is nothing left to update, and retrying would
  // pin the head of the queue forever.
  if (!customer) return;
  if (!customer.serverId) {
    throw new RetryablePushError("Customer not synced yet (DependencyNotReady)");
  }
  const p = row.payload;
  await apiClient.put(`/api/customers/${customer.serverId}`, {
    name: p.name,
    phone: p.phone,
    address: p.address,
    idProof: p.idProof,
    photoUrl: p.photoUrl,
  });
}

async function pushCustomerDelete(row: OutboxRow): Promise<void> {
  const customer = await findCustomer(row.entityLocalId);
  // Already gone locally — nothing to delete server-side.
  if (!customer || !customer.serverId) return;
  try {
    await apiClient.delete(`/api/customers/${customer.serverId}`);
  } catch (err: any) {
    if (err?.response?.status === 404) return; // idempotent delete
    throw toPushError(err);
  }
}

async function pushBandhakiCreate(row: OutboxRow): Promise<void> {
  const p = row.payload;
  const customer = await findLoanCustomer(row.entityLocalId, p.customerLocalId);
  if (!customer || !customer.serverId) {
    throw new RetryablePushError("Parent customer not synced yet (DependencyNotReady)");
  }
  const res = await apiClient.post("/api/bandhaki", {
    customer: customer.serverId,
    loanDate: p.loanDate,
    principalAmount: p.principalAmount,
    interestRate: p.interestRate,
    interestType: p.interestType,
    goldItems: p.goldItems,
    totalValuation: p.totalValuation,
    status: p.status,
    paymentStatus: p.paymentStatus,
    clientMutationId: row.clientMutationId,
  });
  const data = res.data?.data;
  if (!data?._id) throw new RetryablePushError("Loan create returned no id");
  await db
    .update(bandhaki)
    .set({ serverId: data._id, loanNumber: data.loanNumber ?? null })
    .where(eq(bandhaki.localId, row.entityLocalId));
}

async function pushBandhakiUpdate(row: OutboxRow): Promise<void> {
  const loan = await findBandhaki(row.entityLocalId);
  if (!loan || !loan.serverId) {
    throw new RetryablePushError("Loan not synced yet (DependencyNotReady)");
  }
  const p = row.payload;
  const customer = await findLoanCustomer(row.entityLocalId, p.customerLocalId);
  if (!customer || !customer.serverId) {
    throw new RetryablePushError("Parent customer not synced yet (DependencyNotReady)");
  }
  await apiClient.put(`/api/bandhaki/${loan.serverId}`, {
    customer: customer.serverId,
    loanDate: p.loanDate,
    principalAmount: p.principalAmount,
    interestRate: p.interestRate,
    interestType: p.interestType,
    goldItems: p.goldItems,
    totalValuation: p.totalValuation,
    status: p.status,
    paymentStatus: p.paymentStatus,
  });
}

async function pushBandhakiDelete(row: OutboxRow): Promise<void> {
  const loan = await findBandhaki(row.entityLocalId);
  if (!loan || !loan.serverId) return;
  try {
    await apiClient.delete(`/api/bandhaki/${loan.serverId}`);
  } catch (err: any) {
    if (err?.response?.status === 404) return; // idempotent delete
    throw toPushError(err);
  }
}

async function pushPaymentCreate(row: OutboxRow): Promise<void> {
  const p = row.payload;
  const loan = await findBandhaki(p.bandhakiLocalId);
  if (!loan || !loan.serverId) {
    throw new RetryablePushError("Parent loan not synced yet (DependencyNotReady)");
  }
  const res = await apiClient.post("/api/payments", {
    bandhaki: loan.serverId,
    paymentDate: p.paymentDate,
    amount: p.amount,
    interestComponent: p.interestComponent,
    principalComponent: p.principalComponent,
    paymentMethod: p.paymentMethod,
    notes: p.notes,
    clientMutationId: row.clientMutationId,
  });
  const paymentId = res.data?.data?.paymentId;
  if (!paymentId) throw new RetryablePushError("Payment create returned no id");
  await db
    .update(payments)
    .set({ serverId: paymentId, bandhakiServerId: loan.serverId })
    .where(eq(payments.localId, row.entityLocalId));
}

async function pushImageAdd(row: OutboxRow): Promise<void> {
  const loan = await findBandhaki(row.entityLocalId);
  if (!loan || !loan.serverId) {
    throw new RetryablePushError("Parent loan not synced yet (DependencyNotReady)");
  }

  let images = parseImages(loan.imagesJson);
  const idx = images.findIndex((i) => i.localId === row.payload.imageLocalId);
  // Entry removed from the loan while the job was queued — nothing to attach.
  if (idx < 0) return;

  let image = images[idx];

  // Sub-step 1: upload to Cloudinary if not already hosted. The URL is
  // persisted immediately so a retry after a partial failure skips re-upload.
  if (!image.url) {
    if (!image.localUri) {
      throw new RetryablePushError("Pending image has no local file");
    }
    const uploaded = await uploadFileToCloudinary(image.localUri, image.name);
    image = { ...image, url: uploaded.url, status: "uploaded_pending_attach" as const };
    images[idx] = image;
    await db
      .update(bandhaki)
      .set({ imagesJson: JSON.stringify(images) })
      .where(eq(bandhaki.localId, row.entityLocalId));
  }

  // Sub-step 2: attach to the loan with the idempotency key.
  const res = await apiClient.post(`/api/bandhaki/${loan.serverId}/images`, {
    name: image.name,
    url: image.url,
    clientMutationId: row.clientMutationId,
  });
  const returnedImages: any[] = res.data?.data?.images;
  const serverImage = Array.isArray(returnedImages)
    ? returnedImages.find((im: any) => im?.clientMutationId === row.clientMutationId)
    : undefined;

  images[idx] = {
    ...image,
    status: "synced",
    serverId: serverImage?._id ?? undefined,
  };
  await db
    .update(bandhaki)
    .set({ imagesJson: JSON.stringify(images) })
    .where(eq(bandhaki.localId, row.entityLocalId));
}

// ==================== Dispatch ====================

export async function pushOne(row: OutboxRow): Promise<void> {
  try {
    return await dispatch(row);
  } catch (err) {
    // Anything a handler let through raw (an AxiosError, most often) is
    // classified here. Without this a 4xx looks retryable to the drain, which
    // re-sends it forever and never lets the queue past it.
    if (err instanceof RetryablePushError || err instanceof BlockedPushError) throw err;
    throw toPushError(err);
  }
}

async function dispatch(row: OutboxRow): Promise<void> {
  switch (row.entityType) {
    case "customer":
      if (row.operation === "create") return pushCustomerCreate(row);
      if (row.operation === "update") return pushCustomerUpdate(row);
      if (row.operation === "delete") return pushCustomerDelete(row);
      break;
    case "bandhaki":
      if (row.operation === "create") return pushBandhakiCreate(row);
      if (row.operation === "update") return pushBandhakiUpdate(row);
      if (row.operation === "delete") return pushBandhakiDelete(row);
      break;
    case "payment":
      if (row.operation === "create") return pushPaymentCreate(row);
      break;
    case "bandhakiImage":
      if (row.operation === "addImage") return pushImageAdd(row);
      break;
  }
  throw new BlockedPushError(`Unknown outbox job: ${row.entityType}/${row.operation}`);
}
