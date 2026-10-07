# Phase 17 Plan: Core UI Primitives & Accessible Design System Refactor

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `17-core-ui-primitives`  
**Goal**: Migrate all 8 reusable primitive components from dark-only hardcoded Tailwind utilities to the Phase 16 semantic design tokens, achieving full WCAG AA compliance in both Light and Dark modes with zero regression to any consuming page or feature.

---

## Objective & Scope

Refactor every primitive in `client/src/components/common/` to consume `var(--*)` tokens via Tailwind semantic classes (`bg-surface`, `text-primary`, `border-default`, etc.) and `.glass-*` utilities established in Phase 16. No new features are added — this is a surgical token migration only.

### Files in Scope (All 8 Primitives)

| File | Primary Problem | Migration Target |
|---|---|---|
| `Button.jsx` | Hardcoded `focus:ring-offset-[#090D16]`, `bg-slate-800/80` secondary | Semantic `ring-offset-canvas`, `bg-surface` secondary |
| `Input.jsx` | Hardcoded `text-slate-300` labels, `text-slate-400` icons, `text-slate-100` input | Semantic `text-text-secondary`, `text-text-muted`, `text-text-primary` |
| `Select.jsx` | Same as Input — `text-slate-300` label, `text-slate-100` value, dark `bg-slate-900` option bg | Semantic token equivalents |
| `Card.jsx` | `bg-slate-900/40 border-white/5` subtle variant hardcoded dark | Semantic `bg-sunken border-border-subtle` |
| `Modal.jsx` | `bg-slate-950/80` backdrop, `border-white/10` dialog border, `text-slate-400` / `text-white` | Semantic `bg-canvas/80`, `border-border-default`, `text-text-secondary`, `text-text-primary` |
| `Badge.jsx` | Color configs only use `emerald/amber/rose` variants — these are semantic-state based, not theme-dependent; review and preserve | Verify state colors map to `--state-*` tokens |
| `MoneyDisplay.jsx` | `text-white` default, `text-slate-300` hero symbol, `text-slate-400` hero decimal | Semantic `text-text-primary`, `text-text-secondary`, `text-text-muted` |
| `Skeleton.jsx` | `bg-slate-800/50` hardcoded dark shimmer, `shimmer-bg` relies on dark rgba gradient | Theme-aware shimmer via CSS variable approach |
| `EmptyState.jsx` | `bg-slate-800/80 border-white/5` icon box, `text-white`, `text-slate-400` desc | Semantic `bg-elevated border-border-subtle`, `text-text-primary`, `text-text-secondary` |

---

## Detailed Changes Per Component

### 1. Button.jsx
**Changes**:
- `baseStyles`: Replace `focus:ring-offset-[#090D16]` → `focus:ring-offset-canvas`
- `secondary` variant: Replace `bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-white/10` → `bg-surface hover:bg-elevated text-text-primary border-border-default`
- `outline` variant: Replace `text-slate-300 border-slate-700` → `text-text-secondary border-border-default hover:text-text-primary hover:border-border-strong`
- `ghost` variant: Replace `text-slate-300 hover:text-white` → `text-text-secondary hover:text-text-primary`
- `primary` and `danger`: Keep emerald/rose — these are brand/state colors, not theme surfaces. Only update `shadow-emerald-500/20` → keep (semantic-neutral).

### 2. Input.jsx
**Changes**:
- `label`: `text-slate-300` → `text-text-secondary`
- `helperText span`: `text-slate-400` → `text-text-muted`
- Icon container: `text-slate-400` → `text-text-muted`
- Error state input: Keep rose error styling (semantic state color) — no change needed.
- Password toggle button: `text-slate-400 hover:text-slate-200` → `text-text-muted hover:text-text-primary`
- Error text: `text-rose-400` → `text-state-error` (maps to same value via token)
- Normal input: `glass-input text-slate-100` — `text-slate-100` is redundant since `.glass-input` sets `color: var(--text-primary)`. Remove the explicit `text-slate-100` (it will override the CSS var).

