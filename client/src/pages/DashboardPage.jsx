import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBanking } from "../context/BankingContext";
import { useToast } from "../context/ToastContext";
import { transactionService } from "../services/transactionService";
import BalanceCard from "../components/banking/BalanceCard";
import LedgerSummaryCard from "../components/banking/LedgerSummaryCard";
import TransactionRow from "../components/banking/TransactionRow";
import FaucetDepositModal from "../components/banking/FaucetDepositModal";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import {
  ShieldCheck,
  RefreshCw,
  Wallet,
  SendHorizontal,
  ReceiptText,
  Lock,
  ArrowRight,
  Database,
  ArrowDownToLine,
  Activity
} from "lucide-react";

/**
 * DashboardPage (Executive Financial Cockpit)
 * Primary command center displaying real-time aggregated balance derived from
 * the double-entry MongoDB ledger, ledger summary, quick actions, and recent activity.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const {
    activeAccount,
    balance,
    refreshAll,
    loadingAccounts,
    loadingBalance
  } = useBanking();
  const { showToast } = useToast();

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fetchingRecentRef = useRef(false);

  const activeId = activeAccount?._id || activeAccount?.id;

  // Fetch recent transactions with in-flight concurrency guard
  const loadRecentTransactions = useCallback(async () => {
    if (fetchingRecentRef.current) return;
    fetchingRecentRef.current = true;
    setLoadingRecent(true);
    try {
      const res = await transactionService.getHistory(1, 5);
      setRecentTransactions(res?.transactions || []);
    } catch (err) {
      console.error("Failed to fetch recent transactions:", err);
      setRecentTransactions([]);
    } finally {
      setLoadingRecent(false);
      fetchingRecentRef.current = false;
    }
  }, []);

  // Re-fetch only on mount or when switching active accounts
  useEffect(() => {
    loadRecentTransactions();
  }, [loadRecentTransactions, activeId]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([refreshAll(), loadRecentTransactions()]);
      showToast("success", "Your account data has been refreshed.");
    } catch {
      showToast("error", "Sync failed. Check network connection.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome & Session Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-default shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
              Authenticated Session
            </span>
            <Badge variant="ACTIVE">ACTIVE</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Welcome, {user?.name || "Customer"}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl leading-relaxed">
            Your authenticated session is active with enterprise-grade encryption and real-time account security.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualSync}
            disabled={syncing || loadingAccounts || loadingBalance}
            icon={RefreshCw}
            className={syncing ? "animate-pulse" : ""}
          >
            {syncing ? "Syncing..." : "Sync State"}
          </Button>
          <Link to="/transfer">
            <Button
              variant="primary"
              size="sm"
              icon={SendHorizontal}
              iconPosition="right"
            >
              Transfer Funds
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Executive Cockpit: BalanceCard & LedgerSummaryCard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <BalanceCard onOpenDepositModal={() => setDepositModalOpen(true)} />
        </div>
        <div className="lg:col-span-5">
          <LedgerSummaryCard />
        </div>
      </div>

      {/* 3. Quick Action Launchpads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/accounts" className="group">
          <Card className="p-5 space-y-3 group-hover:border-brand-accent/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary group-hover:text-brand-accent transition-colors">
                Bank Accounts
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Manage checking & savings accounts
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/transfer" className="group">
          <Card className="p-5 space-y-3 group-hover:border-brand-indigo/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 flex items-center justify-center text-brand-indigo group-hover:scale-110 transition-transform">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary group-hover:text-brand-indigo transition-colors">
                Instant Transfer
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Send funds instantly and securely
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/transactions" className="group">
          <Card className="p-5 space-y-3 group-hover:border-teal-400/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary group-hover:text-teal-400 transition-colors">
                Transaction History
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                View your complete payment history
              </div>
            </div>
          </Card>
        </Link>

        <button
          type="button"
          onClick={() => setDepositModalOpen(true)}
          className="group text-left w-full"
        >
          <Card className="p-5 space-y-3 group-hover:border-emerald-400/50 transition-all h-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary group-hover:text-emerald-400 transition-colors">
                Deposit Faucet
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Add test funds to your account
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* 4. Recent Transactions Feed */}
      <Card className="p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Recent Activity
              </h2>
              <p className="text-xs text-text-muted">
                Latest transaction movements across accounts
              </p>
            </div>
          </div>

          <Link
            to="/transactions"
            className="text-xs font-semibold text-brand-accent hover:text-brand-accent/80 transition-colors flex items-center gap-1 group"
          >
            <span>View Full History</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* List Content */}
        {loadingRecent ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <EmptyState
            title="No Recent Transactions"
            description="Your account does not have any recorded transfers or deposits yet. Fund your account with the sandbox faucet to get started."
            actionLabel="Deposit Test Funds"
            actionIcon={ArrowDownToLine}
            onAction={() => setDepositModalOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <TransactionRow
                key={tx._id || tx.id}
                transaction={tx}
                currentAccountId={activeId}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 5. Cryptographic & Regulatory Compliance Footer Card */}
      <div className="p-6 rounded-3xl bg-sunken border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary">
            <Database className="w-4 h-4 text-brand-accent" />
          </div>
          <div>
            <span className="font-semibold text-text-primary">Verified Transaction Ledger</span>
            <span className="mx-2">•</span>
            <span>All balances calculated in real time from your transaction history</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            256-Bit TLS
          </span>
          <span className="flex items-center gap-1 text-brand-indigo">
            <Lock className="w-3.5 h-3.5" />
            HttpOnly Cookies
          </span>
        </div>
      </div>

      {/* 6. Sandbox Faucet Deposit Modal */}
      <FaucetDepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />
    </div>
  );
}
