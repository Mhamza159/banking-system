import React from "react";

/**
 * Reusable Card Primitive
 * Glassmorphic surface container with customizable padding, elevation, and hover interactions.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Card({
  children,
  variant = "default",
  interactive = false,
  className = "",
  onClick,
  ...props
}) {
  const variantStyles = {
    default: "glass-panel rounded-2xl p-6",
    elevated: "glass-panel-elevated rounded-2xl p-6 shadow-2xl",
    subtle: "bg-sunken border border-border-subtle rounded-2xl p-6"
  };

  const interactiveStyles = interactive
    ? "cursor-pointer hover:border-border-default hover:shadow-2xl hover:scale-[1.01] transition-all duration-200"
    : "";

  return (
    <div
      onClick={onClick}
      className={`
        ${variantStyles[variant] || variantStyles.default}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
