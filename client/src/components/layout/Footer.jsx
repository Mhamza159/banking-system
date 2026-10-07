import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight, Github, Lock, CheckCircle2 } from "lucide-react";

/**
 * Public Footer Component
 * Fintech-grade footer with compliance disclaimers, links, and operational status.
 */
export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border-default text-text-muted text-sm">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-1.5">
                AURA<span className="text-brand-accent">BANK</span>
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Next-generation MERN banking engine engineered with double-entry cryptographic ledger invariants, multi-document ACID transactions, and zero float drift.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Ledger Engine Operational
              </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Core Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register" className="hover:text-text-primary transition-colors">
                  Instant Savings Account
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-text-primary transition-colors">
                  Secondary Checking
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-text-primary transition-colors">
                  Multi-Currency Ledger
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-text-primary transition-colors">
                  Sandbox Faucet Deposit
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1 hover:text-text-primary transition-colors">
                <span>Multi-Document ACID</span>
              </li>
              <li className="flex items-center gap-1 hover:text-text-primary transition-colors">
                <span>Double-Entry Ledger</span>
              </li>
              <li className="flex items-center gap-1 hover:text-text-primary transition-colors">
                <span>UUID v4 Idempotency</span>
              </li>
              <li className="flex items-center gap-1 hover:text-text-primary transition-colors">
                <span>MongoDB Atlas Replicas</span>
              </li>
            </ul>
          </div>

          {/* Security & Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Security
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-text-secondary">
                <Lock className="w-3.5 h-3.5 text-brand-accent" />
                <span>256-Bit TLS In-Transit</span>
              </li>
              <li className="flex items-center gap-1.5 text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Float Drift Invariant</span>
              </li>
              <li className="flex items-center gap-1.5 text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Token Revocation Blacklist</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal & Disclaimers Bar */}
      <div className="border-t border-border-subtle bg-sunken">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-text-muted text-center sm:text-left">
            © {new Date().getFullYear()} AuraBank Systems Inc. All rights reserved. Full-stack MERN banking demonstration.
          </p>
          <div className="flex items-center gap-6 text-text-muted">
            <span className="hover:text-text-primary transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-text-primary transition-colors cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:text-text-primary transition-colors cursor-pointer">
              API Documentation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
