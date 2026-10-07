---
description: "Task list for Customer Profile Settings, Transfer Limits & Transaction TPIN Implementation"
---

# Tasks: Customer Profile Settings, Transfer Limits & Transaction TPIN

**Input**: Design documents from `.specify/specs/profile-settings-limits-tpin/`  
**Prerequisites**: `spec.md`, `plan.md`  
**Status**: Ready for Implementation  

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User Story mapping (`US1`, `US2`, `US3`, `US4`, `US5`)

---

## Phase 1: Foundational (Schema, Constants & Infrastructure)

**Purpose**: Establish data models, institutional ceilings, and authoritative calculation services required by all user stories.

- [x] T001 [P] Create `src/constants/limits.js`:
  - Define `SYSTEM_LIMITS.TRANSFER` (`MIN`, `MAX_DAILY: 50000000`, `MAX_WEEKLY: 250000000`, `MAX_YEARLY: 1000000000`).
  - Define `SYSTEM_LIMITS.RECEIVING` (`MIN`, `MAX_DAILY: 50000000`, `MAX_WEEKLY: 250000000`, `MAX_YEARLY: 1000000000`).
  - Define `SYSTEM_LIMITS.TPIN` (`MAX_FAILED_ATTEMPTS: 5`, `LOCKOUT_MINUTES: 15`).
- [x] T002 Update `src/models/user.model.js`:
  - Add `tpin` string field (`select: false`, default `null`).
  - Add `tpinFailedAttempts` number field (default `0`).
  - Add `tpinLockedUntil` date field (default `null`).
  - Add `transferLimits` object with `daily` (default `500000`), `weekly` (default `2500000`), `yearly` (default `10000000`) in cents.
  - Add `receivingLimits` object with `daily` (default `1000000`), `weekly` (default `5000000`), `yearly` (default `20000000`) in cents.
  - Add instance method `compareTpin(candidateTpin)`.
  - Add instance method `isTpinLocked()`.
- [x] T003 Create `src/services/velocity.service.js`:
  - Implement `getPeriodBoundaries()` computing UTC calendar start dates (`startOfDay`, `startOfWeek`, `startOfYear`).
  - Implement `getTransferUsage(senderAccountIds)` via MongoDB aggregation on `Transaction` (`status: "COMPLETED"`).
  - Implement `getReceivingUsage(receiverAccountId)` via MongoDB aggregation on `Transaction` (`status: "COMPLETED"`).
  - Implement `validateTransferLimits(user, senderAccountIds, proposedAmountInCents)` rejecting outgoing breaches with 400 Bad Request.
  - Implement `validateReceivingLimits(receiverUser, receiverAccountId, proposedAmountInCents)` rejecting incoming breaches with 400 Bad Request.

**Checkpoint**: Core data model and velocity engine ready for controller integration. [COMPLETED ✅]

---

## Phase 2: User Story 1 - 4-Digit Transaction PIN (TPIN) Setup & Transfer Gate (Priority: P1) 🎯 MVP

**Goal**: Deliver a dedicated 4-digit numeric cryptographic TPIN mechanism. Authenticated users configure their TPIN, and all outbound transfers require TPIN verification with automated 15-minute brute-force lockout after 5 failed attempts.

**Independent Test**:
1. Call `POST /api/v1/profile/tpin` with `{ tpin: "7294", confirmTpin: "7294" }` $\to$ verify 201 Created and bcrypt hashed storage.
2. Call `POST /api/v1/transactions/transfer` with `{ ...payload, tpin: "7294" }` $\to$ transfer succeeds.
3. Call `POST /api/v1/transactions/transfer` with wrong TPIN `0000` $\to$ transfer rejected with 401 Unauthorized; zero ledger changes occur.
4. Fail TPIN 5 consecutive times $\to$ account locked for 15 minutes (403 Forbidden).

### Implementation for User Story 1

- [x] T004 [US1] Create TPIN handlers in `src/controllers/profile.controller.js`:
  - Implement `setTpin`: Validate 4 numeric digits (`/^\d{4}$/`), confirm match, ensure user has no active TPIN, hash with bcrypt (10 rounds), save.
  - Implement `changeTpin`: Validate `currentTpin`, verify via `compareTpin`, validate `newTpin` (4 digits, different from old), re-hash and save, reset failed attempts.
