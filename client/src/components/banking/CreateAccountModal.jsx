import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Select from "../common/Select";
import { useBanking } from "../../context/BankingContext";
import { useToast } from "../../context/ToastContext";
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  Plus,
  AlertCircle,
  Sparkles
} from "lucide-react";

/**
 * CreateAccountModal Component
 * Dialog empowering customers to provision secondary Checking or Savings accounts.
 */
export default function CreateAccountModal({ isOpen, onClose }) {
  const { accounts, createAccount } = useBanking();
  const { showToast } = useToast();

  const [accountType, setAccountType] = useState("CHECKING");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencyOptions = [
    { value: "USD", label: "USD - United States Dollar ($)" },
    { value: "EUR", label: "EUR - Euro (€)" },
    { value: "PKR", label: "PKR - Pakistani Rupee (Rs)" },
    { value: "GBP", label: "GBP - British Pound (£)" }
  ];

  // Pre-validate if user already owns an account of this type
  const existingAccountOfType = accounts.find((a) => a.accountType === accountType);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (existingAccountOfType) {
      setError(
        `You already have an active ${accountType} account (${existingAccountOfType.accountNumber}). You cannot open multiple accounts of the same type.`
      );
      return;
    }

    setLoading(true);
    try {
      const created = await createAccount({ accountType, currency });
      showToast(
        "success",
        `New ${accountType} account (${created.accountNumber}) provisioned successfully!`
      );
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open New Bank Account"
      description="Provision a secondary account with dedicated 10-digit number and ledger tracking."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Alert Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Select Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setAccountType("CHECKING");
                setError("");
              }}
              className={`p-4 rounded-2xl text-left border transition-all ${
                accountType === "CHECKING"
                  ? "bg-brand-indigo/15 border-brand-indigo shadow-md shadow-brand-indigo/10"
                  : "bg-sunken border-border-default hover:bg-surface"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard
                  className={`w-5 h-5 ${
                    accountType === "CHECKING" ? "text-brand-indigo" : "text-text-muted"
                  }`}
                />
                {accounts.some((a) => a.accountType === "CHECKING") && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-elevated text-text-muted border border-border-subtle">
                    Owned
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-text-primary">Checking</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Everyday transactions & debits
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("SAVINGS");
                setError("");
              }}
              className={`p-4 rounded-2xl text-left border transition-all ${
                accountType === "SAVINGS"
                  ? "bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/10"
                  : "bg-sunken border-border-default hover:bg-surface"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck
                  className={`w-5 h-5 ${
                    accountType === "SAVINGS" ? "text-emerald-400" : "text-text-muted"
                  }`}
                />
                {accounts.some((a) => a.accountType === "SAVINGS") && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-elevated text-text-muted border border-border-subtle">
                    Owned
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-text-primary">Savings</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Interest & wealth accumulation
              </div>
            </button>
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Settlement Currency
          </label>
          <Select
            options={currencyOptions}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>

        {/* Architectural Guarantee Notice */}
        <div className="p-3.5 rounded-2xl bg-elevated border border-border-default flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Your new account will be auto-assigned a random 10-digit routing number and instantly integrated into the double-entry accounting ledger.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={loading}
            icon={Plus}
          >
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
