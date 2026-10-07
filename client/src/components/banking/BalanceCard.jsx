import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBanking } from "../../context/BankingContext";
import { useToast } from "../../context/ToastContext";
import MoneyDisplay from "../common/MoneyDisplay";
import Skeleton from "../common/Skeleton";
import Button from "../common/Button";
import Badge from "../common/Badge";
import {
  Wallet,
  SendHorizontal,
  ArrowDownToLine,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  Sparkles
} from "lucide-react";

/**
 * BalanceCard Component
 * High-impact executive balance display with metallic obsidian gradients,
 * masked account number with clipboard copy, live aggregation balance,
 * and quick financial action triggers.
 */
export default function BalanceCard({ onOpenDepositModal }) {
  const {
    accounts,
    activeAccount,
    balance,
    loadingBalance,
    refreshBalance,
    setActiveAccountId
  } = useBanking();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Mask account number: e.g. 1048291039 -> "•••• •••• 1039"
  const getMaskedNumber = (accNum) => {
    if (!accNum) return "•••• •••• 0000";
    const str = String(accNum);
    const last4 = str.slice(-4);
    return `•••• •••• ${last4}`;
  };

  const handleCopyAccountNumber = async () => {
    if (!activeAccount?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(activeAccount.accountNumber);
      setCopied(true);
      showToast("success", `Account ${activeAccount.accountNumber} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("error", "Failed to copy account number");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
      showToast("info", "Your balance has been refreshed.");
    } finally {
      setRefreshing(false);
    }
  };

  const cents = balance?.balanceInCents ?? 0;
  const currency = balance?.currency || activeAccount?.currency || "USD";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface border border-border-default shadow-xl p-6 sm:p-8">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 rounded-full bg-brand-indigo/15 blur-3xl pointer-events-none" />

      {/* Header bar: Account type, switcher, copyable account number, status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent shadow-inner">
            <Wallet className="w-5 h-5" />
          </div>

          {/* Account Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 group px-2.5 py-1.5 rounded-xl hover:bg-elevated transition-colors focus:outline-none"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {activeAccount?.accountType || "SAVINGS"}
                  </span>
                  <Badge variant={activeAccount?.status || "ACTIVE"}>
                    {activeAccount?.status || "ACTIVE"}
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-text-primary group-hover:text-brand-accent transition-colors flex items-center gap-1.5">
                  <span>{getMaskedNumber(activeAccount?.accountNumber)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary" />
                </div>
              </div>
            </button>

            {/* Account Switcher Popover */}
            {accountDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-surface border border-border-default shadow-2xl backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Select Active Account
                </div>
                {accounts.map((acc) => {
                  const id = acc._id || acc.id;
                  const isActive = id === (activeAccount?._id || activeAccount?.id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveAccountId(id);
                        setAccountDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                        isActive
                          ? "bg-brand-accent/15 text-brand-accent font-bold"
                          : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{acc.accountType}</div>
                        <div className="text-[11px] text-text-muted font-mono">
                          {acc.accountNumber}
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-brand-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Copy Account Number Button & Manual Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAccountNumber}
            title="Copy full 10-digit account number"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated hover:bg-surface border border-border-subtle text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-text-muted" />
                <span className="hidden sm:inline">Copy Number</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loadingBalance}
            title="Refresh balance"
            className="p-2 rounded-xl bg-elevated hover:bg-surface border border-border-subtle text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing || loadingBalance ? "animate-spin text-brand-accent" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 py-6 sm:py-8 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-text-muted">
              Available Balance
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Balance
            </span>
          </div>
          <span className="text-xs font-mono text-text-muted font-semibold uppercase">
            {currency}
          </span>
        </div>

        {loadingBalance && !balance ? (
          <div className="py-2">
            <Skeleton className="h-14 w-64 rounded-2xl" />
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <MoneyDisplay
              cents={cents}
              currency={currency}
              size="hero"
              className="tracking-tight drop-shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Calculated in real time from your transaction history</span>
        </div>
      </div>

      {/* Quick Action Button Group */}
      <div className="relative z-10 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link to="/transfer" className="w-full">
          <Button
            variant="primary"
            size="sm"
            icon={SendHorizontal}
            className="w-full justify-center shadow-lg shadow-brand-accent/20"
          >
            Transfer Funds
          </Button>
        </Link>

        {onOpenDepositModal ? (
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowDownToLine}
            onClick={onOpenDepositModal}
            className="w-full justify-center"
          >
            Deposit Faucet
          </Button>
        ) : (
          <Link to="/accounts" className="w-full">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowDownToLine}
              className="w-full justify-center"
            >
              Deposit Funds
            </Button>
          </Link>
        )}

        <Link to="/accounts" className="w-full col-span-2 sm:col-span-1">
          <Button
            variant="outline"
            size="sm"
            icon={Wallet}
            className="w-full justify-center"
          >
            All Accounts
          </Button>
        </Link>
      </div>
    </div>
  );
}
