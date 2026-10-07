# Phase 1 Plan: Frontend Project Setup, Dependencies, Design Tokens & UI Primitives

**Milestone**: 2 (v2.0.0 React Frontend Application)  
**Phase**: `frontend-01-setup-primitives`  
**Goal**: Initialize Vite React SPA in `client/`, configure Tailwind design system tokens, build centralized Axios client with `withCredentials: true`, implement Toast notification queue, and build the full library of reusable primitive components.  
**Tasks Covered**: T001 through T020 from `.specify/specs/banking-frontend-react/tasks.md`

---

## Technical Context & Scope

Phase 1 establishes the client-side architecture and design system upon which all subsequent banking pages (Landing, Auth, Dashboard, Accounts, Transfers, and Transactions) are built.

### 1. Project Initialization & Tooling (`client/`)
- Initialize Vite React SPA in `./client` using standard vanilla JSX/React 18 template.
- Configure Tailwind CSS v3 with PostCSS and autoprefixer.
- Extend `tailwind.config.js` with bespoke FinTech tokens:
  - Dark Slate background: `#090D16`
  - Elevated Card surface: `#111827` / `rgba(17, 24, 39, 0.7)` with `backdrop-blur-md`
  - Emerald Mint accent: `#10B981` (Inflow / Active / Success)
  - Electric Indigo: `#6366F1` (Primary CTA)
  - Rose Danger: `#F43F5E` (Debit / Outflow / Error)
  - Amber Warning: `#F59E0B` (Pending / In-Flight)
  - Shimmer pulse animation for skeletons.

### 2. Dependencies to Install (`client/package.json`)
- `react`, `react-dom` (v18+)
- `react-router-dom` (v6+)
- `axios` (v1+)
- `lucide-react` (modern iconography)
- `uuid` (RFC 4122 UUID v4 for Idempotency keys)
- `clsx`, `tailwind-merge` (clean class composition utility)
- `tailwindcss`, `postcss`, `autoprefixer` (styling devDependencies)

### 3. Environment & Root Script Configuration
- Create `client/.env.example` and `client/.env` specifying:
  ```env
  VITE_API_URL=http://localhost:3000/api/v1
  ```
- Update root `package.json` with convenience scripts:
  ```json
  "dev:client": "cd client && npm run dev",
  "build:client": "cd client && npm run build",
  "dev:all": "concurrently \"nodemon server.js\" \"cd client && npm run dev\""
  ```

### 4. Utilities & Centralized API Client (`client/src/`)
- `utils/currency.js`:
  - `toCents(dollars)`: Multiplies dollars by 100 safely with `Math.round`.
  - `formatCurrency(cents, currency = "USD")`: Formats cents into standard currency display (e.g. `10500` $\to$ `"$105.00"`).
  - `parseCents(input)`: Validates and parses user dollar inputs into integer minor units.
- `utils/date.js`:
  - `formatDate(timestamp)`: Standard localized format (`Sep 15, 2026 • 15:30:22`).
  - `formatRelativeTime(timestamp)`: Relative time strings (`5 minutes ago`, `Yesterday`).
- `utils/validators.js`:
  - Email RFC 5322 validation.
  - Password minimum length ($\ge 8$) and strength scoring.
  - Positive integer cents check.
- `services/api.js`:
  - Central Axios instance with `baseURL: http://localhost:3000/api/v1`.
  - `withCredentials: true` (ensures HTTP-only cookies are automatically sent and received).
  - Response interceptor:
    - Success: unwrap `response.data` directly.
    - Error: normalize error response, catch 401 and dispatch `banking:unauthorized` custom event.

### 5. Notification System & Context (`client/src/context/`)
- `context/ToastContext.jsx`:
  - Provides `useToast()` hook with `showToast(type, message)` and `dismissToast(id)`.
  - Types: `success`, `error`, `warning`, `info`.
  - Automatic auto-dismiss timer (4000ms).
  - Floating top-right stackable container with smooth entrance/exit transitions.

