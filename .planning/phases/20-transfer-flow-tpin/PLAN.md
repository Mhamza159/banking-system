# Phase 20 Plan: Money Transfer Flow, Recipient Verification & TPIN Dialog

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `20-transfer-flow-tpin`  
**Goal**: Modernize `TransferPage`, `TransferModal`, and `TransactionReceipt` to consume Phase 16 semantic tokens; deliver a guided transfer experience with zero layout shift during recipient verification; enhance the 4-digit TPIN modal with responsive micro-animations; and eliminate all backend/database jargon.

---

## Objective & Scope

Following the successful migration of primitives (Phase 17), app shell (Phase 18), and executive dashboard/accounts (Phase 19), this phase modernizes the transaction creation and authorization experience.

Currently, `TransferPage.jsx`, `TransferModal.jsx`, and `TransactionReceipt.jsx` contain dark-only utilities (`bg-slate-900`, `bg-brand-card`, `border-white/10`, `text-slate-400`, `text-white`) and developer jargon ("Core Ledger Routing", "ATOMIC LEDGER", "UUID v4 idempotency keys", "MongoDB ACID sessions", "MongoDB replica ledger").

**Strict boundary**: Zero business logic, API contract, or routing changes. The core 2-step verification, balance validation, TPIN verification, and idempotency header dispatch remain 100% intact.

---

## Files in Scope

| File | Size | Primary Migration Targets |
|---|---|---|
| `TransferPage.jsx` | 793 lines | Header banner gradients, account selector cards, segmented transfer mode tabs, recipient verification feedback (zero layout shift), amount preset chips, cryptographic notice footer, jargon removal. |
| `TransferModal.jsx` | 399 lines | Modal hero amount card, transfer route flow, animated 4-digit TPIN input boxes (micro-animations, focus scale, light/dark contrast), unconfigured/lockout/error callouts, idempotency text cleanup. |
| `TransactionReceipt.jsx` | 319 lines | Success banner, dual-party participant cards, financial breakdown items, copyable reference IDs, print masthead cleanup (jargon removal). |

---

## Detailed Changes Per File

### 1. `TransferPage.jsx`

#### Header Banner (Section 1)
| Before | After | Rationale |
|---|---|---|
| `bg-gradient-to-r from-brand-card via-slate-900 to-brand-card border border-white/10` | `bg-surface border border-border-default` | Dual-theme card surface |
| `"Core Ledger Routing"` | `"Transfer Funds"` | Replaced backend jargon |
| `<Badge variant="ACTIVE">ATOMIC LEDGER</Badge>` | `<Badge variant="ACTIVE">INSTANT TRANSFER</Badge>` | Friendly end-user terminology |
| `<h1 className="text-white">` | `<h1 className="text-text-primary">` | Semantic typography |
| Jargon description: "Execute atomic multi-document ledger transfers with recipient pre-flight verification, client-generated UUID v4 idempotency protection..." | "Send money instantly between your accounts or to other verified recipients with real-time balance protection." | Plain customer English |

#### Source Account Selection (Section 2A)
| Before | After |
|---|---|
| Label `text-slate-300`, available balance `text-slate-400` | Label `text-text-secondary`, available balance `text-text-muted` |
| Inactive account card: `bg-white/[0.03] border-white/10 hover:bg-white/[0.06]` | `bg-elevated border-border-subtle hover:bg-surface` |
| Active account card: `bg-brand-accent/15 border-brand-accent` | Keep brand accent active border with semantic text |
| Card texts: `text-white`, `text-slate-400` | `text-text-primary`, `text-text-muted` |

#### Destination Mode Tabs & Recipient Verification (Section 2B)
| Before | After |
|---|---|
| Tab container `bg-white/[0.03] border-white/10` | Segmented control `bg-sunken border border-border-subtle p-1` |
| Active tab `bg-brand-accent text-brand-dark` | `bg-surface shadow-sm text-text-primary font-bold` |
| Inactive tab `text-slate-400 hover:text-white` | `text-text-muted hover:text-text-primary` |
| Internal receiver cards | Mirror semantic styling of source account cards |
| Recipient account input | Retain standard `Input` primitive (uses semantic tokens from Phase 17) |
| Verification feedback banner: "Connecting to Core Ledger..." | "Verifying recipient account details..." |
| Verified recipient card `bg-gradient-to-r from-emerald-950/40 via-brand-card to-slate-900` | `bg-emerald-500/[0.05] border border-emerald-500/25` |
| Verified note: "Recipient confirmed on MongoDB replica ledger..." | "Recipient confirmed. You may now enter amount and proceed." |
| Zero layout shift | Fixed minimum height container for verification state feedback to eliminate vertical layout jumps. |

#### Amount & Presets (Section 2C)
| Before | After |
|---|---|
| Preset chips `bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white` | `bg-elevated hover:bg-surface border border-border-subtle text-text-secondary hover:text-text-primary` |
| Max Balance button `bg-brand-accent/10 border-brand-accent/25 text-brand-accent` | Keep — semantic brand utility |

#### Security Footer (Section 2D)
| Before | After |
|---|---|
| `bg-brand-card border border-white/10 text-slate-300` | `bg-sunken border border-border-subtle text-text-muted` |
| Title: "Atomic Ledger Multi-Document Transaction" | "Bank-Grade Transfer Protection" |
| Description: "Transfers execute within isolated MongoDB ACID sessions. An RFC 4122 UUID v4 key prevents duplicate executions..." | "Transfers are processed with end-to-end encryption and duplicate payment protection for guaranteed delivery." |

---

### 2. `TransferModal.jsx`

