# Phase 14 Plan: Frontend Profile & Security Settings Cockpit

**Milestone**: 3 (Profile Security Settings, Transfer Limits & Transaction TPIN Controls)  
**Phase**: `14-frontend-profile-settings-cockpit`  
**Goal**: Build the client API service layer and transform `ProfilePage.jsx` into an institutional, tabbed Profile & Security Settings Cockpit supporting mass-assignment safe name editing, in-session password rotation, TPIN configuration & rotation with lockout indicators, and velocity limits management with live usage progress bars.  
**Tasks Covered**: T011 and T012 from [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)  
**Source Documents**:
- Feature Specification: [`.specify/specs/profile-settings-limits-tpin/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/spec.md)
- Architectural Plan: [`.specify/specs/profile-settings-limits-tpin/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/plan.md)
- Actionable Tasks: [`.specify/specs/profile-settings-limits-tpin/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/profile-settings-limits-tpin/tasks.md)

---

## Technical Scope & Architecture

The frontend settings cockpit provides complete self-service control over customer identity, credentials, cryptographic transaction authorization, and risk velocity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Profile & Security Settings Cockpit                   │
├────────────────────────────────────────────────────────────────────────┤
│ [👤 Profile & Identity] [🔑 Security] [🛡️ TPIN Controls] [⚡ Limits]    │
├────────────────────────────────────────────────────────────────────────┤
│ TAB 1: Profile & Identity                                              │
│ - Edit Legal Display Name (with inline validation & save)              │
│ - Read-only Verified Email & KYC Badge                                 │
│ - Linked Accounts Portfolio                                            │
│                                                                        │
│ TAB 2: Credentials & Password                                          │
│ - In-session password rotation form (Current, New, Confirm)            │
│ - Requirements checklist & session revocation button                   │
│                                                                        │
│ TAB 3: Transaction Security (TPIN)                                     │
│ - Active TPIN Status Badge                                             │
│ - Lockout Alert Banner (if locked: 15-min countdown / warning)         │
│ - Setup Form (if no TPIN) vs Rotation Form (if TPIN active)            │
│                                                                        │
│ TAB 4: Velocity Limits & Usage                                         │
│ - Daily, Weekly, Yearly Outbound Limits + Real-Time Usage Progress     │
│ - Daily, Weekly, Yearly Inbound Limits + Real-Time Usage Progress      │
│ - Live Remaining Capacity Calculation                                  │
│ - Institutional Ceiling Limits Guidance                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Deliverables Breakdown

### 1. Profile Service Client (`client/src/services/profileService.js`) [Task T011]
- Create `client/src/services/profileService.js` exporting:
  - `getProfile()`: Calls `GET /profile`
  - `updateProfile({ name })`: Calls `PATCH /profile`
  - `changePassword({ currentPassword, newPassword, confirmPassword })`: Calls `PATCH /profile/password`
  - `setTpin({ tpin, confirmTpin })`: Calls `POST /profile/tpin`
  - `changeTpin({ currentTpin, newTpin, confirmTpin })`: Calls `PATCH /profile/tpin`
  - `getLimits()`: Calls `GET /profile/limits`
  - `updateLimits({ transferLimits, receivingLimits })`: Calls `PATCH /profile/limits`

### 2. Tabbed Cockpit Component (`client/src/pages/ProfilePage.jsx`) [Task T012]
- Redesign `ProfilePage.jsx` into 4 interactive tabs:
  - **Tab 1 (`identity`)**: Profile details, legal name edit input, save handler with feedback, linked accounts list.
  - **Tab 2 (`password`)**: Password rotation form with current password verification and confirmation check. Session revocation CTA.
  - **Tab 3 (`tpin`)**: TPIN status, lockout alert banner, setup form for new users, rotation form for existing users with 4-digit formatting and PIN masking toggle.
  - **Tab 4 (`limits`)**: Transfer and receiving velocity limits configuration inputs (converted to/from cents), progress bars displaying live consumption vs limit, remaining capacity, and system ceiling hints.

### 3. Automated Verification & Build
- Run Vite production compilation: `npm --prefix client run build` to verify 0 syntax or bundle errors.
- Run automated frontend verification script or browser test to validate tab switching, profile updates, password change, TPIN setup, and limit modification.

---

## Verification Plan

1. **Frontend Production Build**: Run `npm --prefix client run build` to verify clean build with 0 TypeScript/JSX errors.
2. **Master Backend Regression Suite**: Run `node scripts/verify-all.js` to ensure the entire backend API remains 100% operational.
