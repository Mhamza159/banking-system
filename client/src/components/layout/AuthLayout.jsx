import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Activity, Sparkles, ArrowLeft } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle";

/**
 * Split-Screen AuthLayout
 * Features a form container alongside a rich fintech visual brand panel.
 */
export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col lg:flex-row">
      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 z-10">
        <div>
          {/* Top Bar / Brand Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center group-hover:border-brand-accent/60 transition-colors shadow-md shadow-brand-accent/10">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-1.5">
                  AURA<span className="text-brand-accent">BANK</span>
                </span>
                <span className="block text-[10px] tracking-widest uppercase text-text-muted font-semibold">
                  Core Banking System
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/"
                className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-elevated border border-transparent hover:border-border-default"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="max-w-md w-full mx-auto mt-12 sm:mt-16">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>

        {/* Form Footer Notice */}
        <div className="mt-12 text-center text-xs text-text-muted">
          Protected by 256-bit TLS encryption and bank-grade security protocols.
        </div>
      </div>

      {/* Visual Graphic Panel (Desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-slate-900 via-brand-dark to-slate-950 border-l border-white/5 items-center justify-center p-12 overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-indigo/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full space-y-8 z-10">
          {/* Mock Titanium Metal Card */}
          <div className="relative rounded-3xl p-7 bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 border border-white/10 shadow-2xl backdrop-blur-xl group hover:border-brand-accent/40 transition-all duration-500">
            {/* Card Shimmer Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-tr-3xl pointer-events-none" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Total Active Balance
                </span>
                <div className="text-3xl font-bold font-mono tracking-tight text-white mt-1">
                  $124,850.<span className="text-slate-400 text-2xl">00</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                ACID Verified
              </div>
            </div>

            {/* Chip & NFC Graphic */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 p-1 flex flex-col justify-between shadow-inner">
                <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
              </div>
              <div className="w-5 h-5 rounded-full border border-slate-600/60 flex items-center justify-center">
                <div className="w-2.5 h-2.5 border-r border-t border-slate-400 rounded-full rotate-45" />
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm font-mono tracking-widest text-slate-300">
                  •••• •••• •••• 4092
                </div>
                <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Alexander Wright
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Account Type
                </div>
                <div className="text-xs font-bold text-brand-accent tracking-wider">
                  PRIMARY SAVINGS
                </div>
              </div>
            </div>
          </div>

          {/* Security Badges Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
              <Lock className="w-5 h-5 text-brand-accent mb-2" />
              <div className="text-xs font-semibold text-white">256-Bit TLS</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Bank-grade encryption
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
              <Activity className="w-5 h-5 text-brand-indigo mb-2" />
              <div className="text-xs font-semibold text-white">Double-Entry</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Zero float drift
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-white">Idempotent</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Zero replay risk
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/15 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "AuraBank combines instant sub-50ms atomic settlement with cryptographic verification across every ledger debit and credit."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
