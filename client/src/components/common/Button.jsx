import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Reusable Button Primitive
 * FinTech grade variants with tactile micro-interactions and integrated loading state.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 select-none";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3.5 gap-2.5"
  };

  const variantStyles = {
    primary:
      "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 focus:ring-emerald-400 border border-emerald-400/30",
    indigo:
      "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 focus:ring-indigo-400 border border-indigo-500/30",
    secondary:
      "bg-surface hover:bg-elevated text-text-primary border border-border-default focus:ring-brand-primary backdrop-blur-md",
    outline:
      "bg-transparent hover:bg-elevated text-text-secondary hover:text-text-primary border border-border-default hover:border-border-strong focus:ring-brand-primary",
    ghost:
      "bg-transparent hover:bg-elevated text-text-secondary hover:text-text-primary focus:ring-brand-primary",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-600/20 focus:ring-rose-400 border border-rose-500/30"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
}
