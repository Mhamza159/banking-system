import React from "react";
import { User, KeyRound, Shield, Sliders } from "lucide-react";

/**
 * ProfileNavTabs Component
 * Accessible, responsive tab selector for the Profile & Security Cockpit.
 */
export default function ProfileNavTabs({
  activeTab,
  setActiveTab,
  hasTpin = false
}) {
  const tabs = [
    {
      id: "identity",
      label: "Profile & Identity",
      icon: User
    },
    {
      id: "password",
      label: "Credentials & Password",
      icon: KeyRound
    },
    {
      id: "tpin",
      label: "Transaction PIN (TPIN)",
      icon: Shield,
      badge: hasTpin ? (
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
          title="TPIN Configured"
        />
      ) : (
        <span
          className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
          title="TPIN Pending"
        />
      )
    },
    {
      id: "limits",
      label: "Velocity Limits & Risk",
      icon: Sliders
    }
  ];

  return (
    <div
      role="tablist"
      aria-label="Profile and Security Settings"
      className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border-default overflow-x-auto no-scrollbar"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              isActive
                ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/30 shadow-sm"
                : "text-text-muted hover:text-text-primary hover:bg-elevated"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && tab.badge}
          </button>
        );
      })}
    </div>
  );
}
