# Implementation Plan: Complete Production-Grade Banking Backend API

**Branch**: `feature/banking-backend-api` | **Date**: 2026-09-14 | **Spec**: [`.specify/specs/banking-backend-api/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-backend-api/spec.md)

**Input**: Feature specification from `.specify/specs/banking-backend-api/spec.md`

---

## 1. Summary

This plan defines the concrete architectural blueprint and execution strategy for building the **Banking Backend API**. 

The technical approach centers on:
1. **Double-Entry Ledger Accounting**: An immutable, append-only `Ledger` collection representing all monetary movements with balanced debits and credits ($Debit = Credit$). No mutable balance column is stored on the `Account` document.
2. **Dynamic Balance Derivation**: Real-time balance queries using a specialized MongoDB Aggregation Pipeline (`Credits - Debits`).
3. **Distributed ACID Atomicity**: Orchestrating transfer creation, sender balance validation, debit/credit ledger writes, and status progression within a single MongoDB session transaction (`session.startTransaction()`), guaranteeing zero data corruption under failure.
4. **Idempotency Engine**: Preventing duplicate billing and transfer replays via unique index enforcement on `Transaction.idempotencyKey` combined with in-flight lock detection (`409 Conflict`).
5. **Defense-in-Depth Authentication**: Bcrypt password hashing (10 salt rounds), JWT authentication stored in HTTP-only SameSite cookies, and real-time server-side token revocation via a MongoDB TTL-indexed `Blacklist` collection.
6. **Decoupled Asynchronous Email Service**: Centralized Nodemailer service delivering registration welcome emails and transaction alerts without blocking the Node.js event loop or tying financial transactions to SMTP latency.

---

## 2. Technical Context

- **Runtime / Language**: Node.js (v20+), JavaScript (CommonJS / Node ES)
- **Primary Framework**: Express.js (v5.x)
- **Database & ODM**: MongoDB Atlas (Replica Set enabled for multi-document ACID transactions), Mongoose (v9.x)
- **Security & Authentication**:
  - `bcrypt` (v5.x) / `bcryptjs` for salted password hashing
  - `jsonwebtoken` (v9.x) for stateless token authentication
  - `cookie-parser` (v1.x) for HTTP-only cookie transport
- **Communication & Mailing**: `nodemailer` (v6.x) via SMTP
- **Utilities**: `uuid` (v9.x/v10.x) for idempotency key validation
- **Testing**: Postman API Collection with automated environment variables and assertion test scripts
- **Target Platform**: Production-ready cloud server (Linux / Node runtime / Render / Railway / AWS / PM2 / Docker)
- **Performance & Consistency Constraints**:
  - Financial consistency: Strict serializability/ACID atomicity for money movement.
  - Sub-150ms p95 latency for balance queries and transfers.
  - Zero floating-point operations on monetary values (all stored as 64-bit integer cents/minor units).

---

## 3. Constitution & Engineering Principles Check

| Principle | Gate Status | Architecture Guarantee |
|---|---|---|
| **I. Financial Invariant (Zero-Sum Ledger)** | **PASS** | Every transaction creates exactly 2 ledger entries: 1 `DEBIT` and 1 `CREDIT`. $\sum Debits = \sum Credits$. |
| **II. Immutable Ledger (No Direct Mutates)** | **PASS** | `Account` documents contain NO `balance` counter. Balance is derived dynamically via aggregation over ledger records. |
| **III. Atomicity or Nothing (ACID)** | **PASS** | Transfers run in `session.startTransaction()`. If any check fails, `session.abortTransaction()` runs. |
| **IV. Idempotent Execution** | **PASS** | All transfers require `Idempotency-Key` header with database-enforced unique indexing. |
| **V. Stateless Tokens with Revocation** | **PASS** | Logout immediately blacklists JWT in MongoDB with a native TTL index matching token expiration. |
| **VI. Non-Blocking Async Side-Effects** | **PASS** | Email alerts run in background catch blocks; SMTP network issues never roll back financial transactions. |

---

## 4. Project Structure & Source Code Layout

```text
banking-system/
├── .env                             # Environment secrets (PORT, MONGO_URI, JWT_SECRET, etc.)
├── .env.example                     # Environment template for team & production
├── .gitignore
├── package.json
├── server.js                        # Bootstrapper (DB connect -> app.listen)
├── .specify/
│   └── specs/
│       └── banking-backend-api/
│           ├── spec.md              # Approved Feature Specification
│           ├── plan.md              # Architectural Implementation Plan (This File)
│           └── tasks.md             # Actionable Micro-Tasks Checklist
└── src/
    ├── app.js                       # Express app configuration & middleware pipeline
    ├── config/
    │   ├── db.js                    # Mongoose connection & public DNS resolvers (8.8.8.8)
    │   └── email.js                 # Nodemailer SMTP transport setup
    ├── constants/
    │   ├── accountStatus.js         # ACTIVE, INACTIVE, SUSPENDED, FROZEN
    │   ├── roles.js                 # CUSTOMER, ADMIN
    │   └── transactionStatus.js     # PENDING, COMPLETED, FAILED
    ├── controllers/
    │   ├── account.controller.js    # Account creation, details, balance, faucet deposit
    │   ├── auth.controller.js       # Register, login, logout, me profile
    │   └── transaction.controller.js# Transfers, history, status
    ├── middleware/
    │   ├── auth.middleware.js       # JWT & Blacklist validation
    │   ├── error.middleware.js      # Global unhandled error boundary
    │   └── validate.middleware.js   # Request body, header, & param validation
    ├── models/
    │   ├── account.model.js         # Bank Account schema
    │   ├── blacklist.model.js       # Revoked JWT schema with TTL index
    │   ├── ledger.model.js          # Double-entry ledger journal schema
    │   ├── transaction.model.js     # Transaction lifecycle & idempotency schema
    │   └── user.model.js            # User credentials & profile schema
    ├── routes/
    │   ├── account.routes.js        # /api/v1/accounts
    │   ├── auth.routes.js           # /api/v1/auth
    │   ├── index.js                 # Root router mounting all API modules
    │   └── transaction.routes.js    # /api/v1/transactions
    ├── services/
    │   ├── email.service.js         # Non-blocking async email notifications
    │   └── ledger.service.js        # Double-entry ledger calculation & aggregation
    └── utils/
        ├── apiError.js              # Standard custom Error class with HTTP codes
        ├── apiResponse.js           # Standard JSON response builder
        ├── currency.js              # Cents <-> Dollars conversion utilities
        └── generator.js             # Collision-free 10-digit account number generator
```

---

## 5. Architectural Blueprints by Subsystem

### Subsystem 1: Database & Data Models

#### 1. `User` Schema (`src/models/user.model.js`)
- **Fields**:
  - `name`: `String`, required, trim, min: 2, max: 100.
  - `email`: `String`, required, unique, lowercase, trim, match: RFC 5322 regex, indexed.
  - `password`: `String`, required, min: 8, `select: false`.
  - `role`: `String`, enum: `["CUSTOMER", "ADMIN"]`, default: `"CUSTOMER"`.
  - `isEmailVerified`: `Boolean`, default: `false`.
- **Mongoose Middleware**: `pre('save')` hashes password using `bcrypt.hash(pwd, 10)` if modified.
- **Methods**: `comparePassword(candidatePassword)` returns `Promise<boolean>`.

#### 2. `Account` Schema (`src/models/account.model.js`)
- **Fields**:
  - `user`: `ObjectId`, ref: `'User'`, required, indexed.
  - `accountNumber`: `String`, required, unique, length: 10, indexed.
  - `accountType`: `String`, enum: `["SAVINGS", "CHECKING"]`, default: `"SAVINGS"`.
  - `currency`: `String`, enum: `["USD", "EUR", "PKR", "GBP"]`, default: `"USD"`.
  - `status`: `String`, enum: `["ACTIVE", "INACTIVE", "SUSPENDED", "FROZEN"]`, default: `"ACTIVE"`, indexed.
- **Indexes**: `{ accountNumber: 1 }` (unique), `{ user: 1, accountType: 1 }`.

#### 3. `Transaction` Schema (`src/models/transaction.model.js`)
- **Fields**:
  - `idempotencyKey`: `String`, required, unique, indexed, trim.
  - `senderAccount`: `ObjectId`, ref: `'Account'`, required, indexed.
  - `receiverAccount`: `ObjectId`, ref: `'Account'`, required, indexed.
  - `amount`: `Number` (Integer cents, min: 1), required.
  - `currency`: `String`, default: `"USD"`.
  - `status`: `String`, enum: `["PENDING", "COMPLETED", "FAILED"]`, default: `"PENDING"`, indexed.
  - `failureReason`: `String`, default: `null`.
  - `note`: `String`, maxlength: 255.
- **Indexes**: `{ idempotencyKey: 1 }` (unique), `{ senderAccount: 1, createdAt: -1 }`, `{ receiverAccount: 1, createdAt: -1 }`.

#### 4. `Ledger` Schema (`src/models/ledger.model.js`)
- **Fields**:
  - `transactionId`: `ObjectId`, ref: `'Transaction'`, required, indexed.
  - `accountId`: `ObjectId`, ref: `'Account'`, required, indexed.
  - `type`: `String`, enum: `["DEBIT", "CREDIT"]`, required.
  - `amount`: `Number` (Integer cents, min: 1), required.
  - `description`: `String`, trim.
  - `createdAt`: `Date`, immutable.
- **Indexes**: `{ accountId: 1, createdAt: -1 }`, `{ transactionId: 1 }`, `{ accountId: 1, type: 1, amount: 1 }`.

#### 5. `Blacklist` Schema (`src/models/blacklist.model.js`)
- **Fields**:
  - `token`: `String`, required, unique, indexed.
  - `expiresAt`: `Date`, required, indexed with `{ expires: 0 }` (MongoDB TTL index).

---

### Subsystem 2: Financial Engine & Transaction Pipeline

```
Client Transfer Request (POST /transactions)
  │
  ├──► [Validate Headers & Payload]
  │      - Idempotency-Key present & UUID format
  │      - receiverAccountNumber valid format
  │      - amountInCents is positive integer >= 1
  │
  ├──► [Check Idempotency Cache]
  │      - Query Transaction.findOne({ idempotencyKey })
  │      - If COMPLETED -> return cached receipt (200 OK)
  │      - If PENDING -> return 409 Conflict (in-flight processing)
  │
  ├──► [Account Status & Self-Transfer Verification]
  │      - Check sender account owned by req.user and status === 'ACTIVE'
  │      - Check receiver account exists and status === 'ACTIVE'
  │      - Assert senderAccount._id !== receiverAccount._id
  │
  ├──► [Execute ACID Transaction Session]
  │      - session = await mongoose.startSession()
  │      - session.startTransaction()
  │      - Available Balance = await ledgerService.getBalance(senderAccountId, session)
  │      - If Balance < amountInCents:
  │          - abortTransaction()
  │          - return 400 Bad Request (INSUFFICIENT_FUNDS)
  │      - Create Transaction (status: PENDING)
  │      - Insert Ledger Entry 1: DEBIT (senderAccount, amountInCents)
  │      - Insert Ledger Entry 2: CREDIT (receiverAccount, amountInCents)
  │      - Update Transaction (status: COMPLETED)
  │      - commitTransaction()
  │      - session.endSession()
  │
  └──► [Post-Commit Asynchronous Tasks]
         - Trigger emailService.sendDebitAlert(senderUser, txDetails)
         - Trigger emailService.sendCreditAlert(receiverUser, txDetails)
         - Return 201 Created with transfer receipt
```

---

### Subsystem 3: Authentication & Security Flow

1. **Password Policy**:
   - Minimum 8 characters.
   - Requires uppercase, lowercase, digit, and special symbol.
   - Salted with bcrypt (10 rounds). Plaintext never stored or logged.
2. **JWT Issuance**:
   - Payload: `{ userId: user._id, role: user.role }`.
   - Signed using `process.env.JWT_SECRET`, algorithm: `HS256`, expires in `24h`.
   - Dispatched via HTTP-Only, Secure, SameSite: Strict cookie:
     ```javascript
     res.cookie("token", token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: "strict",
       maxAge: 24 * 60 * 60 * 1000
     });
     ```
3. **Authentication Middleware (`authMiddleware`)**:
   - Reads token from `req.cookies.token` or `Authorization: Bearer <token>`.
   - Checks if token string is in `Blacklist` collection. If yes $\rightarrow$ `401 Unauthorized`.
   - Verifies signature and expiration via `jwt.verify`.
   - Queries `User.findById(decoded.userId)`. If not found $\rightarrow$ `401 Unauthorized`.
   - Attaches verified user document to `req.user`.
4. **Logout & Revocation**:
   - Extracts current token.
   - Calculates expiration date from JWT `exp` claim.
   - Inserts record into `Blacklist` collection (`{ token, expiresAt }`).
   - Clears cookie on response.

---

### Subsystem 4: Asynchronous Email Engine (Nodemailer)

1. **SMTP Configuration (`src/config/email.js`)**:
   - Configures `nodemailer.createTransport` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
   - Supports testing transports (e.g. Ethereal / Gmail / Mailtrap).
2. **Service Functions (`src/services/email.service.js`)**:
   - `sendWelcomeEmail(user, account)`: Welcome message with new 10-digit account number.
   - `sendDebitAlert(user, transaction, newBalance)`: Debit confirmation with transaction ref.
   - `sendCreditAlert(user, transaction, newBalance)`: Credit notification for recipient.
3. **Resilience**:
   - Every email call is wrapped in a non-blocking asynchronous block.
   - Email failure logs an error to stderr but **never throws into the HTTP pipeline** or rolls back committed database transactions.

---

### Subsystem 5: REST API Route Blueprint

| Method | Endpoint | Handler | Access | Key Validations |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | `authController.register` | Public | Email regex, password complexity, unique check |
| `POST` | `/api/v1/auth/login` | `authController.login` | Public | Email & password present, constant-time compare |
| `POST` | `/api/v1/auth/logout` | `authController.logout` | Authenticated | Token blacklisting & cookie clearance |
| `GET` | `/api/v1/auth/me` | `authController.getProfile` | Authenticated | Return sanitized caller user profile |
| `POST` | `/api/v1/accounts` | `accountController.createAccount` | Authenticated | Currency & accountType valid |
| `GET` | `/api/v1/accounts/me` | `accountController.getMyAccounts` | Authenticated | Scoped to `req.user._id` |
| `GET` | `/api/v1/accounts/:accountId/balance` | `accountController.getBalance` | Authenticated | Account ownership check, derived balance |
| `POST` | `/api/v1/accounts/:accountId/deposit` | `accountController.depositFaucet` | Authenticated | Positive integer amount, double-entry faucet |
| `POST` | `/api/v1/transactions` | `transactionController.transfer` | Authenticated | Idempotency key, account statuses, balance check |
| `GET` | `/api/v1/transactions/history` | `transactionController.getHistory` | Authenticated | Pagination, ledger entries for user's accounts |
| `GET` | `/api/v1/transactions/:id` | `transactionController.getTransactionById`| Authenticated | Scoped to sender/receiver account ownership |

---

## 6. Required Dependencies & Installation Plan

The following production dependencies must be installed in Phase 1:
```bash
npm install bcrypt jsonwebtoken cookie-parser nodemailer uuid
```
- `bcrypt`: Native salted password hashing.
- `jsonwebtoken`: Token generation, signing, and verification.
- `cookie-parser`: Middleware to read signed/unsigned cookies from request headers.
- `nodemailer`: SMTP email transport.
- `uuid`: Generating and validating RFC 4122 v4 UUIDs for idempotency keys.

---

## 7. Phased Implementation Strategy

- **Phase 1: Architecture Foundation & Utilities**
  - Install dependencies (`bcrypt`, `jsonwebtoken`, `cookie-parser`, `nodemailer`, `uuid`).
  - Configure `app.js` with `express.json()`, `cookie-parser()`, global headers.
  - Implement `ApiError`, `ApiResponse`, and global `error.middleware.js`.
  - Implement utility helpers: `currency.js` (cents $\leftrightarrow$ dollars), `generator.js` (account number generator).
- **Phase 2: Authentication Subsystem & Security**
  - Create `User` model with regex validation, `pre('save')` bcrypt hashing, and `comparePassword`.
  - Create `Blacklist` model with MongoDB TTL index on `expiresAt`.
  - Implement `auth.controller.js` (register, login, logout, me).
  - Implement `auth.middleware.js` with token extraction and blacklist verification.
  - Mount `/api/v1/auth` routes.
- **Phase 3: Bank Account Subsystem & Initial Faucet Deposit**
  - Create `Account` model with 10-digit number generator and status tracking.
  - Integrate auto-provisioning of default Savings Account upon user registration.
  - Implement `account.controller.js` (create account, list accounts, faucet deposit).
  - Mount `/api/v1/accounts` routes.
- **Phase 4: Double-Entry Ledger & Balance Aggregation Engine**
  - Create `Ledger` model with strict positive integer amounts, `DEBIT` / `CREDIT` enums, and compound indexing.
  - Implement `ledger.service.js` with MongoDB Aggregation Pipeline for balance derivation.
  - Connect faucet deposit to create balancing ledger entries.
  - Implement `GET /api/v1/accounts/:accountId/balance`.
- **Phase 5: ACID Transaction Engine & Idempotency**
  - Create `Transaction` model with `idempotencyKey` unique index and `PENDING`/`COMPLETED`/`FAILED` status lifecycle.
  - Implement transaction orchestration inside `mongoose.startSession()` with ACID boundaries.
  - Implement idempotency cache check and in-flight collision protection (`409 Conflict`).
  - Mount `/api/v1/transactions` routes.
- **Phase 6: Nodemailer Integration, Automated Postman Testing & Hardening**
  - Configure `src/config/email.js` and implement `email.service.js`.
  - Connect async welcome emails and transaction debit/credit alerts.
  - Create and run Postman test collection covering all positive and negative test cases.
  - Production readiness audit (environment validation, error sanitization).

---

## 8. Verification & Acceptance Criteria

1. **Security Verification**:
   - Plaintext passwords never appear in the database; bcrypt hash verified with cost factor 10.
   - JWT tokens delivered only in `HttpOnly; SameSite=Strict` cookies.
   - Logged-out tokens immediately return `401 Unauthorized` due to Blacklist TTL record.
2. **Double-Entry Financial Verification**:
   - For every transfer of $X$, exactly one $X$ `DEBIT` and one $X$ `CREDIT` are inserted into `Ledger`.
   - The sum of all ledger entries for every transaction equals zero.
   - Real-time balance matches `Credits - Debits` at all times.
3. **Idempotency Verification**:
   - Replaying the same transfer request with the identical `Idempotency-Key` does NOT execute a second transfer or reduce balance again.
   - Concurrent requests with identical key return `409 Conflict`.
4. **ACID Rollback Verification**:
   - Simulating an error during transfer (e.g. insufficient balance or receiver account freeze) leaves database state completely untouched with zero orphaned ledger entries.
