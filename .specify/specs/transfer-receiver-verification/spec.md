# Feature Specification: Bank Transfer — Receiver Account Verification Flow

**Feature Branch**: `003-transfer-receiver-verification`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "BANK TRANSFER — RECEIVER ACCOUNT VERIFICATION FLOW: Whenever a customer wants to transfer/debit money to another account, the receiver account must be verified BEFORE the user is allowed to proceed with the actual transfer. Verify recipient name via backend, prevent duplicate checks, reset verification on input change, and execute the final transfer through the existing ACID/idempotent ledger pipeline."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recipient Verification & Name Confirmation (Priority: P1)

As an authenticated bank customer preparing an external or inter-account transfer,
I want to enter a destination account number and have the system verify its existence and return the account holder's legal name,
So that I can visually confirm that I am sending funds to the intended person before committing any money.

**Why this priority**:
Transferring funds to the wrong recipient account is one of the most critical risks in digital banking. Providing pre-flight verification with the recipient's verified name prevents erroneous transfers, chargebacks, customer disputes, and irreversible float loss.

**Independent Test**:
Can be fully tested independently by navigating to `/transfer`, switching to External Transfer, entering an existing 10-digit account number (e.g. `1204395350`), clicking "Verify Account", and verifying that:
1. The button enters a loading state with spinner.
2. The backend responds with `{ success: true, account: { accountNumber, accountHolderName, accountType } }`.
3. The verified account card appears displaying the holder's legal name and masked account number.
4. The "Proceed" / "Continue to Amount" action unlocks.

**Acceptance Scenarios**:

1. **Given** an authenticated user on `/transfer` with "External Transfer" selected,
   **When** they enter a valid 10-digit account number belonging to user "Muhammad Ali" and click "Verify Account",
   **Then** a loading indicator is displayed, a query is sent to the backend verification endpoint, and upon success, a verified badge with "Muhammad Ali" and masked account `•••• 5350` is rendered.

2. **Given** an active verification check in flight,
   **When** the user attempts to click "Verify Account" multiple times rapidly,
   **Then** duplicate requests are suppressed, the button is disabled, and only one network request is dispatched.

3. **Given** a successfully verified recipient,
   **When** the user clicks "Proceed to Amount",
   **Then** the UI transitions into the amount input and transfer review steps, carrying the verified recipient details forward.

---

### User Story 2 - Invalid, Inactive, & Self-Account Rejection (Priority: P1)

As an authenticated customer,
I want the system to immediately flag invalid, non-existent, inactive, or self-owned destination accounts during the verification phase,
So that I am strictly blocked from proceeding with an unserviceable transfer.

**Why this priority**:
Prevents customer confusion and unnecessary backend transactions by failing fast with user-friendly, secure error messages.

**Independent Test**:
Can be tested independently by entering:
- A non-existent 10-digit number (e.g., `9999999999`) -> Expect "Account not found".
- An inactive or frozen account -> Expect "This account is currently unavailable for transfers".
- The sender's own selected account number -> Expect "Cannot transfer funds to the same account".
In all cases, "Proceed" remains disabled.

**Acceptance Scenarios**:

1. **Given** an entered account number that does not exist in the database,
   **When** the user clicks "Verify Account",
   **Then** the system displays a clear error alert `❌ Account not found. Please verify the 10-digit number.` and the Proceed button remains disabled.

2. **Given** an entered account that exists but has status `FROZEN` or `CLOSED`,
   **When** the user clicks "Verify Account",
   **Then** the backend returns a 400 Bad Request with a safe status error, and the UI displays `This account is currently unavailable for transfers.` without revealing internal ledger details.

3. **Given** the user enters the account number of the currently selected sender account,
   **When** verification is triggered or input is checked,
   **Then** the UI blocks the action with `You cannot transfer funds to the same account.` and Proceed is disabled.

---

### User Story 3 - Input Invalidation & Verification Invalidation State Machine (Priority: P2)

As a security-conscious banking customer,
I want any alteration of the receiver account input field to immediately void any previous verification,
So that I cannot verify Account A and then secretly send money to Account B without re-verification.

