import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type, message, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { id, type, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ showToast, dismissToast, toasts }),
    [showToast, dismissToast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "bg-surface border-emerald-500/40 text-text-primary shadow-emerald-500/5"
                : toast.type === "error"
                ? "bg-surface border-rose-500/40 text-text-primary shadow-rose-500/5"
                : toast.type === "warning"
                ? "bg-surface border-amber-500/40 text-text-primary shadow-amber-500/5"
                : "bg-surface border-brand-accent/40 text-text-primary shadow-brand-accent/5"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              {toast.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              {toast.type === "info" && <Info className="w-5 h-5 text-brand-accent" />}
            </div>

            <div className="flex-1 text-sm leading-snug font-medium">
              {toast.message}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-lg hover:bg-elevated"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
