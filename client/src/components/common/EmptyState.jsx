import React from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

/**
 * Reusable EmptyState Primitive
 * Clean illustration, message, and call-to-action for zero-data views.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There is currently no activity or data to display in this view.",
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  className = ""
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 glass-panel rounded-2xl border border-dashed border-border-default ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-elevated border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-inner">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>

      <h3 className="text-base font-bold text-text-primary tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
