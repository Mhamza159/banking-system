import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBanking } from "../context/BankingContext";
import profileService from "../services/profileService";
import Button from "../components/common/Button";
import { formatCurrency, toCents } from "../utils/currency";
import { RefreshCw } from "lucide-react";

import ProfileNavTabs from "../components/profile/ProfileNavTabs";
import IdentityTab from "../components/profile/IdentityTab";
import PasswordTab from "../components/profile/PasswordTab";
import TpinTab from "../components/profile/TpinTab";
import LimitsTab from "../components/profile/LimitsTab";

/**
 * ProfilePage Component (Phase 22 Modular Redesign)
 * Executive Profile & Security Settings Cockpit:
 * 1. Profile & Identity (Legal name, KYC tier, email, linked accounts)
 * 2. Credentials & Password (In-session rotation & session revocation)
 * 3. Transaction PIN / TPIN (Setup, rotation, 15-min brute-force lockout)
 * 4. Velocity Limits & Risk (Live usage progress bars & system ceilings)
 */
export default function ProfilePage() {
  const { user: authUser, logout, refreshProfile } = useAuth();
  const { accounts } = useBanking();

  // Active navigation tab: "identity" | "password" | "tpin" | "limits"
  const [activeTab, setActiveTab] = useState("identity");

  // Profile data from backend /api/v1/profile
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab 1: Identity & Profile Form State
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFeedback, setNameFeedback] = useState(null);

  // Tab 2: Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Tab 3: TPIN Form State
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [tpinSaving, setTpinSaving] = useState(false);
  const [tpinFeedback, setTpinFeedback] = useState(null);

  // Tab 4: Limits Form State (represented in dollars for user input)
  const [transferDailyDollars, setTransferDailyDollars] = useState("");
  const [transferWeeklyDollars, setTransferWeeklyDollars] = useState("");
  const [transferYearlyDollars, setTransferYearlyDollars] = useState("");
  const [receivingDailyDollars, setReceivingDailyDollars] = useState("");
  const [receivingWeeklyDollars, setReceivingWeeklyDollars] = useState("");
  const [receivingYearlyDollars, setReceivingYearlyDollars] = useState("");
  const [limitsSaving, setLimitsSaving] = useState(false);
  const [limitsFeedback, setLimitsFeedback] = useState(null);

  // Fetch consolidated profile data
  const loadProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setNameInput(data.name || authUser?.name || "");

      // Populate dollar inputs for limits
      if (data.transferLimits) {
        setTransferDailyDollars((data.transferLimits.daily / 100).toFixed(0));
        setTransferWeeklyDollars((data.transferLimits.weekly / 100).toFixed(0));
        setTransferYearlyDollars((data.transferLimits.yearly / 100).toFixed(0));
      }
      if (data.receivingLimits) {
        setReceivingDailyDollars((data.receivingLimits.daily / 100).toFixed(0));
        setReceivingWeeklyDollars((data.receivingLimits.weekly / 100).toFixed(0));
        setReceivingYearlyDollars((data.receivingLimits.yearly / 100).toFixed(0));
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Avatar initials
  const initials = useMemo(() => {
    const name = profile?.name || authUser?.name || "Customer";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profile?.name, authUser?.name]);

  // Handle Tab 1: Save Legal Display Name
  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameFeedback(null);

    const trimmed = nameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      setNameFeedback({ type: "error", message: "Name must be between 2 and 100 characters" });
      return;
    }

    try {
      setNameSaving(true);
      const res = await profileService.updateProfile({ name: trimmed });
      setProfile((prev) => ({ ...prev, name: res.name }));
      await refreshProfile();
      setNameFeedback({ type: "success", message: "Legal display name updated successfully." });
    } catch (err) {
      setNameFeedback({ type: "error", message: err.message || "Failed to update profile name" });
    } finally {
      setNameSaving(false);
    }
  };

  // Handle Tab 2: Rotate Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: "error", message: "All password fields are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordFeedback({ type: "error", message: "New password must be different from current password." });
      return;
    }

    try {
      setPasswordSaving(true);
      await profileService.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ type: "success", message: "Account password changed successfully." });
    } catch (err) {
      setPasswordFeedback({ type: "error", message: err.message || "Failed to rotate password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Tab 3: Initial TPIN Setup
  const handleSetupTpin = async (e) => {
    e.preventDefault();
    setTpinFeedback(null);

    if (!setupPin || !setupConfirmPin) {
      setTpinFeedback({ type: "error", message: "4-digit PIN and confirmation are required." });
      return;
    }

    if (setupPin !== setupConfirmPin) {
      setTpinFeedback({ type: "error", message: "PINs do not match." });
      return;
    }

    if (!/^\d{4}$/.test(setupPin)) {
      setTpinFeedback({ type: "error", message: "Transaction PIN must be exactly 4 numeric digits." });
      return;
    }

    try {
      setTpinSaving(true);
      await profileService.setTpin({ tpin: setupPin, confirmTpin: setupConfirmPin });
      setSetupPin("");
      setSetupConfirmPin("");
      await loadProfile(true);
      setTpinFeedback({ type: "success", message: "4-digit Transaction PIN configured successfully." });
    } catch (err) {
      setTpinFeedback({ type: "error", message: err.message || "Failed to configure Transaction PIN." });
    } finally {
      setTpinSaving(false);
    }
  };

  // Handle Tab 3: Rotate TPIN
  const handleChangeTpin = async (e) => {
    e.preventDefault();
    setTpinFeedback(null);

    if (!currentPin || !newPin || !confirmNewPin) {
      setTpinFeedback({ type: "error", message: "Current PIN, new PIN, and confirmation are required." });
      return;
    }

    if (newPin !== confirmNewPin) {
      setTpinFeedback({ type: "error", message: "New PIN and confirmation do not match." });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setTpinFeedback({ type: "error", message: "New Transaction PIN must be exactly 4 numeric digits." });
      return;
    }

    if (currentPin === newPin) {
      setTpinFeedback({ type: "error", message: "New PIN must be different from current PIN." });
      return;
    }

    try {
      setTpinSaving(true);
      await profileService.changeTpin({ currentTpin: currentPin, newTpin: newPin, confirmTpin: confirmNewPin });
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
      await loadProfile(true);
      setTpinFeedback({ type: "success", message: "Transaction PIN changed successfully." });
    } catch (err) {
      setTpinFeedback({ type: "error", message: err.message || "Failed to rotate Transaction PIN." });
    } finally {
      setTpinSaving(false);
    }
  };

  // Handle Tab 4: Save Velocity Limits
  const handleSaveLimits = async (e) => {
    e.preventDefault();
    setLimitsFeedback(null);

    const tDaily = toCents(transferDailyDollars);
    const tWeekly = toCents(transferWeeklyDollars);
    const tYearly = toCents(transferYearlyDollars);

    const rDaily = toCents(receivingDailyDollars);
    const rWeekly = toCents(receivingWeeklyDollars);
    const rYearly = toCents(receivingYearlyDollars);

    // Validate relational constraints
    if (tDaily > tWeekly) {
      setLimitsFeedback({ type: "error", message: "Daily transfer limit cannot exceed weekly transfer limit." });
      return;
    }
    if (tWeekly > tYearly) {
      setLimitsFeedback({ type: "error", message: "Weekly transfer limit cannot exceed yearly transfer limit." });
      return;
    }

    if (rDaily > rWeekly) {
      setLimitsFeedback({ type: "error", message: "Daily receiving limit cannot exceed weekly receiving limit." });
      return;
    }
    if (rWeekly > rYearly) {
      setLimitsFeedback({ type: "error", message: "Weekly receiving limit cannot exceed yearly receiving limit." });
      return;
    }

    // Validate against system ceilings ($500k daily, $2.5M weekly, $10M yearly)
    const maxDaily = profile?.systemCeilings?.TRANSFER?.MAX_DAILY || 50000000;
    const maxWeekly = profile?.systemCeilings?.TRANSFER?.MAX_WEEKLY || 250000000;
    const maxYearly = profile?.systemCeilings?.TRANSFER?.MAX_YEARLY || 1000000000;

    if (tDaily > maxDaily || rDaily > maxDaily) {
      setLimitsFeedback({ type: "error", message: `Daily limits cannot exceed system ceiling of ${formatCurrency(maxDaily)}.` });
      return;
    }
    if (tWeekly > maxWeekly || rWeekly > maxWeekly) {
      setLimitsFeedback({ type: "error", message: `Weekly limits cannot exceed system ceiling of ${formatCurrency(maxWeekly)}.` });
      return;
    }
    if (tYearly > maxYearly || rYearly > maxYearly) {
      setLimitsFeedback({ type: "error", message: `Yearly limits cannot exceed system ceiling of ${formatCurrency(maxYearly)}.` });
      return;
    }

    try {
      setLimitsSaving(true);
      await profileService.updateLimits({
        transferLimits: { daily: tDaily, weekly: tWeekly, yearly: tYearly },
        receivingLimits: { daily: rDaily, weekly: rWeekly, yearly: rYearly }
      });
      await loadProfile(true);
      setLimitsFeedback({ type: "success", message: "Velocity limits updated and enforced successfully." });
    } catch (err) {
      setLimitsFeedback({ type: "error", message: err.message || "Failed to update velocity limits." });
    } finally {
      setLimitsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Profile & Security Settings
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Manage your legal identity, in-session credentials, transaction authorization PIN, and velocity limits.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadProfile(true)}
          disabled={refreshing}
          icon={RefreshCw}
          className={refreshing ? "animate-spin" : ""}
        >
          {refreshing ? "Refreshing..." : "Refresh State"}
        </Button>
      </div>

      {/* 2. Modular Tab Navigation */}
      <ProfileNavTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasTpin={Boolean(profile?.hasTpin)}
      />

      {/* 3. Tab Panels */}
      {activeTab === "identity" && (
        <IdentityTab
          profile={profile}
          authUser={authUser}
          accounts={accounts}
          nameInput={nameInput}
          setNameInput={setNameInput}
          nameSaving={nameSaving}
          nameFeedback={nameFeedback}
          handleSaveName={handleSaveName}
          initials={initials}
        />
      )}

      {activeTab === "password" && (
        <PasswordTab
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordSaving={passwordSaving}
          passwordFeedback={passwordFeedback}
          handlePasswordChange={handlePasswordChange}
          logout={logout}
        />
      )}

      {activeTab === "tpin" && (
        <TpinTab
          profile={profile}
          setupPin={setupPin}
          setSetupPin={setSetupPin}
          setupConfirmPin={setupConfirmPin}
          setSetupConfirmPin={setSetupConfirmPin}
          currentPin={currentPin}
          setCurrentPin={setCurrentPin}
          newPin={newPin}
          setNewPin={setNewPin}
          confirmNewPin={confirmNewPin}
          setConfirmNewPin={setConfirmNewPin}
          tpinSaving={tpinSaving}
          tpinFeedback={tpinFeedback}
          handleSetupTpin={handleSetupTpin}
          handleChangeTpin={handleChangeTpin}
        />
      )}

      {activeTab === "limits" && (
        <LimitsTab
          profile={profile}
          transferDailyDollars={transferDailyDollars}
          setTransferDailyDollars={setTransferDailyDollars}
          transferWeeklyDollars={transferWeeklyDollars}
          setTransferWeeklyDollars={setTransferWeeklyDollars}
          transferYearlyDollars={transferYearlyDollars}
          setTransferYearlyDollars={setTransferYearlyDollars}
          receivingDailyDollars={receivingDailyDollars}
          setReceivingDailyDollars={setReceivingDailyDollars}
          receivingWeeklyDollars={receivingWeeklyDollars}
          setReceivingWeeklyDollars={setReceivingWeeklyDollars}
          receivingYearlyDollars={receivingYearlyDollars}
          setReceivingYearlyDollars={setReceivingYearlyDollars}
          limitsSaving={limitsSaving}
          limitsFeedback={limitsFeedback}
          handleSaveLimits={handleSaveLimits}
        />
      )}
    </div>
  );
}
