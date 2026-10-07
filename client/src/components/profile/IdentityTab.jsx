import React from "react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Input from "../common/Input";
import { formatDate } from "../../utils/date";
import {
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building2,
  Calendar,
  Save,
  Check,
  X
} from "lucide-react";

/**
 * IdentityTab Component
 * Legal display name management, KYC verification tier, and linked accounts portfolio.
 * Strictly eliminates raw database ID leaks.
 */
export default function IdentityTab({
  profile,
  authUser,
  accounts = [],
  nameInput,
  setNameInput,
  nameSaving,
  nameFeedback,
  handleSaveName,
  initials
}) {
  return (
    <div
      role="tabpanel"
      id="panel-identity"
      aria-labelledby="tab-identity"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in"
    >
      {/* Left Column: Legal Name Editor & Profile Identity */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 bg-surface border-border-default space-y-5">
          {/* Avatar and KYC Header */}
          <div className="flex items-center gap-4 pb-5 border-b border-border-subtle">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/30 border border-brand-accent/40 flex items-center justify-center text-brand-accent font-extrabold text-lg shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary truncate">
                  {profile?.name || authUser?.name || "Verified Customer"}
                </h2>
                <Badge variant="COMPLETED" size="sm">
                  VERIFIED KYC
                </Badge>
              </div>
              <p className="text-xs text-text-muted font-mono mt-0.5 truncate">
                {profile?.email || authUser?.email || "—"}
              </p>
            </div>
          </div>

          {nameFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                nameFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {nameFeedback.type === "success" ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <X className="w-4 h-4 shrink-0" />
              )}
              <span>{nameFeedback.message}</span>
            </div>
          )}

          {/* Edit Legal Name Form */}
          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              label="Legal Full Name"
              id="profileNameInput"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your legal full name"
              icon={User}
              helperText="Your legal display name will appear on official payment slips and transfer vouchers."
              required
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={nameSaving}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>

          {/* Read-only KYC Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-subtle text-xs">
            <div className="p-3.5 rounded-xl bg-sunken border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-text-muted font-medium">
                <Mail className="w-3.5 h-3.5 text-brand-accent" />
                <span>Verified Email (Read-Only)</span>
              </div>
              <div className="font-semibold text-text-primary truncate">
                {profile?.email || authUser?.email || "—"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sunken border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-text-muted font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Role & Tier</span>
              </div>
              <div className="font-semibold text-brand-accent uppercase">
                {profile?.role || authUser?.role || "CUSTOMER"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sunken border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-text-muted font-medium">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>Member Since</span>
              </div>
              <div className="font-semibold text-text-primary">
                {formatDate(profile?.createdAt || authUser?.createdAt || new Date())}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sunken border border-border-subtle space-y-1">
              <div className="flex items-center gap-1.5 text-text-muted font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>KYC Verification</span>
              </div>
              <div className="font-semibold text-emerald-400">
                Tier 2 · Fully Cleared
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Linked Accounts Portfolio (Zero Database ID Leaks) */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 bg-surface border-border-default space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-brand-accent" />
              <h3 className="text-sm font-bold text-text-primary">Linked Accounts Portfolio</h3>
            </div>
            <span className="text-xs text-text-muted">
              {accounts.length} Active
            </span>
          </div>

          <div className="divide-y divide-border-subtle">
            {accounts.map((acc, index) => {
              const id = acc._id || acc.id;
              const isSavings = acc.accountType === "SAVINGS";
              const isPrimary = index === 0;

              return (
                <div key={id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                        isSavings
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : "bg-indigo-500/10 border-indigo-500/25 text-indigo-400"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
                        <span>{acc.accountType}</span>
                        <span className="font-mono text-text-muted font-normal">
                          •••• {String(acc.accountNumber).slice(-4)}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase font-mono">{acc.currency || "USD"}</span>
                        <span>•</span>
                        <span>{isPrimary ? "Primary Account" : "Secondary Account"}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={acc.status || "ACTIVE"} size="sm">
                    {acc.status || "ACTIVE"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
