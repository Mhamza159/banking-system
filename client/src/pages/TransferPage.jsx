import React, { useState, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useBanking } from "../context/BankingContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { transactionService } from "../services/transactionService";
import { accountService } from "../services/accountService";
import TransferModal from "../components/banking/TransferModal";
import TransactionReceipt from "../components/banking/TransactionReceipt";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import MoneyDisplay from "../components/common/MoneyDisplay";
import { parseCents, formatCurrency } from "../utils/currency";
import {
  SendHorizontal,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  AlertCircle,
  CreditCard,
  Building2,
  Lock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  UserCheck
} from "lucide-react";

/**
 * TransferPage Component
 * Full-scale atomic money transfer interface with real-time balance guard,
 * destination routing (Internal vs External), verified recipient pre-flight check,
 * UUID v4 Idempotency injection, two-step confirmation review dialog, and audit receipt.
 */
export default function TransferPage() {
  const { user } = useAuth();
  const {
    accounts,
    activeAccount,
    accountBalances,
    refreshAll,
    loadingAccounts
  } = useBanking();
  const { showToast } = useToast();

  // Selected sender account (defaults to active account)
  const [selectedSenderId, setSelectedSenderId] = useState(() => {
    return activeAccount?._id || activeAccount?.id || (accounts[0]?._id || accounts[0]?.id) || "";
  });

  // Transfer mode: 'internal' (Between my accounts) | 'external' (To another account)
  const [transferMode, setTransferMode] = useState("internal");

  // Selected receiver for internal transfers
  const [selectedInternalReceiverId, setSelectedInternalReceiverId] = useState("");

  // Input for external receiver account number
  const [externalAccountNumber, setExternalAccountNumber] = useState("");

  // Recipient Verification State Machine: 'idle' | 'verifying' | 'verified' | 'error'
  const [verificationStatus, setVerificationStatus] = useState("idle");
  const [verifiedRecipient, setVerifiedRecipient] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const isVerifyingRef = useRef(false);

  // Amount & description state
  const [rawAmount, setRawAmount] = useState("");
  const [description, setDescription] = useState("");

  // Modals state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [formError, setFormError] = useState("");
  const [modalError, setModalError] = useState("");

  // Resolve sender account object
  const senderAccount = useMemo(() => {
    const targetId = selectedSenderId || (activeAccount?._id || activeAccount?.id);
    return accounts.find((a) => (a._id || a.id) === targetId) || accounts[0] || null;
  }, [accounts, selectedSenderId, activeAccount]);

  // Derived balance of the chosen sender account
  const senderBalanceInCents = useMemo(() => {
    if (!senderAccount) return 0;
    const id = senderAccount._id || senderAccount.id;
    const b = accountBalances[id];
    return b && typeof b.balanceInCents === "number" ? b.balanceInCents : 0;
  }, [senderAccount, accountBalances]);

  // Accounts available for internal transfer (all except the chosen sender)
  const internalReceiverOptions = useMemo(() => {
    if (!senderAccount) return [];
    const senderId = senderAccount._id || senderAccount.id;
    return accounts.filter((a) => (a._id || a.id) !== senderId);
  }, [accounts, senderAccount]);

  // Auto-select first available internal receiver if not set
  React.useEffect(() => {
    if (internalReceiverOptions.length > 0 && !selectedInternalReceiverId) {
      const first = internalReceiverOptions[0];
      setSelectedInternalReceiverId(first._id || first.id);
    }
  }, [internalReceiverOptions, selectedInternalReceiverId]);

  // Handle external account number input change with strict state invalidation
  const handleExternalAccountChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setExternalAccountNumber(val);
    setFormError("");

    // Invalidate prior verification if input changes
    if (verificationStatus !== "idle" || verifiedRecipient !== null) {
      setVerificationStatus("idle");
      setVerifiedRecipient(null);
      setVerificationError("");
    }
  };

  // Switch transfer mode with verification state reset
  const handleSwitchTransferMode = (mode) => {
    setTransferMode(mode);
    setFormError("");
    setVerificationStatus("idle");
    setVerifiedRecipient(null);
    setVerificationError("");
  };

  // Select sender account with verification state reset
  const handleSelectSenderAccount = (id) => {
    setSelectedSenderId(id);
    setFormError("");
    setVerificationStatus("idle");
    setVerifiedRecipient(null);
    setVerificationError("");
  };

  // Verify recipient account pre-flight check
  const handleVerifyRecipient = async () => {
    if (isVerifyingRef.current) return;

    const cleaned = externalAccountNumber.trim();
    if (!cleaned || cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      setVerificationError("Please enter a valid 10-digit recipient account number.");
      setVerificationStatus("error");
      return;
    }

    if (cleaned === senderAccount?.accountNumber) {
      setVerificationError("You cannot transfer funds to the same account.");
      setVerificationStatus("error");
      return;
    }

    isVerifyingRef.current = true;
    setVerificationStatus("verifying");
    setVerificationError("");
    setVerifiedRecipient(null);
    setFormError("");

    try {
      const res = await accountService.verifyRecipient(cleaned);
      const accountData = res?.data?.account || res?.account;
      if (accountData) {
        setVerifiedRecipient(accountData);
        setVerificationStatus("verified");
        showToast("success", `Recipient verified: ${accountData.accountHolderName}`);
      } else {
        throw new Error("Invalid verification response from server");
      }
    } catch (err) {
      console.error("Recipient verification error:", err);
      setVerificationStatus("error");
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        "Recipient account not found or unavailable";
      setVerificationError(msg);
      showToast("error", msg);
    } finally {
      isVerifyingRef.current = false;
    }
  };

  // Parse entered amount
  const parsedAmount = useMemo(() => {
    return parseCents(rawAmount);
  }, [rawAmount]);

  // Validate balance guard
  const isInsufficientFunds = parsedAmount.isValid && parsedAmount.cents > senderBalanceInCents;

  const handleSetPresetAmount = (cents) => {
    setRawAmount((cents / 100).toFixed(2));
    setFormError("");
  };

  const handleSetMaxBalance = () => {
    setRawAmount((senderBalanceInCents / 100).toFixed(2));
    setFormError("");
  };

  // Trigger Review Confirmation Modal
  const handleReviewTransfer = (e) => {
    e?.preventDefault();
    setFormError("");
    setModalError("");

    if (!senderAccount) {
      setFormError("Please select a source account to debit.");
      return;
    }

    if (!parsedAmount.isValid || parsedAmount.cents <= 0) {
      setFormError(parsedAmount.error || "Please enter a valid transfer amount greater than $0.00.");
      return;
    }

    if (isInsufficientFunds) {
      setFormError(
        `Insufficient funds. Your available balance is ${formatCurrency(senderBalanceInCents)}.`
      );
      return;
    }

    if (transferMode === "internal") {
      if (!selectedInternalReceiverId) {
        setFormError("Please select an internal destination account.");
        return;
      }
      if (selectedInternalReceiverId === (senderAccount._id || senderAccount.id)) {
        setFormError("Cannot transfer funds to the same account.");
        return;
      }
    } else {
      const cleaned = externalAccountNumber.trim();
      if (!cleaned || cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
        setFormError("Please enter a valid 10-digit recipient account number.");
        return;
      }
      if (cleaned === senderAccount.accountNumber) {
        setFormError("Cannot transfer funds to the same account number.");
        return;
      }
      if (
        verificationStatus !== "verified" ||
        !verifiedRecipient ||
        verifiedRecipient.accountNumber !== cleaned
      ) {
        setFormError("Please verify the recipient account before proceeding with the transfer.");
        return;
      }
    }

    setReviewModalOpen(true);
  };

  // Data payload for TransferModal
  const transferData = useMemo(() => {
    if (!senderAccount) return null;

    let receiverLabel = "";
    let receiverNumber = "";
    let recipientName = "";

    if (transferMode === "internal") {
      const target = accounts.find((a) => (a._id || a.id) === selectedInternalReceiverId);
      receiverLabel = `${target?.accountType || "Checking"} Account`;
      receiverNumber = `•••• ${String(target?.accountNumber || "").slice(-4)}`;
      recipientName = "My Account";
    } else {
      receiverLabel = verifiedRecipient
        ? `${verifiedRecipient.accountType} Account`
        : "External Recipient Account";
      receiverNumber = externalAccountNumber.trim();
      recipientName = verifiedRecipient?.accountHolderName || "";
    }

    return {
      senderAccount,
      senderBalanceInCents,
      receiverLabel,
      receiverNumber,
      recipientName,
      amountInCents: parsedAmount.cents,
      description: description.trim() || "Account to Account Transfer"
    };
  }, [
    senderAccount,
    senderBalanceInCents,
    transferMode,
    selectedInternalReceiverId,
    externalAccountNumber,
    verifiedRecipient,
    parsedAmount,
    description,
    accounts
  ]);

  // Execute transfer with UUID v4 Idempotency Key & 4-digit TPIN
  const handleExecuteTransfer = async (tpin) => {
    setIsSubmitting(true);
    setFormError("");
    setModalError("");

    const idempotencyKey = uuidv4();
    const senderAccountId = senderAccount._id || senderAccount.id;
    const receiverAccountId =
      transferMode === "internal"
        ? selectedInternalReceiverId
        : externalAccountNumber.trim();

    try {
      const payload = {
        senderAccountId,
        receiverAccountId,
        amountInCents: parsedAmount.cents,
        description: description.trim() || "Account to Account Transfer"
      };

      if (tpin) {
        payload.tpin = tpin;
      }

      const res = await transactionService.transfer(payload, idempotencyKey);

      // Refresh balances across BankingContext
      await refreshAll();

      const internalTarget = accounts.find((a) => (a._id || a.id) === selectedInternalReceiverId);

      setLatestReceipt({
        ...res.transaction,
        isInternal: transferMode === "internal",
        sender: res.transaction.sender || {
          accountNumber: senderAccount.accountNumber,
          accountHolderName: user?.name || "Account Holder",
          accountType: senderAccount.accountType || "CHECKING",
          currency: senderAccount.currency || "USD"
        },
        receiver: res.transaction.receiver || {
          accountNumber:
            transferMode === "internal"
              ? internalTarget?.accountNumber
              : externalAccountNumber.trim(),
          accountHolderName:
            transferMode === "internal"
              ? user?.name || "Account Holder"
              : verifiedRecipient?.accountHolderName || transferData?.recipientName || "Beneficiary",
          accountType:
            transferMode === "internal"
              ? internalTarget?.accountType || "SAVINGS"
              : verifiedRecipient?.accountType || "SAVINGS",
          currency: senderAccount.currency || "USD"
        },
        recipientName: transferData?.recipientName
      });
      setReviewModalOpen(false);
      setReceiptModalOpen(true);
      showToast("success", "Atomic transfer completed successfully!");

      // Reset form & verification
      setRawAmount("");
      setDescription("");
      setExternalAccountNumber("");
      setVerificationStatus("idle");
      setVerifiedRecipient(null);
    } catch (err) {
      console.error("Transfer error:", err);
      const errMsg = err.message || "Transfer failed. Please check balance and recipient.";

      // If error is related to TPIN (wrong PIN, locked, required, etc.), keep modal open with inline error
      const isTpinIssue =
        errMsg.toLowerCase().includes("tpin") ||
        errMsg.toLowerCase().includes("pin") ||
        errMsg.toLowerCase().includes("attempts") ||
        errMsg.toLowerCase().includes("lockout") ||
        errMsg.toLowerCase().includes("locked");

      if (isTpinIssue) {
        setModalError(errMsg);
      } else {
        setFormError(errMsg);
        setReviewModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = senderAccount?.currency || "USD";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-border-default shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
            Transfer Funds
          </span>
          <Badge variant="ACTIVE">INSTANT TRANSFER</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Instant Money Transfer
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
          Send money instantly between your accounts or to other verified recipients with real-time balance protection.
        </p>
      </div>

      {/* 2. Main Transfer Form Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Error Alert Banner */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleReviewTransfer} className="space-y-6">
          {/* A. Source Account Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                1. Select Source Account
              </label>
              <span className="text-xs text-text-muted">
                Available:{" "}
                <strong className="text-emerald-400 font-mono">
                  {formatCurrency(senderBalanceInCents, currency)}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((acc) => {
                const id = acc._id || acc.id;
                const isSelected = id === (senderAccount?._id || senderAccount?.id);
                const b = accountBalances[id]?.balanceInCents ?? 0;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectSenderAccount(id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? "bg-brand-accent/15 border-brand-accent shadow-lg shadow-brand-accent/10"
                        : "bg-elevated border-border-subtle hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-text-primary uppercase">
                        {acc.accountType}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        ••••{String(acc.accountNumber).slice(-4)}
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-text-primary">
                      <MoneyDisplay cents={b} currency={acc.currency || "USD"} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. Destination Mode Tabs & Recipient Verification */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              2. Transfer Destination & Recipient Verification
            </label>

            <div className="flex rounded-xl bg-sunken p-1 border border-border-subtle mb-4">
              <button
                type="button"
                onClick={() => handleSwitchTransferMode("internal")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  transferMode === "internal"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Between My Accounts
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTransferMode("external")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  transferMode === "external"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                To Another Customer (Verified)
              </button>
            </div>

            {/* Destination Selector View */}
            {transferMode === "internal" ? (
              internalReceiverOptions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-elevated border border-border-subtle text-center text-xs text-text-muted">
                  You only have 1 active bank account. Open an additional Checking or Savings account to transfer funds between them.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {internalReceiverOptions.map((acc) => {
                    const id = acc._id || acc.id;
                    const isSelected = id === selectedInternalReceiverId;
                    const b = accountBalances[id]?.balanceInCents ?? 0;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedInternalReceiverId(id);
                          setFormError("");
                        }}
                        className={`p-4 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? "bg-brand-indigo/15 border-brand-indigo shadow-lg shadow-brand-indigo/10"
                            : "bg-elevated border-border-subtle hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-text-primary uppercase">
                            {acc.accountType}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">
                            ••••{String(acc.accountNumber).slice(-4)}
                          </span>
                        </div>
                        <div className="text-sm font-bold font-mono text-text-primary">
                          <MoneyDisplay cents={b} currency={acc.currency || "USD"} size="sm" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* Account Number Input + Verify Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Recipient 10-Digit Account Number"
                      placeholder="e.g. 1048291039"
                      value={externalAccountNumber}
                      onChange={handleExternalAccountChange}
                      prefix={<Building2 className="w-4 h-4 text-text-muted" />}
                      maxLength={10}
                      helperText="Enter the 10-digit core banking account number of the recipient"
                      error={verificationStatus === "error" ? verificationError : ""}
                    />
                  </div>
                  <div className="sm:pb-1">
                    <Button
                      type="button"
                      variant={verificationStatus === "verified" ? "secondary" : "primary"}
                      onClick={handleVerifyRecipient}
                      disabled={
                        verificationStatus === "verifying" ||
                        externalAccountNumber.trim().length !== 10
                      }
                      icon={verificationStatus === "verifying" ? RefreshCw : ShieldCheck}
                      className={
                        verificationStatus === "verifying"
                          ? "animate-pulse w-full sm:w-auto"
                          : "w-full sm:w-auto"
                      }
                    >
                      {verificationStatus === "verifying"
                        ? "Verifying..."
                        : verificationStatus === "verified"
                        ? "Verified ✓"
                        : "Verify Account"}
                    </Button>
                  </div>
                </div>

                {/* Verification Status Feedback Banners */}
                {verificationStatus === "verifying" && (
                  <div className="p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/25 flex items-center gap-3 text-xs text-brand-accent animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Verifying recipient account details...</span>
                  </div>
                )}

                {verificationStatus === "error" && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start justify-between gap-3 text-xs text-rose-300">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-rose-400">Verification Failed</span>
                        <span className="text-text-muted">{verificationError || "Account not found or unavailable for transfers."}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyRecipient}
                      className="text-[11px] py-1 px-2.5 h-auto shrink-0 border-rose-500/30 hover:bg-rose-500/20 text-rose-400"
                    >
                      Verify Again
                    </Button>
                  </div>
                )}

                {verificationStatus === "verified" && verifiedRecipient && (
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/25 shadow-sm space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Account Verified
                        </span>
                        <Badge variant="ACTIVE">ELIGIBLE</Badge>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted uppercase">
                        {verifiedRecipient.currency || "USD"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          Verified Account Holder
                        </div>
                        <div className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                          <span>{verifiedRecipient.accountHolderName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          Account Type & Number
                        </div>
                        <div className="text-xs font-mono font-bold text-text-secondary">
                          {verifiedRecipient.accountType} •••• {String(verifiedRecipient.accountNumber).slice(-4)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-text-muted pt-1 border-t border-border-subtle flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Recipient confirmed. You may now enter amount and proceed.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* C. Transfer Amount & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                3. Transfer Amount ($ USD)
              </label>
              {isInsufficientFunds && (
                <span className="text-xs font-bold text-rose-400 animate-pulse">
                  Insufficient Available Balance
                </span>
              )}
            </div>

            <Input
              placeholder="0.00"
              value={rawAmount}
              onChange={(e) => {
                setRawAmount(e.target.value);
                setFormError("");
              }}
              prefix={<DollarSign className="w-4 h-4 text-text-muted" />}
              error={isInsufficientFunds ? "Transfer amount exceeds available balance" : ""}
            />

            {/* Quick Amount Preset Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2.5">
              {[
                { label: "$25", cents: 2500 },
                { label: "$50", cents: 5000 },
                { label: "$100", cents: 10000 },
                { label: "$250", cents: 25000 }
              ].map((p) => (
                <button
                  key={p.cents}
                  type="button"
                  onClick={() => handleSetPresetAmount(p.cents)}
                  className="px-3 py-1.5 rounded-xl bg-elevated hover:bg-surface border border-border-subtle text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
                >
                  {p.label}
                </button>
              ))}

              <button
                type="button"
                onClick={handleSetMaxBalance}
                disabled={senderBalanceInCents <= 0}
                className="px-3 py-1.5 rounded-xl bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/25 text-xs font-bold text-brand-accent transition-colors disabled:opacity-40"
              >
                Max Balance ({formatCurrency(senderBalanceInCents)})
              </button>
            </div>
          </div>

          {/* D. Description / Memo */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              4. Transfer Description / Memo (Optional)
            </label>
            <Input
              placeholder="e.g. Consulting payment, rent, savings transfer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Security & Protection Footer Info */}
          <div className="p-4 rounded-2xl bg-sunken border border-border-subtle flex items-start gap-3">
            <Lock className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <div className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary block mb-0.5">
                Bank-Grade Transfer Protection
              </span>
              Transfers are processed with end-to-end encryption and duplicate payment protection for guaranteed delivery.
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={
                !parsedAmount.isValid ||
                parsedAmount.cents <= 0 ||
                isInsufficientFunds ||
                loadingAccounts ||
                (transferMode === "external" && verificationStatus !== "verified")
              }
              icon={SendHorizontal}
              iconPosition="right"
              className="w-full justify-center shadow-xl shadow-brand-accent/20"
            >
              {transferMode === "external" && verificationStatus !== "verified"
                ? "Verify Recipient to Proceed"
                : "Review & Authorize Transfer"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Two-Step Confirmation Review Modal with 4-Digit TPIN */}
      <TransferModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setModalError("");
        }}
        onConfirm={handleExecuteTransfer}
        isLoading={isSubmitting}
        transferData={transferData}
        userHasTpin={user?.hasTpin !== false}
        isTpinLocked={Boolean(user?.isTpinLocked)}
        tpinLockedUntil={user?.tpinLockedUntil}
        modalError={modalError}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceipt
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={latestReceipt}
        onMakeAnother={() => setReceiptModalOpen(false)}
      />
    </div>
  );
}
