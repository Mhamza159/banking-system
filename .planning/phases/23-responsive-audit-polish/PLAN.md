# Phase 23 Plan: Full Responsive Audit, Accessibility WCAG & Production Polish

**Milestone**: Milestone 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Status**: Ready for Execution  
**Target Date**: 2026-09-18  

---

## 1. Context & Objectives

Phase 23 is the final milestone phase of **Milestone 4: Customer-Facing UI/UX Modernization & Dual-Theme Redesign**.
The goal of this phase is to:
1. **Eliminate All Remaining Hardcoded Dark / Slate Styles**:
   - `FaucetDepositModal.jsx`: Quick preset chips (`bg-white/5` / `text-white`) -> dual-theme tokens (`bg-sunken hover:bg-surface text-text-primary border-border-default`).
   - `CreateAccountModal.jsx`: Checking/Savings account selector tiles (`bg-white/[0.03]` / `text-white`) -> dual-theme tokens.
   - `Footer.jsx`: Global public footer (`bg-slate-950`, `border-white/10`, `text-slate-400`) -> dual-theme surface tokens.
   - `ToastContext.jsx`: Floating notification banners -> semantic theme surface styling.
   - `NotFoundPage.jsx`: 404 page -> `bg-canvas`, `bg-surface`, `text-text-primary`.
   - `AuthLayout.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`: Split-screen auth layout -> dual-theme compatibility, integrate `ThemeToggle` so users can switch themes during onboarding/login.
2. **WCAG AA Accessibility & Contrast Audit**:
   - Ensure proper contrast ratios for text (`text-text-primary`, `text-text-muted`) against surfaces (`bg-surface`, `bg-elevated`, `bg-sunken`).
   - Ensure interactive elements have distinct focus outlines (`focus:ring-2 focus:ring-brand-accent`).
   - Ensure responsive touch targets (minimum 44x44px for touch elements on mobile).
3. **Multi-Viewport Responsive Audit**:
   - Mobile: 375px – 640px (touch nav, mobile drawer, activity cards, full-width modals).
   - Tablet: 768px – 1024px (adaptive grids, responsive sidebars).
   - Desktop: 1280px – 1536px+ (high-density layout, titanium graphics, tables).
4. **Full Production Build & Regression Verification**:
   - Clean Vite production build (`npm --prefix client run build`).
   - 100% pass on all 5 backend verification suites (`node scripts/verify-all.js`).
   - 100% pass on Profile & Security suites (`test-phase12-profile-apis.js`, `test-profile-security.js`).

---

## 2. Implementation Steps

### Step 1: Polish Banking Modals
- Update [`FaucetDepositModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/components/banking/FaucetDepositModal.jsx):
  - Replace preset chips styling with semantic dual-theme tokens.
  - Fix custom amount input labels to use `text-text-muted` and `text-text-primary`.
- Update [`CreateAccountModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/components/banking/CreateAccountModal.jsx):
  - Replace account type buttons with `bg-sunken hover:bg-surface border-border-default` and active states.

### Step 2: Polish Layout & Global Overlays
- Update [`Footer.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/components/layout/Footer.jsx):
  - Convert `bg-slate-950` to `bg-surface border-t border-border-default text-text-muted`.
  - Convert sub-footer `bg-black/40` to `bg-sunken border-border-subtle`.
- Update [`ToastContext.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/context/ToastContext.jsx):
  - Standardize toast banners with theme tokens and high-contrast text.
- Update [`NotFoundPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/pages/NotFoundPage.jsx):
  - Convert to `bg-canvas text-text-primary` with `bg-surface border-border-default`.

### Step 3: Polish Auth Flow & Integrate ThemeToggle
- Update [`AuthLayout.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/components/layout/AuthLayout.jsx):
  - Replace `bg-brand-dark` with `bg-canvas text-text-primary`.
  - Add `ThemeToggle` to the top navigation of AuthLayout so users can switch themes on login/registration pages.
  - Modernize the right-hand fintech graphic panel with semantic dark/light gradients.
- Update [`RegisterPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/client/src/pages/RegisterPage.jsx):
  - Replace `bg-slate-900 border-slate-700` checkbox styling with semantic tokens.

### Step 4: Full Production Verification
- Run `npm --prefix client run build` to confirm 0 errors.
- Run `node scripts/test-phase12-profile-apis.js`.
- Run `node scripts/test-profile-security.js`.
- Run `node scripts/verify-all.js`.
- Create `.planning/phases/23-responsive-audit-polish/SUMMARY.md`.
- Finalize `.planning/STATE.md` and `.planning/ROADMAP.md` marking Milestone 4 100% Complete!
