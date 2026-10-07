# React Banking Frontend — Scoped Requirements

All requirements originate from the approved specification [`.specify/specs/banking-frontend-react/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-frontend-react/spec.md) and technical blueprint [`.specify/specs/banking-frontend-react/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-frontend-react/plan.md).

---

## Requirements Matrix

### 1. Setup & Foundational UI (Phase 1 & 2)
- **REQ-FE-001 (FR-001)**: React 18+ single-page application built with Vite and Tailwind CSS located in `client/`.
- **REQ-FE-002 (FR-002)**: Centralized Axios HTTP client in `client/src/services/api.js` configured with `withCredentials: true`, base URL pointing to `http://localhost:3000/api/v1`, and request/response interceptors.
- **REQ-FE-003 (FR-010)**: Financial currency utility functions (`toCents`, `formatCurrency`, `parseCents`) ensuring zero floating-point arithmetic errors.
- **REQ-FE-004 (FR-012)**: Standard date formatters (`formatDate`, `formatRelativeTime`) for localized financial timestamps.
- **REQ-FE-005**: Global stackable `ToastContext` providing floating alerts for financial confirmations, errors, and system warnings.
- **REQ-FE-006**: Reusable atomic UI primitives: `Button` (with loading spinner & variants), `Input`, `Select`, `Modal` (accessible dialog with focus trap), `Badge` (status tags), `Card` (glassmorphism), `Skeleton` (shimmer loader), `MoneyDisplay`, and `EmptyState`.

### 2. Marketing & Authentication (Phase 3)
- **REQ-FE-007**: High-converting public `LandingPage` with hero section, live feature cards, security compliance metrics, and interactive currency ticker.
- **REQ-FE-008 (FR-003)**: Client-side validation for emails (RFC 5322 regex) and passwords ($\ge 8$ characters with strength indicator).
- **REQ-FE-009**: Registration flow calling `POST /api/v1/auth/register`, setting the HTTP-only cookie, and auto-navigating to `/dashboard` upon receiving the auto-provisioned 10-digit Savings Account.
- **REQ-FE-010**: Login flow calling `POST /api/v1/auth/login` with constant-time error feedback and redirect URL recovery.
- **REQ-FE-011 (FR-004)**: `AuthContext` managing user credentials, session state, and session hydration on browser reload via `GET /api/v1/auth/me`.
- **REQ-FE-012 (FR-005, FR-006)**: Route navigation guards: `ProtectedRoute` (protects dashboard, accounts, transfer, transactions) and `GuestRoute` (redirects authenticated users to `/dashboard`).
- **REQ-FE-013**: Logout flow calling `POST /api/v1/auth/logout`, invalidating token in MongoDB Blacklist TTL, clearing cookies, and resetting context.

### 3. App Shell & Navigation (Phase 4)
- **REQ-FE-014 (FR-013)**: `DashboardLayout` shell containing sticky desktop `Sidebar`, top `Header` with user profile and active account switcher, and responsive slide-over `MobileNav` drawer for screens $< 1024px$.

### 4. Executive Financial Dashboard (Phase 5)
- **REQ-FE-015**: Signature dynamic `BalanceCard` displaying live derived balance ($Credits - $Debits$) loaded from `GET /api/v1/accounts/:id/balance`.
- **REQ-FE-016**: `BankingContext` holding account lists and triggering global balance updates upon deposit or transfer completion.
- **REQ-FE-017**: `LedgerSummaryCard` displaying total credits (inflow), total debits (outflow), and net financial balance.
- **REQ-FE-018**: Recent transactions activity feed displaying date, party, status badge, and debit/credit indicator.

### 5. Multi-Account Management & Faucet Deposit (Phase 6)
- **REQ-FE-019**: `AccountsPage` rendering all user accounts with one-click copyable 10-digit account numbers and status badges.
- **REQ-FE-020**: `CreateAccountModal` enabling users to provision secondary Checking accounts (`POST /api/v1/accounts`).
- **REQ-FE-021 (FR-011)**: `FaucetDepositModal` supporting $10, $50, $100, $500 chip presets or custom amounts (`POST /api/v1/accounts/:id/deposit`) with instant balance refresh.

### 6. Atomic Money Transfer & Idempotency Engine (Phase 7)
- **REQ-FE-022**: `TransferPage` with source account selection, recipient input, amount input in dollars with minor-unit conversion, and real-time balance check.
- **REQ-FE-023 (FR-008)**: Two-step confirmation review dialog (`TransferModal`) summarizing sender, recipient, fee ($0.00), and net debit before submission.
- **REQ-FE-024 (FR-007)**: RFC 4122 UUID v4 generation passed via `Idempotency-Key` header on transfer requests.
- **REQ-FE-025**: Double-submission prevention locking the transfer button and rendering an in-flight spinner during network processing.
- **REQ-FE-026**: `TransactionReceipt` modal presenting copyable Transaction ID, timestamp, and status upon transfer completion.

### 7. Transaction Journal & Deep Audit (Phase 8)
- **REQ-FE-027**: `TransactionsPage` with search bar, status filter tabs (`ALL`, `COMPLETED`, `PENDING`, `FAILED`), and server-side pagination controls (`page`, `limit`).
- **REQ-FE-028**: Single transaction receipt drill-down modal (`GET /api/v1/transactions/:id`) displaying complete audit timeline.

### 8. Profile & Production Hardening (Phase 9 & 10)
- **REQ-FE-029**: `ProfilePage` displaying user credentials, verification status, and one-click session revocation.
- **REQ-FE-030 (FR-014)**: Global error normalization mapping backend `{ success: false, error: { code, message } }` into user-friendly notifications.
- **REQ-FE-031**: Production build compiling with zero errors (`npm run build` in `client/`).
- **REQ-FE-032**: Live end-to-end integration verified against MongoDB Atlas.
