# Implementation Plan: Profile Settings, Transfer Limits & Transaction TPIN

**Branch**: `005-profile-settings-limits-tpin` | **Date**: 2026-09-17 | **Spec**: [`.specify/specs/profile-settings-limits-tpin/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/spec.md)

**Input**: Feature specification from `.specify/specs/profile-settings-limits-tpin/spec.md`

---

## Summary

Deliver an enterprise-grade customer profile management and transaction security architecture that decouples session authentication from financial authorization. Authenticated users can safely update basic profile attributes (with strict mass-assignment prevention), rotate passwords in-session with current credential verification, manage a dedicated 4-digit cryptographic Transaction PIN (TPIN), and define personal velocity transfer and receiving limits.

All outbound transfers on `POST /api/v1/transactions/transfer` will strictly enforce:
1. Valid 4-digit TPIN verification with automated 15-minute brute-force lockout protection (after 5 failed attempts).
2. Outgoing daily, weekly, and yearly velocity limit compliance derived from authoritative MongoDB completed ledger records.
3. Incoming daily, weekly, and yearly receiving limit compliance for the counterparty.
4. Hardened system maximum ceilings that prevent arbitrary limit inflation.

All existing double-entry accounting invariants, ACID multi-document transactions, and RFC 4122 UUID v4 idempotency caching are preserved with zero breaking changes.

---

## Technical Context

- **Backend Runtime & Framework**: Node.js (v18+), Express 4.x / 5.x, CommonJS
- **Database & ODM**: MongoDB Atlas Replica Set, Mongoose 8.x
- **Cryptographic Algorithms**: bcrypt (10 rounds) for passwords and TPINs, HMAC-SHA256 for JWT session tokens
- **Frontend Stack**: React 18, Vite 5.x, TailwindCSS 3.x, Lucide React icons
- **State Management**: React Context (`BankingContext`, `AuthContext`, `ToastContext`)
- **HTTP Client**: Centralized Axios client (`withCredentials: true`, unified `ApiResponse` / `ApiError`)
- **Primary Constraints**:
  - Zero modifications to existing Double-Entry Ledger accounting logic (`DEBIT` == `CREDIT`).
  - Zero regressions in existing ACID transaction session loop or idempotency deduplication.
  - Server-authoritative velocity calculation; zero trust placed in client-supplied limits or calculations.
  - TPIN and passwords must NEVER be logged, stored in plaintext, or returned in API responses.

---

## Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           1. PROFILE SETTINGS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  GET /api/v1/profile            -> Profile, Limits, hasTpin, and live usage │
│  PATCH /api/v1/profile          -> Whitelist update: name only              │
│  PATCH /api/v1/profile/password -> Verify currentPassword -> bcrypt hash    │
│  POST /api/v1/profile/tpin      -> Set initial 4-digit TPIN (bcrypt hash)   │
│  PATCH /api/v1/profile/tpin     -> Verify currentTpin -> hash new TPIN      │
│  PATCH /api/v1/profile/limits   -> Update limits within SYSTEM_LIMITS       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                 2. ENHANCED TRANSFER AUTHORIZATION FLOW                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Frontend: TransferModal collects 4-digit TPIN alongside transferData     │
│ 2. POST /api/v1/transactions/transfer (Idempotency-Key header + body.tpin)  │
│                                                                             │
│                                    │                                        │
│                                    ▼                                        │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ GATE 1: TPIN VERIFICATION                                              │  │
│ │ - Check user.tpin exists (400 if not configured)                       │  │
│ │ - Check user.isTpinLocked() (403 if lockout active)                    │  │
│ │ - Compare candidate PIN with stored hash (bcrypt)                      │  │
│ │ - If mismatch: increment failedAttempts (lock at 5), return 401        │  │
│ │ - If match: reset failedAttempts                                       │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ GATE 2: VELOCITY LIMIT VALIDATION                                      │  │
│ │ - Aggregate completed sender transactions for Daily, Weekly, Yearly    │  │
│ │ - Verify: currentUsage + transferAmount <= senderLimits                │  │
│ │ - Aggregate completed receiver transactions for Daily, Weekly, Yearly  │  │
│ │ - Verify: currentUsage + transferAmount <= receiverLimits              │  │
│ │ - If breached: return 400 Bad Request with limit details               │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ GATE 3: EXISTING ACID LEDGER EXECUTION                                 │  │
│ │ - Verify Account Status (Sender & Receiver ACTIVE)                     │  │
│ │ - Verify Balance in MongoDB Session                                    │  │
│ │ - Create Transaction (PENDING)                                         │  │
│ │ - Write Double-Entry Ledger (DEBIT Sender, CREDIT Receiver)            │  │
│ │ - Update Transaction (COMPLETED)                                       │  │
│ │ - Commit Session Atomically                                            │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Blueprint

### 1. Model & Schema Changes

#### [MODIFY] `src/models/user.model.js`
Extend `userSchema` with TPIN security attributes and velocity limits:

```javascript
// TPIN Security Fields
tpin: {
  type: String,
  select: false,
  default: null
},
tpinFailedAttempts: {
  type: Number,
  default: 0
},
tpinLockedUntil: {
  type: Date,
  default: null
},

// Velocity Limits (Stored in minor unit cents)
transferLimits: {
  daily: { type: Number, default: 500000 },    // $5,000.00
  weekly: { type: Number, default: 2500000 },  // $25,000.00
  yearly: { type: Number, default: 10000000 }  // $100,000.00
},
receivingLimits: {
  daily: { type: Number, default: 1000000 },   // $10,000.00
  weekly: { type: Number, default: 5000000 },  // $50,000.00
  yearly: { type: Number, default: 20000000 }  // $200,000.00
}
```

**Instance Methods to add to `userSchema`**:
- `compareTpin(candidateTpin)`: Returns `bcrypt.compare(candidateTpin, this.tpin)`.
- `isTpinLocked()`: Returns `this.tpinLockedUntil && this.tpinLockedUntil > new Date()`.
- Virtual `hasTpin`: Returns `Boolean(this.tpin)`.

---

### 2. Constants & System Boundary Configuration

#### [NEW] `src/constants/limits.js`
Institutional hard ceilings preventing users from setting arbitrary astronomical limits:

```javascript
const SYSTEM_LIMITS = {
  TRANSFER: {
    MIN: 100,             // $1.00 minimum
    MAX_DAILY: 50000000,   // $500,000.00 maximum daily
    MAX_WEEKLY: 250000000, // $2,500,000.00 maximum weekly
    MAX_YEARLY: 1000000000 // $10,000,000.00 maximum yearly
  },
  RECEIVING: {
    MIN: 100,
    MAX_DAILY: 50000000,
    MAX_WEEKLY: 250000000,
    MAX_YEARLY: 1000000000
  },
  TPIN: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_MINUTES: 15
  }
};

