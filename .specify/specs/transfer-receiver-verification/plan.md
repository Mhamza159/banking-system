# Implementation Plan: Bank Transfer — Receiver Account Verification Flow

**Branch**: `003-transfer-receiver-verification` | **Date**: 2026-09-16 | **Spec**: [`.specify/specs/transfer-receiver-verification/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/transfer-receiver-verification/spec.md)

**Input**: Feature specification from `.specify/specs/transfer-receiver-verification/spec.md`

---

## Summary

Enhance the customer money transfer journey with a non-breaking, pre-flight **Receiver Account Verification Flow**. Before specifying the transfer amount or confirming a transfer, the customer enters the 10-digit destination account number and triggers a verified recipient lookup. The backend checks account existence, ensures an `ACTIVE` status, checks against self-transfer, and securely returns only the account holder's legal name (`User.name`), masked account number, account type, and currency. 

Once verified, the UI renders a verified recipient confirmation card and unlocks the "Proceed to Amount" stage. If the customer alters the account number after verification, the verification state immediately resets to `IDLE` and locks the proceed action until re-verified. The actual financial transaction strictly delegates to the existing atomic double-entry ledger endpoint (`POST /api/v1/transactions/transfer`) with UUID v4 idempotency protection.

---

## Technical Context

- **Backend Runtime & Framework**: Node.js (v18+), Express 4.x, CommonJS
- **Database & ODM**: MongoDB Atlas Replica Set (ACID multi-document sessions), Mongoose 8.x
- **Frontend Stack**: React 18, Vite 5.x, TailwindCSS 3.x, Lucide React icons
- **State Management**: React Context (`BankingContext`, `AuthContext`, `ToastContext`) + local component state machine
- **HTTP Client**: Axios with credentials, CSRF headers, and standard response envelopes (`ApiResponse`, `ApiError`)
- **Primary Constraints**:
  - Zero changes to existing MongoDB schemas or collections.
  - Zero regressions in existing ACID ledger transaction, balance aggregation, or idempotency deduplication.
  - Verification endpoint response time < 200ms.
  - Zero sensitive data exposure (no passwords, hashes, contact info, balances, or internal IDs).

---

## Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT (BROWSER)                               │
└────────────────────────────────────────────────────────────────────────────┘
        │
   1. Enter Recipient Account Number (10 digits)
        │
   2. Click "Verify Account"
        │
        ▼ (GET /api/v1/accounts/recipient/:accountNumber)
┌────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (EXPRESS)                               │
├────────────────────────────────────────────────────────────────────────────┤
│ 3. authMiddleware: Authenticates sender via JWT HttpOnly cookie            │
│ 4. accountController.verifyRecipient:                                      │
│    - Validate 10-digit format                                              │
│    - Query Account.findOne({ accountNumber }).populate("user", "name")     │
│    - Check if account exists (404 if not)                                  │
│    - Check if receiver belongs to sender (flag / validate against self)    │
│    - Check account.status === 'ACTIVE' (400 if FROZEN/CLOSED)              │
│    - Return safe DTO: { accountNumber, accountHolderName, accountType }    │
└────────────────────────────────────────────────────────────────────────────┘
        │
        ▼ (200 OK with safe recipient metadata)
┌────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT VERIFIED RECIPIENT STATE                      │
├────────────────────────────────────────────────────────────────────────────┤
│ 5. Display Verified Recipient Card:                                        │
│    - "Muhammad Ali"                                                        │
│    - "•••• 5350" (Masked)                                                  │
│    - "SAVINGS Account"                                                     │
│ 6. Enable "Proceed to Amount"                                              │
│ 7. If user alters account input: Reset state machine to IDLE & disable     │
│ 8. Enter Amount & Memo -> Click "Review Transfer"                          │
│ 9. TransferModal displays verified holder name & details                   │
│ 10. Confirm Transfer -> POST /api/v1/transactions/transfer with UUID v4   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## API Contract

### New Endpoint: Verify Recipient Account

- **Method**: `GET`
- **Route**: `/api/v1/accounts/recipient/:accountNumber`
- **Authentication**: Required (`authMiddleware`)
- **URL Parameters**:
  - `accountNumber` (string, required): 10-digit account number (or 24-character ObjectId)

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Recipient account verified successfully",
  "data": {
    "account": {
      "accountNumber": "1204395350",
      "accountHolderName": "Muhammad Ali",
      "accountType": "SAVINGS",
      "currency": "USD"
    }
  }
}
```

#### Error Responses
- **400 Bad Request** (Invalid format):
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Please provide a valid 10-digit recipient account number"
    }
  }
  ```
- **400 Bad Request** (Self-Transfer Attempt):
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Cannot transfer funds to the same account"
    }
  }
  ```