**Why this priority**:
Crucial integrity guard. If a user verifies Account A ("Muhammad Ali"), edits the textbox to Account B ("Fraudulent Recipient"), and clicks Proceed, the transfer would be routed to the wrong party if the verification state is not tightly coupled to the exact verified account number.

**Independent Test**:
1. Verify Account A -> State becomes `VERIFIED`.
2. Type a single digit in the account number field -> State transitions immediately to `IDLE` / `UNVERIFIED`.
3. Verified recipient card disappears and Proceed button immediately disables until "Verify Account" is clicked again.

**Acceptance Scenarios**:

1. **Given** Account A has been verified and Muhammad Ali's name is displayed,
   **When** the user alters or backspaces the account number input,
   **Then** Muhammad Ali's name is immediately removed, the verified badge is cleared, and the verification status reverts to `IDLE`.

2. **Given** an invalidated state due to user edit,
   **When** the user attempts to proceed to the amount or review screen,
   **Then** the submission is blocked and the system demands: `Please verify recipient account before proceeding.`

---

### User Story 4 - Multi-Step Transfer Journey with Pre-flight Review (Priority: P2)

As an authenticated customer,
I want a seamless, guided multi-step transfer workflow (1. Recipient Verification → 2. Amount & Memo → 3. Pre-Flight Review → 4. Execution & Receipt),
So that I have full clarity at every stage before executing an irreversible ACID ledger movement.

**Why this priority**:
Ensures high customer confidence, minimizes friction, aligns with tier-1 fintech UX standards, and preserves the existing atomic transaction flow.

**Independent Test**:
Complete an end-to-end transfer:
1. Verify Recipient -> Click Proceed.
2. Enter amount $150.00 -> Click "Review Transfer".
3. Verify modal shows sender account, recipient name, masked recipient account number, amount ($150.00), and fee ($0.00).
4. Click "Confirm Transfer" -> Executes `POST /transactions/transfer` with UUID v4 Idempotency Key.
5. Receipt modal opens with Transaction ID and updated ledger balances.

**Acceptance Scenarios**:

1. **Given** recipient verification has succeeded,
   **When** the user enters an amount exceeding their available ledger balance,
   **Then** the real-time balance guard flags `Insufficient funds. Available: $X.XX` and blocks the Review step.

2. **Given** valid recipient, valid amount, and sufficient balance,
   **When** the user clicks "Review Transfer",
   **Then** the confirmation modal explicitly presents:
   - Source Account (Masked + Type + Balance)
   - Verified Recipient Name & Masked Account
   - Total Debit Amount
   - Transfer Reason / Memo

3. **Given** the user is on the Review modal,
   **When** they click "Confirm Transfer",
   **Then** the button shows a spinner (`Processing transfer...`), duplicate clicks are disabled, and the existing `POST /api/v1/transactions/transfer` is executed with an RFC 4122 UUID v4 Idempotency-Key.

---

### Edge Cases

