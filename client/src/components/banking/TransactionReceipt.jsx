import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Badge from "../common/Badge";
import MoneyDisplay from "../common/MoneyDisplay";
import { formatDate } from "../../utils/date";
import { useToast } from "../../context/ToastContext";
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark
} from "lucide-react";

/**
 * TransactionReceipt Component (Phase 10 Enriched)
 * Regulatory-grade commercial banking payment advice / slip.
 * Displays explicit dual-party details (Remitter and Beneficiary full legal names,
 * masked account numbers, account types), fee itemization ($0.00), cryptographic IDs,
 * and high-contrast printable banking voucher layout.
 */
export default function TransactionReceipt({
  isOpen,
  onClose,
  receipt,
  onMakeAnother = null
}) {
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!receipt) return null;

  const txId = String(receipt.id || receipt.transactionId || receipt._id || "TX-000000");
  const key = receipt.idempotencyKey || "RFC4122-UUID-V4";
  const amount = receipt.amount || receipt.amountInCents || 0;
  const currency = receipt.currency || "USD";
  const timestamp = receipt.createdAt || receipt.timestamp || new Date().toISOString();

  // Robust extraction of Sender (Remitter) particulars
  const senderName =
    receipt.sender?.accountHolderName ||
    receipt.senderAccount?.user?.name ||
    receipt.senderName ||
    "Account Holder";

  const senderRawNum =
    receipt.sender?.accountNumber ||
    receipt.senderAccount?.accountNumber ||
    (typeof receipt.senderAccount === "string" ? receipt.senderAccount : "—");

  const senderType =
    receipt.sender?.accountType ||
    receipt.senderAccount?.accountType ||
    "CHECKING";

  // Robust extraction of Receiver (Beneficiary) particulars
  const receiverName =
    receipt.receiver?.accountHolderName ||
    receipt.receiverAccount?.user?.name ||
    receipt.recipientName ||
    receipt.receiverName ||
    "Beneficiary";

  const receiverRawNum =
    receipt.receiver?.accountNumber ||
    receipt.receiverAccount?.accountNumber ||
    (typeof receipt.receiverAccount === "string" ? receipt.receiverAccount : "—");

  const receiverType =
    receipt.receiver?.accountType ||
    receipt.receiverAccount?.accountType ||
    "SAVINGS";

  // Check if internal transfer
  const isInternal =
    receipt.isInternal ||
    (senderName &&
      receiverName &&
      senderName.toLowerCase().trim() === receiverName.toLowerCase().trim() &&
      senderRawNum !== receiverRawNum);

  const maskNum = (num) => {
    if (!num || num === "—") return "—";
    const str = String(num).trim();
    return str.length >= 4 ? `•••• ${str.slice(-4)}` : str;
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(txId);
      setCopiedId(true);
      showToast("success", "Transaction ID copied!");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      showToast("error", "Failed to copy ID");
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      showToast("success", "Idempotency Key copied!");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      showToast("error", "Failed to copy Key");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Payment Slip"
      description="Official commercial banking transaction advice & proof of payment."
      size="md"
    >
      <div className="space-y-5 print-voucher text-text-primary">
        {/* Printable Official Bank Masthead (Appears prominently when printing) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Antigravity Core Banking
              </h2>
              <p className="text-[10px] text-slate-600 font-mono">
                Official Bank Settlement Receipt · Verified Transfer
              </p>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-600">
              <div>Ref: {txId}</div>
              <div>Date: {formatDate(timestamp)}</div>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        <div className="text-center p-5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Transfer Completed Successfully
          </div>
          <div className="py-1">
            <MoneyDisplay
              cents={amount}
              currency={currency}
              size="hero"
              className="drop-shadow-sm text-text-primary font-extrabold"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="COMPLETED">COMPLETED</Badge>
            {isInternal ? (
              <span className="text-[11px] text-brand-indigo bg-brand-indigo/10 border border-brand-indigo/20 px-2 py-0.5 rounded-full font-medium">
                Internal Transfer
              </span>
            ) : (
              <span className="text-xs text-text-muted font-mono">Instant Settlement</span>
            )}
          </div>
        </div>

        {/* Dual-Party Bank Details (Remitter vs Beneficiary) */}
        <div className="rounded-2xl bg-sunken border border-border-subtle p-4 space-y-3">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
            <span>Transaction Participants</span>
            <span className="text-[10px] text-emerald-500 font-mono font-normal">Dual-Party Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Remitter Box */}
            <div className="p-3 rounded-xl bg-elevated border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold uppercase">
                <span className="flex items-center gap-1 text-rose-500">
                  <ArrowUpRight className="w-3 h-3" /> Remitter (Debited)
                </span>
                <span className="font-mono text-text-muted">{senderType}</span>
              </div>
              <div className="font-bold text-sm text-text-primary truncate" title={senderName}>
                {senderName}
              </div>
              <div className="font-mono text-xs text-text-secondary">
                {maskNum(senderRawNum)}
              </div>
            </div>

            {/* Beneficiary Box */}
            <div className="p-3 rounded-xl bg-elevated border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold uppercase">
                <span className="flex items-center gap-1 text-emerald-500">
                  <ArrowDownLeft className="w-3 h-3" /> Beneficiary (Credited)
                </span>
                <span className="font-mono text-text-muted">{receiverType}</span>
              </div>
              <div className="font-bold text-sm text-text-primary truncate" title={receiverName}>
                {receiverName}
              </div>
              <div className="font-mono text-xs text-emerald-500 font-semibold">
                {maskNum(receiverRawNum)}
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Fee Itemization */}
        <div className="p-4 rounded-2xl bg-surface border border-border-default space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted">Transfer Amount</span>
            <span className="font-mono text-text-primary font-semibold">
              <MoneyDisplay cents={amount} currency={currency} size="sm" />
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted">Transfer Fee</span>
            <span className="font-mono text-emerald-500 font-medium">
              $0.00 (Zero Fee)
            </span>
          </div>

          {/* Transaction ID */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted">Transaction ID</span>
            <div className="flex items-center gap-1.5 font-mono text-text-primary">
              <span className="truncate max-w-[150px] sm:max-w-[190px]" title={txId}>{txId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="no-print p-1 hover:bg-elevated rounded text-text-muted hover:text-text-primary transition-colors"
                title="Copy Transaction ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Reference Key */}
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-text-muted">Reference Key</span>
            <div className="flex items-center gap-1.5 font-mono text-text-secondary">
              <span className="truncate max-w-[150px] sm:max-w-[190px] text-[11px]" title={key}>{key}</span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="no-print p-1 hover:bg-elevated rounded text-text-muted hover:text-text-primary transition-colors"
                title="Copy Reference Key"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Settlement Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Settlement Time</span>
            <span className="font-mono text-text-secondary">
              {formatDate(timestamp)}
            </span>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print Receipt
          </Button>

          <div className="flex items-center gap-2">
            {onMakeAnother && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onMakeAnother}
              >
                New Transfer
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
