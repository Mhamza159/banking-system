import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import Button from "../common/Button";
import MoneyDisplay from "../common/MoneyDisplay";
import {
  SendHorizontal,
  ArrowRight,
  ShieldCheck,
  Zap,
  ArrowDown,
  Lock,
  Wallet,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  AlertCircle
} from "lucide-react";

/**
 * TransferModal Component
 * Two-step confirmation review dialog summarizing source, destination,
 * $0.00 fee, net debit, remaining balance, and enforcing 4-digit cryptographic TPIN verification.
 */
export default function TransferModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transferData = null,
  userHasTpin = true,
  isTpinLocked = false,
  tpinLockedUntil = null,
  modalError = ""
}) {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef([]);

  // Reset PIN inputs when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", ""]);
      // Focus first input after modal transition
      const timer = setTimeout(() => {
        if (inputRefs.current[0] && userHasTpin && !isTpinLocked) {
          inputRefs.current[0]?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, userHasTpin, isTpinLocked]);

  // If a modalError arrives, clear digits and re-focus first input
  useEffect(() => {
    if (modalError) {
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }, [modalError]);

  if (!transferData) return null;

  const {
    senderAccount,
    senderBalanceInCents = 0,
    receiverLabel,
    receiverNumber,
    amountInCents = 0,
    description
  } = transferData;

  const currency = senderAccount?.currency || "USD";
  const remainingCents = Math.max(0, senderBalanceInCents - amountInCents);
  const tpin = digits.join("");
  const isPinComplete = tpin.length === 4;

  const handleDigitChange = (index, value) => {
    // Only accept numeric digits
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    const digit = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next box if not on last
    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim().replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newDigits = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 3);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isPinComplete || isLoading || !userHasTpin || isTpinLocked) return;
    onConfirm(tpin);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Authorize Transfer"
      description="Review transfer details and enter your 4-digit Transaction PIN to authorize."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Amount Display */}
        <div className="text-center p-6 rounded-2xl bg-surface border border-border-default space-y-2">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Total Transfer Amount
          </div>
          <div className="py-1">
            <MoneyDisplay
              cents={amountInCents}
              currency={currency}
              size="hero"
              className="drop-shadow-sm text-brand-accent"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Instant Free Transfer • $0.00 Network Fee</span>
          </div>
        </div>

        {/* Transfer Route Flow */}
        <div className="p-4 rounded-2xl bg-sunken border border-border-subtle space-y-3">
          {/* Source Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary">
                <Wallet className="w-4 h-4 text-brand-accent" />
              </div>
              <div>
                <div className="text-xs text-text-muted font-medium">Paying From</div>
                <div className="text-sm font-bold text-text-primary">
                  {senderAccount?.accountType || "Savings"} Account
                </div>
                <div className="text-[11px] font-mono text-text-muted">
                  •••• {String(senderAccount?.accountNumber || "").slice(-4)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-muted">Remaining Balance</div>
              <div className="text-xs font-mono font-bold text-text-secondary">
                <MoneyDisplay cents={remainingCents} currency={currency} size="sm" />
              </div>
            </div>
          </div>

          {/* Transfer Arrow */}
          <div className="flex items-center justify-center py-0.5">
            <div className="w-6 h-6 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-text-muted">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Destination Account */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary">
                <SendHorizontal className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs text-text-muted font-medium">Recipient</div>
                <div className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <span>{transferData.recipientName || receiverLabel}</span>
                  {transferData.recipientName && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold border border-emerald-500/20">
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-text-muted">
                  {receiverNumber}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-muted">Deposit Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-500">
                <MoneyDisplay
                  cents={amountInCents}
                  currency={currency}
                  size="sm"
                  type="credit"
                  showSign={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4-Digit TPIN Authorization Card */}
        <div className="p-4 rounded-2xl bg-elevated border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Transaction PIN (TPIN)
              </span>
            </div>
            {userHasTpin && !isTpinLocked && (
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? "Hide" : "Show"}</span>
              </button>
            )}
          </div>

          {!userHasTpin ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong className="font-semibold">TPIN Setup Required:</strong> You haven't set up your 4-digit Transaction PIN yet. Transfers require an active TPIN for security authorization.
                </div>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/profile");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-300 transition-colors"
                >
                  <span>Configure TPIN in Settings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isTpinLocked ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  <strong className="font-semibold">Security Lockout Active:</strong> 5 consecutive failed PIN attempts triggered a 15-minute anti-brute-force lockout. Outbound transfers are blocked until lockout expires.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                Enter your 4-digit security PIN to authorize and sign this transfer.
              </p>

              {/* 4 Pin Boxes */}
              <div className="flex items-center justify-center gap-3 py-1">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl bg-sunken border border-border-default text-text-primary focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25 focus:scale-105 focus:outline-none transition-all duration-150 disabled:opacity-50"
                  />
                ))}
              </div>

              {/* Error Callout */}
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-medium">{modalError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settlement Summary Details */}
        <div className="space-y-2 text-xs border-t border-border-subtle pt-4">
          <div className="flex justify-between text-text-muted">
            <span>Transfer Amount</span>
            <span className="font-mono text-text-primary">
              <MoneyDisplay cents={amountInCents} currency={currency} size="sm" />
            </span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Transfer Fee</span>
            <span className="font-mono text-emerald-500 font-bold">$0.00</span>
          </div>
          {description && (
            <div className="flex justify-between text-text-muted">
              <span>Description / Memo</span>
              <span className="font-medium text-text-primary italic max-w-[200px] truncate">
                "{description}"
              </span>
            </div>
          )}
          <div className="flex justify-between text-text-secondary font-bold pt-2 border-t border-border-subtle">
            <span>Net Debit to Account</span>
            <span className="font-mono text-rose-500">
              <MoneyDisplay
                cents={amountInCents}
                currency={currency}
                size="sm"
                type="debit"
                showSign={true}
              />
            </span>
          </div>
        </div>

        {/* Protection Notice */}
        <div className="p-3 rounded-xl bg-sunken border border-border-subtle flex items-start gap-2.5 text-xs text-text-muted">
          <Lock className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Transfers are protected with instant cryptographic verification and duplicate payment prevention.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || !userHasTpin || isTpinLocked || !isPinComplete}
            isLoading={isLoading}
            icon={SendHorizontal}
            className="shadow-lg shadow-brand-accent/20 disabled:opacity-40"
          >
            {isLoading ? "Authorizing Transfer..." : "Authorize & Send"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