### 6. Atomic UI Design System Primitives (`client/src/components/common/`)
- `Button.jsx`: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), disabled state, and integrated SVG loading spinner.
- `Input.jsx`: Controlled input with label, prefix icon, suffix action (e.g. password show/hide), error message text, and accessible focus rings.
- `Select.jsx`: Custom accessible dropdown with styled options.
- `Modal.jsx`: Focus-trapped dialog overlay with backdrop blur, ESC key listener, and click-outside dismissal.
- `Badge.jsx`: Financial status indicators (`ACTIVE`, `COMPLETED`, `PENDING`, `FAILED`, `FROZEN`) with custom colors and dot indicators.
- `Card.jsx`: Glassmorphic card container with gradient borders and hover elevations.
- `Skeleton.jsx`: Shimmer placeholder for loading text, avatar circles, and card blocks.
- `MoneyDisplay.jsx`: Renders currency amounts with bold display numbers and subtle decimal/cents styling.
- `EmptyState.jsx`: Illustrated fallback for empty tables, transaction logs, or search results with CTA buttons.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T001** | Initialize Vite React SPA in `client/` | `client/package.json`, `client/vite.config.js` |
| **T002** | Install dependencies (`react-router-dom`, `axios`, `lucide-react`, `uuid`, etc.) | `client/package.json` |
| **T003** | Configure Tailwind CSS & PostCSS with FinTech design tokens | `client/tailwind.config.js`, `client/src/index.css` |
| **T004** | Create `.env.example` and `.env` | `client/.env.example`, `client/.env` |
| **T005** | Setup HTML5 template with Inter font and title | `client/index.html` |
| **T006** | Add client scripts in root `package.json` | `package.json` |
| **T007** | Implement financial currency converters (`toCents`, `formatCurrency`) | `client/src/utils/currency.js` |
| **T008** | Implement date formatters (`formatDate`, `formatRelativeTime`) | `client/src/utils/date.js` |
| **T009** | Implement input validators (email regex, password, integer cents) | `client/src/utils/validators.js` |
| **T010** | Setup centralized Axios client with credentials & interceptor | `client/src/services/api.js` |
| **T011** | Implement `ToastContext` and floating stackable toast queue | `client/src/context/ToastContext.jsx` |
| **T012** | Implement `Button` component (variants, sizes, loading state) | `client/src/components/common/Button.jsx` |
| **T013** | Implement `Input` component (prefix/suffix icons, errors) | `client/src/components/common/Input.jsx` |
| **T014** | Implement `Select` component (accessible custom dropdown) | `client/src/components/common/Select.jsx` |
| **T015** | Implement `Modal` dialog component (accessible backdrop & ESC) | `client/src/components/common/Modal.jsx` |
| **T016** | Implement `Badge` component (financial status colors) | `client/src/components/common/Badge.jsx` |
| **T017** | Implement `Card` component (glassmorphism surface) | `client/src/components/common/Card.jsx` |
| **T018** | Implement `Skeleton` shimmer placeholder loader | `client/src/components/common/Skeleton.jsx` |
| **T019** | Implement `MoneyDisplay` component (monospaced display numbers) | `client/src/components/common/MoneyDisplay.jsx` |
| **T020** | Implement `EmptyState` component with illustration and CTA | `client/src/components/common/EmptyState.jsx` |

---

## Verification Plan

### Automated Verification
1. **Compilation & Build Check**:
   - Run `npm run build` inside `client/` to verify zero JSX or CSS syntax errors.
2. **Component Showcase / Smoke Test**:
   - Mount a test harness in `client/src/App.jsx` rendering the complete UI Primitive showcase:
     - Buttons in all variants and loading states.
     - Inputs with error messages and prefix icons.
     - Glassmorphic Cards with MoneyDisplay (`$1,250.50`, `$0.00`).
     - Badges (`ACTIVE`, `COMPLETED`, `PENDING`, `FAILED`).
     - Interactive Modal trigger test.
     - Interactive Toast trigger test (Success, Error, Warning).
     - Skeleton shimmer animations.
3. **API Connectivity Verification**:
   - Test `api.get('/health')` to assert communication with the live backend server on `:3000`.