module.exports = SYSTEM_LIMITS;
```

---

### 3. Velocity Calculation Service

#### [NEW] `src/services/velocity.service.js`
Authoritative calculations querying MongoDB for completed transaction totals:

```javascript
/**
 * Computes calendar boundary UTC dates
 */
function getPeriodBoundaries() {
  const now = new Date();

  // UTC Daily Start: 00:00:00.000Z
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  // UTC Weekly Start: Monday 00:00:00.000Z
  const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfDay.getUTCDate() - diffToMonday);

  // UTC Yearly Start: Jan 1 00:00:00.000Z
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));

  return { startOfDay, startOfWeek, startOfYear };
}
```

**Methods**:
- `getTransferUsage(senderAccountIds)`: Aggregates sum of `amount` from `Transaction` where `senderAccount IN senderAccountIds`, `status == "COMPLETED"`, grouped by `createdAt >= startOfDay`, `startOfWeek`, `startOfYear`.
- `getReceivingUsage(receiverAccountId)`: Aggregates sum of `amount` from `Transaction` where `receiverAccount == receiverAccountId`, `status == "COMPLETED"`.
- `validateTransferLimits(user, senderAccountIds, proposedAmountInCents)`: Throws `ApiError.badRequest` if daily, weekly, or yearly outgoing limits are exceeded.
- `validateReceivingLimits(receiverUser, receiverAccountId, proposedAmountInCents)`: Throws `ApiError.badRequest` if daily, weekly, or yearly incoming limits are exceeded.

---

### 4. Profile & Security Controllers

#### [NEW] `src/controllers/profile.controller.js`
- **`getProfile`**: Returns user profile with `{ id, name, email, role, isEmailVerified, hasTpin, isTpinLocked, tpinLockedUntil, transferLimits, receivingLimits, currentUsage }`.
- **`updateProfile`**: Mass-assignment protected handler. Extracts only `name` from `req.body`. Rejects/ignores protected fields.
- **`changePassword`**: Validates `currentPassword` with `user.comparePassword()`. Validates `newPassword` ($\ge 8$ chars, format, not equal to old password). Saves re-hashed password.
- **`setTpin`**: Validates user has no TPIN set yet. Validates 4 numeric digits (`/^\d{4}$/`). Hashes TPIN with bcrypt (10 rounds) and saves.
- **`changeTpin`**: Validates `currentTpin` (or `password`). Validates `newTpin` (4 digits, different from old). Hashes and updates TPIN, resetting failed attempts.
- **`updateLimits`**: Validates requested `transferLimits` and `receivingLimits` against `SYSTEM_LIMITS`. Persists to user document.

#### [NEW] `src/routes/profile.routes.js`
Mounts under `/api/v1/profile` with `authMiddleware` applied globally:
- `GET /` -> `profileController.getProfile`
- `PATCH /` -> `profileController.updateProfile`
- `PATCH /password` -> `profileController.changePassword`
- `POST /tpin` -> `profileController.setTpin`
- `PATCH /tpin` -> `profileController.changeTpin`
- `PATCH /limits` -> `profileController.updateLimits`

Register route in `server.js`: `app.use("/api/v1/profile", profileRoutes)`.

---

### 5. Transfer Controller Integration

#### [MODIFY] `src/controllers/transaction.controller.js`
Enhance the existing `transfer` handler prior to starting the MongoDB session:

1. **Extract and Validate TPIN**:
   ```javascript
   const { tpin } = req.body;
   if (!tpin || typeof tpin !== "string" || !/^\d{4}$/.test(tpin.trim())) {
     throw ApiError.badRequest("4-digit Transaction PIN (TPIN) is required");
   }

   // Load user with +tpin
   const senderUser = await User.findById(req.user._id).select("+tpin");
   if (!senderUser.tpin) {
     throw ApiError.badRequest("Transaction PIN is not configured. Please set your 4-digit TPIN in Profile Settings before transferring funds.");
   }

   // Check lockout
   if (senderUser.isTpinLocked()) {
     const remainingMin = Math.ceil((senderUser.tpinLockedUntil - Date.now()) / 60000);
     throw ApiError.forbidden(`Transaction PIN is temporarily locked due to repeated failed attempts. Please try again in ${remainingMin} minute(s).`);
   }

   // Compare TPIN
   const isTpinValid = await senderUser.compareTpin(tpin.trim());
   if (!isTpinValid) {
     senderUser.tpinFailedAttempts = (senderUser.tpinFailedAttempts || 0) + 1;
     if (senderUser.tpinFailedAttempts >= SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS) {
       senderUser.tpinLockedUntil = new Date(Date.now() + SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES * 60 * 1000);
     }
     await senderUser.save();

     const attemptsLeft = Math.max(0, SYSTEM_LIMITS.TPIN.MAX_FAILED_ATTEMPTS - senderUser.tpinFailedAttempts);
     throw ApiError.unauthorized(
       attemptsLeft > 0
         ? `Incorrect Transaction PIN. ${attemptsLeft} attempt(s) remaining before temporary lockout.`
         : `Transaction PIN locked for ${SYSTEM_LIMITS.TPIN.LOCKOUT_MINUTES} minutes due to repeated failed attempts.`
     );
   }

   // Reset failed attempts on success
   if (senderUser.tpinFailedAttempts > 0) {
     senderUser.tpinFailedAttempts = 0;
     senderUser.tpinLockedUntil = null;
     await senderUser.save();
   }
   ```

2. **Validate Velocity Limits**:
   ```javascript
   // Validate Sender Transfer Limits
   await velocityService.validateTransferLimits(senderUser, [sender._id], amountInCents);

   // Validate Receiver Receiving Limits
   const receiverUser = await User.findById(receiver.user._id || receiver.user);
   if (receiverUser) {
     await velocityService.validateReceivingLimits(receiverUser, receiver._id, amountInCents);
   }
   ```

3. **Proceed into existing ACID Session**:
   Existing multi-document session, balance verification, double-entry ledger journal, and idempotency logic execute unchanged!

---

### 6. Frontend Presentation Layer

#### [NEW] `client/src/services/profileService.js`
Centralized service for profile, password, TPIN, and limits:
- `getProfile()`
- `updateProfile(data)`
- `changePassword(data)`
- `setTpin(tpin, confirmTpin)`
- `changeTpin(currentTpin, newTpin, confirmTpin)`
- `updateLimits(limits)`

#### [MODIFY] `client/src/pages/ProfilePage.jsx`
Redesign `/profile` with modern, responsive tabbed sections:
- **Tab 1: Identity & Profile**: View credentials, edit legal full name with inline save/cancel.
- **Tab 2: Password & Credentials**: Current password, new password with strength meter, confirmation.
- **Tab 3: Transaction Security (TPIN)**:
  - Status indicator: "TPIN Enabled" (emerald) or "TPIN Not Set" (amber).
  - Setup modal / form if not set (enter 4 digits, confirm).
  - Change modal / form if already set (current PIN + new PIN).
- **Tab 4: Transfer & Receiving Limits**:
  - Daily, Weekly, Yearly cards for Outbound Transfers with live usage progress bars.
  - Daily, Weekly, Yearly cards for Inbound Receiving with live usage progress bars.
  - Edit modal allowing customers to adjust limits within system maximums.

#### [MODIFY] `client/src/components/banking/TransferModal.jsx`
Add the 4-digit PIN verification step before final confirmation:
- Embedded 4-box masked PIN input with numeric keyboard, auto-advance, backspace handling, and visibility toggle.
- Clear error notification if TPIN is incorrect or locked.
- Prominent banner directing user to configure TPIN in Settings if `user.hasTpin === false`.

#### [MODIFY] `client/src/pages/TransferPage.jsx`
- Pass `tpin` into `handleExecuteTransfer` calling `transactionService.transfer({ ...payload, tpin })`.

---

## File Structure Plan

```text
Banking System/
├── src/
│   ├── constants/
│   │   ├── limits.js              # [NEW] System limit constants and ceilings
│   ├── controllers/
│   │   ├── profile.controller.js  # [NEW] Profile, password, TPIN, limits handlers
│   │   ├── transaction.controller.js # [MODIFY] Add TPIN & velocity limit gates
│   ├── models/
│   │   ├── user.model.js          # [MODIFY] Add tpin, attempts, lockout, limits
│   ├── routes/
│   │   ├── profile.routes.js      # [NEW] Route definitions for /api/v1/profile
│   ├── services/
│   │   ├── velocity.service.js    # [NEW] UTC boundary queries & limit validation
│   └── server.js                  # [MODIFY] Mount profile.routes.js
│
├── client/src/
│   ├── components/banking/
│   │   ├── TransferModal.jsx      # [MODIFY] Add 4-digit TPIN input
│   ├── pages/
│   │   ├── ProfilePage.jsx        # [MODIFY] Redesign into tabbed settings cockpit
│   │   ├── TransferPage.jsx       # [MODIFY] Pass TPIN in transfer execution
│   └── services/
│       ├── profileService.js      # [NEW] API client for profile & security settings
│
└── scripts/
    └── test-profile-security.js   # [NEW] Comprehensive test suite for all new gates
