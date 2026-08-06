 Offline + Online Sync for Bandhaki

 Context

 Bandhaki is a gold-loan/pawn ledger app for small shops: a React Native (Expo) mobile client backed by an Express + Mongoose API (backend/, feature-folder architecture) and MongoDB, with Cloudinary for image storage. Today the app is fully online-only — React Query's in-memory cache is the only client-side state, wiped on every restart, and every screen calls the backend directly through a single axios client. There is no local persistence, no connectivity detection, and no request queuing anywhere in the codebase.

 The goal is to let shop staff keep working with zero interruption when the connection drops — viewing existing customers/loans/ledgers, and creating new loans, customers, and payments — with everything reconciling automatically once the device reconnects. Both repos (backend/ and bandhaki/) live inside this working directory and are both in scope to modify.

 Two facts about this specific domain drove the design:
 1. Single device per shop (tenant ≈ one active writer — confirmed; tenantId === userId in the backend's auth model). This means last-write-wins is sufficient; no merge/conflict-resolution UI is needed.
 2. Payments are not commutative. payment.service.ts create() reads the loan's current outstandingPrincipal/outstandingInterest, computes the new split, and mutates the loan in the same request. Two payments queued offline against the same loan must be replayed to the server in exact ronological order — payment #2's correct split can only be computed after payment #1's write has actually landed server-side. This is the single riskiest part of the whole feature.

 How the design defuses the payment-ordering risk: the mobile outbox is a single global FIFO queue (SQLite autoincrement rowid = sequence), drained strictly one row at a time, fully awaited, never parallelized — and any failure halts the queue instead of skipping ahead. Since a user can never queue payment #2 in the UI before payment #1 exists, and can never create a loan-edit before the loan itself exists, insertion order into the outbox is the correct dependency order for everything (customer → its loans → their payments/images). A dumb sequential drain therefore satisfies both ID-dependency resolution and payment ordering with no dependency-graph resolver needed.

 ---
 Part 1 — Backend changes (backend/)

 1.1 Model additions

 - src/models/customer.model.ts, bandhaki.model.ts: add deletedAt?: Date | null (soft delete) and clientMutationId?: string (idempotency). Indexes: {tenantId,updatedAt}, {tenantId,deletedAt}, and a sparse unique {tenantId,clientMutationId}.                                       
 - bandhaki.model.ts: also add clientMutationId?: string to the IImage subdocument (each pushed image needs its own idempotency key).
 - payment.model.ts: add clientMutationId?: string + sparse unique {tenantId,clientMutationId} index only. No deletedAt — there's no delete route for payments today (append-only ledger); don't add a tombstone field with no code path to set it.

 1.2 Idempotent creates

 Every create path the outbox will replay (customer create, bandhaki create, payment create, bandhaki image add) accepts an optionalclientMutationId. Before inserting, check {tenantId, clientMutationId}; if a match exists, return the existing record instead of creating a duplicate. Apply to:
 - customer.validation.ts (add optional field to CreateCustomerSchema), customer.service.ts create(), customer.repository.ts (findByClientMutationId).
 - Same pattern in bandhaki.validation.ts/service.ts/repository.ts for create() and AddImageSchema/addImage() (dedupe by scanning images[] for the key before $push).
 - Same pattern in payment.validation.ts/service.ts/repository.ts for create(). Important: the idempotency check must run before any mutation of the loan's balances — a replayed request must short-circuit to {paymentId: existing._id} without touching the loan a second time.

 1.3 Soft delete

 Swap hard deletes for tombstones in customer.repository.ts and bandhaki.repository.ts: delete() becomesfindOneAndUpdate({...,deletedAt:null},{deletedAt:new Date()}). Add deletedAt: null to every existing read filter (findById, findAllByTenant, findActiveByTenant, findByCustomer, findPaginated, etc.). No controller/route/service signature changes needed — purely repository-internal.

 1.4 New incremental pull-sync endpoints

 Add a sync sub-route to each of the three existing feature route files (keep the feature-folder convention rather than inventing a new "sync"feature):

 GET /api/customers/sync?since=<ISO-8601>, GET /api/bandhaki/sync?since=..., GET /api/payments/sync?since=... — placed before any :id route so it isn't shadowed. Response: {success:true, message, data:{upserts:T[], deletedIds:string[], serverTime:string}}.

 Implementation per feature: controller parses since from query, calls service.getUpdatesSince(tenantId, since). The service captures constqueryStartTime = new Date() before running any query — this becomes the returned serverTime, so the client's next cursor never loses writes that land during this request's own execution window. Repository adds findUpsertsSince(tenantId, since) ({tenantId, deletedAt:null,updatedAt:{$gt:since}}, sorted updatedAt asc) and findDeletedIdsSince(tenantId, since) ({tenantId, deletedAt:{$ne:null,$gt:since}}, IDs only). bandhaki's findUpsertsSince should .populate("customer","name phone address") so the client can resolve the parent link even for loans whosecustomer wasn't re-pulled this cycle. Payments' getUpdatesSince only needs upserts (deletedIds always []) but returns the same 3-field shape for a uniform client contract.

 1.5 Note, not required

 bandhaki.service.ts update() has no guard today against editing a closed/defaulted loan (only payment creation is guarded). Worth hardeningeventually but not required for this feature — the plan's offline-conflict test case uses the already-enforced payment-vs-closed-loan path instead.

 ---
 Part 2 — Mobile: local database (bandhaki/)

 2.1 Dependencies

 npx expo install expo-sqlite @react-native-community/netinfo expo-crypto, npm install drizzle-orm, npm install -D drizzle-kit. Use expo-crypto's randomUUID() for local IDs (matches the project's existing Expo-first dependency style; no extra native linking; device-local uniqueness is all that's needed since it's single-device-per-shop).

 2.2 Config

 - New metro.config.js with config.resolver.sourceExts.push("sql") (required so Metro can bundle drizzle-kit's generated migration files).
 - New drizzle.config.ts (dialect:"sqlite", driver:"expo", schema/out paths).
 - app.json: add "expo-sqlite" to plugins.

 2.3 Schema — new src/db/schema.ts

 Every entity table has localId (client UUID, primary key) and a nullable serverId. Foreign keys always point at *LocalId, never *ServerId — this is what lets a loan be created offline against a customer also created offline, since the local FK is known the instant the parent row exists,long before either syncs. Denormalized *ServerId cache columns exist purely for the push engine to resolve at send-time.

 - customers: localId, serverId, name, phone, address, idProof, photoUrl, createdAt, updatedAt, deletedAt.
 - bandhaki: localId, serverId, customerLocalId, customerServerId, loanNumber (null until server-assigned → UI shows "Pending…"), loanDate,lastInterestPaidDate, principalAmount, outstandingPrincipal, outstandingInterest, interestRate, interestType, status, paymentStatus, totalPaidAmount, goldItemsJson, imagesJson({localId,serverId?,name,url?,localUri?,status:'synced'|'pendingUpload'|'uploaded_pending_attach'|'failed'}[]), totalValuation, createdAt, updatedAt, deletedAt. JSON columns are the pragmatic choice here since SQLite has no array type and the backend itself embeds images as asubdocument array, not a separate collection.
 - payments: localId, serverId, bandhakiLocalId, bandhakiServerId, paymentDate, amount, interestComponent, principalComponent, paymentMethod,notes, createdAt (drives push order), updatedAt. No deletedAt — matches backend's append-only model.
 - sync_cursor: entity (PK), lastPulledAt.
 - sync_outbox: id (autoincrement = FIFO sequence), entityType, operation, entityLocalId, payloadJson, clientMutationId (unique), status (pending|inflight|error|blocked|done), attempts, lastError, createdAt.

 2.4 Client & migrations

 src/db/client.ts opens the DB via openDatabaseSync and wraps it in drizzle(). src/db/migrator.ts wraps drizzle-orm/expo-sqlite/migrator.app/_layout.tsx gets a MigrationGate (same pattern as the existing AuthGate) that runs migrations once on mount before anything else renders.

 ---
 Part 3 — Mobile: sync engine (src/sync/)

 - netInfo.ts: useIsOnline() hook (NetInfo listener) + isCurrentlyOnline() one-shot check.
 - src/db/repositories/outbox.repo.ts: enqueue() (mints clientMutationId, always called inside the same Drizzle transaction as the entity write it belongs to), getPendingOrdered() (status in ('pending','error') ordered by id asc), markInflight/markDone/markRetryable/markBlocked,getBlocked/retry/dismiss.
 - push.ts — the FIFO drain: guarded by an isPushing flag against re-entry, bails if offline. Loops getPendingOrdered() one row at a time: markinflight → attempt → on success mark done and continue; on network/timeout error mark retryable and halt the loop; on 4xx business-rule error mark blocked and halt the loop. Halting (never skipping to the next row) is what guarantees a later payment is never sent while an earlier oneis unresolved. pushOne() switches on (entityType, operation):
   - customer/create → send with clientMutationId, write returned serverId back onto the local row.
   - bandhaki/create → resolve customerServerId from the local customers table via customerLocalId (always populated by now under strict FIFO; if not, throw a retryable DependencyNotReadyError as a defensive self-heal). Write back serverId and server-assigned loanNumber.
   - payment/create → resolve bandhakiServerId the same way, send, write back serverId. The loan's own balance fields are not locally recomputed here — they stay "estimated" until the next pull overwrites them with server truth.
   - bandhakiImage/addImage → two sub-steps as one job: (1) if localUri present and no url yet, upload to Cloudinary and immediately persist the returned url into the image's JSON entry (status → uploaded_pending_attach) so a retry after partial failure skips re-uploading; (2) call theattach endpoint with clientMutationId, mark synced on success.
 - pull.ts — pullAll() runs pullEntity('customers') → pullEntity('bandhaki') → pullEntity('payments') sequentially (mirrors the FK direction).pullEntity(): read cursor → call /sync?since= → in one transaction, upsert by serverId (mint local UUID if new) and tombstone-delete by serverId for each deletedId, skipping any row that still has a pending outbox entry (belt-and-braces) → advance the cursor to the server's returnedserverTime, never the device clock.
 - orchestrator.ts — syncNow(trigger): push always runs to completion (or halts on the first blocker) before pull runs. Never interleaved — thisis what guarantees a pull can't clobber a not-yet-sent local edit.
 - syncStatusStore.ts / useSyncStatus.ts — minimal useSyncExternalStore-based pub/sub exposing {isOnline, isSyncing, pendingCount, blockedCount,lastSyncedAt}. Ephemeral engine state, so this intentionally stays outside React Query (matching the project's existing "react-query is the only state layer" convention for server data).
 - useSyncTriggers.ts, wired once into app/_layout.tsx: NetInfo offline→online transition and AppState background→active-while-online both call syncNow. Explicitly no polling interval.

 ---
 Part 4 — Data-access layer rework

 4.1 Local repositories (src/db/repositories/{customers,bandhaki,payments,dashboard}.repo.ts)

 Read functions shaped like the existing src/types/index.ts interfaces plus localId/serverId/_pendingSync. Write functions combine an entity write + outbox enqueue in one transaction.

 - listBandhakiPaginated/listActiveBandhaki port the search/filter/pagination logic from backend/src/features/bandhaki/bandhaki.repository.tsfindPaginated() as Drizzle where/like/limit/offset.
 - Loan detail reads must also port the live interest computation from backend/src/features/bandhaki/bandhaki.service.ts getById()(calculatedInterest, daysSinceLoan, totalDue are computed at request time server-side, not stored fields — confirmed by reading that file directly) so the offline loan-detail screen shows the same numbers the online one would. Use the same portedcalculateInterest/calculateDaysBetween utils from Part 6 for this, not just for the payment-entry screen.
   - Note: bandhaki.service.ts getByCustomer() uses a visibly different, inconsistent interest formula (days/30 instead of days/365 for simpleinterest) than getById()'s canonical calculateInterest() util. This looks like a pre-existing backend bug unrelated to sync — flagging it, but out of scope to fix here. The local port should mirror getById()'s formula as the canonical one.
 - computeDashboardLocal() ports backend/src/features/dashboard/dashboard.service.ts getStats() (customer count, active-loan count, last 5 payments joined to loan+customer) against local tables.

 4.2 Hook rewrites                                                                                                                           

 - useCustomers.ts, useLoans.ts (useLoans/useActiveLoans), useDashboard.ts switch their queryFn to the local repositories, with staleTime:   Infinity (now correct since invalidation is explicit — on local write and after every pull, not time-based).
 - New usePayments.ts (usePaymentsForLoan) replaces the inline ad hoc useQuery currently in app/(bandhaki)/[id].tsx.                         

 4.3 Mutation pattern change

 Applies to app/(customers)/new.tsx, update/[id].tsx, app/(bandhaki)/new.tsx, update/[id].tsx, app/(payments)/new.tsx,src/components/QuickAddCustomerModal.tsx. From "direct network call + local loading state" to useMutation({mutationFn: createXxxLocal, onSuccess: () => { invalidateQueries(...); syncNow('post-mutation'); router.back(); }}). syncNow is fire-and-forget — the write is alreadydurable locally, so the form navigates away immediately; sync progress/failures surface only via the status banner, never by blocking the submit button.

 ---
 Part 5 — Cloudinary offline queuing

 - app/(bandhaki)/new.tsx: uploadAssets() stops calling Cloudinary at pick-time (this also fixes a pre-existing issue where images upload eagerly even if the user abandons the form). Picked assets are held as {localUri, status:'pendingUpload'}; on submit, createBandhakiLocal enqueues theloan create, then one bandhakiImage/addImage job per image right after — FIFO guarantees bandhakiServerId is resolvable by the time each image job runs.
 - app/(bandhaki)/[id].tsx: today's separate "upload then attach" flow collapses into a single attachImageLocal(loan.localId, asset) call. The image list renders a "will upload when online" badge for any entry whose status isn't synced.

 ---
 Part 6 — Client-side interest calculation port

 New src/utils/interest.ts — direct port of backend/src/utils/interest.ts (calculateInterest, calculateDaysBetween), with a comment pointing at the backend file as source of truth (no shared package exists between the two repos; duplication is the pragmatic choice for v1). Used both forthe loan-detail read (Part 4.1) and app/(payments)/new.tsx's interest-due preview, which is now computed client-side from local data instead of read off a server response. Show a small "Estimated — confirmed once synced" caption whenever the loan has pending outbox entries or the deviceis offline.

 ---
 Part 7 — UI additions

 - src/components/SyncStatusBanner.tsx, mounted once in app/_layout.tsx: offline ("Offline — N changes queued"), syncing (spinner), blocked ("Nsync issue(s) — tap to review"), fully-synced (no banner).
 - New app/(sync)/issues.tsx: lists blocked outbox rows with a human-readable description (derived from the payload), the server's error, andRetry/Dismiss actions.

 ---
 Implementation order

 1. Backend: model fields → idempotency → soft delete → /sync endpoints.
 2. Mobile infra: deps → config files → schema.ts → client/migrator + MigrationGate.
 3. Sync engine: netInfo → outbox.repo → push.ts → pull.ts → orchestrator.ts → status store/hook → triggers wired into _layout.tsx. Include aninitial full-pull gate on first launch.
 4. Data-access rework: local repositories → hook rewrites → screen mutation rewrites (folding in the Cloudinary unification and interest port as those screens are touched anyway).
 5. UI polish: sync banner, sync-issues screen.

 Critical files

 - backend/src/features/payment/payment.service.ts — the stateful balance-mutation logic driving the ordering constraint.
 - backend/src/models/bandhaki.model.ts, customer.model.ts, payment.model.ts — soft-delete/idempotency field additions.
 - backend/src/features/bandhaki/bandhaki.service.ts (getById) — canonical live interest-calculation formula to port.
 - bandhaki/src/db/schema.ts — local↔server ID strategy.
 - bandhaki/src/sync/push.ts, pull.ts, orchestrator.ts — the engine itself.
 - bandhaki/app/(payments)/new.tsx, app/(bandhaki)/[id].tsx, app/(bandhaki)/new.tsx — the three screens with the most involved rewrites (interest preview, image queuing, mutation pattern).

 Verification plan

 - Golden path: airplane mode on → create a customer → create a loan against that new customer → record a payment on it → reconnect → confirm the sync banner clears and sync_outbox is empty, and that customer/loan/payment now carry real Mongo serverIds (check via the backend directly, e.g. mongosh or a quick GET call) matching what's shown in the app.
 - Payment ordering: queue two payments offline against the same loan (second one large enough to fully close it), reconnect, confirm both land with the correct sequential balance math (compare against manually recalculating via calculateInterest) and the loan ends up closed.
 - Blocked-mutation surfacing: offline, queue a payment that would close a loan, then queue an edit to that same loan; reconnect; confirm the payment succeeds, the edit lands in the Sync Issues screen with a clear error, and it doesn't silently disappear.
 - Kill-mid-sync: force-quit the app mid-drain (e.g. after the loan create pushes but before its image job runs); relaunch; confirm the outbox resumes exactly where it left off with no duplicate loan (idempotency key protects this).                                                   
 - Cloudinary offline queuing: pick photos for a new loan while offline, submit, reconnect; confirm images actually appear in Cloudinary and are attached to the right loan, not just marked synced.
 - Regression check: run through customer/loan/payment CRUD and receipt printing while online, to confirm the local-first rework didn't change existing online behavior