import React from "react";
import Input from "../common/Input";
import { Search, X, Filter, SlidersHorizontal, RotateCcw } from "lucide-react";

/**
 * TransactionFilters Component
 * Provides status tabs (ALL, COMPLETED, PENDING, FAILED),
 * real-time search input, and account scoping dropdown.
 */
export default function TransactionFilters({
  status = "ALL",
  onStatusChange,
  searchQuery = "",
  onSearchChange,
  selectedAccountId = "ALL",
  onAccountChange,
  accounts = [],
  onReset = null
}) {
  const statusTabs = [
    { id: "ALL", label: "All Transactions" },
    { id: "COMPLETED", label: "Completed" },
    { id: "PENDING", label: "Pending" },
    { id: "FAILED", label: "Failed" }
  ];

  const hasActiveFilters =
    status !== "ALL" ||
    (searchQuery && searchQuery.trim().length > 0) ||
    selectedAccountId !== "ALL";

  return (
    <div className="space-y-4">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-sunken border border-border-subtle overflow-x-auto max-w-full">
          {statusTabs.map((tab) => {
            const isActive = status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-surface text-text-primary font-bold shadow-sm"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 2. Search & Account Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-8">
          <div className="relative">
            <Input
              placeholder="Search by memo, account number, or transaction ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              prefix={<Search className="w-4 h-4 text-text-muted" />}
              suffix={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="p-1 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        {/* Account Scoping Selector */}
        <div className="md:col-span-4">
          <select
            value={selectedAccountId}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-elevated border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
          >
            <option value="ALL">All Accounts (Consolidated)</option>
            {accounts.map((acc) => {
              const id = acc._id || acc.id;
              return (
                <option key={id} value={id}>
                  {acc.accountType} (•••• {String(acc.accountNumber).slice(-4)})
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
