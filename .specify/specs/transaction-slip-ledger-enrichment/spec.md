# Feature Specification: Standard Banking Slip & Ledger Counterparty Enrichment

**Feature Branch**: `004-transaction-slip-ledger-enrichment`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "jab slip generate ho aur ledger mein sender aur reciever acc ki detail mention honi chhaye like sender name + acc and recievr acc+ name, jese standard he banks mein."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Transfer Slip with Dual-Party Bank Details (Priority: P1)

As an authenticated customer completing a fund transfer,
I want the generated transaction receipt/slip to explicitly display full details for both parties—Sender (Legal Name + Account Number) and Receiver (Legal Name + Account Number)—in standard commercial banking format,
So that I have an indisputable, regulatory-grade proof of payment containing complete originator and beneficiary information.

**Why this priority**:
In real-world commercial banking (SWIFT, SEPA, Fedwire, Raast, IBFT), a payment receipt or debit advice without the remitter's and beneficiary's names and account numbers is non-compliant and induces customer anxiety. Customers need both parties' identification for official records, expense reconciliation, and vendor disputes.

**Independent Test**:
Can be fully tested independently by executing an inter-account or external transfer on `/transfer`:
1. Enter recipient account, verify, and complete transfer.
2. The instant `TransactionReceipt` modal appears.
3. Verify that the receipt displays:
   - **Sender Details**: Legal Full Name (e.g. "Alexander Wright") + Account Number (e.g. `1204395350` / `•••• 5350`) + Account Type.
   - **Receiver Details**: Legal Full Name (e.g. "Muhammad Ali") + Account Number (e.g. `7892011612` / `•••• 1612`) + Account Type.
   - **Payment Summary**: Amount, Fee ($0.00), Settlement Time, Transaction ID, and Idempotency Key.

**Acceptance Scenarios**:

1. **Given** an authenticated user (Alexander Wright) transferring $150.00 to recipient Muhammad Ali (`7892011612`),
   **When** the transfer is committed,
   **Then** the generated receipt displays "Alexander Wright (•••• 5350 - CHECKING)" under Remitter/Sender and "Muhammad Ali (•••• 1612 - SAVINGS)" under Beneficiary/Receiver.

2. **Given** an internal transfer between two accounts owned by the same user,
   **When** the receipt is generated,
   **Then** both Remitter and Beneficiary display the user's name with their respective distinct account numbers (e.g. Checking `•••• 5350` to Savings `•••• 8821`) and an "Internal Transfer" badge.

3. **Given** the receipt modal is displayed,
   **When** the user clicks "Copy Transaction ID" or "Copy Idempotency Key",
   **Then** clipboard feedback is provided with visual confirmation.

---

### User Story 2 - Enriched Counterparty Details in Ledger Journal & Audit Modal (Priority: P1)

As an account holder reviewing statement history on the Transactions page,
I want each ledger record and its deep inspection audit modal to clearly display both sender name + account and receiver name + account,
So that I can immediately identify who sent or received money without guessing from anonymous account numbers.

**Why this priority**:
Standard bank statements and digital ledgers always present the counterparty's full legal identity alongside the account identifier. Lacking counterparty names forces users to open external spreadsheets or contact customer support to identify past payments.

**Independent Test**:
Can be fully tested independently by navigating to `/transactions`:
1. Check the transaction table: The Counterparty column displays the counterparty's name (e.g. "Muhammad Ali") alongside the masked account number and type.
2. Search query filter: Type the recipient or sender's name (e.g. "Muhammad") into the memo/search bar; the ledger filters to matching counterparty records.
3. Click on any transaction row: The `TransactionDetailModal` opens, displaying a dual-column Remitter vs Beneficiary section with sender name + account number and receiver name + account number.

**Acceptance Scenarios**:

1. **Given** a user viewing the transaction table on `/transactions`,
   **When** viewing an outbound debit payment,
   **Then** the Counterparty column displays the Beneficiary's Name ("Muhammad Ali") as the primary label and the account number ("•••• 1612 · Savings") as secondary text.

2. **Given** a user viewing an inbound credit payment,
   **When** looking at the transaction row,
   **Then** the Counterparty column displays the Sender's Name ("Alexander Wright") and their account number ("•••• 5350 · Checking").

3. **Given** an open `TransactionDetailModal`,
   **When** the user inspects the ledger details,
   **Then** both "Debited Account (Remitter)" and "Credited Account (Beneficiary)" show:
     - Account Holder Full Name
     - Account Number
     - Account Type (Checking / Savings)
     - Transfer Direction Badge (Debit Outflow vs Credit Inflow)

4. **Given** the search input on `/transactions`,
   **When** the user types a participant's name (e.g. "Alexander"),
   **Then** the table matches and shows all transactions where Alexander was either the sender or receiver.

---

### User Story 3 - Institutional Printable Bank Transfer Slip / Voucher (Priority: P2)

As a bank customer needing formal proof of payment for accounting, taxes, or third-party proof,
I want to click "Print Receipt" from either the transfer completion modal or the transaction ledger modal and receive an authentic, formatted banking voucher,
So that printed copies and saved PDFs look like official commercial bank debit/credit advices rather than raw web application screenshots.

**Why this priority**:
Businesses and individual customers frequently print or save PDF payment slips for invoices, tax filings, and legal records. A dedicated print layout ensures professional typography, high-contrast black-on-white rendering, institutional bank header, and clean borders.

**Independent Test**:
Can be tested independently by:
1. Clicking "Print Receipt" in either `TransactionReceipt` or `TransactionDetailModal`.
2. Verifying the `@media print` CSS layout formats the voucher cleanly with:
   - Bank name & emblem ("ANTIGRAVITY CORE BANKING · TRANSACTION ADVICE")
   - Structured Remitter (Sender) and Beneficiary (Receiver) sections.
   - Financial breakdown (Amount, Currency, Transfer Fee $0.00, Settlement status).
   - Cryptographic transaction reference and settlement timestamp.
   - Screen-only buttons (Print, Close, Copy) hidden from printed output.

