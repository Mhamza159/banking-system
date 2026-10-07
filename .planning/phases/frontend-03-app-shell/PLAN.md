# Phase 3 Plan: Authenticated App Shell & Responsive Navigation

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-03-app-shell`  
**Goal**: Build the core authenticated dashboard shell featuring a fixed desktop sidebar with glowing active route indicators, top navigation header with active account badge and user dropdown, slide-over mobile drawer for viewports $< 1024px$, and the master `DashboardLayout` container.  
**Tasks Covered**: T029 through T032 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Phase 3 establishes the persistent layout shell in which all authenticated banking features (Dashboard Cockpit, Accounts Management, Money Transfers, Transaction History, and User Profile) will reside.

### Navigation Architecture
- **Routes to Support**:
  - `/dashboard` — Executive Financial Dashboard & Live Balance Cockpit (Phase 4)
  - `/accounts` — Multi-Account Management & Faucet Deposit (Phase 5)
  - `/transfer` — Atomic Money Transfer Flow & Idempotency Engine (Phase 6)
  - `/transactions` — Transaction Journal & Receipts (Phase 7)
  - `/profile` — User Profile & Security Settings (Phase 8)

---

## Detailed Task Breakdown

### 1. `client/src/components/layout/Sidebar.jsx` (T029)
- **Desktop Navigation**: Fixed left-side navigation container (`w-64`, `border-r border-white/10`, `bg-brand-card/90 backdrop-blur-xl`).
- **Brand Header**: AuraBank insignia with glowing shield icon and "Core Ledger System" sub-label.
- **Navigation Links**:
  - `NavLink` styling with active state detection via `react-router-dom`:
    - Active: `bg-brand-accent/15 text-brand-accent border-r-2 border-brand-accent font-semibold`
    - Inactive: `text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]`
  - Icons for each route (`LayoutDashboard`, `Wallet`, `SendHorizontal`, `ReceiptText`, `ShieldUser`).
- **User Footer Widget**:
  - Mini card displaying avatar circle with user initials, full legal name, role pill (`CUSTOMER`), and one-click Sign Out button.

### 2. `client/src/components/layout/Header.jsx` (T030)
- **Top Bar**: Sticky header (`h-16`, `border-b border-white/10`, `bg-brand-dark/80 backdrop-blur-md`).
- **Mobile Menu Trigger**: Hamburger icon button visible only on viewports $< 1024px$ to toggle mobile drawer.
- **Dynamic Context**: Page title or breadcrumb corresponding to the active route.
- **Right Utilities**:
  - **Active Status Indicator**: Live badge (`ACTIVE` with pulsing emerald dot).
  - **Notifications Bell**: Bell icon with indicator dot and click feedback.
  - **User Dropdown Menu**: Accessible popover menu with links to Profile, Security, and Logout.

### 3. `client/src/components/layout/MobileNav.jsx` (T031)
- **Slide-Over Drawer**: Off-canvas drawer sliding from the left on viewports $< 1024px$.
- **Backdrop & Interaction**:
  - Semi-transparent backdrop blur (`bg-black/60 backdrop-blur-sm`).
  - Auto-closes when a route is clicked, when the backdrop is clicked, or when `ESC` key is pressed.
- **Content**: Mirrors all desktop navigation links, brand insignia, and mobile logout action.

### 4. `client/src/components/layout/DashboardLayout.jsx` (T032)
- **Master Shell Assembly**:
  - Holds `mobileNavOpen` state toggled from Header.
  - Renders `Sidebar` on desktop ($lg:flex$).
  - Renders `MobileNav` for mobile overlay.
  - Renders `Header` at top of content column.
  - Main viewport container: `flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full`.
  - Mounts `<Outlet />` for child page routing.

### 5. Routing Integration (`client/src/routes/AppRoutes.jsx`)
- Wrap `/dashboard`, `/accounts`, `/transfer`, `/transactions`, and `/profile` inside `<DashboardLayout />`.
- Provide clean preview views for `/accounts`, `/transfer`, `/transactions`, and `/profile` until their dedicated phases are executed.

---

## Verification Plan

### 1. Build Verification
- Execute `npm run build` in `client/` to verify zero compilation or JSX syntax errors.

### 2. Manual & Responsive Layout Verification
- **Desktop Navigation ($\ge 1024px$)**:
  - Verify fixed left sidebar renders properly.
  - Click through all navigation links (`/dashboard`, `/accounts`, `/transfer`, `/transactions`, `/profile`) and verify active highlight transitions smoothly.
- **Mobile Navigation ($< 1024px$)**:
  - Resize browser window or view on mobile viewport.
  - Verify desktop sidebar hides cleanly and hamburger menu appears in header.
  - Click hamburger menu $\to$ verify slide-over drawer opens smoothly.
  - Click any navigation link or backdrop $\to$ verify drawer closes automatically.
- **Header Actions**:
  - Verify user dropdown opens and displays user information.
  - Click "Sign Out" in dropdown or sidebar $\to$ verify session revoked and redirected to `/login`.
