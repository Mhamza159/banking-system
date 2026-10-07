# Phase 11 Plan: Foundational Security Schema, Constants & Velocity Engine

**Milestone**: 3 (Profile Security Settings, Transfer Limits & Transaction TPIN Controls)  
**Phase**: `11-security-schema-velocity-engine`  
**Goal**: Establish the foundational data models, institutional ceilings, and authoritative calculation services required by all profile security, transfer limit, and transaction control user stories.  
**Tasks Covered**: T001 through T003 from [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)  
**Source Documents**:
- Feature Specification: [`.specify/specs/profile-settings-limits-tpin/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/spec.md)
- Architectural Plan: [`.specify/specs/profile-settings-limits-tpin/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/plan.md)
- Actionable Tasks: [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)

---

## Technical Scope & Architecture

In institutional banking, velocity risk controls and PIN authorization require deterministic, tamper-proof state storage and strict calculation rules:
1. **Cryptographic PIN Storage**: TPIN is a dedicated 4-digit numeric code hashed via bcrypt (10 rounds) and excluded from standard queries (`select: false`).
2. **Velocity Boundaries (UTC)**: Daily, weekly, and yearly periods are evaluated on strict UTC calendar boundaries:
   - Daily: `00:00:00.000Z` of the current UTC date
   - Weekly: Monday `00:00:00.000Z` of the current UTC week
   - Yearly: Jan 1 `00:00:00.000Z` of the current UTC year
3. **Database Aggregation**: Real-time velocity is computed dynamically from completed transactions (`status: "COMPLETED"`), guaranteeing that rollbacks, pending transactions, or failed attempts never pollute or falsely consume customer limits.
4. **Institutional Hard Ceilings**: System-wide ceilings prevent users from configuring infinite velocity limits or bypassing risk boundaries.

---

## Deliverables Breakdown

### 1. Institutional System Limits (`src/constants/limits.js`) [Task T001]
- Create `src/constants/limits.js` exporting `SYSTEM_LIMITS`:
  - `TRANSFER`:
    - `MIN`: 100 ($1.00 in cents)
    - `MAX_DAILY`: 50,000,000 ($500,000.00)
    - `MAX_WEEKLY`: 250,000,000 ($2,500,000.00)
    - `MAX_YEARLY`: 1,000,000,000 ($10,000,000.00)
    - `DEFAULT_DAILY`: 500,000 ($5,000.00)
    - `DEFAULT_WEEKLY`: 2,500,000 ($25,000.00)
    - `DEFAULT_YEARLY`: 10,000,000 ($100,000.00)
  - `RECEIVING`:
    - `MIN`: 100 ($1.00 in cents)
    - `MAX_DAILY`: 50,000,000 ($500,000.00)
    - `MAX_WEEKLY`: 250,000,000 ($2,500,000.00)
    - `MAX_YEARLY`: 1,000,000,000 ($10,000,000.00)
    - `DEFAULT_DAILY`: 1,000,000 ($10,000.00)
    - `DEFAULT_WEEKLY`: 5,000,000 ($50,000.00)
    - `DEFAULT_YEARLY`: 20,000,000 ($200,000.00)
  - `TPIN`:
    - `MAX_FAILED_ATTEMPTS`: 5
    - `LOCKOUT_MINUTES`: 15
    - `REGEX`: `/^\d{4}$/`

### 2. User Schema & Security Methods (`src/models/user.model.js`) [Task T002]
- Add fields to `userSchema`:
  - `tpin`: `{ type: String, select: false, default: null }`
  - `tpinFailedAttempts`: `{ type: Number, default: 0 }`
  - `tpinLockedUntil`: `{ type: Date, default: null }`
  - `transferLimits`:
    - `daily`: `{ type: Number, default: 500000 }`
    - `weekly`: `{ type: Number, default: 2500000 }`
    - `yearly`: `{ type: Number, default: 10000000 }`
  - `receivingLimits`:
    - `daily`: `{ type: Number, default: 1000000 }`
    - `weekly`: `{ type: Number, default: 5000000 }`
    - `yearly`: `{ type: Number, default: 20000000 }`
- Virtual property:
  - `hasTpin`: Returns `Boolean(this.tpin)` (or when selected/populated)
- Instance methods:
  - `compareTpin(candidateTpin)`: Returns Promise resolving to `bcrypt.compare(candidateTpin, this.tpin)`
  - `isTpinLocked()`: Returns `Boolean(this.tpinLockedUntil && this.tpinLockedUntil > new Date())`

### 3. Authoritative Velocity Engine (`src/services/velocity.service.js`) [Task T003]
- Implement UTC boundary calculation:
  - `getPeriodBoundaries()`: Returns `{ startOfDay, startOfWeek, startOfYear }` in UTC.
- Implement transfer usage aggregation:
  - `getTransferUsage(senderAccountIds)`: Aggregates sum of `amount` from `Transaction` where `senderAccount IN senderAccountIds` and `status === "COMPLETED"`, segmented into `daily`, `weekly`, and `yearly` periods.
- Implement receiving usage aggregation:
  - `getReceivingUsage(receiverAccountId)`: Aggregates sum of `amount` from `Transaction` where `receiverAccount === receiverAccountId` and `status === "COMPLETED"`, segmented into `daily`, `weekly`, and `yearly` periods.
- Implement transfer validation:
  - `validateTransferLimits(user, senderAccountIds, proposedAmountInCents)`: Checks current usage + proposed amount against `user.transferLimits`. Throws `ApiError.badRequest` detailing which period boundary was exceeded, current usage, and configured limit.
- Implement receiving validation:
  - `validateReceivingLimits(receiverUser, receiverAccountId, proposedAmountInCents)`: Checks receiver's current usage + proposed amount against `receiverUser.receivingLimits`. Throws `ApiError.badRequest` if incoming limit is breached.

### 4. Automated Verification Script (`scripts/test-phase11-velocity.js`)
- Unit & integration testing of:
  - System constants structure and limits
  - User model schema fields, defaults, virtuals, and methods (`compareTpin`, `isTpinLocked`)
  - Bcrypt hashing and comparison of 4-digit TPIN
  - UTC boundary computations (day, week Monday, year Jan 1)
  - Aggregation of transfer and receiving velocity
  - Validation rejection when limits are exceeded, and acceptance when within limits
  - Full system regression check (`scripts/verify-all.js`)

---

## Verification Plan

1. **Phase 11 Test Suite**: Run `node scripts/test-phase11-velocity.js` verifying schema, methods, and velocity calculations.
2. **Regression Check**: Run `node scripts/verify-all.js` to ensure all 5 existing backend test suites pass with zero regressions.
