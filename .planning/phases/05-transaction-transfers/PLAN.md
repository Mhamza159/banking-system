# Phase 5 Plan: ACID Transaction Transfers & Idempotency Engine

**Phase**: 05-transaction-transfers  
**Goal**: Execute atomic money transfers between accounts with duplicate-prevention idempotency and full rollback safety using MongoDB multi-document ACID transactions.  
**Tasks Covered**: T028 through T034 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

In a banking system, money transfer is the most critical operation:
1. **Atomicity & Rollback Safety**: Money must never be deducted from the sender without simultaneously being credited to the receiver. We use MongoDB multi-document transactions (`mongoose.startSession()`, `session.startTransaction()`, `session.commitTransaction()`, `session.abortTransaction()`).
2. **Idempotency**: Network hiccups often cause mobile apps or web clients to retry requests. If a user clicks "Transfer" twice or retries a timed-out request, money must NOT be deducted twice. We use an `Idempotency-Key` header with a unique index in the `Transaction` model:
   - If the key exists with status `COMPLETED`, return the cached receipt (`200 OK`) without re-transferring funds.
   - If the key exists with status `PENDING`, reject with `409 Conflict` to prevent in-flight concurrent execution.
3. **Double-Entry Journaling**:
   - A single transfer generates:
     - 1 `Transaction` audit record.
     - 1 sender `DEBIT` entry in `Ledger`.
     - 1 receiver `CREDIT` entry in `Ledger`.
4. **Validation Rules**:
   - Sender and receiver must not be the same account (`self-transfer` rejected).
   - Sender must have sufficient derived balance (`balance >= amountInCents`).
   - Both accounts must have `status: ACTIVE`.
   - Currencies must match (e.g., USD to USD).
   - Sender must own the source account.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T028** | Create `Transaction` schema with `idempotencyKey` unique index, status enum (`PENDING`, `COMPLETED`, `FAILED`), and minor units | `src/models/transaction.model.js` |
| **T029** | Implement idempotency detection logic (cached 200 OK vs in-flight 409 Conflict) | `src/controllers/transaction.controller.js` |
| **T030** | Validate sender and receiver account status (`ACTIVE`) and ownership | `src/controllers/transaction.controller.js` |
| **T031** | Implement self-transfer prevention check (`senderAccount._id !== receiverAccount._id`) | `src/controllers/transaction.controller.js` |
| **T032** | Implement atomic transfer orchestration with `mongoose.startSession()` and Double-Entry ledger journal records | `src/controllers/transaction.controller.js` |
| **T033** | Implement `getHistory` and `getTransactionById` endpoints with ownership verification | `src/controllers/transaction.controller.js` |
| **T034** | Create transaction routes and mount under `/api/v1/transactions` in `src/routes/index.js` | `src/routes/transaction.routes.js`<br/>`src/routes/index.js` |

---

## Verification Plan

### Automated Verification Script (`scripts/verify-phase5.js`)
1. **Normal Transfer**:
   - User A deposits $500.00.
   - User A transfers $100.00 to User B with `Idempotency-Key: key-001`.
   - Assert HTTP 201 Created.
   - Assert User A balance is $400.00 and User B balance is $100.00.
   - Assert Ledger has 1 DEBIT and 1 CREDIT for this `transactionId`.
2. **Idempotency Deduplication**:
   - Re-send exact same transfer request with `Idempotency-Key: key-001`.
   - Assert HTTP 200 OK (cached response).
   - Assert balances remain unchanged (User A: $400.00, User B: $100.00).
   - Assert no extra ledger entries created.
3. **Insufficient Funds**:
   - User A attempts to transfer $1,000.00 (only has $400.00).
   - Assert HTTP 400 Bad Request ("Insufficient funds").
   - Assert zero ledger modifications.
4. **Self-Transfer Prevention**:
   - User A attempts to transfer to their own account.
   - Assert HTTP 400 Bad Request ("Cannot transfer to the same account").
5. **Frozen / Inactive Account**:
   - Transfer with inactive account -> Assert HTTP 400 Bad Request.
6. **Missing Idempotency-Key**:
   - Request without header -> Assert HTTP 400 Bad Request.
7. **Cross-Account Transaction History**:
   - User A views history -> sees transfer as DEBIT.
   - User B views history -> sees transfer as CREDIT.
