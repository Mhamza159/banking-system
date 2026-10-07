# Feature Specification: Industry-Standard React Frontend for Banking Backend API

**Feature Branch**: `frontend/react-fintech-app`  
**Created**: 2026-09-15  
**Status**: Draft (Under Review)  
**Input**: Comprehensive prompt requesting a high-end, production-grade fintech frontend in React.js, Vite, and Tailwind CSS integrated with the existing Node.js/Express/MongoDB banking backend.

---

## 1. Executive Summary & Design Principles

The objective is to architect and build a **production-ready, fintech-grade client application** for the completed Banking Backend API. Rather than a basic CRUD interface, the frontend adheres to the visual polish, data density, transactional safety, and responsive craftsmanship found in tier-1 financial products such as Revolut, Wise, Mercury, and Stripe.

### Core Architectural Values
1. **Financial Precision**: All monetary values are rendered from integer cents using formatting utilities (`formatCurrency(cents, currency)`). Zero floating-point drift in client calculations.
2. **Transaction Safety & Idempotency**: All fund transfers generate a client-side UUID v4 `Idempotency-Key` attached via request headers, coupled with double-click mitigation and a 2-step transfer confirmation modal.
3. **Dual Session Architecture**: Seamless support for both HTTP-only cookie credentials (`withCredentials: true`) and fallback Bearer token injection from authenticated state.
4. **Resilient UX**: Non-blocking optimistic states, shimmer skeleton loaders, dedicated empty/error states, and sanitized user-friendly error banners mapping backend `ApiError` payloads.

---

## 2. User Scenarios & Testing (Prioritized User Journeys)

### User Story 1 - Public Marketing, Registration & Instant Account Provisioning (Priority: P1) 🎯 MVP Core

A new visitor visits the banking application, reviews bank features on a landing page, registers with a secure email and password, receives an auto-provisioned 10-digit Savings Account, and is securely transitioned to the authenticated session.

**Why this priority**: Without customer onboarding and account provisioning, no authenticated banking operations can be initiated.

**Independent Test**:
- Visitor can land on `/`, click "Open Account", register with name, email, and password.
- Verification: Receives a 201 response, auth session cookie is stored, default Savings Account is created, and user is redirected directly into `/dashboard` with a welcome banner.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor, **When** navigating to `/`, **Then** render high-fidelity hero section, feature cards, security compliance stats, and CTA buttons.
2. **Given** a user on `/register`, **When** entering invalid email or password under 8 characters, **Then** show client-side inline validation before submission.
3. **Given** valid registration credentials, **When** submitting the form, **Then** show loading spinner on button, disable inputs, call `POST /api/v1/auth/register`, store user context, and navigate to `/dashboard`.
4. **Given** an email already registered, **When** submitting, **Then** catch 409 Conflict and present "Email is already registered. Please log in." alert.

---

### User Story 2 - Secure Authentication, Session Persistence & Blacklist Logout (Priority: P1)

An existing customer logs into their account using email and password, navigates between protected routes without losing state on browser refresh, and can securely terminate their session via token revocation.

**Why this priority**: Essential security gateway ensuring data privacy and server-side token invalidation.

**Independent Test**:
- Log in with valid credentials at `/login` -> Access `/dashboard`.
- Refresh browser -> Session persists via `GET /api/v1/auth/me`.
- Click "Logout" -> Calls `POST /api/v1/auth/logout`, invalidates token in MongoDB Blacklist, clears cookies/state, and redirects to `/login`.
- Pressing browser back button cannot view protected pages.

**Acceptance Scenarios**:
1. **Given** unauthenticated user accessing `/dashboard`, **When** route guard triggers, **Then** redirect to `/login?redirect=/dashboard`.
2. **Given** valid login credentials, **When** submitting `POST /api/v1/auth/login`, **Then** populate Auth Context and navigate to requested redirect route.
3. **Given** an active session, **When** clicking "Logout", **Then** dispatch `POST /api/v1/auth/logout`, purge client state, clear cookies, and show success toast notification.
4. **Given** a revoked/blacklisted session, **When** any API returns 401 Unauthorized, **Then** intercept response globally, reset Auth Context, and transition to `/login`.

---

### User Story 3 - Executive Financial Dashboard & Live Balance Aggregation (Priority: P1)

An authenticated user accesses their central Dashboard to view real-time account balances, active account numbers, recent transaction history, quick-action shortcuts, and financial analytics cards.

**Why this priority**: Core value proposition of the banking client—providing immediate visibility of money and transactions.

**Independent Test**:
- Customer logs in, lands on `/dashboard`, views their primary account card with 10-digit account number, balance derived via MongoDB aggregation pipeline (`$Credits - $Debits`), and recent transaction feed.

