---
description: "Task list for Bank Transfer Receiver Account Verification Flow"
---

# Tasks: Bank Transfer — Receiver Account Verification Flow

**Input**: Design documents from `.specify/specs/transfer-receiver-verification/`  
**Prerequisites**: `spec.md`, `plan.md`  
**Status**: 100% Implemented & Verified 🏁

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: User Story mapping (`US1`, `US2`, `US3`, `US4`)

---

## Phase 1: Foundational (Backend Recipient Verification Endpoint)

**Purpose**: Create the authenticated, read-only recipient verification API endpoint required by all frontend user journeys.

- [x] T001 [US1] Implement `verifyRecipient` controller method in `src/controllers/account.controller.js`:
  - Authenticate requesting customer.
  - Validate 10-digit numeric format (or valid ObjectId).
  - Find account and populate `user` with only `name`.
  - Enforce `account.status === 'ACTIVE'`.
  - Disallow self-transfer (if account belongs to requesting customer).
  - Return minimal safe DTO: `{ accountNumber, accountHolderName, accountType, currency }`.
- [x] T002 [US1] Mount `router.get("/recipient/:accountNumber", verifyRecipient)` in `src/routes/account.routes.js`.
- [x] T003 [P] [US1] Create a standalone backend verification script (`scripts/test-verify-recipient.js`) to validate 200, 400, and 404 responses without affecting production database.

**Checkpoint**: Backend verification endpoint ready, tested, and responding with safe metadata.

---

## Phase 2: User Story 1 - Recipient Verification & Name Confirmation (Priority: P1) 🎯 MVP

**Goal**: Allow customers to verify destination account numbers and display the verified legal holder name before entering the amount.

**Independent Test**: Navigate to `/transfer`, switch to External Transfer, enter a valid 10-digit account number, click "Verify Account", observe the loading state, and verify that the holder name (e.g. "Muhammad Ali") and masked account number (`•••• 5350`) render on a verified card while unlocking "Proceed to Amount".

### Implementation for User Story 1

- [x] T004 [US1] Add `verifyRecipient(accountNumber)` method in `client/src/services/accountService.js` calling `GET /accounts/recipient/${accountNumber}`.
- [x] T005 [US1] Implement verification state machine (`idle` | `verifying` | `verified` | `error`) and `verifiedRecipient` state in `client/src/pages/TransferPage.jsx`.
- [x] T006 [US1] Add "Verify Account" action button with loading spinner, disabled state during active requests, and duplicate-submission lock in `client/src/pages/TransferPage.jsx`.
- [x] T007 [US1] Create and render the Verified Recipient Card in `client/src/pages/TransferPage.jsx` displaying:
  - Account Holder Legal Name
  - Masked Account Number (`•••• ${last4}`)
  - Account Type Badge (`SAVINGS` / `CHECKING`)
  - "Verified Account" indicator badge with green checkmark.
- [x] T008 [US1] Condition the "Proceed to Amount" button to remain disabled until `verificationStatus === 'verified'` for external transfers.

**Checkpoint**: User Story 1 fully functional — valid account can be verified and holder name is clearly displayed.

---

## Phase 3: User Story 2 - Invalid, Inactive, & Self-Account Rejection (Priority: P1)

**Goal**: Prevent customer errors by cleanly rejecting invalid, non-existent, inactive/frozen, or self-owned accounts during pre-flight verification.

**Independent Test**: Enter non-existent number (`9999999999`) -> Displays "Account not found". Enter sender's own number -> Displays "Cannot transfer funds to the same account". In both cases, "Proceed" remains disabled.

### Implementation for User Story 2

- [x] T009 [US2] Handle 404 (`NOT_FOUND`) responses in `client/src/pages/TransferPage.jsx`:
  - Set verification state to `error`.
  - Display error banner: `❌ Recipient account not found. Please check the 10-digit number.`
  - Keep "Proceed to Amount" button strictly disabled.
- [x] T010 [US2] Handle 400 (`BAD_REQUEST`) status errors in `client/src/pages/TransferPage.jsx`:
  - Display safe status message: `This account is currently unavailable for transfers.`
  - Keep "Proceed to Amount" button strictly disabled.
- [x] T011 [US2] Prevent self-transfer verification in `client/src/pages/TransferPage.jsx`:
  - Check if entered account number matches `senderAccount.accountNumber`.
  - If matching, immediately display `You cannot transfer funds to the same account.` without firing an unnecessary network request.

