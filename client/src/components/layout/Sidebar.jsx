import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  SendHorizontal,
  ReceiptText,
  UserCheck,
  LogOut,
  Sparkles
} from "lucide-react";

/**
 * Sidebar Component (Desktop Navigation)
 * Renders fixed navigation bar with brand insignia, active route pills, and user summary footer.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: "/accounts",
      label: "Accounts",
      icon: Wallet,
      badge: null
    },
    {
      to: "/transfer",
      label: "Transfer",
      icon: SendHorizontal,
      badge: "Instant"
    },
    {
      to: "/transactions",
      label: "Journal",
      icon: ReceiptText,
      badge: null
    },
    {
      to: "/profile",
      label: "Profile & Security",
      icon: UserCheck,
      badge: null
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      showToast("info", "You have signed out successfully.");
    } catch {
      showToast("error", "Logout failed.");
    }
  };

  // Helper for user initials avatar
  const getInitials = (name) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface border-r border-border-default z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-border-subtle">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center group-hover:border-brand-accent/60 transition-colors shadow-lg shadow-brand-accent/10">
            <ShieldCheck className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-1.5">
              AURA<span className="text-brand-accent">BANK</span>
            </span>
            <span className="block text-[9px] tracking-widest uppercase text-text-muted font-semibold">
              Institutional Banking
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/30 shadow-sm shadow-brand-accent/5"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated border border-transparent"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Summary Card & Logout Footer */}
      <div className="p-4 border-t border-border-default bg-sunken space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-elevated border border-border-subtle">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-accent/30 to-brand-indigo/30 border border-brand-accent/40 flex items-center justify-center font-bold text-xs text-white">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-text-primary truncate">
              {user?.name || "Customer"}
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {user?.email || "customer@aurabank.io"}
            </div>
          </div>
        </div>

        {/* Sign Out Trigger */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </aside>
  );
}
