import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import { Compass, Home, ArrowLeft, ShieldAlert } from "lucide-react";

/**
 * NotFoundPage Component (T051)
 * Branded 404 error fallback view adhering to Obsidian FinTech design tokens.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg w-full text-center space-y-8 bg-surface p-8 sm:p-12 rounded-3xl border border-border-default shadow-xl backdrop-blur-xl">
        {/* Floating Icon */}
        <div className="w-16 h-16 rounded-3xl bg-sunken border border-border-subtle flex items-center justify-center text-brand-accent mx-auto shadow-inner">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        {/* 404 Heading & Subtext */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono font-bold tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            HTTP 404 • Page Not Found
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Coordinates Not Found
          </h1>

          <p className="text-xs sm:text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            The requested statement view, banking endpoint, or page coordinates do not exist or have been safely relocated.
          </p>
        </div>

        {/* Recovery Navigation Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={ArrowLeft}
            >
              Return to Dashboard
            </Button>
          </Link>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              fullWidth
              icon={Home}
            >
              Public Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
