import React, { useEffect } from "react";
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
  X
} from "lucide-react";

/**
 * MobileNav Component (Off-Canvas Drawer)
 * Responsive slide-over drawer for viewports < 1024px.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function MobileNav({ isOpen, onClose }) {
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
      label: "Accounts & Wallets",
      icon: Wallet,
      badge: null
    },
    {
      to: "/transfer",
      label: "Instant Transfer",
      icon: SendHorizontal,
      badge: "Instant"
    },
    {
      to: "/transactions",
      label: "Transaction Journal",
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

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      showToast("info", "You have signed out successfully.");
    } catch {
      showToast("error", "Logout failed.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-canvas/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Panel */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-surface border-r border-border-default shadow-2xl flex flex-col justify-between p-6 z-50 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center shadow-lg shadow-brand-accent/10">
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
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated border border-border-subtle transition-colors focus:outline-none"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="py-6 space-y-1.5">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Menu Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/30 font-bold"
                        : "text-text-muted hover:text-text-primary hover:bg-elevated"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
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
        </div>

        {/* User Card & Logout Footer */}
        <div className="pt-6 border-t border-border-default space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border-subtle">
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

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
