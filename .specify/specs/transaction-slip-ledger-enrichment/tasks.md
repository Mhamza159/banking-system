---
description: "Task list for Standard Banking Slip & Ledger Counterparty Details Enrichment"
---

# Tasks: Standard Banking Slip & Ledger Counterparty Enrichment

**Input**: Design documents from `.specify/specs/transaction-slip-ledger-enrichment/`  
**Prerequisites**: `spec.md`, `plan.md`  
**Status**: 100% Complete & Verified 🏁  

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User Story mapping (`US1`, `US2`, `US3`)

---

## Phase 1: Foundational (Backend Data Pipeline & Deep Population) 🏁 COMPLETE

**Purpose**: Enrich backend controllers with deep user population and structured counterparty DTOs (`sender`, `receiver`) so all client consumers receive full legal names and account identifiers.

- [x] T001 [US1] Enrich `transfer` controller in `src/controllers/transaction.controller.js`:
  - Return structured `sender`: `{ accountNumber, accountHolderName, accountType, currency }`.
  - Return structured `receiver`: `{ accountNumber, accountHolderName, accountType, currency }`.
  - Retain top-level `senderAccount` and `receiverAccount` string numbers for 100% backward compatibility.
- [x] T002 [US1] Update idempotency duplicate check in `src/controllers/transaction.controller.js`:
  - When returning an existing transaction for a duplicate idempotency key, deeply populate `senderAccount.user` and `receiverAccount.user` so returned transaction payload includes `sender` and `receiver` DTOs.
- [x] T003 [US2] Update `getHistory` controller in `src/controllers/transaction.controller.js`:
  - Replace shallow population with deep population:
    - `senderAccount` -> `select: "accountNumber accountType currency user"`, `populate: { path: "user", select: "name email" }`.
    - `receiverAccount` -> `select: "accountNumber accountType currency user"`, `populate: { path: "user", select: "name email" }`.
- [x] T004 [US2] Update `getTransactionById` controller in `src/controllers/transaction.controller.js`:
  - Deeply populate `senderAccount.user` and `receiverAccount.user` (`select: "name email"`).
- [x] T005 [P] [US1] Create a backend verification test script `scripts/test-enriched-transactions.js`:
  - Test `/api/v1/transactions/history` to ensure `senderAccount.user.name` and `receiverAccount.user.name` are populated.
  - Test `/api/v1/transactions/:id` to confirm deep population.
  - Verify zero impact on transaction rollback or ledger journal balancing.

**Checkpoint**: Backend delivers complete dual-party identity data across all transaction endpoints (14/14 tests passed).

---

## Phase 2: User Story 1 - Instant Transfer Slip with Dual-Party Details (Priority: P1) 🏁 COMPLETE

**Goal**: Render an authentic commercial banking transfer receipt/slip upon payment completion showing Remitter (Sender Name + Account Number) and Beneficiary (Receiver Name + Account Number).

- [x] T006 [US1] Update `handleExecuteTransfer` in `client/src/pages/TransferPage.jsx`:
  - Ensure the `latestReceipt` payload includes normalized `sender` and `receiver` objects with `accountHolderName`, `accountNumber`, and `accountType` for both external and internal transfer modes.
- [x] T007 [US1] Redesign `client/src/components/banking/TransactionReceipt.jsx`:
  - Add prominent, structured dual-party section:
    - **Remitter Box**: Legal Full Name, Account Number (masked `•••• ${last4}`), Account Type Badge.
    - **Beneficiary Box**: Legal Full Name, Account Number (masked `•••• ${last4}`), Account Type Badge.
  - Display explicit "Transfer Fee: $0.00 (Zero Fee)" itemization.
  - Retain copyable Transaction ID and RFC4122 Idempotency Key with feedback toasts.
- [x] T008 [US1] Add internal transfer support in `TransactionReceipt.jsx`:
  - When sender and receiver belong to the same customer, display "Internal Account Transfer" badge with clear from/to account type distinctions.
- [x] T009 [US1] Add safe fallbacks in `TransactionReceipt.jsx`:
  - Fall back gracefully to `"Account Holder"` or `"Beneficiary"` if name properties are missing, preventing client render crashes.

**Checkpoint**: User Story 1 complete — every newly completed transfer produces a standard banking slip with both parties' names and accounts.

---

## Phase 3: User Story 2 - Enriched Counterparty Details in Ledger Journal & Audit Modal (Priority: P1) 🏁 COMPLETE

**Goal**: Transform the statement journal into a standard banking ledger where every entry reveals the counterparty's legal name, and clicking a row reveals full dual-party audit details.

- [x] T010 [US2] Update `getCounterparty` in `client/src/components/banking/TransactionTable.jsx`:
  - Inbound Credit: Set primary label to Sender Legal Name (`s?.user?.name || "External Remitter"`) and secondary subtitle to `•••• ${last4} · ${accountType}`.
  - Outbound Debit: Set primary label to Receiver Legal Name (`r?.user?.name || "Beneficiary"`) and secondary subtitle to `•••• ${last4} · ${accountType}`.
- [x] T011 [US2] Update `filteredTransactions` in `client/src/pages/TransactionsPage.jsx`:
  - Extend client-side search to match `tx.senderAccount?.user?.name` and `tx.receiverAccount?.user?.name`.
- [x] T012 [US2] Redesign `client/src/components/banking/TransactionDetailModal.jsx`:
  - Build two-column or structured Remitter vs Beneficiary audit section:
    - Debited Account: Full Legal Name, Account Number, Account Type, Currency.
    - Credited Account: Full Legal Name, Account Number, Account Type, Currency.
  - Maintain cryptographic audit details (Transaction ID, Idempotency Key, Timestamp, Settlement Badge).
- [x] T013 [US2] Ensure safe fallback rendering in `TransactionTable.jsx` and `TransactionDetailModal.jsx` for transactions with unpopulated user references.

**Checkpoint**: User Story 2 complete — ledger journal and deep audit inspection display full dual-party details with instant search filtering.

---

## Phase 4: User Story 3 - Institutional Printable Bank Transfer Slip / Voucher (Priority: P2) 🏁 COMPLETE

**Goal**: Provide an authentic, high-contrast commercial bank voucher layout when the user clicks "Print Receipt" from either the receipt modal or audit modal.

- [x] T014 [US3] Add print stylesheet rules in `client/src/index.css`:
  - Configure `@media print` rules:
    - Hide sidebar, navigation bars, modals backdrop darkness, close buttons, copy icons, and footer buttons (`no-print`).
    - Provide clean white background, high-contrast dark typography, crisp borders, and full-width container for printing.
- [x] T015 [US3] Add printable banking voucher header and styling in `client/src/components/banking/TransactionReceipt.jsx` and `client/src/components/banking/TransactionDetailModal.jsx`:
  - Add official institutional header ("ANTIGRAVITY CORE BANKING · SETTLEMENT ADVICE").
  - Format dual-party particulars table, financial breakdown, and formal disclaimer footer.

**Checkpoint**: Official bank payment advice slip can be cleanly printed or saved as PDF.

---

## Phase 5: Verification & Full-Stack Audit 🏁 COMPLETE

**Purpose**: Validate the entire implementation across backend API, frontend ledger, receipt modals, search, and printing without regressions.

- [x] T016 Execute backend test script (`node scripts/test-enriched-transactions.js`) and confirm all populated fields match expected contracts (14/14 passed).
- [x] T017 Run Vite production build (`npm --prefix client run build`) and regression test suite (`node scripts/verify-all.js` all 5 suites passed in 228.3s).
