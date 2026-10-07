# Phase 12 Plan: Profile Management, Password Rotation & TPIN Management APIs

**Milestone**: 3 (Profile Security Settings, Transfer Limits & Transaction TPIN Controls)  
**Phase**: `12-profile-apis-tpin-management`  
**Goal**: Implement and mount `/api/v1/profile` routes providing mass-assignment protected profile updates, in-session password rotation, TPIN setup and rotation with lockout protection, and configurable velocity limits validated against institutional system ceilings.  
**Tasks Covered**: T004, T006, T008, T009, T010 from [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)  
**Source Documents**:
- Feature Specification: [`.specify/specs/profile-settings-limits-tpin/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/spec.md)
- Architectural Plan: [`.specify/specs/profile-settings-limits-tpin/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/plan.md)
- Actionable Tasks: [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)

---

## Technical Scope & Architecture

1. **Mass-Assignment Defense**: Self-service profile updates accept ONLY whitelisted fields (`name`). Sensitive attributes (`role`, `email`, `isEmailVerified`, `password`, `tpin`, `_id`) are stripped and never updated via the generic profile handler.
2. **In-Session Password Rotation**: Requires verification of `currentPassword` using `user.comparePassword()`, ensures `newPassword` differs from `currentPassword`, satisfies minimum length ($\ge 8$), and hashes with bcrypt (10 rounds) upon save.
3. **TPIN Management**:
   - `POST /api/v1/profile/tpin`: Initial setup with 4 numeric digits (`/^\d{4}$/`). Blocked with 409 Conflict if TPIN is already set.
   - `PATCH /api/v1/profile/tpin`: Secure rotation verifying `currentTpin` with `user.compareTpin()`. Enforces anti-brute-force lockout (5 failed attempts $\to$ 15-minute lockout). Enforces that `newTpin` differs from `currentTpin`.
4. **Velocity Limit Governance**:
   - `GET /api/v1/profile/limits`: Returns configured limits, system ceilings, and live spending/receiving usage from `velocityService`.
   - `PATCH /api/v1/profile/limits`: Validates customer-requested limits against `SYSTEM_LIMITS` institutional ceilings and relational invariants (`daily <= weekly <= yearly`).
5. **Route Mounting**:
   - Create `src/routes/profile.routes.js` with `authMiddleware` applied.
   - Mount under `/api/v1/profile` in `src/routes/index.js`.

---

## Deliverables Breakdown

### 1. Profile & Security Controller (`src/controllers/profile.controller.js`) [Tasks T004, T006, T008, T009]
- `getProfile`: Returns sanitized user profile, `hasTpin`, `isTpinLocked`, `tpinLockedUntil`, configured `transferLimits` and `receivingLimits`, `systemCeilings`, and live velocity usage across the user's accounts.
- `updateProfile`: Mass-assignment safe update allowing only `name` (2–100 chars).
- `changePassword`: Verifies `currentPassword`, validates `newPassword === confirmPassword`, rejects duplicate password, persists bcrypt hash.
- `setTpin`: Confirms user has no existing TPIN, validates 4 numeric digits, persists bcrypt hash.
- `changeTpin`: Validates `currentTpin`, checks lockout state, increments failed attempts on mismatch (locks after 5 failures for 15 mins), verifies `newTpin` is 4 digits and distinct from current PIN, updates TPIN and resets failed counters.
- `getLimits`: Returns user transfer and receiving limits, institutional ceilings, and current period usage.
- `updateLimits`: Validates positive integers, enforces `daily <= weekly <= yearly`, enforces `SYSTEM_LIMITS` maximum ceilings, persists limits.

### 2. Profile Router & App Integration (`src/routes/profile.routes.js`, `src/routes/index.js`) [Task T010]
- Define router with endpoints:
  - `GET /` -> `getProfile`
  - `PATCH /` -> `updateProfile`
  - `PATCH /password` -> `changePassword`
  - `POST /tpin` -> `setTpin`
  - `PATCH /tpin` -> `changeTpin`
  - `GET /limits` -> `getLimits`
  - `PATCH /limits` -> `updateLimits`
- Mount in `src/routes/index.js`: `router.use("/profile", profileRoutes)`.

### 3. Automated Verification Suite (`scripts/test-phase12-profile-apis.js`)
Comprehensive test script validating:
1. `GET /api/v1/profile` returns sanitized profile with `hasTpin: false` for new user.
2. `PATCH /api/v1/profile` updates name but strictly ignores `role: "ADMIN"` and `isEmailVerified: true` (mass-assignment defense).
3. `PATCH /api/v1/profile/password` rejects incorrect current password (401), rejects identical new password (400), and succeeds with valid credentials.
4. `POST /api/v1/profile/tpin` rejects invalid formats, requires confirmation match, successfully configures TPIN (201), and rejects second call (409 Conflict).
5. `PATCH /api/v1/profile/tpin` rejects invalid current TPIN (401), tracks failed attempts, triggers 15-min lockout on 5th failure (403), rejects locked user, and updates TPIN on valid input.
6. `GET /api/v1/profile/limits` returns limits and real-time usage.
7. `PATCH /api/v1/profile/limits` rejects amounts exceeding system ceilings ($500k daily ceiling), rejects relational violations (`daily > weekly`), and persists valid limits.
8. Full system regression test (`scripts/verify-all.js`).

---

## Verification Plan

1. **Phase 12 Test Suite**: Run `node scripts/test-phase12-profile-apis.js` verifying all 7 endpoints and security guards.
2. **Regression Verification**: Run `node scripts/verify-all.js` to ensure all 5 existing backend test suites pass with zero regressions.
