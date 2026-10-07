import React from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import { KeyRound, Lock, Shield, LogOut, Check, X } from "lucide-react";

/**
 * PasswordTab Component
 * In-session password rotation and device session revocation.
 */
export default function PasswordTab({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordSaving,
  passwordFeedback,
  handlePasswordChange,
  logout
}) {
  return (
    <div
      role="tabpanel"
      id="panel-password"
      aria-labelledby="tab-password"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in"
    >
      {/* Left Column: Password Rotation Form */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 bg-surface border-border-default space-y-5">
          <div className="pb-4 border-b border-border-subtle">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-accent" />
              <span>In-Session Password Rotation</span>
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Change your account login password without terminating your current active banking session.
            </p>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <X className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              id="currentPasswordInput"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              icon={Lock}
              required
            />

            <Input
              label="New Password"
              id="newPasswordInput"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              icon={Lock}
              helperText="Choose a strong password with letters, numbers, and special symbols."
              required
            />

            <Input
              label="Confirm New Password"
              id="confirmPasswordInput"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              icon={Lock}
              required
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={passwordSaving}
                icon={KeyRound}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Right Column: Active Session Security */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 bg-surface border-border-default space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center text-brand-indigo shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Active Session Security</h3>
              <p className="text-xs text-text-muted">Instant Access Revocation</p>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Revoking your session will immediately sign you out from this device, invalidate active authorization tokens, and clear all secure browser session cookies.
          </p>

          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={logout}
            icon={LogOut}
          >
            Revoke Active Session
          </Button>
        </Card>
      </div>
    </div>
  );
}
