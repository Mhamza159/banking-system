# Phase 22 Plan: Profile & Security Cockpit Modular Redesign

**Milestone**: Milestone 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Status**: Ready for Execution  
**Target Date**: 2026-09-18  

---

## 1. Context & Objectives

`ProfilePage.jsx` is currently a monolithic 1085-line file containing four distinct customer settings tabs inline:
1. Profile & Identity (Legal name update, KYC tier, email, linked accounts)
2. Credentials & Password (In-session rotation, session revocation)
3. Transaction PIN / TPIN (Initial configuration, rotation, 15-minute brute-force lockout defense)
4. Velocity Limits & Risk (Daily, weekly, yearly outbound & inbound spending limits, interactive progress bars, system ceilings)

### Critical Deficiencies to Resolve:
1. **Monolithic Architecture**: 1,085 lines in a single component makes maintainability, testing, and isolated tab re-renders difficult.
2. **Hardcoded Slate/White Colors**: Contains hardcoded `bg-brand-card/90`, `border-white/10`, `text-slate-400`, `bg-white/[0.02]` instead of the Phase 16 dual-theme semantic tokens (`bg-surface`, `bg-elevated`, `bg-sunken`, `text-text-primary`, `text-text-muted`, `border-border-default`, `border-border-subtle`).
3. **Database ID Leaks**: Exposes raw MongoDB ObjectIds in the Linked Accounts portfolio (`ID: 6aac...`).
4. **Developer Jargon**: Contains backend internal references ("Stored with bcrypt (10 rounds) and excluded from queries", "JWT blacklist server", "Cryptographic protections").

---

## 2. Proposed Architecture & Component Decomposition

We will create a modular `client/src/components/profile/` directory:

```
client/src/components/profile/
├── ProfileNavTabs.jsx      # Semantic tab selector with status indicators
├── IdentityTab.jsx         # Legal name editing, verified KYC status, linked accounts (no Mongo ID leaks)
├── PasswordTab.jsx         # Password rotation form + Session revocation card
├── TpinTab.jsx             # 4-digit PIN setup/change, lockout countdown, security defense card
└── LimitsTab.jsx           # Outbound & Inbound limits form, progress bars, system ceiling rules
```

`client/src/pages/ProfilePage.jsx` will be decomposed into a clean, orchestrated parent component (under ~200 lines) managing top-level profile fetching, active tab state, and passing necessary props/handlers.

---

## 3. Implementation Steps

### Step 1: Create `ProfileNavTabs.jsx`
- Migrate tab container to `bg-surface border border-border-default`.
- Active tab button: `bg-brand-accent/15 text-brand-accent border border-brand-accent/30`.
- Inactive tab button: `text-text-muted hover:text-text-primary hover:bg-elevated`.
- Accessible badges/pills for TPIN status (Active vs. Not Configured).

### Step 2: Create `IdentityTab.jsx`
- Legal name update form with semantic `Card`, `Input`, `Button`.
- Read-only KYC Tier 2 verification card.
- Linked Accounts Portfolio:
  - Eliminate `ID: {id}` raw MongoDB ObjectId display.
  - Display Account Type, masked Account Number (`•••• 1234`), Currency, and Active Status Badge.
  - Apply semantic tokens: `bg-elevated hover:bg-surface border-border-subtle`.

### Step 3: Create `PasswordTab.jsx`
- In-Session Password Rotation:
  - Current Password, New Password, Confirm New Password fields with semantic `Input`.
  - Accessible feedback banners.
- Active Session Security Card:
  - Customer-friendly explanation of session termination.
  - Logout trigger button with danger styling.

### Step 4: Create `TpinTab.jsx`
- TPIN Lockout Alert Banner with active expiration countdown.
- Initial TPIN setup view (for users without a PIN).
- TPIN rotation view (for users with an active PIN) with disabled state during lockout.
- Bank-Grade Protection Explainer Card (eliminate "bcrypt 10 rounds" jargon; replace with "Irreversible bank-grade encryption").

### Step 5: Create `LimitsTab.jsx`
- Regulatory System Ceilings Banner with semantic surface styling.
- Outbound & Inbound Spending Limit sections with dual-theme cards.
- Interactive progress bars showing usage percentage, remaining balance, and configured ceiling with color codes (`bg-emerald-500`, `bg-amber-500`, `bg-rose-500`).
- Relational validation (`Daily ≤ Weekly ≤ Yearly`) and system ceiling guard.

### Step 6: Refactor `ProfilePage.jsx`
- Replace inline JSX with modular sub-components.
- Modernize top header banner and "Refresh State" button.
- Ensure seamless error handling and feedback toasts.

---

## 4. Verification Plan

1. **Client Build Verification**:
   - `npm --prefix client run build` (Must build with 0 errors).
2. **Profile & Security Test Suites**:
   - `node scripts/test-phase12-profile-apis.js` (37/37 assertions pass).
   - `node scripts/test-profile-security.js` (27/27 assertions pass).
3. **Full Backend Integration Regression**:
   - `node scripts/verify-all.js` (All 5 backend suites pass).
4. **Documentation**:
   - Create `.planning/phases/22-profile-security-cockpit/SUMMARY.md`.
   - Update `.planning/STATE.md` and `.planning/ROADMAP.md`.
