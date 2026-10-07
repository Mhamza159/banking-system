# Phase 19 Plan: Executive Dashboard & Accounts Management Redesign

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `19-dashboard-accounts`  
**Goal**: Migrate `DashboardPage`, `AccountsPage`, `BalanceCard`, `LedgerSummaryCard`, and `AccountCard` to Phase 16 semantic tokens; remove all hardcoded dark utilities and customer-facing backend/database jargon from page-level content.

---

## Objective & Scope

After Phases 17–18 locked in the primitives and shell, the dashboard and accounts pages remain full of `bg-slate-900`, `bg-brand-card`, `border-white/10`, `text-slate-400`, `text-white` — all dark-only hardcoded. This phase completes the migration for the two most critical authenticated pages.

**No new features, no routing changes, no business logic changes.**

---

## Files in Scope

| File | Size | Primary Issues |
|---|---|---|
| `DashboardPage.jsx` | 298 lines | Welcome banner `bg-gradient-to-r from-brand-card via-slate-900`, `text-white/slate-300`, jargon: "Core Ledger Session", "256-bit TLS", "MongoDB Atlas replica set", "Double-Entry ACID" |
| `AccountsPage.jsx` | 245 lines | Portfolio banner `bg-gradient-to-r from-slate-900 via-brand-card`, stats chips `bg-white/[0.04] border-white/10`, jargon: "Multi-Document Double-Entry Isolation", "UUID v4 idempotency keys" |
| `BalanceCard.jsx` | 272 lines | Card root `bg-gradient-to-br from-slate-900 via-brand-dark to-slate-950 border-white/10`; popover `bg-slate-900 border-white/15`; jargon: "MongoDB pipeline: Total Inflow − Total Outflow", "MongoDB replica set", "Double-Entry ACID" |
| `LedgerSummaryCard.jsx` | 121 lines | `text-white` title, `border-white/10` footer, `bg-white/5 border-white/10` REPLICA SYNC badge; jargon title, "REPLICA SYNC" badge |
| `AccountCard.jsx` | 209 lines | Card `border-white/10 bg-brand-card/90` inactive, account number box `bg-black/30 border-white/5`, action footer `border-white/10`; jargon: "Core Wealth & Savings", "Everyday Checking Ledger", "ACTIVE LEDGER" |

---

## Detailed Changes Per File

### 1. DashboardPage.jsx

#### Welcome Banner (Section 1)
| Before | After |
|---|---|
| `bg-gradient-to-r from-brand-card via-slate-900 to-brand-card border border-white/10` | `bg-surface border border-border-default` (remove gradient — uses glass-panel surface) |
| `text-xs text-brand-accent` label | Keep — brand identity |
| `"Core Ledger Session"` label | `"Authenticated Session"` |
| `<h1 className="text-white">` | `<h1 className="text-text-primary">` |
| `text-slate-300` description | `text-text-secondary` |
| Description text: "256-bit TLS encryption, HttpOnly JWT cookies, and real-time MongoDB Atlas replica isolation" | "Your session is protected with 256-bit TLS encryption and secure HttpOnly JWT cookies." |

#### Quick Action Cards (Section 3)
| Before | After |
|---|---|
| Card title `text-sm font-bold text-white` | `text-text-primary` |
| Card description `text-slate-400` | `text-text-muted` |
| `group-hover:text-brand-accent/indigo/teal-400/emerald-400` | Keep — intentional colored hover states |
| Launchpad card description "Atomic transfers with idempotency key" | "Send funds instantly and securely" |
| Launchpad card description "Full double-entry transaction history" | "View your complete payment history" |
| Launchpad card description "Inject test balance into ledger" | "Add test funds to your account" |

#### Recent Transactions Section (Section 4)
| Before | After |
|---|---|
| `<h2 className="text-white">` | `text-text-primary` |
| `text-slate-400` description | `text-text-muted` |

#### Compliance Footer (Section 5)
| Before | After |
|---|---|
| `bg-slate-900/60 border border-white/10` | `bg-sunken border border-border-subtle` |
| Icon box `bg-white/5 border border-white/10` | `bg-elevated border border-border-subtle` |
| `text-slate-400` footer text | `text-text-muted` |
| `text-white` bold label | `text-text-primary` |
| "Immutable Double-Entry Ledger" | "Verified Transaction Ledger" |
| "All balances derived via MongoDB aggregation pipeline" | "All balances calculated in real time from your transaction history" |
| `text-brand-indigo` on HttpOnly Cookies | Keep — decorative tech indicator |
| `text-emerald-400` on 256-Bit TLS | Keep |

#### Toast message cleanup
| Before | After |
|---|---|
| `showToast("success", "Ledger state synchronized with MongoDB Atlas replica set.")` | `showToast("success", "Your account data has been refreshed.")` |

---

### 2. AccountsPage.jsx

#### Page Header label (Section 1)
| Before | After |
|---|---|
| `text-brand-accent` label | Keep |
| `<h1 className="text-white">` | `text-text-primary` |
| `text-slate-300` description | `text-text-secondary` |
| Description: "real-time balance derivations" | Keep — this is clear end-user language |

