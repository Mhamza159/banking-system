# Phase 5 Plan: Multi-Account Management & Sandbox Faucet Deposit

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-05-accounts`  
**Goal**: Deliver multi-account management empowering customers to view all owned accounts, inspect individual live balances, provision secondary Checking/Savings accounts (`POST /api/v1/accounts`), and fund accounts via the sandbox faucet modal (`POST /api/v1/accounts/:id/deposit`).  
**Tasks Covered**: T039 through T042 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Customers in the AuraBank platform automatically receive an initial 10-digit Savings account upon registration. Phase 5 expands this to complete multi-account lifecycle management:
1. Viewing all owned accounts (Checking and Savings) in a responsive grid.
2. Computing aggregate financial metrics (Total Net Worth / Assets across all accounts).
3. Opening secondary accounts with currency specification (`USD`, `EUR`, `PKR`, `GBP`).
4. Funding any specific account with preset chips or custom amounts through the sandbox faucet.
5. Setting any account as the globally active account for header, dashboard, and transfer operations.

---

## Detailed Task Breakdown

### 1. `client/src/components/banking/AccountCard.jsx` (T039)
- **Visual Design**:
  - Distinguishable card styling based on `accountType`:
    - `SAVINGS`: Emerald / Cyan ambient accent glow.
    - `CHECKING`: Electric Indigo / Violet ambient accent glow.
  - Active indicator badge: Glowing pill if account matches `activeAccountId`.
  - Account Number display with formatted grouping (`•••• •••• •••• 4092`) and one-click copy button with checkmark animation.
  - Status badge: Utilizing `<Badge variant={status}>` (`ACTIVE`, `FROZEN`, `INACTIVE`).
  - Derived balance using `<MoneyDisplay size="lg" />`.
- **Interactive Actions**:
  - "Set as Active": Quick button to switch global context active account.
  - "Deposit": Opens `FaucetDepositModal` targeted to this specific account.
  - "Transfer": Navigates to `/transfer` with this account pre-selected.

### 2. `client/src/components/banking/CreateAccountModal.jsx` (T040)
- **Modal Dialog**:
  - Built using `<Modal>` primitive with accessible ESC & backdrop handling.
  - Form fields:
    - **Account Type**: Select dropdown or interactive cards (`CHECKING` or `SAVINGS`).
    - **Currency**: Select dropdown (`USD`, `EUR`, `PKR`, `GBP`), default `USD`.
  - Guidance text explaining 10-digit number generation and account limits.
  - Integration with `accountService.createAccount` / `BankingContext.createAccount`.
  - Error state handling: Inline banner for `409 Conflict` (e.g. "You already have an active CHECKING account").
  - Loading spinner on submit button; automatic refresh of accounts list on success.

### 3. Faucet Deposit Integration (T041)
- Enhance `FaucetDepositModal.jsx` to accept an optional `targetAccount` prop:
  - If provided, deposits specifically into `targetAccount._id`.
  - If omitted, defaults to `activeAccount`.
  - Seamlessly re-aggregates ledger balances across `BankingContext` upon completion.

### 4. `client/src/pages/AccountsPage.jsx` (T042)
- **Header & Net Worth Summary Banner**:
  - Total Net Assets card calculating the sum of balances across all accounts.
  - Account count breakdown (e.g. "2 Active Accounts • 1 Savings, 1 Checking").
  - Action buttons: "Open New Account" (primary) and "Deposit Funds" (secondary).
- **Accounts Grid**:
  - Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
  - Renders `<AccountCard>` for every account in `accounts`.
  - Shimmer loading state when `loadingAccounts` is true.
  - Empty state fallback using `<EmptyState>` if no accounts exist.
- **Modals Integration**:
  - Mounts `<CreateAccountModal>` and `<FaucetDepositModal>`.

---

## Verification Plan

### 1. Build Verification
- Execute `npm run build` in `client/` to verify zero compilation or JSX syntax errors.

### 2. Automated Integration Test Suite (`scripts/verify-frontend-phase5.js`)
- Validates presence and exports of `AccountCard`, `CreateAccountModal`, `FaucetDepositModal`, and `AccountsPage`.
- Validates `BankingContext` integration with multi-account operations.
- Verifies production bundle build.

### 3. Manual Flow Verification
- Navigate to `http://localhost:5173/accounts`.
- Verify primary Savings account card renders with live balance.
- Click "Open New Account" $\to$ select `CHECKING` in `USD` $\to$ submit $\to$ verify new checking account renders in grid.
- Click "Deposit" on the new Checking account card $\to$ deposit $250.00 $\to$ verify Checking balance updates to $250.00 and Total Net Worth updates accordingly.
- Click "Set as Active" on Checking account $\to$ verify Header and BalanceCard now show Checking as the active ledger.
