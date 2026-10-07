# Phase 6 Plan: Atomic Money Transfer Flow & Idempotency Engine

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-06-transfer`  
**Goal**: Deliver a mission-critical atomic money transfer interface featuring real-time client balance validation, two-step confirmation review dialog, RFC 4122 UUID v4 `Idempotency-Key` injection, double-click lock protection, and verifiable proof-of-payment receipts.  
**Tasks Covered**: T043 through T046 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Financial transactions require strict integrity guarantees. A user transferring funds must never be double-debited due to network retries, connection drops, or rapid double-clicking. Phase 6 integrates:
1. **Source Account Selection & Balance Guard**: Select from owned accounts; transfer amount cannot exceed live available ledger balance ($Credits - Debits$).
2. **Transfer Destination Modes**:
   - **Between My Accounts**: Zero-friction transfer between owned Savings and Checking accounts (enforces `sender !== receiver`).
   - **To Another Customer**: Transfer using recipient 10-digit account number or Account ID.
3. **Two-Step Review Dialog (`TransferModal.jsx`)**: Displays clear settlement summary (Source, Destination, $0.00 Fee, Net Debit) before committing the transaction.
4. **Idempotency Protection**: Client generates an RFC 4122 UUID v4 string (`uuidv4()`) sent in the `Idempotency-Key` HTTP header.
5. **Double-Click Mitigation**: Disables submit triggers and activates loading spinners upon first dispatch.
6. **Auditable Receipt (`TransactionReceipt.jsx`)**: Displays transaction ID, idempotency key, timestamps, and print/download capability.

---

## Detailed Task Breakdown

### 1. Backend Enhancement for Recipient Resolution (`src/controllers/transaction.controller.js`)
- Ensure `transfer` accepts `receiverAccountId` as either a 24-character MongoDB ObjectId OR a 10-digit `accountNumber` string.
- If 10-digit account number is provided, automatically resolves `Account.findOne({ accountNumber })`.
- Preserves full ACID multi-document transaction and rollback safety.

### 2. Service Layer Verification (`client/src/services/transactionService.js`) (T043)
- Verify and enhance `transactionService.transfer({ senderAccountId, receiverAccountId, amountInCents, description }, idempotencyKey)`.
- Injects `Idempotency-Key` header into Axios request.

### 3. `client/src/components/banking/TransferModal.jsx` (T044)
- **Two-Step Confirmation Dialog**:
  - Built with accessible `<Modal>` primitive.
  - Summarizes transfer details:
    - **From**: Account type, masked number, and remaining balance after transfer.
    - **To**: Recipient account type/number.
    - **Transfer Amount**: Highlighted via `<MoneyDisplay size="lg" />`.
    - **Transfer Fee**: `$0.00` (highlighted in emerald as Free).
    - **Net Debit**: Total amount deducted.
    - **Description / Memo**.
  - Double-click protection: Locks confirm button with spinner upon dispatch.

### 4. `client/src/components/banking/TransactionReceipt.jsx` (T045)
- **Proof of Payment Dialog**:
  - Modal with emerald checkmark header: "Transfer Completed Successfully".
  - Copyable Transaction ID.
  - Idempotency Key reference.
  - Formatted amount and timestamps.
  - "Print Receipt" button triggering `window.print()` / formatted summary.
  - "Make Another Transfer" / "Return to Dashboard" action buttons.

### 5. `client/src/pages/TransferPage.jsx` (T046)
- **Transfer Cockpit**:
  - Source Account card/selector with live balance badge.
  - Destination Mode Toggle:
    - `Between My Accounts`: Shows other user-owned accounts (e.g. Checking $\leftrightarrow$ Savings).
    - `To Another Customer`: 10-digit recipient account number input.
  - Amount Input with quick preset buttons ($25, $50, $100, $250, "Max Balance").
  - Real-time balance guard (inline warning if amount > available balance, disabling review button).
  - Note / Memo input field.
  - "Review Transfer" button triggering `TransferModal`.
  - Seamless state synchronization with `BankingContext` upon completion.

---

## Verification Plan

### 1. Build Verification
- Execute `npm run build` in `client/` to verify zero compilation or JSX syntax errors.

### 2. Automated Integration Test Suite (`scripts/verify-frontend-phase6.js`)
- Validates presence and exports of `TransferModal`, `TransactionReceipt`, and `TransferPage`.
- Validates UUID v4 idempotency generation logic.
- Verifies production bundle build.

### 3. Live End-to-End Verification
- Log in to frontend.
- Deposit $200.00 into Savings account via Faucet.
- Navigate to `/transfer`.
- Select Savings as source and Checking as destination.
- Transfer $75.00 with review modal confirmation.
- Verify receipt modal appears with Transaction ID and UUID Idempotency-Key.
- Verify Savings balance reduces to $125.00 and Checking balance increases to $75.00.
- Verify re-submitting with identical key returns cached receipt without double-debit.
