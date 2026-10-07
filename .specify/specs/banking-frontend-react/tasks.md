# Tasks: Industry-Standard React Frontend for Banking Backend API

**Input**: Design documents from `.specify/specs/banking-frontend-react/` (`spec.md` and `plan.md`)  
**Prerequisites**: `spec.md` (approved), `plan.md` (approved)  
**Organization**: Tasks are grouped by user story priority (P1, P2) and divided into granular, independent micro-tasks.

---

## Format: `[ID] [P?] [Phase/Story] Description`
- **[P]**: Parallelizable (independent files, no blocking dependencies).
- Includes exact file paths in every task.

---

## Phase 1: Project Setup & Dependencies (Shared Infrastructure)

**Purpose**: Initialize the React + Vite frontend inside `client/` and configure styling pipelines.

- [x] T001 Initialize React 18+ Vite single-page application in `client/`
- [x] T002 Install core dependencies (`tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`, `axios`, `lucide-react`, `uuid`, `clsx`, `tailwind-merge`) in `client/package.json`
- [x] T003 [P] Configure Tailwind CSS with custom fintech color tokens, animations, and glassmorphic surfaces in `client/tailwind.config.js` and `client/postcss.config.js`
- [x] T004 [P] Create `.env.example` and `.env` in `client/` specifying `VITE_API_URL=http://localhost:3000/api/v1`
- [x] T005 [P] Setup HTML5 shell with Google Fonts (Inter), title, and meta tags in `client/index.html`
- [x] T006 [P] Add root npm scripts (`dev:client`, `dev:all`, `build:client`) in root `package.json`

---

## Phase 2: Foundational (Core Utilities, API Client & UI Primitives)

**Purpose**: Core design tokens, HTTP client, toast notification queue, and primitive components that all views depend upon.

- [x] T007 Implement financial currency converter (`toCents`, `formatCurrency`, `parseCents`) in `client/src/utils/currency.js`
- [x] T008 [P] Implement date formatters (`formatDate`, `formatRelativeTime`) in `client/src/utils/date.js`
- [x] T009 [P] Implement input validators (RFC 5322 email regex, password strength, positive integer cents) in `client/src/utils/validators.js`
- [x] T010 Setup centralized Axios client with `withCredentials: true`, base URL, and global error interceptor in `client/src/services/api.js`
- [x] T011 Implement `ToastContext` and floating stackable notification manager in `client/src/context/ToastContext.jsx`
- [x] T012 [P] Create primitive `Button` component (variants: primary, secondary, danger, ghost, outline; loading spinner) in `client/src/components/common/Button.jsx`
- [x] T013 [P] Create primitive `Input` component (prefix/suffix icons, error state, helper text) in `client/src/components/common/Input.jsx`
- [x] T014 [P] Create primitive `Select` component (custom accessible dropdown) in `client/src/components/common/Select.jsx`
- [x] T015 [P] Create accessible `Modal` dialog component with ESC key & backdrop click handling in `client/src/components/common/Modal.jsx`
- [x] T016 [P] Create `Badge` component for financial statuses (`ACTIVE`, `COMPLETED`, `PENDING`, `FAILED`) in `client/src/components/common/Badge.jsx`
- [x] T017 [P] Create `Card` component with glassmorphism surface and subtle borders in `client/src/components/common/Card.jsx`
- [x] T018 [P] Create `Skeleton` shimmer placeholder component in `client/src/components/common/Skeleton.jsx`
- [x] T019 [P] Create `MoneyDisplay` component with bold display numerals and muted currency symbols in `client/src/components/common/MoneyDisplay.jsx`
- [x] T020 [P] Create `EmptyState` component with illustration and call-to-action button in `client/src/components/common/EmptyState.jsx`

**Checkpoint**: Foundation ready. Core UI library and API client verified.

---

## Phase 3: User Story 1 & 2 - Public Landing, Authentication & Session Persistence (Priority: P1) 🎯 MVP Core

**Goal**: Deliver landing page, register new customer (with auto-provisioned Savings account), login with HTTP-only cookies, persist session via `/auth/me`, and revoke session via `/auth/logout`.

