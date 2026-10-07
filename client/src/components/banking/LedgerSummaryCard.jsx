import React from "react";
import { useBanking } from "../../context/BankingContext";
import Card from "../common/Card";
import MoneyDisplay from "../common/MoneyDisplay";
import Skeleton from "../common/Skeleton";
import { TrendingUp, TrendingDown, Scale, ShieldCheck } from "lucide-react";

/**
 * LedgerSummaryCard Component
 * Displays real-time double-entry ledger metrics:
 * Total Inflow (Credits), Total Outflow (Debits), and Net Balance Settlement.
 */
export default function LedgerSummaryCard() {
  const { balance, loadingBalance, activeAccount } = useBanking();

  const totalCredits = balance?.totalCredits ?? 0;
  const totalDebits = balance?.totalDebits ?? 0;
  const netSettlement = totalCredits - totalDebits;
  const currency = balance?.currency || activeAccount?.currency || "USD";

  return (
    <Card className="p-6 sm:p-7 space-y-6">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 flex items-center justify-center text-brand-indigo">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              Money Flow Summary
            </h3>
            <p className="text-[11px] text-text-muted">
              Incoming and outgoing funds overview
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-elevated border border-border-subtle text-text-muted">
          LIVE
        </span>
      </div>

      {/* Inflow & Outflow Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Total Money In
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">
              INFLOW
            </span>
          </div>
          {loadingBalance && !balance ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className="pt-1">
              <MoneyDisplay
                cents={totalCredits}
                currency={currency}
                size="lg"
                type="credit"
                showSign={true}
              />
            </div>
          )}
          <p className="text-[11px] text-text-muted leading-tight">
            Deposits and received transfers
          </p>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              Total Money Out
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider">
              OUTFLOW
            </span>
          </div>
          {loadingBalance && !balance ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className="pt-1">
              <MoneyDisplay
                cents={totalDebits}
                currency={currency}
                size="lg"
                type="debit"
                showSign={true}
              />
            </div>
          )}
          <p className="text-[11px] text-text-muted leading-tight">
            Sent transfers and payments
          </p>
        </div>
      </div>

      {/* Net Delta Footer */}
      <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Net Balance:</span>
        </div>
        <div className="font-mono font-bold text-text-primary">
          {loadingBalance && !balance ? (
            <Skeleton className="h-4 w-20 rounded" />
          ) : (
            <MoneyDisplay cents={netSettlement} currency={currency} size="sm" />
          )}
        </div>
      </div>
    </Card>
  );
}