#### Modal Header & Hero Amount
| Before | After |
|---|---|
| Description: "Verify transaction participants and enter your 4-digit TPIN to execute settlement." | "Review transfer details and enter your 4-digit Transaction PIN to authorize." |
| Hero amount container `bg-gradient-to-b from-brand-card to-slate-950 border border-white/10` | `bg-surface border border-border-default` |
| Label `text-slate-400` | `text-text-muted` |
| Fee badge `bg-emerald-500/10 border-emerald-500/25 text-emerald-400` | Keep — semantic status badge |

#### Transfer Route Flow
| Before | After |
|---|---|
| Flow container `bg-white/[0.02] border border-white/10` | `bg-sunken border border-border-subtle` |
| Icon background `bg-white/5 border border-white/10` | `bg-elevated border border-border-subtle` |
| Labels `text-slate-400`, values `text-white`, `text-slate-200` | `text-text-muted`, `text-text-primary`, `text-text-secondary` |

#### 4-Digit TPIN Input & Authorization Card
| Before | After |
|---|---|
| Card container `bg-white/[0.02] border border-white/10` | `bg-elevated border border-border-subtle` |
| Title `text-white`, subtitle `text-slate-400` | `text-text-primary`, `text-text-muted` |
| 4 PIN input boxes `bg-slate-900 border border-white/15 text-white` | `bg-sunken border border-border-default text-text-primary focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25 focus:scale-105 transition-all duration-150` |
| TPIN unconfigured callout | `bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400` |
| TPIN lockout callout | `bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400` |
| Inline error callout | `bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400` |

#### Settlement Summary & Notice
| Before | After |
|---|---|
| Divider `border-white/10`, sub-divider `border-white/5` | `border-border-subtle` |
| Labels `text-slate-300`, values `text-white` | `text-text-muted`, `text-text-primary` |
| Idempotency notice: "Every dispatch injects a unique UUID v4 Idempotency-Key..." | "Protected against duplicate charges with instant cryptographic verification." with `bg-sunken border border-border-subtle text-text-muted` |

---

### 3. `TransactionReceipt.jsx`

#### Success Masthead & Banner
| Before | After |
|---|---|
| Print masthead: "Multi-Document ACID Ledger" | "Official Bank Settlement Receipt" |
| Success banner `bg-gradient-to-b from-emerald-500/15 via-brand-card to-slate-950 border border-emerald-500/25` | `bg-emerald-500/[0.06] border border-emerald-500/25` |
| Badge `ACID Committed` | Remove or replace with `"Instant Settlement"` |

#### Participant Details & Financial Breakdown
| Before | After |
|---|---|
| Outer box `bg-black/40 border border-white/10` | `bg-sunken border border-border-subtle` |
| Remitter/Beneficiary inner boxes `bg-white/[0.03] border border-white/5` | `bg-elevated border border-border-subtle` |
| Financial itemization card `bg-black/30 border border-white/10` | `bg-surface border border-border-default` |
| Item dividers `border-white/5` | `border-border-subtle` |
| Copy button `hover:bg-white/10 text-slate-400 hover:text-white` | `bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary border border-border-subtle` |

---

## Data Jargon Cleaned

| Location | Jargon String | Cleaned Replacement |
|---|---|---|
| `TransferPage.jsx` | "Core Ledger Routing" | "Transfer Funds" |
| `TransferPage.jsx` | "ATOMIC LEDGER" badge | "INSTANT TRANSFER" |
| `TransferPage.jsx` | "atomic multi-document ledger transfers..." | "Send money instantly between your accounts or to other verified recipients..." |
| `TransferPage.jsx` | "Connecting to Core Ledger..." | "Verifying recipient account details..." |
| `TransferPage.jsx` | "Recipient confirmed on MongoDB replica ledger..." | "Recipient confirmed. You may now enter amount and proceed." |
| `TransferPage.jsx` | "Atomic Ledger Multi-Document Transaction" | "Bank-Grade Transfer Protection" |
| `TransferPage.jsx` | "Transfers execute within isolated MongoDB ACID sessions..." | "Transfers are processed with end-to-end encryption and duplicate payment protection..." |
| `TransferModal.jsx` | "...enter your 4-digit TPIN to execute settlement." | "...enter your 4-digit Transaction PIN to authorize." |
| `TransferModal.jsx` | "UUID v4 Idempotency-Key to prevent duplicate debits..." | "Protected against duplicate charges with instant cryptographic verification." |
| `TransactionReceipt.jsx` | "Multi-Document ACID Ledger" | "Official Bank Settlement Receipt" |
| `TransactionReceipt.jsx` | "ACID Committed" | "Instant Settlement" |

---

## Verification Plan

### Automated Build & Test
1. **Frontend Compilation**:
   ```powershell
   npm --prefix client run build
   # Must compile with 0 warnings or errors
   ```
2. **Transfer Security Suite**:
   ```powershell
   node scripts/test-profile-security.js
   # 27/27 assertions must pass (covers TPIN, velocity limits, transfers)
   ```
3. **Full Regression Suite**:
   ```powershell
   node scripts/verify-all.js
   # All 5 suites must pass (Auth, Accounts, Ledger, Transfers, Security)
   ```

### Manual Visual Verification
- Open `http://localhost:5173/transfer` in browser.
- Switch between Light and Dark themes via Header toggle:
  - Source account selection cards adapt cleanly.
  - Segmented internal/external tabs switch styles with high contrast.
  - Enter recipient number and verify: zero vertical layout shift while verifying.
  - Review modal opens: 4 TPIN input boxes are beautifully rendered, auto-advance, scale on focus, and adapt to light/dark themes.
  - Zero raw database or backend jargon appears across the entire flow.