### Implementation Tasks:
- [x] T021 Implement `authService` (`register`, `login`, `getProfile`, `logout`) in `client/src/services/authService.js`
- [x] T022 Implement `AuthContext` with session bootstrap, cross-tab sync, and user profile state in `client/src/context/AuthContext.jsx`
- [x] T023 [P] Create route navigation guards (`ProtectedRoute` and `GuestRoute`) in `client/src/routes/ProtectedRoute.jsx` and `client/src/routes/GuestRoute.jsx`
- [x] T024 [P] Build split-screen `AuthLayout` with branded fintech visual panel in `client/src/components/layout/AuthLayout.jsx`
- [x] T025 Build `LoginPage` with email/password validation, loading spinner, and redirect preservation in `client/src/pages/LoginPage.jsx`
- [x] T026 Build `RegisterPage` with password strength indicator, validation, and auto-account provisioning notification in `client/src/pages/RegisterPage.jsx`
- [x] T027 Build flagship `LandingPage` with hero section, live feature cards, security compliance stats, and interactive currency ticker in `client/src/pages/LandingPage.jsx`
- [x] T028 [P] Build public `Footer` component in `client/src/components/layout/Footer.jsx`

**Independent Test**:
- Visitor can view `/`, click "Open Account", register $\to$ receive 201 Created and auto-navigate to `/dashboard`.
- User can log in at `/login`, refresh page $\to$ session persists.
- User clicks "Logout" $\to$ token blacklisted on server and redirected to `/login`.

---

## Phase 4: App Shell & Responsive Navigation (Priority: P1)

**Goal**: Deliver the authenticated dashboard shell with desktop sidebar, off-canvas mobile drawer, and top navigation header.

- [x] T029 Build `Sidebar` component with active route indicators, brand logo, and collapse toggle in `client/src/components/layout/Sidebar.jsx`
- [x] T030 Build `Header` component with active account badge, notifications, and user dropdown in `client/src/components/layout/Header.jsx`
- [x] T031 Build `MobileNav` slide-over drawer for viewports $< 1024px$ in `client/src/components/layout/MobileNav.jsx`
- [x] T032 Assemble `DashboardLayout` integrating Sidebar, Header, MobileNav, and main viewport in `client/src/components/layout/DashboardLayout.jsx`

---

## Phase 5: User Story 3 - Executive Financial Dashboard & Live Balance Aggregation (Priority: P1)

**Goal**: Build the primary banking cockpit displaying real-time aggregated balance ($Credits - $Debits$), quick actions, and recent transaction activity feed.

- [x] T033 Implement `accountService` (`getMyAccounts`, `createAccount`, `depositFaucet`, `getBalance`) in `client/src/services/accountService.js`
- [x] T034 Implement `BankingContext` (manages account list, active account, and global balance refresh trigger) in `client/src/context/BankingContext.jsx`
- [x] T035 Build dynamic `BalanceCard` with metallic gradient, masked account number, currency switcher, and one-click quick actions in `client/src/components/banking/BalanceCard.jsx`
- [x] T036 Build `LedgerSummaryCard` displaying total credits (inflow), total debits (outflow), and net balance in `client/src/components/banking/LedgerSummaryCard.jsx`
- [x] T037 Build `TransactionRow` component with debit/credit badges and formatted timestamps in `client/src/components/banking/TransactionRow.jsx`
- [x] T038 Assemble `DashboardPage` with greeting, BalanceCard, quick actions, LedgerSummaryCard, and recent transactions feed in `client/src/pages/DashboardPage.jsx`

**Independent Test**:
- Navigate to `/dashboard` $\to$ BalanceCard loads live aggregation pipeline data from MongoDB Atlas.
- Shimmer skeletons display smoothly while API requests are in-flight.

---

## Phase 6: User Story 4 - Bank Account Management & Sandbox Faucet (Priority: P1)

**Goal**: Enable users to view all accounts, provision secondary Checking accounts, and fund test accounts via the Faucet deposit modal.

- [x] T039 Build `AccountCard` displaying account type, 10-digit account number (with one-click copy), status badge, and balance in `client/src/components/banking/AccountCard.jsx`
- [x] T040 Build `CreateAccountModal` enabling users to open an additional Checking account (`POST /api/v1/accounts`) in `client/src/components/banking/CreateAccountModal.jsx`
- [x] T041 Build `FaucetDepositModal` supporting $10, $50, $100, $500 presets or custom amounts (`POST /api/v1/accounts/:id/deposit`) in `client/src/components/banking/FaucetDepositModal.jsx`
- [x] T042 Build `AccountsPage` listing all user accounts with "Open Account" and "Deposit Funds" triggers in `client/src/pages/AccountsPage.jsx`

**Independent Test**:
- Open `/accounts` $\to$ view default Savings account.
- Click "Open Account" $\to$ provision Checking account $\to$ new account card renders.
- Click "Deposit Funds" $\to$ deposit $250.00 \to$ balance instantly increases to $250.00.