#### Portfolio Banner (Section 2)
| Before | After |
|---|---|
| `bg-gradient-to-r from-slate-900 via-brand-card to-slate-900 border border-white/10` | `bg-surface border border-border-default` |
| `text-slate-400` label text | `text-text-muted` |
| `text-slate-400` description | `text-text-muted` |
| Stats chips `bg-white/[0.04] border border-white/10` | `bg-elevated border border-border-subtle` |
| Stats chip value `text-white` | `text-text-primary` |
| "Consolidated Net Assets Across All Ledgers" | "Total Portfolio Balance" |

#### Accounts Section header (Section 3)
| Before | After |
|---|---|
| `text-white` section title | `text-text-primary` |
| Count pill `bg-white/5 border border-white/10 text-slate-400` | `bg-elevated border border-border-subtle text-text-muted` |

#### Security Info Box (Section 4)
| Before | After |
|---|---|
| `border-dashed border-slate-700/80` | `border-dashed border-border-default` |
| `text-slate-300` body text | `text-text-secondary` |
| "Multi-Document Double-Entry Isolation" title | "Account Security & Isolation" |
| Description: "multi-document MongoDB ACID sessions with client-generated UUID v4 idempotency keys" | "Funds transferred between your accounts are processed atomically — either fully complete or fully reversed. No partial transfers." |

---

### 3. BalanceCard.jsx

#### Card root
| Before | After |
|---|---|
| `bg-gradient-to-br from-slate-900 via-brand-dark to-slate-950 border border-white/10` | `bg-surface border border-border-default` |
| Ambient glows `bg-brand-accent/15` / `bg-brand-indigo/15` | Keep — atmospheric decorative effect |

#### Header section
| Before | After |
|---|---|
| `border-b border-white/10` | `border-b border-border-subtle` |
| Account type text `text-slate-300` | `text-text-secondary` |
| Masked number `text-white group-hover:text-brand-accent` | `text-text-primary group-hover:text-brand-accent` |
| `ChevronDown text-slate-400 group-hover:text-white` | `text-text-muted group-hover:text-text-primary` |
| Account switcher popover `bg-slate-900 border border-white/15` | `bg-surface border border-border-default` |
| Popover label `text-slate-400` | `text-text-muted` |
| Inactive item `text-slate-300 hover:text-white hover:bg-white/5` | `text-text-secondary hover:text-text-primary hover:bg-elevated` |
| Inactive acct number `text-slate-400` | `text-text-muted` |
| Copy button `bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white` | `bg-elevated hover:bg-surface border border-border-subtle text-text-secondary hover:text-text-primary` |
| Refresh button `bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white` | `bg-elevated hover:bg-surface border border-border-subtle text-text-secondary hover:text-text-primary` |

#### Main Balance section
| Before | After |
|---|---|
| `text-slate-400` label | `text-text-muted` |
| "Double-Entry ACID" badge | `"Live Balance"` (remove technical ledger jargon) |
| Currency `text-slate-400 font-mono` | `text-text-muted` |
| Footer note `text-slate-400` | `text-text-muted` |
| "Calculated via MongoDB pipeline: Total Inflow − Total Outflow" | "Calculated in real time from your transaction history" |

#### Action buttons footer
| Before | After |
|---|---|
| `border-t border-white/10` | `border-t border-border-subtle` |

#### Toast cleanup
| Before | After |
|---|---|
| "Live ledger balance re-aggregated from MongoDB replica set." | "Your balance has been refreshed." |

---

### 4. LedgerSummaryCard.jsx

#### Card title & header
| Before | After |
|---|---|
| Icon box `bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo` | Keep — brand identity |
| `<h3 className="text-white">` | `text-text-primary` |
| "Ledger Flow Aggregation" title | `"Money Flow Summary"` |
| `text-slate-400` description | `text-text-muted` |
| "Double-entry debits vs credits summary" | `"Incoming and outgoing funds overview"` |
| `"REPLICA SYNC"` badge `bg-white/5 border border-white/10 text-slate-300` | Remove badge entirely OR change to `"LIVE"` with `bg-elevated border border-border-subtle text-text-muted` |

#### Inflow/Outflow labels
| Before | After |
|---|---|
| `"Total Inflow (Credits)"` label | `"Total Money In"` |
| `"Total Outflow (Debits)"` label | `"Total Money Out"` |
| `"INFLOW"` / `"OUTFLOW"` badge | Keep — visual category indicator |
| `text-slate-400` descriptions | `text-text-muted` |
| "Accumulated deposits & received funds" | `"Deposits and received transfers"` |
| "Outbound transfers & processed debits" | `"Sent transfers and payments"` |

#### Net footer
| Before | After |
|---|---|
| `border-t border-white/10` | `border-t border-border-subtle` |
| `text-slate-400` | `text-text-muted` |
| "Net Settlement Balance:" | `"Net Balance:"` |
| `text-white` value | `text-text-primary` |

---

### 5. AccountCard.jsx

