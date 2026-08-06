import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// ==================== Shared types ====================

export type InterestType = "simple" | "compound";
export type LoanStatus = "active" | "closed" | "defaulted";
export type PaymentStatus = "pending" | "partial" | "paid";

export type ImageSyncStatus =
  | "synced"
  | "pendingUpload"
  | "uploaded_pending_attach"
  | "failed";

export interface LocalLoanImage {
  localId: string;
  serverId?: string;
  name: string;
  url?: string;
  localUri?: string;
  // Matches the outbox job's clientMutationId so a pulled image can be
  // reconciled with the local pending entry even if write-back was interrupted.
  clientMutationId?: string;
  status: ImageSyncStatus;
}

export interface LocalGoldItem {
  itemType: string;
  weight?: number;
  notes?: string;
}

// ==================== Tables ====================

export const customers = sqliteTable(
  "customers",
  {
    localId: text("localId").primaryKey(),
    serverId: text("serverId"),
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    idProof: text("idProof"),
    photoUrl: text("photoUrl"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("customers_serverId_idx").on(table.serverId),
    index("customers_updatedAt_idx").on(table.updatedAt),
  ],
);

export const bandhaki = sqliteTable(
  "bandhaki",
  {
    localId: text("localId").primaryKey(),
    serverId: text("serverId"),
    customerLocalId: text("customerLocalId").notNull(),
    customerServerId: text("customerServerId"),
    loanNumber: text("loanNumber"),
    loanDate: integer("loanDate", { mode: "timestamp_ms" }).notNull(),
    lastInterestPaidDate: integer("lastInterestPaidDate", {
      mode: "timestamp_ms",
    }).notNull(),
    principalAmount: real("principalAmount").notNull(),
    outstandingPrincipal: real("outstandingPrincipal").notNull(),
    outstandingInterest: real("outstandingInterest").notNull().default(0),
    interestRate: real("interestRate").notNull(),
    interestType: text("interestType").notNull(),
    status: text("status").notNull(),
    paymentStatus: text("paymentStatus").notNull(),
    totalPaidAmount: real("totalPaidAmount").notNull().default(0),
    goldItemsJson: text("goldItemsJson").notNull().default("[]"),
    imagesJson: text("imagesJson").notNull().default("[]"),
    totalValuation: real("totalValuation").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("bandhaki_serverId_idx").on(table.serverId),
    index("bandhaki_customerLocalId_idx").on(table.customerLocalId),
    index("bandhaki_updatedAt_idx").on(table.updatedAt),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    localId: text("localId").primaryKey(),
    serverId: text("serverId"),
    bandhakiLocalId: text("bandhakiLocalId").notNull(),
    bandhakiServerId: text("bandhakiServerId"),
    paymentDate: integer("paymentDate", { mode: "timestamp_ms" }).notNull(),
    amount: real("amount").notNull(),
    interestComponent: real("interestComponent").notNull().default(0),
    principalComponent: real("principalComponent").notNull().default(0),
    paymentMethod: text("paymentMethod").notNull(),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("payments_serverId_idx").on(table.serverId),
    index("payments_bandhakiLocalId_idx").on(table.bandhakiLocalId),
    index("payments_updatedAt_idx").on(table.updatedAt),
  ],
);

export const syncCursor = sqliteTable("sync_cursor", {
  entity: text("entity").primaryKey(),
  lastPulledAt: integer("lastPulledAt", { mode: "timestamp_ms" }).notNull(),
});

export type OutboxStatus = "pending" | "inflight" | "error" | "blocked" | "done";
export type OutboxOperation = "create" | "update" | "delete" | "addImage";

export const syncOutbox = sqliteTable(
  "sync_outbox",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entityType").notNull(),
    operation: text("operation").notNull(),
    entityLocalId: text("entityLocalId").notNull(),
    payloadJson: text("payloadJson").notNull(),
    clientMutationId: text("clientMutationId").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("lastError"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("sync_outbox_clientMutationId_idx").on(table.clientMutationId),
    index("sync_outbox_status_idx").on(table.status, table.id),
  ],
);