- **400 Bad Request** (Account Frozen / Closed):
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "This account is currently unavailable for transfers"
    }
  }
  ```
- **404 Not Found** (Account Does Not Exist):
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "Recipient account not found"
    }
  }
  ```

---

## Project Structure & File Layout

```text
src/
├── controllers/
│   └── account.controller.js       # [MODIFY] Add verifyRecipient handler
├── routes/
│   └── account.routes.js          # [MODIFY] Mount GET /recipient/:accountNumber
client/src/
├── services/
│   └── accountService.js          # [MODIFY] Add verifyRecipient(accountNumber)
├── pages/
│   └── TransferPage.jsx           # [MODIFY] Integrate multi-step verification state machine
├── components/banking/
│   ├── TransferModal.jsx          # [MODIFY] Display verified recipient legal name
│   └── TransactionReceipt.jsx     # [MODIFY] Display recipient name on completion receipt
```

---

## Frontend State Machine (`TransferPage.jsx`)

```typescript
type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'error';

interface VerifiedRecipient {
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  currency: string;
}
```

### State Transition Rules:
1. `idle` (Initial / Reset):
   - "Verify Account" enabled if input length == 10.
   - "Proceed" button disabled.
   - No recipient card displayed.
2. `verifying`:
   - "Verify Account" disabled with spinner (`Verifying recipient...`).
   - "Proceed" button disabled.
   - In-flight abort/guard active.
3. `verified`:
   - Verified Card shown (Green checkmark, holder name, masked number).
   - "Proceed" button enabled.
   - Error messages cleared.
4. `error`:
   - Error alert shown (e.g. "Account not found").
   - "Proceed" button disabled.
   - "Verify Account" re-enabled for correction.
5. **Input Change Trigger**:
   - Whenever `externalAccountNumber` changes, if `verificationStatus !== 'idle'`, force:
     ```javascript
     setVerificationStatus('idle');
     setVerifiedRecipient(null);
     setVerificationError('');
     ```

---

## Security & Architectural Invariants

1. **No Sensitive Data Leaks**: `verifyRecipient` queries only `Account` and `User.name`. Password hashes, email addresses, phone numbers, and balances are explicitly excluded from projection.
2. **Read-Only Non-Mutating Operation**: Recipient verification executes outside MongoDB transactions and performs zero database writes, preventing lock contention.
3. **Defense-in-Depth Authoritative Enforcement**: The frontend verification is an advisory UX convenience. The backend transfer controller (`transfer` in `transaction.controller.js`) independently re-validates sender ownership, recipient existence, active status, currency match, and double-entry ledger balance inside the ACID transaction.
4. **Idempotency Preservation**: UUID v4 key generation remains untouched and is transmitted on the final `POST /api/v1/transactions/transfer`.

---

## Verification & Testing Plan

1. **Unit / Controller Tests**:
   - Verify `verifyRecipient` with valid 10-digit number -> Returns 200 + safe DTO.
   - Verify with invalid format -> Returns 400.
   - Verify non-existent number -> Returns 404.
   - Verify inactive account -> Returns 400.
2. **Frontend Build**:
   - Run `npm run build` in `client/` to verify zero Vite syntax or bundling errors.
3. **End-to-End Browser Flow (Playwright MCP)**:
   - Navigate to `/transfer`.
   - Test invalid account `9999999999` -> Verify error displays and Proceed is disabled.
   - Test valid account `1204395350` -> Verify "Muhammad Ali" appears and Proceed enables.
   - Change account to `1204395351` -> Verify recipient resets to `idle` and Proceed disables.
   - Re-verify valid account, click Proceed, enter $10.00, review modal with recipient name, execute transfer, and verify receipt modal.