### 3. Select.jsx
**Changes** (mirror of Input):
- Label: `text-slate-300` → `text-text-secondary`
- Helper: `text-slate-400` → `text-text-muted`
- Normal select: Remove `text-slate-100` (covered by `.glass-input`)
- ChevronDown icon: `text-slate-400` → `text-text-muted`
- Option elements: `bg-slate-900 text-slate-100` → `bg-surface text-text-primary` (controls dropdown option list styling)
- Placeholder option: `bg-slate-900 text-slate-500` → `bg-surface text-text-muted`
- Error text: `text-rose-400` → `text-state-error`

### 4. Card.jsx
**Changes**:
- `subtle` variant: `bg-slate-900/40 border border-white/5` → `bg-sunken border border-border-subtle`
- `interactive` styles: `hover:border-white/20` → `hover:border-border-default`
- `default` and `elevated` variants already use `.glass-panel` and `.glass-panel-elevated` (Phase 16 utilities) — **no change needed**.

### 5. Modal.jsx
**Changes**:
- Backdrop: `bg-slate-950/80` → `bg-canvas/80` (leverages semantic canvas color with opacity)
- Dialog card: `border-white/10` → `border-border-default`
- Header border: `border-white/5` → `border-border-subtle`
- Title: `text-white` → `text-text-primary`
- Description: `text-slate-400` → `text-text-muted`
- Close button: `text-slate-400 hover:text-white hover:bg-white/5` → `text-text-muted hover:text-text-primary hover:bg-elevated`

### 6. Badge.jsx
**Assessment**: Badge status colors (`emerald`, `amber`, `rose`, `blue`, `orange`, `slate`) are domain-semantic — they represent financial statuses (ACTIVE, COMPLETED, PENDING, FAILED, FROZEN, SUSPENDED, INACTIVE) and are **intentionally high-chroma** in both themes. These colors are already WCAG compliant on both dark and light surfaces (text color + background opacity combination). **No change required** — Badge is already theme-safe.

### 7. MoneyDisplay.jsx
**Changes**:
- Default color: `text-white` → `text-text-primary` (adapts: dark→white, light→slate-900)
- Hero symbol: `text-slate-300` → `text-text-secondary`  
- Hero decimal: `text-slate-400` → `text-text-muted`
- Credit/debit colors: Keep `text-emerald-400` and `text-rose-400` — these are universal financial convention colors. Evaluating: they work adequately on both light (emerald-600/rose-600 would be more WCAG compliant on white) — update to state tokens: `text-state-success` / `text-state-error`.

### 8. Skeleton.jsx
**Changes**:
- Replace `bg-slate-800/50 shimmer-bg` with a new theme-aware approach.
- Add `.shimmer-light` and `.shimmer-dark` variants in `index.css` using `--bg-elevated` and `--bg-sunken` token variables so shimmer adapts to both themes automatically.
- Alternatively: update `shimmer-bg` in `index.css` to use CSS variables. The `shimmer-bg` class already exists in `index.css` with hardcoded dark-only RGBA values — **update the shimmer gradient in `index.css`** to use `rgba(var(--bg-elevated-rgb), ...)` — simpler: override with a `.dark .shimmer-bg` variant (already following the `.dark .glass-panel` pattern).
- Update `Skeleton.jsx` base: `bg-slate-800/50` → `bg-elevated` (semantic).

### 9. EmptyState.jsx
**Changes**:
- Icon box: `bg-slate-800/80 border-white/5` → `bg-elevated border-border-subtle`
- Icon color: `text-slate-400` → `text-text-muted`
- Title: `text-white` → `text-text-primary`
- Description: `text-slate-400` → `text-text-secondary`
- Border: `border-dashed border-white/10` → `border-dashed border-border-default`

---

## Additional: index.css Shimmer Update

The `shimmer-bg` class needs a `.dark` variant to prevent light-mode breakage:

```css
/* Light mode shimmer */
.shimmer-bg {
  background: linear-gradient(90deg, 
    var(--bg-elevated) 0%, 
    var(--bg-sunken) 50%, 
    var(--bg-elevated) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}
```

This replaces the current hardcoded dark RGBA gradient with theme-token-driven values.

---

## Verification Plan

### 1. Build Verification
```powershell
npm --prefix client run build
```
- 0 compilation errors, bundle size within ±5% of Phase 16 baseline (435KB JS, 56KB CSS).

### 2. Backend Regression Suite
```powershell
node scripts/verify-all.js
```
- All 5 backend suites must pass (auth, ledger, ACID transfers, idempotency, hardening).

### 3. Visual Regression Check (Manual)
With `npm run dev:all` running at `http://localhost:5173`:
- Toggle theme (Light ↔ Dark) — all 8 primitives must adapt cleanly.
- Verify: no white-on-white or dark-on-dark text illegibility.
- Verify: Buttons in all 5 variants render correct contrast in both themes.
- Verify: Inputs/Selects show### Manual Visual Verification
At `http://localhost:5173` (already running):
- Toggle Light ↔ Dark theme using `ThemeToggle`
- Verify each primitive adapts correctly:
  - **Buttons**: All 5 variants readable in both themes
  - **Inputs/Selects**: Label contrast, placeholder, error state
  - **Cards**: `subtle` variant no longer dark-on-dark in light mode
  - **Modals**: Backdrop, title, description, close button
  - **Skeletons**: Shimmer adapts to light canvas (not dark shimmer on white)
  - **EmptyState**: Icon box, title, description legible in light mode
  - **MoneyDisplay**: Default balance color adapts to theme

---

## ✅ Completion Status — 2026-09-17

| Deliverable | File | Changes | Status |
|---|---|---|---|
| Button variants → semantic tokens | `Button.jsx` | `ring-offset-canvas`, `bg-surface/elevated`, `text-text-primary/secondary`, `border-border-default/strong` | ✅ Done |
| Input labels/icons → semantic tokens | `Input.jsx` | `text-text-secondary` label, `text-text-muted` icon/helper, `text-state-error` error | ✅ Done |
| Select labels/options → semantic tokens | `Select.jsx` | Same as Input + `bg-surface` option bg | ✅ Done |
| Card subtle variant → semantic tokens | `Card.jsx` | `bg-sunken border-border-subtle`, `hover:border-border-default` | ✅ Done |
| Modal backdrop/dialog → semantic tokens | `Modal.jsx` | `bg-canvas/80`, `border-border-default`, `text-text-primary/muted`, `hover:bg-elevated` | ✅ Done |
| Badge | `Badge.jsx` | No change — domain-semantic status colors WCAG AA compliant in both themes | ✅ No-op |
| MoneyDisplay colors → semantic tokens | `MoneyDisplay.jsx` | `text-text-primary` default, `text-state-success/error` credit/debit, `text-text-secondary/muted` hero | ✅ Done |
| Skeleton base → semantic token | `Skeleton.jsx` | `bg-elevated` replaces `bg-slate-800/50` | ✅ Done |
| Shimmer gradient → CSS variable | `index.css` | `var(--bg-elevated)` / `var(--bg-sunken)` replaces dark RGBA | ✅ Done |
| EmptyState → semantic tokens | `EmptyState.jsx` | `bg-elevated`, `border-border-subtle/default`, `text-text-primary/secondary/muted` | ✅ Done |
| Build verification | `npm --prefix client run build` | 0 errors, 1694 modules, 435KB JS (4.73s) | ✅ PASS |
| Backend regression suite | `node scripts/verify-all.js` | All 5 suites | ✅ PASS |

---

## Out of Scope for Phase 17
- Pages (Dashboard, Profile, Transfer, Transactions) — addressed in Phases 19–22.
- Navigation Shell (Header, Sidebar) — addressed in Phase 18.
- New component variants or features — only token migration.