- **What happens when the recipient account is internal (between user's own accounts)?**
  Internal transfers select from the user's existing accounts dropdown where account type and balance are already verified. The system auto-populates the recipient label with the user's own account details and marks the account as verified by default.
- **What happens if network fails during verification?**
  A distinct error banner `Unable to reach verification service. Please check your network connection.` is displayed with a "Retry Verification" option.
- **What happens if the recipient user's profile has no name?**
  The backend fallback returns `"Account Holder"` or the user's masked identifier; however, in this application `User.name` is required (`minlength: 2`).
- **Does recipient verification reserve funds or lock the account?**
  No. Recipient verification is strictly a read-only metadata inquiry. No ledger locks, hold entries, or balance changes occur during verification.
- **What if the recipient account status changes between verification and final transfer?**
  The authoritative transfer controller re-checks `receiver.status === ACCOUNT_STATUS.ACTIVE` inside the ACID transaction session. If it changed to FROZEN in the interim, the transfer aborts cleanly with 400 Bad Request.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST expose an authenticated, read-only endpoint `GET /api/v1/accounts/verify-recipient?accountNumber=:accountNumber` (or `GET /api/v1/accounts/recipient/:accountNumber`) that verifies whether a destination account is eligible for transfers.
- **FR-002**: The verification endpoint MUST authenticate the requesting customer via JWT HttpOnly cookie or Bearer token.
- **FR-003**: The verification endpoint MUST validate that `:accountNumber` is a 10-digit numeric string (or a valid 24-character MongoDB ObjectId).
- **FR-004**: The verification endpoint MUST return strictly minimal safe metadata:
  ```json
  {
    "success": true,
    "message": "Recipient account verified successfully",
    "data": {
      "accountNumber": "1204395350",
      "accountHolderName": "Muhammad Ali",
      "accountType": "SAVINGS",
      "currency": "USD"
    }
  }
  ```
- **FR-005**: The verification endpoint MUST NEVER expose sensitive attributes (passwords, password hashes, JWTs, user email, phone number, balances, internal ledger entries, or account creation timestamps).
- **FR-006**: The verification endpoint MUST return standard HTTP error codes:
  - `400 Bad Request`: Invalid account number format or self-transfer attempt.
  - `404 Not Found`: Account does not exist.
  - `422 Unprocessable Entity` or `400 Bad Request`: Account status is not `ACTIVE` (e.g. `FROZEN`, `CLOSED`).
- **FR-007**: The frontend Transfer page MUST feature a dedicated "Verify Account" action in the recipient entry card for external transfers.
- **FR-008**: The frontend MUST prevent duplicate verification requests by disabling the "Verify Account" button while an inquiry is in flight.
- **FR-009**: The frontend MUST display a verified recipient card with the legal holder name and masked account number upon successful response.
- **FR-010**: Any modification to the account number input field MUST immediately invalidate the verification state and disable the Proceed action.
- **FR-011**: The frontend MUST NOT allow the user to advance to the amount confirmation or review stage until the recipient account has a verified status.
- **FR-012**: The final confirmation modal MUST clearly display the verified recipient's name alongside the masked account number.
- **FR-013**: The actual financial execution MUST continue to route exclusively through the existing `POST /api/v1/transactions/transfer` endpoint with RFC 4122 UUID v4 `Idempotency-Key` protection.
- **FR-014**: The backend transfer controller MUST maintain authoritative validation: it MUST independently re-validate sender ownership, recipient existence, recipient status, currency match, and available ledger balance within the MongoDB multi-document ACID transaction session.

### Key Entities

- **Account**: Represents a bank deposit account (`SAVINGS`, `CHECKING`). Attributes: `_id`, `accountNumber` (10 digits), `currency`, `status` (`ACTIVE`, `FROZEN`, `CLOSED`), `user` (ref User).
- **User**: Represents the account holder. Attributes: `_id`, `name` (Full legal name), `email`, `role`.
- **Recipient Verification Response**: Safe DTO containing `{ accountNumber, accountHolderName, accountType, currency }`.
- **Transaction**: Immutable ledger audit record created upon final transfer confirmation.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of external transfers require verified recipient confirmation before the transfer execution button can be activated.
- **SC-002**: Recipient verification response time is under 200ms under standard local network conditions.
- **SC-003**: 0 sensitive fields (credentials, hashes, balances, contact details) exposed in verification network payloads.
- **SC-004**: 100% of input alterations (typing, backspacing, pasting) immediately reset verification status to `UNVERIFIED`.
- **SC-005**: Existing double-entry ledger invariant (Total Debits == Total Credits) and zero float drift maintained with 0 regressions.
- **SC-006**: Existing Idempotency-Key deduplication prevents duplicate transfers even if network or user double-clicks confirm.

---

## Assumptions

- **Target Users**: Authenticated retail and commercial customers executing transfers from their checking or savings accounts.
- **Recipient Scope**: Destination accounts are accounts maintained within the core banking ledger system (10-digit account numbers).
- **Security Posture**: All verification calls require active JWT authentication; anonymous probing/scraping of account holder names is strictly rejected.
- **Backend Architecture**: Reuses existing `account.routes.js`, `account.controller.js`, `account.model.js`, and `user.model.js` without altering database schemas or adding new database tables.
- **Frontend Architecture**: Enhances `TransferPage.jsx`, `TransferModal.jsx`, and `accountService.js` while maintaining Tailwind CSS styling, Lucid icons, and responsive layout.
