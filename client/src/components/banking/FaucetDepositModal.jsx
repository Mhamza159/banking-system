import React, { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";
import { useBanking } from "../../context/BankingContext";
import { useToast } from "../../context/ToastContext";
import { parseCents, formatCurrency } from "../../utils/currency";
import { ArrowDownToLine, Sparkles, DollarSign } from "lucide-react";

/**
 * FaucetDepositModal Component
 * Interactive sandbox deposit dialog supporting preset chips ($10, $50, $100, $500)
 * or custom dollar inputs for instant test funding.
 */
export default function FaucetDepositModal({ isOpen, onClose, targetAccount = null }) {
  const { activeAccount, depositToAccount, depositFaucet } = useBanking();
  const { showToast } = useToast();

  const effectiveAccount = targetAccount || activeAccount;

  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(10000); // Default $100.00 (10,000 cents)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const presets = [
    { label: "$10", cents: 1000 },
    { label: "$50", cents: 5000 },
    { label: "$100", cents: 10000 },
    { label: "$500", cents: 50000 }
  ];

  const handlePresetSelect = (cents) => {
    setSelectedPreset(cents);
    setCustomAmount("");
    setError("");
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    setSelectedPreset(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    let targetCents = selectedPreset;
    if (!targetCents) {
      const parsed = parseCents(customAmount);
      if (!parsed.isValid) {
        setError(parsed.error);
        return;
      }
      targetCents = parsed.cents;
    }

    if (!targetCents || targetCents <= 0) {
      setError("Please select or enter a valid deposit amount.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const targetId = effectiveAccount?._id || effectiveAccount?.id;
      if (depositToAccount) {
        await depositToAccount(targetId, targetCents);
      } else {
        await depositFaucet(targetCents);
      }
      showToast(
        "success",
        `Successfully deposited ${formatCurrency(targetCents)} into ${effectiveAccount?.accountType || "Savings"} account!`
      );
      onClose();
    } catch (err) {
      setError(err.message || "Deposit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fund Test Account"
      description={`Inject instant sandbox balance into ${effectiveAccount?.accountType || "Account"} (${effectiveAccount?.accountNumber || ""})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Preset Amount Chips */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Quick Amount Presets
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {presets.map((p) => {
              const isSelected = selectedPreset === p.cents;
              return (
                <button
                  key={p.cents}
                  type="button"
                  onClick={() => handlePresetSelect(p.cents)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    isSelected
                      ? "bg-brand-accent text-brand-dark border-brand-accent shadow-md shadow-brand-accent/20 scale-[1.02]"
                      : "bg-sunken hover:bg-surface text-text-primary border-border-default"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Or Enter Custom Amount ($ USD)
          </label>
          <Input
            placeholder="0.00"
            value={customAmount}
            onChange={handleCustomChange}
            prefix={<DollarSign className="w-4 h-4 text-text-muted" />}
            error={error}
          />
        </div>

        {/* Ledger Simulation Notice */}
        <div className="p-3.5 rounded-2xl bg-elevated border border-border-default flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            This records an immutable <strong className="text-emerald-400">CREDIT</strong> entry in the double-entry journal. Live balance aggregation will instantly reflect this change.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={loading}
            icon={ArrowDownToLine}
          >
            Confirm Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
