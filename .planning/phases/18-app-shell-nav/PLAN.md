# Phase 18 Plan: Global App Shell, Header, Sidebar & Responsive Navigation

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `18-app-shell-nav`  
**Goal**: Migrate the entire application shell — `DashboardLayout`, `Header`, `Sidebar`, and `MobileNav` — to Phase 16 semantic tokens, add the `ThemeToggle` into the Header, replace all `brand-*` dark legacy utilities with `bg-canvas`/`bg-surface`/`text-text-primary` equivalents, and eliminate the database-jargon subtitle "Core Ledger Engine" from the brand mark.

---

## Objective & Scope

The shell components are the first thing every authenticated user sees. Currently they are hardcoded to the dark theme using `bg-brand-dark`, `bg-brand-card`, `border-white/10`, `text-slate-400`, etc. This phase:

1. Migrates all hardcoded utilities to semantic tokens.
2. Mounts `ThemeToggle` in the Header (between the Ledger Status badge and Notifications).
3. Removes customer-facing database jargon ("Core Ledger Engine") from the brand tagline → replaces with "Institutional Banking Platform".
4. Ensures the `DashboardLayout` root div uses `bg-canvas` instead of `bg-brand-dark`.
5. Preserves all business logic, routing, account switching, logout, and responsive behavior 100%.

---

## Files in Scope

| File | Size | Primary Issues |
|---|---|---|
| `DashboardLayout.jsx` | 35 lines | `bg-brand-dark text-slate-100` root |
| `Header.jsx` | 255 lines | `bg-brand-dark/80 border-white/10` header bar; `bg-brand-card border-white/10` popovers; `text-slate-400/300/white` throughout; `brand-accent` active; missing ThemeToggle |
| `Sidebar.jsx` | 159 lines | `bg-brand-card/80 border-white/10` aside; `border-white/5` header section; `text-slate-400` nav items; `bg-black/20 border-white/10` footer; "Core Ledger Engine" jargon |
| `MobileNav.jsx` | 204 lines | `bg-black/75` backdrop; `bg-brand-card border-white/10` panel; `border-white/5` header divider; `text-slate-400` nav items; `bg-white/[0.03] border-white/5` user card; "Core Ledger Engine" jargon |

---

## Detailed Changes Per File

### 1. DashboardLayout.jsx

**Changes**:
- Root div: `bg-brand-dark text-slate-100` → `bg-canvas text-text-primary`

### 2. Sidebar.jsx

**Changes**:

| Location | Before | After |
|---|---|---|
| `<aside>` root | `bg-brand-card/80 backdrop-blur-xl border-r border-white/10` | `bg-surface border-r border-border-default` |
| Brand header section | `border-b border-white/5` | `border-b border-border-subtle` |
| Brand logo icon box | `bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border-brand-accent/30` | Keep — brand gradient is intentional identity, not a theme surface |
| Brand name text | `text-white` | `text-text-primary` |
| Brand accent text | `text-brand-accent` | Keep — brand identity |
| Brand tagline | `"Core Ledger Engine"` + `text-slate-400` | `"Institutional Banking"` + `text-text-muted` |
| Nav section label | `text-slate-400` | `text-text-muted` |
| Nav item inactive | `text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border-transparent` | `text-text-muted hover:text-text-primary hover:bg-elevated border-transparent` |
| Nav item active | `bg-brand-accent/15 text-brand-accent border-brand-accent/30` | Keep — brand active state |
| Nav badge | Keep brand-accent badge | Keep |
| Footer section | `border-t border-white/10 bg-black/20` | `border-t border-border-default bg-sunken` |
| User card bg | `bg-white/[0.03] border border-white/5` | `bg-elevated border border-border-subtle` |
| User name | `text-white` | `text-text-primary` |
| User email | `text-slate-400` | `text-text-muted` |
| Logout button | `text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/20` | Keep — state-error colors are intentional |

### 3. Header.jsx

**Changes**:

