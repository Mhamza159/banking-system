import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/layout/Footer";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import MoneyDisplay from "../components/common/MoneyDisplay";
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  RefreshCw,
  Layers,
  Database,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ExternalLink
} from "lucide-react";

/**
 * Flagship LandingPage Component
 * Showcases AuraBank's architectural integrity, live ticker, and seamless onboarding funnel.
 */
export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  // Simulated live FX rates
  const [rates, setRates] = useState([
    { pair: "EUR/USD", rate: 1.0842, change: "+0.12%" },
    { pair: "GBP/USD", rate: 1.2915, change: "+0.08%" },
    { pair: "USD/JPY", rate: 154.22, change: "-0.21%" },
    { pair: "USD/CAD", rate: 1.3540, change: "+0.04%" },
    { pair: "USD/CHF", rate: 0.8845, change: "-0.05%" }
  ]);

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 flex flex-col selection:bg-brand-accent/30 selection:text-brand-accent">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-brand-dark/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent/20 to-brand-indigo/20 border border-brand-accent/30 flex items-center justify-center shadow-lg shadow-brand-accent/10">
              <ShieldCheck className="w-5 h-5 text-brand-accent" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                AURA<span className="text-brand-accent">BANK</span>
              </span>
              <span className="block text-[9px] tracking-widest uppercase text-slate-400 font-semibold">
                Core Ledger Engine
              </span>
            </div>
          </Link>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              ACID Architecture
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <a href="#faucet" className="hover:text-white transition-colors">
              Sandbox Faucet
            </a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Open Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Live Rates Ticker Ribbon */}
      <div className="bg-slate-950/80 border-b border-white/5 py-2.5 overflow-x-auto text-xs font-mono scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 min-w-max">
          <div className="flex items-center gap-2 text-slate-400 font-sans text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
            Global Rates
          </div>
          <div className="flex items-center gap-8">
            {rates.map((r) => (
              <div key={r.pair} className="flex items-center gap-2">
                <span className="text-slate-400">{r.pair}:</span>
                <span className="text-white font-semibold">{r.rate}</span>
                <span
                  className={
                    r.change.startsWith("+")
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }
                >
                  {r.change}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent" />
            Atlas Replica Synced
          </div>
        </div>
      </div>

      <main className="flex-grow">
        {/* 3. Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-brand-accent/15 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-brand-indigo/15 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>v2.0 Full-Stack MERN Architecture</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                  Next-Gen Core Banking with{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-teal-300 to-indigo-400">
                    Cryptographic Ledger
                  </span>{" "}
                  Precision.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Engineered with strict double-entry ledger invariants, multi-document ACID isolation on MongoDB Atlas, UUID v4 network idempotency, and sub-50ms atomic settlements.
                </p>

                {/* Call to Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      icon={ArrowRight}
                      iconPosition="right"
                      className="shadow-xl shadow-brand-accent/20"
                    >
                      Open Free Account Now
                    </Button>
                  </Link>

                  <a href="#architecture" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" fullWidth icon={Layers}>
                      View Architecture
                    </Button>
                  </a>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">0.000</div>
                    <div className="text-xs text-slate-400 mt-0.5">Float Drift Invariant</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-brand-accent">&lt;50ms</div>
                    <div className="text-xs text-slate-400 mt-0.5">Atomic Settlement</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-brand-indigo">100%</div>
                    <div className="text-xs text-slate-400 mt-0.5">ACID Compliance</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Fintech Visual */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md w-full">
                  {/* Glowing Backing Frame */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-accent/30 to-brand-indigo/30 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                  {/* High-End Glassmorphic Titanium Card */}
                  <div className="relative rounded-3xl p-7 bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                          Total Portfolio Balance
                        </span>
                        <div className="mt-1">
                          <MoneyDisplay
                            cents={12485000}
                            size="xl"
                            className="text-white"
                          />
                        </div>
                      </div>
                      <Badge variant="ACTIVE">ACTIVE</Badge>
                    </div>

                    {/* Simulated Account Row */}
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5 space-y-3 mb-6">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Account Number:</span>
                        <span className="font-mono text-slate-200 font-semibold tracking-wider">
                          4092817263
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Account Type:</span>
                        <span className="font-semibold text-brand-accent">
                          PRIMARY SAVINGS
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Ledger Invariant:</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                        </span>
                      </div>
                    </div>

                    {/* Simulated Recent Atomic Transfer Notification */}
                    <div className="p-3.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Deposit from Sandbox Faucet
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: txn_94a28f10 • Settled
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold font-mono text-brand-accent">
                        +$500.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Architectural Pillars Section */}
        <section id="architecture" className="py-20 bg-slate-950/60 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs uppercase tracking-widest font-bold text-brand-accent">
                Core Architectural Guarantees
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Built for Financial Accuracy and Zero Compromise
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Traditional web applications calculate balances with floating-point math and loose updates. AuraBank executes institutional ledger safety.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <Card className="p-6 space-y-4 hover:border-brand-accent/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Multi-Document ACID
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Leverages MongoDB Atlas replica sets with multi-document sessions. If any step fails, changes roll back instantaneously.
                </p>
              </Card>

              {/* Pillar 2 */}
              <Card className="p-6 space-y-4 hover:border-brand-indigo/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 border border-brand-indigo/25 flex items-center justify-center text-brand-indigo">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Double-Entry Ledger
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Balances are not stored as mutable rows. Balances are derived dynamically from paired DEBIT and CREDIT entries with zero float drift.
                </p>
              </Card>

              {/* Pillar 3 */}
              <Card className="p-6 space-y-4 hover:border-teal-400/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  UUID v4 Idempotency
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every transfer requires a client-generated UUID key in the header. Network retries or double clicks never duplicate money transfers.
                </p>
              </Card>

              {/* Pillar 4 */}
              <Card className="p-6 space-y-4 hover:border-rose-400/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Session Blacklist
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Logging out revokes JWTs immediately by persisting tokens to a TTL-indexed MongoDB Blacklist collection.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. Interactive Sandbox Faucet Callout */}
        <section id="faucet" className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-brand-card via-slate-900 to-brand-card border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-accent/10 to-transparent pointer-events-none" />

              <div className="max-w-2xl space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin duration-3000" />
                  Instant Sandbox Simulation
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Experience Live Faucet Deposits & Real-Time Settlements
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Register in seconds to receive an auto-provisioned 10-digit savings account. Fund test balances using the built-in Sandbox Faucet ($10, $50, $100, $500) and execute atomic transfers with full transaction receipts.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link to="/register">
                    <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                      Start Testing Now
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="md">
                      Sign In to Existing Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer Component */}
      <Footer />
    </div>
  );
}
