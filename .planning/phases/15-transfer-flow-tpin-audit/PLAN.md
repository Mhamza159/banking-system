# Phase 15: Frontend Transfer Flow TPIN Integration & Full-Stack Audit

## Objective
Seamlessly integrate 4-digit Transaction PIN (TPIN) verification into the customer money transfer flow (`TransferModal.jsx` and `TransferPage.jsx`), provide clear visual feedback for PIN errors and brute-force lockouts, and conduct a full-stack end-to-end audit and regression verification across both frontend builds and backend test suites.

---

## Tasks Covered
From `.specify/specs/profile-settings-limits-tpin/tasks.md`:
- **T013 [US5]**: Update `client/src/components/banking/TransferModal.jsx` with 4-box masked TPIN input, auto-focus/advance, backspace navigation, paste support, inline error displays, and unconfigured/lockout callouts.
- **T014 [US5]**: Update `client/src/pages/TransferPage.jsx` to collect `tpin` from the review modal and dispatch to `transactionService.transfer({ ...payload, tpin }, idempotencyKey)`.
- **T015 [US5]**: Update `client/src/services/transactionService.js` to formally document and guarantee `tpin` forwarding in transfer payloads.
- **T016**: Create and execute comprehensive automated test script `scripts/test-profile-security.js` verifying all profile security and transfer control rules.
- **T017**: Run frontend production compilation (`npm --prefix client run build`) ensuring zero syntax or bundle errors.
- **T018**: Run platform regression suite (`node scripts/verify-all.js`) ensuring all existing milestone tests pass 100%.

---

## Proposed Changes

### 1. Backend Auth Controller
- **[`src/controllers/auth.controller.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/src/controllers/auth.controller.js)**:
  - In `getProfile` (`GET /api/v1/auth/me`), expose `hasTpin: req.user.isTpinSet` and `isTpinLocked: req.user.isTpinLocked()`.
  - Ensures that when customer logs in or page hydrates, `useAuth().user` immediately reflects TPIN configuration and lockout status.

### 2. Frontend Transfer Review Modal
- **[`client/src/components/banking/TransferModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/components/banking/TransferModal.jsx)**:
  - Add 4-box TPIN input:
    - 4 individual digit boxes with masked styling (`•` or numeric text with toggle).
    - Auto-advance on keystroke, backspace jump to previous box, paste handler splitting 4 digits.
    - Responsive mobile keyboard support (`inputMode="numeric"`, `pattern="[0-9]*"`).
  - Unconfigured TPIN Banner: If customer has not set a TPIN, displays amber warning with direct link/button to `/profile` and disables "Authorize & Send".
  - Lockout Banner: If account is locked due to brute-force attempts, displays crimson lockout notice with remaining time.
  - Inline Error Display: Shows "Incorrect TPIN · X attempts remaining" directly inside the modal and clears PIN inputs for retry without closing the dialog.

### 3. Frontend Transfer Page
- **[`client/src/pages/TransferPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/pages/TransferPage.jsx)**:
  - Update `handleExecuteTransfer` to accept `tpin` argument from `TransferModal`.
  - Forward `tpin` in the payload to `transactionService.transfer({ ..., tpin })`.
  - Manage modal-specific error state so TPIN errors do not close the modal abruptly.

### 4. Comprehensive Full-Stack Audit Script
- **[`scripts/test-profile-security.js`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/scripts/test-profile-security.js)**:
  - Tests entire customer lifecycle from registration to profile update, password rotation, TPIN configuration, anti-brute-force lockout, velocity limits, and atomic transfer execution.

---

## Verification Plan
1. **Frontend Compilation**:
   ```powershell
   npm --prefix client run build
   ```
2. **Milestone 3 Full-Stack Automated Suite**:
   ```powershell
   node scripts/test-profile-security.js
   ```
3. **Master Regression Test Runner**:
   ```powershell
   node scripts/verify-all.js
   ```
