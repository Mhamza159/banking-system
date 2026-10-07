# Phase 13 Plan: Server-Side Transfer Authorization Gates & Brute-Force Lockout

**Milestone**: 3 (Profile Security Settings, Transfer Limits & Transaction TPIN Controls)  
**Phase**: `13-transfer-authorization-gates`  
**Goal**: Integrate server-authoritative security gates into `POST /api/v1/transactions/transfer` prior to database session initiation, enforcing 4-digit cryptographic TPIN verification with anti-brute-force lockout and real-time velocity limits for both sender and receiver.  
**Tasks Covered**: T005 and T007 from [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)  
**Source Documents**:
- Feature Specification: [`.specify/specs/profile-settings-limits-tpin/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/spec.md)
- Architectural Plan: [`.specify/specs/profile-settings-limits-tpin/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/plan.md)
- Actionable Tasks: [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)

---

## Technical Scope & Architecture

In institutional core banking, transactions must pass non-negotiable authorization and risk-limit gates BEFORE any ACID database mutations or ledger modifications begin:

```
[Inbound POST /transactions/transfer]
                  │
                  ▼
  [Idempotency-Key Deduplication]
                  │
                  ▼
   [Account & Currency Validation]
                  │
                  ▼
 ┌───────────────────────────────────┐
 │ GATE 1: TPIN Authorization        │
 │ - Format Validation (/^\d{4}$/)   │
 │ - Check if TPIN configured        │
 │ - Check Lockout (isTpinLocked)    │
 │ - Constant-time bcrypt compare    │
 │ - Failed counter + 15m Lockout    │
 └─────────────────┬─────────────────┘
                   │
                   ▼
 ┌───────────────────────────────────┐
 │ GATE 2: Velocity Limit Engine     │
 │ - validateTransferLimits (Sender) │
 │ - validateReceivingLimits (Rcvr)  │
 │ - Daily / Weekly / Yearly windows │
 └─────────────────┬─────────────────┘
                   │
                   ▼
  [MongoDB ACID Session Begins]
  - Balance derivation ($Credits - $Debits)
  - Create Transaction record (PENDING)
  - Write Debit & Credit Ledger entries
  - Commit Transaction (COMPLETED)
```

### Critical Security Invariants:
1. **Pre-Session Gate Execution**: Both Gate 1 (TPIN) and Gate 2 (Velocity) execute strictly **before** `mongoose.startSession()` and `session.startTransaction()`. On any failure, zero database mutations occur: no transaction documents are created, no ledger entries are written, and balances remain untouched.
2. **Anti-Brute-Force Lockout**: 5 consecutive invalid TPIN submissions automatically trigger a 15-minute lockout (`tpinLockedUntil = Date.now() + 15m`). Subsequent attempts during lockout return `403 Forbidden`.
3. **Counterparty Risk Containment**: If the beneficiary has exhausted their inbound velocity limits, the remitter's transfer is rejected with `400 Bad Request` before funds leave the remitter's account.

---

## Deliverables Breakdown

### 1. Transfer Handler Gate Integration (`src/controllers/transaction.controller.js`) [Tasks T005, T007]
- Enhance `transfer` handler in `src/controllers/transaction.controller.js` prior to starting the session:
  - **Gate 1: TPIN Authorization**:
    - Fetch `senderUser` with `.select("+tpin")`.
    - If user has a configured TPIN (`senderUser.tpin || senderUser.isTpinSet`) or request includes `tpin`:
      - Verify `req.body.tpin` is exactly 4 numeric digits.
      - If user has no TPIN configured, reject with `400 Bad Request`.
      - If `senderUser.isTpinLocked()`, reject with `403 Forbidden` citing remaining lockout time.
      - Verify `await senderUser.compareTpin(tpin)`.
      - On mismatch: increment `senderUser.tpinFailedAttempts`, trigger lockout if $\ge 5$, save, throw `401 Unauthorized` with remaining attempts.
      - On success: reset `senderUser.tpinFailedAttempts = 0` and `senderUser.tpinLockedUntil = null`, save if previously nonzero.
  - **Gate 2: Velocity Limits Validation**:
    - Call `await velocityService.validateTransferLimits(senderUser, [sender._id], amountInCents)`.
    - Call `await velocityService.validateReceivingLimits(receiver.user, receiver._id, amountInCents)`.
    - Throws `ApiError.badRequest` on any period limit exhaustion (Daily, Weekly, Yearly) or amount below floor.

### 2. Automated Verification Suite (`scripts/test-phase13-transfer-gates.js`)
Comprehensive test script verifying:
1. Transfer with valid TPIN succeeds atomically (201 Created).
2. Transfer with incorrect TPIN rejected with 401 Unauthorized, incrementing failed counter, with 0 ledger writes.
3. 5 consecutive wrong TPIN submissions trigger 15-minute lockout (403 Forbidden).
4. Outbound transfer while locked is blocked immediately with 403 Forbidden.
5. Successful transfer resets failed attempts counter to 0.
6. Transfer with amount exceeding sender's daily limit rejected with 400 Bad Request with 0 ledger writes.
7. Transfer with amount exceeding receiver's daily receiving limit rejected with 400 Bad Request with 0 ledger writes.
8. Full system regression check (`scripts/verify-all.js`).

---

## Verification Plan

1. **Phase 13 Test Suite**: Run `node scripts/test-phase13-transfer-gates.js` verifying all gate checks, lockout transitions, and limit breaches.
2. **Regression Verification**: Run `node scripts/verify-all.js` to ensure all 5 existing backend test suites continue passing with zero regressions.
