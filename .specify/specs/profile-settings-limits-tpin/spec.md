# Feature Specification: Customer Profile Settings, Transfer Limits & Transaction TPIN

**Feature Branch**: `005-profile-settings-limits-tpin`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: User description: "Banking Application — Profile Settings, Transfer Limits & Transaction TPIN"

---

## Technical Context & Architectural Alignment

The existing platform is an enterprise-grade full-stack MERN banking application with MongoDB Atlas ACID transactions, double-entry immutable ledgers, HttpOnly JWT sessions with TTL blacklisting, and pre-flight recipient verification.

This specification introduces a comprehensive customer profile and transaction security architecture:
1. **Editable Profile**: Safe attribute updating with strict mass-assignment guards against role escalation or identity tampering.
2. **Credential Lifecycle**: In-session password updates with current password verification and strength constraints.
3. **Transaction PIN (TPIN)**: A dedicated 4-digit cryptographic authorization code required for all financial transfers, protected against brute-force guessing via rate limiting and temporary lockouts.
4. **Velocity Limits**: User-defined daily, weekly, and yearly transfer and receiving caps, enforced server-side against authoritative ledger history within immutable system maximum boundaries.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 4-Digit Transaction PIN (TPIN) Setup & Transfer Authorization (Priority: P1) 🎯 MVP

As an authenticated bank customer,  
I want to set a dedicated 4-digit numeric Transaction PIN (TPIN) and enter it to authorize all outbound transfers,  
So that unauthorized parties or compromised session tokens cannot execute monetary transactions without my explicit transaction-level authorization.

**Why this priority**:  
In financial platforms, session authentication (login password / JWT) and transaction authorization must be decoupled. If an authenticated browser session is left open or hijacked, a distinct TPIN prevents unauthorized fund drains.

**Independent Test**:  
1. Navigate to Profile / Settings $\to$ Transaction Security $\to$ Set TPIN.
2. Enter 4 numeric digits (e.g. `7294`) and confirm. Verify successful hash creation and that plain TPIN is never returned.
3. Navigate to `/transfer`, select recipient and enter amount.
4. Review transfer modal: enter TPIN `7294` $\to$ transfer executes atomically with 201 Created.
5. Attempt transfer with wrong TPIN `0000` $\to$ transfer is rejected with 401 Unauthorized; zero database mutations or ledger debits occur.

**Acceptance Scenarios**:

1. **Given** an authenticated customer without a configured TPIN,  
   **When** they submit a valid 4-digit numeric TPIN with matching confirmation,  
   **Then** the backend hashes the TPIN using bcrypt (10 rounds), saves it with `select: false`, and updates user status to `hasTpin: true`.

2. **Given** a customer attempting a money transfer on `/transfer`,  
   **When** they have not configured a TPIN,  
   **Then** the transfer is blocked server-side with `400 Bad Request` ("Transaction PIN is not configured. Please configure your TPIN in Profile & Security Settings").

3. **Given** a customer submitting an outbound transfer with an invalid TPIN,  
   **When** the backend verifies the PIN against the stored hash,  
   **Then** the transfer aborts immediately, `tpinFailedAttempts` increments by 1, and the response indicates remaining attempts without creating any transaction record or ledger entry.

4. **Given** 5 consecutive incorrect TPIN submissions within a rolling 15-minute window,  
   **When** the 5th attempt fails,  
   **Then** the user's TPIN is locked for 15 minutes (`tpinLockedUntil = Date.now() + 15m`), rejecting subsequent attempts with `403 Forbidden` until the lockout expires.

5. **Given** an authenticated user wishing to change their TPIN,  
   **When** they provide their current TPIN along with a new 4-digit TPIN and confirmation,  
   **Then** the backend verifies the current TPIN before hashing and storing the new TPIN, resetting failed attempt counters.

---

### User Story 2 - Server-Enforced Transfer & Receiving Velocity Limits (Priority: P1)

As an account holder managing personal risk,  
I want to configure custom daily, weekly, and yearly limits for both sending and receiving money,  
So that my accounts are protected against accidental high-value transfers, compromised credential drains, or unintended high-velocity inflows.

**Why this priority**:  
Velocity controls are fundamental regulatory and personal risk mitigation tools. Without server-authoritative velocity checks, accounts are vulnerable to rapid depletion.

