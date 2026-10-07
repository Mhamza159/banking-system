# Phase 7 Plan: Transaction Journal, Filtering & Deep Inspection

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-07-journal`  
**Goal**: Build a comprehensive, audited transaction journal with server-side pagination, status filtering (`ALL`, `COMPLETED`, `PENDING`, `FAILED`), search, and single transaction inspection drill-down modals.  
**Tasks Covered**: T047 through T049 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

The transaction journal is the historical record of the double-entry banking platform. Users must be able to audit all account inflows (credits) and outflows (debits), inspect cryptographic details (Idempotency Key, Transaction ID), search by memo or account number, and paginate through large statement histories.

---

## Detailed Task Breakdown

### 1. Backend Controller Status Filter (`src/controllers/transaction.controller.js`)
- Update `getHistory` to support optional query parameter `status` (`COMPLETED`, `PENDING`, `FAILED`).
- Dynamically attaches `{ status: req.query.status.toUpperCase() }` to the MongoDB query filter.

### 2. `client/src/components/banking/TransactionFilters.jsx`
- **Status Filter Tabs**:
  - Filter options: `ALL`, `COMPLETED`, `PENDING`, `FAILED`.
  - Active tab highlighted in `brand-accent`.
- **Search Bar**:
  - Input field to search by description/memo, counterparty, or transaction ID.
- **Account Filter Dropdown**:
  - Filter by specific account (`All Accounts`, `Primary Savings`, `Checking`).

### 3. `client/src/components/banking/TransactionTable.jsx` (T047)
- **Table Structure**:
  - Columns: **Date / Time**, **Counterparty / Type**, **Description / Memo**, **Status**, **Amount**.
  - Directional icons: `ArrowDownLeft` (Credit / Inflow) vs `ArrowUpRight` (Debit / Outflow).
  - Status badges utilizing `<Badge>`.
  - Amount formatted via `<MoneyDisplay>`.
  - Clickable rows opening the transaction inspection modal.
  - Shimmer skeleton loading rows during API queries.

### 4. `client/src/components/banking/TransactionDetailModal.jsx` (T049)
- **Detailed Audit Modal**:
  - Fetches or displays complete transaction record:
    - Unique MongoDB Transaction ID (with copy trigger).
    - RFC 4122 UUID v4 Idempotency Key (with copy trigger).
    - Debited Account Number & Type.
    - Credited Account Number & Type.
    - Currency and minor-unit amount.
    - Status (`COMPLETED`, `PENDING`, `FAILED`).
    - Exact ISO timestamp and relative time.
  - Print/save proof of payment action (`window.print()`).

### 5. `client/src/pages/TransactionsPage.jsx` (T048)
- **Header & Metric Cards**:
  - Total transactions count, Completed settlements, and Total Volume traded.
- **Filters & Search Integration**:
  - Real-time updates triggering server-side or filtered queries.
- **Pagination Controls**:
  - Pagination bar displaying "Showing X–Y of Z transactions".
  - "Previous" and "Next" buttons with page number buttons.
  - Page size limit selector (`10`, `25`, `50`).
- **Empty State**:
  - Fallback `<EmptyState>` with reset filter action if no transactions match current search criteria.

---

## Verification Plan

### 1. Build Verification
- Execute `npm run build` in `client/` to verify zero compilation or JSX syntax errors.

### 2. Automated Verification Test Suite (`scripts/verify-frontend-phase7.js`)
- Validates backend status filter in `transaction.controller.js`.
- Validates presence and exports of `TransactionTable`, `TransactionFilters`, `TransactionDetailModal`, and `TransactionsPage`.
- Verifies pagination and sorting logic.
- Verifies clean production build.

### 3. Manual Verification
- Navigate to `http://localhost:5173/transactions`.
- Verify paginated table loads transactions from live backend.
- Click status tabs (`COMPLETED`, `PENDING`, `FAILED`) $\to$ verify table filters appropriately.
- Type in search box $\to$ verify matching rows filter instantly.
- Click a transaction row $\to$ verify `TransactionDetailModal` opens with full audit metadata.
