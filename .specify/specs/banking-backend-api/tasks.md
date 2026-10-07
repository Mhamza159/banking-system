# Tasks: Complete Production-Grade Banking Backend API

**Input**: Design documents from `.specify/specs/banking-backend-api/` (`spec.md` and `plan.md`)  
**Prerequisites**: `spec.md` (approved), `plan.md` (approved)  
**Organization**: Tasks are structured by priority (P1, P2) and divided into granular, independent micro-tasks.

---

## Format: `[ID] [P?] [Phase/Story] Description`
- **[P]**: Parallelizable (independent files, no blocking dependencies).
- Includes exact file paths in every task.

---

## Phase 1: Setup & Dependencies (Shared Infrastructure)

**Purpose**: Initialize project dependencies and core folder structure.

- [x] T001 Install production dependencies (`bcrypt`, `jsonwebtoken`, `cookie-parser`, `nodemailer`, `uuid`) in `package.json`
- [x] T002 [P] Create `.env.example` template covering `PORT`, `MONGO_URI`, `JWT_SECRET`, `COOKIE_SECRET`, `SMTP_*`, and `NODE_ENV`
- [x] T003 [P] Create constant enums for roles (`src/constants/roles.js`), account status (`src/constants/accountStatus.js`), and transaction status (`src/constants/transactionStatus.js`)

---

## Phase 2: Foundational (Core Utilities, Error Handling & Global Middleware)

**Purpose**: Core infrastructure that all user stories depend upon.

- [x] T004 Implement custom standard error class `ApiError` in `src/utils/apiError.js`
- [x] T005 [P] Implement standard JSON response wrapper `ApiResponse` in `src/utils/apiResponse.js`
- [x] T006 [P] Implement financial minor-unit conversion helpers (`toCents`, `toDollars`) in `src/utils/currency.js`
- [x] T007 [P] Implement collision-resistant 10-digit random account number generator in `src/utils/generator.js`
- [x] T008 Implement global error handler middleware in `src/middleware/error.middleware.js`
- [x] T009 Configure `src/app.js` with `express.json()`, `cookie-parser()`, URL-encoding, and mount the global error middleware

**Checkpoint**: Foundation ready. Core utilities and error boundary verified.

---

## Phase 3: User Story 1 - Authentication & User Credentials (Priority: P1) 🎯 MVP Core

**Goal**: Enable users to register with regex-validated emails and hashed passwords, log in, and establish an HTTP-only JWT cookie session.

### Implementation Tasks:
- [x] T010 Create `User` Mongoose schema in `src/models/user.model.js` with RFC 5322 email regex, unique index, and `password.select: false`
- [x] T011 Add Mongoose `pre('save')` hook to `src/models/user.model.js` for bcrypt salt hashing (10 rounds)
- [x] T012 Add `comparePassword` instance method to `src/models/user.model.js` utilizing `bcrypt.compare`
- [x] T013 Implement `authController.register` in `src/controllers/auth.controller.js`
- [x] T014 Implement `authController.login` in `src/controllers/auth.controller.js` issuing JWT and setting HTTP-only cookie
- [x] T015 Implement `authController.getProfile` (`/me`) in `src/controllers/auth.controller.js`
- [x] T016 Create auth routes in `src/routes/auth.routes.js` and mount under `/api/v1/auth` in `src/routes/index.js`

**Independent Test**:
- Send `POST /api/v1/auth/register` with test user credentials -> Assert 201 Created and password is not returned.
- Send `POST /api/v1/auth/login` -> Assert 200 OK and `Set-Cookie` contains `token` with `HttpOnly; SameSite=Strict`.

---

## Phase 4: User Story 2 - Bank Account Management & Faucet Deposit (Priority: P1)

**Goal**: Provision a 10-digit bank account for every customer and provide an initial deposit mechanism (faucet) to inject funds into the banking ecosystem.

