import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBanking } from "../../context/BankingContext";
import { useToast } from "../../context/ToastContext";
import ThemeToggle from "../common/ThemeToggle";
import {
  Menu,
  Bell,
  CheckCircle2,
  User,
  Shield,
  LogOut,
  ChevronDown,
  Wallet,
  Check
} from "lucide-react";

/**
 * Header Component (Top Navigation Bar)
 * Provides context titles, mobile menu toggle, active account switcher,
 * system status, theme toggle, notification drawer, and user menu.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { accounts, activeAccount, setActiveAccountId } = useBanking();
  const { showToast } = useToast();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const accountMenuRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map route to contextual title
  const getRouteTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Executive Cockpit";
      case "/accounts":
        return "Accounts & Wallets";
      case "/transfer":
        return "Instant Money Transfer";
      case "/transactions":
        return "Transaction Journal";
      case "/profile":
        return "Profile & Security";
      default:
        return "Banking Portal";
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

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
      showToast("info", "Logged out successfully.");
      navigate("/login");
    } catch {
      showToast("error", "Logout failed.");
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border-default bg-canvas/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors duration-200">
      {/* Left Context: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated border border-border-subtle transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted hidden sm:inline">
            AuraBank /
          </span>
          <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
            {getRouteTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls: Account Switcher, Ledger Status, Theme Toggle, Notifications, User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Active Account Switcher (md+) */}
        {activeAccount && (
          <div className="relative hidden md:block" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface hover:bg-elevated border border-border-default text-xs transition-colors focus:outline-none"
            >
              <Wallet className="w-3.5 h-3.5 text-brand-accent" />
              <span className="font-bold text-text-primary uppercase tracking-wider">
                {activeAccount.accountType}
              </span>
              <span className="text-text-muted font-mono text-[11px]">
                ••••{String(activeAccount.accountNumber).slice(-4)}
              </span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {/* Account Switcher Popover */}
            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-surface border border-border-default shadow-theme-lg backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Switch Active Account
                </div>
                {accounts.map((acc) => {
                  const id = acc._id || acc.id;
                  const isActive = id === (activeAccount?._id || activeAccount?.id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveAccountId(id);
                        setAccountMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                        isActive
                          ? "bg-brand-accent/15 text-brand-accent font-bold"
                          : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{acc.accountType}</div>
                        <div className="text-[11px] text-text-muted font-mono">
                          {acc.accountNumber}
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-brand-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live Ledger Status Badge (Desktop) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>Ledger Active</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Trigger */}
        <button
          type="button"
          onClick={() =>
            showToast("info", "You have no unread security notifications.")
          }
          className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated border border-border-subtle transition-colors focus:outline-none"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-accent ring-2 ring-canvas" />
        </button>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-elevated border border-border-default transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-accent/30 to-brand-indigo/30 border border-brand-accent/40 flex items-center justify-center font-bold text-xs text-white">
              {getInitials(user?.name)}
            </div>
            <span className="text-xs font-semibold hidden md:inline max-w-[120px] truncate">
              {user?.name || "Customer"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:inline" />
          </button>

          {/* Popover Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-border-default shadow-theme-lg backdrop-blur-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-border-subtle">
                <div className="text-xs font-bold text-text-primary truncate">
                  {user?.name}
                </div>
                <div className="text-[11px] text-text-muted truncate mt-0.5">
                  {user?.email}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-accent/10 border border-brand-accent/25 text-[10px] font-bold text-brand-accent uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  {user?.role || "CUSTOMER"}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
                >
                  <User className="w-4 h-4 text-text-muted" />
                  Customer Profile
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
                >
                  <Shield className="w-4 h-4 text-text-muted" />
                  Security & Keys
                </Link>
              </div>

              <div className="border-t border-border-subtle pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