---

## Phase 7: User Story 5 - Atomic Money Transfer Flow with Idempotency Engine (Priority: P1) 🎯 Critical

**Goal**: Execute atomic multi-document money transfers with client-generated UUID `Idempotency-Key` headers, real-time balance validation, 2-step confirmation review dialog, and rollback safety.

- [x] T043 Implement `transactionService` (`transfer`, `getHistory`, `getTransactionById`) in `client/src/services/transactionService.js`
- [x] T044 Build `TransferModal` two-step confirmation review dialog summarizing source, destination, fee ($0.00), and net debit in `client/src/components/banking/TransferModal.jsx`
- [x] T045 Build `TransactionReceipt` modal with printable/downloadable proof of payment in `client/src/components/banking/TransactionReceipt.jsx`
- [x] T046 Build `TransferPage` with source account selector, recipient selector (internal/external), real-time balance check, UUID v4 `Idempotency-Key` injection, and double-click mitigation in `client/src/pages/TransferPage.jsx`

**Independent Test**:
- Select Savings account ($500 balance) $\to$ enter $100.00 to Checking account $\to$ click "Review Transfer".
- Review modal opens $\to$ click "Confirm Transfer" $\to$ UUID `Idempotency-Key` header sent.
- Success receipt appears $\to$ Savings balance displays $400.00, Checking displays $100.00.
- Double-clicking cannot trigger duplicate transfer.

---

## Phase 8: User Story 6 & 7 - Comprehensive Transaction Journal, Filtering & Receipt Inspection (Priority: P2)

**Goal**: Provide a full-scale transaction journal with status filters (`ALL`, `COMPLETED`, `PENDING`, `FAILED`), search, pagination, and single transaction inspection.

- [x] T047 Build `TransactionTable` with column sorting, status filters, and responsive design in `client/src/components/banking/TransactionTable.jsx`
- [x] T048 Build `TransactionsPage` with search bar, status filter tabs, pagination controls (`?page=1&limit=10`), and empty states in `client/src/pages/TransactionsPage.jsx`
- [x] T049 Implement single transaction drill-down modal (`GET /api/v1/transactions/:id`) displaying timeline, idempotency key, and participant details in `client/src/pages/TransactionDetailPage.jsx`

**Independent Test**:
- Open `/transactions` $\to$ inspect paginated list of transactions.
- Filter by "COMPLETED" $\to$ assert only completed transactions shown.
- Click a transaction $\to$ view complete audit details in receipt modal.

---

## Phase 9: Profile, Security Settings & Error Fallbacks (Priority: P2)

**Goal**: User profile view, email verification status, session revocation, and 404 error page.

- [x] T050 Build `ProfilePage` displaying user credentials, account roles, verification status, and one-click session revocation in `client/src/pages/ProfilePage.jsx`
- [x] T051 Build branded `NotFoundPage` (404) with safe navigation back to `/dashboard` in `client/src/pages/NotFoundPage.jsx`
- [x] T052 Configure master router table in `client/src/routes/AppRoutes.jsx` and mount inside `client/src/App.jsx`

---

## Phase 10: Production Hardening, Testing & Verification

**Purpose**: End-to-end integration testing against MongoDB Atlas, responsive design audit, and production build validation.

- [x] T053 Verify Vite production bundle compiles cleanly with zero errors (`npm run build` in `client/`)
- [x] T054 Verify cross-browser and mobile responsive layout ($375px$, $768px$, $1280px$)
- [x] T055 Run end-to-end live testing flow (Register $\to$ Faucet Deposit $\to$ Transfer $\to$ History $\to$ Logout) against live MongoDB Atlas backend

---

## Dependencies & Execution Order

```
[Phase 1: Setup & Dependencies]
              │
              ▼
[Phase 2: Foundational Utilities, API Client & UI Primitives]
              │
              ▼
[Phase 3: User Story 1 & 2 - Public Landing, Auth & Session]
              │
              ▼
[Phase 4: App Shell & Responsive Navigation]
              │
              ▼
[Phase 5: User Story 3 - Executive Financial Dashboard & Balance]
              │
              ▼
[Phase 6: User Story 4 - Multi-Account Management & Faucet]
              │
              ▼
[Phase 7: User Story 5 - Atomic Transfer Flow & Idempotency] 🎯
              │
              ▼
[Phase 8: User Story 6 & 7 - Transaction Journal & Receipts]
              │
              ▼
[Phase 9: Profile, Security & 404 Fallbacks]
              │
              ▼
[Phase 10: Production Hardening, Testing & Verification]
```