**Acceptance Scenarios**:

1. **Given** an open receipt modal,
   **When** the user clicks "Print Receipt",
   **Then** the print dialogue triggers (`window.print()`) with dedicated print styles hiding background darkness, modal overlay backdrops, and action buttons.

2. **Given** a printed slip or PDF preview,
   **When** examining the layout,
   **Then** the voucher features an official institutional header, two clear party boxes (Remitter on left, Beneficiary on right), transaction particulars table, and bank audit verification footer.

---

### Edge Cases

- **Self / Internal Transfers**: When a user transfers funds between two of their own accounts, both sender and receiver have the same legal name (`user.name`). The UI must clearly differentiate them by account type (e.g. "Checking Account" vs "Savings Account") and indicate "Internal Account Transfer".
- **Legacy or Deleted Users**: If an account or user reference is orphaned or missing name data in legacy test databases, the system MUST gracefully fall back to `"Account Holder"` or the raw account number without throwing runtime null pointer exceptions.
- **Privacy & Masking**: In standard banking UI, account numbers are displayed in masked format (`•••• 5350` or `ACC-••••5350`) for security, while full 10-digit account numbers are available when copying or on the printable official voucher.
- **Cross-User History Visibility**: A user only has access to transactions where they own either the sender account or receiver account. Deep population must only expose the legal counterparty name and account number, preserving strict multi-tenant authorization.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend `transfer` controller MUST return enriched participant objects in the response payload:
  - `sender`: `{ accountNumber, accountHolderName, accountType, currency }`
  - `receiver`: `{ accountNumber, accountHolderName, accountType, currency }`
  while retaining existing top-level fields (`senderAccount`, `receiverAccount`) for backward compatibility.
- **FR-002**: Backend `getHistory` controller MUST deeply populate both `senderAccount` and `receiverAccount` with their associated user details (`user: "name email"`), ensuring `senderAccount.user.name` and `receiverAccount.user.name` are delivered in the transaction list.
- **FR-003**: Backend `getTransactionById` controller MUST deeply populate `senderAccount.user` and `receiverAccount.user` with legal name and email.
- **FR-004**: Frontend `TransactionReceipt` MUST render dedicated, prominent sections for both:
  - **Remitter / Sender**: Legal Name + Account Number + Account Type.
  - **Beneficiary / Recipient**: Legal Name + Account Number + Account Type.
- **FR-005**: Frontend `TransactionDetailModal` (Ledger Audit Modal) MUST render complete details for both parties:
  - Sender Legal Name and Account Number under "Debited Account".
  - Receiver Legal Name and Account Number under "Credited Account".
- **FR-006**: Frontend `TransactionTable` MUST display the counterparty's legal name as the primary row title (e.g. "Muhammad Ali") with the masked account number and account type as the subtitle.
- **FR-007**: Frontend `TransactionsPage` client search filter MUST search against `senderAccount.user.name` and `receiverAccount.user.name` in addition to description, account numbers, and transaction IDs.
- **FR-008**: The system MUST support standard banking voucher printing via `@media print` CSS rules, providing a clean black-and-white official slip format with bank branding, date, reference, sender details, receiver details, fee ($0.00), and transaction status.
- **FR-009**: The receipt and modal MUST format amounts using the verified financial currency formatter and display zero transaction fee ($0.00).
- **FR-010**: All UI components MUST handle null/undefined participant names gracefully with safe fallback strings to prevent client-side crashes.

---

### Key Entities

- **Transaction Audit Record**:
  - `_id`: Unique cryptographic transaction ID.
  - `idempotencyKey`: UUID v4 idempotency token.
  - `amount`: Integer in cents.
  - `currency`: ISO 4217 currency code (e.g. `USD`).
  - `senderAccount`: Ref to `Account` with populated `accountNumber`, `accountType`, `currency`, and `user` (`name`, `email`).
  - `receiverAccount`: Ref to `Account` with populated `accountNumber`, `accountType`, `currency`, and `user` (`name`, `email`).
  - `status`: Settlement state (`COMPLETED`, `PENDING`, `FAILED`).
  - `createdAt`: ISO 8601 timestamp.
- **Counterparty DTO**:
  - `accountHolderName`: Legal name of the account owner.
  - `accountNumber`: 10-digit institutional account number.
  - `accountType`: `SAVINGS` or `CHECKING`.
  - `formattedAccount`: Masked display format (e.g. `•••• 5350`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly generated transfer slips (`TransactionReceipt`) display both Sender Name + Account Number and Receiver Name + Account Number.
- **SC-002**: 100% of ledger records in `TransactionTable` and `TransactionDetailModal` show the participant names rather than anonymous account numbers alone.
- **SC-003**: The transaction ledger memo/keyword search matches participant names in real time with 0ms server round-trip latency.
- **SC-004**: Printing a transaction slip produces an official, high-contrast banking advice voucher without modal scroll cuts, UI clutter, or button artifacts.
- **SC-005**: All existing ACID guarantees, double-entry ledger balancing, idempotency deduplication, and zero float loss remain 100% intact with 0 regressions.

---

## Assumptions

- Each `Account` document is linked to a valid `User` document containing `name` and `email`.
- Users have standard legal names populated upon registration (e.g. "Alexander Wright", "Muhammad Ali").
- The bank fee for internal and verified inter-account transfers is currently $0.00 (Zero Fee), which should be explicitly itemized on official slips.
- Existing authorization logic restricting transactions to their respective account holders remains unaltered.