**Independent Test**:  
1. Set daily transfer limit to $500.00 ($50,000 cents).
2. Transfer $300.00 successfully (recorded in ledger).
3. Attempt second transfer of $250.00 ($300 + $250 = $550 > $500).
4. Verify backend rejects transfer with `400 Bad Request` citing daily limit exhaustion ($300.00 used, $200.00 remaining).
5. Verify zero ledger entries or balance deductions occur on rejection.

**Acceptance Scenarios**:

1. **Given** an authenticated user configuring transfer and receiving limits,  
   **When** they submit daily, weekly, and yearly limit values within system maximum boundaries,  
   **Then** the limits are persisted in the user profile in integer cents.

2. **Given** a user attempting to set a daily transfer limit of $10,000,000 (exceeding system maximum of $500,000),  
   **When** the update request is validated,  
   **Then** the backend rejects the request with `400 Bad Request` enforcing system ceiling constraints.

3. **Given** an outbound transfer request,  
   **When** the backend validates the transaction,  
   **Then** it queries authoritative completed ledger transactions for the sender across Daily (00:00:00 UTC to now), Weekly (Monday 00:00:00 UTC to now), and Yearly (Jan 1 00:00:00 UTC to now) periods, rejecting the transfer if any limit is breached.

4. **Given** an inbound transfer request directed at a recipient,  
   **When** the proposed amount plus recipient's current usage exceeds the recipient's daily, weekly, or yearly receiving limits,  
   **Then** the transfer is rejected server-side with `400 Bad Request` ("Recipient daily receiving limit exceeded") before entering the ACID commit block.

5. **Given** failed or cancelled transactions in the ledger history,  
   **When** usage aggregation runs,  
   **Then** only transactions with status `COMPLETED` are counted toward velocity consumption.

---

### User Story 3 - Protected Profile Management & Mass-Assignment Prevention (Priority: P2)

As an authenticated customer,  
I want to update my basic profile information (such as legal display name) from the Profile & Settings page,  
So that my account reflects my current legal identity while critical security properties remain tamper-proof.

**Why this priority**:  
Customers require self-service profile management, but mass assignment vulnerabilities could allow malicious users to elevate roles to `ADMIN` or alter account status.

**Independent Test**:  
1. Send `PATCH /api/v1/profile` with `{ name: "Alexander Hamilton Wright" }` $\to$ verify name updates.
2. Send `PATCH /api/v1/profile` with `{ name: "New Name", role: "ADMIN", isEmailVerified: true }` $\to$ verify `name` updates but `role` remains `CUSTOMER` and `isEmailVerified` is unaltered.

**Acceptance Scenarios**:

1. **Given** an authenticated user,  
   **When** they update their name with valid format (2–100 characters),  
   **Then** the profile updates successfully and returns the sanitized user object.

2. **Given** an update payload containing protected fields (`_id`, `role`, `isEmailVerified`, `password`, `tpin`, `createdAt`),  
   **When** processed by the profile controller,  
   **Then** protected fields are strictly stripped/ignored via a whitelist schema filter.

---

### User Story 4 - Secure In-Session Password Change (Priority: P2)

As an authenticated customer,  
I want to change my account login password by verifying my current password,  
So that I can routinely rotate my credentials or respond to suspected password compromise without having to log out.

**Why this priority**:  
Standard credential rotation requires verifying current password ownership to prevent unauthorized password resets from unattended workstations.

**Independent Test**:  
1. Submit password change with incorrect current password $\to$ verify rejection with 401 Unauthorized.
2. Submit password change where new password equals current password $\to$ verify rejection with 400 Bad Request.
3. Submit password change where confirmation does not match $\to$ verify rejection with 400 Bad Request.
4. Submit valid current password and compliant new password $\to$ verify 200 OK and successful login with new password.

**Acceptance Scenarios**:

1. **Given** an authenticated user submitting a password change request,  
   **When** `currentPassword` fails `user.comparePassword()`,  
   **Then** the request is rejected with `401 Unauthorized` ("Current password is incorrect").

2. **Given** a new password that does not meet security criteria ($\ge 8$ characters, matching confirmation, different from current),  
   **When** validated,  
   **Then** the request returns `400 Bad Request` with descriptive validation errors.

3. **Given** a successful password change,  
   **When** saved to MongoDB,  
   **Then** the password is automatically re-hashed with bcrypt (10 rounds) and the previous token is optionally revoked or refreshed.

---