| Location | Before | After |
|---|---|---|
| `<header>` root | `bg-brand-dark/80 backdrop-blur-md border-b border-white/10` | `bg-canvas/90 backdrop-blur-md border-b border-border-default` |
| Hamburger button | `text-slate-400 hover:text-white hover:bg-white/[0.05] border-white/5` | `text-text-muted hover:text-text-primary hover:bg-elevated border-border-subtle` |
| Route breadcrumb text | `text-slate-400` | `text-text-muted` |
| Page title `<h1>` | `text-white` | `text-text-primary` |
| Account switcher trigger | `bg-white/[0.04] hover:bg-white/[0.08] border-white/10` | `bg-surface hover:bg-elevated border-border-default` |
| Account switcher type label | `text-white` | `text-text-primary` |
| Account number masked | `text-slate-400` | `text-text-muted` |
| Account switcher popover | `bg-brand-card border-white/10` | `bg-surface border-border-default` |
| Popover section label | `text-slate-400` | `text-text-muted` |
| Popover item inactive | `text-slate-300 hover:text-white hover:bg-white/5` | `text-text-secondary hover:text-text-primary hover:bg-elevated` |
| Popover item inactive account number | `text-slate-400` | `text-text-muted` |
| Live status badge | Keep `emerald-*` — operational status indicator | Keep |
| **ThemeToggle** | *(not present)* | **Add `<ThemeToggle />` between status badge and notifications** |
| Notifications button | `text-slate-400 hover:text-white hover:bg-white/[0.05] border-white/5` | `text-text-muted hover:text-text-primary hover:bg-elevated border-border-subtle` |
| Notification dot ring | `ring-brand-dark` | `ring-canvas` |
| User menu trigger | `text-slate-300 hover:text-white hover:bg-white/[0.05] border-white/10` | `text-text-secondary hover:text-text-primary hover:bg-elevated border-border-default` |
| User menu avatar gradient | Keep `brand-accent/brand-indigo` — brand identity | Keep |
| User name in trigger | Keep | Keep |
| User popover container | `bg-brand-card border-white/10` | `bg-surface border-border-default` |
| Popover header divider | `border-white/10` | `border-border-subtle` |
| Popover user name | `text-white` | `text-text-primary` |
| Popover user email | `text-slate-400` | `text-text-muted` |
| Popover role badge | Keep `brand-accent` — brand identity | Keep |
| Popover menu links | `text-slate-300 hover:text-white hover:bg-white/[0.05]` | `text-text-secondary hover:text-text-primary hover:bg-elevated` |
| Popover menu icons | `text-slate-400` | `text-text-muted` |
| Popover divider | `border-white/10` | `border-border-subtle` |
| Logout button | `text-rose-400 hover:text-rose-300 hover:bg-rose-500/10` | Keep — state-error color is intentional |

**New import**: Add `import ThemeToggle from "../common/ThemeToggle"` and `import { useTheme } from "../../context/ThemeContext"` (if needed — `ThemeToggle` is self-contained).

### 4. MobileNav.jsx

**Changes**:

| Location | Before | After |
|---|---|---|
| Backdrop | `bg-black/75 backdrop-blur-sm` | `bg-canvas/80 backdrop-blur-sm` |
| Slide-over panel | `bg-brand-card border-r border-white/10` | `bg-surface border-r border-border-default` |
| Panel header divider | `border-b border-white/5` | `border-b border-border-subtle` |
| Brand logo box | Keep gradient — brand identity | Keep |
| Brand name | `text-white` | `text-text-primary` |
| Brand tagline | `"Core Ledger Engine"` + `text-slate-400` | `"Institutional Banking"` + `text-text-muted` |
| Close button | `text-slate-400 hover:text-white hover:bg-white/[0.05] border-white/5` | `text-text-muted hover:text-text-primary hover:bg-elevated border-border-subtle` |
| Nav section label | `text-slate-400` | `text-text-muted` |
| Nav item inactive | `text-slate-400 hover:text-white hover:bg-white/[0.05]` | `text-text-muted hover:text-text-primary hover:bg-elevated` |
| Nav item active | Keep `brand-accent` active state | Keep |
| Nav badge | Keep | Keep |
| Footer divider | `border-t border-white/10` | `border-t border-border-default` |
| User card bg | `bg-white/[0.03] border border-white/5` | `bg-elevated border border-border-subtle` |
| User avatar gradient | Keep — brand identity | Keep |
| User name | `text-white` | `text-text-primary` |
| User email | `text-slate-400` | `text-text-muted` |
| Logout button | `text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20` | Keep — state-error intentional |