```

---

## Security Audit Checklist

| Threat Vector | Mitigation Strategy |
|---|---|
| **Mass Assignment** | Strict field whitelist in `profile.controller.js`. Only `name` is extracted. `role`, `_id`, `isEmailVerified`, and `password` are discarded. |
| **TPIN Brute-Force** | Rate limiting: 5 failed attempts locks TPIN for 15 minutes (`tpinLockedUntil`). Server-enforced. |
| **TPIN Data Leakage** | `tpin` stored as bcrypt hash with `select: false`. Never returned in API responses, never logged, never exposed to client. |
| **Client-Side Limit Bypass** | Limits checked and derived exclusively on backend via MongoDB aggregation. Client limits are purely decorative. |
| **Limit Inflation Bypass** | `SYSTEM_LIMITS` ceiling constants strictly reject user inputs exceeding system maximums. |
| **Transaction Bypass** | `tpin` is a required field on `POST /transactions/transfer`. Endpoint halts before starting MongoDB ACID session if invalid. |
| **Idempotency Replay Safety** | TPIN failure does not create cached transaction; retry with correct TPIN and same idempotency key succeeds cleanly. |
| **Ledger Invariant Protection** | Zero writes to `Ledger` or `Transaction` collections if TPIN or limits fail. |

---

## Verification & Testing Strategy

1. **Automated Backend Suite (`scripts/test-profile-security.js`)**:
   - Verify `PATCH /profile` updates name and ignores mass-assignment attempts (`role: "ADMIN"`).
   - Verify `PATCH /profile/password` rejects incorrect current password and accepts valid new password.
   - Verify `POST /profile/tpin` sets 4-digit numeric PIN.
   - Verify `PATCH /profile/limits` accepts valid limits and rejects values exceeding system ceilings.
   - Verify transfer rejection without TPIN.
   - Verify transfer rejection with incorrect TPIN and lockout after 5 failed attempts.
   - Verify transfer rejection when daily transfer limit is exceeded.
   - Verify transfer rejection when recipient daily receiving limit is exceeded.
   - Verify successful transfer with valid TPIN and compliant limits.
2. **Regression Testing**:
   - Run `node scripts/verify-all.js` to ensure all 5 Milestone 1 & 2 suites pass without regressions.
3. **Frontend Production Build**:
   - Run `npm --prefix client run build` to confirm zero compilation or TypeScript/JSX errors.
