# Phase 4 Plan: Double-Entry Ledger & Balance Aggregation Engine

**Phase**: 04-ledger-balance  
**Goal**: Implement the append-only `Ledger` journal and compute real-time balances using MongoDB Aggregation Pipelines ($Credits - Debits$). Connect the Faucet deposit to create real `CREDIT` ledger entries and expose the Balance API.  
**Tasks Covered**: T023 through T027 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

In financial systems, balances are never stored as mutable numbers in account tables because concurrent writes, partial updates, and floating-point errors corrupt account states. Instead, this phase implements the **Double-Entry Bookkeeping Ledger**: an append-only journal of financial facts where an account's balance is dynamically derived via an efficient MongoDB Aggregation Pipeline.

### 1. Ledger Mongoose Model (`src/models/ledger.model.js`)
- **Schema Fields**:
  - `transactionId`: ObjectId, ref `"Transaction"`, optional (null for initial deposits/faucets), indexed.
  - `accountId`: ObjectId, ref `"Account"`, required, indexed.
  - `type`: String, enum `["DEBIT", "CREDIT"]`, required.
  - `amount`: Number, positive integer minor units (cents), required, min: 1, validated as integer.
  - `description`: String, trimmed.
  - `timestamps: { createdAt: true, updatedAt: false }` (Append-only! An immutable financial journal is never updated).
- **Compound Indexes**:
  - `{ accountId: 1, createdAt: -1 }` (for fast chronological statement queries).
  - `{ accountId: 1, type: 1, amount: 1 }` (for high-speed aggregation covering).

### 2. Domain Ledger Service (`src/services/ledger.service.js`)
- `getAccountBalance(accountId, session = null)`:
  - Executes MongoDB Aggregation Pipeline:
    1. `$match`: Scoped to `accountId`.
    2. `$group`: Computes `totalCredits` and `totalDebits` conditionally using `$cond` and `$sum`.
    3. `$project`: Derives `balanceInCents` = `$subtract: ["$totalCredits", "$totalDebits"]`.
  - Supports passing optional `session` for multi-document ACID transactions (used in Phase 5).
  - Returns `{ balanceInCents, totalCredits, totalDebits }`.
- `recordFaucetDeposit(accountId, amountInCents, description, session = null)`:
  - Validates positive minor-unit integer.
  - Inserts immutable `CREDIT` entry into `Ledger`.
  - Returns newly created ledger entry and updated derived balance.

### 3. Controller & Route Enhancements (`src/controllers/account.controller.js`, `src/routes/account.routes.js`)
- `getBalance` (`GET /api/v1/accounts/:accountId/balance`):
  - Protected by `authMiddleware`.
  - Validates account existence.
  - Enforces **Account Ownership**: `account.user.equals(req.user._id)` (rejects foreign access with `403 Forbidden`).
  - Calls `ledgerService.getAccountBalance`.
  - Formats minor units to human-readable currency string (`toDollars` / `formatCurrency`).
  - Returns HTTP 200 with `{ accountId, accountNumber, currency, balanceInCents, formattedBalance, status }`.
- Update `depositFaucet`:
  - Delegates to `ledgerService.recordFaucetDeposit` to create immutable journal entries on every faucet hit.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T023** | Create append-only `Ledger` Mongoose schema with `DEBIT`/`CREDIT` and compound index | `src/models/ledger.model.js` |
| **T024** | Implement `ledgerService.getAccountBalance` using MongoDB Aggregation Pipeline | `src/services/ledger.service.js` |
| **T025** | Implement `ledgerService.recordFaucetDeposit` and wire into `depositFaucet` | `src/services/ledger.service.js`<br/>`src/controllers/account.controller.js` |
| **T026** | Implement `accountController.getBalance` with ownership check | `src/controllers/account.controller.js` |
| **T027** | Expose `GET /api/v1/accounts/:accountId/balance` route | `src/routes/account.routes.js` |

---

## Verification Plan

### Automated Verification Script (`scripts/verify-phase4.js`)
1. **Zero-Balance on New Account**:
   - Register new user -> query balance -> assert `balanceInCents === 0` and `formattedBalance === "$0.00"`.
2. **Faucet Deposit -> Ledger Entry & Balance**:
   - Deposit $500.00 (50,000 cents) via faucet.
   - Assert `Ledger` contains a `CREDIT` entry of 50,000 cents.
   - Query `GET /api/v1/accounts/:accountId/balance` -> assert `balanceInCents === 50000` and `formattedBalance === "$500.00"`.
3. **Multiple Deposits Aggregation**:
   - Deposit additional $250.00 (25,000 cents).
   - Assert `balanceInCents === 75000` and `formattedBalance === "$750.00"`.
4. **Ownership Verification (Defense-in-Depth)**:
   - Register User B.
   - User B attempts to view User A's account balance:
   - Assert system returns `403 Forbidden` ("You do not have permission to access this account").
5. **Non-Existent Account**:
   - Query balance with random ObjectId -> assert `404 Not Found`.
