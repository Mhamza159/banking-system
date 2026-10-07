import React from "react";
import MoneyDisplay from "../common/MoneyDisplay";
import Badge from "../common/Badge";
import { formatDate, formatRelativeTime } from "../../utils/date";
import {
  ArrowDownLeft,
  ArrowUpRight,
  SendHorizontal,
  ArrowDownToLine,
  FileText
} from "lucide-react";

/**
 * TransactionRow Component
 * Renders an individual transaction entry in feeds, journals, and receipts.
 */
export default function TransactionRow({
  transaction,
  currentAccountId = null,
  onClick = null
}) {
  if (!transaction) return null;

  const senderAcc = transaction.senderAccount;
  const receiverAcc = transaction.receiverAccount;

  // Determine if this transaction is an inflow (credit) or outflow (debit)
  const isCredit = currentAccountId
    ? (receiverAcc?._id === currentAccountId || receiverAcc?.id === currentAccountId)
    : false;

  const type = isCredit ? "credit" : "debit";

  // Label counterparty with legal name if available
  const getCounterpartyLabel = () => {
    const senderName = senderAcc?.user?.name;
    const receiverName = receiverAcc?.user?.name;

    if (isCredit) {
      if (senderName) return `Received from ${senderName}`;
      return `Received from ${senderAcc?.accountNumber ? `ACC-••••${String(senderAcc.accountNumber).slice(-4)}` : "External Account"}`;
    }
    if (receiverName) return `Sent to ${receiverName}`;
    return `Sent to ${receiverAcc?.accountNumber ? `ACC-••••${String(receiverAcc.accountNumber).slice(-4)}` : "Account"}`;
  };

  return (
    <div
      onClick={onClick}
      className={`group p-4 rounded-2xl bg-elevated hover:bg-surface border border-border-subtle hover:border-border-default transition-all flex items-center justify-between gap-4 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Left: Direction Icon & Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${
            isCredit
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/25 text-rose-400"
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
            <span className="text-sm font-semibold text-text-primary truncate">
              {getCounterpartyLabel()}
            </span>
            <Badge variant={transaction.status} size="sm">
              {transaction.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            <span>{formatRelativeTime(transaction.createdAt)}</span>
            <span>•</span>
            <span className="truncate">{transaction.description || "Transfer"}</span>
          </div>
        </div>
      </div>

      {/* Right: Amount Display */}
      <div className="text-right shrink-0">
        <MoneyDisplay
          cents={transaction.amount}
          currency={transaction.currency || "USD"}
          size="md"
          type={type}
          showSign={true}
        />
        <div className="text-[10px] text-text-muted font-mono mt-0.5">
          {formatDate(transaction.createdAt)}
        </div>
      </div>
    </div>
  );
}