### User Story 5 - Unified Profile & Security Settings Dashboard UI (Priority: P3)

As a banking customer,  
I want a consolidated, modern tabbed interface on `/profile` allowing me to navigate between Identity, Security & Password, Transaction PIN, and Transfer Limits,  
So that I have a single executive cockpit to audit and manage all my security controls.

**Why this priority**:  
Consolidating settings into clear tabs with real-time usage meters elevates user trust and reduces navigation friction.

**Independent Test**:  
1. Open `/profile` in browser; verify tab navigation (Overview, Security, TPIN, Limits).
2. Check Limits tab: view interactive cards for Daily, Weekly, and Yearly transfer/receiving limits with live usage progress bars.
3. Test TPIN modal: verify 4 masked PIN input boxes with numeric validation and toggle visibility.

**Acceptance Scenarios**:

1. **Given** a user viewing `/profile`,  
   **When** clicking the "Security Settings" tab,  
   **Then** forms for Profile Editing, Password Change, and TPIN Management are displayed with current status badges ("TPIN Configured" / "TPIN Not Set").

2. **Given** the Limits tab on `/profile`,  
   **When** loaded,  
   **Then** current velocity usage is displayed as progress bars alongside configured limit values and remaining allowances.

3. **Given** the Transfer flow review dialog on `/transfer`,  
   **When** moving to final execution,  
   **Then** a secure 4-digit PIN input prompt is presented with auto-focus and masked dots before firing the transfer request.

---

## Edge Cases & Failure Modes

- **Concurrent TPIN Brute-Force**: Multiple simultaneous requests guessing TPIN are serialized using atomic `$inc` or MongoDB version locking so lockout triggers accurately after 5 attempts.
- **Clock Drift / Timezone Mismatch**: All daily, weekly, and yearly windows are computed strictly on the backend using ISO UTC boundaries (`00:00:00.000Z`), never client local time.
- **Cross-Currency Velocity Aggregation**: Limits are stored in integer cents (USD standard). If multi-currency transfers occur, amounts are normalized to the user's primary limit currency before comparison.
- **Internal vs External Transfer Limits**: Internal transfers between accounts owned by the same user do not decrement external counterparty limits, or apply a separate internal threshold to avoid locking out self-rebalancing.
- **Zero or Negative Limits**: Submitting negative limit values is rejected by schema validators with `400 Bad Request`.
- **System Ceilings**: A system configuration (`SYSTEM_LIMIT_CEILINGS`) enforces maximum possible values:
  - Max Daily Transfer: $500,000.00 ($50,000,000 cents)
  - Max Weekly Transfer: $2,500,000.00 ($250,000,000 cents)
  - Max Yearly Transfer: $10,000,000.00 ($1,000,000,000 cents)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support updating basic user profile fields (`name`) via `PATCH /api/v1/profile` while strictly blocking mass-assignment of protected attributes (`role`, `_id`, `isEmailVerified`, `password`, `tpin`).
- **FR-002**: System MUST allow users to change passwords via `PATCH /api/v1/profile/password` by validating `currentPassword` with bcrypt before hashing and saving `newPassword`.
- **FR-003**: System MUST store a 4-digit numeric Transaction PIN (TPIN) hashed with bcrypt (10 rounds) in the User document (`select: false`), never storing or exposing plaintext.
- **FR-004**: System MUST reject any outbound transfer on `POST /api/v1/transactions/transfer` if the customer has not configured a TPIN or if the submitted TPIN fails verification.
- **FR-005**: System MUST lock TPIN authorization for 15 minutes after 5 consecutive incorrect TPIN attempts.
- **FR-006**: System MUST allow customers to set their initial TPIN via `POST /api/v1/profile/tpin` and change existing TPIN via `PATCH /api/v1/profile/tpin` (requiring current TPIN or password verification).
- **FR-007**: System MUST store configurable customer transfer limits (`daily`, `weekly`, `yearly`) and receiving limits (`daily`, `weekly`, `yearly`) on the user profile in integer cents with sensible default values.
- **FR-008**: System MUST enforce that user-configured limits cannot exceed global system ceiling constants.
- **FR-009**: System MUST calculate velocity consumption by aggregating completed transactions (`status: "COMPLETED"`) within UTC calendar boundaries:
  - Daily: Current date `00:00:00.000Z` to now.
  - Weekly: Monday of current week `00:00:00.000Z` to now.
  - Yearly: January 1 of current year `00:00:00.000Z` to now.
