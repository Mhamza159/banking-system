# Phase 21 Plan: Transaction Journal, Mobile Activity Feed & Payment Advice Slip

**Milestone**: 4 (Customer-Facing UI/UX Modernization & Dual-Theme Redesign)  
**Phase**: `21-journal-feed-slips`  
**Goal**: Modernize the transaction journal with Phase 16 semantic tokens; deliver an adaptive dual-view (desktop data table + mobile card feed); polish `TransactionDetailModal` into an official customer payment advice voucher; and eliminate all backend/ledger jargon.

---

## Objective & Scope

Following the completion of the transfer flow (Phase 20), this phase modernizes the transaction history and audit trail experiences.

Currently:
1. `TransactionsPage.jsx`, `TransactionFilters.jsx`, `TransactionTable.jsx`, `TransactionRow.jsx`, and `TransactionDetailModal.jsx` are filled with dark-only utilities (`bg-slate-900`, `bg-brand-card`, `border-white/10`, `text-slate-400`, `text-white`).
2. The transaction journal renders only an HTML `<table>` wrapped in horizontal scroll on mobile devices instead of an accessible mobile-native activity card feed.
3. `TransactionDetailModal.jsx` displays technical developer labels ("Ledger Audit Record", "Double-Entry Balanced", "Idempotency Key", "RFC4122-UUID-V4-RECORDED") rather than a clean, professional banking payment advice slip.

**Zero API or schema changes**: The server-side pagination, status filtering, account scoping, and date formatting remain fully preserved.

---

## Files in Scope

| File | Size | Planned Enhancements |
|---|---|---|
| `TransactionsPage.jsx` | 307 lines | Semantic header, summary cards (`bg-surface`, `bg-elevated`), semantic pagination controls, friendly copy. |
| `TransactionFilters.jsx` | 115 lines | Segmented status tabs (`bg-sunken`, active `bg-surface`), semantic search input, accessible account dropdown. |
| `TransactionTable.jsx` | 298 lines | Dual-view responsive layout: sleek mobile card feed on `< md:` screens, high-contrast data table on `md:+`; semantic tokens. |
| `TransactionRow.jsx` | 103 lines | Modernized interactive feed item with semantic surfaces, directional indicators, and badges. |
| `TransactionDetailModal.jsx` | 340 lines | Official Customer Payment Advice Slip; remove raw UUID / database jargon; clean dual-party details and printable voucher. |

---

## Detailed Changes Per File

### 1. `TransactionsPage.jsx`
- **Header**: Replace jargon ("Complete, immutable double-entry audit history of debits, credits, and settlements.") with customer-friendly description: "View your complete transaction history, download statements, and inspect payment receipts."
- **Summary Metric Cards**:
  - Convert from `bg-white/[0.02] border-white/10` to `bg-surface border border-border-default`.
  - Labels to `text-text-muted`, metric values to `text-text-primary`.
  - Total Audited → "Total Transactions", Settled On Page → "Completed on Page", Active Page Volume → "Page Volume".
- **Pagination**:
  - Migrate dropdown and buttons from `bg-slate-900 border-white/10` to `bg-elevated border-border-subtle text-text-primary`.
  - Active page badge: `bg-elevated border-border-subtle text-text-primary`.

### 2. `TransactionFilters.jsx`
- **Status Filter Tabs**:
  - Outer container: `bg-sunken border border-border-subtle p-1`.
  - Active tab: `bg-surface text-text-primary font-bold shadow-sm`.
  - Inactive tab: `text-text-muted hover:text-text-primary`.
- **Account Filter Dropdown**:
  - Convert from `bg-slate-900 border-white/10 text-slate-200` to `bg-elevated border-border-subtle text-text-primary focus:border-brand-accent`.

### 3. `TransactionTable.jsx` (Dual-View Implementation)
- **Desktop Table (`hidden md:block`)**:
  - Outer wrapper: `bg-surface border border-border-default shadow-sm`.
  - Header row: `border-b border-border-subtle bg-sunken text-text-muted`.
  - Rows: `hover:bg-elevated transition-colors border-b border-border-subtle`.
  - Text colors: `text-text-primary`, `text-text-secondary`, `text-text-muted`.
- **Mobile Activity Feed (`block md:hidden`)**:
  - Modern stack of touch-friendly cards (`bg-surface border border-border-default p-4 space-y-2.5 rounded-2xl active:scale-[0.99] transition-transform`).
  - Clear counterparty, directional badge (`ArrowDownLeft`/`ArrowUpRight`), formatted amount, date, and chevron indicator.

### 4. `TransactionRow.jsx`
- Migrate row container from `bg-white/[0.02] border-white/5` to `bg-elevated hover:bg-surface border border-border-subtle`.
- Labels to `text-text-primary` and `text-text-muted`.

### 5. `TransactionDetailModal.jsx`
- **Modal Header**: "Payment Advice Slip" (description: "Official payment advice & verified transaction voucher.").
- **Print Masthead**: "Antigravity Banking · Official Payment Advice & Settlement Proof".
- **Hero Status Banner**: Semantic emerald tint (`bg-emerald-500/[0.06] border-emerald-500/25`), "Transfer Completed".
- **Dual-Party Participant Boxes**:
  - Container: `bg-sunken border border-border-subtle`.
  - Header: "Transaction Participants" · "Dual-Party Verified".
  - Remitter/Beneficiary boxes: `bg-elevated border border-border-subtle`.
- **Metadata Itemization**:
  - Replace "Idempotency Key" with "Payment Reference".
  - Clean "Close Audit" button to "Done" or "Close Slip".

---

## Data Jargon Cleaned

| Component | Jargon String | Cleaned Replacement |
|---|---|---|
| `TransactionsPage.jsx` | "immutable double-entry audit history of debits, credits, and settlements" | "View your complete transaction history, download statements, and inspect payment receipts." |
| `TransactionsPage.jsx` | "Total Audited" | "Total Transactions" |
| `TransactionDetailModal.jsx` | "Ledger Audit Record" | "Payment Advice Slip" |
| `TransactionDetailModal.jsx` | "Cryptographic transaction proof & double-entry settlement record." | "Official payment advice & verified transaction voucher." |
| `TransactionDetailModal.jsx` | "Official Ledger Audit Advice · Double-Entry Settlement Record" | "Official Payment Advice & Settlement Voucher" |
| `TransactionDetailModal.jsx` | "Counterparty Ledger Inspection" | "Transaction Participants" |
| `TransactionDetailModal.jsx` | "Double-Entry Balanced" | "Verified Settlement" |
| `TransactionDetailModal.jsx` | "Idempotency Key" | "Payment Reference" |
| `TransactionDetailModal.jsx` | "Close Audit" | "Done" |

---

## Verification Plan

### Automated Build & Test
1. **Frontend Compilation**:
   ```powershell
   npm --prefix client run build
   # 0 errors, clean production bundle
   ```
2. **Master Regression Test Suite**:
   ```powershell
   node scripts/verify-all.js
   # All 5 backend API test suites passing against MongoDB Atlas
   ```

### Visual Verification
- Verify `http://localhost:5173/transactions` in Light and Dark themes.
- Test responsive view:
  - On desktop screens ($\ge 768px$), the data table displays with semantic contrast.
  - On mobile screens ($< 768px$), the feed switches seamlessly to mobile activity cards.
- Open `TransactionDetailModal`: verify no database/idempotency jargon, clean copy, and proper printing preview.