**Acceptance Scenarios**:
1. **Given** an active user, **When** dashboard mounts, **Then** fetch accounts via `GET /api/v1/accounts/me` and balance via `GET /api/v1/accounts/:id/balance`.
2. **Given** loading state, **When** API requests are pending, **Then** display sleek pulse skeletons for Balance Card, Quick Actions, and Transaction rows.
3. **Given** an account with zero balance, **When** rendered, **Then** display `$0.00` with an option to fund the account via the Faucet quick-action modal.
4. **Given** accounts loaded, **When** user toggles between multiple accounts (Savings / Checking), **Then** dynamically re-fetch and update the balance and transaction feed for that account.

---

### User Story 4 - Multi-Account Management & Faucet Sandbox Funding (Priority: P1)

A user manages multiple bank accounts (e.g. Primary Savings and Secondary Checking), views account identifiers, and tests account funding using the built-in Faucet deposit mechanism.

**Why this priority**: Allows users to open checking accounts and inject funds into the banking ecosystem for transfer testing without external card processors.

**Independent Test**:
- Navigate to `/accounts` -> View list of accounts.
- Click "Open New Account" -> Select "CHECKING" -> Assert new account provisioned.
- Click "Deposit Funds (Faucet)" -> Enter $250.00 (25,000 cents) -> Assert balance updates to $250.00 immediately.

**Acceptance Scenarios**:
1. **Given** a user with only a Savings account, **When** opening `/accounts`, **Then** show button "Open Checking Account".
2. **Given** user submitting `POST /api/v1/accounts` with `{ accountType: "CHECKING", currency: "USD" }`, **When** successful, **Then** show success toast and append new account card.
3. **Given** an active account, **When** opening Faucet modal, entering `$100.00`, and clicking "Deposit", **Then** dispatch `POST /api/v1/accounts/:id/deposit` with `{ amountInCents: 10000 }`.
4. **Given** successful deposit, **When** API returns 200, **Then** update balance display, log CREDIT ledger entry, and trigger success notification.

---

### User Story 5 - Atomic Transfer Flow with Idempotency & Two-Step Confirmation (Priority: P1) 🎯 Critical

A user initiates a money transfer from their active account to another account. The system validates available balance, verifies account status, presents a confirmation review modal, attaches a unique `Idempotency-Key` header, and handles success/replays gracefully.

**Why this priority**: Fund movement is the critical feature of banking. Must have zero duplicate execution and full rollback awareness.

**Independent Test**:
- Navigate to `/transfer` -> Select sender account -> Enter recipient account ID -> Enter $50.00 -> Click "Review Transfer".
- Modal shows sender, recipient, amount, fee ($0.00), total debit.
- Click "Confirm Transfer" -> Attaches `Idempotency-Key: uuid` -> Submits `POST /api/v1/transactions/transfer`.
- Assert success receipt screen displayed with Transaction ID and updated balance.
- Rapid double-clicking confirm button cannot send 2 requests.

**Acceptance Scenarios**:
1. **Given** transfer form, **When** transfer amount exceeds available balance, **Then** display inline error "Insufficient funds" and disable "Review Transfer" button.
2. **Given** sender selects the same account as recipient, **When** validating, **Then** block with error "Cannot transfer funds to the same account".
3. **Given** confirmation modal open, **When** clicking "Confirm Transfer", **Then** set button state to "Processing...", lock modal, and send request with `Idempotency-Key: uuidv4()`.
4. **Given** network retry with identical idempotency key, **When** backend returns 200 cached receipt, **Then** handle smoothly as successful transfer without warning.

---

### User Story 6 - Comprehensive Transaction Journal, Filtering & Receipt Inspection (Priority: P2)

A user navigates to `/transactions` to inspect their paginated transaction history, filter by status or date, search descriptions, and click any row to open a full transaction receipt modal.

**Why this priority**: Essential for auditability, tracking debits/credits, and generating proof of payment.

**Independent Test**:
- Navigate to `/transactions` -> View paginated table of transfers.
- Filter by "COMPLETED" or search description.
- Click a transaction row -> View full modal displaying Transaction ID, Idempotency Key, timestamp, sender/receiver details, and status badge.

**Acceptance Scenarios**:
1. **Given** user on `/transactions`, **When** mounted, **Then** dispatch `GET /api/v1/transactions/history?page=1&limit=10`.
2. **Given** empty transaction history, **When** returned, **Then** show illustrated empty state "No transactions yet" with CTA "Make your first transfer".
3. **Given** user clicking transaction item, **When** clicked, **Then** open modal and load `GET /api/v1/transactions/:id` with complete timeline breakdown.

---

### User Story 7 - Double-Entry Ledger & Balance Reconciliation View (Priority: P2)