### Implementation Tasks:
- [x] T017 Create `Account` Mongoose schema in `src/models/account.model.js` with 10-digit unique `accountNumber`, `user` ref, and status enum
- [x] T018 Integrate automatic default Savings Account provisioning inside `authController.register` in `src/controllers/auth.controller.js`
- [x] T019 Implement `accountController.getMyAccounts` in `src/controllers/account.controller.js`
- [x] T020 Implement `accountController.createAccount` (for secondary checking/savings accounts) in `src/controllers/account.controller.js`
- [x] T021 Implement `accountController.depositFaucet` in `src/controllers/account.controller.js` (for funding test accounts with initial balance)
- [x] T022 Create account routes in `src/routes/account.routes.js` and mount under `/api/v1/accounts` in `src/routes/index.js`

**Independent Test**:
- Register new user -> Check that an `Account` document with a unique 10-digit account number is created.
- Call `GET /api/v1/accounts/me` -> Assert account details match authenticated user.

---

## Phase 5: User Story 3 - Double-Entry Ledger & Balance Aggregation Engine (Priority: P1)

**Goal**: Implement the append-only `Ledger` journal and compute real-time balances using MongoDB Aggregation Pipelines ($Credits - Debits$).

### Implementation Tasks:
- [x] T023 Create `Ledger` Mongoose schema in `src/models/ledger.model.js` with `DEBIT`/`CREDIT` enum, positive integer minor units, and `{ accountId: 1, createdAt: -1 }` index
- [x] T024 Implement `ledgerService.getAccountBalance` in `src/services/ledger.service.js` using MongoDB Aggregation Pipeline (`$match`, `$group`, `$sum`, `$cond`, `$project`)
- [x] T025 Implement `ledgerService.recordFaucetDeposit` in `src/services/ledger.service.js` to create balanced ledger entries on deposit
- [x] T026 Implement `accountController.getBalance` in `src/controllers/account.controller.js` querying `ledgerService.getAccountBalance`
- [x] T027 Expose `GET /api/v1/accounts/:accountId/balance` route in `src/routes/account.routes.js` with account ownership verification

**Independent Test**:
- Call `POST /api/v1/accounts/:accountId/deposit` with $500.00 (50,000 cents).
- Call `GET /api/v1/accounts/:accountId/balance` -> Assert `balanceInCents: 50000` and `formattedBalance: "$500.00"`.

---

## Phase 6: User Story 4 - ACID Transaction Transfers & Idempotency Engine (Priority: P1) 🎯 High Value

**Goal**: Execute atomic money transfers between accounts with duplicate-prevention idempotency and full rollback safety.

### Implementation Tasks:
- [x] T028 Create `Transaction` Mongoose schema in `src/models/transaction.model.js` with `idempotencyKey` unique index, `PENDING`/`COMPLETED`/`FAILED` status, and amount in minor units
- [x] T029 Implement idempotency validation logic in `src/controllers/transaction.controller.js` to detect completed cached transactions and `409 Conflict` for in-flight requests
- [x] T030 Implement account status validation in `src/controllers/transaction.controller.js` (ensuring both sender and receiver accounts are `ACTIVE`)
- [x] T031 Implement self-transfer prevention check in `src/controllers/transaction.controller.js` (`senderAccount._id !== receiverAccount._id`)
- [x] T032 Implement atomic transfer orchestration in `src/controllers/transaction.controller.js` using `mongoose.startSession()` and `session.startTransaction()`:
  - Aggregate sender balance within the session
  - Validate `balance >= amountInCents` (abort with 400 Insufficient Funds if false)
  - Create `Transaction` record with status `PENDING`
  - Insert sender `DEBIT` entry in `Ledger`
  - Insert receiver `CREDIT` entry in `Ledger`
  - Update `Transaction` status to `COMPLETED`
  - Commit transaction (`session.commitTransaction()`)
- [x] T033 Implement `transactionController.getHistory` and `transactionController.getTransactionById` in `src/controllers/transaction.controller.js`
- [x] T034 Create transaction routes in `src/routes/transaction.routes.js` and mount under `/api/v1/transactions` in `src/routes/index.js`

