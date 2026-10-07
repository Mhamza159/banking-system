import React from "react";
import { formatCentsParts } from "../../utils/currency";

/**
 * Reusable MoneyDisplay Primitive
 * High-precision FinTech typography displaying bold whole figures with visually subordinated cents.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function MoneyDisplay({
  cents = 0,
  currency = "USD",
  size = "md",
  type = "default", // 'default' | 'credit' | 'debit'
  showSign = false,
  className = ""
}) {
  const parts = formatCentsParts(Math.abs(cents), currency);

  const sizeStyles = {
    sm: {
      symbol: "text-xs font-semibold mr-0.5",
      whole: "text-sm font-bold tabular-nums tracking-tight",
      decimal: "text-xs font-semibold"
    },
    md: {
      symbol: "text-sm font-semibold mr-0.5",
      whole: "text-xl font-bold tabular-nums tracking-tight",
      decimal: "text-sm font-semibold"
    },
    lg: {
      symbol: "text-lg font-semibold mr-1",
      whole: "text-3xl font-extrabold tabular-nums tracking-tight",
      decimal: "text-lg font-semibold"
    },
    hero: {
      symbol: "text-2xl sm:text-3xl font-bold mr-1 text-text-secondary",
      whole: "text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tighter",
      decimal: "text-xl sm:text-2xl font-bold text-text-muted"
    }
  };

  const style = sizeStyles[size] || sizeStyles.md;

  let colorClass = "text-text-primary";
  let signText = "";

  if (type === "credit") {
    colorClass = "text-state-success";
    if (showSign) signText = "+";
  } else if (type === "debit") {
    colorClass = "text-state-error";
    if (showSign) signText = "-";
  }

  return (
    <span className={`inline-flex items-baseline font-mono select-all ${colorClass} ${className}`}>
      {signText && <span className="mr-0.5 font-bold">{signText}</span>}
      <span className={style.symbol}>{parts.symbol}</span>
      <span className={style.whole}>{parts.whole}</span>
      <span className={style.decimal}>.{parts.decimal}</span>
    </span>
  );
}
