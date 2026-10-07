# Phase 2 Plan: Authentication, Session Lifecycle & Public Marketing

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-02-auth-marketing`  
**Goal**: Deliver high-converting public landing page, customer registration with auto-provisioned 10-digit Savings Account notification, login with HTTP-only cookies, session bootstrap/hydration via `/auth/me`, cross-tab logout synchronization, and route navigation guards (`ProtectedRoute` / `GuestRoute`).  
**Tasks Covered**: T021 through T028 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Phase 2 builds the core authentication engine and marketing front door of the banking platform. It establishes persistent user sessions against the live backend (`:3000`), protects private banking routes, and guides public visitors into the onboarding funnel.

### 1. Backend Authentication Contract (Verified)
- `POST /api/v1/auth/register`:
  - Request: `{ name, email, password }`
  - Response: `{ success: true, data: { token, user: { id, name, email, role }, account: { id, accountNumber, accountType, currency, status } }, message }`
  - Cookie: `token` (HttpOnly, SameSite: Strict)
  - Auto-provisions: 10-digit Savings Account with status `ACTIVE`.
- `POST /api/v1/auth/login`:
  - Request: `{ email, password }`
  - Response: `{ success: true, data: { token, user: { id, name, email, role } }, message }`
  - Cookie: `token` (HttpOnly, SameSite: Strict)
- `GET /api/v1/auth/me`:
  - Request: (Authenticated via cookie or Bearer header)
  - Response: `{ success: true, data: { user: { id, name, email, role, isEmailVerified, createdAt } } }`
- `POST /api/v1/auth/logout`:
  - Request: (Authenticated)
  - Response: `{ success: true, message: "Logged out successfully" }`
  - Backend action: Revokes cookie, adds token to MongoDB `Blacklist` collection.

---

## Proposed Architecture & Component Design

### 1. `client/src/services/authService.js` (T021)
- `register({ name, email, password })`: Calls `POST /auth/register`. Returns `{ user, account, token }`.
- `login({ email, password })`: Calls `POST /auth/login`. Returns `{ user, token }`.
- `getProfile()`: Calls `GET /auth/me`. Returns `{ user }`.
- `logout()`: Calls `POST /auth/logout`. Clears any local cache.

### 2. `client/src/context/AuthContext.jsx` (T022)
- State management:
  - `user`: Sanitized user object (`id`, `name`, `email`, `role`, etc.)
  - `isAuthenticated`: Boolean
  - `isLoading`: Boolean (defaults to `true` on cold start until `/auth/me` resolves)
- Cold-Start Session Hydration:
  - On mount `useEffect`: calls `authService.getProfile()`. If 200, sets `user` and `isAuthenticated = true`. If 401, sets `user = null`, `isAuthenticated = false`. Sets `isLoading = false`.
- Broadcast & Sync Listeners:
  - Listens for `window.addEventListener('banking:unauthorized')` (fired by `api.js` response interceptor on 401): immediately resets `user` and redirects cleanly without infinite loop.
  - Cross-tab logout sync: `window.addEventListener('storage')` listening for `banking:logout` timestamp event.
- Exported API: `{ user, isAuthenticated, isLoading, login, register, logout, refreshProfile }`.

### 3. Route Navigation Guards (T023)
- `client/src/routes/ProtectedRoute.jsx`:
  - Evaluates `isLoading` $\to$ renders full-page sleek fintech skeleton/spinner loader if checking session.
  - If `!isAuthenticated` $\to$ `<Navigate to="/login" state={{ from: location }} replace />`.
  - If `isAuthenticated` $\to$ `<Outlet />` or `children`.
- `client/src/routes/GuestRoute.jsx`:
  - Evaluates `isLoading` $\to$ renders loader.
  - If `isAuthenticated` $\to$ `<Navigate to="/dashboard" replace />`.
  - If `!isAuthenticated` $\to$ `<Outlet />` or `children`.

### 4. Split-Screen `AuthLayout.jsx` (T024)
- Left/Primary Column (Mobile: Full screen, Desktop: 50% width): Form container with brand logo, back to home link, and dark obsidian glassmorphism card.
- Right Column (Desktop only $\ge 1024px$): High-end fintech visual panel:
  - Metallic obsidian backdrop with emerald/indigo ambient glow.
  - Floating mock visual card displaying real-time balance metrics (`$124,500.00`).
  - Security badges: "256-bit AES Encryption", "ACID Compliant Ledger", "Automated Fraud Shield".
  - Social proof quote / compliance certification.

### 5. `LoginPage.jsx` (T025)
- Form fields: Email and Password with `Input` primitive (mail icon prefix, password visibility toggle).
- Real-time client-side validation using `isValidEmail`.
- Submission handling: Calls `login({ email, password })`.
- Success handling: Shows toast `"Welcome back, {user.name}!"`, navigates to `location.state?.from?.pathname || '/dashboard'`.
- Error handling: Displays specific backend error message (e.g. `"Invalid email or password"`).
- Link to register page.

### 6. `RegisterPage.jsx` (T026)
- Form fields: Full Name, Email, Password, Confirm Password.
- Password strength meter using `getPasswordStrength(password)`:
  - Dynamic score (Weak, Medium, Strong, Excellent) with multi-segment color bar.
- Auto-provisioned Account Callout:
  - Highlighting: *"Your account comes with an auto-provisioned 10-digit Savings Account ready for instant deposits and transfers."*
- Submission handling: Calls `register({ name, email, password })`.
- Success handling: Shows success modal or toast `"Account created! Savings account {accountNumber} provisioned"`, navigates to `/dashboard`.
- Link to login page.

### 7. Flagship `LandingPage.jsx` (T027) & `Footer.jsx` (T028)
- Hero Section:
  - Dynamic headline: *"Next-Generation Banking Engine with Cryptographic & Ledger Integrity"*.
  - Subtitle highlighting double-entry ledger, zero float drift, and instant atomic transfers.
  - Dual CTAs: *"Open Free Account"* (`/register`) and *"Sign In"* (`/login`).
- Live Feature Cards:
  - 1. Multi-Document ACID Transactions (MongoDB Atlas 4.0+ replica set with rollback guarantees).
  - 2. Double-Entry Balanced Ledger (Inflow/Outflow debit-credit parity).
  - 3. Cryptographic Idempotency Engine (UUID v4 replay prevention).
  - 4. Real-time Notifications & Fraud Alerts.
- Security & Compliance Bar:
  - Live animated metric counters: 99.99% Uptime, $0.00 Float Drift, <50ms Settlement.
- Interactive Currency Ticker / Exchange Rates preview.
- Public `Footer.jsx`:
  - Branded links, legal disclaimers, GitHub source link, copyright.

### 8. Router Connection (`client/src/routes/AppRoutes.jsx` & `client/src/App.jsx`)
- Wire up `react-router-dom` with:
  - `/` $\to$ `LandingPage`
  - `/login` $\to$ `GuestRoute` $\to$ `AuthLayout` $\to$ `LoginPage`
  - `/register` $\to$ `GuestRoute` $\to$ `AuthLayout` $\to$ `RegisterPage`
  - `/dashboard` $\to$ `ProtectedRoute` $\to$ Placeholder Dashboard view (to be expanded in Phase 3/4)
  - `*` $\to$ Branded 404 redirect.

---

## Detailed Task Breakdown

| Task ID | Component / File | Purpose |
|---|---|---|
| **T021** | `client/src/services/authService.js` | Connect `api.js` to `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout` |
| **T022** | `client/src/context/AuthContext.jsx` | Global auth state, session bootstrap on mount, cross-tab sync, 401 listener |
| **T023** | `client/src/routes/ProtectedRoute.jsx`<br>`client/src/routes/GuestRoute.jsx` | Route guards preventing unauthorized or duplicate auth access |
| **T024** | `client/src/components/layout/AuthLayout.jsx` | Split-screen fintech layout with visual graphic panel and trust badges |
| **T025** | `client/src/pages/LoginPage.jsx` | Controlled login form with inline validation, spinner, and redirect preservation |
| **T026** | `client/src/pages/RegisterPage.jsx` | Registration form with password strength bar and auto-account prompt |
| **T027** | `client/src/pages/LandingPage.jsx` | High-converting marketing hero, features, security metrics, and live ticker |
| **T028** | `client/src/components/layout/Footer.jsx` | Responsive footer with brand links, disclaimers, and copyright |

---

## Verification Plan

### 1. Automated & Build Checks
- Run `npm run build` in `client/` to verify 0 syntax or bundling errors.

### 2. Manual E2E Flow Verification against MongoDB Atlas Backend
1. **Public Marketing Flow**:
   - Navigate to `http://localhost:5173/` $\to$ verify Hero, Feature Cards, Compliance Bar, and Footer render cleanly.
2. **Registration Flow (T026)**:
   - Click "Open Free Account" $\to$ enter `name`, `email`, `password`.
   - Verify password strength meter updates dynamically.
   - Click "Create Account" $\to$ verify `POST /api/v1/auth/register` creates user and auto-provisions 10-digit Savings account.
   - Verify success toast and auto-navigation to `/dashboard`.
3. **Session Hydration Flow (T022)**:
   - On `/dashboard`, perform hard refresh (`F5`).
   - Verify session remains active via `GET /api/v1/auth/me` without flickering back to login.
4. **Guest Route Guard (T023)**:
   - While logged in, attempt to navigate to `/login` or `/register` $\to$ verify automatic redirection to `/dashboard`.
5. **Logout Flow (T021/T022)**:
   - Click "Log Out" $\to$ verify `POST /api/v1/auth/logout` revokes cookie, token blacklisted in MongoDB, user redirected to `/login`.
6. **Protected Route Guard (T023)**:
   - While logged out, navigate directly to `/dashboard` $\to$ verify redirection to `/login` with `state: { from: '/dashboard' }`.
