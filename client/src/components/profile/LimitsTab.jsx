import React from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import { formatCurrency } from "../../utils/currency";
import {
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  Save,
  Check,
  X
} from "lucide-react";

/**
 * LimitsTab Component
 * Outbound and inbound velocity limits controls, live usage progress bars,
 * and regulatory system ceilings compliance.
 */
export default function LimitsTab({
  profile,
  transferDailyDollars,
  setTransferDailyDollars,
  transferWeeklyDollars,
  setTransferWeeklyDollars,
  transferYearlyDollars,
  setTransferYearlyDollars,
  receivingDailyDollars,
  setReceivingDailyDollars,
  receivingWeeklyDollars,
  setReceivingWeeklyDollars,
  receivingYearlyDollars,
  setReceivingYearlyDollars,
  limitsSaving,
  limitsFeedback,
  handleSaveLimits
}) {
  // Helper for rendering high-contrast usage progress bars
  const renderProgressBar = (usedCents, limitCents, label) => {
    const used = usedCents || 0;
    const limit = limitCents || 1;
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const remaining = Math.max(0, limit - used);

    let color = "bg-emerald-500";
    if (pct >= 90) color = "bg-rose-500";
    else if (pct >= 70) color = "bg-amber-500";

    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-text-primary font-medium">
          <span>{label}</span>
          <span className="font-mono text-text-muted">
            {formatCurrency(used)} / {formatCurrency(limit)} ({pct}%)
          </span>
        </div>
        <div className="w-full bg-sunken rounded-full h-2 overflow-hidden border border-border-subtle">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[11px] text-text-muted text-right">
          Remaining: <span className="font-mono text-text-primary">{formatCurrency(remaining)}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      role="tabpanel"
      id="panel-limits"
      aria-labelledby="tab-limits"
      className="space-y-6 animate-fade-in"
    >
      {/* Institutional System Ceilings Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3.5 text-indigo-300 text-xs">
        <Sliders className="w-5 h-5 text-brand-indigo shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-text-primary">Institutional System Ceilings</h4>
          <p className="text-text-muted text-[11px] leading-relaxed">
            Custom velocity limits cannot exceed the bank regulatory risk ceiling:
            <strong className="text-text-secondary ml-1">Daily Max: $500,000.00</strong> ·
            <strong className="text-text-secondary ml-1">Weekly Max: $2,500,000.00</strong> ·
            <strong className="text-text-secondary ml-1">Yearly Max: $10,000,000.00</strong>.
            Limits must satisfy the invariant: <code className="text-brand-accent font-semibold">Daily ≤ Weekly ≤ Yearly</code>.
          </p>
        </div>
      </div>

      {limitsFeedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            limitsFeedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {limitsFeedback.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <X className="w-4 h-4 shrink-0" />
          )}
          <span>{limitsFeedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveLimits} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Outbound Transfer Limits */}
          <Card className="p-6 bg-surface border-border-default space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
              <ArrowUpRight className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">Outbound Transfer Limits</h3>
                <p className="text-xs text-text-muted">Spending limits per period</p>
              </div>
            </div>

            {/* Daily Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.transfer?.daily,
                profile?.transferLimits?.daily,
                "Daily Spending (00:00 UTC - Now)"
              )}
              <Input
                label="Configured Daily Limit ($)"
                type="number"
                min="1"
                value={transferDailyDollars}
                onChange={(e) => setTransferDailyDollars(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>

            {/* Weekly Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.transfer?.weekly,
                profile?.transferLimits?.weekly,
                "Weekly Spending (Mon UTC - Now)"
              )}
              <Input
                label="Configured Weekly Limit ($)"
                type="number"
                min="1"
                value={transferWeeklyDollars}
                onChange={(e) => setTransferWeeklyDollars(e.target.value)}
                placeholder="e.g. 25000"
                required
              />
            </div>

            {/* Yearly Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.transfer?.yearly,
                profile?.transferLimits?.yearly,
                "Yearly Spending (Jan 1 UTC - Now)"
              )}
              <Input
                label="Configured Yearly Limit ($)"
                type="number"
                min="1"
                value={transferYearlyDollars}
                onChange={(e) => setTransferYearlyDollars(e.target.value)}
                placeholder="e.g. 100000"
                required
              />
            </div>
          </Card>

          {/* Card 2: Inbound Receiving Limits */}
          <Card className="p-6 bg-surface border-border-default space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">Inbound Receiving Limits</h3>
                <p className="text-xs text-text-muted">Receiving volume protection</p>
              </div>
            </div>

            {/* Daily Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.receiving?.daily,
                profile?.receivingLimits?.daily,
                "Daily Inflow (00:00 UTC - Now)"
              )}
              <Input
                label="Configured Daily Receiving ($)"
                type="number"
                min="1"
                value={receivingDailyDollars}
                onChange={(e) => setReceivingDailyDollars(e.target.value)}
                placeholder="e.g. 10000"
                required
              />
            </div>

            {/* Weekly Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.receiving?.weekly,
                profile?.receivingLimits?.weekly,
                "Weekly Inflow (Mon UTC - Now)"
              )}
              <Input
                label="Configured Weekly Receiving ($)"
                type="number"
                min="1"
                value={receivingWeeklyDollars}
                onChange={(e) => setReceivingWeeklyDollars(e.target.value)}
                placeholder="e.g. 50000"
                required
              />
            </div>

            {/* Yearly Progress & Input */}
            <div className="space-y-3 p-4 rounded-xl bg-sunken border border-border-subtle">
              {renderProgressBar(
                profile?.usage?.receiving?.yearly,
                profile?.receivingLimits?.yearly,
                "Yearly Inflow (Jan 1 UTC - Now)"
              )}
              <Input
                label="Configured Yearly Receiving ($)"
                type="number"
                min="1"
                value={receivingYearlyDollars}
                onChange={(e) => setReceivingYearlyDollars(e.target.value)}
                placeholder="e.g. 200000"
                required
              />
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={limitsSaving}
            icon={Save}
          >
            Save Velocity Limits
          </Button>
        </div>
      </form>
    </div>
  );
}