- **FR-010**: System MUST reject outbound transfers if the proposed amount exceeds remaining daily, weekly, or yearly transfer limits.
- **FR-011**: System MUST reject transfers if the proposed amount exceeds the recipient's remaining daily, weekly, or yearly receiving limits.
- **FR-012**: System MUST preserve all existing double-entry ledger invariants, ACID MongoDB transaction sessions, and UUID v4 idempotency caching without regression.
- **FR-013**: System MUST update the `/transfer` review dialog to require the 4-digit TPIN prior to final transfer dispatch.
- **FR-014**: System MUST provide an interactive Settings cockpit on `/profile` with tabs for Profile, Security, TPIN, and Limits with live usage visualization.

---

### Key Entities & Data Models

#### 1. `User` Schema Extension (`src/models/user.model.js`)
```javascript
{
  // Existing fields: name, email, password, role, isEmailVerified
  
  // TPIN Security Sub-document
  tpin: {
    type: String,
    select: false, // Hidden from standard queries
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

  // User-Defined Velocity Limits (in cents)
  transferLimits: {
    daily: { type: Number, default: 500000 },    // $5,000.00 default
    weekly: { type: Number, default: 2500000 },  // $25,000.00 default
    yearly: { type: Number, default: 10000000 }  // $100,000.00 default
  },
  receivingLimits: {
    daily: { type: Number, default: 1000000 },   // $10,000.00 default
    weekly: { type: Number, default: 5000000 },  // $50,000.00 default
    yearly: { type: Number, default: 20000000 }  // $200,000.00 default
  }
}
```

#### 2. System Velocity Ceilings (`src/constants/limits.js`)
```javascript
const SYSTEM_LIMITS = {
  TRANSFER: {
    MAX_DAILY: 50000000,    // $500,000.00
    MAX_WEEKLY: 250000000,  // $2,500,000.00
    MAX_YEARLY: 1000000000  // $10,000,000.00
  },
  RECEIVING: {
    MAX_DAILY: 50000000,    // $500,000.00
    MAX_WEEKLY: 250000000,  // $2,500,000.00
    MAX_YEARLY: 1000000000  // $10,000,000.00
  }
};
```

---

## API Specifications

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/profile` | Required | Retrieve current user profile, limit settings, TPIN status, and current usage |
| `PATCH` | `/api/v1/profile` | Required | Update legal full name (mass-assignment protected) |
| `PATCH` | `/api/v1/profile/password` | Required | Change account password (requires `currentPassword`) |
| `POST` | `/api/v1/profile/tpin` | Required | Configure initial 4-digit TPIN |
| `PATCH` | `/api/v1/profile/tpin` | Required | Change existing TPIN (requires `currentTpin` or `password`) |
| `GET` | `/api/v1/profile/limits` | Required | Fetch velocity limits and calculated usage |
| `PATCH` | `/api/v1/profile/limits` | Required | Update daily/weekly/yearly transfer and receiving limits |
| `POST` | `/api/v1/transactions/transfer` | Required | Executes transfer; requires `tpin` in request body alongside idempotency header |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of outbound transfers require a valid 4-digit TPIN; missing or incorrect TPIN returns `400`/`401` with zero ledger writes.
- **SC-002**: 5 consecutive incorrect TPIN attempts reliably trigger a 15-minute lockout.
- **SC-003**: 100% of transfers breaching daily, weekly, or yearly transfer limits are rejected before session creation.
- **SC-004**: 100% of transfers breaching recipient receiving limits are rejected before session creation.
- **SC-005**: All existing 5 backend verification test suites pass without regression.
- **SC-006**: Production build compilation (`npm --prefix client run build`) completes with 0 errors.
- **SC-007**: Response latency for velocity check and TPIN verification overhead remains under 50ms.

---

## Assumptions

1. **Limit Scope**: Limits are configured at the customer (`User`) level across their portfolio of accounts, ensuring global risk control for the customer identity.
2. **Currency Base**: Default limits and calculations operate in the base integer currency unit (cents / USD).
3. **Idempotency Scope**: TPIN verification failures do not burn or record an idempotency key as completed; subsequent retries with the correct TPIN and same key can proceed normally.
4. **Email Notifications**: Password changes and TPIN modification events trigger non-blocking asynchronous email alerts to the customer.
