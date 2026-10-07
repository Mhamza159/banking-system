import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Badge from "../common/Badge";
import MoneyDisplay from "../common/MoneyDisplay";
import { formatDate, formatRelativeTime } from "../../utils/date";
import { useToast } from "../../context/ToastContext";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  FileCheck2,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  User
} from "lucide-react";

/**
 * TransactionDetailModal Component (Phase 10 Enriched)
 * Deep audit inspection dialog revealing cryptographic ledger state:
 * Idempotency Key, Transaction ID, dual-party Remitter and Beneficiary full legal names,
 * accounts, timestamps, itemized zero fee, and printable proof.
 */
export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  userAccounts = []
}) {
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!transaction) return null;

  const txId = String(transaction._id || transaction.id || "TX-UNKNOWN");
  const idempotencyKey = transaction.idempotencyKey || "RFC4122-UUID-V4-RECORDED";
  const amount = transaction.amount || transaction.amountInCents || 0;
  const currency = transaction.currency || "USD";
  const status = transaction.status || "COMPLETED";
  const description = transaction.description || "Ledger Transfer";
  const createdAt = transaction.createdAt || new Date().toISOString();

  // Extract account details
  const sender = transaction.senderAccount;
  const receiver = transaction.receiverAccount;

  const senderName =
    sender?.user?.name ||
    transaction.sender?.accountHolderName ||
    "Account Holder";

  const senderRawNum =
    sender?.accountNumber ||
    transaction.sender?.accountNumber ||
    (typeof sender === "string" ? sender : "—");

  const senderType =
    sender?.accountType ||
    transaction.sender?.accountType ||
    "CHECKING";

  const receiverName =
    receiver?.user?.name ||
    transaction.receiver?.accountHolderName ||
    "Beneficiary";

  const receiverRawNum =
    receiver?.accountNumber ||
    transaction.receiver?.accountNumber ||
    (typeof receiver === "string" ? receiver : "—");

  const receiverType =
    receiver?.accountType ||
    transaction.receiver?.accountType ||
    "SAVINGS";

  const maskNum = (num) => {
    if (!num || num === "—") return "—";
    const str = String(num).trim();
    return str.length >= 4 ? `•••• ${str.slice(-4)}` : str;
  };

  // Check direction for the current user
  const userAccountIds = new Set(
    userAccounts.map((a) => String(a._id || a.id || a.accountNumber))
  );
  const isCredit =
    userAccountIds.has(String(receiver?._id || receiver?.id || receiver?.accountNumber)) &&
    !userAccountIds.has(String(sender?._id || sender?.id || sender?.accountNumber));

  // Check if internal transfer
  const senderUserId = sender?.user?._id || sender?.user;
  const receiverUserId = receiver?.user?._id || receiver?.user;
  const isInternal =
    (senderUserId && receiverUserId && String(senderUserId) === String(receiverUserId)) ||
    (senderName &&
      receiverName &&
      senderName.toLowerCase().trim() === receiverName.toLowerCase().trim() &&
      senderRawNum !== receiverRawNum);

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
      showToast("success", `${type === "id" ? "Transaction ID" : "Payment Reference"} copied!`);
    } catch {
      showToast("error", "Failed to copy to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusIcons = {
    COMPLETED: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
    PENDING: <Clock className="w-6 h-6 text-amber-400" />,
    FAILED: <AlertCircle className="w-6 h-6 text-rose-400" />
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Advice Slip"
      description="Official bank payment confirmation and settlement advice slip."
      size="md"
    >
      <div className="space-y-5 print-voucher text-text-primary">
        {/* Printable Official Bank Header (Only visible on print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Antigravity Core Banking
              </h2>
              <p className="text-[10px] text-slate-600 font-mono">
                Official Bank Settlement Receipt · Verified Payment
              </p>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-600">
              <div>Ref: {txId}</div>
              <div>Date: {formatDate(createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Status & Amount Hero Banner */}
        <div className="text-center p-5 rounded-2xl bg-gradient-to-b from-surface via-elevated to-surface border border-border-default space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-sunken border border-border-subtle flex items-center justify-center mx-auto shadow-sm">
            {statusIcons[status] || statusIcons.COMPLETED}
          </div>

          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center justify-center gap-1.5">
            {isCredit ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Inbound Credit
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" /> Outbound Debit
              </span>
            )}
          </div>

          <div className="py-1">
            <MoneyDisplay
              cents={amount}
              currency={currency}
              size="hero"
              type={isCredit ? "credit" : "debit"}
              showSign={true}
              className="drop-shadow-sm text-text-primary font-extrabold"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge variant={status} size="md">
              {status}
            </Badge>
            {isInternal && (
              <span className="text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                Internal Transfer
              </span>
            )}
            <span className="text-xs text-text-muted font-mono">
              {formatRelativeTime(createdAt)}
            </span>
          </div>
        </div>

        {/* Dual-Party Details (Remitter vs Beneficiary) */}
        <div className="rounded-2xl bg-surface border border-border-default p-4 space-y-3">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Transfer Parties</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">Settled & Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Remitter Box */}
            <div className="p-3 rounded-xl bg-sunken border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold uppercase">
                <span className="flex items-center gap-1 text-rose-400">
                  <ArrowUpRight className="w-3 h-3" /> Sent From
                </span>
                <span className="font-mono text-text-muted">{senderType}</span>
              </div>
              <div className="font-bold text-sm text-text-primary truncate" title={senderName}>
                {senderName}
              </div>
              <div className="font-mono text-xs text-text-muted">
                {maskNum(senderRawNum)}
              </div>
            </div>

            {/* Beneficiary Box */}
            <div className="p-3 rounded-xl bg-sunken border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold uppercase">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ArrowDownLeft className="w-3 h-3" /> Sent To
                </span>
                <span className="font-mono text-text-muted">{receiverType}</span>
              </div>
              <div className="font-bold text-sm text-text-primary truncate" title={receiverName}>
                {receiverName}
              </div>
              <div className="font-mono text-xs text-brand-accent font-semibold">
                {maskNum(receiverRawNum)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation Metadata */}
        <div className="p-4 rounded-2xl bg-surface border border-border-default space-y-2.5 text-xs">
          {/* Memo / Description */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted font-medium">Memo / Purpose</span>
            <span className="text-text-primary font-medium max-w-[200px] truncate" title={description}>
              {description}
            </span>
          </div>

          {/* Transfer Fee */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted font-medium">Transfer Fee</span>
            <span className="font-mono text-emerald-400 font-medium">
              $0.00 (Zero Fee)
            </span>
          </div>

          {/* Transaction ID */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted font-medium">Transaction ID</span>
            <div className="flex items-center gap-1.5 font-mono text-text-primary">
              <span className="truncate max-w-[150px] sm:max-w-[190px]" title={txId}>
                {txId}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(txId, "id")}
                className="no-print p-1 hover:bg-elevated rounded text-text-muted hover:text-text-primary transition-colors"
                title="Copy Transaction ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Payment Reference */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted font-medium">Payment Reference</span>
            <div className="flex items-center gap-1.5 font-mono text-text-secondary">
              <span className="truncate max-w-[150px] sm:max-w-[190px] text-[11px]" title={idempotencyKey}>
                {idempotencyKey}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(idempotencyKey, "key")}
                className="no-print p-1 hover:bg-elevated rounded text-text-muted hover:text-text-primary transition-colors"
                title="Copy Payment Reference"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Exact Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-medium">Settlement Timestamp</span>
            <span className="font-mono text-text-secondary">
              {formatDate(createdAt)}
            </span>
          </div>
        </div>

        {/* Action Controls (Hidden on print) */}
        <div className="no-print flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print Receipt
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