- [x] T005 [US1] Integrate TPIN verification gate into `transfer` in `src/controllers/transaction.controller.js`:
  - Validate `req.body.tpin` format.
  - Query sender user with `+tpin`.
  - Reject with 400 Bad Request if user has no TPIN configured.
  - Reject with 403 Forbidden if user TPIN is locked (`isTpinLocked()`).
  - Compare candidate TPIN with bcrypt hash.
  - On mismatch: increment `tpinFailedAttempts`, trigger lockout if $\ge 5$, save, throw 401 Unauthorized with remaining attempts count.
  - On success: reset `tpinFailedAttempts = 0` and `tpinLockedUntil = null`.

**Checkpoint**: Outbound transfers require valid TPIN verification with anti-brute-force lockout. [COMPLETED ✅]

---

## Phase 3: User Story 2 - Server-Enforced Transfer & Receiving Velocity Limits (Priority: P1)

**Goal**: Protect accounts against velocity drains by enforcing user-configured daily, weekly, and yearly sending and receiving limits derived from completed transactions.

**Independent Test**:
1. Configure daily transfer limit to $500.00 via `PATCH /api/v1/profile/limits`.
2. Execute $300.00 transfer $\to$ succeeds.
3. Attempt second $250.00 transfer $\to$ rejected with 400 Bad Request ("Daily transfer limit exceeded").
4. Attempt setting daily limit to $10,000,000 $\to$ rejected with 400 Bad Request (exceeds system ceiling).

### Implementation for User Story 2

- [x] T006 [US2] Create velocity limit handlers in `src/controllers/profile.controller.js`:
  - Implement `getLimits`: Return configured `transferLimits`, `receivingLimits`, and live usage from `velocityService`.
  - Implement `updateLimits`: Validate requested values against `SYSTEM_LIMITS` ceilings (reject negative or excessive amounts), update `transferLimits` and `receivingLimits` on `req.user`.
- [x] T007 [US2] Integrate velocity limit validation into `transfer` in `src/controllers/transaction.controller.js`:
  - Call `velocityService.validateTransferLimits(senderUser, [sender._id], amountInCents)` before MongoDB session begins.
  - Call `velocityService.validateReceivingLimits(receiverUser, receiver._id, amountInCents)` before MongoDB session begins.
  - Ensure failed checks abort immediately with descriptive error payloads and zero database writes.

**Checkpoint**: Outgoing and incoming velocity limits are strictly enforced server-side. [COMPLETED ✅]

---

## Phase 4: User Story 3 & 4 - Profile Management, Mass-Assignment Protection & Password Change (Priority: P2)

**Goal**: Provide self-service profile and credential updates. Customers can change their legal name (with mass-assignment prevention) and rotate passwords in-session by verifying their current password.

**Independent Test**:
1. Send `PATCH /api/v1/profile` with `{ name: "Alexander Hamilton", role: "ADMIN" }` $\to$ verify name updates but role remains `CUSTOMER`.
2. Send `PATCH /api/v1/profile/password` with wrong current password $\to$ 401 Unauthorized.
3. Send valid current password and compliant new password $\to$ 200 OK and updated credential.

### Implementation for User Story 3 & 4

- [x] T008 [US3] Implement `updateProfile` in `src/controllers/profile.controller.js`:
  - Extract only `name` from `req.body`.
  - Strip/reject all protected fields (`_id`, `role`, `email`, `isEmailVerified`, `password`, `tpin`).
  - Validate name length (2–100 chars), save, and return sanitized user profile.
- [x] T009 [US4] Implement `changePassword` in `src/controllers/profile.controller.js`:
  - Validate `currentPassword`, `newPassword`, and `confirmPassword`.
  - Fetch user with `+password` and verify `currentPassword` with `user.comparePassword()`.
  - Validate new password strength ($\ge 8$ chars, must differ from current).
  - Save re-hashed password with pre-save hook.
- [x] T010 [US3, US4] Create `src/routes/profile.routes.js` and mount in `src/routes/index.js`:
  - Mount under `/api/v1/profile` with `authMiddleware`:
    - `GET /` -> `getProfile`
    - `PATCH /` -> `updateProfile`
    - `PATCH /password` -> `changePassword`
    - `POST /tpin` -> `setTpin`
    - `PATCH /tpin` -> `changeTpin`
    - `GET /limits` -> `getLimits`
    - `PATCH /limits` -> `updateLimits`
  - Mount `router.use("/profile", profileRoutes)` in `src/routes/index.js`.

