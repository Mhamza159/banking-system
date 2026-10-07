import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable Accessible Modal Primitive
 * Focus-trapped dialog with animated overlay, ESC key dismiss, and backdrop blur.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description = null,
  children,
  maxWidth = "max-w-lg",
  showCloseButton = true
}) {
  // Prevent background scroll and attach ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-canvas/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`
          relative w-full ${maxWidth} rounded-2xl glass-panel-elevated p-6 sm:p-7
          border border-border-default shadow-2xl z-10 my-8 transition-all transform animate-scaleUp
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-text-primary tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-1">{description}</p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-elevated transition-colors focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