**Independent Test**:
- User 1 transfers $50.00 to User 2 with `Idempotency-Key: key-test-01`.
  - Assert HTTP 201 Created.
  - Assert User 1 balance reduced by $50.00 and User 2 balance increased by $50.00.
  - Re-send exact same request -> Assert HTTP 200 OK cached receipt without changing balances.
- Attempt transfer with amount > available balance -> Assert HTTP 400 Insufficient Funds and zero ledger modifications.

---

## Phase 7: User Story 5 - Token Blacklisting & Secure Logout (Priority: P2)

**Goal**: Enable real server-side token revocation upon user logout using a MongoDB TTL-indexed `Blacklist` collection.

### Implementation Tasks:
- [x] T035 Create `Blacklist` Mongoose schema in `src/models/blacklist.model.js` with unique `token` field and `expiresAt` TTL index (`{ expires: 0 }`)
- [x] T036 Implement `authMiddleware` in `src/middleware/auth.middleware.js` extracting JWT from cookies or headers, verifying against `Blacklist`, and attaching `req.user`
- [x] T037 Implement `authController.logout` in `src/controllers/auth.controller.js` saving the current JWT to `Blacklist` and clearing the auth cookie
- [x] T038 Protect all private routes in `src/routes/account.routes.js` and `src/routes/transaction.routes.js` with `authMiddleware`

**Independent Test**:
- Log in and call a protected endpoint -> Assert 200 OK.
- Call `POST /api/v1/auth/logout` -> Assert 200 OK.
- Re-use the old token -> Assert 401 Unauthorized ("Token has been revoked").

---

## Phase 8: User Story 6 - Asynchronous Email Notification Subsystem (Priority: P2)

**Goal**: Deliver non-blocking welcome emails and debit/credit transaction alerts via Nodemailer.

### Implementation Tasks:
- [x] T039 Configure Nodemailer SMTP transport in `src/config/email.js` using environment credentials with fallback logger for development
- [x] T040 Implement `emailService.sendWelcomeEmail` in `src/services/email.service.js`
- [x] T041 Implement `emailService.sendDebitAlert` in `src/services/email.service.js`
- [x] T042 Implement `emailService.sendCreditAlert` in `src/services/email.service.js`
- [x] T043 Integrate asynchronous fire-and-forget email dispatch into `authController.register` and `transactionController.transfer` with `.catch()` error logging

**Independent Test**:
- Register a user -> Verify welcome email trigger logs / SMTP delivery without blocking response.
- Execute a transfer -> Verify debit alert sent to sender and credit alert sent to receiver.

---

## Phase 9: Polish, Postman Automated Test Suite & Deployment (Priority: P2)

**Purpose**: End-to-end testing, documentation, and production readiness.

- [x] T044 Create complete Postman collection JSON `postman/Banking-Backend-API.postman_collection.json` with pre-request scripts, environment variables, and tests
- [x] T045 Add health check endpoint `GET /health` in `src/routes/index.js`
- [x] T046 Configure CORS with credentials support and production cookie security in `src/app.js`
- [x] T047 Verify end-to-end flow execution and validate database documents in MongoDB Atlas
- [x] T048 Add npm scripts (`start`, `dev`) and verify clean process restart

---

## Dependencies & Execution Order

```
[Phase 1: Setup & Dependencies]
              │
              ▼
[Phase 2: Foundational Utilities & Error Middleware]
              │
              ▼
[Phase 3: US1 - User Model, Bcrypt & Auth Session]
              │
              ▼
[Phase 4: US2 - Account Model, 10-Digit Generator & Faucet Deposit]
              │
              ▼
[Phase 5: US3 - Double-Entry Ledger & Balance Aggregation Engine]
              │
              ▼
[Phase 6: US4 - ACID Transaction Transfers & Idempotency Engine] 🎯
              │
              ▼
[Phase 7: US5 - Token Blacklisting & Logout]
              │
              ▼
[Phase 8: US6 - Asynchronous Email Notifications]
              │
              ▼
[Phase 9: Postman Automated Test Suite & Production Hardening]
```
