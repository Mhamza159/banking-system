import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBanking } from "../context/BankingContext";
import AccountCard from "../components/banking/AccountCard";
import CreateAccountModal from "../components/banking/CreateAccountModal";
import FaucetDepositModal from "../components/banking/FaucetDepositModal";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import MoneyDisplay from "../components/common/MoneyDisplay";
import Skeleton from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import {
  Wallet,
  Plus,
  ArrowDownToLine,
  ShieldCheck,
  CreditCard,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";

/**
 * AccountsPage (Multi-Account Management & Sandbox Faucet Cockpit)
 * Displays aggregate portfolio balance, all user accounts (Checking & Savings),
 * account provisioning, and sandbox funding tools.
 */
export default function AccountsPage() {
  const {
    accounts,
    activeAccount,
    activeAccountId,
    accountBalances,
    totalAssetsInCents,
    loadingAccounts,
    loadingBalance,
    refreshAll,
    setActiveAccountId
  } = useBanking();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [targetAccountForDeposit, setTargetAccountForDeposit] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleOpenDeposit = (acc = null) => {
    setTargetAccountForDeposit(acc || activeAccount);
    setDepositModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const savingsAccounts = accounts.filter((a) => a.accountType === "SAVINGS");
  const checkingAccounts = accounts.filter((a) => a.accountType === "CHECKING");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
              Multi-Account Management
            </span>
            <Badge variant="ACTIVE">PORTFOLIO</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Accounts & Wallets
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
            Manage your Checking, Savings, and multi-currency accounts with real-time balance updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loadingAccounts}
            icon={RefreshCw}
            className={refreshing ? "animate-spin" : ""}
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={ArrowDownToLine}
            onClick={() => handleOpenDeposit(null)}
          >
            Deposit Faucet
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
            className="shadow-lg shadow-brand-accent/20"
          >
            Open New Account
          </Button>
        </div>
      </div>

      {/* 2. Total Portfolio Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-border-default shadow-sm p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Layers className="w-4 h-4 text-brand-accent" />
              <span>Total Portfolio Balance</span>
            </div>

            {loadingAccounts && accounts.length === 0 ? (
              <div className="py-2">
                <Skeleton className="h-12 w-56 rounded-2xl" />
              </div>
            ) : (
              <div className="pt-2">
                <MoneyDisplay
                  cents={totalAssetsInCents}
                  currency="USD"
                  size="hero"
                  className="tracking-tight drop-shadow-sm"
                />
              </div>
            )}
            <p className="text-xs text-text-muted mt-1">
              Summed across {accounts.length} active {accounts.length === 1 ? "account" : "accounts"}
            </p>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-elevated border border-border-subtle text-left min-w-[140px]">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Savings</span>
              </div>
              <div className="text-sm font-bold text-text-primary mt-1">
                {savingsAccounts.length} {savingsAccounts.length === 1 ? "Account" : "Accounts"}
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-elevated border border-border-subtle text-left min-w-[140px]">
              <div className="flex items-center gap-1.5 text-xs text-brand-indigo font-semibold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Checking</span>
              </div>
              <div className="text-sm font-bold text-text-primary mt-1">
                {checkingAccounts.length} {checkingAccounts.length === 1 ? "Account" : "Accounts"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Accounts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
            <span>Your Bank Accounts</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-elevated border border-border-subtle text-text-muted">
              {accounts.length}
            </span>
          </h2>
        </div>

        {loadingAccounts && accounts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            title="No Accounts Found"
            description="You do not have any registered bank accounts yet. Open a checking or savings account to start using the banking platform."
            actionLabel="Open New Account"
            actionIcon={Plus}
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => {
              const id = acc._id || acc.id;
              const isCurrentActive = id === (activeAccount?._id || activeAccount?.id);
              const bData = accountBalances[id];

              return (
                <AccountCard
                  key={id}
                  account={acc}
                  balanceData={bData}
                  isActive={isCurrentActive}
                  isLoadingBalance={loadingBalance}
                  onSelectActive={() => setActiveAccountId(id)}
                  onDeposit={() => handleOpenDeposit(acc)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Security & Isolation Guarantee Info Box */}
      <Card className="p-6 border-dashed border-border-default space-y-3">
        <div className="flex items-center gap-2 text-brand-accent font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Account Security & Isolation</span>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          Each account operates with independent security partitions. Transfers between your accounts are executed instantly with guaranteed balance integrity and comprehensive transaction audit trails.
        </p>
      </Card>

      {/* 5. Modals */}
      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <FaucetDepositModal
        isOpen={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false);
          setTargetAccountForDeposit(null);
        }}
        targetAccount={targetAccountForDeposit}
      />
    </div>
  );
}
