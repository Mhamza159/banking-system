# Phase 16 Plan: Design Tokens, CSS Variables & Dual Theme Engine

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `16-design-tokens-dual-theme`  
**Goal**: Establish the foundational semantic CSS variable token architecture and theme management engine supporting persistent, instant Light Mode and Dark Mode switching without layout shift or UI flickering.

---

## Objective & Scope

1. **Semantic CSS Custom Properties** (`client/src/index.css`):
   - Define `:root` (Light mode: clean warm slate, crisp white surfaces, institutional teal accents, high-contrast dark text).
   - Define `.dark` (Dark mode: deep obsidian canvas, dark graphite surfaces, precision emerald accents, high-contrast light text).
   - Remove hardcoded dark body background (`#090D16`) and configure theme-aware typography and scrollbars.

2. **Tailwind Semantic Mapping** (`client/tailwind.config.js`):
   - Map semantic CSS variables into Tailwind theme extensions (`colors`, `boxShadow`, `borderRadius`):
     - `bg-canvas`, `bg-surface`, `bg-elevated`, `bg-sunken`
     - `border-subtle`, `border-default`, `border-strong`
     - `text-primary`, `text-secondary`, `text-muted`, `text-inverse`
     - `brand-primary`, `brand-primary-hover`, `brand-accent`
     - `state-success`, `state-warning`, `state-error`, `state-info`

3. **Theme Context Engine** (`client/src/context/ThemeContext.jsx`):
   - State management for active theme (`"light"` vs `"dark"`).
   - System preference detection via `window.matchMedia("(prefers-color-scheme: dark)")`.
   - LocalStorage synchronization (`"banking_theme"`).
   - Real-time DOM synchronization on `document.documentElement.classList`.

4. **Accessible Theme Toggle Component** (`client/src/components/common/ThemeToggle.jsx`):
   - Tactile button with animated Sun and Moon icons, accessible labels, and smooth state transition.

5. **Application Provider Wiring** (`client/src/App.jsx`):
   - Wrap application tree with `<ThemeProvider>`.

---

## Verification Plan

### 1. Build Verification
```powershell
npm --prefix client run build
```
- Must compile with 0 errors and zero bundle bloat.

### 2. Regression Test Runner
```powershell
node scripts/verify-all.js
```
- All 5 Milestone 1 backend suites must continue to pass with 100% integrity.

---

## ✅ Completion Status — 2026-09-17

| Deliverable | File | Status |
|---|---|---|
| Semantic CSS Variables (Light + Dark) | `client/src/index.css` | ✅ Done |
| Tailwind Semantic Token Mapping | `client/tailwind.config.js` | ✅ Done |
| Theme Context Provider | `client/src/context/ThemeContext.jsx` | ✅ Done |
| Theme Toggle Component | `client/src/components/common/ThemeToggle.jsx` | ✅ Done |
| App.jsx Provider Wiring | `client/src/App.jsx` | ✅ Done |
| Zero-Flicker Init Script | `client/index.html` | ✅ Done |
| Build Verification (0 errors) | `npm --prefix client run build` | ✅ PASS (8.25s, 435KB) |
| Backend Regression Suite | `node scripts/verify-all.js` | ✅ ALL 5 SUITES PASSED (51.9s) |