**Checkpoint**: Profile and credential endpoints are fully operational and protected against privilege escalation. [COMPLETED ✅]

---

## Phase 5: User Story 5 - Frontend Settings Cockpit & Transfer TPIN Integration (Priority: P3)

**Goal**: Deliver a modern, accessible, tabbed Profile & Security Settings interface on `/profile` and embed a secure 4-digit PIN input into the `/transfer` confirmation review modal.

**Independent Test**:
1. Navigate to `/profile` $\to$ inspect 4 tabs (Profile, Security, TPIN, Limits).
2. Edit name, change password, and configure TPIN from UI.
3. View transfer limits cards with live usage progress bars.
4. Execute a transfer on `/transfer`: enter 4-digit PIN in modal $\to$ transfer commits successfully.

### Implementation for User Story 5

- [x] T011 [P] [US5] Create `client/src/services/profileService.js`:
  - Export `getProfile`, `updateProfile`, `changePassword`, `setTpin`, `changeTpin`, `getLimits`, and `updateLimits` calling `/api/v1/profile/*`.
- [x] T012 [US5] Redesign `client/src/pages/ProfilePage.jsx`:
  - Build responsive tabbed layout:
    - **Tab 1: Basic Profile**: Display verified credentials, inline edit form for legal name.
    - **Tab 2: Password & Credentials**: Change password form with current password verification and strength meter.
    - **Tab 3: Transaction PIN (TPIN)**: TPIN status badge, Set TPIN dialog (if not configured), Change TPIN dialog (if active).
    - **Tab 4: Transfer Limits**: Outbound transfer cards (Daily, Weekly, Yearly) and Inbound receiving cards with live usage progress meters and edit modal.
    - **Tab 5: Active Session**: 256-bit TLS status and session revocation button.
- [x] T013 [US5] Update `client/src/components/banking/TransferModal.jsx`:
  - Add Step 2 TPIN input: 4 individual masked circular digit boxes with auto-advance, backspace navigation, and numeric entry.
  - Display error messages inline (e.g. "Incorrect TPIN · 4 attempts remaining", or "TPIN locked").
  - Display clear callout if user has not set TPIN with direct link to `/profile`.
- [x] T014 [US5] Update `client/src/pages/TransferPage.jsx`:
  - Update `handleExecuteTransfer` to collect and pass `tpin` to `transactionService.transfer({ ...payload, tpin })`.
- [x] T015 [US5] Update `client/src/services/transactionService.js`:
  - Ensure `transfer` payload accepts and passes `tpin`.

**Checkpoint**: End-to-end customer journey complete from settings configuration to PIN-authorized transfers. [COMPLETED ✅]

---

## Phase 6: Verification & Full-Stack Audit

**Purpose**: Execute automated integration testing across backend endpoints, security rules, regression suites, and production bundle builds.

- [x] T016 Create and execute automated backend test script `scripts/test-profile-security.js`:
  - Test profile view and mass-assignment protection.
  - Test password change with valid and invalid current passwords.
  - Test TPIN setup, incorrect TPIN rejection, and 15-minute lockout after 5 consecutive failures.
  - Test transfer limit updates and rejection of amounts exceeding system ceilings.
  - Test transfer execution with missing TPIN, invalid TPIN, and valid TPIN.
  - Test daily transfer limit enforcement.
  - Test recipient daily receiving limit enforcement.
- [x] T017 Run client production build (`npm --prefix client run build`) to ensure 0 compilation errors.
- [x] T018 Run complete platform regression suite (`node scripts/verify-all.js`) ensuring all existing milestone tests pass 100%.

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)** MUST be implemented first.
- **Phase 2 (TPIN Backend)** and **Phase 3 (Limits Backend)** depend on Phase 1 and can run in parallel.
- **Phase 4 (Profile & Routes)** completes the backend API surface.
- **Phase 5 (Frontend Integration)** depends on backend APIs being mounted.
- **Phase 6 (Verification)** runs after all implementation phases are complete.
