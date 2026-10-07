import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useBanking } from "../context/BankingContext";
import transactionService from "../services/transactionService";
import TransactionFilters from "../components/banking/TransactionFilters";
import TransactionTable from "../components/banking/TransactionTable";
import TransactionDetailModal from "../components/banking/TransactionDetailModal";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import MoneyDisplay from "../components/common/MoneyDisplay";
import { useToast } from "../context/ToastContext";
import {
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

/**
 * TransactionsPage Component (T048)
 * Complete, auditable transaction journal with server-side pagination,
 * status filtering, account scoping, real-time memo search, and audit modals.
 */
export default function TransactionsPage() {
  const { accounts, activeAccountId } = useBanking();
  const { showToast } = useToast();

  // Query & Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [selectedAccountId, setSelectedAccountId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  /**
   * Fetch transaction journal from server with active query filters
   */
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: status !== "ALL" ? status : undefined,
        accountId: selectedAccountId !== "ALL" ? selectedAccountId : undefined
      };

      const res = await transactionService.getHistory(params);
      const data = res.data || res;
      setTransactions(data.transactions || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      showToast("error", err.message || "Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, selectedAccountId, showToast]);

  // Load transactions whenever page, limit, status, or account changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to page 1 on filter changes
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleAccountChange = (newAccId) => {
    setSelectedAccountId(newAccId);
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatus("ALL");
    setSelectedAccountId("ALL");
    setSearchQuery("");
    setPage(1);
  };

  // Client-side text search refinement (matches memo, counterparty names, accounts, or transaction ID)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      const id = String(tx._id || tx.id || "").toLowerCase();
      const desc = String(tx.description || "").toLowerCase();
      const senderNum = String(tx.senderAccount?.accountNumber || "").toLowerCase();
      const receiverNum = String(tx.receiverAccount?.accountNumber || "").toLowerCase();
      const senderName = String(tx.senderAccount?.user?.name || "").toLowerCase();
      const receiverName = String(tx.receiverAccount?.user?.name || "").toLowerCase();
      return (
        id.includes(q) ||
        desc.includes(q) ||
        senderNum.includes(q) ||
        receiverNum.includes(q) ||
        senderName.includes(q) ||
        receiverName.includes(q)
      );
    });
  }, [transactions, searchQuery]);

  // Calculate high-level summary metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = pagination.total || transactions.length;
    const completedCount = transactions.filter((t) => t.status === "COMPLETED").length;
    const totalVolumeCents = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
      totalCount,
      completedCount,
      totalVolumeCents
    };
  }, [pagination.total, transactions]);

  const hasActiveFilters =
    status !== "ALL" ||
    selectedAccountId !== "ALL" ||
    searchQuery.trim().length > 0;

  // Pagination calculation bounds
  const startItem = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, pagination.total);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Transaction Journal
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            View your complete transaction history, download statements, and inspect payment receipts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
          icon={RefreshCw}
          className={loading ? "opacity-75" : ""}
        >
          {loading ? "Refreshing..." : "Refresh Journal"}
        </Button>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-surface border border-border-default shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent shrink-0">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
              Total Transactions
            </div>
            <div className="text-lg font-extrabold text-text-primary">
              {summaryMetrics.totalCount} <span className="text-xs font-normal text-text-muted">records</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-surface border border-border-default shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
              Completed on Page
            </div>
            <div className="text-lg font-extrabold text-emerald-500">
              {summaryMetrics.completedCount} <span className="text-xs font-normal text-text-muted">completed</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-surface border border-border-default shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 flex items-center justify-center text-brand-indigo shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
              Page Volume
            </div>
            <div className="text-lg font-extrabold text-text-primary">
              <MoneyDisplay cents={summaryMetrics.totalVolumeCents} currency="USD" size="md" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Filters & Real-time Search */}
      <Card className="p-5 bg-surface border border-border-default shadow-sm">
        <TransactionFilters
          status={status}
          onStatusChange={handleStatusChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedAccountId={selectedAccountId}
          onAccountChange={handleAccountChange}
          accounts={accounts}
          onReset={hasActiveFilters ? handleResetFilters : null}
        />
      </Card>

      {/* 4. Interactive Transaction Table */}
      <TransactionTable
        transactions={filteredTransactions}
        loading={loading}
        userAccounts={accounts}
        currentAccountId={selectedAccountId}
        onSelectTransaction={(tx) => setSelectedTx(tx)}
        isFiltered={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Server-Side Pagination Bar */}
      {pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          {/* Item count text */}
          <div className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text-primary">{startItem}</span> to{" "}
            <span className="font-semibold text-text-primary">{endItem}</span> of{" "}
            <span className="font-semibold text-text-primary">{pagination.total}</span> entries
          </div>

          {/* Controls: Limit Selector & Page Buttons */}
          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-elevated border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-brand-accent cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                icon={ChevronLeft}
                className="px-2.5 py-1.5"
              >
                <span className="sr-only sm:not-sr-only">Prev</span>
              </Button>

              <div className="px-3 py-1 rounded-lg bg-elevated border border-border-subtle text-xs font-semibold text-text-primary">
                {page} / {pagination.pages || 1}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
                disabled={page >= (pagination.pages || 1) || loading}
                className="px-2.5 py-1.5"
              >
                <span className="sr-only sm:not-sr-only">Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Transaction Detail Inspection Modal */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        userAccounts={accounts}
      />
    </div>
  );
}
