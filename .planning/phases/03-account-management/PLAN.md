# Phase 3 Plan: Bank Account Management & Faucet Deposit

**Phase**: 03-account-management  
**Goal**: Provision a unique 10-digit bank account for every customer on registration, build endpoints to inspect accounts (`/accounts/me`), allow creating additional accounts (`POST /accounts`), and build the initial test deposit (faucet) endpoint structure.  
**Tasks Covered**: T017 through T022 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

In modern banking systems, customers hold one or more depository accounts. Each account is strictly decoupled from mutable balance columns (no `balance: Number` in the schema). This phase establishes the account lifecycle and automates account opening upon customer registration.

### 1. Account Mongoose Model (`src/models/account.model.js`)
- **Schema Fields**:
  - `user`: ObjectId, ref `"User"`, required, indexed.
  - `accountNumber`: String, required, unique, length 10, indexed. Generated via `crypto.randomInt` from `generator.js`.
  - `accountType`: String, enum `["SAVINGS", "CHECKING"]`, default `"SAVINGS"`.
  - `currency`: String, enum `["USD", "EUR", "PKR", "GBP"]`, default `"USD"`, uppercase.
  - `status`: String, enum from `src/constants/accountStatus.js` (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `FROZEN`), default `"ACTIVE"`, indexed.
  - `timestamps: true`, `versionKey: false`.
- **Compound Index**: `{ user: 1, accountType: 1 }` for fast account filtering per customer.
- **Architectural Guard**: Zero mutable `balance` field. Balances are calculated strictly via Ledger pipelines in Phase 4.

### 2. Auto-Provisioning on Registration (`src/controllers/auth.controller.js`)
- Inside `authController.register`:
  - After user creation, automatically generate a collision-resistant 10-digit account number.
  - Create the default `"SAVINGS"` account tied to `user._id`.
  - Pass the newly created account data to `sendTokenResponse` via `extraData`.
  - Return HTTP 201 Created with both user details and account details.

### 3. Account Controller (`src/controllers/account.controller.js`)
- `getMyAccounts`:
  - Protected endpoint (`GET /api/v1/accounts/me`).
  - Queries all accounts owned by `req.user._id`.
  - Returns array of account objects with status, currency, account type, and account number.
- `createAccount`:
  - Protected endpoint (`POST /api/v1/accounts`).
  - Accepts optional `{ accountType, currency }`.
  - Generates new 10-digit account number and saves account owned by `req.user._id`.
  - Returns HTTP 201 Created with new account details.
- `depositFaucet`:
  - Endpoint (`POST /api/v1/accounts/:accountId/deposit`).
  - Verifies account existence and active status.
  - Validates deposit amount (positive minor units / cents).
  - Returns successful deposit acknowledgment (in Phase 4, this integrates directly with the double-entry Ledger engine).

### 4. Account Routes & Mounting (`src/routes/account.routes.js`, `src/routes/index.js`)
- Protected by `authMiddleware`:
  - `GET /api/v1/accounts/me` -> `accountController.getMyAccounts`
  - `POST /api/v1/accounts` -> `accountController.createAccount`
  - `POST /api/v1/accounts/:accountId/deposit` -> `accountController.depositFaucet`
- Mounted under `/accounts` in `src/routes/index.js`.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T017** | Create `Account` Mongoose model with 10-digit number & status enum | `src/models/account.model.js` |
| **T018** | Integrate automatic default Savings Account provisioning inside `authController.register` | `src/controllers/auth.controller.js` |
| **T019** | Implement `getMyAccounts` (`GET /api/v1/accounts/me`) | `src/controllers/account.controller.js` |
| **T020** | Implement `createAccount` (`POST /api/v1/accounts`) | `src/controllers/account.controller.js` |
| **T021** | Implement `depositFaucet` (`POST /api/v1/accounts/:accountId/deposit`) | `src/controllers/account.controller.js` |
| **T022** | Create account routes & mount in `src/routes/index.js` | `src/routes/account.routes.js`<br/>`src/routes/index.js` |

---

## Verification Plan

### Automated Verification Script (`scripts/verify-phase3.js`)
1. **Auto-provisioning Verification**:
   - Register new user via `POST /api/v1/auth/register`.
   - Assert HTTP 201 and check that response includes `data.account.accountNumber` (length 10, status `ACTIVE`).
   - Query MongoDB directly: assert `Account` document exists with `user: user._id`.
2. **Fetch Customer Accounts (`GET /api/v1/accounts/me`)**:
   - Send authenticated request with cookie.
   - Assert HTTP 200 and assert accounts array contains the default account.
3. **Secondary Account Creation (`POST /api/v1/accounts`)**:
   - Send request to create a `"CHECKING"` account.
   - Assert HTTP 201, unique 10-digit number, and `accountType === "CHECKING"`.
   - Call `GET /api/v1/accounts/me`: assert user now owns 2 accounts.
4. **Deposit Faucet Validation (`POST /api/v1/accounts/:accountId/deposit`)**:
   - Send deposit request of $250.00 (25,000 cents).
   - Assert HTTP 200 response.
   - Send deposit with negative or invalid amount: assert HTTP 400 Bad Request.
5. **Unauthorized Access Protection**:
   - Call `GET /api/v1/accounts/me` without cookie: assert HTTP 401 Unauthorized.
