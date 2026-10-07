# Phase 9 Plan: Bank Transfer — Receiver Account Verification Flow

**Milestone**: 2.1 (Customer Transfer UX & Safety Hardening)  
**Phase**: `frontend-09-receiver-verification`  
**Goal**: Implement pre-flight recipient account verification for customer transfers, display verified legal holder name, enforce strict input-alteration state invalidation, update review modal/receipt, and preserve double-entry ACID idempotency.  
**Tasks Covered**: T001 through T020 from `.specify/specs/transfer-receiver-verification/tasks.md`  
**Source Documents**:
- Feature Specification: [`.specify/specs/transfer-receiver-verification/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/transfer-receiver-verification/spec.md)
- Architectural Plan: [`.specify/specs/transfer-receiver-verification/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/transfer-receiver-verification/plan.md)
- Actionable Tasks: [`.specify/specs/transfer-receiver-verification/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/transfer-receiver-verification/tasks.md)

---

## Technical Context & Scope

In high-stakes financial applications, sending money to an unverified or mistyped destination account number is a critical point of friction and potential loss. Phase 9 enhances the existing transfer workflow by decoupling recipient verification from monetary execution:
1. Customers verify the destination account number via a fast, read-only endpoint before entering the transfer amount.
2. The backend safely resolves the legal account holder's name (`User.name`) and verifies that the destination account is `ACTIVE`.
3. The UI presents a verified recipient confirmation card and unlocks the "Proceed to Amount" action.
4. If the customer edits the destination account field, the state machine immediately resets to `idle`, invalidating the previous verification and re-locking the proceed action.
5. The actual transfer executes exclusively through the existing `POST /api/v1/transactions/transfer` endpoint with RFC 4122 UUID v4 Idempotency Key deduplication and multi-document ACID ledger transactions.

---

## Detailed Task Breakdown

### 1. Foundational Backend API Endpoint (T001 - T003)
- **Controller Implementation** (`src/controllers/account.controller.js`):
  - Add `verifyRecipient` async handler.
  - Authenticate requesting customer using `authMiddleware`.
  - Validate `:accountNumber` parameter (10-digit string or 24-char ObjectId).
  - Query MongoDB: `Account.findOne({ accountNumber }).populate("user", "name")`.
  - If not found: return `404 Not Found` with message `"Recipient account not found"`.
  - If account belongs to requesting customer (`account.user._id.equals(req.user._id)`): return `400 Bad Request` with `"Cannot transfer funds to the same account"`.
  - If `account.status !== ACCOUNT_STATUS.ACTIVE`: return `400 Bad Request` with `"This account is currently unavailable for transfers"`.
  - Return safe recipient DTO:
    ```json
    {
      "account": {
        "accountNumber": account.accountNumber,
        "accountHolderName": account.user.name,
        "accountType": account.accountType,
        "currency": account.currency
      }
    }
    ```
- **Route Registration** (`src/routes/account.routes.js`):
  - Mount `router.get("/recipient/:accountNumber", verifyRecipient);`.
- **Standalone Test Script** (`scripts/test-verify-recipient.js`):
  - Programmatically test 200 (valid recipient), 400 (invalid format / self), 400 (inactive), and 404 (non-existent).

### 2. Frontend API Service & State Machine Integration (T004 - T008)
- **API Service** (`client/src/services/accountService.js`):
  - Add `verifyRecipient: async (accountNumber) => (await api.get(`/accounts/recipient/${accountNumber}`)).data`.
- **State Machine in `TransferPage.jsx`**:
  - `verificationStatus`: `'idle' | 'verifying' | 'verified' | 'error'`.
  - `verifiedRecipient`: `{ accountNumber, accountHolderName, accountType, currency } | null`.
  - `verificationError`: `string`.
  - `isVerifyingRef`: In-flight boolean lock to prevent duplicate concurrent network requests.
- **UI Components**:
  - Add "Verify Account" button alongside external account input with loading spinner.
  - Render emerald Verified Recipient Card with:
    - User icon / checkmark
    - Account Holder Name (`Muhammad Ali`)
    - Masked Account Number (`•••• 5350`)
    - Account Type badge
  - Lock "Proceed to Amount" button until `verificationStatus === 'verified'`.

### 3. Error Handling & Invalidation State Machine (T009 - T014)
- **Error Banners**:
  - 404: `❌ Recipient account not found. Please check the 10-digit number.`
  - 400 (Inactive): `❌ This account is currently unavailable for transfers.`
  - Self-Transfer: Client-side check before firing request: `You cannot transfer funds to the same account.`
- **Strict Input Invalidation**:
  - On any input change (typing, backspacing, pasting) in `externalAccountNumber`, if `verificationStatus !== 'idle'`, automatically reset `verificationStatus` to `'idle'`, clear `verifiedRecipient`, and lock Proceed.
  - Reset verification when switching between `internal` and `external` tabs or when changing the sender account.

### 4. Review Modal & Receipt Integration (T015 - T017)
- **Review Dialog (`TransferModal.jsx`)**:
  - Display verified account holder name alongside the masked account number.
- **Transaction Receipt (`TransactionReceipt.jsx`)**:
  - Display verified recipient legal name on the post-transfer receipt modal.
- **Authoritative Execution**:
  - `handleExecuteTransfer` passes the verified recipient account number to `transactionService.transfer` with UUID v4 idempotency key.

### 5. Build Verification & Automated Testing (T018 - T020)
- Run `npm run build` in `client/` to ensure zero Vite compilation errors.
- Run comprehensive Playwright MCP test suite covering all 7 test cases:
  1. Valid account verification and legal name display.
  2. Non-existent account (404) rejection.
  3. Inactive/frozen account (400) rejection.
  4. Same sender and receiver account rejection.
  5. Keystroke alteration immediate invalidation.
  6. Rapid double-click verification suppression.
  7. Full end-to-end transfer execution and receipt confirmation.

---

## Verification Plan

### 1. Automated Backend Verification (`scripts/test-verify-recipient.js`)
- Executes HTTP assertions directly against the running API on port 3000 to verify 200, 400, and 404 status codes.

### 2. Frontend Production Bundle Build
- Run `npm run build` in `client/`.

### 3. Playwright E2E Test Suite
- Run browser subagent / Playwright assertions on `http://localhost:5173/transfer` to verify live user interaction, modal display, and ledger updates.
