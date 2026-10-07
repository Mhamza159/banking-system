import React from "react";

/**
 * Reusable Skeleton Placeholder
 * Smooth shimmer animation for loading financial states and cards.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  count = 1
}) {
  const shapeStyles = {
    text: "h-4 rounded-md",
    circle: "rounded-full aspect-square",
    rect: "rounded-xl",
    card: "h-32 rounded-2xl"
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{ width, height }}
      className={`
        shimmer-bg bg-elevated
        ${shapeStyles[variant] || shapeStyles.text}
        ${className}
      `}
    />
  ));

  return count === 1 ? elements[0] : <div className="flex flex-col gap-2.5">{elements}</div>;
}
