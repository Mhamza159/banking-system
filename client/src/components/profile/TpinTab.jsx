import React from "react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Input from "../common/Input";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  X
} from "lucide-react";

/**
 * TpinTab Component
 * 4-digit Transaction Authorization PIN management, brute-force lockout banner,
 * and security policy explanation.
 */
export default function TpinTab({
  profile,
  setupPin,
  setSetupPin,
  setupConfirmPin,
  setSetupConfirmPin,
  currentPin,
  setCurrentPin,
  newPin,
  setNewPin,
  confirmNewPin,
  setConfirmNewPin,
  tpinSaving,
  tpinFeedback,
  handleSetupTpin,
  handleChangeTpin
}) {
  return (
    <div
      role="tabpanel"
      id="panel-tpin"
      aria-labelledby="tab-tpin"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in"
    >
      <div className="lg:col-span-7 space-y-6">
        {/* TPIN Lockout Alert Banner */}
        {profile?.isTpinLocked && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3.5 text-rose-300 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">
                Transaction PIN Temporarily Locked
              </h4>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Your 4-digit PIN has been temporarily locked due to 5 consecutive failed verification attempts.
                Outbound transfers and PIN changes are blocked until the lockout duration expires.
              </p>
              {profile?.tpinLockedUntil && (
                <div className="text-[11px] font-mono text-rose-400 font-semibold pt-1">
                  Lockout expires at: {new Date(profile.tpinLockedUntil).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TPIN Management Card */}
        <Card className="p-6 bg-surface border-border-default space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-accent" />
                <span>4-Digit Transaction PIN (TPIN)</span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Personal security PIN required to authorize outbound payments and protect your funds.
              </p>
            </div>
            <Badge variant={profile?.hasTpin ? "ACTIVE" : "PENDING"} size="sm">
              {profile?.hasTpin ? "TPIN CONFIGURED" : "NOT CONFIGURED"}
            </Badge>
          </div>

          {tpinFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                tpinFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {tpinFeedback.type === "success" ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <X className="w-4 h-4 shrink-0" />
              )}
              <span>{tpinFeedback.message}</span>
            </div>
          )}

          {/* View 1: Initial Setup Form (When user has NO TPIN) */}
          {!profile?.hasTpin && (
            <form onSubmit={handleSetupTpin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                You have not configured a Transaction PIN yet. Please create a 4-digit numeric PIN to enable outbound transfers.
              </div>

              <Input
                label="Create 4-Digit PIN"
                id="setupPinInput"
                type="password"
                maxLength={4}
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                helperText="4 numeric digits only (0–9)"
                required
              />

              <Input
                label="Confirm 4-Digit PIN"
                id="setupConfirmPinInput"
                type="password"
                maxLength={4}
                value={setupConfirmPin}
                onChange={(e) => setSetupConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                required
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={tpinSaving}
                  icon={Shield}
                >
                  Configure Transaction PIN
                </Button>
              </div>
            </form>
          )}

          {/* View 2: Rotate TPIN Form (When user HAS active TPIN) */}
          {profile?.hasTpin && (
            <form onSubmit={handleChangeTpin} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your 4-digit PIN is active and protecting all transactions.</span>
                </div>
              </div>

              <Input
                label="Current 4-Digit PIN"
                id="currentPinInput"
                type="password"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                disabled={profile?.isTpinLocked}
                required
              />

              <Input
                label="New 4-Digit PIN"
                id="newPinInput"
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                disabled={profile?.isTpinLocked}
                helperText="Must be different from your current PIN"
                required
              />

              <Input
                label="Confirm New 4-Digit PIN"
                id="confirmNewPinInput"
                type="password"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                disabled={profile?.isTpinLocked}
                required
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={profile?.isTpinLocked}
                  loading={tpinSaving}
                  icon={RefreshCw}
                >
                  Change Transaction PIN
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Right Column: Brute-Force Lockout Defense */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 bg-surface border-border-default space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-text-primary">Bank-Grade Protection</h4>
          </div>

          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <p>
              To protect your accounts against unauthorized access and brute-force attempts, our security engine enforces strict anti-tamper controls:
            </p>
            <ul className="space-y-2 list-disc list-inside text-text-muted text-[11px]">
              <li>Stored using irreversible bank-grade salted hash encryption.</li>
              <li>Maximum 5 consecutive failed verification attempts permitted.</li>
              <li>5th failure automatically locks PIN operations for 15 minutes.</li>
              <li>Zero funds or balances are deducted during failed attempts.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
