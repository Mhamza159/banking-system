import React from "react";
import MoneyDisplay from "../common/MoneyDisplay";
import Badge from "../common/Badge";
import Skeleton from "../common/Skeleton";
import EmptyState from "../common/EmptyState";
import { formatDate, formatRelativeTime } from "../../utils/date";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ReceiptText,
  SearchX
} from "lucide-react";

/**
 * TransactionTable Component
 * Renders an auditable, interactive transaction journal with server-side pagination support,
 * directional indicator badges, loading skeleton rows, and deep drill-down clicks.
 */
export default function TransactionTable({
  transactions = [],
  loading = false,
  userAccounts = [],
  currentAccountId = null,
  onSelectTransaction = null,
  isFiltered = false,
  onResetFilters = null
}) {
  // Precompute set of user-owned account IDs for fast credit/debit classification
  const userAccountIdsSet = React.useMemo(() => {
    const ids = new Set();
    userAccounts.forEach((acc) => {
      if (acc._id) ids.add(String(acc._id));
      if (acc.id) ids.add(String(acc.id));
      if (acc.accountNumber) ids.add(String(acc.accountNumber));
    });
    return ids;
  }, [userAccounts]);

  /**
   * Determine whether a transaction is a credit (inflow) or debit (outflow)
   * relative to the user or selected account.
   */
  const getDirection = (tx) => {
    const senderId = tx.senderAccount?._id || tx.senderAccount?.id || tx.senderAccount;
    const receiverId = tx.receiverAccount?._id || tx.receiverAccount?.id || tx.receiverAccount;
    const senderNum = tx.senderAccount?.accountNumber || tx.senderAccount;
    const receiverNum = tx.receiverAccount?.accountNumber || tx.receiverAccount;

    if (currentAccountId && currentAccountId !== "ALL") {
      const matchReceiver =
        String(receiverId) === String(currentAccountId) ||
        String(receiverNum) === String(currentAccountId);
      return matchReceiver ? "credit" : "debit";
    }

    // Default multi-account resolution:
    // If receiver belongs to user, and sender doesn't -> credit
    // If both belong to user -> internal transfer (label as credit/debit based on receiver)
    if (
      userAccountIdsSet.has(String(receiverId)) &&
      !userAccountIdsSet.has(String(senderId))
    ) {
      return "credit";
    }
    if (userAccountIdsSet.has(String(receiverId))) {
      return "credit";
    }

    return "debit";
  };

  /**
   * Format counterparty text with enriched legal names and account types
   */
  const getCounterparty = (tx, direction) => {
    const s = tx.senderAccount;
    const r = tx.receiverAccount;

    const senderName = s?.user?.name || (typeof s === "object" && s?.user?.name) || null;
    const receiverName = r?.user?.name || (typeof r === "object" && r?.user?.name) || null;
    const senderNum = s?.accountNumber ? `•••• ${String(s.accountNumber).slice(-4)}` : "—";
    const receiverNum = r?.accountNumber ? `•••• ${String(r.accountNumber).slice(-4)}` : "—";
    const senderType = s?.accountType || "Account";
    const receiverType = r?.accountType || "Account";

    // Check for internal transfer (both accounts owned by same user)
    const senderUserId = s?.user?._id || s?.user;
    const receiverUserId = r?.user?._id || r?.user;
    const isInternal =
      senderUserId &&
      receiverUserId &&
      String(senderUserId) === String(receiverUserId);

    if (isInternal) {
      return {
        label: direction === "credit" ? "Internal Transfer (Inflow)" : "Internal Transfer (Outflow)",
        sub: direction === "credit" ? `From ${senderType} (${senderNum})` : `To ${receiverType} (${receiverNum})`,
        isInternal: true
      };
    }

    if (direction === "credit") {
      return {
        label: senderName || "External Remitter",
        sub: `${senderNum} · ${senderType}`
      };
    } else {
      return {
        label: receiverName || "Beneficiary",
        sub: `${receiverNum} · ${receiverType}`
      };
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-surface border border-border-default shadow-sm">
      {/* 1. Mobile Activity Card Feed (< md) */}
      <div className="block md:hidden divide-y divide-border-subtle">
        {loading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`m-skeleton-${i}`} className="p-4 rounded-2xl bg-elevated border border-border-subtle space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <Skeleton width="120px" height="16px" />
                  <Skeleton width="60px" height="18px" variant="rect" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton width="80px" height="12px" />
                  <Skeleton width="90px" height="18px" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="p-8 text-center">
            <EmptyState
              icon={isFiltered ? SearchX : ReceiptText}
              title={isFiltered ? "No matching transactions found" : "No transactions recorded"}
              description={
                isFiltered
                  ? "Try modifying your status filter, search keywords, or selected account."
                  : "Your statement journal will populate once you fund an account or make a payment."
              }
              actionLabel={isFiltered && onResetFilters ? "Reset All Filters" : null}
              onAction={isFiltered && onResetFilters ? onResetFilters : null}
            />
          </div>
        )}

        {!loading &&
          transactions.map((tx) => {
            const direction = getDirection(tx);
            const isCredit = direction === "credit";
            const counterparty = getCounterparty(tx, direction);
            const txId = tx._id || tx.id;

            return (
              <div
                key={`mobile-${txId}`}
                onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                className="p-4 hover:bg-elevated transition-colors cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                      isCredit
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                        : "bg-rose-500/10 border-rose-500/25 text-rose-500"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary text-sm tracking-tight truncate">
                        {counterparty.label}
                      </span>
                      <Badge variant={tx.status} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                      <span>{formatRelativeTime(tx.createdAt)}</span>
                      <span>•</span>
                      <span className="font-mono truncate">{counterparty.sub}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <MoneyDisplay
                      cents={tx.amount}
                      currency={tx.currency || "USD"}
                      size="sm"
                      type={isCredit ? "credit" : "debit"}
                      showSign={true}
                      className="font-bold"
                    />
                    <div className="text-[10px] text-text-muted font-mono uppercase">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            );
          })}
      </div>

      {/* 2. Desktop High-Contrast Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-border-subtle bg-sunken text-[11px] font-bold text-text-muted uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Date / Time</th>
              <th scope="col" className="py-3.5 px-4">Counterparty</th>
              <th scope="col" className="py-3.5 px-4 hidden lg:table-cell">Memo & Reference</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4 text-right">Amount</th>
              <th scope="col" className="py-3.5 px-4 text-center w-12">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-subtle text-xs">
            {/* 1. Loading Skeleton Rows */}
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="space-y-1.5">
                        <Skeleton width="90px" height="14px" />
                        <Skeleton width="60px" height="10px" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circle" width="32px" height="32px" />
                        <div className="space-y-1">
                          <Skeleton width="80px" height="14px" />
                          <Skeleton width="50px" height="10px" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <Skeleton width="140px" height="14px" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton width="70px" height="20px" variant="rect" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <Skeleton width="80px" height="16px" />
                        <Skeleton width="40px" height="10px" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Skeleton variant="circle" width="20px" height="20px" className="mx-auto" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* 2. Empty State */}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-4 text-center">
                  <EmptyState
                    icon={isFiltered ? SearchX : ReceiptText}
                    title={isFiltered ? "No matching transactions found" : "No transactions recorded"}
                    description={
                      isFiltered
                        ? "Try modifying your status filter, search keywords, or selected account."
                        : "Your statement journal will populate once you fund an account or make a payment."
                    }
                    actionLabel={isFiltered && onResetFilters ? "Reset All Filters" : null}
                    onAction={isFiltered && onResetFilters ? onResetFilters : null}
                  />
                </td>
              </tr>
            )}

            {/* 3. Transaction Data Rows */}
            {!loading &&
              transactions.map((tx) => {
                const direction = getDirection(tx);
                const isCredit = direction === "credit";
                const counterparty = getCounterparty(tx, direction);
                const txId = tx._id || tx.id;

                return (
                  <tr
                    key={txId}
                    onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                    className="group hover:bg-elevated transition-colors cursor-pointer"
                  >
                    {/* Date / Time */}
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-text-primary">
                        {formatDate(tx.createdAt)}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {formatRelativeTime(tx.createdAt)}
                      </div>
                    </td>

                    {/* Direction & Counterparty */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 ${
                            isCredit
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                              : "bg-rose-500/10 border-rose-500/25 text-rose-500"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary text-sm tracking-tight">
                            {counterparty.label}
                          </div>
                          <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">{counterparty.sub}</span>
                            {counterparty.isInternal && (
                              <span className="text-[10px] text-brand-indigo bg-brand-indigo/10 border border-brand-indigo/20 px-1.5 py-0.5 rounded font-sans font-medium">
                                Internal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Memo & Reference */}
                    <td className="py-4 px-4 max-w-[220px] hidden lg:table-cell">
                      <div className="truncate text-text-secondary font-medium" title={tx.description}>
                        {tx.description || "Transfer"}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono truncate">
                        Ref: {String(txId).slice(-8).toUpperCase()}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge variant={tx.status} size="sm">
                        {tx.status}
                      </Badge>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <MoneyDisplay
                        cents={tx.amount}
                        currency={tx.currency || "USD"}
                        size="sm"
                        type={isCredit ? "credit" : "debit"}
                        showSign={true}
                        className="font-bold"
                      />
                      <div className="text-[10px] text-text-muted font-mono uppercase">
                        {tx.currency || "USD"}
                      </div>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-4 px-4 text-center">
                      <div className="p-1 rounded-lg text-text-muted group-hover:text-brand-accent group-hover:bg-surface transition-all inline-flex">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
