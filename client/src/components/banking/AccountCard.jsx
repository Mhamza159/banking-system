import React, { useState } from "react";
import { Link } from "react-router-dom";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import MoneyDisplay from "../common/MoneyDisplay";
import Skeleton from "../common/Skeleton";
import { useToast } from "../../context/ToastContext";
import {
  Wallet,
  CreditCard,
  Copy,
  Check,
  ArrowDownToLine,
  SendHorizontal,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from "lucide-react";

/**
 * AccountCard Component
 * Displays individual bank account details, live double-entry derived balance,
 * copyable 10-digit account number, and contextual actions.
 */
export default function AccountCard({
  account,
  balanceData = null,
  isActive = false,
  isLoadingBalance = false,
  onSelectActive = null,
  onDeposit = null
}) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const isSavings = account.accountType === "SAVINGS";
  const cents = balanceData?.balanceInCents ?? 0;
  const currency = account.currency || "USD";

  // Format 10-digit account number: e.g. 1048291039 -> "1048 •••• 1039"
  const formatAccountNumber = (num) => {
    if (!num) return "0000 0000 00";
    const str = String(num);
    if (str.length === 10) {
      return `${str.slice(0, 4)} ${str.slice(4, 7)} ${str.slice(7)}`;
    }
    return str;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      showToast("success", `Account ${account.accountNumber} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("error", "Failed to copy account number");
    }
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 p-6 flex flex-col justify-between gap-5 border ${
        isActive
          ? "border-brand-accent/50 bg-surface shadow-md shadow-brand-accent/5"
          : "border-border-default hover:border-border-strong bg-surface"
      }`}
    >
      {/* Top Background Gradient Glow */}
      <div
        className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
          isSavings ? "bg-emerald-500/10" : "bg-brand-indigo/15"
        }`}
      />

      {/* Top Header: Type, Badges & Icons */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                isSavings
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : "bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo"
              }`}
            >
              {isSavings ? <ShieldCheck className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {account.accountType}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated text-text-muted">
                  {currency}
                </span>
              </div>
              <div className="text-[11px] text-text-muted">
                {isSavings ? "Savings Account" : "Checking Account"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-[11px] font-bold text-brand-accent shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                PRIMARY
              </span>
            ) : (
              <Badge variant={account.status}>{account.status}</Badge>
            )}
          </div>
        </div>

        {/* Account Number Box */}
        <div className="p-3 rounded-xl bg-sunken border border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Account Number
            </div>
            <div className="text-sm font-mono font-bold text-text-primary tracking-wider mt-0.5">
              {formatAccountNumber(account.accountNumber)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            title="Copy account number"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-text-muted" />
            )}
          </button>
        </div>

        {/* Balance Section */}
        <div className="pt-2">
          <div className="text-xs font-medium text-text-muted">
            Current Balance
          </div>
          {isLoadingBalance && !balanceData ? (
            <div className="py-2">
              <Skeleton className="h-9 w-40 rounded-xl" />
            </div>
          ) : (
            <div className="pt-1">
              <MoneyDisplay
                cents={cents}
                currency={currency}
                size="lg"
                className="tracking-tight"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {!isActive && onSelectActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectActive}
              className="text-xs"
            >
              Set as Active
            </Button>
          )}

          {onDeposit && (
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowDownToLine}
              onClick={onDeposit}
              className="text-xs"
            >
              Deposit
            </Button>
          )}
        </div>

        <Link to="/transfer">
          <Button
            variant="ghost"
            size="sm"
            icon={SendHorizontal}
            iconPosition="right"
            className="text-xs text-brand-accent hover:text-brand-accent"
          >
            Transfer
          </Button>
        </Link>
      </div>
    </Card>
  );
}