**Checkpoint**: All invalid, non-existent, inactive, and self-owned accounts are gracefully rejected.

---

## Phase 4: User Story 3 - Input Alteration & Invalidation State Machine (Priority: P2)

**Goal**: Ensure that editing or typing in the account number field immediately invalidates prior verification and locks the proceed action.

**Independent Test**: Verify Account A -> State is `VERIFIED`. Type or backspace a digit in the account number input -> State immediately reverts to `IDLE`, verified recipient card vanishes, and "Proceed" locks.

### Implementation for User Story 3

- [x] T012 [US3] Add account number change listener in `client/src/pages/TransferPage.jsx`:
  - In `handleAccountNumberChange`, if `verificationStatus !== 'idle'`, automatically reset `verificationStatus` to `'idle'`, set `verifiedRecipient` to `null`, and clear error messages.
- [x] T013 [US3] Reset verification state when switching between `internal` and `external` transfer modes in `client/src/pages/TransferPage.jsx`.
- [x] T014 [US3] Reset verification state if the sender source account dropdown is changed in `client/src/pages/TransferPage.jsx`.

**Checkpoint**: Zero chance of verifying one account and transferring to a different account.

---

## Phase 5: User Story 4 - Multi-Step Transfer Journey with Pre-flight Review (Priority: P2)

**Goal**: Deliver a complete 2-step transfer flow carrying verified recipient details into the review dialog and transaction receipt.

**Independent Test**: Verify recipient -> Proceed to Amount -> Enter $25.00 -> Click "Review Transfer" -> Modal shows verified holder name, masked account, and amount -> Click "Confirm Transfer" -> Executes `POST /transactions/transfer` with UUID v4 idempotency key -> Receipt displays verified recipient name and new balances.

### Implementation for User Story 4

- [x] T015 [P] [US4] Update `client/src/components/banking/TransferModal.jsx`:
  - Display `recipientName` / `accountHolderName` in the review modal alongside `receiverNumber`.
  - Format sender and receiver details with clear visual hierarchy.
- [x] T016 [P] [US4] Update `client/src/components/banking/TransactionReceipt.jsx`:
  - Display `recipientName` on the transaction receipt modal for completed external transfers.
- [x] T017 [US4] Ensure `handleExecuteTransfer` in `client/src/pages/TransferPage.jsx` transmits the payload to `transactionService.transfer` using the existing UUID v4 Idempotency Key mechanism, updates balances in `BankingContext`, and triggers the receipt modal.

**Checkpoint**: Complete end-to-end verified transfer flow with review dialog and receipt.

---

## Phase 6: Polish, Build Verification, & Playwright Testing

**Purpose**: Validate end-to-end user journeys, build health, and zero regressions.

- [x] T018 Run `npm run build` in `client/` to verify zero Vite syntax, JSX, or bundling errors.
- [x] T019 Run comprehensive Playwright MCP test suite covering:
  - Test Case 1: Valid account verification & holder name display
  - Test Case 2: Invalid account (404) rejection
  - Test Case 3: Inactive / Frozen account rejection
  - Test Case 4: Same sender and receiver account rejection
  - Test Case 5: Input alteration immediate invalidation
  - Test Case 6: Duplicate verification click suppression
  - Test Case 7: Full transfer execution & receipt inspection
- [x] T020 Capture screenshot of verified recipient state and review modal for project records.

---

## Dependencies & Execution Order

```text
Phase 1: Backend Verification Endpoint (T001 - T003) [DONE]
     ↓
Phase 2: User Story 1 - Verification UI & Service (T004 - T008) [DONE]
     ↓
Phase 3: User Story 2 - Error & Inactive Handling (T009 - T011) [DONE]
     ↓
Phase 4: User Story 3 - Invalidation State Machine (T012 - T014) [DONE]
     ↓
Phase 5: User Story 4 - Review Modal & Receipt Integration (T015 - T017) [DONE]
     ↓
Phase 6: Build Verification & Playwright E2E Testing (T018 - T020) [DONE]
```

---

## Final Verification Result
- **Backend Tests**: 6/6 assertions passed in `scripts/test-verify-recipient.js`.
- **Frontend Build**: Vite 5.4.21 compiled in 6.20s with 0 errors.
- **Playwright E2E**: 7/7 user journeys tested and visually confirmed with verified recipient name, invalidation state machine, review dialog, and post-transfer receipt modal.