---

## Data Jargon Elimination

The following brand tagline is customer-facing and exposes backend/database terminology:

| Location | Current | Replacement |
|---|---|---|
| `Sidebar.jsx` brand tagline | "Core Ledger Engine" | "Institutional Banking" |
| `MobileNav.jsx` brand tagline | "Core Ledger Engine" | "Institutional Banking" |

The `Header.jsx` page route mapping also currently shows "Executive Cockpit" for `/dashboard` — this is acceptable institutional language and should be kept. No change to route titles.

---

## ThemeToggle Integration in Header

`ThemeToggle` is added between the "Ledger Active" status badge and the Notifications bell in `Header.jsx`:

```jsx
{/* Live Ledger Status Badge */}
<div className="...">Ledger Active</div>

{/* Theme Toggle — NEW */}
<ThemeToggle />

{/* Notifications Trigger */}
<button ...><Bell /></button>
```

This placement keeps it grouped with the right-side utilities and is accessible on all screen sizes (`sm:` breakpoint or better).

---

## Verification Plan

### 1. Build Verification
```powershell
npm --prefix client run build
```
- 0 errors, bundle size within ±5% of Phase 17 baseline.

### 2. Backend Regression Suite
```powershell
node scripts/verify-all.js
```
- All 5 suites must continue to pass.

### 3. Manual Visual Verification (at `http://localhost:5173`)
- **Desktop (≥1024px)**: Sidebar visible — light/dark mode applies correctly to sidebar surface, nav items, user card, footer.
- **Mobile (<1024px)**: Tap hamburger → MobileNav drawer opens — backdrop and panel adapt to theme.
- **Header**: ThemeToggle button visible in header right rail. Clicking it toggles the entire app between light and dark instantly. Verify logout, account switch, and mobile drawer close still function correctly.
- **Account Switcher Popover**: Opens with correct surface in both themes.
- **User Menu Popover**: Opens with correct surface in both themes.
- **Brand Tagline**: "Institutional Banking" shown under AURABANK logo (not "Core Ledger Engine").
- **Jargon check**: No "brand-dark", "brand-card", "white/10", "white/5" text visible to customer at runtime.

---

## ✅ Completion Status — 2026-09-17

| Deliverable | File | Changes | Status |
|---|---|---|---|
| Root shell div → semantic canvas | `DashboardLayout.jsx` | `bg-canvas text-text-primary` | ✅ Done |
| Sidebar aside, nav, footer → semantic | `Sidebar.jsx` | `bg-surface`, `bg-sunken`, `bg-elevated`, `text-text-primary/muted`, `border-border-default/subtle` | ✅ Done |
| "Core Ledger Engine" → "Institutional Banking" | `Sidebar.jsx` | String literal change | ✅ Done |
| Header bar, popovers → semantic | `Header.jsx` | `bg-canvas/90`, `bg-surface`, `bg-elevated`, `border-border-default/subtle`, `text-text-primary/secondary/muted` | ✅ Done |
| ThemeToggle mounted in Header | `Header.jsx` | Added between Ledger Status and Bell | ✅ Done |
| Notification dot ring → semantic | `Header.jsx` | `ring-canvas` | ✅ Done |
| "Core Ledger Engine" → "Institutional Banking" | `MobileNav.jsx` | String literal change | ✅ Done |
| MobileNav backdrop, panel, nav → semantic | `MobileNav.jsx` | `bg-canvas/80`, `bg-surface`, `bg-elevated`, `border-border-default/subtle`, `text-text-primary/muted` | ✅ Done |
| Build verification | `npm --prefix client run build` | 0 errors, 1695 modules, 437KB JS (5.27s) | ✅ PASS |
| Backend regression suite | `node scripts/verify-all.js` | ALL 5 SUITES PASSED (51.8s) | ✅ PASS |

---

## Out of Scope for Phase 18
- `AuthLayout.jsx` and `Footer.jsx` (landing/marketing pages — will be addressed in Phase 23 polish).
- Page-level components (`DashboardPage`, `ProfilePage`, etc.) — addressed in Phases 19–22.
- New navigation items or routing changes.
