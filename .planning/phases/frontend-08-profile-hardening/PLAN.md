# Phase 8 Plan: User Profile, Security Settings, 404 Fallback & Full-Stack Hardening

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-08-profile-hardening`  
**Goal**: Deliver the User Profile & Security management center, branded 404 error fallback, master routing consolidation, concurrent dev scripts, and end-to-end full-stack verification.  
**Tasks Covered**: T050 through T055 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Phase 8 is the final phase of Milestone 2. It wraps up customer profile inspection, session security revocation, edge-case routing resilience with a branded 404 page, concurrent development scripts, and full-stack integration verification.

---

## Detailed Task Breakdown

### 1. `client/src/pages/ProfilePage.jsx` (T050)
- **KYC & Legal Credentials Card**:
  - Avatar initials badge with glowing obsidian ring.
  - Customer full legal name, verified email address, customer role badge (`CUSTOMER` / `ADMIN`), and registration date (`formatDate`).
- **Linked Accounts Overview**:
  - Summarizes linked accounts belonging to the user (Savings, Checking, 10-digit masked account numbers, currency).
- **Session & Security Card**:
  - 256-bit TLS encryption indicator.
  - Real-time token status indicator (`ACTIVE`).
  - Session revocation trigger ("Revoke Active Session" / "Sign Out on All Devices") that calls `authService.logout()`, invalidating the server token and redirecting to `/login`.
- **Compliance & Privacy Disclaimer**:
  - FDIC insured ledger disclaimer & audit compliance notice.

### 2. `client/src/pages/NotFoundPage.jsx` (T051)
- **Branded 404 Fallback UI**:
  - Obsidian FinTech dark glass card with ambient purple/emerald glow.
  - Large stylized "404" header with financial ledger thematic subtitle ("Coordinates Not Found on Ledger").
  - Clear explanation: "The ledger record, route, or transaction path you requested does not exist or has been relocated."
  - Action buttons: "Return to Cockpit" (navigating to `/dashboard`) and "Visit Public Portal" (navigating to `/`).

### 3. `client/src/routes/AppRoutes.jsx` (T052)
- Register `NotFoundPage` as the catch-all route: `<Route path="*" element={<NotFoundPage />} />`.
- Verify all protected and guest routes are correctly structured within the layout hierarchy.

### 4. Root `package.json` Concurrent Scripts (T054)
- Add `"dev:all"` script in root `package.json` allowing simultaneous startup of backend API and frontend client with a single command.
- Install `concurrently` as a devDependency in root.

### 5. Production Bundle Audit & Verification (T053 & T055)
- Create comprehensive automated test suite `scripts/verify-frontend-phase8.js`.
- Assert presence and exports of `ProfilePage.jsx`, `NotFoundPage.jsx`, and updated `AppRoutes.jsx`.
- Assert `dev:all` script in `package.json`.
- Execute `npm run build` in `client/` and verify zero compiler warnings or errors.
- Run complete verification test suite.

---

## Verification Plan

### 1. Automated Verification Suite (`scripts/verify-frontend-phase8.js`)
- Validates all 6 deliverables across backend, routing, profile, 404 page, scripts, and build artifacts.

### 2. Manual Verification
- Navigate to `http://localhost:5173/profile`:
  - Verify KYC details, role badges, linked accounts, and session revocation button work.
- Navigate to an invalid route `http://localhost:5173/some-invalid-page`:
  - Verify branded `NotFoundPage` renders with return navigation button.
- Check `npm run build` produces clean distribution bundle in `client/dist/`.