#### Card root
| Before | After |
|---|---|
| Active: `border-brand-accent/50 bg-gradient-to-br from-brand-card via-slate-900 to-brand-card` | `border-brand-accent/50 bg-surface` (keep brand-accent border) |
| Inactive: `border-white/10 hover:border-white/20 bg-brand-card/90` | `border-border-default hover:border-border-strong bg-surface` |

#### Account Number box
| Before | After |
|---|---|
| `bg-black/30 border border-white/5` | `bg-sunken border border-border-subtle` |
| `text-slate-400` label | `text-text-muted` |
| `text-white` number | `text-text-primary` |
| Copy icon `text-slate-400` | `text-text-muted` |
| Copy button `bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white` | `bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary` |

#### Balance label
| Before | After |
|---|---|
| `text-slate-400` | `text-text-muted` |
| "Real-Time Aggregated Balance" | `"Current Balance"` |

#### Account type subtitle
| Before | After |
|---|---|
| `text-slate-400` subtitle | `text-text-muted` |
| `text-white` accountType | `text-text-primary` |
| `bg-white/5 text-slate-400` currency pill | `bg-elevated text-text-muted` |
| "Core Wealth & Savings" | `"Savings Account"` |
| "Everyday Checking Ledger" | `"Checking Account"` |
| "ACTIVE LEDGER" badge | `"PRIMARY"` |

#### Action footer
| Before | After |
|---|---|
| `border-t border-white/10` | `border-t border-border-subtle` |
| Transfer ghost button `text-brand-accent hover:text-brand-accent` | Keep — brand identity |

---

## Data Jargon Eliminated

| File | Before | After |
|---|---|---|
| `DashboardPage.jsx` | "Core Ledger Session" | "Authenticated Session" |
| `DashboardPage.jsx` | "real-time MongoDB Atlas replica isolation" | removed |
| `DashboardPage.jsx` | "Ledger state synchronized with MongoDB Atlas replica set." | "Your account data has been refreshed." |
| `DashboardPage.jsx` | "Immutable Double-Entry Ledger" | "Verified Transaction Ledger" |
| `DashboardPage.jsx` | "All balances derived via MongoDB aggregation pipeline" | "All balances calculated in real time from your transaction history" |
| `DashboardPage.jsx` | "Atomic transfers with idempotency key" | "Send funds instantly and securely" |
| `DashboardPage.jsx` | "Full double-entry transaction history" | "View your complete payment history" |
| `DashboardPage.jsx` | "Inject test balance into ledger" | "Add test funds to your account" |
| `AccountsPage.jsx` | "Consolidated Net Assets Across All Ledgers" | "Total Portfolio Balance" |
| `AccountsPage.jsx` | "Multi-Document Double-Entry Isolation" | "Account Security & Isolation" |
| `AccountsPage.jsx` | "UUID v4 idempotency keys" + "MongoDB ACID sessions" | plain English explanation |
| `BalanceCard.jsx` | "Double-Entry ACID" badge | "Live Balance" |
| `BalanceCard.jsx` | "Calculated via MongoDB pipeline: Total Inflow − Total Outflow" | "Calculated in real time from your transaction history" |
| `BalanceCard.jsx` | "Live ledger balance re-aggregated from MongoDB replica set." | "Your balance has been refreshed." |
| `LedgerSummaryCard.jsx` | "Ledger Flow Aggregation" | "Money Flow Summary" |
| `LedgerSummaryCard.jsx` | "Double-entry debits vs credits summary" | "Incoming and outgoing funds overview" |
| `LedgerSummaryCard.jsx` | "Total Inflow (Credits)" | "Total Money In" |
| `LedgerSummaryCard.jsx` | "Total Outflow (Debits)" | "Total Money Out" |
| `LedgerSummaryCard.jsx` | "REPLICA SYNC" badge | "LIVE" |
| `LedgerSummaryCard.jsx` | "Net Settlement Balance:" | "Net Balance:" |
| `AccountCard.jsx` | "Core Wealth & Savings" | "Savings Account" |
| `AccountCard.jsx` | "Everyday Checking Ledger" | "Checking Account" |
| `AccountCard.jsx` | "ACTIVE LEDGER" | "PRIMARY" |
| `AccountCard.jsx` | "Real-Time Aggregated Balance" | "Current Balance" |

---

## Verification Plan

### Automated Tests
```powershell
npm --prefix client run build     # 0 errors required
node scripts/verify-all.js        # All 5 suites must pass
```

### Manual Visual Verification (at `http://localhost:5173`)
- Toggle Light ↔ Dark — dashboard and accounts pages adapt fully.
- **Dashboard**: Welcome banner, quick action cards, recent transactions section, footer — all readable in light mode.
- **Accounts**: Portfolio banner, stats chips, account grid, info card — all readable.
- **BalanceCard**: Main balance, account switcher popover, copy/refresh buttons adapt.
- **LedgerSummaryCard**: Inflow/outflow cards, footer adapt.
- **AccountCard**: Active/inactive border, account number box, balance label adapt.
- No "MongoDB", "ACID", "idempotency", "replica", "ledger flow aggregation" text visible in the UI.