A user or financial auditor views how credit and debit records compose their total balance ($Credits - Debits$), viewing total inflow, total outflow, and net balance.

**Why this priority**: Showcases the core architecture of the backend (double-entry ledger engine) directly in the UI.

**Acceptance Scenarios**:
1. **Given** user on Account Details page, **When** viewing Balance breakdown, **Then** display Total Credits, Total Debits, and Net Balance derived from `GET /api/v1/accounts/:id/balance`.
2. **Given** transactions list, **When** displaying items, **Then** render green `+$X.XX` with arrow-down for CREDIT and dark/red `-$X.XX` with arrow-up for DEBIT.

---

## 3. Edge Cases & Safety Guardrails

- **Network Interruption during Transfer**: When a transfer request times out, provide a "Check Transfer Status" option that verifies transaction history by Idempotency Key rather than blindly re-initiating.
- **Session Expiration Mid-Flow**: If JWT expires or is revoked while the user is filling a form, preserve form data in session storage and restore it after re-authentication.
- **Floating Point Decimal Formatting**: Prevent input bugs like `$10.999` by enforcing two decimal digits and converting directly via `Math.round(value * 100)` to cents.
- **Cross-Currency Attempt**: If cross-currency accounts exist, disable transfer button with "Cross-currency transfers coming soon" tooltip.
- **Multiple Tabs Synchronization**: Sync auth state across tabs using `storage` events so logging out in one tab logs out all open tabs immediately.

---

## 4. Functional Requirements Matrix

- **FR-001**: Application MUST be built with React 18+, Vite, and Tailwind CSS.
- **FR-002**: Application MUST configure an Axios HTTP client with `withCredentials: true` and interceptors for centralized 401 handling and error parsing.
- **FR-003**: System MUST provide client-side validation using standard regular expressions matching backend constraints (RFC 5322 email, password $\ge 8$ chars, positive integer minor units).
- **FR-004**: System MUST store authenticated user state in React Context (`AuthContext`) and verify session on initial load via `GET /api/v1/auth/me`.
- **FR-005**: System MUST protect private routes (`/dashboard`, `/accounts`, `/transfer`, `/transactions`, `/profile`) and redirect unauthorized users to `/login`.
- **FR-006**: System MUST prevent authenticated users from accessing guest routes (`/login`, `/register`).
- **FR-007**: System MUST generate an RFC 4122 UUID v4 for the `Idempotency-Key` header on every money transfer dispatch.
- **FR-008**: System MUST provide a two-step confirmation dialog before submitting transfers.
- **FR-009**: System MUST support account switching if a user holds multiple accounts (SAVINGS and CHECKING).
- **FR-010**: System MUST display financial numbers in high-contrast monospaced or tabular font styles with clear currency symbols.
- **FR-011**: System MUST provide a Faucet deposit modal allowing users to fund test balances in $10, $50, $100, $500 presets or custom amounts.
- **FR-012**: System MUST format dates and timestamps using localized financial format (e.g., `Sep 15, 2026 • 15:30:22`).
- **FR-013**: System MUST implement a responsive sidebar navigation that collapses into an accessible mobile drawer on screens $< 1024px$.
- **FR-014**: System MUST handle server error responses conforming to `{ success: false, error: { code, message, details } }` and present non-technical toasts.

---

## 5. Backend Alignment & Integration Notice

> [!IMPORTANT]
> **Backend Reality Check**:
> 1. **Transfer Recipient**: The existing backend `POST /api/v1/transactions/transfer` requires `receiverAccountId` (MongoDB ObjectId). In the UI, users transferring between their own accounts select the destination account directly. For transfers to external users, we provide an Account Resolver helper in the transfer form (or prompt the user to input the recipient's Account ID / select recent beneficiaries).
> 2. **CORS & Cookies**: Backend `src/app.js` is already configured with `Access-Control-Allow-Credentials: true` and mirrors client origin, permitting seamless local Vite development (`http://localhost:5173`).
> 3. **No Mocking**: Every single page connects to live Node.js/Express endpoints running against MongoDB Atlas.

---

## 6. Success Metrics & Verification Standards

- **SC-001**: 100% of API interactions use live backend endpoints with zero mock data.
- **SC-002**: First Contentful Paint (FCP) $< 0.8s$ on broadband via Vite optimized bundle.
- **SC-003**: 0 floating-point discrepancies in monetary calculations throughout the application.
- **SC-004**: End-to-end user journey (Register $\to$ Faucet Deposit $\to$ Transfer $\to$ History $\to$ Logout) completes without console errors.
- **SC-005**: UI passes WCAG AA contrast ratios with accessible focus rings and keyboard navigation.
