CREATE TABLE `bandhaki` (
	`localId` text PRIMARY KEY NOT NULL,
	`serverId` text,
	`customerLocalId` text NOT NULL,
	`customerServerId` text,
	`loanNumber` text,
	`loanDate` integer NOT NULL,
	`lastInterestPaidDate` integer NOT NULL,
	`principalAmount` real NOT NULL,
	`outstandingPrincipal` real NOT NULL,
	`outstandingInterest` real DEFAULT 0 NOT NULL,
	`interestRate` real NOT NULL,
	`interestType` text NOT NULL,
	`status` text NOT NULL,
	`paymentStatus` text NOT NULL,
	`totalPaidAmount` real DEFAULT 0 NOT NULL,
	`goldItemsJson` text DEFAULT '[]' NOT NULL,
	`imagesJson` text DEFAULT '[]' NOT NULL,
	`totalValuation` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bandhaki_serverId_idx` ON `bandhaki` (`serverId`);--> statement-breakpoint
CREATE INDEX `bandhaki_customerLocalId_idx` ON `bandhaki` (`customerLocalId`);--> statement-breakpoint
CREATE INDEX `bandhaki_updatedAt_idx` ON `bandhaki` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `customers` (
	`localId` text PRIMARY KEY NOT NULL,
	`serverId` text,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`idProof` text,
	`photoUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`deletedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_serverId_idx` ON `customers` (`serverId`);--> statement-breakpoint
CREATE INDEX `customers_updatedAt_idx` ON `customers` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `payments` (
	`localId` text PRIMARY KEY NOT NULL,
	`serverId` text,
	`bandhakiLocalId` text NOT NULL,
	`bandhakiServerId` text,
	`paymentDate` integer NOT NULL,
	`amount` real NOT NULL,
	`interestComponent` real DEFAULT 0 NOT NULL,
	`principalComponent` real DEFAULT 0 NOT NULL,
	`paymentMethod` text NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_serverId_idx` ON `payments` (`serverId`);--> statement-breakpoint
CREATE INDEX `payments_bandhakiLocalId_idx` ON `payments` (`bandhakiLocalId`);--> statement-breakpoint
CREATE INDEX `payments_updatedAt_idx` ON `payments` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `sync_cursor` (
	`entity` text PRIMARY KEY NOT NULL,
	`lastPulledAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entityType` text NOT NULL,
	`operation` text NOT NULL,
	`entityLocalId` text NOT NULL,
	`payloadJson` text NOT NULL,
	`clientMutationId` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lastError` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_outbox_clientMutationId_idx` ON `sync_outbox` (`clientMutationId`);--> statement-breakpoint
CREATE INDEX `sync_outbox_status_idx` ON `sync_outbox` (`status`,`id`);