import React from "react";

/**
 * Reusable Badge Primitive
 * Formally colors banking statuses with glowing pill styling.
 */
export default function Badge({
  children,
  status = "ACTIVE",
  size = "md",
  showDot = true,
  className = ""
}) {
  const normalizedStatus = (status || "").toUpperCase();

  const statusConfigs = {
    ACTIVE: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400"
    },
    COMPLETED: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400"
    },
    PENDING: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      dot: "bg-amber-400 animate-pulse"
    },
    FAILED: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      text: "text-rose-400",
      dot: "bg-rose-400"
    },
    FROZEN: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
      dot: "bg-blue-400"
    },
    SUSPENDED: {
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
      dot: "bg-orange-400"
    },
    INACTIVE: {
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      text: "text-slate-400",
      dot: "bg-slate-400"
    }
  };

  const config = statusConfigs[normalizedStatus] || statusConfigs.INACTIVE;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2"
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border tracking-wide uppercase
        ${config.bg} ${config.border} ${config.text}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      )}
      <span>{children || normalizedStatus}</span>
    </span>
  );
}
